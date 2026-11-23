import assert from 'node:assert/strict';
import test from 'node:test';
import { COPY_GROUPS, copyFor, countOf, fill, parseDialect, type CopyKey } from '../../src/domain/copy';
import { countdownLabel, formatTime, relativeTime } from '../../src/domain/format';
import { activityText } from '../../src/domain/activity';
import { mappingProblems } from '../../src/domain/import';
import { dietaryLabel } from '../../src/domain/guest-experience';
import type { EventActivity } from '../../src/domain/types';
import { currentStrings } from '../../src/data/strings.js';

const groups = Object.entries(COPY_GROUPS);
const DIALECTS = ['ar-EG', 'ar-SA'] as const;
/** the screens a guest or a first-time organizer sees first: every key is spelled in every voice */
const HIGH_VISIBILITY = ['home', 'create', 'guests', 'seating', 'guest', 'engine',
  // r4-copy2: the remaining screens, the domain-built lines, and the groups upgraded from `partly`
  'import', 'experienceSettings', 'auth', 'time', 'activity', 'overview', 'eventPages', 'food', 'shared', 'gate', 'settings', 'billing', 'replies',
  // fix2-organizer: the shared UI primitives and the service-layer messages
  'ui', 'errors'] as const;

test('copy: every key has a modern value, keys are unique across groups, dialects only use known keys', () => {
  const seen = new Map<string, string>();
  for (const [name, g] of groups) {
    for (const [k, v] of Object.entries(g.modern)) {
      assert.ok(typeof v === 'string' && v.trim().length > 0, `${name}.${k} has a modern value`);
      assert.ok(!seen.has(k), `${k} is defined in both ${seen.get(k)} and ${name}`);
      seen.set(k, name);
    }
    for (const d of DIALECTS) for (const k of Object.keys(g[d])) assert.ok(k in g.modern, `${name}.${d}.${k} has a modern key`);
  }
  // an unknown stored voice falls back to modern Arabic, and a missing dialect variant falls back to the modern word
  assert.equal(parseDialect('fr'), 'ar');
  const modern = copyFor('ar');
  for (const d of DIALECTS) for (const k of Object.keys(modern) as CopyKey[]) assert.ok(copyFor(d)[k], `${d}.${k} resolves`);
});

test('copy: high-visibility groups are written in every voice, with the same slots', () => {
  for (const name of HIGH_VISIBILITY) {
    const g = COPY_GROUPS[name];
    assert.ok(g.full, `${name} is a voiced group`);
    for (const d of DIALECTS) for (const [k, v] of Object.entries(g.modern)) {
      const dv = (g[d] as Record<string, string | undefined>)[k];
      assert.ok(dv && dv.trim(), `${name}.${d}.${k} is written`);
      const slots = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
      assert.equal(slots(dv!), slots(v), `${name}.${d}.${k} keeps the slots of the modern string`);
    }
  }
});

test('copy: each voice keeps its own words (glossary) and the modern voice stays free of colloquialisms', () => {
  const ar = copyFor('ar'), eg = copyFor('ar-EG'), sa = copyFor('ar-SA');
  // modern Arabic: no colloquial words anywhere in the dictionary
  const COLLOQUIAL = /(?:^|[\s«(])(?:تستاهل|عشان|دلوقتي|الحين|مش|مو|إيه|وش|بتاع|اللينك|ترابيزة|الموبايل|كده|كذا|زي|تبي|عايز|بس)(?=$|[\s،.؟!»)])/;
  for (const [k, v] of Object.entries(ar)) assert.ok(!COLLOQUIAL.test(v), `modern ${k}: «${v}»`);
  assert.equal(ar.homeSloganB, 'تستحق دعوة.');
  // table: طاولة / ترابيزة / طاولة; link: الرابط / اللينك / الرابط; design always «التصميم»
  assert.match(ar.tables, /الطاولات/); assert.match(eg.tables, /الترابيزات/); assert.match(sa.wsTables, /الطاولات/);
  assert.match(eg.copyLink, /اللينك/); assert.match(sa.copyLink, /الرابط/);
  for (const c of [ar, eg, sa]) { assert.match(c.edDesign, /التصميم/); assert.match(c.esChangeDesign, /التصميم/); assert.doesNotMatch(c.tgFailed, /القالب/); }
  // no Egyptianisms in Saudi lines, no Saudi markers in Egyptian lines
  const EGYPTIAN = /(?:^|[\s«])(?:دلوقتي|مش|عايز|كده|بتاع\S*|هن(?:يجي|جهّز|فتقد|وزّع|سجّل|حفظ|فرح)\S*|ترابيز\S*|اللينك|لينك\S*|إزاي|النهارده|تاني)(?=$|[\s،.؟!»:])/;
  const SAUDI = /(?:^|[\s«])(?:الحين|وش|تبي|كذا|مو|هال\S+|زبطت)(?=$|[\s،.؟!»:])/;
  for (const k of Object.keys(sa) as CopyKey[]) if (sa[k] !== ar[k]) assert.ok(!EGYPTIAN.test(sa[k]), `Saudi ${k}: «${sa[k]}»`);
  for (const k of Object.keys(eg) as CopyKey[]) if (eg[k] !== ar[k]) assert.ok(!SAUDI.test(eg[k]), `Egyptian ${k}: «${eg[k]}»`);
  // fixed audit strings
  assert.equal(eg.pendingReply, 'لسه ما ردّش');
  for (const c of [ar, eg, sa]) { assert.doesNotMatch(c.sendSms, /SMS/); assert.doesNotMatch(c.templateFilter, /فلاتر/); }
});

