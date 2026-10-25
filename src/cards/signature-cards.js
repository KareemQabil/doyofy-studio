/**
 * «توقيع» stationery — three original 300×420 faces for the Signature theme family.
 * Same contract as the other faces: derived content `c`, escaped text, single/couple handling via names(),
 * dynamic dates (the graduation seal prints the event's real year — never a fixed class year).
 * Decorative vectors carry no text except live data, no external resources, no SVG ids (no id collisions
 * when many thumbnails share a page), and no animation (static/reduced-motion safe).
 * Built on the Doyofy identity palette; the only pictorial element is a Phosphor Thin glyph (MIT) — nothing hand-drawn.
 *   sig-diploma  «توقيع التخرّج»  graduation — charcoal band, gold cap glyph, gold year disc, double gold rule
 *   sig-ribbon   «حروف الفرح»     couple ceremonies (also single) — brand-red band, ivory monogram disc, gold rules
 *   sig-ticket   «تذكرة الفرح»    birthday · opening · family · other — perforated ticket, colour shapes, date stub
 */
import { CardRegistry } from '../engine/registries.js';
import { e, names, STYLE } from './occasion-cards.js';
import { OCCASION_GLYPHS_THIN } from '../ui/vendor-icons/phosphor';

/** a Phosphor Thin glyph (MIT) as inline SVG paths, placed at (x,y) with a given size and colour */
const glyph = (type, x, y, size, color) => `<g transform="translate(${x - size / 2} ${y - size / 2}) scale(${size / 256})" fill="${color}">${(OCCASION_GLYPHS_THIN[type] || []).map((n) => `<path d="${n.attr.d}"/>`).join('')}</g>`;

const TYPE_WORDS = [['GRADUAT', 'graduation'], ['ENGAGE', 'engagement'], ['KATB', 'katb_kitab'], ['HENNA', 'henna'], ['BIRTH', 'birthday'], ['NEWBORN', 'newborn'], ['BABY', 'newborn'], ['IFTAR', 'iftar'], ['RAMADAN', 'iftar'], ['FAMILY', 'family'], ['CONFER', 'conference'], ['OPENING', 'opening'], ['LAUNCH', 'opening'], ['CORPORATE', 'corporate'], ['COMPANY', 'corporate'], ['WEDDING', 'wedding']];
/** The occasion behind the derived label (cards receive content, not the event type). */
const typeOf = (c) => { const l = String(c.eventLabelEnU || ''); return (TYPE_WORDS.find(([w]) => l.includes(w)) || [null, 'other'])[1]; };
const KF = "'Reem Kufi', 'Amiri', sans-serif";
const RQ = "'Aref Ruqaa', 'Amiri', serif";
const EN = "'Cormorant Garamond', Georgia, serif";

const SIG_STYLE = `<style>
.sc-face .oc-inner{gap:7px}
.sc-diploma .oc-inner{padding:170px 26px 16px;gap:5px}
.sc-diploma .oc-greeting{font-size:16px;color:#7A5E26}
.sc-diploma .oc-label{font-size:9px;letter-spacing:2.4px}
.sc-diploma .oc-names{justify-content:flex-start;padding-top:2px}
.sc-diploma .oc-meta{border-top:0;padding-top:4px;position:relative}
.sc-diploma .oc-meta::before{content:'';position:absolute;top:-2px;left:30%;right:30%;height:1px;background:#C9A35A}
.sc-diploma .oc-footer{color:#5F594F}
.sc-year{position:absolute;top:123px;left:50%;width:46px;height:46px;margin-left:-23px;display:grid;place-items:center;border-radius:50%;font:600 12px/1 ${EN};letter-spacing:.5px;color:#262626;direction:ltr}
.sc-ribbon .oc-inner{padding:136px 34px 18px 30px}
.sc-ribbon .oc-greeting{font-family:${RQ};font-size:18px;color:#A23B3D}
.sc-ribbon .oc-name{font-family:${RQ};font-weight:700}
.sc-ribbon .oc-join{font-family:${RQ};font-size:20px;color:#BC4749}
.sc-ribbon .oc-meta{border-top-color:#C7A661}
.sc-mono{position:absolute;top:72px;left:50%;width:56px;height:56px;margin-left:-28px;display:grid;place-items:center;font:700 19px/1 ${RQ};color:#BC4749;letter-spacing:1px}
.sc-ticket .oc-inner{padding:20px 24px 0;gap:6px}
.sc-ticket .oc-art{height:62px;flex-basis:62px}
.sc-ticket .oc-greeting{font-size:15px;font-weight:500}
.sc-ticket .oc-label{font-size:8.5px;letter-spacing:2px;color:#5F594F}
.sc-ticket .oc-names{padding-bottom:6px}
.sc-ticket .oc-meta{display:none}
.sc-stub{position:absolute;left:0;right:0;bottom:0;height:112px;display:grid;grid-template-columns:86px 1fr;align-items:center;gap:12px;padding:12px 22px 14px;direction:rtl;text-align:right;font-family:${KF}}
.sc-day{display:grid;justify-items:center;line-height:1;color:#C7A661;background:#262626;border-radius:12px;padding:10px 4px 9px;gap:4px}
.sc-day b{font:600 30px/1 ${EN};direction:ltr}
.sc-day span{font-size:11px}
.sc-day small{font:500 10px/1 ${EN};letter-spacing:1px;opacity:.85;direction:ltr}
.sc-when{display:grid;gap:2px;font-size:10.5px;line-height:1.5;color:#262626;min-width:0;overflow-wrap:anywhere}
.sc-when .sc-dayname{font-size:12px;font-weight:600}
.sc-when .sc-muted{color:#5F594F;font-size:10.5px}
</style>`;

