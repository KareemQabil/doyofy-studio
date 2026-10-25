/**
 * Original occasion stationery. Each face is a self-contained 300×420 DOM/SVG asset;
 * it uses the same derived content and theme contract as the canonical card faces.
 * Decorative vectors contain no text, external resources, animation, or SVG ids.
 */
import { CardRegistry } from '../engine/registries.js';

export const e = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const AR = "'Reem Kufi', 'Amiri', sans-serif";
const EN = "'Cormorant Garamond', Georgia, serif";

export const STYLE = `<style>
.oc-face{position:relative;width:300px;height:420px;box-sizing:border-box;overflow:hidden;border-radius:10px;color:var(--oc-ink);background:var(--oc-paper);font-family:${AR};direction:rtl;isolation:isolate}
.oc-face *{box-sizing:border-box}.oc-layer{position:absolute;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none}.oc-inner{position:relative;display:flex;flex-direction:column;height:100%;padding:20px 23px 17px;gap:9px;text-align:center}
.oc-art{display:block;height:70px;flex:0 0 70px;width:100%;overflow:visible}.oc-heading{flex:none;display:grid;gap:5px}.oc-greeting{font-size:15px;line-height:1.5;overflow-wrap:anywhere}.oc-label{font-family:${EN};font-size:10px;line-height:1.25;letter-spacing:1.5px;color:var(--oc-muted);direction:ltr;overflow-wrap:anywhere}
.oc-names{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:3px}.oc-name{margin:0;font-weight:400;line-height:1.48;overflow-wrap:anywhere;text-wrap:balance}.oc-join{font-size:12px;line-height:1;color:var(--oc-accent)}.oc-latin{font-family:${EN};font-size:10px;line-height:1.25;direction:ltr;letter-spacing:.3px;overflow-wrap:anywhere;margin-top:2px}
.oc-meta{flex:none;display:grid;gap:5px;border-top:1px solid var(--oc-line);padding-top:11px;font-size:11px;line-height:1.55;overflow-wrap:anywhere}.oc-date{font-size:12px;color:var(--oc-ink)}.oc-time{font-size:11px;color:var(--oc-muted)}.oc-place{font-size:11px}.oc-city{color:var(--oc-muted);font-size:10px}.oc-footer{flex:none;font-family:${EN};font-size:8px;letter-spacing:1.1px;line-height:1.35;direction:ltr;color:var(--oc-muted);overflow-wrap:anywhere}
.oc-editorial .oc-inner{padding-top:18px}.oc-editorial .oc-art{height:74px;flex-basis:74px}.oc-editorial .oc-heading{padding:4px 0 1px}.oc-editorial .oc-label{font-family:Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:2px}.oc-editorial .oc-greeting{font-size:17px;color:var(--oc-accent)}.oc-editorial .oc-meta{text-align:right;grid-template-columns:1fr auto;gap:5px 9px}.oc-editorial .oc-place,.oc-editorial .oc-city{grid-column:1/-1}.oc-editorial .oc-footer{text-align:left}
.oc-campus .oc-inner{padding:25px 29px 22px;gap:7px}.oc-campus .oc-art{height:74px;flex-basis:74px}.oc-campus .oc-greeting{font-family:'Amiri',serif;font-size:18px}.oc-campus .oc-label{font-size:9px;letter-spacing:2px}.oc-campus .oc-meta{padding-top:9px;gap:3px}.oc-campus .oc-name{font-family:'Amiri',serif;line-height:1.35}
.oc-constellation .oc-inner{padding:22px 26px 19px;gap:8px}.oc-constellation .oc-art{height:76px;flex-basis:76px}.oc-constellation .oc-greeting{color:var(--oc-accent);font-family:'Amiri',serif;font-size:19px}.oc-constellation .oc-meta{gap:3px;padding-top:9px}.oc-constellation .oc-name{font-family:'Amiri',serif}
.oc-confetti .oc-inner{padding:22px 25px 18px}.oc-confetti .oc-art{height:63px;flex-basis:63px}.oc-confetti .oc-heading{gap:6px}.oc-confetti .oc-greeting{display:block;padding:5px 12px;align-self:center;justify-self:center;border-radius:24px;background:#F9E15F;color:#24345E;font-size:15px}.oc-confetti .oc-label{font-family:Arial,sans-serif;font-size:8px;letter-spacing:1.1px}.oc-confetti .oc-meta{border-top:2px dashed var(--oc-line);gap:4px}.oc-confetti .oc-name{font-weight:500}
.oc-moon .oc-inner{padding:22px 28px 20px;gap:7px}.oc-moon .oc-art{height:86px;flex-basis:86px}.oc-moon .oc-greeting{font-family:'Amiri',serif;font-size:19px}.oc-moon .oc-label{font-size:9px;letter-spacing:1.2px}.oc-moon .oc-meta{padding-top:9px;gap:3px}.oc-moon .oc-name{font-family:'Amiri',serif}
.oc-forum .oc-inner{padding:24px 27px 21px;text-align:right;gap:8px}.oc-forum .oc-art{height:61px;flex-basis:61px}.oc-forum .oc-greeting{font-size:17px}.oc-forum .oc-label{text-align:left;font-family:Arial,sans-serif;font-size:8px;font-weight:700;letter-spacing:1.5px}.oc-forum .oc-names{align-items:stretch}.oc-forum .oc-name{text-wrap:pretty}.oc-forum .oc-join{align-self:center}.oc-forum .oc-latin{text-align:left}.oc-forum .oc-meta{gap:4px;padding-top:12px}.oc-forum .oc-footer{text-align:left}
</style>`;

