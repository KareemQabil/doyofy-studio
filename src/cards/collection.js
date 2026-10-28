/**
 * «الطقم» collection — 300×420 faces, at least two per occasion: the Designer Kit thirteen, six flat motion faces
 * (motion-art.js, after the owner's GSAP reference), nine composed from the owner's PDF layers and two typographic.
 * Vector motifs are inlined from kit-art.ts (cleaned, id-free, tintable); the five watercolour / satin / wax /
 * paper layers are small WebP files in assets/cards/kit/. Every word stays live text: titles, names, dates.
 * Layout patterns follow common Arabic stationery: a calligraphic occasion title, an ornamental «و» between
 * names, a three-icon date / time / place row, and a large day numeral between rules.
 * The title follows the event's own occasion (typeOf), so a face reused for another occasion never says «زفاف».
 */
import { CardRegistry } from '../engine/registries.js';
import { e, names, STYLE, typeOf } from './kit-helpers.js';
import { UI_GLYPHS } from '../ui/vendor-icons/phosphor';
import { KIT } from './kit-art';
import { MOTION_ART } from './motion-art.js';

const IMG = 'assets/cards/kit/';
const RQ = "'Aref Ruqaa', 'Amiri', serif";
const AM = "'Amiri', serif";
const KF = "'Reem Kufi', 'Amiri', sans-serif";
const RX = "'Readex Pro', 'IBM Plex Sans Arabic', sans-serif";
const EN = "'Cormorant Garamond', Georgia, serif";

const TITLES = {
  wedding: 'حفل زفاف', engagement: 'حفل خطوبة', katb_kitab: 'عقد قِران', henna: 'ليلة الحنّة', birthday: 'عيد ميلاد',
  graduation: 'حفل تخرّج', newborn: 'أهلًا بالمولود', family: 'لمّة العائلة', iftar: 'دعوة إفطار', conference: 'دعوة حضور',
  opening: 'حفل افتتاح', corporate: 'دعوة خاصة', other: 'دعوة',
};

/** a kit motif placed in the 300×420 layer; fit 'none' stretches line frames to the box; swap recolours fills/strokes */
function motif(key, x, y, w, h, o = {}) {
  const m = KIT[key];
  const sx = o.flip?.includes('x') ? -1 : 1, sy = o.flip?.includes('y') ? -1 : 1;
  const cx = x + w / 2, cy = y + h / 2;
  const t = sx !== 1 || sy !== 1 || o.rotate ? ` transform="translate(${cx} ${cy}) rotate(${o.rotate || 0}) scale(${sx} ${sy}) translate(${-cx} ${-cy})"` : '';
  const style = [o.color && `color:${o.color}`, o.opacity != null && `opacity:${o.opacity}`].filter(Boolean).join(';');
  const fit = o.fit === 'none' ? 'none' : `xMidYMid ${o.fit || 'meet'}`;
  const art = o.swap ? Object.entries(o.swap).reduce((a, [from, to]) => a.split(`"${from}"`).join(`"${to}"`), m.svg) : m.svg;
  return `<g${t}${style ? ` style="${style}"` : ''}><svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${m.vb}" preserveAspectRatio="${fit}" overflow="${o.fit === 'slice' ? 'hidden' : 'visible'}">${art}</svg></g>`;
}
const layer = (markup) => `<svg class="oc-layer" viewBox="0 0 300 420" aria-hidden="true" focusable="false">${markup}</svg>`;
const img = (file, style) => `<img class="kc-img" src="${IMG}${file}" alt="" decoding="async" draggable="false" style="${style}">`;
const icon = (name) => `<svg class="kc-ic" viewBox="0 0 256 256" aria-hidden="true" focusable="false" fill="currentColor">${(UI_GLYPHS[name] || []).map((n) => `<path d="${n.attr.d}"/>`).join('')}</svg>`;
const sparkle = (x, y, s, color) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${color}"/>`;
/** an inline kit ornament inside the text flow (dividers) */
const rule = (key, w, h, color) => `<svg class="kc-rule" viewBox="${KIT[key].vb}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" style="color:${color}" aria-hidden="true" focusable="false">${KIT[key].svg}</svg>`;
/** Arabic monogram letter (skips «عائلة/آل/أم/أبو» and the article «ال») */
const initial = (name) => { const core = String(name ?? '').replace(/^(عائلة|آل|أم|أبو)\s+/, '').replace(/^ال(?=\S{2,})/, '').trim(); return [...core][0] ?? ''; };

// ── text blocks ─────────────────────────────────────────────────────────────────────────────────────
/** greeting (couples only: for one name the greeting repeats the occasion) + calligraphic occasion title */
const head = (c) => `<div class="kc-head">${c.arB ? `<div class="kc-greet">${e(c.greetingAr)}</div>` : ''}<div class="kc-title">${e(TITLES[typeOf(c)] || TITLES.other)}</div></div>`;
/** centred classic lines */
const lines = (c) => `<div class="kc-lines"><div class="kc-date">${e(c.dayAr)} · ${e(c.dateAr)}</div><div class="kc-time">${e(c.timeAr)}</div><div class="kc-place">${e(c.venueAr)}</div><div class="kc-city">${e(c.cityAr)}</div></div>`;
/** three-icon row (date | time | city) with the venue on its own line */
const info = (c) => `<div class="kc-info"><div class="kc-row"><div class="kc-cell">${icon('calendar')}<span>${e(c.dayAr)}</span><b>${e(c.dateAr)}</b></div><div class="kc-cell">${icon('clock')}<span>الساعة</span><b>${e(c.timeAr)}</b></div><div class="kc-cell">${icon('pin')}<span>المدينة</span><b>${e(c.cityAr)}</b></div></div><div class="kc-venue">${e(c.venueAr)}</div></div>`;
/** large day numeral between the weekday and the month */
const bigDay = (c) => `<div class="kc-day"><span class="kc-day-side">${e(c.dayAr)}</span><b lang="en" dir="ltr">${e(c.dayNum)}</b><span class="kc-day-side">${e(c.monthAr)} ${e(c.year)}</span></div><div class="kc-when"><span>${e(c.timeAr)}</span> · <span>${e(c.venueAr)}</span>، <span>${e(c.cityAr)}</span></div>`;
/** right-aligned stack with icons */
const stack = (c) => `<div class="kc-stack"><div>${icon('calendar')}<span>${e(c.dayAr)} · ${e(c.dateAr)}</span></div><div>${icon('clock')}<span>${e(c.timeAr)}</span></div><div>${icon('pin')}<span>${e(c.venueAr)}<small>${e(c.cityAr)}</small></span></div></div>`;
/** one compact line under the names: weekday · date · time, then venue · city */
const when = (c) => `<div class="kc-lines"><div class="kc-date">${e(c.dayAr)} · ${e(c.dateAr)} · ${e(c.timeAr)}</div><div class="kc-place">${e(c.venueAr)}، ${e(c.cityAr)}</div></div>`;
const latin = (c) => `<div class="kc-latin" lang="en" dir="ltr">${e(c.eventLabelEnU)}</div>`;