const svg = (markup, cls = 'oc-layer', vb = '0 0 300 420') => `<svg class="${cls}" viewBox="${vb}" aria-hidden="true" focusable="false">${markup}</svg>`;

function body(c, room = 0) {
  return `<div class="oc-heading"><div class="oc-greeting">${e(c.greetingAr)}</div><div class="oc-label" lang="en" dir="ltr">${e(c.eventLabelEnU)}</div></div>${names(c, room)}<div class="oc-meta"><div class="oc-date">${e(c.dayAr)} · ${e(c.dateAr)}</div><div class="oc-time">${e(c.timeAr)}</div><div class="oc-place">${e(c.venueAr)}</div><div class="oc-city">${e(c.cityAr)}</div></div><div class="oc-footer" lang="en" dir="ltr">${e(c.cardFooterEnU)}</div>`;
}
const face = (cls, t, inner, layers) => `<div class="oc-face sc-face ${cls}" dir="rtl" style="--oc-paper:${t.paper};--oc-ink:${t.ink};--oc-muted:${t.muted};--oc-accent:${t.accent};--oc-line:${t.accent}55">${STYLE}${SIG_STYLE}${layers}<div class="oc-inner">${inner}</div></div>`;

/** Arabic monogram letter (skips «عائلة/آل/أم/أبو» and the article «ال») */
const initial = (name) => { const core = String(name ?? '').replace(/^(عائلة|آل|أم|أبو)\s+/, '').replace(/^ال(?=\S{2,})/, '').trim(); return [...core][0] ?? ''; };