const svg = (markup, className = 'oc-art', viewBox = '0 0 250 80') => `<svg class="${className}" viewBox="${viewBox}" aria-hidden="true" focusable="false">${markup}</svg>`;
const cap = (x, y, scale, color, detail) => `<g transform="translate(${x} ${y}) scale(${scale})" stroke-linejoin="round"><path d="M-48-5 0-23 48-5 0 14Z" fill="${color}"/><path d="M-29 8v21c15 10 43 10 58 0V8L0 19Z" fill="${color}"/><path d="M0-5 40 10v29" fill="none" stroke="${detail}" stroke-width="2.3"/><circle cx="40" cy="40" r="3" fill="${detail}"/><path d="m37 43-2 10h10l-2-10" fill="${detail}"/><path d="M-29 26c16 9 42 9 58 0" stroke="${detail}" stroke-width="1.3" fill="none"/></g>`;
const star = (x, y, size, color) => `<path d="M${x} ${y-size}l${size*.25} ${size*.75} ${size*.75} ${size*.25}-${size*.75} ${size*.25}-${size*.25} ${size*.75}-${size*.25}-${size*.75}-${size*.75}-${size*.25} ${size*.75}-${size*.25}Z" fill="${color}"/>`;
const diploma = `<g transform="translate(179 56) rotate(-17)"><rect x="-27" y="-8" width="48" height="16" rx="5" fill="#FFF8E8" stroke="#A98544" stroke-width="1.4"/><ellipse cx="21" cy="0" rx="3.6" ry="8" fill="#E9D9BA" stroke="#A98544" stroke-width="1.2"/><path d="M-4-8V8M0-8V8" stroke="#B45C42" stroke-width="2"/><path d="m-4 3-3 15 6-4 6 4L0 3" fill="#B45C42"/></g>`;