test('copy: guests are addressed in the plural; the reply words follow each voice', () => {
  assert.equal(copyFor('ar').guestAccept, 'سنحضر بكل سرور');
  assert.equal(copyFor('ar-EG').guestAccept, 'هنيجي إن شاء الله');
  assert.equal(copyFor('ar-SA').guestAccept, 'بنحضر بإذن الله');
  assert.match(copyFor('ar-SA').msgInvite, /^حيّاكم الله/);
  for (const d of ['ar', 'ar-EG', 'ar-SA'] as const) {
    const c = copyFor(d);
    for (const k of ['msgInvite', 'msgReminder', 'guestConfirmed', 'guestDeclined', 'ghNotYet', 'ghCountHint', 'engNeed', 'engTapToOpen'] as const) {
      assert.match(c[k], /(?:كم|وا|ون|نا|وش)(?=$|[\s،.؟!:\n])/, `${d}.${k} speaks to the guests in the plural: «${c[k]}»`);
    }
    // the engine reads the same words
    const s = currentStrings(d);
    assert.equal(s.accept.ar, c.guestAccept); assert.equal((s.rsvpTitle as { ar: string }).ar, c.engRsvpTitle); assert.equal(s.thanks.no.ar, c.engThanksNo);
    // the done screen's demo line and the controls' screen-reader names follow the voice too (never a hard-coded modern line)
    assert.equal(s.demoOnly, c.demoOnly); assert.equal(s.backToCard, c.engBackToCard); assert.deepEqual(s.pageLabels[1], c.engPageDate);
  }
});

test('copy: domain-built lines take the voice and stay pure (time, activity, import, dietary)', () => {
  const now = new Date('2026-11-22T12:00:00Z');
  const ago = (min: number) => new Date(now.getTime() - min * 60000);
  assert.equal(relativeTime(ago(120), now), 'قبل ساعتين');
  assert.equal(relativeTime(ago(120), now, 'ar-EG'), 'من ساعتين');
  assert.equal(relativeTime(ago(5), now, 'ar-SA'), 'قبل 5 دقايق');
  assert.equal(relativeTime(ago(0), now, 'ar-EG'), 'دلوقتي');
  assert.equal(relativeTime(ago(0), now, 'ar-SA'), 'الحين');
  assert.equal(relativeTime(ago(26 * 60), now, 'ar-EG'), 'امبارح');
  assert.equal(countdownLabel('2026-11-23', '2026-11-22'), 'غدًا');
  assert.equal(countdownLabel('2026-11-23', '2026-11-22', 'ar-EG'), 'بكرة');
  assert.equal(countdownLabel('2026-11-22', '2026-11-22', 'ar-EG'), 'النهارده');
  assert.equal(countdownLabel('2026-12-01', '2026-11-22', 'ar-SA'), 'بعد 9 أيام');
  assert.equal(countdownLabel('2026-11-24', '2026-11-22', 'ar-EG'), 'بعد يومين');
  const a = (kind: EventActivity['kind'], data: EventActivity['data']) => ({ id: 'a', eventId: 'e', kind, data, at: now.toISOString(), actor: 'organizer' }) as EventActivity;
  assert.equal(activityText(a('rsvp_confirmed', { name: 'سارة', count: 2 })), 'تأكيد حضور سارة — شخصان');
  assert.equal(activityText(a('rsvp_confirmed', { name: 'سارة', count: 2 }), 'ar-EG'), 'سارة أكدوا إنهم جايين — شخصين');
  assert.equal(activityText(a('parties_imported', { count: 15, skipped: 2 }), 'ar-SA'), 'انضاف 15 ضيف من ملف (مع تخطي صفين)');
  assert.equal(activityText(a('table_created', { name: 'طاولة 4', capacity: 10 }), 'ar-EG'), 'طاولة 4 اتضافت (10 كراسي)');
  assert.deepEqual(mappingProblems(['ignore'], 'ar-EG'), ['حدد العمود اللي فيه أسامي الضيوف.']);
  assert.equal(dietaryLabel({ answered: true, needs: ['dairy', 'halal'] }, 'ar-EG'), 'حساسية لبن ومنتجاته · حلال بس');
  assert.equal(dietaryLabel({ answered: true, needs: ['dairy', 'halal'] }), 'حساسية حليب ومشتقاته · حلال فقط');
});

