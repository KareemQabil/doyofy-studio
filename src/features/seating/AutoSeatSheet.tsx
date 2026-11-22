/**
 * «توزيع تلقائي» — the automatic seating SUGGESTION (owner decision): computed in domain/auto-seating, reviewed here,
 * applied in one atomic service call. Nothing is written before «اعتمد التوزيع»; closing the sheet changes nothing.
 * Phones get a bottom sheet, desktop a side panel (Dialog drawer). Tables are listed in their order with a fill bar
 * (seated before + newly proposed) and the parties the suggestion seats as chips coloured by their side/section. Tapping a chip opens
 * the adjust bar in the footer: move to another table that fits, or leave the party out of this suggestion.
 * Proposed new tables exist only inside the plan and are created together with it.
 */
import { useMemo, useState } from 'react';
import type { Event, InvitationParty, Table } from '../../domain/types';
import {
  applyInput, defaultTableCapacity, groupOf, groupOrder, moveOptions, newTableNames, planAutoSeating,
  type AutoSeatMode, type AutoSeatUndo, type PlanTable,
} from '../../domain/auto-seating';
import { seatsFor } from '../../domain/parties';
import { P, people, plural, pluralOf, type PluralForms } from '../../domain/format';
import type { Dialect } from '../../domain/copy';
import { Badge, Banner, Button, Dialog, Icon, Segmented } from '../../ui';
import { useMutation } from '../../app/data';
import { useCopy } from '../../ui/copy';
import { errorMessage } from '../../services/errors';

/** «ترابيزة» in Egyptian (FINAL_POLISH_PLAN terminology), «طاولة» otherwise */
const TABLE_EG: PluralForms = { zero: 'مفيش ترابيزات', one: 'ترابيزة واحدة', two: 'ترابيزتين', few: '# ترابيزات', many: '# ترابيزة', other: '# ترابيزة' };
export const tableForms = (dialect: Dialect): PluralForms => (dialect === 'ar-EG' ? TABLE_EG : P.table);
const WILL: Record<Dialect, string> = { ar: 'سنوزّع', 'ar-EG': 'هنوزّع', 'ar-SA': 'بنوزّع' };
const SHORT: Record<Dialect, string> = { ar: 'ينقص', 'ar-EG': 'ناقص', 'ar-SA': 'ناقص' };
const OFF: Record<Dialect, string> = { ar: 'سنُزيل من الطاولات من لم يؤكد', 'ar-EG': 'هنشيل من الترابيزات اللي مأكدش', 'ar-SA': 'بنشيل من الطاولات اللي ما أكد' };

export interface AutoSeatResult { undo: AutoSeatUndo; seated: number; created: number }

