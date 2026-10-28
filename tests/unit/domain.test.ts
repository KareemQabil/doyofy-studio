import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { InvitationParty, Table } from '../../src/domain/types';
import { normalisePhone } from '../../src/domain/phone';
import { applyRsvp, countParties, duplicatePhoneIds, invitationStatus, searchParties, validateRsvp } from '../../src/domain/parties';
import { checkAssign, occupancy, seatingWarnings } from '../../src/domain/seating';
import { assessCheckIn, codeFromScan, statusAfter } from '../../src/domain/checkin';
import { SAMPLE_IMPORT_CSV, guessMapping, parseDelimited, reviewImport, rowsToPartyInputs, summarise, toRawTable } from '../../src/domain/import';
import { plural, pluralOf, P, people, peopleOf, countdownLabel, zonedToInstant, offsetString } from '../../src/domain/format';
import { publishState } from '../../src/domain/invitation';

const party = (o: Partial<InvitationParty> = {}): InvitationParty => ({
  id: o.id ?? 'p1', eventId: 'e', code: o.code ?? 'ABCDE', primaryGuestName: 'عائلة الحربي', maxPartySize: 4,
  delivery: { status: 'not_shared' }, rsvpStatus: 'pending', checkInStatus: 'not_arrived', checkedInCount: 0,
  source: 'manual', createdAt: '', updatedAt: '', ...o,
});

test('phone: Saudi/Egypt local formats, Arabic digits, Excel numbers, malformed', () => {
  assert.deepEqual(normalisePhone('0551234567'), { ok: true, e164: '+966551234567' });
  assert.deepEqual(normalisePhone('٠٥٥١٢٣٤٥٦٧'), { ok: true, e164: '+966551234567' });
  assert.deepEqual(normalisePhone('+966 55 123 4567'), { ok: true, e164: '+966551234567' });
  assert.deepEqual(normalisePhone('00966551234567'), { ok: true, e164: '+966551234567' });
  assert.deepEqual(normalisePhone('551234567'), { ok: true, e164: '+966551234567' });          // Excel dropped the 0
  assert.deepEqual(normalisePhone('966551234567.0'), { ok: true, e164: '+966551234567' });
  assert.deepEqual(normalisePhone('01012345678'), { ok: true, e164: '+201012345678' });
  assert.equal(normalisePhone('05512').ok, false);
  assert.equal(normalisePhone('').ok, false);
  assert.equal(normalisePhone('abc').ok, false);
});

test('headcount is derived from confirmed party sizes, not invitations', () => {
  const ps = [
    party({ id: 'a', rsvpStatus: 'confirmed', confirmedPartySize: 3, maxPartySize: 4 }),
    party({ id: 'b', rsvpStatus: 'confirmed', confirmedPartySize: 2, maxPartySize: 2 }),
    party({ id: 'c', rsvpStatus: 'declined', confirmedPartySize: 0 }),
    party({ id: 'd' }),
  ];
  const c = countParties(ps);
  assert.equal(c.parties, 4);
  assert.equal(c.confirmedParties, 2);
  assert.equal(c.confirmedPeople, 5);
  assert.equal(c.pendingParties, 1);
  assert.equal(c.maxSeats, 14);
});

test('RSVP bounded by allowance; declining keeps the table (flagged, not cleared)', () => {
  assert.equal(validateRsvp({ attending: true, count: 5 }, 4), 'count_exceeds_allowed');
  assert.equal(validateRsvp({ attending: true, count: 0 }, 4), 'count_too_low');
  assert.equal(validateRsvp({ attending: false, count: 0 }, 4), null);
  const p = applyRsvp(party({ tableId: 't1', rsvpStatus: 'confirmed', confirmedPartySize: 2 }), { attending: false, count: 0 }, 'now');
  assert.equal(p.rsvpStatus, 'declined');
  assert.equal(p.tableId, 't1');
  assert.equal(seatingWarnings([], [p]).declinedAssigned.length, 1);
});

test('delivery state is separate from RSVP; draft/ready derive from publish state', () => {
  const p = party();
  assert.equal(invitationStatus(p, 'draft'), 'draft');
  assert.equal(invitationStatus(p, 'published'), 'ready');
  assert.equal(invitationStatus(party({ delivery: { status: 'opened' }, rsvpStatus: 'pending' }), 'published'), 'opened');
  assert.equal(publishState(null), 'none');
});

test('duplicates and Arabic-aware search', () => {
  const ps = [party({ id: 'a', phone: '+966551234567' }), party({ id: 'b', phone: '+966551234567', primaryGuestName: 'أم تركي' }), party({ id: 'c', primaryGuestName: 'منى القحطاني' })];
  assert.deepEqual([...duplicatePhoneIds(ps)].sort(), ['a', 'b']);
  assert.equal(searchParties(ps, 'مني').length, 1);      // ى/ي and missing hamza are equivalent
  assert.equal(searchParties(ps, 'ام تركي').length, 1);
  assert.equal(searchParties(ps, '0551234567').length, 2);
});

