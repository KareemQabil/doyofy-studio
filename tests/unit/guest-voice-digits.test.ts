import assert from 'node:assert/strict';
import test from 'node:test';
import { dateSeparator, invitationNumbers, joinDateParts } from '../../src/domain/format';
import { faceDigits } from '../../src/domain/templates';
import { defaultDesign, toInvitationData } from '../../src/domain/invitation';
import { decodePortableView, encodePortableView, portableView, readPortableView } from '../../src/domain/portable-invite';
import { mealSummary } from '../../src/domain/guest-experience';
import { isPortableGuestEntry } from '../../src/services';
import { copyFor } from '../../src/domain/copy';
import type { Event, GuestExperience } from '../../src/domain/types';
import { dateSep, deriveContent } from '../../src/data/derive.js';
import { currentStrings } from '../../src/data/strings.js';
import '../../src/cards/index.js';
import { COLLECTION } from '../../src/cards/collection.js';
import { CardRegistry } from '../../src/engine/registries.js';

const ev = (over: Partial<Event> = {}): Event => ({
  id: 'evt_t', ownerId: 'u', slug: 'noura-faisal', type: 'wedding', title: 'زفاف نورة وفيصل', names: { a: 'نورة', b: 'فيصل', aEn: 'Noura', bEn: 'Faisal' },
  date: '2099-12-01', time: '21:00', timeZone: 'Asia/Riyadh', durationHours: 5, venue: { name: 'قاعة الياسمين', city: 'الرياض' },
  settings: { defaultPartySize: 2, revealTableToGuests: false, allowGeneralLink: true }, createdAt: '', updatedAt: '', ...over,
});
const LATIN = /[0-9]/, INDIC = /[٠-٩]/;
/** a middle dot touching an Arabic-Indic digit (with or without a space) reads as a zero: «· ١» → «١٠» */
const DOT_BY_INDIC = /[٠-٩]\s?·|·\s?[٠-٩]/;

test('digits consistency helper: one invitation writes every number in its face\'s system', () => {
  for (const digits of ['arab', 'latn'] as const) {
    const N = invitationNumbers(digits);
    const out = [N.num(1234), N.people(3), N.peopleOf(2), N.people(11), N.date('2026-12-01'), N.time('21:05'), N.text('بعد 9 أيام'), N.join(N.date('2026-12-01'), N.time('09:30'))];
    for (const s of out) {
      if (digits === 'arab') assert.ok(!LATIN.test(s) && INDIC.test(s) || !/\d|[٠-٩]/.test(s), `${s} has no Western digits`);
      else assert.ok(!INDIC.test(s), `${s} has no Arabic-Indic digits`);
    }
  }
  const A = invitationNumbers('arab');
  assert.equal(A.people(3), '٣ أشخاص');
  assert.equal(A.join('الثلاثاء', '١ ديسمبر'), 'الثلاثاء، ١ ديسمبر', 'Arabic comma between parts when digits are ١٢٣');
  assert.equal(joinDateParts('latn', 'Tue', undefined, '1 Dec'), 'Tue · 1 Dec', 'Western digits keep the middle dot; empty parts drop');
  assert.ok(!DOT_BY_INDIC.test(A.join(A.date('2026-12-01'), A.time('20:00'))));
  // the platform and the card engine share one separator rule
  for (const d of ['arab', 'latn'] as const) assert.equal(dateSeparator(d), dateSep(d));
  const meals: GuestExperience['meals'] = { enabled: true, required: false, options: [{ id: 'm1', label: 'كبسة لحم' }, { id: 'm2', label: 'دجاج مشوي' }] };
  const x = { revision: 1, meals, dietary: { enabled: false }, gifts: { enabled: false, afterDecline: false, items: [] } } as unknown as GuestExperience;
  const summary = A.text(mealSummary(x, [{ optionId: 'm1', count: 2 }, { optionId: 'm2', count: 1 }], dateSeparator('arab')));
  assert.equal(summary, '٢ كبسة لحم، ١ دجاج مشوي');
});

