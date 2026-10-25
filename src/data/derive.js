/**
 * InvitationData → the flat content object `c` the canonical CardFace / Studio templates bind to
 * (arA, arB, enA, monoA, dayAr, dateEn, dateNum, venueEnU …), plus calendar/map links, program rows
 * and a live countdown. Dates are formatted in the event's own time zone with Intl, so changing
 * `event.start` re-derives every card and page; `display.*` overrides win when present.
 */
const pad = (v) => String(v).padStart(2, '0');

function parts(date, timeZone, locale, opts) {
  const f = new Intl.DateTimeFormat(locale, { timeZone, ...opts });
  return Object.fromEntries(f.formatToParts(date).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]));
}

function fmtTime12(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
}

export function deriveContent(inv) {
  const d = new Date(inv.event.start);
  const tz = inv.event.timeZone;
  const en = parts(d, tz, 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  const ar = parts(d, tz, 'ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  const num = parts(d, tz, 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const disp = inv.display || {};
  const A = inv.couple.a, B = inv.couple.b;

  const c = {
    greetingAr: B.ar ? 'بكل الحب' : (inv.event.label?.ar || 'دعوة بكل الحب'),
    greetingEnU: B.ar ? 'WITH LOVE' : (inv.event.label?.en || 'YOU ARE INVITED').toUpperCase(),
    // never promise a dinner the program doesn't have: the footer names the occasion itself
    cardFooterEnU: `${(inv.event.label?.en || (B.ar ? 'Wedding' : 'Celebration')).toUpperCase()} · CELEBRATION · RSVP`,
    eventLabelEnU: (inv.event.label?.en || (B.ar ? 'Wedding' : 'Celebration')).toUpperCase(),
    arA: A.ar, arB: B.ar, enA: A.en, enB: B.en, monoA: A.monogram, monoB: B.monogram, initA: A.initial, initB: B.initial,
    dayAr: disp.dayAr ?? ar.weekday, dayEn: disp.dayEn ?? en.weekday,
    dateAr: disp.dateAr ?? `${ar.day} ${ar.month} ${ar.year}`,
    dateEn: disp.dateEn ?? `${Number(en.day)} ${en.month} ${en.year}`,
    dayNum: String(Number(num.day)), monthAr: disp.monthAr ?? ar.month, monthEn: en.month, year: num.year,
    dateNum: `${num.day} · ${num.month} · ${num.year}`,
    dateShort: `${num.day}.${num.month}.${num.year.slice(2)}`,
    timeAr: disp.timeAr ?? `${ar.hour}:${ar.minute} ${ar.dayPeriod || ''}`.trim(),
    timeEn: disp.timeEn ?? `${Number(en.hour)}:${en.minute} ${(en.dayPeriod || '').toUpperCase().replace(/\./g, '')}`.trim(),
    venueAr: inv.venue.ar, venueEn: inv.venue.en, cityAr: inv.venue.city.ar, cityEn: inv.venue.city.en,
    iso: inv.event.start,
  };
  c.arFontA = Math.max(18, Math.min(36, Math.floor(270 / Math.max(1, c.arA.length))));
  c.arFontB = Math.max(18, Math.min(36, Math.floor(270 / Math.max(1, c.arB.length))));
  c.enAU = c.enA.toUpperCase(); c.enBU = c.enB.toUpperCase();
  c.dayEnU = c.dayEn.toUpperCase(); c.dateEnU = c.dateEn.toUpperCase(); c.monthEnU = c.monthEn.toUpperCase();
  c.venueEnU = c.venueEn.toUpperCase(); c.cityEnU = c.cityEn.toUpperCase();

  const start = d.getTime();
  const stamp = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const calHref = isNaN(start) ? '#' : 'https://calendar.google.com/calendar/render?action=TEMPLATE&text='
    + encodeURIComponent(inv.event.title || `${[c.enA, c.enB].filter(Boolean).join(' & ')} — ${inv.event.label?.en || (c.enB ? 'Wedding' : 'Celebration')}`) + '&dates=' + stamp(start) + '/' + stamp(start + (inv.event.durationHours || 5) * 36e5)
    + '&location=' + encodeURIComponent(`${c.venueEn}, ${c.cityEn}`);
  const mapHref = inv.venue.mapUrl || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${c.venueEn} ${c.cityEn}`);

  const program = inv.program.map((p, i, a) => ({
    time: fmtTime12(p.time), ar: p.ar, en: p.en,
    delay: (0.25 + i * 0.22).toFixed(2), tailOpacity: i === a.length - 1 ? 0 : 1,
  }));

  return { c, calHref, mapHref, program, start, copy: inv.copy, rsvp: inv.rsvp };
}

/** live countdown parts, as the canonical Date page shows them */
export function countdown(startMs, now = Date.now()) {
  const diff = Math.max(0, (isNaN(startMs) ? 0 : startMs) - now);
  return { days: Math.floor(diff / 864e5), h: pad(Math.floor(diff / 36e5) % 24), m: pad(Math.floor(diff / 6e4) % 60), s: pad(Math.floor(diff / 1e3) % 60) };
}