test('seating: occupancy, over capacity, does-not-fit', () => {
  const t: Table[] = [{ id: 't1', eventId: 'e', name: 'طاولة 1', capacity: 4, order: 1 }];
  const ps = [party({ id: 'a', rsvpStatus: 'confirmed', confirmedPartySize: 3, tableId: 't1' }), party({ id: 'b', rsvpStatus: 'confirmed', confirmedPartySize: 2 })];
  const occ = occupancy(t, ps);
  assert.equal(occ[0]!.used, 3);
  assert.equal(occ[0]!.remaining, 1);
  const chk = checkAssign(ps[1]!, occ[0]!);
  assert.equal(chk.ok, false);
  assert.equal(!chk.ok && chk.reason, 'does_not_fit');
  assert.equal(checkAssign(party({ id: 'c' }), occ[0]!).ok, false);
  assert.equal(seatingWarnings(t, ps).unassigned.length, 1);
});

test('check-in: partial 2/4 then 2 later = complete; exceptions need decisions', () => {
  let p = party({ rsvpStatus: 'confirmed', confirmedPartySize: 4, tableId: 't1' });
  assert.deepEqual(assessCheckIn(p).exceptions, []);
  p = { ...p, checkedInCount: 2, checkInStatus: statusAfter(p, 2) };
  assert.equal(p.checkInStatus, 'partial');
  assert.equal(assessCheckIn(p).remaining, 2);
  assert.equal(statusAfter(p, 4), 'checked_in');
  const done = { ...p, checkedInCount: 4, checkInStatus: 'checked_in' as const };
  assert.ok(assessCheckIn(done).exceptions.includes('already_complete'));
  assert.ok(assessCheckIn(party({ rsvpStatus: 'declined' })).exceptions.includes('declined_arrived'));
  assert.ok(assessCheckIn(party({ rsvpStatus: 'confirmed', confirmedPartySize: 2, maxPartySize: 4, tableId: 't' }), 3).exceptions.includes('over_confirmed'));
  assert.ok(assessCheckIn(party({ rsvpStatus: 'confirmed', confirmedPartySize: 4, maxPartySize: 4, tableId: 't' }), 5).exceptions.includes('over_allowed'));
  assert.ok(assessCheckIn(party({ rsvpStatus: 'confirmed', confirmedPartySize: 2 })).exceptions.includes('no_table'));
});

test('QR payloads → party code', () => {
  assert.equal(codeFromScan('http://x/i/noura-faisal/K7Q2M'), 'K7Q2M');
  assert.equal(codeFromScan('https://doyofy.app/i/a-b/k7q2m?x=1'), 'K7Q2M');
  assert.equal(codeFromScan('DOYOFY:K7Q2M'), 'K7Q2M');
  assert.equal(codeFromScan('k7q2m'), 'K7Q2M');
  assert.equal(codeFromScan('hello world'), null);
});

test('import: sample file states — duplicate in file, duplicate in list, missing name, malformed phone, missing phone', () => {
  const t = toRawTable(parseDelimited(SAMPLE_IMPORT_CSV));
  assert.equal(t.hadHeader, true);
  assert.equal(t.rows.length, 21);
  const mapping = guessMapping(t);
  assert.deepEqual(mapping, ['name', 'phone', 'size', 'side', 'notes']);
  const existing = [party({ phone: '+966551234567' })];
  const rows = reviewImport({ table: t, mapping, edits: {}, decisions: {}, existing, defaultSize: 2 });
  const by = (code: string) => rows.filter((r) => r.issues.some((i) => i.code === code)).map((r) => r.index);
  assert.deepEqual(by('duplicate_in_file'), [7]);
  assert.deepEqual(by('duplicate_existing'), [20]);
  assert.deepEqual(by('missing_name'), [12]);
  assert.deepEqual(by('malformed_phone'), [15]);
  assert.deepEqual(by('missing_phone'), [18]);
  let s = summarise(rows);
  assert.equal(s.blocked, 4);          // duplicates need an explicit decision too
  assert.equal(s.toImport, 17);
  // resolve: skip the in-file duplicate, import the other duplicate anyway, fix a name, drop the bad phone
  const rows2 = reviewImport({ table: t, mapping, edits: { 12: { name: 'رنا العتيبي' } }, decisions: { 7: 'skip', 20: 'import', 15: 'import_without_phone' }, existing, defaultSize: 2 });
  s = summarise(rows2);
  assert.equal(s.blocked, 0);
  assert.equal(s.skipped, 1);
  assert.equal(s.toImport, 20);
  assert.equal(rowsToPartyInputs(rows2).length, 20);
  assert.equal(rowsToPartyInputs(rows2).find((r) => r.primaryGuestName === 'تركي العنزي')?.phone, undefined);
});

test('import: headerless paste is detected by content', () => {
  const t = toRawTable(parseDelimited('سارة\t0551112233\t2\nأحمد\t0552223344\t1'));
  assert.equal(t.hadHeader, false);
  assert.deepEqual(guessMapping(t).slice(0, 3), ['name', 'phone', 'size']);
});