const KC_STYLE = `<style>
.kc .oc-inner{gap:6px}
.kc-img{position:absolute;z-index:-1;pointer-events:none;user-select:none;max-width:none}
.kc-head{flex:none;display:grid;gap:2px;justify-items:center}
.kc-greet{font:400 13px/1.5 ${AM};color:var(--oc-muted)}
.kc-title{font:700 30px/1.25 ${RQ};color:var(--kc-a);overflow-wrap:anywhere}
.kc .oc-name{font-family:${RQ};font-weight:700}
.kc .oc-join{font:700 22px/1 ${RQ};color:var(--kc-a)}
.kc-rule{display:block;margin:0 auto;flex:none}
.kc-lines{flex:none;display:grid;gap:2px;font-size:11.5px;line-height:1.5;overflow-wrap:anywhere}
.kc-date{font-size:12.5px}.kc-time,.kc-city{color:var(--oc-muted)}
.kc-info{flex:none;display:grid;gap:6px}
.kc-row{display:grid;grid-template-columns:1fr 1fr 1fr;border-block:1px solid var(--oc-line);padding:7px 0}
.kc-cell{display:grid;justify-items:center;align-content:start;gap:1px;padding:0 4px;font-size:10px;line-height:1.4;color:var(--oc-muted);overflow-wrap:anywhere;min-width:0}
.kc-cell+.kc-cell{border-inline-start:1px solid var(--oc-line)}
.kc-cell b{font-weight:500;font-size:11px;color:var(--oc-ink)}
.kc-ic{width:14px;height:14px;color:var(--kc-a);flex:none;margin-bottom:2px}
.kc-venue{font-size:11.5px;line-height:1.5;overflow-wrap:anywhere}
.kc-day{flex:none;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;color:var(--oc-ink)}
.kc-day b{font:500 44px/1 ${EN};color:var(--kc-a)}
.kc-day-side{border-block:1px solid var(--oc-line);padding:4px 0;font-size:11px;line-height:1.35;overflow-wrap:anywhere}
.kc-when{flex:none;font-size:11px;line-height:1.5;color:var(--oc-ink);overflow-wrap:anywhere}
.kc-stack{flex:none;display:grid;gap:5px;font-size:11.5px;line-height:1.45;text-align:right}
.kc-stack div{display:grid;grid-template-columns:16px 1fr;gap:7px;align-items:start}
.kc-stack .kc-ic{margin:1px 0 0}
.kc-stack span{overflow-wrap:anywhere;min-width:0}.kc-stack small{display:block;font-size:10.5px;color:var(--oc-muted)}
.kc-latin{font:500 9px/1.3 ${EN};letter-spacing:2.4px;color:var(--oc-muted);direction:ltr;overflow-wrap:anywhere}

.kc-wd .oc-inner{padding:50px 46px 34px;gap:5px}
.kc-wd .kc-title{font-size:32px}
.kc-wd .kc-lines{padding-top:4px}

.kc-en .oc-inner{padding:112px 50px 20px;gap:5px}
.kc-en .kc-title{font-size:27px}
.kc-en .oc-names{padding-bottom:12px}

.kc-kt .oc-inner{padding:128px 52px 30px;gap:5px}
.kc-kt .kc-title{font-size:28px}
.kc-seal{position:absolute;top:34px;left:50%;width:70px;height:66px;margin-left:-35px;display:grid;place-items:center;font:700 19px/1 ${RQ};color:#F5E6CF;letter-spacing:2px;padding-bottom:3px}

.kc-hn .oc-inner{padding:58px 46px 40px;gap:5px}
.kc-hn .kc-title{font-size:34px}
.kc-hn .kc-greet{color:var(--oc-muted)}

.kc-bd .oc-inner{padding:168px 32px 22px;gap:5px}
.kc-bd .kc-title{font:600 26px/1.3 ${KF}}
.kc-bd .oc-name{font-family:${RX};font-weight:600}

.kc-gr .oc-inner{padding:170px 30px 20px;gap:4px}
.kc-gr .kc-title{font-size:27px}
.kc-class{font:600 10px/1.2 ${RX};letter-spacing:1.5px;color:var(--oc-muted)}

.kc-nb .oc-inner{padding:140px 32px 58px;gap:5px}
.kc-nb .kc-title{font-size:26px}

.kc-fm .oc-inner{padding:108px 30px 78px;gap:5px}
.kc-fm .kc-title{font-size:28px}

.kc-if .oc-inner{padding:156px 30px 30px;gap:5px}
.kc-if .kc-title{font-size:31px}

.kc-cf .oc-inner{padding:34px 24px 26px 98px;text-align:right;gap:8px}
.kc-cf .kc-head{justify-items:start}
.kc-cf .kc-title{font:600 14px/1.3 ${RX};color:var(--kc-a)}
.kc-cf .oc-names{justify-content:center;align-items:stretch}
.kc-cf .oc-name{font-family:${RX};font-weight:600;text-wrap:pretty}
.kc-cf .oc-latin{text-align:left}
.kc-cf .kc-latin{text-align:left}

.kc-op .oc-inner{padding:160px 32px 26px;gap:5px}
.kc-op .kc-title{font:600 22px/1.3 ${KF}}
.kc-op .oc-name{font-family:${RX};font-weight:600}
.kc-band{position:absolute;left:0;right:0;top:62px;height:24px;z-index:-1;background:linear-gradient(180deg,#F1E6CF 0%,#DCC79F 46%,#C8AE7E 54%,#EFE3CA 100%);box-shadow:0 1px 2px rgba(80,60,20,.18)}

.kc-cp .oc-inner{padding:166px 32px 26px;gap:6px}
.kc-cp .kc-title{font:500 16px/1.3 ${KF}}
.kc-cp .oc-name{font-family:${RX};font-weight:600}
.kc-year{position:absolute;top:76px;left:50%;width:80px;margin-left:-40px;text-align:center;font:600 22px/1 ${EN};letter-spacing:1px;direction:ltr}

.kc-ot .oc-inner{padding:44px 30px 38px 86px;text-align:right;gap:7px}
.kc-ot .kc-head{justify-items:start}
.kc-ot .kc-title{font-size:46px;line-height:1.1}
.kc-ot .oc-names{align-items:stretch;justify-content:flex-start;padding-top:6px}
.kc-ot .oc-join{align-self:flex-start;padding-inline-start:4px}
.kc-ot .oc-latin{text-align:right}

/* motion faces (art in motion-art.js) */
.kc-mw .oc-inner{padding:112px 58px 96px;gap:4px}.kc-mw .kc-title{font-size:27px}
.kc-mo .oc-inner{padding:150px 38px 30px;gap:5px}.kc-mo .kc-title{font-size:27px}
.kc-mc .oc-inner{padding:128px 40px 96px;gap:4px}.kc-mc .kc-title{font:600 25px/1.3 ${KF}}.kc-mc .oc-name{font-family:${RX};font-weight:600}
.kc-ms .oc-inner{padding:150px 34px 34px;gap:4px}.kc-ms .kc-title{font-size:27px}
.kc-ml .oc-inner{padding:148px 44px 34px;gap:5px}.kc-ml .kc-title{font-size:29px}
.kc-mm .oc-inner{padding:132px 40px 82px;gap:4px}.kc-mm .kc-title{font-size:26px}
/* owner's PDF layers */
.kc-pg .oc-inner{padding:80px 44px 168px;gap:3px}.kc-pg .kc-title{font-size:25px}.kc-pg .kc-lines{font-size:10.5px}
.kc-pr .oc-inner{padding:78px 40px 118px;gap:4px}.kc-pr .kc-title{font-size:29px}
.kc-pa .oc-inner{padding:112px 40px 34px 92px;gap:5px;color:var(--oc-ink)}.kc-pa .kc-title{font-size:26px}
.kc-arch{position:absolute;z-index:-1;inset:24px 22px 0 80px;border-radius:118px 118px 0 0;background:#617356}
.kc-mono{flex:none;font:700 44px/1 ${RQ};color:var(--kc-a);letter-spacing:4px}
.kc-ph .oc-inner{padding:118px 42px 112px;gap:5px}.kc-ph .kc-title{font:600 31px/1.25 ${KF}}.kc-ph .oc-name{font-family:${KF};font-weight:600}
.kc-pb .oc-inner{padding:64px 70px 40px;gap:5px}.kc-pb .kc-title{font:700 27px/1.3 ${KF}}.kc-pb .oc-name{font-family:${RX};font-weight:600}
.kc-pc .oc-inner{padding:44px 34px 172px;gap:4px}.kc-pc .kc-title{font-size:24px}.kc-pc .kc-script{font:400 30px/1 'Great Vibes',${EN};color:var(--kc-a);direction:ltr}
.kc-pp .oc-inner{padding:118px 44px 46px;gap:5px}.kc-pp .kc-title{font-size:29px}
.kc-po .oc-inner{padding:96px 40px 40px;gap:5px}.kc-po .kc-title{font:600 25px/1.3 ${KF}}.kc-po .oc-name{font-family:${RX};font-weight:600}
.kc-pd .oc-inner{padding:52px 44px 176px;gap:4px}.kc-pd .kc-title{font-size:30px}
/* typographic faces */
.kc-tv .oc-inner{padding:34px 26px 24px 84px;text-align:right;gap:7px}.kc-tv .kc-head{justify-items:start}.kc-tv .kc-title{font:700 24px/1.25 ${RX};color:var(--kc-a)}
.kc-tv .oc-names{align-items:stretch}.kc-tv .oc-name{font-family:${RX};font-weight:600}.kc-tv .oc-join{align-self:flex-start}.kc-tv .oc-latin{text-align:right}
.kc-vlabel{position:absolute;top:22px;bottom:22px;left:16px;width:52px;writing-mode:vertical-rl;transform:rotate(180deg);font:800 30px/52px ${RX};letter-spacing:1px;color:var(--kc-a);overflow:hidden;white-space:nowrap;direction:ltr;text-align:start}
.kc-vrule{position:absolute;top:22px;bottom:22px;left:74px;width:1px;background:var(--oc-accent);opacity:.6}
.kc-tb .oc-inner{padding:58px 34px 30px;gap:6px}.kc-tb .kc-title{font:700 40px/1.15 ${KF};color:var(--oc-ink)}.kc-tb .kc-greet{color:var(--oc-muted)}.kc-tb .oc-name{font-family:${RX};font-weight:600}
</style>`;

