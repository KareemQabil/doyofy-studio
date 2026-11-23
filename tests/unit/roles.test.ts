// The role table (domain/roles) and its enforcement in the mock services: the UI hides, the data layer refuses.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { actorLabel, can, canManageGuests, canViewFood, FORBIDDEN_TEXT, OWNER_ONLY_NOTE, type Permission } from '../../src/domain/roles';
import type { Role } from '../../src/domain/types';

const ALL: Permission[] = ['guests.add', 'guests.edit', 'guests.share', 'guests.remind', 'guests.delete', 'guests.transfer', 'guests.export', 'seating', 'checkin', 'food', 'billing', 'event.archive'];
const allowed = (role: Role) => ALL.filter((a) => can(role, a)).sort();

before(() => {
  const mem = new Map<string, string>();
  (globalThis as unknown as { window: unknown }).window = { localStorage: { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) }, addEventListener() {} };
});

test('roles: owner does everything but the caterer food view, coordinator runs the guest work, caterer food only', () => {
  assert.deepEqual(allowed('organizer'), ALL.filter((a) => a !== 'food').sort());
  assert.deepEqual(allowed('coordinator'), ['checkin', 'guests.add', 'guests.edit', 'guests.remind', 'guests.share', 'seating']);
  assert.deepEqual(allowed('caterer'), ['food']);
  for (const a of ['guests.delete', 'guests.transfer', 'guests.export', 'billing', 'event.archive'] as const) {
    assert.equal(can('coordinator', a), false, a);
    assert.match(FORBIDDEN_TEXT[a], /صاحب المناسبة/, a);
  }
  assert.equal(canManageGuests('coordinator'), true);
  assert.equal(canManageGuests('caterer'), false);
  assert.equal(canViewFood('caterer'), true);
  assert.equal(canViewFood('organizer'), false);
  assert.equal(OWNER_ONLY_NOTE, 'متاح لصاحب المناسبة');
  assert.equal(actorLabel('coordinator'), 'المنسق');
  assert.equal(actorLabel('organizer'), null);
  assert.equal(actorLabel('gate'), null);
});

test('services: a coordinator adds, edits, shares, seats and checks in; owner-only actions are refused without writing', async () => {
  const { createServices } = await import('../../src/services/index');
  const { services: s, prototype } = createServices();
  prototype.update({ latencyMs: 0, role: 'coordinator' });
  const forbidden = (e: Error & { code?: string }) => e.code === 'forbidden' && /صاحب المناسبة/.test(e.message);

  const p = await s.parties.create('evt_wedding', { primaryGuestName: 'عائلة المنسق', phone: '0551203344', maxPartySize: 3 });
  await s.parties.update(p.id, { maxPartySize: 2 });
  await s.parties.markShared([p.id], 'manual');
  await s.rsvp.setByOrganizer(p.id, { attending: true, count: 2 });
  const [t] = await s.seating.listTables('evt_wedding');
  await s.seating.assign(p.id, t!.id);
  const ids = (await s.seating.listTables('evt_wedding')).map((x) => x.id);
  await s.seating.reorderTables('evt_wedding', [...ids].reverse());
  await s.checkIn.checkIn(p.id, 2, { method: 'search', by: 'test', exceptions: [] });

  await assert.rejects(s.parties.remove(p.id), forbidden);
  await assert.rejects(s.parties.transfer({ ids: [p.id], targetEventId: 'evt_katb', mode: 'copy' }), forbidden);
  await assert.rejects(s.events.archive('evt_wedding'), forbidden);
  assert.equal((await s.parties.get(p.id)).primaryGuestName, 'عائلة المنسق', 'refused delete wrote nothing');
  assert.equal((await s.events.get('evt_wedding')).archivedAt, undefined);

  // the activity log names the coordinator for staff actions, and the reception for arrivals
  const log = await s.activity.list('evt_wedding', 12);
  const mine = log.filter((a) => a.partyId === p.id);
  assert.ok(mine.some((a) => a.kind === 'party_added' && a.actor === 'coordinator'));
  assert.ok(mine.some((a) => a.kind === 'party_seated' && a.actor === 'coordinator'));
  assert.ok(mine.some((a) => a.kind === 'checked_in' && a.actor === 'gate'));

  prototype.update({ role: 'organizer' });
  await s.parties.update(p.id, { notes: 'من صاحبة المناسبة' });
  assert.equal((await s.activity.list('evt_wedding', 1))[0]!.actor, 'organizer');
});

test('services: the caterer cannot change guests, seating or arrivals', async () => {
  const { createServices } = await import('../../src/services/index');
  const { services: s, prototype } = createServices();
  prototype.update({ latencyMs: 0, role: 'caterer' });
  const refused = (e: Error & { code?: string }) => e.code === 'forbidden';
  const [p] = await s.parties.list('evt_wedding');
  await assert.rejects(s.parties.create('evt_wedding', { primaryGuestName: 'ضيف', maxPartySize: 1 }), refused);
  await assert.rejects(s.parties.update(p!.id, { notes: 'x' }), refused);
  await assert.rejects(s.seating.assign(p!.id, null), refused);
  await assert.rejects(s.checkIn.checkIn(p!.id, 1, { method: 'search', by: 'x', exceptions: [] }), refused);
  await assert.rejects(s.checkIn.recordWalkIn('evt_wedding', { name: 'زائر', count: 1 }), refused);
});

test('services: a walk-in at the gate is logged for the organizer without creating an invitation', async () => {
  const { createServices } = await import('../../src/services/index');
  const { services: s, prototype } = createServices();
  prototype.update({ latencyMs: 0, role: 'coordinator' });
  const before = (await s.parties.list('evt_wedding')).length;
  await assert.rejects(s.checkIn.recordWalkIn('evt_wedding', { name: '  ', count: 1 }), /اسم/);
  await s.checkIn.recordWalkIn('evt_wedding', { name: 'خالد  الزائر', count: 2, note: 'قال إنه من طرف العريس' });
  const [last] = await s.activity.list('evt_wedding', 1);
  assert.equal(last!.kind, 'check_in_walk_in');
  assert.equal(last!.actor, 'gate');
  assert.equal(last!.data.name, 'خالد الزائر');
  assert.equal((await s.parties.list('evt_wedding')).length, before);
});