export function AutoSeatSheet({ event, tables, parties, onClose, onApplied }: {
  event: Event; tables: Table[]; parties: InvitationParty[]; onClose: () => void; onApplied: (r: AutoSeatResult) => void;
}) {
  const { t, dialect } = useCopy();
  const tableWord = tableForms(dialect);
  const [mode, setMode] = useState<AutoSeatMode>('keep');
  const [excluded, setExcluded] = useState<Set<string>>(() => new Set());
  const [pinned, setPinned] = useState<Map<string, string>>(() => new Map());
  const [extra, setExtra] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const capacity = defaultTableCapacity(tables);
  const newTables = useMemo(() => newTableNames(tables, extra).map((name) => ({ name, capacity })), [tables, extra, capacity]);
  const plan = useMemo(() => planAutoSeating(tables, parties, { mode, excluded, pinned, newTables }), [tables, parties, mode, excluded, pinned, newTables]);
  const byId = useMemo(() => new Map(parties.map((p) => [p.id, p])), [parties]);
  const order = useMemo(() => groupOrder(parties), [parties]);
  const tone = (g: string) => (g ? (order.indexOf(g) % 6) + 1 : 0);
  const kept = new Set(plan.kept);
  // placed = everyone the suggestion seats (in «إعادة توزيع الجميع» some land where they already were) · moved = actually changes table
  const placed = new Set(Object.keys(plan.placement).filter((id) => plan.placement[id] && !kept.has(id)));
  const moved = new Set(plan.moves.filter((m) => m.to).map((m) => m.partyId));
  const takenOff = plan.moves.filter((m) => !m.to && !plan.unplaced.some((u) => u.partyId === m.partyId));
  const usedTables = plan.tables.filter((x) => x.partyIds.some((id) => placed.has(id))).length;
  const legend = order.filter((g) => [...placed].some((id) => groupOf(byId.get(id)!) === g));
  const party = selected ? byId.get(selected) ?? null : null;

  // adjusting freezes the rest of the suggestion, so only the party the organizer touched moves
  const freeze = () => new Map(Object.entries(plan.placement).filter(([id, at]) => at && !kept.has(id)) as Array<[string, string]>);
  const moveTo = (id: string, tableId: string) => { const pins = freeze(); pins.set(id, tableId); setPinned(pins); };
  const exclude = (id: string) => { const pins = freeze(); pins.delete(id); setPinned(pins); setExcluded(new Set(excluded).add(id)); setSelected(null); };
  const include = (id: string) => { const next = new Set(excluded); next.delete(id); setExcluded(next); };
  const switchMode = (m: AutoSeatMode) => { setMode(m); setPinned(new Map()); setExcluded(new Set()); setSelected(null); };

  const apply = useMutation((s) => s.seating.applyAutoSeating(event.id, applyInput(plan, tables)), {
    onSuccess: (r) => onApplied({ undo: r.undo, seated: r.parties.filter((p) => p.tableId).length, created: r.tables.length }),
  });

  const footer = party && placed.has(party.id) ? (
    <div className="as-adjust" role="group" aria-label={`تعديل ${party.primaryGuestName}`}>
      <p className="as-adjust-who"><span className={`as-dot grp-${tone(groupOf(party))}`} aria-hidden="true" /><b>{party.primaryGuestName}</b><span className="faint"> · {people(seatsFor(party))}</span></p>
      <label className="as-adjust-field">
        <span className="t-sm">{t('autoSeatMoveTo')}</span>
        <select className="select" value={plan.placement[party.id] ?? ''} onChange={(e) => moveTo(party.id, e.target.value)}>
          {moveOptions(plan, party).map(({ table, fits, current }) => (
            <option key={table.id} value={table.id} disabled={!fits}>
              {table.name}{table.isNew ? ` (${t('autoSeatNewTable')})` : ''} · {current ? `${table.used}/${table.capacity}` : fits ? `${table.used + seatsFor(party)}/${table.capacity}` : t('autoSeatNoRoom')}
            </option>
          ))}
        </select>
      </label>
      <div className="as-adjust-actions">
        <Button variant="ghost" icon="minus" onClick={() => exclude(party.id)}>{t('autoSeatExclude')}</Button>
        <Button variant="primary" icon="check" onClick={() => setSelected(null)}>{t('done')}</Button>
      </div>
    </div>
  ) : (
    <>
      <Button variant="primary" icon="check" loading={apply.pending} disabled={!plan.moves.length} onClick={() => void apply.run()}>{t('autoSeatApply')}</Button>
      <Button variant="ghost" onClick={onClose} disabled={apply.pending}>{t('cancel')}</Button>
    </>
  );

  return (
    <Dialog open onClose={onClose} variant="drawer" title={t('autoSeatTitle')} description={t('autoSeatHint')} className="as-sheet" dismissible={!apply.pending} footer={footer}>
      <div className="as-body">
        <Segmented label="نطاق التوزيع" size="sm" className="as-mode" value={mode} onChange={switchMode}
          options={[{ value: 'keep', label: t('autoSeatKeep') }, { value: 'redistribute', label: t('autoSeatAll') }]} />
        {apply.error ? <Banner tone="danger" compact>{errorMessage(apply.error)}</Banner> : null}

        {plan.moves.length === 0 && !plan.unplaced.length ? (
          <p className="as-empty"><Icon name="check-circle" />{t('autoSeatNothing')}</p>
        ) : (
          <p className="as-summary" aria-live="polite">
            {placed.size > 0 && <>{WILL[dialect]} <b className="num">{pluralOf(placed.size, P.invitation)}</b> ({people(plan.placedSeats)}) على <b className="num">{pluralOf(usedTables, tableWord)}</b>.</>}
            {takenOff.length > 0 && <> {OFF[dialect]} ({pluralOf(takenOff.length, P.invitation)}).</>}
          </p>
        )}

        {plan.shortfall && plan.shortfall.tables > 0 && (
          <Banner tone="warning" compact title={`${SHORT[dialect]} ${plural(plan.shortfall.seats, P.seat)}`}
            action={<Button size="sm" icon="plus" onClick={() => setExtra((n) => n + plan.shortfall!.tables)}>{t('autoSeatAddTables')} ({plan.shortfall.tables})</Button>}>
            {t('autoSeatSuggest').replace('{tables}', pluralOf(plan.shortfall.tables, tableWord)).replace('{seats}', plural(plan.shortfall.capacity, P.seat))} {t('autoSeatNewOnApply')}
          </Banner>
        )}
        {extra > 0 && (
          <p className="as-note t-sm"><Icon name="info" size="sm" />+{plural(extra, tableWord)} ({plural(capacity, P.seat)}). {t('autoSeatNewOnApply')}
            <button type="button" className="as-link" onClick={() => setExtra(0)}>{t('cancel')}</button></p>
        )}

        {legend.length > 0 && (
          <ul className="as-legend" aria-label="الجهات">
            {legend.map((g) => <li key={g || '-'}><span className={`as-dot grp-${tone(g)}`} aria-hidden="true" />{g || 'بلا جهة'}</li>)}
          </ul>
        )}

        <ol className="as-tables">
          {plan.tables.map((x) => <PlanTableCard key={x.id} x={x} byId={byId} placed={placed} moved={moved} tone={tone} selected={selected} onSelect={(id) => setSelected((cur) => (cur === id ? null : id))} newLabel={t('autoSeatNewTable')} keptLabel={t('autoSeatKept')} />)}
        </ol>

        {plan.unplaced.length > 0 && (
          <section className="as-section" aria-labelledby="as-unplaced">
            <h3 id="as-unplaced" className="as-h">{t('autoSeatUnplaced')} <span className="num faint">({plan.unplaced.length})</span></h3>
            <ul className="as-list">
              {plan.unplaced.map((u) => { const p = byId.get(u.partyId)!; return (
                <li key={u.partyId}><span className={`as-dot grp-${tone(groupOf(p))}`} aria-hidden="true" /><span className="grow"><b>{p.primaryGuestName}</b> <span className="faint">· {people(u.seats)}</span><br /><span className="t-sm as-reason">{u.reason === 'too_big' ? t('autoSeatTooBig') : t('autoSeatNoRoom')}</span></span></li>
              ); })}
            </ul>
          </section>
        )}
        {plan.excluded.length > 0 && (
          <section className="as-section" aria-labelledby="as-excluded">
            <h3 id="as-excluded" className="as-h">{t('autoSeatExcluded')} <span className="num faint">({plan.excluded.length})</span></h3>
            <ul className="as-list">
              {plan.excluded.map((id) => { const p = byId.get(id)!; return (
                <li key={id}><span className={`as-dot grp-${tone(groupOf(p))}`} aria-hidden="true" /><span className="grow"><b>{p.primaryGuestName}</b> <span className="faint">· {people(seatsFor(p))}</span></span>
                  <Button size="sm" variant="ghost" icon="undo" onClick={() => include(id)}>{t('autoSeatInclude')}</Button></li>
              ); })}
            </ul>
          </section>
        )}
      </div>
    </Dialog>
  );
}