function face(d, c, inner) {
  const t = d.theme;
  const pal = d.palette ? Object.entries(d.palette).map(([k, v]) => `;--${k}:${v}`).join('') : '';
  return `<div class="oc-face kc kc-${d.cls}" dir="rtl" data-motion="${d.motion || ''}" style="--oc-paper:${t.paper};--oc-ink:${t.ink};--oc-muted:${t.muted};--oc-accent:${t.accent};--oc-line:${t.accent}66;--kc-a:${t.aText}${pal}">${STYLE}${KC_STYLE}${d.back(c)}<div class="oc-inner">${inner}</div></div>`;
}

const DESIGNS = [
  {
    id: 'kit-rose-garden', fit: [22, 208, 0.36], cls: 'wd', name: 'حديقة الورد', type: 'wedding', style: 'classic', swatch: '#F3EBDD', tone: 'light', scenes: ['silk', 'palace', 'marble'],
    theme: { paper: '#FBF6EC', ink: '#3B2E25', muted: '#6B5A4A', accent: '#A88A52', aText: '#80612B', env: '#7A2E35', fAr: RQ },
    back: () => img('cotton-paper.webp', 'inset:0;width:100%;height:100%;object-fit:cover')
      + layer('<rect x="15" y="15" width="270" height="390" fill="none" stroke="#B59A63" stroke-width=".8"/><rect x="19" y="19" width="262" height="382" fill="none" stroke="#B59A63" stroke-opacity=".45" stroke-width=".5"/>')
      + img('rose-corner.webp', 'left:-8px;bottom:-10px;width:96px')
      + img('rose-corner.webp', 'right:-6px;top:-8px;width:92px;transform:rotate(180deg)'),
    body: (c, n) => `${head(c)}${rule('divider', 118, 12, '#A88A52')}${n}${lines(c)}`,
  },
  {
    id: 'kit-two-rings', fit: [-14, 200, 0.36], cls: 'en', name: 'خاتمان', type: 'engagement', style: 'minimal', swatch: '#F4DCD8', tone: 'light', scenes: ['petals', 'silk', 'marble'],
    theme: { paper: '#FCF2EF', ink: '#4A2C30', muted: '#73535A', accent: '#C29A86', aText: '#94505A', env: '#B9858A', fAr: RQ },
    back: () => layer(motif('ovalFrame', 24, 10, 252, 322, { color: '#C9A27A', fit: 'none' })
      + motif('rings', 116, 34, 68, 64) + motif('petals', -10, 318, 120, 110, { opacity: 0.42 }) + motif('petals', 200, 320, 110, 100, { opacity: 0.36, flip: 'x' })),
    body: (c, n) => `${head(c)}${n}${bigDay(c)}`,
  },
  {
    id: 'kit-seal-arch', fit: [-48, 196, 0.36], cls: 'kt', name: 'ميثاق وقوس', type: 'katb_kitab', style: 'classic', swatch: '#6E1E24', tone: 'light', scenes: ['palace', 'silk', 'candlelit'],
    theme: { paper: '#F6F0E4', ink: '#2E2A22', muted: '#5E5648', accent: '#A9854A', aText: '#7E6230', env: '#6E1E24', fAr: RQ },
    back: () => layer(motif('tile', 0, 0, 300, 74, { fit: 'slice', color: '#B49A60', opacity: 0.5 }) + '<path d="M0 74h300" stroke="#B49A60" stroke-width=".8"/>'
      + motif('archFrame', 28, 58, 244, 346, { fit: 'none', color: '#A9854A' }))
      + img('wax-seal.webp', 'left:50%;top:32px;width:74px;margin-left:-37px'),
    seal: true,
    body: (c, n) => `${head(c)}${n}${rule('divider', 104, 11, '#A9854A')}${lines(c)}`,
  },
  {
    id: 'kit-henna-rosette', fit: [10, 208, 0.36], cls: 'hn', name: 'وردة الحنّة', type: 'henna', style: 'bold', swatch: '#3B4A2F', tone: 'dark', scenes: ['palace', 'desert', 'candlelit'],
    theme: { paper: '#36442B', ink: '#F7F0DF', muted: '#E3D8BC', accent: '#D8B871', aText: '#E8CB88', env: '#283320', fAr: RQ },
    back: () => layer(motif('rosette', 40, 96, 220, 220, { color: '#D8B871', opacity: 0.09 })
      + motif('rosette', -48, -48, 120, 120, { color: '#D8B871', opacity: 0.75 }) + motif('rosette', 228, -48, 120, 120, { color: '#D8B871', opacity: 0.75 })
      + motif('rosette', -48, 348, 120, 120, { color: '#D8B871', opacity: 0.75 }) + motif('rosette', 228, 348, 120, 120, { color: '#D8B871', opacity: 0.75 })
      + '<rect x="14" y="14" width="272" height="392" fill="none" stroke="#D8B871" stroke-opacity=".6" stroke-width=".7"/>'),
    body: (c, n) => `${head(c)}${rule('divider', 112, 12, '#D8B871')}${n}${lines(c)}`,
  },
  {
    id: 'kit-balloons', fit: [-54, 236, 0.4], cls: 'bd', name: 'بالونات', type: 'birthday', style: 'bold', swatch: '#F2B8C0', tone: 'light', scenes: ['clay', 'petals', 'silk'],
    theme: { paper: '#FFF8EF', ink: '#3A2F45', muted: '#625870', accent: '#D59A6B', aText: '#A2475A', env: '#E58FA0', fAr: RX },
    back: () => layer(motif('bunting', -12, -4, 324, 64) + motif('balloons', 96, 40, 108, 124)
      + [[30, 96, '#E0AC8C'], [262, 120, '#9CB7A6'], [48, 150, '#B7A6D6'], [244, 70, '#E8C66E'], [22, 380, '#E8C66E'], [276, 392, '#E0AC8C']].map(([x, y, f]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="${f}"/>`).join('')
      + sparkle(70, 120, 6, '#E8C66E') + sparkle(232, 150, 5, '#E0AC8C')),
    body: (c, n) => `${head(c)}${n}${bigDay(c)}`,
  },
  {
    id: 'kit-cap-diamond', fit: [-60, 240, 0.36], cls: 'gr', name: 'قبعة في ماسة', type: 'graduation', style: 'modern', swatch: '#1F2D44', tone: 'light', scenes: ['marble', 'palace', 'starry'],
    theme: { paper: '#F7F3EA', ink: '#1F2B3D', muted: '#4F5A68', accent: '#C29A4E', aText: '#8B6A2C', env: '#1F2D44', fAr: RQ },
    back: () => layer('<path d="M22 88h58M220 88h58" stroke="#C29A4E" stroke-width="1"/><circle cx="22" cy="88" r="2" fill="#C29A4E"/><circle cx="278" cy="88" r="2" fill="#C29A4E"/>'
      + '<path d="M150 18 220 88 150 158 80 88Z" fill="#1F2D44"/><path d="M150 28 210 88 150 148 90 88Z" fill="none" stroke="#C29A4E" stroke-width="1"/>'
      + motif('gradCap', 110, 58, 80, 66, { swap: { '#2e4052': '#F7F3EA' } }) + '<path d="M40 410h220" stroke="#C29A4E" stroke-width=".8"/>'),
    body: (c, n) => `${head(c)}<div class="kc-class" lang="ar">دفعة <span lang="en">${e(c.year)}</span></div>${n}${info(c)}`,
  },
  {
    id: 'kit-moon-cloud', fit: [-52, 236, 0.36], cls: 'nb', name: 'قمر وغيمة', type: 'newborn', style: 'minimal', swatch: '#DCE7EC', tone: 'light', scenes: ['silk', 'petals', 'starry'],
    theme: { paper: '#EEF3F6', ink: '#2D3E4C', muted: '#526270', accent: '#8FAAB6', aText: '#4A687B', env: '#8FAAB6', fAr: RQ },
    back: () => layer(motif('moonCloud', 104, 22, 92, 108) + motif('cloud', -24, 110, 96, 56, { opacity: 0.85 }) + motif('cloud', 232, 56, 84, 48, { opacity: 0.85 })
      + sparkle(66, 58, 5, '#DEC589') + sparkle(236, 130, 4, '#DEC589') + sparkle(40, 210, 3.5, '#DEC589')
      + motif('footprints', 126, 364, 48, 40, { opacity: 0.75 })),
    body: (c, n) => `${head(c)}${n}${info(c)}`,
  },
  {
    id: 'kit-dallah-olive', fit: [-42, 240, 0.36], cls: 'fm', name: 'دلّة وزيتون', type: 'family', style: 'classic', swatch: '#B8734F', tone: 'light', scenes: ['garden', 'desert', 'marble'],
    theme: { paper: '#F4EBDD', ink: '#3D2B20', muted: '#66503F', accent: '#B8734F', aText: '#93492B', env: '#8C5941', fAr: RQ },
    back: () => layer(motif('quatrefoil', 0, 350, 300, 70, { fit: 'slice', color: '#B8734F', opacity: 0.32 }) + '<path d="M0 350h300" stroke="#B8734F" stroke-opacity=".5" stroke-width=".8"/>'
      + motif('olive', -10, -14, 84, 124, { rotate: -28 }) + motif('olive', 226, -14, 84, 124, { rotate: 28, flip: 'x' }) + motif('dallah', 124, 24, 52, 66)),
    body: (c, n) => `${head(c)}${n}${info(c)}`,
  },
  {
    id: 'kit-lantern-night', fit: [-46, 240, 0.36], cls: 'if', name: 'فوانيس الليل', type: 'iftar', style: 'classic', swatch: '#14213A', tone: 'dark', scenes: ['palace', 'candlelit', 'starry'],
    theme: { paper: '#14213A', ink: '#F4ECDD', muted: '#D6CDBC', accent: '#D9B86C', aText: '#E6C683', env: '#0E182B', fAr: RQ },
    back: () => layer(motif('lanterns', 40, -10, 220, 160) + motif('crescent', 236, 108, 40, 40, { color: '#D9B86C' })
      + sparkle(40, 120, 4, '#D9B86C') + sparkle(64, 64, 3, '#D9B86C') + sparkle(262, 40, 3, '#D9B86C')
      + motif('tile', 0, 372, 300, 48, { fit: 'slice', color: '#D9B86C', opacity: 0.2 })),
    body: (c, n) => `${head(c)}${n}${info(c)}`,
  },
  {
    id: 'kit-forum-stars', fit: [88, 178, 0.4], cls: 'cf', name: 'منبر النجوم', type: 'conference', style: 'modern', swatch: '#1B2230', tone: 'light', scenes: ['marble', 'sea', 'palace'],
    theme: { paper: '#FFFFFF', ink: '#1B2230', muted: '#4C5566', accent: '#2F5D8A', aText: '#2F5D8A', env: '#1B2230', fAr: RX },
    back: () => layer('<rect width="76" height="420" fill="#1B2230"/><rect x="76" width="3" height="420" fill="#2F5D8A"/>'
      + [16, 86, 156, 226, 296, 366].map((y, i) => motif('star8', 13, y, 50, 50, { color: i % 2 ? '#6F8FB3' : '#3E5577' })).join('')),
    body: (c, n) => `${head(c)}${latin(c)}${n}${stack(c)}`,
  },
  {
    id: 'kit-satin-ribbon', fit: [-41, 236, 0.4], cls: 'op', name: 'شريط الافتتاح', type: 'opening', style: 'modern', swatch: '#DCC79F', tone: 'light', scenes: ['palace', 'marble', 'silk'],
    theme: { paper: '#FBF8F2', ink: '#262626', muted: '#5F594F', accent: '#BFA068', aText: '#86672D', env: '#262626', fAr: RX },
    back: () => layer(motif('squareFrame', 12, 12, 276, 396, { fit: 'none', color: '#BFA068', opacity: 0.7 }))
      + '<div class="kc-band"></div>' + img('silk-bow.webp', 'left:50%;top:40px;width:104px;margin-left:-52px'),
    body: (c, n) => `${head(c)}${n}${info(c)}`,
  },
  {
    id: 'kit-laurel-gala', fit: [-66, 236, 0.4], cls: 'cp', name: 'وردة الحفل', type: 'corporate', style: 'bold', swatch: '#18202C', tone: 'dark', scenes: ['candlelit', 'palace', 'sea'],
    theme: { paper: '#18202C', ink: '#F2ECE0', muted: '#CFC7B8', accent: '#C9A865', aText: '#DABF82', env: '#0F151E', fAr: RX },
    back: () => layer(motif('squareFrame', 12, 12, 276, 396, { fit: 'none', color: '#C9A865', opacity: 0.75 }) + motif('rosette', 88, 26, 124, 124, { color: '#C9A865' }) + '<circle cx="150" cy="88" r="31" fill="#18202C" stroke="#C9A865" stroke-width="1"/>'),
    year: true,
    body: (c, n) => `${head(c)}${n}${info(c)}${latin(c)}`,
  },
  {
    id: 'kit-eucalyptus', fit: [61, 184, 0.36], cls: 'ot', name: 'غصن الأوكالبتوس', type: 'other', style: 'minimal', swatch: '#9DB0A0', tone: 'light', scenes: ['garden', 'marble', 'silk'],
    theme: { paper: '#FAF8F3', ink: '#2C2F2A', muted: '#5A6056', accent: '#7E9384', aText: '#4D6456', env: '#4D6456', fAr: RQ },
    back: () => layer('<path d="M30 30h240" stroke="#7E9384" stroke-width=".8"/><path d="M30 390h240" stroke="#7E9384" stroke-width=".8"/>')
      + img('eucalyptus-sprig.webp', 'left:-12px;bottom:-10px;width:96px'),
    body: (c, n) => `${head(c)}${n}${stack(c)}`,
  },

  // ── motion faces: flat artwork after the owner's GSAP reference; every word stays live text ───────────────
  {
    id: 'mo-garden', fit: [-20, 184, 0.36], cls: 'mw', motion: 'wedding', name: 'حديقة الوعد', type: 'wedding', style: 'classic', swatch: '#E7BBAB', tone: 'light', scenes: ['garden', 'silk', 'palace'],
    palette: { paper: '#FBF3DF', ink: '#304C3E', accent: '#D97B65', soft: '#E7BBAB', leaf: '#92A578' },
    theme: { paper: '#FBF3DF', ink: '#304C3E', muted: '#55695C', accent: '#D97B65', aText: '#A04B37', env: '#304C3E', fAr: RQ },
    back: () => MOTION_ART.wedding(),
    body: (c, n) => `${head(c)}${n}${when(c)}`,
  },
  {
    id: 'mo-orbits', fit: [-12, 220, 0.36], cls: 'mo', motion: 'engagement', name: 'مداران', type: 'engagement', style: 'modern', swatch: '#D5C4EA', tone: 'light', scenes: ['petals', 'starry', 'silk'],
    palette: { paper: '#F0E9FA', ink: '#46345F', accent: '#E78D76', soft: '#D5C4EA', leaf: '#A895CC' },
    theme: { paper: '#F0E9FA', ink: '#46345F', muted: '#655580', accent: '#C9785F', aText: '#8E3E5A', env: '#46345F', fAr: RQ },
    back: () => MOTION_ART.engagement(),
    body: (c, n) => `${head(c)}${n}${bigDay(c)}`,
  },
  {
    id: 'mo-colour', fit: [-38, 214, 0.4], cls: 'mc', motion: 'birthday', name: 'يوم ملوّن', type: 'birthday', style: 'bold', swatch: '#F4B2C7', tone: 'light', scenes: ['clay', 'petals', 'silk'],
    palette: { paper: '#FFF1C8', ink: '#48446D', accent: '#EC805D', soft: '#F4B2C7', leaf: '#83B8C9' },
    theme: { paper: '#FFF1C8', ink: '#48446D', muted: '#625E85', accent: '#D46E4D', aText: '#A3402B', env: '#EC805D', fAr: RX },
    back: () => MOTION_ART.birthday(),
    body: (c, n) => `${head(c)}${n}${when(c)}`,
  },
  {
    id: 'mo-sky', fit: [-52, 228, 0.36], cls: 'ms', motion: 'graduation', name: 'نحو السماء', type: 'graduation', style: 'bold', swatch: '#203B47', tone: 'dark', scenes: ['starry', 'sea', 'marble'],
    palette: { paper: '#203B47', ink: '#FFF1D4', accent: '#E4AC5F', soft: '#587D83', leaf: '#9FAE8D' },
    theme: { paper: '#203B47', ink: '#FFF1D4', muted: '#DCD4BF', accent: '#E4AC5F', aText: '#EDBE73', env: '#203B47', fAr: RQ },
    back: () => MOTION_ART.graduation(),
    body: (c, n) => `${head(c)}<div class="kc-class" lang="ar">دفعة <span lang="en">${e(c.year)}</span></div>${n}${info(c)}`,
  },
  {
    id: 'mo-lanterns', fit: [-40, 212, 0.36], cls: 'ml', motion: 'iftar', name: 'لمّة على نور', type: 'iftar', style: 'classic', swatch: '#244F46', tone: 'dark', scenes: ['candlelit', 'starry', 'desert'],
    palette: { paper: '#244F46', ink: '#FFF1CF', accent: '#E7B964', soft: '#2F6355', leaf: '#95AC77' },
    theme: { paper: '#244F46', ink: '#FFF1CF', muted: '#E6DCC0', accent: '#E7B964', aText: '#EEC778', env: '#1A3B34', fAr: RQ },
    back: () => MOTION_ART.iftar(),
    body: (c, n) => `${head(c)}${n}${info(c)}`,
  },
  {
    id: 'mo-moon', fit: [-30, 220, 0.36], cls: 'mm', motion: 'newborn', name: 'أصغر فرحة', type: 'newborn', style: 'minimal', swatch: '#BFD5E5', tone: 'light', scenes: ['starry', 'silk', 'petals'],
    palette: { paper: '#E8F0F7', ink: '#3F5B79', accent: '#E9BA66', soft: '#BFD5E5', leaf: '#A4B9D6' },
    theme: { paper: '#E8F0F7', ink: '#33506E', muted: '#4F6782', accent: '#C9A15A', aText: '#3F5B79', env: '#3F5B79', fAr: RQ },
    back: () => MOTION_ART.newborn(),
    body: (c, n) => `${head(c)}${n}${when(c)}`,
  },
  // ── the owner's PDF layers (art only — the text is live, set in the PDF's compositions) ──────────────────
  {
    id: 'pf-gazebo', fit: [-30, 220, 0.36], cls: 'pg', name: 'شرفة الحديقة', type: 'wedding', style: 'classic', swatch: '#EDE6D6', tone: 'light', scenes: ['garden', 'marble', 'silk'],
    theme: { paper: '#F8F5EE', ink: '#3E4A39', muted: '#5F6A57', accent: '#8A9A7A', aText: '#5C6E4D', env: '#5C6E4D', fAr: RQ },
    back: () => img('cotton-paper.webp', 'inset:0;width:100%;height:100%;object-fit:cover;opacity:.7')
      + img('pdf-drapes.webp', 'left:0;top:-14px;width:300px;opacity:.55') + img('pdf-gazebo.webp', 'left:50%;bottom:-6px;width:178px;margin-left:-89px')
      + img('pdf-white-roses.webp', 'left:-30px;top:-34px;width:118px') + img('pdf-white-roses.webp', 'right:-30px;top:-34px;width:118px;transform:scaleX(-1)'),
    body: (c, n) => `${head(c)}${n}${when(c)}`,
  },
  {
    id: 'pf-rings', fit: [-10, 220, 0.36], cls: 'pr', name: 'وعد الذهب', type: 'engagement', style: 'classic', swatch: '#F3D9D3', tone: 'light', scenes: ['petals', 'silk', 'marble'],
    theme: { paper: '#FCF7F2', ink: '#5A3A3C', muted: '#76585A', accent: '#C4917E', aText: '#9A4F56', env: '#B9858A', fAr: RQ },
    back: () => img('cotton-paper.webp', 'inset:0;width:100%;height:100%;object-fit:cover;opacity:.6')
      + img('pdf-blush-roses.webp', 'left:-40px;top:-36px;width:150px;transform:rotate(-8deg)') + img('pdf-blush-roses.webp', 'right:-44px;top:-30px;width:150px;transform:scaleX(-1) rotate(-8deg)')
      + img('pdf-rings-rose.webp', 'left:50%;bottom:-6px;width:150px;margin-left:-75px'),
    body: (c, n) => `${head(c)}${n}${lines(c)}`,
  },
  {
    id: 'pf-white-arch', fit: [-40, 160, 0.36], cls: 'pa', name: 'قوس الياسمين', type: 'katb_kitab', style: 'minimal', swatch: '#617356', tone: 'light', scenes: ['garden', 'palace', 'marble'],
    theme: { paper: '#F2F1EA', ink: '#FBF8F0', muted: '#E3E8DA', accent: '#E9E3CF', aText: '#F6F1E1', env: '#617356', fAr: RQ },
    back: () => '<div class="kc-arch"></div>' + layer('<path d="M28 400V140" stroke="#617356" stroke-width=".8" stroke-opacity=".5"/>')
      + img('pdf-white-roses.webp', 'left:10px;top:-8px;width:150px'),
    body: (c, n) => `<div class="kc-mono" aria-hidden="true">${e(initial(c.arA))}${c.arB ? ` ${e(initial(c.arB))}` : ''}</div>${head(c)}${n}${lines(c)}`,
  },
  {
    id: 'pf-henna', fit: [-30, 216, 0.4], cls: 'ph', name: 'نقش الحنّة', type: 'henna', style: 'classic', swatch: '#5E6E45', tone: 'light', scenes: ['palace', 'desert', 'garden'],
    theme: { paper: '#F1ECDF', ink: '#3F4D2E', muted: '#5D6A4A', accent: '#6E7D52', aText: '#4D5E35', env: '#4D5E35', fAr: KF },
    back: () => img('cotton-paper.webp', 'inset:0;width:100%;height:100%;object-fit:cover;opacity:.8')
      + img('pdf-henna-ornament.webp', 'left:50%;top:-118px;width:236px;margin-left:-118px') + img('pdf-henna-ornament.webp', 'left:50%;bottom:-118px;width:236px;margin-left:-118px'),
    body: (c, n) => `${head(c)}${n}${when(c)}`,
  },
  {
    id: 'pf-gold-balloons', fit: [-10, 160, 0.4], cls: 'pb', name: 'بالونات الذهب', type: 'graduation', style: 'bold', swatch: '#1E1E1E', tone: 'light', scenes: ['marble', 'starry', 'palace'],
    theme: { paper: '#FFFFFF', ink: '#262626', muted: '#555048', accent: '#C29A48', aText: '#87652A', env: '#1E1E1E', fAr: KF },
    back: () => layer('<path d="M0 0H120C70 40 30 90 0 160Z" fill="#1E1E1E"/><path d="M0 160C30 90 70 40 120 0H132C82 42 40 94 0 172Z" fill="#C29A48"/>'
      + '<path d="M300 420H180C230 380 270 330 300 260Z" fill="#1E1E1E"/><path d="M300 260C270 330 230 380 180 420H168C218 378 260 326 300 248Z" fill="#C29A48"/>')
      + img('pdf-confetti.webp', 'left:0;top:0;width:300px;opacity:.9')
      + img('pdf-balloons.webp', 'left:-22px;top:110px;width:72px') + img('pdf-balloons.webp', 'right:-20px;top:40px;width:72px;transform:scaleX(-1)'),
    body: (c, n) => `${head(c)}<div class="kc-class" lang="ar">دفعة <span lang="en">${e(c.year)}</span></div>${n}${bigDay(c)}`,
  },
  {
    id: 'pf-cornflower', fit: [-6, 228, 0.4], cls: 'pc', name: 'أزهار الترمس', type: 'newborn', style: 'minimal', swatch: '#3F5AA8', tone: 'light', scenes: ['garden', 'silk', 'marble'],
    theme: { paper: '#F6F4EE', ink: '#2E3F6B', muted: '#4D5C80', accent: '#5A72B8', aText: '#2E3F6B', env: '#3F5AA8', fAr: RQ },
    back: () => img('cotton-paper.webp', 'inset:0;width:100%;height:100%;object-fit:cover;opacity:.7')
      + [[-14, 150, 0], [44, 130, 1], [104, 160, 0], [164, 128, 1], [222, 152, 0]].map(([x, w, f]) => img('pdf-cornflower.webp', `left:${x}px;bottom:-22px;width:${w * 0.52}px${f ? ';transform:scaleX(-1)' : ''}`)).join(''),
    body: (c, n) => `<div class="kc-script" lang="en">Welcome baby</div>${head(c)}${n}${when(c)}`,
  },
  {
    id: 'pf-parchment', fit: [-20, 212, 0.36], cls: 'pp', name: 'ورق الأيام', type: 'family', style: 'classic', swatch: '#C9AE80', tone: 'light', scenes: ['desert', 'garden', 'candlelit'],
    theme: { paper: '#EFE3CC', ink: '#4A3520', muted: '#6B5236', accent: '#9C7A44', aText: '#7A5626', env: '#7A5626', fAr: RQ },
    back: () => img('pdf-parchment.webp', 'inset:0;width:100%;height:100%;object-fit:cover;opacity:.55')
      + layer(motif('squareFrame', 14, 14, 272, 392, { fit: 'none', color: '#9C7A44', opacity: 0.75 }) + motif('dallah', 128, 34, 44, 58) + motif('olive', 30, 40, 70, 100, { rotate: -24 }) + motif('olive', 200, 40, 70, 100, { rotate: 24, flip: 'x' })),
    body: (c, n) => `${head(c)}${n}${info(c)}`,
  },
  {
    id: 'pf-confetti', fit: [-24, 220, 0.4], cls: 'po', name: 'شرائط الذهب', type: 'opening', style: 'bold', swatch: '#C7A661', tone: 'light', scenes: ['palace', 'marble', 'starry'],
    theme: { paper: '#FCFAF5', ink: '#262626', muted: '#57514A', accent: '#C29A48', aText: '#86672D', env: '#262626', fAr: RX },
    back: () => img('pdf-confetti.webp', 'left:0;top:0;width:300px') + img('pdf-confetti.webp', 'left:0;bottom:-60px;width:300px;transform:rotate(180deg);opacity:.7')
      + layer('<rect x="14" y="14" width="272" height="392" fill="none" stroke="#C29A48" stroke-width=".9"/><rect x="19" y="19" width="262" height="382" fill="none" stroke="#C29A48" stroke-opacity=".5" stroke-width=".5"/>'),
    body: (c, n) => `${head(c)}${n}${info(c)}`,
  },
  {
    id: 'pf-dahlia', fit: [-30, 220, 0.36], cls: 'pd', name: 'أضاليا الفرح', type: 'other', style: 'bold', swatch: '#C9356B', tone: 'light', scenes: ['petals', 'silk', 'palace'],
    theme: { paper: '#F7F3EF', ink: '#3A2630', muted: '#5D4852', accent: '#C9A15A', aText: '#9A2952', env: '#9A2952', fAr: RQ },
    back: () => img('cotton-paper.webp', 'inset:0;width:100%;height:100%;object-fit:cover;opacity:.8')
      + layer(motif('archFrame', 22, 18, 256, 380, { fit: 'none', color: '#C9A15A', opacity: 0.8 }))
      + img('pdf-dahlias.webp', 'left:50%;bottom:-40px;width:300px;margin-left:-150px'),
    body: (c, n) => `${head(c)}${n}${info(c)}`,
  },
  // ── typographic faces ─────────────────────────────────────────────────────────────────────────────────
  {
    id: 'ty-vertical', fit: [70, 182, 0.4], cls: 'tv', name: 'عنوان عمودي', type: 'conference', style: 'modern', swatch: '#4B2A8C', tone: 'light', scenes: ['marble', 'sea', 'palace'],
    theme: { paper: '#FFFFFF', ink: '#2A1F45', muted: '#564C6E', accent: '#7A5AC8', aText: '#4B2A8C', env: '#2A1F45', fAr: RX },
    back: (c) => `<div class="kc-vlabel" aria-hidden="true">${e(c.eventLabelEnU)}</div><div class="kc-vrule"></div>`,
    body: (c, n) => `${head(c)}${n}${stack(c)}`,
  },
  {
    id: 'ty-blue', fit: [-38, 230, 0.4], cls: 'tb', name: 'أزرق الدعوة', type: 'corporate', style: 'modern', swatch: '#1F5FAD', tone: 'dark', scenes: ['sea', 'marble', 'starry'],
    theme: { paper: '#1F5FAD', ink: '#FFFFFF', muted: '#DCE6F4', accent: '#9CC0EC', aText: '#FFFFFF', env: '#123E75', fAr: RX },
    back: () => layer('<circle cx="250" cy="352" r="120" fill="none" stroke="#FFFFFF" stroke-opacity=".08" stroke-width="18"/><circle cx="40" cy="40" r="70" fill="none" stroke="#FFFFFF" stroke-opacity=".08" stroke-width="10"/>'
      ),
    body: (c, n) => `${head(c)}${n}${bigDay(c)}`,
  },
];

CardRegistry.registerMany(DESIGNS.map((d) => ({
  id: d.id, name: d.name, swatch: d.swatch, tone: d.tone, tags: [d.tone, d.type, d.style, 'collection'],
  theme: d.theme, renderMode: 'svg', reducedMotion: 'static', mobile: true, source: 'src/cards/collection.js',
  compat: { recommended: d.scenes },
  render(c) {
    const extra = (d.seal ? `<div class="kc-seal" aria-hidden="true">${e(initial(c.arA))}${c.arB ? ` ${e(initial(c.arB))}` : ''}</div>` : '')
      + (d.year ? `<div class="kc-year" lang="en" aria-hidden="true" style="color:${d.theme.aText}">${e(c.year)}</div>` : '');
    return face(d, c, d.body(c, names(c, d.fit[0], { width: d.fit[1], glyph: d.fit[2] }))).replace('<div class="oc-inner">', `${extra}<div class="oc-inner">`);
  },
})));

/** the collection, in occasion order — for presets and the review sheet */
export const COLLECTION = DESIGNS.map(({ id, name, type, style, scenes }) => ({ id, name, type, style, scenes }));
