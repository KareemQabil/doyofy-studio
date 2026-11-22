/**
 * Seating (spec §16): tables with capacity; confirmed parties are assigned, moved or unassigned.
 * Every action works with buttons; drag and drop is an extra on pointer devices.
 * Warnings (over capacity, does not fit, unassigned, declined but seated) are shown, never auto-fixed.
 */
import { DietBadge } from '../guests/FoodReport';
import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import type { Event, InvitationParty } from '../../domain/types';
import { checkAssign, nextTableName, occupancy, seatingWarnings, totalCapacity, validateTable, type TableOccupancy } from '../../domain/seating';
import { countParties, searchParties, seatsFor } from '../../domain/parties';
import { people, plural, pluralOf, P } from '../../domain/format';
import { Badge, Banner, Button, ConfirmDialog, Dialog, EmptyState, ErrorState, Field, Icon, Input, Menu, PageHeader, Panel, ProgressBar, SearchInput, Stepper, PageLoader } from '../../ui';
import { useMutation, useServices } from '../../app/data';
import { can, canViewFood, OWNER_ONLY_NOTE } from '../../domain/roles';
import { ExportGuestsDialog } from '../guests/GuestToolsDialog';
import { useCopy } from '../../ui/copy';
import { Link } from '../../app/router';
import { paths } from '../../app/paths';
import { useToast } from '../../ui/primitives/Feedback';
import { errorMessage } from '../../services/errors';
import { useParties, useTables } from '../shared/queries';
import { HallMap, SeatDock, useLiftDrag } from './HallMap';
import { useLocation } from '../../app/router';
import { AutoSeatSheet, tableForms, type AutoSeatResult } from './AutoSeatSheet';

