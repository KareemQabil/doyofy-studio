/**
 * Arabic-first formatting. Gregorian calendar and Western digits everywhere (D-004 in docs/UX_DECISIONS.md):
 * phone numbers, counts and tables stay easy to compare and type. Plurals follow Arabic CLDR rules.
 */
import type { ISODateTime, LocalDate, LocalTime } from './types';

const LOCALE = 'ar-u-ca-gregory-nu-latn';

export function toArabicDigitsSafe(input: string): string {
  // normalise Arabic-Indic (٠-٩) and Persian (۰-۹) digits to 0-9 — used for phones, counts, imports
  return input.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

const pluralRules = new Intl.PluralRules('ar');
export interface PluralForms { zero?: string; one: string; two: string; few: string; many: string; other: string }

/** plural('ضيف') — `#` is replaced by the number. */
export function plural(n: number, forms: PluralForms, opts: { oblique?: boolean } = {}): string {
  const cat = n === 0 && forms.zero ? 'zero' : (pluralRules.select(n) as keyof PluralForms);
  let f = forms[cat] ?? forms.other;
  // after a preposition, a possessive or as an object Arabic uses the oblique dual: شخصان → شخصين
  if (opts.oblique && cat === 'two') f = f.replace(/ان(?=\s|$)/, 'ين').replace(/تان(?=\s|$)/, 'تين');
  return f.replace('#', String(n));
}
/** the oblique form: «تتسع لشخصين» · «أضف طاولتين» · «تسجيل دخول شخصين» */
export const pluralOf = (n: number, forms: PluralForms) => plural(n, forms, { oblique: true });

export const P = {
  person: { zero: 'لا أحد', one: 'شخص واحد', two: 'شخصان', few: '# أشخاص', many: '# شخصًا', other: '# شخص' },
  guest: { zero: 'لا ضيوف', one: 'ضيف واحد', two: 'ضيفان', few: '# ضيوف', many: '# ضيفًا', other: '# ضيف' },
  invitation: { zero: 'لا دعوات', one: 'دعوة واحدة', two: 'دعوتان', few: '# دعوات', many: '# دعوة', other: '# دعوة' },
  seat: { zero: 'لا مقاعد', one: 'مقعد واحد', two: 'مقعدان', few: '# مقاعد', many: '# مقعدًا', other: '# مقعد' },
  table: { zero: 'لا طاولات', one: 'طاولة واحدة', two: 'طاولتان', few: '# طاولات', many: '# طاولة', other: '# طاولة' },
  day: { zero: 'اليوم', one: 'يوم واحد', two: 'يومان', few: '# أيام', many: '# يومًا', other: '# يوم' },
  row: { zero: 'لا صفوف', one: 'صف واحد', two: 'صفان', few: '# صفوف', many: '# صفًا', other: '# صف' },
  minute: { zero: 'الآن', one: 'دقيقة', two: 'دقيقتين', few: '# دقائق', many: '# دقيقة', other: '# دقيقة' },
  hour: { zero: 'الآن', one: 'ساعة', two: 'ساعتين', few: '# ساعات', many: '# ساعة', other: '# ساعة' },
  dayAgo: { zero: 'اليوم', one: 'يوم', two: 'يومين', few: '# أيام', many: '# يومًا', other: '# يوم' },
} satisfies Record<string, PluralForms>;

/** "شخصان" / "4 أشخاص" */
export const people = (n: number) => plural(n, P.person);
export const peopleOf = (n: number) => plural(n, P.person, { oblique: true });

// ------------------------------------------------------------------ dates & times
/** Event-local wall time → absolute instant (uses the zone's offset on that date). */
export function zonedToInstant(date: LocalDate, time: LocalTime, timeZone: string): Date {
  const guess = new Date(`${date}T${time}:00Z`);
  const offsetMin = tzOffsetMinutes(guess, timeZone);
  let d = new Date(guess.getTime() - offsetMin * 60000);
  const second = tzOffsetMinutes(d, timeZone); // DST edge: re-evaluate once
  if (second !== offsetMin) d = new Date(guess.getTime() - second * 60000);
  return d;
}

export function tzOffsetMinutes(at: Date, timeZone: string): number {
  const f = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const p = Object.fromEntries(f.formatToParts(at).map((x) => [x.type, x.value]));
  const asUTC = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
  return Math.round((asUTC - Math.floor(at.getTime() / 1000) * 1000) / 60000);
}

/** "+03:00" for an event-local date/time (feeds the Invitation Studio's ISO start) */
export function offsetString(date: LocalDate, time: LocalTime, timeZone: string): string {
  const m = tzOffsetMinutes(zonedToInstant(date, time, timeZone), timeZone);
  const sign = m >= 0 ? '+' : '-';
  const a = Math.abs(m);
  return `${sign}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`;
}

/** the calendar date of an instant in a zone, as YYYY-MM-DD */
export function localDateOf(at: Date, timeZone: string): LocalDate {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
  return f.format(at);
}

/**
 * "الثلاثاء 13 أكتوبر 2026". `digits: 'arab'` writes ١٢٣ — only for an invitation's own date and time,
 * whose face chose that system (domain/templates faceDigits); the platform itself keeps Western digits.
 */
export function formatEventDate(date: LocalDate, opts: { weekday?: boolean; year?: boolean; digits?: 'arab' | 'latn' } = {}): string {
  const d = new Date(`${date}T12:00:00Z`);
  const f = new Intl.DateTimeFormat(opts.digits === 'arab' ? 'ar-u-ca-gregory-nu-arab' : LOCALE, { timeZone: 'UTC', day: 'numeric', month: 'long', ...(opts.year === false ? {} : { year: 'numeric' }), ...(opts.weekday === false ? {} : { weekday: 'long' }) });
  return f.format(d).replace('،', '');
}

/** "8:30 مساءً" (or "٨:٣٠ مساءً" with `digits: 'arab'`, see formatEventDate): صباحًا before noon, ظهرًا to 3pm, عصرًا 3–5pm, مساءً after */
export function formatTime(time: LocalTime, digits: 'arab' | 'latn' = 'latn'): string {
  const [hs, ms] = time.split(':');
  const h = Number(hs), m = Number(ms);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const h12 = ((h + 11) % 12) + 1;
  const period = h < 12 ? 'صباحًا' : h < 15 ? 'ظهرًا' : h < 17 ? 'عصرًا' : 'مساءً';
  return inDigits(`${h12}:${String(m).padStart(2, '0')} ${h === 12 && m === 0 ? 'ظهرًا' : period}`, digits);
}

/** writes a formatted text's digits as ١٢٣ for `digits: 'arab'` (an invitation's own dates, see formatEventDate) */
export function inDigits(text: string, digits: 'arab' | 'latn' = 'latn'): string {
  return digits === 'arab' ? text.replace(/[0-9]/g, (n) => String.fromCharCode(0x0660 + Number(n))) : text;
}

/**
 * The separator between the parts of one Arabic date line («الثلاثاء، ١ ديسمبر»). A middle dot beside Arabic-Indic
 * digits reads as a zero («· ١» → «١٠»), so an invitation that writes ١٢٣ joins its parts with the Arabic comma;
 * Western digits keep the light middle dot. data/derive.js uses the same rule for the card faces (a unit test keeps them equal).
 */
export const dateSeparator = (digits: 'arab' | 'latn' = 'latn'): string => digits === 'arab' ? '، ' : ' · ';
export const joinDateParts = (digits: 'arab' | 'latn', ...parts: Array<string | undefined | false>): string =>
  parts.filter((p): p is string => !!p).join(dateSeparator(digits));

/**
 * Every number one invitation shows its guests, in its face's number system (١٢٣ or 123): the date, the time, the
 * headcounts and counters on the guest pages follow the card, so one guest journey never mixes the two systems.
 */
export function invitationNumbers(digits: 'arab' | 'latn') {
  return {
    digits,
    num: (n: number | string) => inDigits(String(n), digits),
    text: (s: string) => inDigits(s, digits),
    people: (n: number) => inDigits(people(n), digits),
    peopleOf: (n: number) => inDigits(peopleOf(n), digits),
    date: (date: LocalDate, opts: { weekday?: boolean; year?: boolean } = {}) => formatEventDate(date, { ...opts, digits }),
    time: (time: LocalTime) => formatTime(time, digits),
    /** «الثلاثاء، ١ ديسمبر ٢٠٢٦، ٨:٠٠ مساءً» — see dateSeparator */
    join: (...parts: Array<string | undefined | false>) => joinDateParts(digits, ...parts),
  };
}
export type InvitationNumbers = ReturnType<typeof invitationNumbers>;

/** "الآن" / "قبل 5 دقائق" / "قبل ساعتين" / "أمس 9:15 م" / date */
export function relativeTime(at: ISODateTime | Date, now: Date): string {
  const t = typeof at === 'string' ? new Date(at) : at;
  const s = Math.round((now.getTime() - t.getTime()) / 1000);
  if (s < 45) return 'الآن';
  const m = Math.round(s / 60);
  if (m < 60) return `قبل ${plural(m, P.minute)}`;
  const h = Math.round(m / 60);
  if (h < 24) return `قبل ${plural(h, P.hour)}`;
  const d = Math.round(h / 24);
  if (d < 7) return d === 1 ? 'أمس' : `قبل ${plural(d, P.dayAgo)}`;
  return new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long' }).format(t);
}

export function clockTime(at: ISODateTime | Date, timeZone?: string): string {
  const t = typeof at === 'string' ? new Date(at) : at;
  return new Intl.DateTimeFormat(LOCALE, { hour: 'numeric', minute: '2-digit', ...(timeZone ? { timeZone } : {}) }).format(t);
}

/** whole days between two local dates (b - a) */
export function daysBetween(a: LocalDate, b: LocalDate): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5);
}

