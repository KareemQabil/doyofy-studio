import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type { InvitationParty } from '../../src/domain/types';
import { arrivalOpen, canRemind, duplicateDestinationNames, guestNextAction, guestsCsv, isUnsent, phoneCell, remindHold, scopedGuests } from '../../src/domain/guest-tools';
import { activityText } from '../../src/domain/activity';
import { canViewFood } from '../../src/domain/roles';

beforeEach(() => {
  const memory = new Map<string, string>();
  (globalThis as unknown as { window: unknown }).window = { localStorage: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => void memory.set(key, value), removeItem: (key: string) => void memory.delete(key) }, addEventListener() {} };
});

test('guest export: tables and sections in one file, sorted by table then name, with a totals line', () => {
  const tables = [{ id: 't2', eventId: 'e1', name: 'طاولة 2', capacity: 10, order: 2 }, { id: 't1', eventId: 'e1', name: 'طاولة 1', capacity: 10, order: 1 }];
  const guests = [
    party({ id: 'a', primaryGuestName: 'ياسر', tableId: 't2', rsvpStatus: 'confirmed', confirmedPartySize: 2, maxPartySize: 2, side: 'أهل العريس' }),
    party({ id: 'b', primaryGuestName: 'بدر', tableId: 't1', rsvpStatus: 'confirmed', confirmedPartySize: 3, maxPartySize: 4, checkedInCount: 1 }),
    party({ id: 'c', primaryGuestName: 'أحمد', tableId: 't2', rsvpStatus: 'confirmed', confirmedPartySize: 1, maxPartySize: 1 }),
    party({ id: 'd', primaryGuestName: 'سعد', side: 'أهل العروس', maxPartySize: 3 }),
    party({ id: 'e', primaryGuestName: 'خالد', side: 'زملاء', maxPartySize: 2 }),
  ];
  // multi-scope: table 1 OR the bride's family
  const picked = scopedGuests(guests, 'pick', { tableIds: new Set(['t1']), groupNames: new Set(['أهل العروس']) });
  assert.deepEqual(picked.map((p) => p.id).sort(), ['b', 'd']);
  assert.equal(scopedGuests(guests, 'pick', { tableIds: new Set(), groupNames: new Set() }).length, 0);
  assert.deepEqual(scopedGuests(guests, 'pick', { tableIds: new Set(['none']), groupNames: new Set(['أهل العريس']) }).map((p) => p.id).sort(), ['a', 'd', 'e']);
  const lines = guestsCsv(guests, tables).replace(/^﻿/, '').split('\r\n');
  // header, 5 rows in table order (t1, then t2 by name, then no table by name), a blank line, the totals
  assert.deepEqual(lines.slice(1, 6).map((l) => l.split(',')[0]), ['بدر', 'أحمد', 'ياسر', 'خالد', 'سعد']);
  assert.equal(lines[6], '');
  const totals = lines[7]!.split(',');
  assert.equal(totals[0], 'الإجمالي: 5 دعوات');
  assert.equal(totals[2], '12', 'allowed seats summed');
  assert.equal(totals[4], 'أكدوا: 3 دعوات');
  assert.equal(totals[5], '6', 'confirmed people summed');
  assert.equal(totals[8], '1', 'arrived summed');
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
  // phones: spaced international format — text in every spreadsheet, no apostrophe, no invisible character
  const withPhones = guestsCsv(guests, [], true);
  assert.ok(withPhones.includes(',+966 55 512 3456,'), 'spaced international phone');
  assert.ok(!withPhones.includes("'+966") && !/[‎‏⁦-⁩]/.test(withPhones), 'no apostrophe, no bidi marks');
  assert.equal(phoneCell('+966555123456'), '+966 55 512 3456');
  assert.equal(phoneCell('0551234567'), '+966 55 123 4567', 'a local number is written in its international form');
  assert.equal(phoneCell('=HYPERLINK("x")'), '=HYPERLINK("x")', 'anything that is not a phone still goes through the formula guard');
  assert.ok(guestsCsv([party({ phone: '=cmd' })], [], true).includes("'=cmd"));
  // companions travel with the allowed seats
  const companions = guestsCsv([party({ maxPartySize: 3, companionNames: ['سارة', 'ليان'] })], []);
  assert.ok(companions.split('\r\n')[0]!.includes('العدد المسموح,المرافقون'));
  assert.ok(companions.includes('3,سارة، ليان,'));
});