test('copy: slots fill, spoken counted nouns differ by voice, afternoon reads «عصرًا»', () => {
  assert.equal(fill('نقترح {a} و{b}', { a: 'طاولتين', b: 3 }), 'نقترح طاولتين و3');
  assert.equal(fill('{missing} يبقى ظاهرًا', {}), '{missing} يبقى ظاهرًا');
  assert.equal(countOf('ar', 2, 'table'), 'طاولتان');
  assert.equal(countOf('ar', 2, 'table', true), 'طاولتين');
  assert.equal(countOf('ar-EG', 2, 'table'), 'ترابيزتين');
  assert.equal(countOf('ar-EG', 15, 'guest'), '15 ضيف');
  assert.equal(countOf('ar-SA', 1, 'invitation'), 'دعوة وحدة');
  assert.equal(formatTime('11:00'), '11:00 صباحًا');
  assert.equal(formatTime('13:30'), '1:30 ظهرًا');
  assert.equal(formatTime('15:00'), '3:00 عصرًا');
  assert.equal(formatTime('16:45'), '4:45 عصرًا');
  assert.equal(formatTime('17:00'), '5:00 مساءً');
});

test('copy (ops review): a party is spoken of in the plural or neutrally, and the gate/seating lines read naturally', () => {
  const ar = copyFor('ar'), eg = copyFor('ar-EG'), sa = copyFor('ar-SA');
  // guest-card statuses are about a family
  assert.deepEqual([ar.stConfirmed, ar.stDeclined, ar.stPending], ['أكدوا الحضور', 'اعتذروا', 'لم يردوا بعد']);
  for (const c of [ar, eg, sa]) for (const k of ['stConfirmed', 'stDeclined', 'stPending', 'stNotArrived', 'stArrived'] as const) assert.match(c[k], /وا|وش/, `${k}: «${c[k]}»`);
  // seating toasts and activity lines never gender a family («اتوزّع / اتشال / اتنقل»)
  const a = (kind: EventActivity['kind'], data: EventActivity['data']) => ({ id: 'a', eventId: 'e', kind, data, at: new Date().toISOString(), actor: 'organizer' }) as EventActivity;
  assert.equal(activityText(a('party_moved', { name: 'منى القحطاني', table: 'طاولة 5' }), 'ar-EG'), 'نقلنا منى القحطاني لـطاولة 5');
  assert.equal(activityText(a('party_moved', { name: 'منى القحطاني', table: 'طاولة 5' }), 'ar-SA'), 'نقلنا منى القحطاني لـطاولة 5');
  assert.equal(activityText(a('party_unseated', { name: 'عائلة الفيفي', table: 'طاولة 2' }), 'ar-SA'), 'شلنا عائلة الفيفي من طاولة 2');
  assert.equal(activityText(a('check_in_undone', { name: 'عائلة الحربي' }), 'ar-EG'), 'لغينا دخول عائلة الحربي');
  assert.equal(fill(eg.seatSeated, { name: 'عائلة الفيفي', table: 'ترابيزة 2' }), 'وزّعنا عائلة الفيفي على ترابيزة 2');
  assert.equal(eg.seatUndo, 'رجّعهم');
  for (const c of [ar, eg, sa]) for (const v of Object.values(c)) assert.doesNotMatch(v, /مأكد/, 'Egyptian writes «مؤكد», not «مأكد»');
  assert.equal(eg.gtUndo, 'الغي الدخول');
  // the gate's «let in by exception» line, in words
  assert.equal(fill(ar.gtDoneSpecial, { people: countOf('ar', 1, 'person') }), 'دخل شخص واحد بإذن خاص');
  assert.equal(fill(eg.gtDoneSpecial, { people: countOf('ar-EG', 1, 'person') }), 'دخل شخص واحد بإذن');
  // owner-only note follows the voice; spoken counts (no «11 شخصًا» in the dialects)
  assert.deepEqual([ar.ownerOnlyNote, eg.ownerOnlyNote, sa.ownerOnlyNote], ['متاح لصاحب المناسبة', 'لصاحب الفرح بس', 'لصاحب المناسبة بس']);
  assert.equal(countOf('ar-SA', 11, 'person'), '11 شخص');
  assert.equal(sa.glUpTo, 'حتى {n}');
  // the pool hint names the real button in every voice
  for (const d of ['ar', 'ar-EG', 'ar-SA'] as const) { const c = copyFor(d); assert.ok(fill(c.seatTapHint, { label: c.assignTable }).includes(`«${c.assignTable}»`)); }
  // modern Arabic: no «لو» in the overview's seating lines
  assert.doesNotMatch(ar.ovAddSeating, /(?:^|\s)لو(?:\s|$)/); assert.doesNotMatch(ar.ovSeatHint, /(?:^|\s)لو(?:\s|$)/);
});
