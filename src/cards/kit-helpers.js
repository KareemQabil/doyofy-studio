/**
 * Shared helpers for every invitation face (300×420, live text, no ids, no external resources):
 *   e()       HTML escaping for every value written into a face
 *   names()   fits one or two names into the room a design leaves, without ellipses
 *   STYLE     the base face/name/meta rules the designs build on
 *   typeOf()  the occasion behind the derived English label (faces receive content, not the event)
 */
export const e = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const AR = "'Reem Kufi', 'Amiri', sans-serif";
const EN = "'Cormorant Garamond', Georgia, serif";

export const STYLE = `<style>
.oc-face{position:relative;width:300px;height:420px;box-sizing:border-box;overflow:hidden;border-radius:10px;color:var(--oc-ink);background:var(--oc-paper);font-family:${AR};direction:rtl;isolation:isolate}
.oc-face *{box-sizing:border-box}.oc-layer{position:absolute;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none}.oc-inner{position:relative;display:flex;flex-direction:column;height:100%;padding:20px 23px 17px;gap:9px;text-align:center}
.oc-names{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:3px}.oc-name{margin:0;font-weight:400;line-height:1.48;overflow-wrap:anywhere;text-wrap:balance}.oc-join{font-size:12px;line-height:1;color:var(--oc-accent)}.oc-latin{font-family:${EN};font-size:10px;line-height:1.25;direction:ltr;letter-spacing:.3px;overflow-wrap:anywhere;margin-top:2px}
.oc-meta{flex:none;display:grid;gap:5px;border-top:1px solid var(--oc-line);padding-top:11px;font-size:11px;line-height:1.55;overflow-wrap:anywhere}.oc-date{font-size:12px;color:var(--oc-ink)}.oc-time{font-size:11px;color:var(--oc-muted)}.oc-place{font-size:11px}.oc-city{color:var(--oc-muted);font-size:10px}.oc-footer{flex:none;font-family:${EN};font-size:8px;letter-spacing:1.1px;line-height:1.35;direction:ltr;color:var(--oc-muted);overflow-wrap:anywhere}
</style>`;

export function names(c, room = 0, fit = {}) {
  const lineWidth = fit.width ?? 234, glyph = fit.glyph ?? .57;
  const arA = String(c.arA ?? ''), arB = String(c.arB ?? '');
  const length = arA.length + arB.length;
  // a Latin line only when it adds something (no Arabic echoed as the "Latin" name)
  const latinNames = [c.enA !== arA ? c.enA : '', arB && c.enB !== arB ? c.enB : ''].filter(Boolean);
  const extraRows = (value, capacity) => Math.max(0, Math.ceil(String(value ?? '').length / capacity) - 1);
  // Reserve space for naturally wrapping venue/heading metadata as well as names.
  // Estimate conservatively, then choose a size that fits the complete text; no ellipses.
  const metaReserve = extraRows(c.venueAr, 39) * 17 + extraRows(c.cityAr, 43) * 16
    + extraRows(`${c.dayAr ?? ''} ${c.dateAr ?? ''}`, 36) * 18
    + extraRows(c.greetingAr, 27) * 24 + extraRows(c.eventLabelEnU, 34) * 13;
  const latinSize = length > 110 ? 8 : 10;
  const latinRows = Math.ceil(latinNames.join(' & ').length / (latinSize === 8 ? 58 : 46));
  const budget = Math.max(34, 137 + room - metaReserve - latinRows * latinSize * 1.25 - (arB ? 20 : 6));
  let size = arB ? 22 : 31;
  const height = (name, font) => Math.ceil(Math.max(1, name.length) * font * glyph / lineWidth) * font * 1.48;
  while (size > 8 && height(arA, size) + (arB ? height(arB, size) : 0) > budget) size--;
  const latin = latinNames.map(e).join(' &amp; ');
  return `<div class="oc-names"><div class="oc-name" style="font-size:${size}px" dir="rtl">${e(arA)}</div>${arB ? `<span class="oc-join" aria-hidden="true">و</span><div class="oc-name" style="font-size:${size}px" dir="rtl">${e(arB)}</div>` : ''}${latin ? `<div class="oc-latin" lang="en" dir="ltr" style="font-size:${latinSize}px">${latin}</div>` : ''}</div>`;
}

const TYPE_WORDS = [['GRADUAT', 'graduation'], ['ENGAGE', 'engagement'], ['KATB', 'katb_kitab'], ['MARRIAGE', 'katb_kitab'], ['HENNA', 'henna'], ['BIRTH', 'birthday'], ['NEWBORN', 'newborn'], ['BABY', 'newborn'], ['IFTAR', 'iftar'], ['RAMADAN', 'iftar'], ['FAMILY', 'family'], ['CONFER', 'conference'], ['OPENING', 'opening'], ['LAUNCH', 'opening'], ['CORPORATE', 'corporate'], ['COMPANY', 'corporate'], ['TEAM', 'corporate'], ['WEDDING', 'wedding']];
/** The occasion behind the derived label (cards receive content, not the event type). */
export const typeOf = (c) => { const l = String(c.eventLabelEnU || ''); return (TYPE_WORDS.find(([w]) => l.includes(w)) || [null, 'other'])[1]; };