function PlanTableCard({ x, byId, placed, moved, tone, selected, onSelect, newLabel, keptLabel }: {
  x: PlanTable; byId: Map<string, InvitationParty>; placed: Set<string>; moved: Set<string>; tone: (g: string) => number; selected: string | null;
  onSelect: (id: string) => void; newLabel: string; keptLabel: string;
}) {
  const fresh = x.partyIds.filter((id) => placed.has(id));
  // who already sat here (declined parties still on a table hold no seat, the page warns about them separately)
  const before = x.partyIds.filter((id) => !placed.has(id) && seatsFor(byId.get(id)!) > 0);
  const added = fresh.filter((id) => moved.has(id)).reduce((n, id) => n + seatsFor(byId.get(id)!), 0);
  const pct = (n: number) => `${Math.min(100, (n / Math.max(1, x.capacity)) * 100)}%`;
  return (
    <li className={`as-table${fresh.length ? '' : ' is-quiet'}${x.isNew ? ' is-new' : ''}`}>
      <header className="as-table-head">
        <h3 className="as-table-name">{x.name}{x.isNew && <Badge tone="info">{newLabel}</Badge>}</h3>
        <span className="as-table-count num">{x.used}/{x.capacity}{added > 0 && <span className="as-plus"> +{added}</span>}</span>
      </header>
      <div className="as-bar" role="img" aria-label={`${x.name}: ${x.used} من ${x.capacity}${added ? `، منها ${added} مقترحة` : ''}`}>
        <span className="as-bar-kept" style={{ width: pct(x.used - added) }} />
        <span className="as-bar-new" style={{ width: pct(added), insetInlineStart: pct(x.used - added) }} />
      </div>
      {before.length > 0 && <p className="as-kept t-xs">{keptLabel}: {before.map((id) => byId.get(id)!.primaryGuestName).join('، ')}</p>}
      {fresh.length > 0 && (
        <ul className="as-chips">
          {fresh.map((id) => { const p = byId.get(id)!; const g = groupOf(p); return (
            <li key={id}>
              <button type="button" className={`as-chip grp-${tone(g)}`} aria-pressed={selected === id} onClick={() => onSelect(id)}
                aria-label={`${p.primaryGuestName}، ${people(seatsFor(p))}${g ? `، ${g}` : ''}`}>
                <span className="as-chip-name">{p.primaryGuestName}</span><span className="as-chip-n num">{seatsFor(p)}</span>
              </button>
            </li>
          ); })}
        </ul>
      )}
    </li>
  );
}
