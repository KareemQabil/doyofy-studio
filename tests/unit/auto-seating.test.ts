import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type { EventActivity, InvitationParty, Table } from '../../src/domain/types';
import { nextTableName } from '../../src/domain/seating';
import { arrivalTotals } from '../../src/domain/checkin';
import { applyInput, defaultTableCapacity, groupOf, groupOrder, moveOptions, newTableNames, planAutoSeating, type AutoSeatPlan } from '../../src/domain/auto-seating';
import { seatsFor } from '../../src/domain/parties';

beforeEach(() => {
  const memory = new Map<string, string>();
  (globalThis as unknown as { window: unknown }).window = { localStorage: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => void memory.set(key, value), removeItem: (key: string) => void memory.delete(key) }, addEventListener() {} };
});

let n = 0;
const party = (size: number, side: string, patch: Partial<InvitationParty> = {}): InvitationParty => {
  n += 1;
  return { id: `p${String(n).padStart(3, '0')}`, eventId: 'e1', code: `C${n}`, primaryGuestName: `ضيف ${n}`, maxPartySize: size, side, delivery: { status: 'opened' },
    rsvpStatus: 'confirmed', confirmedPartySize: size, checkInStatus: 'not_arrived', checkedInCount: 0, source: 'manual', createdAt: '', updatedAt: '', ...patch };
};
const tables = (...caps: number[]): Table[] => caps.map((capacity, i) => ({ id: `t${i + 1}`, eventId: 'e1', name: `طاولة ${i + 1}`, capacity, order: i + 1 }));
const at = (plan: AutoSeatPlan, id: string) => plan.placement[id] ?? null;
const used = (plan: AutoSeatPlan) => plan.tables.map((t) => t.used);
const tableIndex = (plan: AutoSeatPlan, id: string) => plan.tables.findIndex((t) => t.id === at(plan, id));

test('a party (guest + companions) is never split: one table holds its whole headcount', () => {
  const ps = [party(5, 'أ'), party(4, 'أ'), party(3, 'ب'), party(6, 'ب'), party(2, 'ج'), party(1, 'ج')];
  const plan = planAutoSeating(tables(8, 8, 8), ps);
  for (const p of ps) {
    const holders = plan.tables.filter((t) => t.partyIds.includes(p.id));
    assert.equal(holders.length, 1, p.primaryGuestName);
  }
  assert.equal(plan.tables.reduce((s, t) => s + t.used, 0), ps.reduce((s, p) => s + seatsFor(p), 0));
});

test('capacity is respected on every table', () => {
  const ps = Array.from({ length: 30 }, (_, i) => party((i % 5) + 1, ['أ', 'ب', 'ج'][i % 3]!));
  const plan = planAutoSeating(tables(10, 10, 12, 10, 8, 10, 10, 10, 10), ps);
  for (const t of plan.tables) assert.ok(t.used <= t.capacity, `${t.name}: ${t.used}/${t.capacity}`);
});

test('tables fill in order before the next opens; the empty seats collect at the end', () => {
  const ps = [party(4, ''), party(3, ''), party(3, ''), party(2, ''), party(2, '')];
  const plan = planAutoSeating(tables(10, 10, 10), ps);
  assert.deepEqual(used(plan), [10, 4, 0]);
});

test('each group sits on adjacent tables, the larger group first', () => {
  const groom = [party(5, 'أهل العريس'), party(5, 'أهل العريس'), party(4, 'أهل العريس'), party(4, 'أهل العريس'), party(2, 'أهل العريس')]; // 20
  const bride = [party(4, 'أهل العروس'), party(3, 'أهل العروس'), party(3, 'أهل العروس')]; // 10
  const friends = [party(2, 'الأصدقاء'), party(2, 'الأصدقاء'), party(1, 'الأصدقاء')]; // 5
  const plan = planAutoSeating(tables(10, 10, 10, 10), [...friends, ...bride, ...groom]);
  const runOf = (ps: InvitationParty[]) => [...new Set(ps.map((p) => tableIndex(plan, p.id)))].sort((a, b) => a - b);
  assert.deepEqual(runOf(groom), [0, 1]);
  assert.deepEqual(runOf(bride), [2]);
  assert.deepEqual(runOf(friends), [3]);
  for (const ps of [groom, bride, friends]) { const r = runOf(ps); assert.equal(r[r.length - 1]! - r[0]!, r.length - 1, 'contiguous'); }
});

