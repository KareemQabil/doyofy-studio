import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type { InvitationParty } from '../../src/domain/types';
import { arrivalOpen, duplicateDestinationNames, guestNextAction, guestsCsv, isUnsent, phoneCell, scopedGuests } from '../../src/domain/guest-tools';
import { canViewFood } from '../../src/domain/roles';

beforeEach(() => {
  const memory = new Map<string, string>();
  (globalThis as unknown as { window: unknown }).window = { localStorage: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => void memory.set(key, value), removeItem: (key: string) => void memory.delete(key) }, addEventListener() {} };
});

const party = (patch: Partial<InvitationParty> = {}): InvitationParty => ({ id: 'p1', eventId: 'e1', code: 'AAAAA', primaryGuestName: 'آدم', maxPartySize: 2, delivery: { status: 'not_shared' }, rsvpStatus: 'pending', checkInStatus: 'not_arrived', checkedInCount: 0, source: 'manual', createdAt: '', updatedAt: '', ...patch });

test('guest export respects selection/table/group scopes and prevents spreadsheet formula execution', () => {
  const guests = [party({ primaryGuestName: '=1+1', phone: '+966555123456', side: 'أصدقاء', tableId: 't1', notes: 'private', dietary: { answered: true, needs: ['nuts'] } }), party({ id: 'p2', side: 'عائلة' })];
  assert.deepEqual(scopedGuests(guests, 'selected', { selectedIds: new Set(['p2']) }).map((p) => p.id), ['p2']);
  assert.deepEqual(scopedGuests(guests, 'table', { tableId: 'none' }).map((p) => p.id), ['p2']);
  assert.deepEqual(scopedGuests(guests, 'group', { group: 'أصدقاء' }).map((p) => p.id), ['p1']);
  assert.deepEqual(scopedGuests(guests, 'table', { tableIds: new Set(['t1', 'none']) }).map((p) => p.id), ['p1', 'p2']);
  assert.deepEqual(scopedGuests(guests, 'group', { groupNames: new Set(['أصدقاء', 'عائلة']) }).map((p) => p.id), ['p1', 'p2']);
  assert.equal(scopedGuests(guests, 'table', { tableIds: new Set() }).length, 0);
  const csv = guestsCsv(guests, []);
  assert.ok(csv.includes("'=1+1"));
  assert.ok(!csv.includes('+966555123456') && !csv.includes('private') && !csv.includes('nuts'));
  // phones: text-safe without a visible apostrophe — a left-to-right mark in front, never a leading + or '
  const withPhones = guestsCsv(guests, [], true);
  assert.ok(withPhones.includes(',‎+966555123456,'));
  assert.ok(!withPhones.includes("'+966"));
  assert.equal(phoneCell('+966555123456'), '‎+966555123456');
  assert.equal(phoneCell('=HYPERLINK("x")'), '=HYPERLINK("x")', 'anything that is not a phone still goes through the formula guard');
  assert.ok(guestsCsv([party({ phone: '=cmd' })], [], true).includes("'=cmd"));
  // companions travel with the allowed seats
  const companions = guestsCsv([party({ maxPartySize: 3, companionNames: ['سارة', 'ليان'] })], []);
  assert.ok(companions.split('\r\n')[0]!.includes('العدد المسموح,المرافقون'));
  assert.ok(companions.includes('3,سارة، ليان,'));
});

test('next guest action follows reply/delivery/seating state and the event clock; food is caterer-only', () => {
  const phone = '+966555123456';
  assert.equal(guestNextAction(party(), 'draft', true), 'publish');
  assert.equal(guestNextAction(party(), 'published', true), 'phone');
  assert.equal(guestNextAction(party({ phone: '12' }), 'published', true), 'phone', 'an invalid number cannot be shared');
  assert.equal(guestNextAction(party({ phone }), 'published', true), 'share');
  assert.equal(guestNextAction(party({ phone, delivery: { status: 'shared' } }), 'published', true), 'remind');
  assert.equal(guestNextAction(party({ rsvpStatus: 'confirmed' }), 'published', true), 'seat');
  // before the event day a confirmed, seated guest needs nothing extra; arrival opens on the day
  assert.equal(guestNextAction(party({ rsvpStatus: 'confirmed', tableId: 't1' }), 'published', true), 'details');
  assert.equal(guestNextAction(party({ rsvpStatus: 'confirmed', tableId: 't1' }), 'published', true, true), 'arrival');
  assert.equal(guestNextAction(party({ rsvpStatus: 'confirmed' }), 'published', false), 'details');
  assert.equal(guestNextAction(party({ rsvpStatus: 'confirmed' }), 'published', false, true), 'arrival');
  assert.equal(guestNextAction(party({ rsvpStatus: 'confirmed', checkInStatus: 'checked_in', checkedInCount: 2, tableId: 't1' }), 'published', true, true), 'details');
  assert.equal(guestNextAction(party({ rsvpStatus: 'declined' }), 'published', true), 'details');
  assert.equal(guestNextAction(party({ rsvpStatus: 'declined', tableId: 't1' }), 'published', true), 'unseat');
  assert.equal(guestNextAction(party({ rsvpStatus: 'declined', tableId: 't1' }), 'published', true, true), 'unseat');
  assert.equal(isUnsent(party()), true); assert.equal(isUnsent(party({ delivery: { status: 'failed' } })), true); assert.equal(isUnsent(party({ delivery: { status: 'shared' } })), false);
  const ev = { date: '2026-12-01', time: '20:00', timeZone: 'Asia/Riyadh', durationHours: 5 } as Parameters<typeof arrivalOpen>[0];
  assert.equal(arrivalOpen(ev, new Date('2026-11-22T12:00:00Z')), false, 'nine days before: no arrival yet');
  assert.equal(arrivalOpen(ev, new Date('2026-11-30T20:30:00Z')), false, 'the evening before (23:30 Riyadh)');
  assert.equal(arrivalOpen(ev, new Date('2026-11-30T21:30:00Z')), true, 'just after midnight in Riyadh on the day');
  assert.equal(arrivalOpen(ev, new Date('2026-12-03T12:00:00Z')), true, 'after the event: late arrivals can still be recorded');
  assert.equal(canViewFood('organizer'), false); assert.equal(canViewFood('coordinator'), false); assert.equal(canViewFood('caterer'), true);
  assert.deepEqual(duplicateDestinationNames([party({ primaryGuestName: 'ادم' })], [party()]), ['ادم']);
});

