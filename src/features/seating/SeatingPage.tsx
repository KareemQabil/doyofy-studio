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
import { Badge, Banner, Button, ConfirmDialog, Dialog, EmptyState, ErrorState, Field, Icon, Input, Menu, PageHeader, Panel, ProgressBar, SearchInput, Stepper, PageLoader } from '../../ui';
import { useMutation, useServices } from '../../app/data';
import { can, canViewFood } from '../../domain/roles';
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
  const { t, n, dialect } = useCopy();
  const people = (count: number) => n(count, 'person');
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
  // «زِد السعة» on an over-capacity warning opens the dialog at the capacity that table needs, not at its current one
  const [capHint, setCapHint] = useState<number | null>(null);
  const edit = (o: TableOccupancy | 'new', need: number | null = null) => { setCapHint(need); setEditing(o); };
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
      text: p.tableId ? t('seatSeated', { name: p.primaryGuestName, table: tables.data?.find((x) => x.id === p.tableId)?.name ?? t('seatTheTable') }) : t('seatRemoved', { name: p.primaryGuestName }),
      action: { label: t('seatUndo'), run: () => {
        services.seating.assign(p.id, from).then(() => toast({ tone: 'neutral', text: from ? t('seatBackTo', { name: p.primaryGuestName, table: tables.data?.find((x) => x.id === from)?.name ?? t('seatTheirTable') }) : t('seatBackToWaiting', { name: p.primaryGuestName }) }), (e) => toast({ tone: 'danger', text: errorMessage(e) }));
      } },
    }),
    onError: (e) => toast({ tone: 'danger', text: errorMessage(e) }),
  });
  const remove = useMutation((s, id: string) => s.seating.deleteTable(id), { onSuccess: () => { setDeleting(null); toast({ tone: 'neutral', text: t('seatDeleted') }); } });

  // a new order can be put back from its toast, like every seat change (the order before the move is kept with the call)
  const reorder = useMutation(async (s, ids: string[], before: string[]) => { await s.seating.reorderTables(event.id, ids); return before; }, {
    onSuccess: (before) => toast({ tone: 'success', text: t('seatOrderSaved'), action: { label: t('seatOrderUndo'), run: () => {
      services.seating.reorderTables(event.id, before).then(() => toast({ tone: 'neutral', text: t('seatOrderUndone') }), (e) => toast({ tone: 'danger', text: errorMessage(e) }));
    } } }),
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

  const tryAssign = (party: InvitationParty, o: TableOccupancy) => {
    if (!manage) return;
    const ok = checkAssign(party, o);
    if (!ok.ok && ok.reason === 'does_not_fit') { setOverride({ party, table: o }); return; }
    if (!ok.ok) { toast({ tone: 'warning', text: t('seatOnlyConfirmed') }); return; }
    void assign.run(party.id, o.table.id);
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
    const before = [...ids];
    ids.splice(from, 1); ids.splice(to, 0, source); void reorder.run(ids, before);
  };
  // the suggestion is applied in one write; the toast offers to put back exactly what it changed
  const autoApplied = ({ undo, seated, created }: AutoSeatResult) => {
    setAutoSeat(false);
    // the count the sheet promised («سنوزّع 4 دعوات»), which the activity log keeps too (AutoSeatApply.seated)
    toast({ tone: 'success', text: `${t('autoSeatApplied')}: ${n(seated, 'invitation')}${created ? t('acAutoTables', { tables: n(created, 'table', true) }) : ''}`, action: { label: t('autoSeatUndo'), run: () => {
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
        subtitle={occ.length ? t('seatSub', { tables: n(occ.length, 'table'), seats: n(cap, 'seat'), people: people(c.confirmedPeople) }) : t('seatSubEmpty')}
        actions={occ.length && manage ? <div className="seat-head-actions">
          {/* one primary action; the rest wait in a menu so the hall map stays near the top on small phones */}
          <Button variant="primary" icon="sparkle" className="as-entry" onClick={() => setAutoSeat(true)}>{t('autoSeat')}</Button>
          <Menu label={t('seatActions')} triggerLabel={t('wsMore')} items={[
            { label: t('seatAdd'), icon: 'plus', onSelect: () => edit('new') },
            { label: t(orderMode ? 'seatOrderDone' : 'seatOrder'), icon: 'move', onSelect: () => setOrderMode((v) => !v) },
            { label: t('exportFile'), icon: 'download', disabled: !mayExport, hint: mayExport ? undefined : t('ownerOnlyNote'), onSelect: () => setExportTable('all') },
          ]} />
        </div> : undefined} />

      {occ.length === 0 ? manage ? <QuickSetup event={event} confirmedPeople={c.confirmedPeople} /> : <EmptyState icon="table" title={t('seatNotReady')}>{t('seatNotReadyHint')}</EmptyState> : (
        // phones: map, warnings, waiting list, tables · desktop: the waiting list stays beside the map (features.css .seating)
        <div className="seating">
          {<HallMap showFood={showFood} orderMode={manage && orderMode} onOrderDone={() => setOrderMode(false)} onReorder={manage ? reorderTo : undefined} tables={occ} focus={focus} onFocus={setTableFocus} onDropParty={manage ? onDrop : undefined} dragOver={dragTarget} onDragOverTable={(id)=>{if(dragId)setDragTarget(id);}} />}
          {(warn.overCapacity.length > 0 || warn.declinedAssigned.length > 0 || cap < c.confirmedPeople) && (
            <div className="stack gap-2 seat-warnings">
              {warn.overCapacity.map((o) => <Banner key={o.table.id} tone="danger" compact title={t('seatOver', { table: o.table.name })}
                action={manage ? <div className="row gap-2 wrap"><Button size="sm" icon="table" onClick={() => showTable(o.table.id)}>{t('seatShowTable')}</Button><Button size="sm" variant="ghost" icon="edit" onClick={() => edit(o, o.used)}>{t('seatMoreCap')}</Button></div> : undefined}>
                {t('seatOverText', { people: people(o.used), cap: o.table.capacity })} {t(manage ? 'seatOverManage' : 'seatOverTeam')}</Banner>)}
              {warn.declinedAssigned.map((p) => (
                <Banner key={p.id} tone="warning" compact title={t('seatDeclinedOn', { name: p.primaryGuestName, table: occ.find((o) => o.table.id === p.tableId)?.table.name ?? '' })}
                  action={manage ? <Button size="sm" onClick={() => void assign.run(p.id, null)}>{t('seatRemoveFrom')}</Button> : undefined}>{t(manage ? 'seatYourCall' : 'seatTeamReviews')}</Banner>
              ))}
              {cap < c.confirmedPeople && <Banner tone="warning" compact title={t('seatFewSeats')} action={manage ? <Button size="sm" icon="plus" onClick={() => edit('new')}>{t('seatAdd')}</Button> : undefined}>{t('seatFewSeatsText', { people: people(c.confirmedPeople), seats: n(cap, 'seat') })}</Banner>}
            </div>
          )}

            <Panel className="seat-pool" title={t('seatWaiting', { n: warn.unassigned.length })} subtitle={warn.unassigned.length ? t('seatWaitingSub', { people: people(warn.unassigned.reduce((sum, p) => sum + seatsFor(p), 0)) }) : t('seatAllSeated')}>
              <div className="stack gap-3">
                <SearchInput value={q} onChange={setQ} placeholder={t('seatSearch')} />
                {unassigned.length === 0 ? (
                  <p className="all-good t-sm"><Icon name="check-circle" />{t(q ? 'seatNoMatch' : 'seatDone')}</p>
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
                <p className="faint t-xs seat-pool-note">{t('seatPendingNote')} <span className="seating-drag-hint">{t('seatDragHint', { label: t('assignTable') })}</span><span className="seating-tap-hint">{t('seatTapHint', { label: t('assignTable') })}</span></p>
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
                      <p className={`table-seats num${o.over ? ' text-danger' : ''}`}>{o.used} / {o.table.capacity} {o.over ? t('seatExtra', { n: -o.remaining }) : o.remaining === 0 ? t('seatFull') : t('seatLeft', { n: o.remaining })}</p>
                    </div>
                    {manage && <Menu label={t('seatOptions', { name: o.table.name })} items={[
                      mayExport ? { label: t('exportFile'), icon: 'download', onSelect: () => setExportTable(o.table.id) } : null,
                      { label: t('seatEarlier'), icon: 'chevron-up', disabled: !manage || occ[0]?.table.id === o.table.id, onSelect: () => reorderTo(o.table.id, occ[occ.indexOf(o) - 1]!.table.id) },
                      { label: t('seatLater'), icon: 'chevron-down', disabled: !manage || occ[occ.length - 1]?.table.id === o.table.id, onSelect: () => reorderTo(o.table.id, occ[occ.indexOf(o) + 1]!.table.id) },
                      { label: t('seatEdit'), icon: 'edit', disabled: !manage, onSelect: () => edit(o) },
                      { label: t('seatDelete'), icon: 'trash', danger: true, disabled: !manage, onSelect: () => setDeleting(o) },
                    ]} />}
                  </header>
                  {o.table.capacity <= 20 && <div className="seat-dots" aria-hidden="true">{Array.from({length:o.table.capacity},(_,i)=><span key={i} className={i<o.used?'is-filled':''}/>)}</div>}
                  <ProgressBar value={o.used} max={o.table.capacity} tone={o.over ? 'danger' : o.remaining === 0 ? 'success' : 'primary'} label={t('seatFill', { table: o.table.name })} />
                  {o.parties.length === 0 ? <p className="faint t-sm table-empty">{t('seatEmpty')}</p> : (
                    <ul className="table-parties">
                      {o.parties.map((p) => (
                        <li key={p.id} className={`table-party${p.rsvpStatus === 'declined' ? ' is-declined' : ''}${match?.has(p.id) ? ' is-match' : ''}${moving?.id === p.id ? ' is-drag-source' : ''}`} {...(manage ? lift.bind(p) : {})} draggable={manage && p.rsvpStatus === 'confirmed'}
                          onDragStart={(e) => { e.dataTransfer.setData('text/plain', p.id); setDragId(p.id); }} onDragEnd={endDrag}>
                          <span className="grow truncate">{p.primaryGuestName}{showFood && <DietBadge p={p} />}</span>
                          {p.rsvpStatus === 'declined' ? <Badge tone="warning">{t('stDeclined')}</Badge> : <span className="num faint t-sm">{seatsFor(p)}</span>}
                          {manage && <Menu label={t('seatOptions', { name: p.primaryGuestName })} items={[
                            manage && p.rsvpStatus === 'confirmed' ? { label: t('seatMoveOther'), icon: 'move', onSelect: () => startMove(p) } : null,
                            { label: t('removeFromTable'), icon: 'close', disabled: !manage, onSelect: () => void assign.run(p.id, null) },
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
      {editing && <TableDialog event={event} table={editing === 'new' ? null : editing} suggested={capHint ?? undefined} existing={occ} onClose={() => setEditing(null)} />}
      <ConfirmDialog open={!!deleting} tone="danger" title={t('seatDeleteTitle', { table: deleting?.table.name ?? '' })} confirmLabel={t('seatDelete')} loading={remove.pending}
        body={deleting?.parties.length ? t('seatDeleteMoves', { n: n(deleting.parties.length, 'invitation') }) : t('seatDeleteEmpty')}
        onCancel={() => setDeleting(null)} onConfirm={() => deleting && void remove.run(deleting.table.id)} />
      <ConfirmDialog open={!!override} title={t('seatNoFit')}
        body={override ? t('seatNoFitText', { name: override.party.primaryGuestName, people: people(seatsFor(override.party)), table: override.table.table.name, left: Math.max(0, override.table.remaining) }) : ''}
        confirmLabel={t('seatAnyway')} cancelLabel={t('seatPickOther')}
        onCancel={() => setOverride(null)} onConfirm={() => { if (override) { void assign.run(override.party.id, override.table.table.id); setOverride(null); setAssigning(null); setMoving(null); } }} />
    </>
  );
}

function AssignDialog({ party, tables, onClose, onPick }: { party: InvitationParty; tables: TableOccupancy[]; onClose: () => void; onPick: (t: TableOccupancy) => void }) {
  const need = seatsFor(party);
  const { t, n } = useCopy();
  return (
    <Dialog open onClose={onClose} title={t(party.tableId ? 'seatMove' : 'seatFor', { name: party.primaryGuestName })} description={t('seatNeed', { seats: n(need, 'seat', true) })}>
      <ul className="pick-list">
        {tables.map((o) => {
          const check = checkAssign(party, o);
          const current = party.tableId === o.table.id;
          return (
            <li key={o.table.id}>
              <button type="button" className={`pick-item${!check.ok ? ' is-tight' : ''}`} disabled={current} onClick={() => onPick(o)}>
                <span className="grow"><span className="t-bold">{o.table.name}</span><span className="faint t-sm num"> · {o.used}/{o.table.capacity}</span></span>
                {current ? <Badge tone="neutral">{t('seatCurrent')}</Badge> : check.ok ? <Badge tone="success">{t('seatRemaining', { n: o.remaining })}</Badge> : <Badge tone="warning">{t('seatTooSmall', { n: Math.max(0, check.free) })}</Badge>}
              </button>
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
}

function TableDialog({ event, table, suggested, existing, onClose }: { event: Event; table: TableOccupancy | null; suggested?: number; existing: TableOccupancy[]; onClose: () => void }) {
  const toast = useToast();
  const { t, n } = useCopy();
  // a new table's default name follows the voice («ترابيزة 9» in Egyptian); existing names are data and stay as typed
  const [name, setName] = useState(table?.table.name ?? nextTableName(existing.map((o) => o.table), t('seatDefaultName')));
  const [capacity, setCapacity] = useState(Math.min(60, Math.max(suggested ?? 0, table?.table.capacity ?? 10)));
  const [tried, setTried] = useState(false);
  const errs = validateTable({ name, capacity });
  const save = useMutation(async (s): Promise<unknown> => (table ? s.seating.updateTable(table.table.id, { name, capacity }) : s.seating.createTables(event.id, [{ name, capacity }])), {
    onSuccess: () => { toast({ tone: 'success', text: table ? t('seatSaved') : t('seatAdded', { name }) }); onClose(); },
  });
  const below = table && capacity < table.used;
  return (
    <Dialog open onClose={onClose} title={t(table ? 'seatEditTitle' : 'seatNew')} size="sm"
      footer={<><Button variant="primary" loading={save.pending} onClick={() => { setTried(true); if (!Object.keys(errs).length) void save.run(); }}>{table ? t('save') : t('pfAdd')}</Button><Button variant="ghost" onClick={onClose}>{t('cancel')}</Button></>}>
      {save.error ? <Banner tone="danger">{errorMessage(save.error)}</Banner> : null}
      <Field label={t('seatName')} required error={tried ? errs.name : null}><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Stepper label={t('seatCapacity')} value={capacity} min={1} max={60} onChange={setCapacity} />
      {below && <Banner tone="warning" compact>{t('seatBelow', { people: n(table.used, 'person') })}</Banner>}
    </Dialog>
  );
}

function QuickSetup({ event, confirmedPeople }: { event: Event; confirmedPeople: number }) {
  const toast = useToast();
  const { t, n } = useCopy();
  const [cap, setCap] = useState(10);
  const [count, setCount] = useState(Math.max(1, Math.ceil(confirmedPeople / 10)));
  const create = useMutation((s) => s.seating.createTables(event.id, Array.from({ length: count }, (_, i) => ({ name: t('seatDefaultName', { n: i + 1 }), capacity: cap }))), {
    onSuccess: () => toast({ tone: 'success', text: t('seatAddedN', { tables: n(count, 'table', true) }) }),
  });
  return (
    <Panel>
      <EmptyState icon="table" title={t('seatStart')} action={<Button variant="primary" size="lg" loading={create.pending} onClick={() => void create.run()}>{t('seatAddN', { tables: n(count, 'table', true) })}</Button>}>
        {confirmedPeople ? t('seatSuggested', { people: n(confirmedPeople, 'person') }) : <>{t('seatNoneYet')} <Link to={paths.rsvp(event.id)}>{t('seatFollow')}</Link></>}
      </EmptyState>
      <div className="quick-setup">
        <Stepper label={t('seatCount')} value={count} min={1} max={60} onChange={setCount} />
        <Stepper label={t('seatPerTable')} value={cap} min={1} max={30} onChange={setCap} />
      </div>
      {create.error ? <Banner tone="danger">{errorMessage(create.error)}</Banner> : null}
      <p className="faint t-sm center">{t('seatTotal', { seats: n(count * cap, 'seat') })}</p>
    </Panel>
  );
}
