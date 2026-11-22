/**
 * Automatic seating (owner decision, FINAL_POLISH_PLAN §3): a SUGGESTION the organizer reviews before saving.
 *   1. An invitation party (guest + companions) always sits at ONE table — never split.
 *   2. Parties of the same side/section (party.side: أهل العريس، أهل العروس، الأصدقاء…) sit on adjacent tables.
 *   3. Tables fill in their order up to capacity before the next one opens, so empty seats do not scatter.
 * Only confirmed people count (seatsFor: the confirmed headcount, or the allowance when a confirmed reply carries
 * no count). Pending and declined parties are never seated.
 *
 * Heuristic (deterministic, direction-agnostic — no randomness, nothing depends on RTL/LTR or the script of a name):
 *   groups ordered by size (largest first, then name) · inside a group, parties largest first (first-fit decreasing) ·
 *   a party first tries the tables its group already held, then the table where the previous group stopped and the
 *   tables its group opened (in table order), then the next empty table · whatever is left is packed into any table with room, still in table order ·
 *   a party larger than every table, or with no room left, is reported as unplaced with its reason.
 */
import type { InvitationParty, Table } from './types';
import { seatsFor } from './parties';
import { nextTableName } from './seating';

export type AutoSeatMode = 'keep' | 'redistribute';
export type UnplacedReason = 'too_big' | 'no_room';
/** proposed tables are addressed as `new:<index>` until the plan is applied */
export const NEW_TABLE_PREFIX = 'new:';

export interface AutoSeatOptions {
  /** keep = only unseated parties are placed (default) · redistribute = every confirmed party is placed again */
  mode?: AutoSeatMode;
  /** left exactly as they are: not placed, and not moved if they already sit somewhere */
  excluded?: ReadonlySet<string>;
  /** the organizer moved these in the preview: party → table. Placed before the algorithm runs. */
  pinned?: ReadonlyMap<string, string>;
  /** tables the plan may add (they are created only when the plan is applied) */
  newTables?: ReadonlyArray<{ name: string; capacity: number }>;
}

export interface PlanTable {
  id: string;
  name: string;
  capacity: number;
  isNew: boolean;
  /** everyone the table holds after the plan, in seating order (kept parties first) */
  partyIds: string[];
  used: number;
  remaining: number;
  /** groups at this table, in the order they arrived */
  groups: string[];
}
export interface PlanMove { partyId: string; from: string | null; to: string | null; seats: number }
export interface PlanUnplaced { partyId: string; seats: number; reason: UnplacedReason }

export interface AutoSeatPlan {
  mode: AutoSeatMode;
  tables: PlanTable[];
  /** final table of every party the plan looked at (null = no table) */
  placement: Record<string, string | null>;
  /** only the parties whose table changes */
  moves: PlanMove[];
  unplaced: PlanUnplaced[];
  excluded: string[];
  /** parties that keep their current table (keep mode, arrived guests, excluded) */
  kept: string[];
  /** people the plan seats (newly or again) */
  placedSeats: number;
  /** what adding tables of `capacity` would solve; null when nothing is short of room */
  shortfall: { seats: number; tables: number; capacity: number } | null;
}

/** what the services layer applies atomically; `tables` is the table set the plan was computed against */
export interface AutoSeatApply {
  moves: PlanMove[];
  newTables: Array<{ name: string; capacity: number }>;
  tables: Array<{ id: string; capacity: number }>;
}
/** the exact inverse of an applied plan */
export interface AutoSeatUndo {
  moves: Array<{ partyId: string; from: string | null; to: string | null }>;
  deleteTableIds: string[];
}

const BIDI = /[‎‏‪-‮⁦-⁩]/g;
/** the side label as a grouping key: trimmed, spaces collapsed, invisible direction marks removed */
export const groupOf = (p: Pick<InvitationParty, 'side'>): string => (p.side ?? '').replace(BIDI, '').replace(/\s+/g, ' ').trim();
const byName = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0); // code-point order: identical on every device

