// Meals, dietary needs and wishlist (F047–F071; acceptance T27–T39): rules in the domain, then through the mock service.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY_EXPERIENCE, checkAnswers, cleanAnswers, csvCell, dietaryReport, foodCsv, mealReport, safeExternalUrl, validateDietary, validateMeals, validatePolicy,
} from '../../src/domain/guest-experience';
import type { GuestExperience, InvitationParty } from '../../src/domain/types';

before(() => {
  const mem = new Map<string, string>();
  (globalThis as unknown as { window: unknown }).window = { localStorage: { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) }, addEventListener() {} };
});

const X = (over: Partial<GuestExperience['meals']> = {}): GuestExperience => ({
  ...EMPTY_EXPERIENCE, revision: 3,
  meals: { enabled: true, required: false, options: [{ id: 'm', label: 'لحم' }, { id: 'f', label: 'سمك' }, { id: 'v', label: 'نباتي' }], ...over },
  dietary: { enabled: true },
});
const party = (id: string, size: number, extra: Partial<InvitationParty> = {}): InvitationParty => ({
  id, eventId: 'e', code: id, primaryGuestName: id, maxPartySize: size, delivery: { status: 'opened' }, rsvpStatus: 'confirmed', confirmedPartySize: size,
  checkInStatus: 'not_arrived', checkedInCount: 0, source: 'seed', createdAt: '', updatedAt: '', ...extra,
});

test('T28–T30: a family of 4 splits meals per person; required must cover everyone, optional leaves «بلا اختيار»', () => {
  const four = [{ optionId: 'm', count: 2 }, { optionId: 'f', count: 1 }, { optionId: 'v', count: 1 }];
  assert.equal(validateMeals(X({ required: true }), 4, four), null);
  assert.equal(validateMeals(X({ required: true }), 4, four.slice(0, 2)), 'sum_mismatch');
  assert.equal(validateMeals(X({ required: true }), 4, [{ optionId: 'm', count: 4 }, { optionId: 'f', count: 1 }]), 'sum_over');
  assert.equal(validateMeals(X(), 4, [{ optionId: 'm', count: 1.5 }]), 'not_whole');
  assert.equal(validateMeals(X(), 4, [{ optionId: 'm', count: -1 }]), 'not_whole');
  assert.equal(validateMeals(X(), 4, [{ optionId: 'm', count: 1 }, { optionId: 'm', count: 1 }]), 'duplicate');
  assert.equal(validateMeals(X(), 4, four.slice(0, 2)), null);
  const r = mealReport(X(), [party('a', 4, { meals: four.slice(0, 2) })]);
  assert.deepEqual(r.rows.map((x) => x.people), [2, 1, 0]);
  assert.equal(r.unspecified, 1);
  assert.equal(r.specified + r.unspecified, r.confirmedPeople);
});

test('T27: food off asks nothing and stores nothing; a decline never keeps food (invariant 5)', () => {
  assert.equal(validateMeals(EMPTY_EXPERIENCE, 4, [{ optionId: 'zzz', count: 9 }]), null);
  assert.deepEqual(cleanAnswers(EMPTY_EXPERIENCE, { attending: true, count: 2, meals: [{ optionId: 'm', count: 2 }], dietary: { answered: true, needs: ['nuts'] } }), { meals: undefined, dietary: undefined });
  assert.deepEqual(cleanAnswers(X(), { attending: false, count: 0, meals: [{ optionId: 'm', count: 2 }] }), { meals: undefined, dietary: undefined });
  const kept = cleanAnswers(X(), { attending: true, count: 3, meals: [{ optionId: 'm', count: 0 }, { optionId: 'f', count: 2 }], dietary: { answered: true, needs: ['vegan', 'nuts'], affectedCount: 1, note: '  ' } });
  assert.deepEqual(kept.meals, [{ optionId: 'f', count: 2 }]);
  assert.deepEqual(kept.dietary, { answered: true, needs: ['nuts', 'vegan'], affectedCount: 1, note: undefined });
});