test('card faces: no middle dot beside Arabic-Indic digits, on any face, and the numeric date uses slashes', () => {
  const samples = [ev(), ev({ type: 'graduation', names: { a: 'عبدالرحمن بن سلطان الشهراني' } }), ev({ type: 'birthday', names: { a: 'ليان', aEn: 'Layan' } })] as Event[];
  for (const d of COLLECTION) {
    for (const e of samples) {
      const c = deriveContent(toInvitationData({ ...e, type: d.type as Event['type'] }, defaultDesign({ ...e, type: d.type as Event['type'] })), { digits: CardRegistry.get(d.id).digits }).c;
      const text = CardRegistry.get(d.id).render(c).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      assert.ok(!DOT_BY_INDIC.test(text), `${d.id}: ${text.match(DOT_BY_INDIC)?.[0]}`);
      if (c.digits === 'arab') assert.ok(!c.dateNum!.includes('·') && c.dateNum!.includes('/'), c.dateNum);
    }
    assert.equal(faceDigits(d.id), CardRegistry.get(d.id).digits ?? 'arab', `${d.id} digits mirror`);
  }
});

test('dialect: the organizer\'s voice is carried in the guest link payload and survives decoding', () => {
  const e = ev();
  const party = { code: 'TTXKJ', primaryGuestName: 'أم نورة — خالة العروس', maxPartySize: 3 };
  for (const dialect of ['ar-EG', 'ar-SA'] as const) {
    const token = encodePortableView(portableView(e, defaultDesign(e), party, dialect));
    assert.equal(decodePortableView(token, e.slug, party.code)?.dialect, dialect);
  }
  // modern is the default and is not stored; an unknown value falls back to it
  const modern = portableView(e, defaultDesign(e), party);
  assert.equal(modern.dialect, undefined);
  assert.equal(decodePortableView(encodePortableView(modern), e.slug, party.code)?.dialect, undefined);
  assert.equal(readPortableView({ ...modern, dialect: 'fr' }, e.slug, party.code)?.dialect, undefined);
  // the engine and the React pages use the same reply words for each voice
  for (const d of ['ar', 'ar-EG', 'ar-SA'] as const) {
    assert.equal(currentStrings(d).accept.ar, copyFor(d).guestAccept);
    assert.equal(currentStrings(d).decline.ar, copyFor(d).guestDecline);
    assert.equal(currentStrings(d).sealSend.ar, copyFor(d).guestSendReply);
  }
  // guest commands are plural in every voice (no «افتح / اضغط / اسحب / ارفع» addressed to one person)
  for (const d of ['ar', 'ar-EG', 'ar-SA'] as const) {
    const k = copyFor(d);
    for (const key of ['guestOpen', 'guestSealHint', 'guestSealLabel', 'guestZoomCode', 'guestCodeTip', 'guestShowCode'] as const) {
      assert.ok(!/(^|\s)(افتح|اضغط|اسحب|ارفع|اعرض)(\s|$)/.test(k[key]), `${d}.${key}: ${k[key]}`);
    }
  }
});

test('a guest link that carries its invitation is recognised in history and hash routing', () => {
  const at = (href: string) => { const u = new URL(href); return { pathname: u.pathname, search: u.search, hash: u.hash }; };
  assert.equal(isPortableGuestEntry(at('https://d.test/i/noura-faisal/TTXKJ?d=abc')), true);
  assert.equal(isPortableGuestEntry(at('https://d.test/i/noura-faisal?d=abc')), true);
  assert.equal(isPortableGuestEntry(at('https://d.test/index.html#/i/noura-faisal/TTXKJ?d=abc')), true);
  assert.equal(isPortableGuestEntry(at('https://d.test/i/noura-faisal/TTXKJ')), false, 'a local prototype link still uses the organizer store');
  assert.equal(isPortableGuestEntry(at('https://d.test/app/events?d=abc')), false);
  assert.equal(isPortableGuestEntry(undefined), false);
});