/** `room` adjusts the name budget for faces whose ornament takes more (negative) or less height */
export function names(c, room = 0) {
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
  const height = (name, font) => Math.ceil(Math.max(1, name.length) * font * .57 / 234) * font * 1.48;
  while (size > 8 && height(arA, size) + (arB ? height(arB, size) : 0) > budget) size--;
  const latin = latinNames.map(e).join(' &amp; ');
  return `<div class="oc-names"><div class="oc-name" style="font-size:${size}px" dir="rtl">${e(arA)}</div>${arB ? `<span class="oc-join" aria-hidden="true">و</span><div class="oc-name" style="font-size:${size}px" dir="rtl">${e(arB)}</div>` : ''}${latin ? `<div class="oc-latin" lang="en" dir="ltr" style="font-size:${latinSize}px">${latin}</div>` : ''}</div>`;
}
function content(c, artwork) {
  return `${artwork}<div class="oc-heading"><div class="oc-greeting">${e(c.greetingAr)}</div><div class="oc-label" lang="en" dir="ltr">${e(c.eventLabelEnU)}</div></div>${names(c)}<div class="oc-meta"><div class="oc-date">${e(c.dayAr)} · ${e(c.dateAr)}</div><div class="oc-time">${e(c.timeAr)}</div><div class="oc-place">${e(c.venueAr)}</div><div class="oc-city">${e(c.cityAr)}</div></div><div class="oc-footer" lang="en" dir="ltr">${e(c.cardFooterEnU)}</div>`;
}
function face(className, theme, c, artwork, backdrop) {
  return `<div class="oc-face ${className}" dir="rtl" style="--oc-paper:${theme.paper};--oc-ink:${theme.ink};--oc-muted:${theme.muted};--oc-accent:${theme.accent};--oc-line:${theme.accent}55">${STYLE}${backdrop || ''}<div class="oc-inner">${content(c, artwork)}</div></div>`;
}