test('Arabic plurals and time zones', () => {
  assert.equal(people(1), 'شخص واحد');
  assert.equal(people(2), 'شخصان');
  assert.equal(people(4), '4 أشخاص');
  assert.equal(people(11), '11 شخصًا');
  assert.equal(plural(3, P.invitation), '3 دعوات');
  // oblique dual after prepositions / possessives / as an object
  assert.equal(peopleOf(2), 'شخصين');
  assert.equal(pluralOf(2, P.table), 'طاولتين');
  assert.equal(pluralOf(2, P.invitation), 'دعوتين');
  assert.equal(pluralOf(2, P.seat), 'مقعدين');
  assert.equal(pluralOf(3, P.table), '3 طاولات');
  assert.equal(countdownLabel('2026-10-06', '2026-10-04'), 'بعد يومين');
  assert.equal(offsetString('2026-10-13', '21:00', 'Asia/Riyadh'), '+03:00');
  assert.equal(zonedToInstant('2026-10-13', '21:00', 'Asia/Riyadh').toISOString(), '2026-10-13T18:00:00.000Z');
});

// ------------------------------------------------------------------ UI/UX iteration: occasions + template presets
import { EVENT_TYPES, OCCASIONS_ORDERED, OCCASION_GROUPS, validateEssentials as validate } from '../../src/domain/event';
import { TEMPLATE_PRESETS, applyPreset, presetOf, presetsFor } from '../../src/domain/templates';
import { CARD_NAMES, SCENE_NAMES, defaultDesign } from '../../src/domain/invitation';

test('occasions: more than four, every one grouped, popular first, one catalogue for both choosers', () => {
  assert.ok(EVENT_TYPES.length >= 12);
  assert.equal(new Set(EVENT_TYPES.map((t) => t.id)).size, EVENT_TYPES.length);
  for (const t of EVENT_TYPES) assert.ok(OCCASION_GROUPS.some((g) => g.id === t.group), `${t.id} has a group`);
  for (const g of OCCASION_GROUPS) assert.ok(EVENT_TYPES.some((t) => t.group === g.id), `${g.id} is not empty`);
  assert.deepEqual(new Set(OCCASIONS_ORDERED.map((t) => t.id)), new Set(EVENT_TYPES.map((t) => t.id)));
  const firstNonPopular = OCCASIONS_ORDERED.findIndex((t) => !t.popular);
  assert.ok(OCCASIONS_ORDERED.slice(firstNonPopular).every((t) => !t.popular));
  // the name field is named after the occasion
  const e = validate({ type: 'conference', names: { a: '' }, date: '2099-01-01', time: '10:00', venue: { name: 'x', city: 'y' } }, '2026-01-01');
  assert.equal(e.a, 'اكتب اسم المؤتمر');
});

test('template presets use real engine assets and only valid experiences', () => {
  assert.ok(TEMPLATE_PRESETS.length >= 10);
  assert.equal(new Set(TEMPLATE_PRESETS.map((p) => p.id)).size, TEMPLATE_PRESETS.length);
  for (const p of TEMPLATE_PRESETS) {
    assert.ok(p.cardId in CARD_NAMES, `${p.id} card`);
    assert.ok(p.sceneId in SCENE_NAMES, `${p.id} setting`);
    assert.equal(p.experience.dimension, '2d', `${p.id}: settings are flat`);
    assert.ok(p.styles.length && p.occasionTags.length);
  }
});

test('a template changes only the look — names, message and program are kept', () => {
  const ev = { type: 'wedding', names: { a: 'لينا', b: 'عمر' }, time: '20:00' } as never;
  const mine = { ...defaultDesign(ev), displayNames: { a: 'لين' }, message: { ar: 'نصي', en: 'mine' }, program: [{ time: '21:00', ar: 'العشاء', en: 'Dinner' }] };
  const p = TEMPLATE_PRESETS.find((x) => x.experience.dimension === '2d')!;
  const next = applyPreset(mine, p);
  assert.equal(next.cardId, p.cardId); assert.equal(next.sceneId, p.sceneId); assert.deepEqual(next.experience, p.experience);
  assert.deepEqual(next.displayNames, mine.displayNames); assert.deepEqual(next.message, mine.message); assert.deepEqual(next.program, mine.program);
  assert.equal(presetOf(next)?.id, p.id);
  assert.equal(presetOf({ ...next, cardId: 'clay', sceneId: 'desert' }), undefined);
});

test('gallery order: presets that suit the occasion come first, nothing is lost or repeated', () => {
  for (const t of EVENT_TYPES) {
    const { suited, rest } = presetsFor(t.id);
    assert.equal(suited.length + rest.length, TEMPLATE_PRESETS.length, t.id);
    assert.equal(new Set([...suited, ...rest].map((p) => p.id)).size, TEMPLATE_PRESETS.length);
    assert.ok(suited.every((p) => p.occasionTags.includes(t.id)));
    assert.ok(suited.length >= 1, `${t.id} has at least one suited preset`);
  }
});