test('the next group starts in the free seats where the previous group stopped', () => {
  const a = [party(4, 'أ'), party(4, 'أ'), party(4, 'أ')]; // 12 → table 1 full (8) + 4 on table 2
  const b = [party(5, 'ب'), party(3, 'ب')]; // 5 does not fit the 4 free seats → opens table 3; 3 fills table 2
  const plan = planAutoSeating(tables(8, 8, 8), [...a, ...b]);
  assert.deepEqual(used(plan), [8, 7, 5]);
  assert.equal(tableIndex(plan, b[1]!.id), 1, 'small party fills the boundary table');
  assert.equal(tableIndex(plan, b[0]!.id), 2);
});

test('a party larger than any table is unplaced with its reason; lack of room is reported separately with a table suggestion', () => {
  const big = party(12, 'أ');
  const ps = [big, party(6, 'ب'), party(6, 'ب'), party(5, 'ج')];
  const plan = planAutoSeating(tables(10, 10), ps);
  assert.deepEqual(plan.unplaced.find((u) => u.partyId === big.id), { partyId: big.id, seats: 12, reason: 'too_big' });
  const noRoom = plan.unplaced.filter((u) => u.reason === 'no_room');
  assert.equal(noRoom.length, 1);
  assert.equal(plan.shortfall?.tables, 1);
  assert.equal(plan.shortfall?.capacity, 10);
  // applying the suggestion seats everyone who fits a table
  const more = planAutoSeating(tables(10, 10), ps, { newTables: newTableNames(tables(10, 10), 1).map((name) => ({ name, capacity: 10 })) });
  assert.deepEqual(more.unplaced.map((u) => u.reason), ['too_big']);
  assert.equal(more.tables[2]!.name, 'طاولة 3');
  assert.equal(more.tables[2]!.isNew, true);
  assert.equal(more.shortfall, null);
});

test('only confirmed people are seated: pending and declined never are; a confirmed reply without a count uses the allowance', () => {
  const pending = party(3, 'أ', { rsvpStatus: 'pending', confirmedPartySize: undefined });
  const declined = party(3, 'أ', { rsvpStatus: 'declined', confirmedPartySize: undefined });
  const noCount = party(4, 'أ', { confirmedPartySize: undefined });
  const fewer = party(5, 'أ', { confirmedPartySize: 2 });
  const plan = planAutoSeating(tables(10), [pending, declined, noCount, fewer]);
  assert.equal(at(plan, pending.id), null);
  assert.equal(at(plan, declined.id), null);
  assert.equal(plan.tables[0]!.used, 6);
  assert.ok(!plan.moves.some((m) => m.partyId === pending.id || m.partyId === declined.id));
});

test('keep mode (default) seats only unseated parties and never moves seated ones; redistribute places everyone again', () => {
  const seated = party(4, 'أ', { tableId: 't2' });
  const declinedSeated = party(2, 'ب', { rsvpStatus: 'declined', confirmedPartySize: undefined, tableId: 't1' });
  const fresh = [party(3, 'أ'), party(5, 'ب')];
  const keep = planAutoSeating(tables(8, 8), [seated, declinedSeated, ...fresh]);
  assert.equal(keep.mode, 'keep');
  assert.equal(at(keep, seated.id), 't2');
  assert.ok(keep.kept.includes(seated.id) && keep.kept.includes(declinedSeated.id));
  assert.ok(!keep.moves.some((m) => m.partyId === seated.id));
  assert.equal(at(keep, fresh[0]!.id), 't2', 'joins its group');
  const all = planAutoSeating(tables(8, 8), [seated, declinedSeated, ...fresh], { mode: 'redistribute' });
  assert.equal(at(all, declinedSeated.id), null, 'a declined party is taken off its table');
  assert.ok(all.moves.some((m) => m.partyId === declinedSeated.id && m.to === null));
  assert.ok(!all.kept.includes(seated.id));
  assert.equal(new Set([at(all, seated.id), at(all, fresh[0]!.id)]).size, 1, 'group re-seated together');
});