async function fixtures() {
  const { createServices } = await import('../../src/services/index');
  const { services: s, prototype } = createServices(); prototype.update({ latencyMs: 0 });
  const date = new Date(s.clock.now().getTime() + 864e5 * 30).toISOString().slice(0, 10);
  const source = await s.events.create({ type: 'birthday', names: { a: 'أول' }, date, time: '20:00', venue: { name: 'قاعة', city: 'الرياض' } });
  const target = await s.events.create({ type: 'birthday', names: { a: 'ثان' }, date, time: '20:00', venue: { name: 'قاعة', city: 'الرياض' } });
  return { s, source, target };
}

test('event copy creates a fresh invitation and duplicate rejection is atomic', async () => {
  const { s, source, target } = await fixtures();
  const p = await s.parties.create(source.id, { primaryGuestName: 'ضيف واحد', maxPartySize: 2, phone: '0551234567' });
  await s.rsvp.setByOrganizer(p.id, { attending: true, count: 2 });
  const [table] = await s.seating.createTables(source.id, [{ name: 'الأسرة', capacity: 10 }]);
  await s.seating.assign(p.id, table!.id);
  await s.parties.markShared([p.id], 'manual');
  const [copy] = await s.parties.transfer({ ids: [p.id], targetEventId: target.id, mode: 'copy' });
  assert.notEqual(copy!.id, p.id); assert.equal(copy!.rsvpStatus, 'pending'); assert.equal(copy!.delivery.status, 'not_shared'); assert.equal(copy!.tableId, undefined);
  assert.equal((await s.parties.get(p.id)).rsvpStatus, 'confirmed');
  const second = await s.parties.create(source.id, { primaryGuestName: 'ضيف ثان', maxPartySize: 1 });
  await assert.rejects(s.parties.transfer({ ids: [second.id, p.id], targetEventId: target.id, mode: 'move' }), /موجودون بالفعل/);
  assert.equal((await s.parties.list(target.id)).length, 1); assert.equal((await s.parties.list(source.id)).length, 2);
});

test('event move cleans source response history, rejects checked-in moves and quota overflow atomically', async () => {
  const { s, source, target } = await fixtures();
  const p = await s.parties.create(source.id, { primaryGuestName: 'نقل آمن', maxPartySize: 1 });
  await s.rsvp.setByOrganizer(p.id, { attending: true, count: 1 });
  await s.parties.transfer({ ids: [p.id], targetEventId: target.id, mode: 'move' });
  assert.equal((await s.parties.list(source.id)).length, 0); assert.equal((await s.rsvp.listResponses(source.id)).length, 0);
  const arrived = await s.parties.create(source.id, { primaryGuestName: 'وصل', maxPartySize: 1 });
  await s.checkIn.checkIn(arrived.id, 1, { method: 'search', by: 'test', exceptions: [] });
  await assert.rejects(s.parties.transfer({ ids: [arrived.id], targetEventId: target.id, mode: 'move' }), /سُجّل وصوله/);
  await s.parties.importMany(target.id, Array.from({ length: 4 }, (_, i) => ({ primaryGuestName: `عائلة ${i}`, maxPartySize: 20 })), { skipped: 0, source: 'test' });
  await s.parties.create(target.id, { primaryGuestName: 'عائلة أخيرة', maxPartySize: 19 });
  const extra = await s.parties.create(source.id, { primaryGuestName: 'فوق الباقة', maxPartySize: 1 });
  await assert.rejects(s.parties.transfer({ ids: [extra.id], targetEventId: target.id, mode: 'move' }), (e: unknown) => (e as { name?: string }).name === 'GuestLimitError');
  assert.ok((await s.parties.list(source.id)).some((p) => p.id === extra.id));
});

test('table order is persisted and stale/foreign reorder never partly mutates', async () => {
  const { s, source, target } = await fixtures();
  const tables = await s.seating.createTables(source.id, [{ name: 'أ', capacity: 10 }, { name: 'ب', capacity: 10 }, { name: 'ج', capacity: 10 }]);
  const ids = tables.map((t) => t.id).reverse();
  await s.seating.reorderTables(source.id, ids);
  assert.deepEqual((await s.seating.listTables(source.id)).map((t) => t.id), ids);
  await assert.rejects(s.seating.reorderTables(source.id, [ids[0]!, ids[0]!, ids[2]!]), /تغيّرت/);
  await assert.rejects(s.seating.reorderTables(source.id, ids.slice(1)), /تغيّرت/);
  assert.deepEqual((await s.seating.listTables(source.id)).map((t) => t.id), ids);
  const foreign = await s.parties.create(target.id, { primaryGuestName: 'مناسبة أخرى', maxPartySize: 1 });
  await s.rsvp.setByOrganizer(foreign.id, { attending: true, count: 1 });
  await assert.rejects(s.seating.assign(foreign.id, tables[0]!.id), /المناسبة نفسها/);
});
