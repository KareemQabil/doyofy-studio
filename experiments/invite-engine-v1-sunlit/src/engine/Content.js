/**
 * Content engine: normalises raw wedding content, derives every formatted value once
 * (Gregorian + optional Hijri dates in Arabic/English, times, calendar links, countdown
 * target in the venue's timezone) and exposes bilingual helpers.
 */
import { strings } from '../content/strings.js';

function tzOffsetMinutes(date, timeZone) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(date);
    const g = (t) => Number(parts.find((p) => p.type === t).value);
    const asUTC = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour') % 24, g('minute'), g('second'));
    return (asUTC - date.getTime()) / 60000;
  } catch { return 0; }
}

/** Venue-local ISO ("2027-08-12T19:00:00") + IANA zone → absolute Date. */
export function zonedDate(local, timeZone) {
  const naive = new Date(local + 'Z');
  const off = tzOffsetMinutes(naive, timeZone);
  return new Date(naive.getTime() - off * 60000);
}

const fmt = (locale, opts, d, timeZone) => { try { return new Intl.DateTimeFormat(locale, { timeZone, ...opts }).format(d); } catch { return ''; } };

export function deriveContent(raw) {
  const c = structuredClone(raw);
  const tz = c.timezone || 'UTC';
  const start = zonedDate(c.date, tz);
  const end = c.endDate ? zonedDate(c.endDate, tz) : new Date(start.getTime() + 5 * 3600e3);
  const ar = 'ar-EG', en = 'en-GB';
  c.derived = {
    start, end, tz,
    weekday: { ar: fmt(ar, { weekday: 'long' }, start, tz), en: fmt(en, { weekday: 'long' }, start, tz) },
    day: { ar: fmt(ar, { day: 'numeric' }, start, tz), en: fmt(en, { day: 'numeric' }, start, tz) },
    month: { ar: fmt(ar, { month: 'long' }, start, tz), en: fmt(en, { month: 'long' }, start, tz) },
    year: { ar: fmt(ar, { year: 'numeric' }, start, tz), en: fmt(en, { year: 'numeric' }, start, tz) },
    dateLong: { ar: fmt(ar, { day: 'numeric', month: 'long', year: 'numeric' }, start, tz), en: fmt(en, { day: 'numeric', month: 'long', year: 'numeric' }, start, tz) },
    dateNumeric: fmt('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }, start, tz).replace(/\//g, ' · '),
    dateShort: fmt('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }, start, tz).replace(/\//g, '.'),
    time: { ar: fmt(ar, { hour: 'numeric', minute: '2-digit' }, start, tz), en: fmt('en-US', { hour: 'numeric', minute: '2-digit' }, start, tz) },
    hijri: c.showHijri ? { ar: fmt('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }, start, tz), en: fmt('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }, start, tz) } : null,
    deadline: c.rsvp?.deadline ? { ar: fmt(ar, { day: 'numeric', month: 'long' }, new Date(c.rsvp.deadline + 'T12:00:00Z'), 'UTC'), en: fmt(en, { day: 'numeric', month: 'long' }, new Date(c.rsvp.deadline + 'T12:00:00Z'), 'UTC') } : null,
  };
  const isoC = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const title = `${c.couple.personA.en} & ${c.couple.personB.en}`;
  c.derived.calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title + ' — Wedding')}&dates=${isoC(start)}/${isoC(end)}&location=${encodeURIComponent(`${c.venue.name.en}, ${c.venue.city?.en || ''}`)}`;
  c.program = (c.program || []).map((p) => {
    const d = zonedDate(`${c.date.slice(0, 10)}T${p.time}:00`, tz);
    return { ...p, label: { ar: fmt(ar, { hour: 'numeric', minute: '2-digit' }, d, tz), en: fmt('en-US', { hour: 'numeric', minute: '2-digit' }, d, tz) } };
  });
  return c;
}

/**
 * Language helper bound to one content object:
 *   L.p(field)   → text in the primary language
 *   L.s(field)   → text in the secondary language ('' when single-language)
 *   L.t(key)     → interface string (primary), L.ts(key) secondary
 */
export function languageHelper(content) {
  const p = content.language || 'ar';
  const s = content.secondaryLanguage || null;
  const pick = (v, lang) => (v == null ? '' : typeof v === 'string' ? v : v[lang] ?? '');
  return {
    primary: p, secondary: s, rtl: content.rtl ?? p === 'ar', dir: (content.rtl ?? p === 'ar') ? 'rtl' : 'ltr',
    p: (v) => pick(v, p),
    s: (v) => (s ? pick(v, s) : ''),
    t: (k) => strings[p]?.[k] ?? k,
    ts: (k) => (s ? strings[s]?.[k] ?? '' : ''),
    lang: (l) => ({ dir: l === 'ar' ? 'rtl' : 'ltr', lang: l }),
  };
}