/** groups by confirmed seats (largest first), then name; parties without a side come last */
export function groupOrder(parties: readonly InvitationParty[]): string[] {
  const size = new Map<string, number>();
  // groups with no confirmed people still get a stable place (used for their colour)
  for (const p of parties) size.set(groupOf(p), (size.get(groupOf(p)) ?? 0) + seatsFor(p));
  return [...size.keys()].sort((a, b) => (a === '' ? 1 : 0) - (b === '' ? 1 : 0) || size.get(b)! - size.get(a)! || byName(a, b));
}

/** the capacity new tables get: the event's most common table size (larger on a tie), 10 when there are no tables */
export function defaultTableCapacity(tables: readonly Pick<Table, 'capacity'>[]): number {
  const count = new Map<number, number>();
  for (const t of tables) count.set(t.capacity, (count.get(t.capacity) ?? 0) + 1);
  let best = 10, n = 0;
  for (const [cap, k] of count) if (k > n || (k === n && cap > best)) { best = cap; n = k; }
  return best;
}

/** names for `count` new tables that continue the event's numbering */
export function newTableNames(tables: readonly Pick<Table, 'name'>[], count: number): string[] {
  const names: Array<Pick<Table, 'name'>> = [...tables];
  const out: string[] = [];
  for (let i = 0; i < count; i++) { const name = nextTableName(names as Table[]); out.push(name); names.push({ name }); }
  return out;
}

export function planAutoSeating(tablesIn: readonly Table[], parties: readonly InvitationParty[], opts: AutoSeatOptions = {}, suggest = true): AutoSeatPlan {
  const mode = opts.mode ?? 'keep';
  const excluded = opts.excluded ?? new Set<string>();
  const pinned = opts.pinned ?? new Map<string, string>();
  const ordered = [...tablesIn].sort((a, b) => a.order - b.order || byName(a.id, b.id));
  const tables: PlanTable[] = [
    ...ordered.map((t) => ({ id: t.id, name: t.name, capacity: t.capacity, isNew: false, partyIds: [], used: 0, remaining: t.capacity, groups: [] })),
    ...(opts.newTables ?? []).map((t, i) => ({ id: `${NEW_TABLE_PREFIX}${i}`, name: t.name, capacity: t.capacity, isNew: true, partyIds: [], used: 0, remaining: t.capacity, groups: [] })),
  ];
  const byId = new Map(tables.map((t) => [t.id, t]));
  const placement: Record<string, string | null> = {};
  const put = (p: InvitationParty, t: PlanTable) => {
    const g = groupOf(p);
    t.partyIds.push(p.id); t.used += seatsFor(p); t.remaining = t.capacity - t.used;
    if (seatsFor(p) > 0 && !t.groups.includes(g)) t.groups.push(g);
    placement[p.id] = t.id;
  };

  // 1. what stays where it is
  const kept = new Set<string>();
  const toPlace: InvitationParty[] = [];
  for (const p of parties) {
    const current = p.tableId && byId.has(p.tableId) ? p.tableId : null;
    const placeable = p.rsvpStatus === 'confirmed' && seatsFor(p) > 0;
    const stays = current && (mode === 'keep' || excluded.has(p.id) || p.checkedInCount > 0);
    if (stays) { put(p, byId.get(current)!); kept.add(p.id); continue; }
    if (excluded.has(p.id)) continue;
    if (placeable) { toPlace.push(p); continue; }
    // redistribute: a pending or declined party still on a table is taken off it
    if (current) placement[p.id] = null;
  }

  // 2. the organizer's own moves in the preview, when they still fit
  const rest: InvitationParty[] = [];
  for (const p of toPlace) {
    const t = byId.get(pinned.get(p.id) ?? '');
    if (t && t.remaining >= seatsFor(p)) put(p, t); else rest.push(p);
  }

  // 3. groups in order, each party largest first
  const groups = groupOrder(rest);
  const members = new Map<string, InvitationParty[]>(groups.map((g) => [g, []]));
  for (const p of rest) members.get(groupOf(p))!.push(p);
  const firstFit = (need: number, candidates: (t: PlanTable) => boolean): PlanTable | undefined => tables.find((t) => candidates(t) && t.remaining >= need);
  const deferred: InvitationParty[] = [];
  const index = new Map(tables.map((t, i) => [t, i]));
  // tables a group already holds (kept or moved by the organizer) come first, so new members join them
  const home = new Map(groups.map((g) => [g, new Set(tables.filter((t) => t.groups.includes(g)))]));
  // the table where the previous group stopped: the next group fills its free seats before opening a new table
  let boundary: PlanTable | null = null;
  for (const g of groups) {
    const list = members.get(g)!.sort((a, b) => seatsFor(b) - seatsFor(a) || byName(a.primaryGuestName, b.primaryGuestName) || byName(a.id, b.id));
    const edge: PlanTable | null = boundary;
    let last: PlanTable | null = null;
    for (const p of list) {
      const need = seatsFor(p);
      const t: PlanTable | undefined = firstFit(need, (x) => home.get(g)!.has(x))
        ?? firstFit(need, (x) => x === edge || x.groups.includes(g)) ?? firstFit(need, (x) => x.used === 0);
      if (!t) { deferred.push(p); continue; }
      put(p, t);
      if (!last || index.get(t)! > index.get(last)!) last = t;
    }
    if (last) boundary = last;
  }

  // 4. remainders: the group's tables first, then any table with room, in table order
  const unplaced: PlanUnplaced[] = [];
  const largest = Math.max(0, ...tables.map((t) => t.capacity));
  for (const p of deferred) {
    const need = seatsFor(p), g = groupOf(p);
    const t = firstFit(need, (x) => x.groups.includes(g)) ?? firstFit(need, () => true);
    if (t) put(p, t);
    else { unplaced.push({ partyId: p.id, seats: need, reason: need > largest ? 'too_big' : 'no_room' }); placement[p.id] = null; }
  }

  // 5. what changes
  const moves: PlanMove[] = [];
  let placedSeats = 0;
  for (const p of parties) {
    if (!(p.id in placement) || kept.has(p.id)) continue;
    const from = p.tableId && byId.has(p.tableId) ? p.tableId : null;
    const to = placement[p.id] ?? null;
    if (to) placedSeats += seatsFor(p);
    if (from !== to) moves.push({ partyId: p.id, from, to, seats: seatsFor(p) });
  }
  const short = unplaced.filter((u) => u.reason === 'no_room');
  const seats = short.reduce((n, u) => n + u.seats, 0);
  return {
    mode, tables, placement, moves, unplaced, excluded: [...excluded].filter((id) => parties.some((p) => p.id === id)), kept: [...kept], placedSeats,
    shortfall: short.length && suggest ? { seats, ...suggestTables(tablesIn, parties, opts, seats) } : short.length ? { seats, tables: 0, capacity: defaultTableCapacity(tablesIn) } : null,
  };
}