test('redistribute keeps arrived guests where they are; excluded parties are left exactly as they are', () => {
  const arrived = party(3, 'أ', { tableId: 't2', checkedInCount: 3, checkInStatus: 'checked_in' });
  const out = party(2, 'أ', { tableId: 't1' });
  const wait = party(4, 'ب');
  const plan = planAutoSeating(tables(6, 6), [arrived, out, wait], { mode: 'redistribute', excluded: new Set([out.id, wait.id]) });
  assert.equal(at(plan, arrived.id), 't2');
  assert.equal(at(plan, out.id), 't1');
  assert.equal(at(plan, wait.id), null);
  assert.deepEqual(plan.moves, []);
  assert.deepEqual(plan.excluded.sort(), [out.id, wait.id].sort());
});

test('preview moves are pinned: the moved party goes where the organizer put it, others stay put', () => {
  const ps = [party(4, 'أ'), party(4, 'أ'), party(3, 'ب'), party(2, 'ب')];
  const first = planAutoSeating(tables(8, 8, 8), ps);
  const target = moveOptions(first, ps[3]!).find((o) => !o.current && o.fits && o.table.id === 't3')!;
  assert.ok(target, 'an empty table is a valid destination');
  const pins = new Map(Object.entries(first.placement).filter(([, t]) => t) as Array<[string, string]>);
  pins.set(ps[3]!.id, 't3');
  const moved = planAutoSeating(tables(8, 8, 8), ps, { pinned: pins });
  assert.equal(at(moved, ps[3]!.id), 't3');
  for (const p of ps.slice(0, 3)) assert.equal(at(moved, p.id), at(first, p.id));
  const full = moveOptions(first, ps[2]!).find((o) => o.table.id === 't1')!;
  assert.equal(full.fits, false, 'a full table is not offered as fitting');
});

test('the plan is deterministic and does not depend on input order or text direction marks', () => {
  const ps = Array.from({ length: 24 }, (_, i) => party((i * 7) % 5 + 1, ['أهل العريس', 'أهل العروس', 'الأصدقاء', ''][i % 4]!));
  const a = planAutoSeating(tables(10, 10, 10, 10, 10, 10), ps);
  const b = planAutoSeating(tables(10, 10, 10, 10, 10, 10).reverse().map((t, i, all) => ({ ...t, order: all.length - i })), [...ps].reverse());
  assert.deepEqual(a.placement, b.placement);
  const marked = ps.map((p) => ({ ...p, side: p.side ? `‏ ${p.side}‎ ` : p.side }));
  assert.deepEqual(planAutoSeating(tables(10, 10, 10, 10, 10, 10), marked).placement, a.placement);
  assert.equal(groupOf({ side: '⁧ أهل  العروس ⁩' }), 'أهل العروس');
  // Latin labels and names behave the same as Arabic ones
  const latin = ps.map((p) => ({ ...p, side: p.side ? { 'أهل العريس': 'Groom', 'أهل العروس': 'Bride', 'الأصدقاء': 'Friends' }[p.side] : '' }));
  assert.deepEqual(used(planAutoSeating(tables(10, 10, 10, 10, 10, 10), latin)), used(a));
});