const designs = [
  {
    id: 'sig-diploma', name: 'Signature Diploma', swatch: '#262626', tone: 'light', tags: ['graduation', 'signature', 'modern', 'editorial', 'gold'],
    theme: { paper: '#FFFDF8', ink: '#262626', muted: '#5F594F', accent: '#A8874C', aText: '#7A5E26', env: '#262626', fAr: KF },
    recommended: ['marble', 'silk', 'palace'],
    render(c) {
      const layers = svg(
        `<rect x="0" y="0" width="300" height="146" fill="#262626"/>`
        + `<rect x="12" y="12" width="276" height="396" rx="3" fill="none" stroke="#C7A661" stroke-width="1"/><rect x="17" y="17" width="266" height="386" rx="2" fill="none" stroke="#C7A661" stroke-opacity=".5" stroke-width=".6"/>`
        + glyph(typeOf(c), 150, 76, typeOf(c) === 'graduation' ? 92 : 76, '#C7A661')
        + `<circle cx="150" cy="146" r="25" fill="#C7A661"/><circle cx="150" cy="146" r="20.5" fill="none" stroke="#262626" stroke-width="1"/>`
        + `<path d="M40 400h220" stroke="#C7A661" stroke-width="1"/>`);
      const seal = `<div class="sc-year" lang="en" aria-hidden="true">${e(c.year)}</div>`;
      return face('sc-diploma', this.theme, body(c, -56), layers + seal);
    },
  },
  {
    id: 'sig-ribbon', name: 'Monogram Letter', swatch: '#BC4749', tone: 'light', tags: ['signature', 'classic', 'romantic', 'gold', 'warm'],
    theme: { paper: '#FFFDF8', ink: '#262626', muted: '#5F594F', accent: '#BC4749', aText: '#A23B3D', env: '#BC4749', fAr: RQ },
    recommended: ['candlelit', 'palace', 'silk'],
    render(c) {
      const mono = [initial(c.arA), c.arB ? initial(c.arB) : ''].filter(Boolean).map(e).join(' ');
      const layers = svg(
        `<rect x="0" y="0" width="300" height="100" fill="#BC4749"/>`
        + `<rect x="12" y="12" width="276" height="396" rx="3" fill="none" stroke="#C7A661" stroke-width="1"/><rect x="17" y="17" width="266" height="386" rx="2" fill="none" stroke="#C7A661" stroke-opacity=".5" stroke-width=".6"/>`
        + `<circle cx="150" cy="100" r="31" fill="#FFFDF8"/><circle cx="150" cy="100" r="26" fill="none" stroke="#C7A661" stroke-width="1.2"/><circle cx="150" cy="100" r="23" fill="none" stroke="#C7A661" stroke-opacity=".5" stroke-width=".6"/>`
        + glyph(typeOf(c), 150, 46, 40, '#F2EAD9'));
      const seal = `<div class="sc-mono" aria-hidden="true">${mono}</div>`;
      return face('sc-ribbon', this.theme, body(c, -34), layers + seal);
    },
  },
  {
    id: 'sig-ticket', name: 'Celebration Ticket', swatch: '#2EB7B7', tone: 'light', tags: ['signature', 'birthday', 'playful', 'modern', 'geometric'],
    theme: { paper: '#FFFDF8', ink: '#262626', muted: '#5F594F', accent: '#BC4749', aText: '#A23B3D', env: '#2EB7B7', fAr: KF },
    recommended: ['clay', 'petals', 'marble'],
    render(c) {
      const art = svg(`<rect x="18" y="8" width="44" height="52" rx="22" fill="#262626"/><path d="M76 60a32 32 0 0 1 32-32v32Z" fill="#BC4749"/><circle cx="140" cy="34" r="24" fill="#C7A661"/><path d="M178 60l22-40 22 40Z" fill="#2EB7B7"/><circle cx="236" cy="18" r="6" fill="#BC4749"/>`, 'oc-art', '0 0 250 62');
      const layers = svg(
        `<path d="M0 300h300v120H0Z" fill="#F2EAD9"/><path d="M14 308H286" stroke="#262626" stroke-opacity=".35" stroke-width="1.2" stroke-dasharray="5 5"/><circle cx="0" cy="308" r="13" fill="#E4D5B4"/><circle cx="300" cy="308" r="13" fill="#E4D5B4"/>`
        + `<rect x="8" y="8" width="284" height="404" rx="8" fill="none" stroke="#262626" stroke-opacity=".12"/>`);
      const stub = `<div class="sc-stub"><div class="sc-day" aria-hidden="true"><b lang="en">${e(c.dayNum)}</b><span>${e(c.monthAr)}</span><small lang="en">${e(c.year)}</small></div><div class="sc-when"><div class="sc-dayname">${e(c.dayAr)} · ${e(c.dateAr)}</div><div>${e(c.timeAr)}</div><div>${e(c.venueAr)}</div><div class="sc-muted">${e(c.cityAr)}</div></div></div>`;
      const inner = `${art}<div class="oc-heading"><div class="oc-greeting">${e(c.greetingAr)}</div><div class="oc-label" lang="en" dir="ltr">${e(c.eventLabelEnU)}</div></div>${names(c, 4)}<div class="oc-meta"></div>`;
      return face('sc-ticket', this.theme, inner, layers + stub).replace('<div class="oc-inner">', '<div class="oc-inner" style="height:300px">');
    },
  },
];

CardRegistry.registerMany(designs.map(({ recommended, ...design }) => ({
  ...design,
  tags: [design.tone, ...design.tags],
  renderMode: 'svg', reducedMotion: 'static', mobile: true,
  compat: { recommended }, source: 'src/cards/signature-cards.js',
})));
