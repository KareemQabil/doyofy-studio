import assert from 'node:assert/strict';
import test from 'node:test';
import { COPY_GROUPS, copyFor, countOf, fill, parseDialect, type CopyKey } from '../../src/domain/copy';
import { formatTime } from '../../src/domain/format';
import { currentStrings } from '../../src/data/strings.js';

const groups = Object.entries(COPY_GROUPS);
const DIALECTS = ['ar-EG', 'ar-SA'] as const;
/** the screens a guest or a first-time organizer sees first: every key is spelled in every voice */
const HIGH_VISIBILITY = ['home', 'create', 'guests', 'seating', 'guest', 'engine'] as const;

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
  }
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