test('group order and default capacity helpers', () => {
  const ps = [party(2, 'ب'), party(5, 'أ'), party(1, ''), party(9, '')];
  assert.deepEqual(groupOrder(ps), ['أ', 'ب', ''], 'parties without a side come last');
  assert.equal(defaultTableCapacity(tables(12, 10, 10)), 10);
  assert.equal(defaultTableCapacity(tables(8, 12)), 12);
  assert.equal(defaultTableCapacity([]), 10);
  assert.deepEqual(newTableNames(tables(10, 10), 2), ['طاولة 3', 'طاولة 4']);
});

test('apply input carries the table snapshot, the moves and the proposed tables', () => {
  const ps = [party(6, 'أ'), party(6, 'ب')];
  const ts = tables(8);
  const plan = planAutoSeating(ts, ps, { newTables: [{ name: 'طاولة 2', capacity: 8 }] });
  const input = applyInput(plan, ts);
  assert.deepEqual(input.tables, [{ id: 't1', capacity: 8 }]);
  assert.deepEqual(input.newTables, [{ name: 'طاولة 2', capacity: 8 }]);
  assert.deepEqual(input.moves.map((m) => m.to).sort(), ['new:0', 't1']);
});

// ------------------------------------------------------------------ services: atomic apply, stale data, undo
async function fixtures() {
  const { createServices } = await import('../../src/services/index');
  const { services: s, prototype } = createServices(); prototype.update({ latencyMs: 0 });
  const date = new Date(s.clock.now().getTime() + 864e5 * 30).toISOString().slice(0, 10);
  const ev = await s.events.create({ type: 'wedding', names: { a: 'أ', b: 'ب' }, date, time: '20:00', venue: { name: 'قاعة', city: 'الرياض' } });
  const made = [];
  for (const [name, size, side] of [['عائلة ١', 5, 'أهل العريس'], ['عائلة ٢', 4, 'أهل العريس'], ['عائلة ٣', 3, 'أهل العروس'], ['صديق', 2, 'الأصدقاء']] as const) {
    const p = await s.parties.create(ev.id, { primaryGuestName: name, maxPartySize: size, side });
    await s.rsvp.setByOrganizer(p.id, { attending: true, count: size });
    made.push(p);
  }
  const ts = await s.seating.createTables(ev.id, [{ name: 'طاولة 1', capacity: 8 }, { name: 'طاولة 2', capacity: 8 }]);
  return { s, prototype, ev, made, ts };
}

test('service applies a plan atomically, creates proposed tables, and undo restores the exact previous state', async () => {
  const { s, ev, ts } = await fixtures();
  const before = await s.parties.list(ev.id);
  const plan = planAutoSeating(ts, before, { newTables: [{ name: 'طاولة 3', capacity: 8 }] });
  const { undo, tables: created } = await s.seating.applyAutoSeating(ev.id, applyInput(plan, ts));
  assert.equal(created.length, 1);
  const after = await s.parties.list(ev.id);
  assert.ok(after.every((p) => p.tableId), 'everyone seated');
  assert.equal((await s.seating.listTables(ev.id)).length, 3);
  await s.seating.undoAutoSeating(ev.id, undo);
  assert.deepEqual((await s.parties.list(ev.id)).map((p) => p.tableId ?? null), before.map((p) => p.tableId ?? null));
  assert.equal((await s.seating.listTables(ev.id)).length, 2, 'the created table is removed again');
});