const designs = [
  {
    id: 'grad-editorial', name: 'Graduation Editorial', swatch: '#2E49BF', tone: 'light', tags: ['graduation', 'modern', 'editorial', 'geometric'],
    theme: { paper: '#FFF9EF', ink: '#172B67', muted: '#4E5C79', accent: '#2E49BF', aText: '#2E49BF', env: '#2E49BF', fAr: AR },
    recommended: ['marble', 'silk', 'sea'],
    render(c) {
      const art = svg(`<rect x="0" y="0" width="250" height="78" rx="3" fill="#2E49BF"/>${cap(125, 32, .82, '#FFF8E7', '#F2D374')}${diploma}<path d="M12 14h28M12 14v28M238 64h-28M238 64V36" stroke="#A7BAF6" fill="none"/>`);
      const bg = svg('<path d="M0 407h300v13H0Z" fill="#2E49BF"/><path d="M0 397h300" stroke="#2E49BF" stroke-width="1"/>', 'oc-layer', '0 0 300 420');
      return face('oc-editorial', this.theme, c, art, bg);
    },
  },
  {
    id: 'grad-campus', name: 'Campus Laureate', swatch: '#486557', tone: 'light', tags: ['graduation', 'classic', 'botanical', 'calm'],
    theme: { paper: '#F5F1E4', ink: '#294839', muted: '#526355', accent: '#61734D', aText: '#415738', env: '#486557', fAr: "'Amiri', serif" },
    recommended: ['garden', 'marble', 'palace'],
    render(c) {
      const leaves = Array.from({ length: 6 }, (_, i) => `<ellipse cx="${76-i*3}" cy="${21+i*8}" rx="4" ry="8" transform="rotate(${-40-i*3} ${76-i*3} ${21+i*8})" fill="#83916A"/><ellipse cx="${174+i*3}" cy="${21+i*8}" rx="4" ry="8" transform="rotate(${40+i*3} ${174+i*3} ${21+i*8})" fill="#83916A"/>`).join('');
      const art = svg(`<ellipse cx="125" cy="40" rx="49" ry="36" fill="none" stroke="#B5B99A"/><path d="M82 15Q56 65 109 75M168 15Q194 65 141 75" fill="none" stroke="#748461" stroke-width="1.3"/>${leaves}${cap(125, 30, .62, '#365344', '#B49A5B')}${star(125, 73, 4, '#AD9357')}`);
      const bg = svg('<rect x="14" y="14" width="272" height="392" rx="2" fill="none" stroke="#788468" stroke-width="1"/><rect x="19" y="19" width="262" height="382" rx="2" fill="none" stroke="#C9CAB4" stroke-width=".7"/><path d="M7 28V7h21M272 7h21v21M7 392v21h21M272 413h21v-21" fill="none" stroke="#9DA785"/>', 'oc-layer', '0 0 300 420');
      return face('oc-campus', this.theme, c, art, bg);
    },
  },
  {
    id: 'grad-constellation', name: 'Constellation Graduate', swatch: '#152139', tone: 'dark', tags: ['graduation', 'celestial', 'night', 'gold', 'luxury'],
    theme: { paper: '#152139', ink: '#FFF3D9', muted: '#D5C9AF', accent: '#E3BE73', aText: '#E3BE73', env: '#0F192B', fAr: "'Amiri', serif" },
    recommended: ['starry', 'sea', 'candlelit'],
    render(c) {
      const art = svg(`<circle cx="125" cy="35" r="34" fill="none" stroke="#6F644F"/><circle cx="125" cy="35" r="38" fill="none" stroke="#E3BE73" stroke-dasharray="1 8"/>${cap(125, 30, .7, '#E3BE73', '#FFF3D9')}${star(55, 38, 5, '#E3BE73')}${star(198, 16, 6, '#E3BE73')}`);
      const bg = svg(`<path d="M15 29 43 11 69 38 28 69 15 29M269 337l-32 25 18 31 29-18-15-38" fill="none" stroke="#B79A62" stroke-width=".6" opacity=".5"/><circle cx="15" cy="29" r="2" fill="#E3BE73"/><circle cx="43" cy="11" r="2" fill="#E3BE73"/><circle cx="69" cy="38" r="2" fill="#E3BE73"/><circle cx="28" cy="69" r="2" fill="#E3BE73"/><circle cx="269" cy="337" r="2" fill="#E3BE73"/><circle cx="237" cy="362" r="2" fill="#E3BE73"/><circle cx="255" cy="393" r="2" fill="#E3BE73"/><circle cx="284" cy="375" r="2" fill="#E3BE73"/>${star(274, 42, 5, '#E3BE73')}${star(21, 352, 4, '#E3BE73')}<rect x="11" y="11" width="278" height="398" rx="8" fill="none" stroke="#B79A62" stroke-width=".7" opacity=".5"/>`, 'oc-layer', '0 0 300 420');
      return face('oc-constellation', this.theme, c, art, bg);
    },
  },
  {
    id: 'birthday-confetti', name: 'Confetti Birthday', swatch: '#F4B4C5', tone: 'light', tags: ['birthday', 'playful', 'pastel', 'modern'],
    theme: { paper: '#FFF7EF', ink: '#24345E', muted: '#606482', accent: '#EC7157', aText: '#B53D29', env: '#EE9CAF', fAr: AR },
    recommended: ['clay', 'petals', 'silk'],
    render(c) {
      const art = svg(`<path d="M87 49h76v26H87Z" fill="#F3B2C4"/><path d="M84 49q7-13 14-4 6-14 13-5 7-14 14-5 7 14 14 5 7 14 13 5 7-9 14 4" fill="#FFF0B5"/><path d="M79 75h92" stroke="#24345E" stroke-width="3" stroke-linecap="round"/><path d="M110 34V19M125 30V15M140 34V19" stroke="#3D62BD" stroke-width="4"/><path d="M110 16c-8-7 0-12 0-12s8 5 0 12M125 12c-8-7 0-12 0-12s8 5 0 12M140 16c-8-7 0-12 0-12s8 5 0 12" fill="#EC7157"/>${star(66, 28, 9, '#3D62BD')}${star(185, 38, 8, '#F1BF49')}<circle cx="188" cy="16" r="4" fill="#F3B2C4"/><path d="m65 58 10-5M172 8l8-6" stroke="#EC7157" stroke-width="3" stroke-linecap="round"/>`);
      const bg = svg('<path d="m11 62 12 4M285 80l-9 9M17 198l10-6M287 229l-8-10M16 342l10 9M274 369l13-6" stroke="#EC7157" stroke-width="4" stroke-linecap="round"/><circle cx="282" cy="150" r="4" fill="#3D62BD"/><circle cx="16" cy="267" r="4" fill="#D5BE60"/><circle cx="280" cy="319" r="3" fill="#EE9CAF"/><path d="M0 410h300v10H0Z" fill="#F4B4C5"/>', 'oc-layer', '0 0 300 420');
      return face('oc-confetti', this.theme, c, art, bg);
    },
  },
  {
    id: 'newborn-moon', name: 'Moonlit Welcome', swatch: '#CFDDE6', tone: 'light', tags: ['newborn', 'celestial', 'calm', 'pastel'],
    theme: { paper: '#F9F7EF', ink: '#354D64', muted: '#586E80', accent: '#AD9158', aText: '#7D652D', env: '#8EA5B4', fAr: "'Amiri', serif" },
    recommended: ['silk', 'petals', 'marble'],
    render(c) {
      const art = svg(`<path d="M137 5a35 35 0 1 0 34 50c-36 16-64-24-34-50Z" fill="#DFC586" stroke="#B79752" stroke-width="1"/><path d="M66 68c-8-17 10-29 22-17 2-20 30-23 36-5 16-7 31 7 24 22Z" fill="#DCE6EB"/><path d="M143 73c-5-12 7-21 16-13 4-15 23-14 27 0 12-4 23 5 18 13Z" fill="#CADAE4"/>${star(66, 19, 5, '#AD9158')}${star(179, 13, 6, '#AD9158')}${star(193, 43, 4, '#AD9158')}<path d="M81 8v16M171 0v6M197 18v15" stroke="#B8CBD8" stroke-width="1"/><circle cx="82" cy="34" r="2" fill="#8EA5B4"/>`);
      const bg = svg(`<path d="M0 0h300v10H0Z" fill="#D9E3E9"/><path d="M0 420v-23c25-12 42-5 52 8 12-18 41-19 57-4 22-24 56-21 72-2 21-20 47-17 61 0 20-19 43-15 58-7v28Z" fill="#DCE6EB"/>${star(19, 129, 4, '#BEA46E')}${star(280, 210, 4, '#BEA46E')}`, 'oc-layer', '0 0 300 420');
      return face('oc-moon', this.theme, c, art, bg);
    },
  },
  {
    id: 'forum-grid', name: 'Forum Grid', swatch: '#52C8CE', tone: 'light', tags: ['corporate', 'conference', 'modern', 'minimal', 'geometric', 'editorial'],
    theme: { paper: '#F2F6F5', ink: '#153C42', muted: '#48686B', accent: '#16818C', aText: '#14616B', env: '#153C42', fAr: AR },
    recommended: ['marble', 'sea', 'palace'],
    render(c) {
      const art = svg('<rect x="0" y="1" width="59" height="59" fill="#153C42"/><path d="M11 30h37M30 11v37" stroke="#60D5D7" stroke-width="2"/><rect x="70" y="1" width="59" height="59" fill="#52C8CE"/><circle cx="99.5" cy="30.5" r="18" stroke="#153C42" stroke-width="2" fill="none"/><path d="M141 2h107M141 16h107M141 30h107M141 44h107M141 58h107" stroke="#8AACAD" stroke-width=".8"/><path d="M155 2v56M176 2v56M197 2v56M218 2v56M239 2v56" stroke="#8AACAD" stroke-width=".8"/>', 'oc-art', '0 0 250 61');
      const bg = svg('<path d="M0 0h300v8H0Z" fill="#153C42"/><path d="M0 408h300v12H0Z" fill="#52C8CE"/><path d="M291 20v376" stroke="#52C8CE" stroke-width="2"/>', 'oc-layer', '0 0 300 420');
      return face('oc-forum', this.theme, c, art, bg);
    },
  },
];

CardRegistry.registerMany(designs.map(({ recommended, ...design }) => ({
  ...design,
  tags: [design.tone, ...design.tags],
  renderMode: 'svg', reducedMotion: 'static', mobile: true,
  compat: { recommended }, source: 'src/cards/occasion-cards.js',
})));