test('next guest action follows reply/delivery/seating state and the event clock; food is caterer-only', () => {
  const phone = '+966555123456';
  // always live: there is no «publish first» step — a guest without a number needs one, then the invitation is sent
  assert.equal(guestNextAction(party(), true), 'phone');
  assert.equal(guestNextAction(party({ phone: '12' }), true), 'phone', 'an invalid number cannot be shared');
  assert.equal(guestNextAction(party({ phone }), true), 'share');
  assert.equal(guestNextAction(party({ phone, delivery: { status: 'shared' } }), true), 'remind');
  assert.equal(guestNextAction(party({ rsvpStatus: 'confirmed' }), true), 'seat');
  // before the event day a confirmed, seated guest needs nothing extra; arrival opens on the day
  assert.equal(guestNextAction(party({ rsvpStatus: 'confirmed', tableId: 't1' }), true), 'details');
  assert.equal(guestNextAction(party({ rsvpStatus: 'confirmed', tableId: 't1' }), true, true), 'arrival');
  assert.equal(guestNextAction(party({ rsvpStatus: 'confirmed' }), false), 'details');
  assert.equal(guestNextAction(party({ rsvpStatus: 'confirmed' }), false, true), 'arrival');
  assert.equal(guestNextAction(party({ rsvpStatus: 'confirmed', checkInStatus: 'checked_in', checkedInCount: 2, tableId: 't1' }), true, true), 'details');
  assert.equal(guestNextAction(party({ rsvpStatus: 'declined' }), true), 'details');
  assert.equal(guestNextAction(party({ rsvpStatus: 'declined', tableId: 't1' }), true), 'unseat');
  assert.equal(guestNextAction(party({ rsvpStatus: 'declined', tableId: 't1' }), true, true), 'unseat');
  assert.equal(isUnsent(party()), true); assert.equal(isUnsent(party({ delivery: { status: 'failed' } })), true); assert.equal(isUnsent(party({ delivery: { status: 'shared' } })), false);
  const ev = { date: '2026-12-01', time: '20:00', timeZone: 'Asia/Riyadh', durationHours: 5 } as Parameters<typeof arrivalOpen>[0];
  assert.equal(arrivalOpen(ev, new Date('2026-11-22T12:00:00Z')), false, 'nine days before: no arrival yet');
  assert.equal(arrivalOpen(ev, new Date('2026-11-30T20:30:00Z')), false, 'the evening before (23:30 Riyadh)');
  assert.equal(arrivalOpen(ev, new Date('2026-11-30T21:30:00Z')), true, 'just after midnight in Riyadh on the day');
  assert.equal(arrivalOpen(ev, new Date('2026-12-03T12:00:00Z')), true, 'after the event: late arrivals can still be recorded');
  assert.equal(canViewFood('organizer'), false); assert.equal(canViewFood('coordinator'), false); assert.equal(canViewFood('caterer'), true);
  assert.deepEqual(duplicateDestinationNames([party({ primaryGuestName: 'ادم' })], [party()]), ['ادم']);
});

test('reply reminders wait 48 h after the invitation was sent or the family was last reminded', () => {
  const now = new Date('2026-11-22T12:00:00Z');
  const ago = (h: number) => new Date(now.getTime() - h * 3600_000).toISOString();
  const sentLongAgo = party({ phone: '0551234567', delivery: { status: 'shared', source: 'manual', at: ago(24 * 10) } });
  assert.equal(remindHold(sentLongAgo, now), null);
  assert.equal(canRemind(sentLongAgo, now), true);
  assert.equal(guestNextAction(sentLongAgo, false, false, now), 'remind');
  // just sent: no reminder yet, the card says when it was sent
  const justSent = party({ phone: '0551234567', delivery: { status: 'shared', source: 'manual', at: ago(1) } });
  assert.deepEqual(remindHold(justSent, now), { kind: 'sent', at: ago(1) });
  assert.equal(canRemind(justSent, now), false);
  assert.equal(guestNextAction(justSent, false, false, now), 'wait');
  assert.equal(guestNextAction(justSent, false), 'remind', 'without a clock the action stays as before');
  // reminded an hour ago: held, and the latest contact is the reminder
  const reminded = party({ phone: '0551234567', delivery: { status: 'opened', source: 'platform', at: ago(24 * 10), openedAt: ago(24 * 9), reminderAt: ago(1) } });
  assert.deepEqual(remindHold(reminded, now), { kind: 'reminded', at: ago(1) });
  assert.equal(canRemind(reminded, now), false);
  assert.equal(guestNextAction(reminded, false, false, now), 'wait');
  // after the hold the family can be reminded again; replied or unsent invitations never can
  const later = new Date(now.getTime() + 48 * 3600_000);
  assert.equal(canRemind(reminded, later), true);
  assert.equal(canRemind(party({ delivery: { status: 'not_shared' } }), now), false);
  assert.equal(canRemind(party({ rsvpStatus: 'confirmed', delivery: { status: 'opened', at: ago(24 * 10) } }), now), false);
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
  assert.ok((await s.activity.list(source.id)).some((a) => activityText(a) === `نُسخت دعوة واحدة إلى «${target.title}»`));
  assert.ok((await s.activity.list(target.id)).some((a) => activityText(a, 'ar-EG') === `دعوة واحدة اتنسخت من «${source.title}»`));
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
  // the activity log says where they went (never «deleted»), and the destination says where they came from
  const lines = async (id: string, d: 'ar' | 'ar-EG' | 'ar-SA' = 'ar') => (await s.activity.list(id)).map((a) => activityText(a, d));
  assert.ok((await lines(source.id)).includes(`نُقلت دعوة نقل آمن إلى «${target.title}»`));
  assert.ok((await lines(source.id, 'ar-EG')).includes(`دعوة نقل آمن اتنقلت لـ«${target.title}»`));
  assert.ok((await lines(source.id, 'ar-SA')).includes(`انتقلت دعوة نقل آمن إلى «${target.title}»`));
  assert.ok(!(await lines(source.id)).some((l) => /حذف|حُذف/.test(l)), 'a moved guest is never logged as deleted');
  assert.ok((await lines(target.id)).includes(`انتقلت دعوة واحدة من «${source.title}»`));
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
