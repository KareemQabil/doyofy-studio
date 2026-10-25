/**
 * CardTemplate interface.
 *
 * A card module renders faces and decorative layers from content — never the other way
 * round. Two kinds of source are supported:
 *
 *   source: 'html'     code template (ported designs, fully vector)
 *   source: 'layered'  asset pack described by meta.json (Canva / PNG / WebP / SVG layers + DOM text)
 *
 * render(ctx) returns:
 * {
 *   design:  { w, h }                    design-space size (scaled to the fitted box)
 *   palette: { paper, ink, muted, accent, accentText, env }
 *   fonts:   { arDisplay, ar, enDisplay, en }   CSS stacks for pages
 *   fontFaces: [{ family, google }]      loaded lazily by FontManager
 *   front, back, inside?: HTMLElement[]  faces (multi-page invitations use `inside`)
 *   layers:  [{ el, enter }]             independently animated layers on the card
 *   decor:   [{ el, place: 'back'|'front', box: [x,y,w,h] (% of card), enter, finale }]
 *   assets:  [{ src, preload }]          preloaded before the first frame
 *   tone, sheetTexture, radius
 * }
 */

/** Flatten content into the short fields card templates bind to. */
export function cardText(m) {
  const c = m.content, d = c.derived;
  const pick = (v, l) => (v == null ? '' : typeof v === 'string' ? v : v[l] ?? v.en ?? v.ar ?? '');
  const A = c.couple.personA, B = c.couple.personB;
  const mono = c.couple.monogram || {};
  const t = {
    arA: pick(A, 'ar'), arB: pick(B, 'ar'), enA: pick(A, 'en'), enB: pick(B, 'en'),
    monoA: mono.ar?.[0] || pick(A, 'ar').charAt(0), monoB: mono.ar?.[1] || pick(B, 'ar').charAt(0),
    initA: mono.en?.[0] || pick(A, 'en').charAt(0), initB: mono.en?.[1] || pick(B, 'en').charAt(0),
    dayAr: pick(d.weekday, 'ar'), dayEn: pick(d.weekday, 'en'), dateAr: pick(d.dateLong, 'ar'), dateEn: pick(d.dateLong, 'en'),
    dateNum: d.dateNumeric, dateShort: d.dateShort, year: pick(d.year, 'en'), dayNum: pick(d.day, 'en'), monthAr: pick(d.month, 'ar'), monthEn: pick(d.month, 'en'),
    timeAr: pick(d.time, 'ar'), timeEn: pick(d.time, 'en'),
    venueAr: pick(c.venue.name, 'ar'), venueEn: pick(c.venue.name, 'en'), cityAr: pick(c.venue.city, 'ar'), cityEn: pick(c.venue.city, 'en'),
    familiesAr: pick(c.families, 'ar'), familiesEn: pick(c.families, 'en'), hijri: d.hijri ? pick(d.hijri, 'ar') : '',
  };
  for (const k of ['enA', 'enB', 'dayEn', 'dateEn', 'venueEn', 'cityEn', 'monthEn']) t[`${k}U`] = String(t[k]).toUpperCase();
  return t;
}

export function palette(base, variants, variant) { return { ...base, ...(variants?.[variant] || {}) }; }