test('T31: «nothing to note» and «not answered» are different; the affected count stays within the party', () => {
  const rep = dietaryReport([
    party('none', 2, { dietary: { answered: true, needs: [] } }),
    party('silent', 2),
    party('nuts', 3, { dietary: { answered: true, needs: ['nuts'], affectedCount: 1 } }),
    party('veg', 2, { dietary: { answered: true, needs: ['vegetarian'] } }),
    party('declined', 2, { rsvpStatus: 'declined', confirmedPartySize: 0, dietary: { answered: true, needs: ['dairy'] } }),
  ]);
  assert.equal(rep.answeredNone, 1);
  assert.equal(rep.notAnswered, 1);
  assert.deepEqual(rep.entries.map((e) => e.partyId), ['nuts', 'veg']);
  assert.deepEqual(rep.byNeed.find((b) => b.need === 'vegetarian'), { need: 'vegetarian', parties: 1, people: 0, unknownPeople: 1 });
  assert.equal(validateDietary(2, { answered: true, needs: ['nuts'], affectedCount: 3 }), 'affected_range');
  assert.equal(validateDietary(2, { answered: true, needs: ['other'] }), 'other_needs_note');
});

test('T32/T33: a headcount lowered under the meal split is flagged for review, archived options keep their history', () => {
  const x = X();
  x.meals.options[1]!.archived = true;
  const r = mealReport(x, [party('a', 2, { meals: [{ optionId: 'm', count: 3 }] }), party('b', 2, { meals: [{ optionId: 'f', count: 2 }] })]);
  assert.deepEqual(r.review.map((p) => p.partyId), ['a']);
  assert.equal(r.rows.find((row) => row.id === 'f')?.people, 2);
  assert.equal(r.rows.find((row) => row.id === 'f')?.archived, true);
  assert.equal(r.rows.find((row) => row.id === 'm')?.people, 0);
  assert.equal(r.unspecified, 2);
  assert.equal(validateMeals(x, 2, [{ optionId: 'f', count: 2 }]), 'unknown_option');
});

test('T17: an answer given against an older policy passes when it still fits, and is a conflict when it does not', () => {
  const x = X();
  assert.deepEqual(checkAnswers(x, { attending: true, count: 2, meals: [{ optionId: 'm', count: 2 }], expectedExperienceRevision: 2 }), { ok: true });
  x.meals.options[0]!.archived = true;
  const c = checkAnswers(x, { attending: true, count: 2, meals: [{ optionId: 'm', count: 2 }], expectedExperienceRevision: 2 });
  assert.equal(c.ok, false);
  assert.equal(!c.ok && c.conflict, true);
});

test('T39: only complete https links are accepted for wishes', () => {
  assert.equal(safeExternalUrl('https://shop.example.com/w?id=1'), 'https://shop.example.com/w?id=1');
  for (const bad of ['javascript:alert(1)', 'data:text/html,<b>x</b>', 'http://shop.example.com', '//evil.com', 'shop.example.com', 'https://user:pw@shop.example.com', 'https://localhost/x', ' ']) assert.equal(safeExternalUrl(bad), null, bad);
  const problem = validatePolicy({ ...X(), gifts: { enabled: true, afterDecline: false, items: [{ id: 'g', kind: 'gift', title: 'ساعة', url: 'javascript:alert(1)' }] } });
  assert.equal(problem?.field, 'gifts');
  assert.equal(validatePolicy({ ...X(), meals: { enabled: true, required: false, options: [{ id: 'a', label: 'لحم' }, { id: 'b', label: 'لحم ' }] } })?.field, 'meals');
});