/** how many MORE default-capacity tables leave nobody short of room (a party larger than a table is not solved by this) */
function suggestTables(tables: readonly Table[], parties: readonly InvitationParty[], opts: AutoSeatOptions, seats: number) {
  const capacity = defaultTableCapacity(tables);
  const already = opts.newTables ?? [];
  for (let n = Math.max(1, Math.ceil(seats / capacity)); n <= 60; n++) {
    const more = newTableNames([...tables, ...already], n).map((name) => ({ name, capacity }));
    const plan = planAutoSeating(tables, parties, { ...opts, newTables: [...already, ...more] }, false);
    if (!plan.unplaced.some((u) => u.reason === 'no_room')) return { tables: n, capacity };
  }
  return { tables: 0, capacity };
}

/** the service input for a reviewed plan */
export function applyInput(plan: AutoSeatPlan, tables: readonly Table[]): AutoSeatApply {
  return {
    moves: plan.moves.map((m) => ({ ...m })),
    newTables: plan.tables.filter((t) => t.isNew).map((t) => ({ name: t.name, capacity: t.capacity })),
    tables: tables.map((t) => ({ id: t.id, capacity: t.capacity })),
  };
}

/** a party's table in the preview, and the tables it could be moved to without going over capacity */
export function moveOptions(plan: AutoSeatPlan, party: InvitationParty): Array<{ table: PlanTable; fits: boolean; current: boolean }> {
  const need = seatsFor(party), at = plan.placement[party.id] ?? null;
  return plan.tables.map((t) => ({ table: t, current: t.id === at, fits: t.id === at || t.remaining >= need }));
}