export function SeatingPage({ event }: { event: Event }) {
  const loc=useLocation();
  const { t, dialect } = useCopy();
  const services = useServices();
  const role = services.session.currentUser().role;
  // owner and coordinator seat (auto-seating and table order too); the file export stays with the owner (domain/roles)
  const showFood = canViewFood(role), manage = can(role, 'seating'), mayExport = can(role, 'guests.export');
  const [orderMode, setOrderMode] = useState(false);
  const [autoSeat, setAutoSeat] = useState(false);
  const [exportTable, setExportTable] = useState<string | null>(null);
  const [tableFocus,setTableFocus]=useState(loc.search.get('table')??'');
  const parties = useParties(event.id);
  const tables = useTables(event.id);
  const toast = useToast();
  const [q, setQ] = useState('');
  const [assigning, setAssigning] = useState<InvitationParty | null>(null);
  const [editing, setEditing] = useState<TableOccupancy | 'new' | null>(null);
  const [deleting, setDeleting] = useState<TableOccupancy | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const endDrag = () => { setDragId(null); setDragTarget(null); };
  const [override, setOverride] = useState<{ party: InvitationParty; table: TableOccupancy } | null>(null);
  // Signature: moving a family shows every table as a destination (tap), or lift-and-drag on touch
  const [moving, setMoving] = useState<InvitationParty | null>(null);
  const [dockHover, setDockHover] = useState<string | null>(null);
  useEffect(() => {
    if (!manage) { setAutoSeat(false); setOrderMode(false); setExportTable(null); setAssigning(null); setEditing(null); setDeleting(null); setMoving(null); setOverride(null); setDockHover(null); endDrag(); }
  }, [manage]);

  // every seat change can be put back from its toast: the party returns to the table it came from (or to the waiting list)
  const assign = useMutation(async (s, partyId: string, tableId: string | null) => {
    const from = all.find((p) => p.id === partyId)?.tableId ?? null;
    return { party: await s.seating.assign(partyId, tableId), from };
  }, {
    onSuccess: ({ party: p, from }) => toast({
      tone: 'success',
      text: p.tableId ? `تم توزيع ${p.primaryGuestName} على ${tables.data?.find((t) => t.id === p.tableId)?.name ?? 'الطاولة'}` : `تمت إزالة ${p.primaryGuestName} من الطاولة`,
      action: { label: t('undo'), run: () => {
        services.seating.assign(p.id, from).then(() => toast({ tone: 'neutral', text: from ? `أُعيد ${p.primaryGuestName} إلى ${tables.data?.find((x) => x.id === from)?.name ?? 'طاولته'}` : `أُعيد ${p.primaryGuestName} إلى قائمة الانتظار` }), (e) => toast({ tone: 'danger', text: errorMessage(e) }));
      } },
    }),
    onError: (e) => toast({ tone: 'danger', text: errorMessage(e) }),
  });
  const remove = useMutation((s, id: string) => s.seating.deleteTable(id), { onSuccess: () => { setDeleting(null); toast({ tone: 'neutral', text: 'تم حذف الطاولة ونُقل ضيوفها إلى «بلا طاولة»' }); } });

  const reorder = useMutation((s, ids: string[]) => s.seating.reorderTables(event.id, ids), {
    onSuccess: () => toast({ tone: 'success', text: 'حُفظ ترتيب الطاولات' }),
    onError: (e) => toast({ tone: 'danger', text: errorMessage(e) }),
  });
  const all = parties.data ?? [];
  const occ = useMemo(() => occupancy(tables.data ?? [], all), [tables.data, all]);
  const warn = useMemo(() => seatingWarnings(tables.data ?? [], all), [tables.data, all]);
  const c = countParties(all);
  const unassigned = searchParties(warn.unassigned, q).sort((a, b) => seatsFor(b) - seatsFor(a));
  const requestedParty = loc.search.get('party');
  useEffect(() => { const p = all.find((guest) => guest.id === requestedParty && guest.rsvpStatus === 'confirmed'); if (p && manage) setMoving(p); }, [requestedParty, parties.loading]);
  const match = q ? new Set(searchParties(all, q).map((p) => p.id)) : null;
  // the lifted family is dropped by the hall dock; the handler is refreshed below once tryAssign exists
  const dropTo = useRef<(id: string | null) => void>(() => {});
  const lift = useLiftDrag({ onLift: (p) => setMoving(p), onHover: setDockHover, onDrop: (id) => dropTo.current(id), onCancel: () => setMoving(null) });

  if (parties.error || tables.error) return <ErrorState error={parties.error || tables.error} onRetry={() => { parties.refetch(); tables.refetch(); }} />;
  if (parties.loading || tables.loading) return <PageLoader />;

  const tryAssign = (party: InvitationParty, t: TableOccupancy) => {
    if (!manage) return;
    const ok = checkAssign(party, t);
    if (!ok.ok && ok.reason === 'does_not_fit') { setOverride({ party, table: t }); return; }
    if (!ok.ok) { toast({ tone: 'warning', text: 'يمكن توزيع الدعوات المؤكدة فقط' }); return; }
    void assign.run(party.id, t.table.id);
    setAssigning(null);
    setMoving(null);
  };
  const onDrop = (t: TableOccupancy) => (e: DragEvent) => {
    e.preventDefault();
    const party = all.find((p) => p.id === (e.dataTransfer.getData('text/plain') || dragId));
    endDrag();
    if (manage && party && party.tableId !== t.table.id) tryAssign(party, t);
  };
  const startMove = (p: InvitationParty) => setMoving(p);
  dropTo.current = (id) => { const t = occ.find((o) => o.table.id === id); const p = moving; if (t && p && p.tableId !== t.table.id) tryAssign(p, t); else if (!t) setMoving(null); };
  const reorderTo = (source: string, target: string) => {
    if (!manage || reorder.pending || source === target) return;
    const ids = occ.map((o) => o.table.id), from = ids.indexOf(source), to = ids.indexOf(target);
    if (from < 0 || to < 0) return;
    ids.splice(from, 1); ids.splice(to, 0, source); void reorder.run(ids);
  };
  // the suggestion is applied in one write; the toast offers to put back exactly what it changed
  const autoApplied = ({ undo, seated, created }: AutoSeatResult) => {
    setAutoSeat(false);
    toast({ tone: 'success', text: `${t('autoSeatApplied')}: ${pluralOf(seated, P.invitation)}${created ? ` · +${plural(created, tableForms(dialect))}` : ''}`, action: { label: t('autoSeatUndo'), run: () => {
      services.seating.undoAutoSeating(event.id, undo).then(() => toast({ tone: 'neutral', text: t('autoSeatUndone') }), (e) => toast({ tone: 'danger', text: errorMessage(e) }));
    } } });
  };
  const cap = totalCapacity(tables.data ?? []);
  const focus=q||tableFocus==='all'?'all':occ.some(o=>o.table.id===tableFocus)?tableFocus:occ[0]?.table.id??'';
  const shown=focus!=='all'?occ.filter(o=>o.table.id===focus):occ;
  // over-capacity banner: bring that table's card into view so a family can be moved off it
  const showTable = (id: string) => { setQ(''); setTableFocus(id); requestAnimationFrame(() => document.getElementById(`t-${id}`)?.closest('section')?.scrollIntoView({ block: 'start', behavior: 'smooth' })); };

  return (
    <>
      <PageHeader title={t('tables')}
        subtitle={occ.length ? `${plural(occ.length, P.table)} · ${plural(cap, P.seat)} · ${people(c.confirmedPeople)} مؤكدون` : 'وزّع الضيوف المؤكدين على الطاولات'}
        actions={occ.length && manage ? <div className="seat-head-actions">
          {/* one primary action; the rest wait in a menu so the hall map stays near the top on small phones */}
          <Button variant="primary" icon="sparkle" className="as-entry" onClick={() => setAutoSeat(true)}>{t('autoSeat')}</Button>
          <Menu label="إجراءات الطاولات" triggerLabel="المزيد" items={[
            { label: 'أضف طاولة', icon: 'plus', onSelect: () => setEditing('new') },
            { label: orderMode ? 'إنهاء الترتيب' : 'ترتيب الطاولات', icon: 'move', onSelect: () => setOrderMode((v) => !v) },
            { label: t('exportFile'), icon: 'download', disabled: !mayExport, hint: mayExport ? undefined : OWNER_ONLY_NOTE, onSelect: () => setExportTable('all') },
          ]} />
        </div> : undefined} />

      {occ.length === 0 ? manage ? <QuickSetup event={event} confirmedPeople={c.confirmedPeople} /> : <EmptyState icon="table" title="لم تُجهّز الطاولات بعد">يجهّز فريق التنظيم الطاولات لتظهر هنا.</EmptyState> : (
        // phones: map, warnings, waiting list, tables · desktop: the waiting list stays beside the map (features.css .seating)
        <div className="seating">
          {<HallMap showFood={showFood} orderMode={manage && orderMode} onOrderDone={() => setOrderMode(false)} onReorder={manage ? reorderTo : undefined} tables={occ} focus={focus} onFocus={setTableFocus} onDropParty={manage ? onDrop : undefined} dragOver={dragTarget} onDragOverTable={(id)=>{if(dragId)setDragTarget(id);}} />}
          {(warn.overCapacity.length > 0 || warn.declinedAssigned.length > 0 || cap < c.confirmedPeople) && (
            <div className="stack gap-2 seat-warnings">
              {warn.overCapacity.map((o) => <Banner key={o.table.id} tone="danger" compact title={`${o.table.name} فوق السعة`}
                action={manage ? <div className="row gap-2 wrap"><Button size="sm" icon="table" onClick={() => showTable(o.table.id)}>اعرض الطاولة</Button><Button size="sm" variant="ghost" icon="edit" onClick={() => setEditing(o)}>زِد السعة</Button></div> : undefined}>
                عليها {people(o.used)} والسعة {o.table.capacity}. {manage ? 'انقل دعوة إلى طاولة أخرى أو زِد السعة.' : 'يراجعها فريق التنظيم.'}</Banner>)}
              {warn.declinedAssigned.map((p) => (
                <Banner key={p.id} tone="warning" compact title={`${p.primaryGuestName} اعتذر وما زال على ${occ.find((o) => o.table.id === p.tableId)?.table.name}`}
                  action={manage ? <Button size="sm" onClick={() => void assign.run(p.id, null)}>أزله من الطاولة</Button> : undefined}>{manage ? 'لم نُزله تلقائيًا — القرار لك.' : 'يراجع فريق التنظيم توزيع هذه الدعوة.'}</Banner>
              ))}
              {cap < c.confirmedPeople && <Banner tone="warning" compact title="المقاعد أقل من المؤكدين" action={manage ? <Button size="sm" icon="plus" onClick={() => setEditing('new')}>أضف طاولة</Button> : undefined}>{people(c.confirmedPeople)} مؤكدون و{plural(cap, P.seat)} فقط. أضف طاولة أو زِد السعة.</Banner>}
            </div>
          )}

            <Panel className="seat-pool" title={`من ينتظر مكانًا؟ (${warn.unassigned.length})`} subtitle={warn.unassigned.length ? `${people(warn.unassigned.reduce((n, p) => n + seatsFor(p), 0))} مؤكدون بانتظار مكان` : 'كل المؤكدين لهم طاولات'}>
              <div className="stack gap-3">
                <SearchInput value={q} onChange={setQ} placeholder="ابحث عن ضيف" />
                {unassigned.length === 0 ? (
                  <p className="all-good t-sm"><Icon name="check-circle" />{q ? 'لا نتائج بين غير الموزعين' : 'تم توزيع كل الضيوف المؤكدين'}</p>
                ) : (
                  <ul className="pool-list">
                    {unassigned.map((p) => (
                      <li key={p.id} className={`pool-item${dragId === p.id || moving?.id === p.id ? ' is-drag-source' : ''}`} {...(manage ? lift.bind(p) : {})} draggable={manage} onDragStart={(e) => { e.dataTransfer.setData('text/plain', p.id); setDragId(p.id); }} onDragEnd={endDrag}>
                        <span className="grow"><span className="t-bold pool-name">{p.primaryGuestName}{showFood && <DietBadge p={p} />}</span>{p.side && <span className="faint t-xs pool-side">{p.side}</span>}</span>
                        <Badge tone="success">{people(seatsFor(p))}</Badge>
                        {manage && <Button size="sm" onClick={() => startMove(p)}>{t('assignTable')}</Button>}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="faint t-xs seat-pool-note">من لم يرد بعد لا يظهر هنا حتى يؤكد. <span className="seating-drag-hint">اسحب الضيف إلى طاولة أو استخدم «اختر طاولة».</span><span className="seating-tap-hint">اضغط «اختر طاولة» بجوار الضيف لتوزيعه.</span></p>
              </div>
            </Panel>

            <div className="tables-grid">
              {shown.map((o) => (
                <section key={o.table.id} className={`table-card${o.over ? ' is-over' : ''}${dragId ? ' is-droppable' : ''}${dragTarget === o.table.id ? ' is-drop-target' : ''}${match && o.parties.some((p) => match.has(p.id)) ? ' is-match' : ''}`}
                  aria-labelledby={`t-${o.table.id}`} onDragOver={(e) => { if (dragId) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragTarget(o.table.id); } }}
                  onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragTarget((id) => id === o.table.id ? null : id); }} onDrop={onDrop(o)}>
                  <header className="table-head">
                    <div className="grow">
                      <h3 id={`t-${o.table.id}`} className="table-name">{o.table.name}</h3>
                      <p className={`table-seats num${o.over ? ' text-danger' : ''}`}>{o.used} / {o.table.capacity} {o.over ? `· زيادة ${-o.remaining}` : o.remaining === 0 ? '· ممتلئة' : `· متبقٍ ${o.remaining}`}</p>
                    </div>
                    {manage && <Menu label={`خيارات ${o.table.name}`} items={[
                      mayExport ? { label: t('exportFile'), icon: 'download', onSelect: () => setExportTable(o.table.id) } : null,
                      { label: 'تقديم في الترتيب', icon: 'chevron-up', disabled: !manage || occ[0]?.table.id === o.table.id, onSelect: () => reorderTo(o.table.id, occ[occ.indexOf(o) - 1]!.table.id) },
                      { label: 'تأخير في الترتيب', icon: 'chevron-down', disabled: !manage || occ[occ.length - 1]?.table.id === o.table.id, onSelect: () => reorderTo(o.table.id, occ[occ.indexOf(o) + 1]!.table.id) },
                      { label: 'تعديل الاسم والسعة', icon: 'edit', disabled: !manage, onSelect: () => setEditing(o) },
                      { label: 'حذف الطاولة', icon: 'trash', danger: true, disabled: !manage, onSelect: () => setDeleting(o) },
                    ]} />}
                  </header>
                  {o.table.capacity <= 20 && <div className="seat-dots" aria-hidden="true">{Array.from({length:o.table.capacity},(_,i)=><span key={i} className={i<o.used?'is-filled':''}/>)}</div>}
                  <ProgressBar value={o.used} max={o.table.capacity} tone={o.over ? 'danger' : o.remaining === 0 ? 'success' : 'primary'} label={`إشغال ${o.table.name}`} />
                  {o.parties.length === 0 ? <p className="faint t-sm table-empty">طاولة فارغة</p> : (
                    <ul className="table-parties">
                      {o.parties.map((p) => (
                        <li key={p.id} className={`table-party${p.rsvpStatus === 'declined' ? ' is-declined' : ''}${match?.has(p.id) ? ' is-match' : ''}${moving?.id === p.id ? ' is-drag-source' : ''}`} {...(manage ? lift.bind(p) : {})} draggable={manage && p.rsvpStatus === 'confirmed'}
                          onDragStart={(e) => { e.dataTransfer.setData('text/plain', p.id); setDragId(p.id); }} onDragEnd={endDrag}>
                          <span className="grow truncate">{p.primaryGuestName}{showFood && <DietBadge p={p} />}</span>
                          {p.rsvpStatus === 'declined' ? <Badge tone="warning">اعتذر</Badge> : <span className="num faint t-sm">{seatsFor(p)}</span>}
                          {manage && <Menu label={`خيارات ${p.primaryGuestName}`} items={[
                            manage && p.rsvpStatus === 'confirmed' ? { label: 'نقل إلى طاولة أخرى', icon: 'move', onSelect: () => startMove(p) } : null,
                            { label: 'إزالة من الطاولة', icon: 'close', disabled: !manage, onSelect: () => void assign.run(p.id, null) },
                          ]} />}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
        </div>
      )}

      {autoSeat && manage && <AutoSeatSheet event={event} tables={tables.data ?? []} parties={all} onClose={() => setAutoSeat(false)} onApplied={autoApplied} />}
      {exportTable && mayExport && <ExportGuestsDialog event={event} parties={all} tables={tables.data || []} visibleIds={new Set(all.map((p) => p.id))} selectedIds={new Set()} initialTable={exportTable === 'all' ? undefined : exportTable} onClose={() => setExportTable(null)} />}
      {moving && !override && !assigning && <SeatDock party={moving} tables={occ} hover={dockHover} onPick={(t) => tryAssign(moving, t)} onCancel={() => setMoving(null)} onList={() => setAssigning(moving)} />}
      {lift.ghost}
      {assigning && !override && <AssignDialog party={assigning} tables={occ} onClose={() => { setAssigning(null); setMoving(null); }} onPick={(t) => tryAssign(assigning, t)} />}
      {editing && <TableDialog event={event} table={editing === 'new' ? null : editing} existing={occ} onClose={() => setEditing(null)} />}
      <ConfirmDialog open={!!deleting} tone="danger" title={`حذف ${deleting?.table.name}؟`} confirmLabel="حذف الطاولة" loading={remove.pending}
        body={deleting?.parties.length ? `${plural(deleting.parties.length, P.invitation)} عليها ستنتقل إلى «بلا طاولة».` : 'الطاولة فارغة.'}
        onCancel={() => setDeleting(null)} onConfirm={() => deleting && void remove.run(deleting.table.id)} />
      <ConfirmDialog open={!!override} title="الدعوة لا تتسع على هذه الطاولة"
        body={override ? `${override.party.primaryGuestName} (${people(seatsFor(override.party))}) على ${override.table.table.name} المتبقي فيها ${Math.max(0, override.table.remaining)}. ستصبح الطاولة فوق السعة.` : ''}
        confirmLabel="وزّعهم رغم ذلك" cancelLabel="اختر طاولة أخرى"
        onCancel={() => setOverride(null)} onConfirm={() => { if (override) { void assign.run(override.party.id, override.table.table.id); setOverride(null); setAssigning(null); setMoving(null); } }} />
    </>
  );
}

function AssignDialog({ party, tables, onClose, onPick }: { party: InvitationParty; tables: TableOccupancy[]; onClose: () => void; onPick: (t: TableOccupancy) => void }) {
  const need = seatsFor(party);
  return (
    <Dialog open onClose={onClose} title={party.tableId ? `نقل ${party.primaryGuestName}` : `طاولة لـ${party.primaryGuestName}`} description={`يحتاجون ${pluralOf(need, P.seat)}`}>
      <ul className="pick-list">
        {tables.map((t) => {
          const check = checkAssign(party, t);
          const current = party.tableId === t.table.id;
          return (
            <li key={t.table.id}>
              <button type="button" className={`pick-item${!check.ok ? ' is-tight' : ''}`} disabled={current} onClick={() => onPick(t)}>
                <span className="grow"><span className="t-bold">{t.table.name}</span><span className="faint t-sm num"> · {t.used}/{t.table.capacity}</span></span>
                {current ? <Badge tone="neutral">الطاولة الحالية</Badge> : check.ok ? <Badge tone="success">متبقٍ {t.remaining}</Badge> : <Badge tone="warning">لا تتسع ({Math.max(0, check.free)} متبقٍ)</Badge>}
              </button>
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
}

function TableDialog({ event, table, existing, onClose }: { event: Event; table: TableOccupancy | null; existing: TableOccupancy[]; onClose: () => void }) {
  const toast = useToast();
  const [name, setName] = useState(table?.table.name ?? nextTableName(existing.map((o) => o.table)));
  const [capacity, setCapacity] = useState(table?.table.capacity ?? 10);
  const [tried, setTried] = useState(false);
  const errs = validateTable({ name, capacity });
  const save = useMutation(async (s): Promise<unknown> => (table ? s.seating.updateTable(table.table.id, { name, capacity }) : s.seating.createTables(event.id, [{ name, capacity }])), {
    onSuccess: () => { toast({ tone: 'success', text: table ? 'تم حفظ الطاولة' : `تمت إضافة ${name}` }); onClose(); },
  });
  const below = table && capacity < table.used;
  return (
    <Dialog open onClose={onClose} title={table ? 'تعديل الطاولة' : 'طاولة جديدة'} size="sm"
      footer={<><Button variant="primary" loading={save.pending} onClick={() => { setTried(true); if (!Object.keys(errs).length) void save.run(); }}>{table ? 'حفظ' : 'إضافة'}</Button><Button variant="ghost" onClick={onClose}>إلغاء</Button></>}>
      {save.error ? <Banner tone="danger">{errorMessage(save.error)}</Banner> : null}
      <Field label="اسم الطاولة" required error={tried ? errs.name : null}><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Stepper label="السعة (عدد المقاعد)" value={capacity} min={1} max={60} onChange={setCapacity} />
      {below && <Banner tone="warning" compact>عليها الآن {people(table.used)} — ستصبح فوق السعة.</Banner>}
    </Dialog>
  );
}

function QuickSetup({ event, confirmedPeople }: { event: Event; confirmedPeople: number }) {
  const toast = useToast();
  const [cap, setCap] = useState(10);
  const [count, setCount] = useState(Math.max(1, Math.ceil(confirmedPeople / 10)));
  const create = useMutation((s) => s.seating.createTables(event.id, Array.from({ length: count }, (_, i) => ({ name: `طاولة ${i + 1}`, capacity: cap }))), {
    onSuccess: () => toast({ tone: 'success', text: `تمت إضافة ${pluralOf(count, P.table)}` }),
  });
  return (
    <Panel>
      <EmptyState icon="table" title="ابدأ بالطاولات" action={<Button variant="primary" size="lg" loading={create.pending} onClick={() => void create.run()}>أضف {pluralOf(count, P.table)}</Button>}>
        {confirmedPeople ? `لديك ${people(confirmedPeople)} مؤكدون. اقترحنا عدد الطاولات — عدّله كما يناسب القاعة.` : <>لا يوجد ضيوف مؤكدون بعد. يمكنك تجهيز الطاولات الآن، والتوزيع بعد وصول الردود. <Link to={paths.rsvp(event.id)}>تابع الردود</Link></>}
      </EmptyState>
      <div className="quick-setup">
        <Stepper label="عدد الطاولات" value={count} min={1} max={60} onChange={setCount} />
        <Stepper label="مقاعد كل طاولة" value={cap} min={1} max={30} onChange={setCap} />
      </div>
      {create.error ? <Banner tone="danger">{errorMessage(create.error)}</Banner> : null}
      <p className="faint t-sm center">المجموع: {plural(count * cap, P.seat)}</p>
    </Panel>
  );
}