test('T36: the export neutralises formulas and matches the screen totals', () => {
  assert.equal(csvCell('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`);
  assert.equal(csvCell('+966'), `'+966`);
  assert.equal(csvCell('عادي'), 'عادي');
  const csv = foodCsv(X(), [party('=cmd', 3, { meals: [{ optionId: 'm', count: 2 }], dietary: { answered: true, needs: [] } })], () => 'طاولة 1', 'now');
  const lines = csv.split('\r\n');
  assert.equal(lines.length, 3);
  assert.ok(lines[2]!.startsWith(`'=cmd,طاولة 1,3,2,0,0,1,لا شيء`), lines[2]);
});

test('service: host saves a menu, guest answers once, organizer sees totals; general-link answers move on match', async () => {
  const { createServices } = await import('../../src/services/index');
  const { services: s, prototype } = createServices();
  prototype.update({ latencyMs: 0, offline: false });
  prototype.reset('before');
  const ev = await s.events.get('evt_wedding');
  const x = ev.guestExperience!;
  assert.ok(x.meals.enabled && x.gifts.enabled);

  // a stale save from another tab is refused
  await assert.rejects(s.events.updateExperience(ev.id, x, x.revision - 1), (e: Error & { code?: string }) => e.code === 'conflict');
  // removing an answered option archives it instead (T33)
  const { revision: _r, ...draft } = x;
  draft.meals = { ...draft.meals, options: draft.meals.options.filter((o) => o.id !== 'meal_fish') };
  const saved = (await s.events.updateExperience(ev.id, draft, x.revision)).guestExperience!;
  assert.equal(saved.revision, x.revision + 1);
  assert.equal(saved.meals.options.find((o) => o.id === 'meal_fish')?.archived, true);

  const pending = (await s.parties.list(ev.id)).find((p) => p.rsvpStatus === 'pending' && p.maxPartySize >= 4)!;
  const view = await s.guest.open(ev.slug, pending.code);
  assert.ok(!view.experience!.meals.options.some((o) => o.id === 'meal_fish'), 'archived options are hidden from guests');
  // a guest still holding the old menu gets a conflict, not a silent swap
  await assert.rejects(s.guest.submitRsvp(ev.slug, pending.code, { attending: true, count: 4, meals: [{ optionId: 'meal_fish', count: 1 }], expectedExperienceRevision: x.revision }), (e: Error & { code?: string }) => e.code === 'conflict');
  await s.guest.submitRsvp(ev.slug, pending.code, { attending: true, count: 4, meals: [{ optionId: 'meal_meat', count: 2 }, { optionId: 'meal_veg', count: 1 }], dietary: { answered: true, needs: ['dairy'], affectedCount: 1 }, expectedExperienceRevision: saved.revision });
  let p = await s.parties.get(pending.id);
  assert.deepEqual(p.meals, [{ optionId: 'meal_meat', count: 2 }, { optionId: 'meal_veg', count: 1 }]);
  assert.equal(p.experienceRevision, saved.revision);
  // changing the reply to a decline clears food
  await s.guest.submitRsvp(ev.slug, pending.code, { attending: false, count: 0 });
  p = await s.parties.get(pending.id);
  assert.equal(p.meals, undefined);
  assert.equal(p.dietary, undefined);

  // general link: provisional until matched, then counted once on the party (T34)
  const before = mealReport(saved, await s.parties.list(ev.id), await s.rsvp.listResponses(ev.id));
  assert.equal(before.provisional.people, 5);
  const target = (await s.parties.list(ev.id)).find((x2) => x2.rsvpStatus === 'pending' && x2.maxPartySize >= 2)!;
  await s.rsvp.matchResponse('rsp_g1', target.id);
  const after = mealReport(saved, await s.parties.list(ev.id), await s.rsvp.listResponses(ev.id));
  assert.equal(after.provisional.people, 3);
  assert.equal(after.rows.find((r) => r.id === 'meal_meat')!.people, before.rows.find((r) => r.id === 'meal_meat')!.people + 1);
  assert.deepEqual((await s.parties.get(target.id)).meals, [{ optionId: 'meal_meat', count: 1 }, { optionId: 'meal_fish', count: 1 }]);
});
