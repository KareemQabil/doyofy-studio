/**
 * Seating (spec §16): tables with capacity; confirmed parties are assigned, moved or unassigned.
 * Every action works with buttons; drag and drop is an extra on pointer devices.
 * Warnings (over capacity, does not fit, unassigned, declined but seated) are shown, never auto-fixed.
 */
import { useMemo, useState, type DragEvent } from 'react';
import { useReviewSettings } from '../../app/review';
import { OrbitTableAtlas } from '../orbit/OrbitWorkLenses';
import type { Event, InvitationParty } from '../../domain/types';
import { checkAssign, nextTableName, occupancy, seatingWarnings, totalCapacity, validateTable, type TableOccupancy } from '../../domain/seating';
import { countParties, searchParties, seatsFor } from '../../domain/parties';
import { people, plural, pluralOf, P } from '../../domain/format';
import { Badge, Banner, Button, ConfirmDialog, Dialog, EmptyState, ErrorState, Field, Icon, Input, Menu, PageHeader, Panel, ProgressBar, SearchInput, Skeleton, Stepper } from '../../ui';
import { useMutation } from '../../app/data';
import { Link } from '../../app/router';
import { paths } from '../../app/paths';
import { useToast } from '../../ui/primitives/Feedback';
import { errorMessage } from '../../services/errors';
import { useParties, useTables } from '../shared/queries';