test('stale plans are refused without any partial write', async () => {
  const { s, ev, made, ts } = await fixtures();
  const parties = await s.parties.list(ev.id);
  const plan = planAutoSeating(ts, parties);
  // a party was seated by hand after the preview opened
  await s.seating.assign(made[3]!.id, ts[1]!.id);
  await assert.rejects(s.seating.applyAutoSeating(ev.id, applyInput(plan, ts)), (e: unknown) => (e as { code?: string }).code === 'conflict');
  const now = await s.parties.list(ev.id);
  assert.deepEqual(now.filter((p) => p.tableId).map((p) => p.id), [made[3]!.id], 'nothing else changed');
  // a reply changed (now declined)
  const plan2 = planAutoSeating(ts, now);
  await s.rsvp.setByOrganizer(made[0]!.id, { attending: false, count: 0 });
  await assert.rejects(s.seating.applyAutoSeating(ev.id, applyInput(plan2, ts)), /تغيّر/);
  // a table was resized
  const plan3 = planAutoSeating(ts, await s.parties.list(ev.id));
  await s.seating.updateTable(ts[0]!.id, { capacity: 2 });
  await assert.rejects(s.seating.applyAutoSeating(ev.id, applyInput(plan3, ts)), /الطاولات/);
  assert.equal((await s.parties.list(ev.id)).filter((p) => p.tableId).length, 1);
  assert.equal((await s.seating.listTables(ev.id)).length, 2);
});

test('a forged plan that overfills a table or seats an unconfirmed party is refused', async () => {
  const { s, ev, made, ts } = await fixtures();
  const moves = made.map((p) => ({ partyId: p.id, from: null, to: ts[0]!.id, seats: p.maxPartySize }));
  await assert.rejects(s.seating.applyAutoSeating(ev.id, { moves, newTables: [], tables: ts.map((t) => ({ id: t.id, capacity: t.capacity })) }), /السعة/);
  const pending = await s.parties.create(ev.id, { primaryGuestName: 'لم يرد', maxPartySize: 1 });
  await assert.rejects(s.seating.applyAutoSeating(ev.id, { moves: [{ partyId: pending.id, from: null, to: ts[0]!.id, seats: 1 }], newTables: [], tables: ts.map((t) => ({ id: t.id, capacity: t.capacity })) }), /تغيّر/);
  assert.equal((await s.parties.list(ev.id)).filter((p) => p.tableId).length, 0);
});

test('undo is refused when seating changed after applying, and the caterer cannot apply', async () => {
  const { s, prototype, ev, made, ts } = await fixtures();
  const plan = planAutoSeating(ts, await s.parties.list(ev.id), { newTables: [{ name: 'طاولة 3', capacity: 8 }] });
  const { undo } = await s.seating.applyAutoSeating(ev.id, applyInput(plan, ts));
  await s.seating.assign(made[0]!.id, null);
  await assert.rejects(s.seating.undoAutoSeating(ev.id, undo), /تغيّر/);
  assert.equal((await s.seating.listTables(ev.id)).length, 3, 'nothing was undone');
  prototype.update({ role: 'caterer' });
  await assert.rejects(s.seating.applyAutoSeating(ev.id, applyInput(planAutoSeating(ts, await s.parties.list(ev.id)), ts)), (e: unknown) => (e as { code?: string }).code === 'forbidden');
});

test('default table names follow the voice only when created; arrivals count walk-ins and let-in exceptions', () => {
  assert.equal(nextTableName(tables(10, 10)), 'طاولة 3');
  assert.equal(nextTableName(tables(10, 10), 'ترابيزة {n}'), 'ترابيزة 3');
  assert.deepEqual(newTableNames(tables(10, 10), 2, 'ترابيزة {n}'), ['ترابيزة 3', 'ترابيزة 4']);
  const p = (rsvpStatus: 'confirmed' | 'declined', checkedInCount: number) => ({ rsvpStatus, checkedInCount }) as InvitationParty;
  const walkIn = { kind: 'check_in_walk_in', data: { count: 2 } } as unknown as EventActivity;
  assert.deepEqual(arrivalTotals([p('confirmed', 3), p('declined', 1)], [walkIn]), { people: 6, special: 3 });
});

test('the activity log counts the invitations the suggestion seats, as the sheet and the toast do', () => {
  const ts = tables(10, 10);
  const plan = { placement: { a: ts[0]!.id, b: ts[0]!.id, c: ts[1]!.id }, kept: ['c'], moves: [], tables: [] } as unknown as AutoSeatPlan;
  assert.equal(applyInput(plan, ts).seated, 2, 'placed parties that were not kept, including any that stay where they were');
});