/** "بعد 9 أيام" / "غدًا" / "اليوم" / "منذ 3 أيام" */
export function countdownLabel(eventDate: LocalDate, today: LocalDate): string {
  const d = daysBetween(today, eventDate);
  if (d === 0) return 'اليوم';
  if (d === 1) return 'غدًا';
  if (d === -1) return 'أمس';
  if (d > 1) return `بعد ${pluralOf(d, P.day)}`;
  return `منذ ${plural(-d, P.dayAgo)}`;
}

export function addDays(date: LocalDate, n: number): LocalDate {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function formatPhone(e164?: string): string {
  if (!e164) return '';
  const m = e164.match(/^\+(966|971|965|974|973|968|962|20)(\d+)$/);
  if (!m) return e164;
  const [, cc, rest = ''] = m;
  const groups = cc === '20' ? [rest.slice(0, 3), rest.slice(3, 6), rest.slice(6)] : [rest.slice(0, 2), rest.slice(2, 5), rest.slice(5)];
  return `+${cc} ${groups.filter(Boolean).join(' ')}`;
}

/**
 * The letter on a guest's avatar: the family name, not the word «عائلة» — «عائلة الشهري» → «ش», «آل سعود» → «س»,
 * «أم خالد» → «خ», «العتيبي» → «ع». Falls back to the first letter, or «؟» for an empty name.
 */
export function initialOf(name: string): string {
  const clean = name.replace(/\s+/g, ' ').trim();
  const rest = clean.replace(/^(?:ال)?(?:عائلة|أسرة|آل|أم|أبو|أبا|بيت)\s+/, '');
  const word = rest.split(' ')[0] ?? '';
  const core = word.startsWith('ال') && word.length > 3 ? word.slice(2) : word;
  return [...(core || clean)][0] ?? '؟';
}