export function SeatingPage({ event }: { event: Event }) {
  const {theme}=useReviewSettings();
  const [tableFocus,setTableFocus]=useState('');
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

  const assign = useMutation((s, partyId: string, tableId: string | null) => s.seating.assign(partyId, tableId), {
    onSuccess: (p) => toast({ tone: 'success', text: p.tableId ? `تم توزيع ${p.primaryGuestName} على ${tables.data?.find((t) => t.id === p.tableId)?.name ?? 'الطاولة'}` : `تمت إزالة ${p.primaryGuestName} من الطاولة` }),
    onError: (e) => toast({ tone: 'danger', text: errorMessage(e) }),
  });
  const remove = useMutation((s, id: string) => s.seating.deleteTable(id), { onSuccess: () => { setDeleting(null); toast({ tone: 'neutral', text: 'تم حذف الطاولة ونُقل ضيوفها إلى «بلا طاولة»' }); } });

  const all = parties.data ?? [];
  const occ = useMemo(() => occupancy(tables.data ?? [], all), [tables.data, all]);
  const warn = useMemo(() => seatingWarnings(tables.data ?? [], all), [tables.data, all]);
  const c = countParties(all);
  const unassigned = searchParties(warn.unassigned, q).sort((a, b) => seatsFor(b) - seatsFor(a));
  const match = q ? new Set(searchParties(all, q).map((p) => p.id)) : null;

  if (parties.error || tables.error) return <ErrorState error={parties.error || tables.error} onRetry={() => { parties.refetch(); tables.refetch(); }} />;
  if (parties.loading || tables.loading) return <Skeleton lines={8} block />;

  const tryAssign = (party: InvitationParty, t: TableOccupancy) => {
    const ok = checkAssign(party, t);
    if (!ok.ok && ok.reason === 'does_not_fit') { setOverride({ party, table: t }); return; }
    if (!ok.ok) { toast({ tone: 'warning', text: 'يمكن توزيع الدعوات المؤكدة فقط' }); return; }
    void assign.run(party.id, t.table.id);
    setAssigning(null);
  };
  const onDrop = (t: TableOccupancy) => (e: DragEvent) => {
    e.preventDefault();
    const party = all.find((p) => p.id === (e.dataTransfer.getData('text/plain') || dragId));
    endDrag();
    if (party && party.tableId !== t.table.id) tryAssign(party, t);
  };
  const cap = totalCapacity(tables.data ?? []);
  const focus=q||tableFocus==='all'?'all':occ.some(o=>o.table.id===tableFocus)?tableFocus:occ[0]?.table.id??'';
  const shown=theme==='orbit'&&focus!=='all'?occ.filter(o=>o.table.id===focus):occ;

  return (
    <>
      <PageHeader title="الطاولات"
        subtitle={occ.length ? `${plural(occ.length, P.table)} · ${plural(cap, P.seat)} · ${people(c.confirmedPeople)} مؤكدون` : 'وزّع الضيوف المؤكدين على الطاولات'}
        actions={occ.length ? <Button variant="primary" icon="plus" onClick={() => setEditing('new')}>أضف طاولة</Button> : undefined} />

      {occ.length === 0 ? <QuickSetup event={event} confirmedPeople={c.confirmedPeople} /> : (
        <div className="stack gap-5">
          {(warn.overCapacity.length > 0 || warn.declinedAssigned.length > 0 || cap < c.confirmedPeople) && (
            <div className="stack gap-2">
              {warn.overCapacity.map((o) => <Banner key={o.table.id} tone="danger" compact title={`${o.table.name} فوق السعة`}>عليها {people(o.used)} والسعة {o.table.capacity}. انقل دعوة إلى طاولة أخرى أو زِد السعة.</Banner>)}
              {warn.declinedAssigned.map((p) => (
                <Banner key={p.id} tone="warning" compact title={`${p.primaryGuestName} اعتذر وما زال على ${occ.find((o) => o.table.id === p.tableId)?.table.name}`}
                  action={<Button size="sm" onClick={() => void assign.run(p.id, null)}>أزله من الطاولة</Button>}>لم نُزله تلقائيًا — القرار لك.</Banner>
              ))}
              {cap < c.confirmedPeople && <Banner tone="warning" compact title="المقاعد أقل من المؤكدين">{people(c.confirmedPeople)} مؤكدون و{plural(cap, P.seat)} فقط. أضف طاولة أو زِد السعة.</Banner>}
            </div>
          )}

          {theme==='orbit'&&<OrbitTableAtlas tables={occ} value={focus} onChange={setTableFocus}/>}
          <div className="seating">
            <Panel className="seat-pool" title={`من ينتظر مكانًا؟ (${warn.unassigned.length})`} subtitle={warn.unassigned.length ? `${people(warn.unassigned.reduce((n, p) => n + seatsFor(p), 0))} مؤكدون بانتظار مكان` : 'كل المؤكدين لهم طاولات'}>
              <div className="stack gap-3">
                <SearchInput value={q} onChange={setQ} placeholder="ابحث عن ضيف" />
                {unassigned.length === 0 ? (
                  <p className="all-good t-sm"><Icon name="check-circle" />{q ? 'لا نتائج بين غير الموزعين' : 'تم توزيع كل الضيوف المؤكدين'}</p>
                ) : (
                  <ul className="pool-list">
                    {unassigned.map((p) => (
                      <li key={p.id} className={`pool-item${dragId === p.id ? ' is-drag-source' : ''}`} draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', p.id); setDragId(p.id); }} onDragEnd={endDrag}>
                        <span className="grow"><span className="t-bold">{p.primaryGuestName}</span><span className="faint t-xs"> · {p.side ?? ''}</span></span>
                        <Badge tone="success">{people(seatsFor(p))}</Badge>
                        <Button size="sm" onClick={() => setAssigning(p)}>اختر طاولة</Button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="faint t-xs">من لم يرد بعد لا يظهر هنا حتى يؤكد. <span className="seating-drag-hint">اسحب الضيف إلى طاولة أو استخدم «اختر طاولة».</span><span className="seating-tap-hint">اضغط «اختر طاولة» بجوار الضيف لتوزيعه.</span></p>
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
                    <Menu label={`خيارات ${o.table.name}`} items={[
                      { label: 'تعديل الاسم والسعة', icon: 'edit', onSelect: () => setEditing(o) },
                      { label: 'حذف الطاولة', icon: 'trash', danger: true, onSelect: () => setDeleting(o) },
                    ]} />
                  </header>
                  {o.table.capacity <= 20 && <div className="seat-dots" aria-hidden="true">{Array.from({length:o.table.capacity},(_,i)=><span key={i} className={i<o.used?'is-filled':''}/>)}</div>}
                  <ProgressBar value={o.used} max={o.table.capacity} tone={o.over ? 'danger' : o.remaining === 0 ? 'success' : 'primary'} label={`إشغال ${o.table.name}`} />
                  {o.parties.length === 0 ? <p className="faint t-sm table-empty">طاولة فارغة</p> : (
                    <ul className="table-parties">
                      {o.parties.map((p) => (
                        <li key={p.id} className={`table-party${p.rsvpStatus === 'declined' ? ' is-declined' : ''}${match?.has(p.id) ? ' is-match' : ''}`} draggable={p.rsvpStatus === 'confirmed'}
                          onDragStart={(e) => { e.dataTransfer.setData('text/plain', p.id); setDragId(p.id); }} onDragEnd={endDrag}>
                          <span className="grow truncate">{p.primaryGuestName}</span>
                          {p.rsvpStatus === 'declined' ? <Badge tone="warning">اعتذر</Badge> : <span className="num faint t-sm">{seatsFor(p)}</span>}
                          <Menu label={`خيارات ${p.primaryGuestName}`} items={[
                            p.rsvpStatus === 'confirmed' ? { label: 'نقل إلى طاولة أخرى', icon: 'move', onSelect: () => setAssigning(p) } : null,
                            { label: 'إزالة من الطاولة', icon: 'close', onSelect: () => void assign.run(p.id, null) },
                          ]} />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </div>
        </div>
      )}

      {assigning && !override && <AssignDialog party={assigning} tables={occ} onClose={() => setAssigning(null)} onPick={(t) => tryAssign(assigning, t)} />}
      {editing && <TableDialog event={event} table={editing === 'new' ? null : editing} existing={occ} onClose={() => setEditing(null)} />}
      <ConfirmDialog open={!!deleting} tone="danger" title={`حذف ${deleting?.table.name}؟`} confirmLabel="حذف الطاولة" loading={remove.pending}
        body={deleting?.parties.length ? `${plural(deleting.parties.length, P.invitation)} عليها ستنتقل إلى «بلا طاولة».` : 'الطاولة فارغة.'}
        onCancel={() => setDeleting(null)} onConfirm={() => deleting && void remove.run(deleting.table.id)} />
      <ConfirmDialog open={!!override} title="الدعوة لا تتسع على هذه الطاولة"
        body={override ? `${override.party.primaryGuestName} (${people(seatsFor(override.party))}) على ${override.table.table.name} المتبقي فيها ${Math.max(0, override.table.remaining)}. ستصبح الطاولة فوق السعة.` : ''}
        confirmLabel="وزّعهم رغم ذلك" cancelLabel="اختر طاولة أخرى"
        onCancel={() => setOverride(null)} onConfirm={() => { if (override) { void assign.run(override.party.id, override.table.table.id); setOverride(null); setAssigning(null); } }} />
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
