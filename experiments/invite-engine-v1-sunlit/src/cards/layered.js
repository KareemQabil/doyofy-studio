/**
 * Layered card packs — the Canva / asset-authoring pipeline entry point.
 *
 * A pack is a folder under assets/cards/<id>/ with a meta.json. No code is needed to add
 * one: registerLayeredPack(meta) builds a CardTemplate that composes
 *   paper background → recolourable SVG frame (mask) → image ornaments → DOM text layout
 * and exposes the pack's decor (pieces that settle around the card) to the engine.
 * Text layouts are small, reusable renderers selected by name in meta.json.
 */
import { CardRegistry } from '../engine/registries.js';
import { h, esc } from '../engine/dom.js';
import { STACK, GOOGLE } from '../engine/Fonts.js';
import { cardText, palette } from './CardTemplate.js';

/** Named text layouts for layered packs (DOM, so Arabic shaping and RTL are native). */
export const TEXT_LAYOUTS = {
  'botanical-editorial': (t, P) => `
    <div class="lt-be" style="--ink:${P.ink};--muted:${P.muted};--accent:${P.accent}">
      <div class="lt-be__kicker"><span dir="rtl" lang="ar">بكل الحب</span><span dir="ltr" lang="en">WITH LOVE</span></div>
      <div class="lt-be__names" dir="rtl" lang="ar"><span>${esc(t.arA)}</span><em>و</em><span>${esc(t.arB)}</span></div>
      <div class="lt-be__en" dir="ltr" lang="en">${esc(t.enA)} <i>&amp;</i> ${esc(t.enB)}</div>
      <span class="lt-be__rule"></span>
      <div class="lt-be__date" dir="rtl" lang="ar">${esc(t.dayAr)} ${esc(t.dateAr)}</div>
      <div class="lt-be__date-en" dir="ltr" lang="en">${esc(t.dayEnU)} · ${esc(t.dateEnU)}</div>
      <div class="lt-be__venue" dir="rtl" lang="ar">${esc(t.timeAr)} · ${esc(t.venueAr)}، ${esc(t.cityAr)}</div>
      <div class="lt-be__venue-en" dir="ltr" lang="en">${esc(t.timeEn)} · ${esc(t.venueEnU)}, ${esc(t.cityEnU)}</div>
    </div>`,
  'monogram-back': (t, P) => `
    <div class="lt-mb" style="--ink:${P.ink};--accent:${P.accent}">
      <div class="lt-mb__seal"><span>${esc(t.monoA)}</span><i></i><span>${esc(t.monoB)}</span></div>
      <div class="lt-mb__en" dir="ltr">${esc(t.enA)} &amp; ${esc(t.enB)}</div>
      <div class="lt-mb__date" dir="ltr">${esc(t.dateNum)}</div>
    </div>`,
};

const FONT_SETS = {
  editorial: { fonts: { arDisplay: STACK.arDisplay, ar: STACK.arSans, enDisplay: STACK.enDidone, en: STACK.enSans }, faces: [GOOGLE.arefRuqaa, GOOGLE.plexArabic, GOOGLE.bodoni, GOOGLE.plexSans] },
};

export function registerLayeredPack(meta, basePath = `cards/${meta.id}/`) {
  const fontSet = FONT_SETS[meta.fontSet || 'editorial'];
  const p = (f) => basePath + f;
  return CardRegistry.register({
    id: meta.template || meta.id,
    meta: { title: meta.title, description: meta.description || '', category: meta.category, thumbnail: p(meta.thumbnail || 'thumbnail.webp'), pack: meta },
    tags: meta.tags || [],
    compat: meta.compat || {},
    renderMode: 'hybrid',
    source: 'layered',
    render(m) {
      const P = palette(meta.colorPalette, meta.variants, m.params.variant || meta.defaultVariant);
      const t = cardText(m);
      const [dw, dh] = meta.designSize || [500, 700];
      const face = (spec) => {
        const el = h('div', { class: `lp-face ${spec.class || ''}`, style: `--paper:${P.paper};--ink:${P.ink};--frame:${P.frame || P.ink}` });
        if (spec.background) {
          const bg = typeof spec.background === 'string' ? p(spec.background) : m.assets.pickPath({ base: p(spec.background.base), widths: spec.background.widths }, dw);
          el.append(h('div', { class: 'lp-paper', style: `background-image:url(${m.assets.url(bg)})` }));
        }
        if (P.tint) el.append(h('div', { class: 'lp-tint', style: `background:${P.tint}` }));
        const layerEls = [];
        for (const L of spec.layers || []) {
          let node;
          if (L.type === 'mask') node = h('div', { class: 'lp-layer lp-mask', style: `-webkit-mask-image:url(${m.assets.url(p(L.src))});mask-image:url(${m.assets.url(p(L.src))});background:${P[L.color] || L.color || P.ink}` });
          else node = h('img', { class: 'lp-layer', src: m.assets.url(p(L.src)), alt: '', decoding: 'async', draggable: 'false' });
          const [x, y, w, hh] = L.box || [0, 0, 100, 100];
          Object.assign(node.style, { left: `${x}%`, top: `${y}%`, width: `${w}%`, height: hh == null ? 'auto' : `${hh}%`, opacity: L.opacity ?? '' });
          if (L.blend) node.style.mixBlendMode = L.blend;
          el.append(node);
          layerEls.push({ el: node, enter: L.enter });
        }
        if (spec.text && TEXT_LAYOUTS[spec.text]) el.insertAdjacentHTML('beforeend', `<div class="lp-text">${TEXT_LAYOUTS[spec.text](t, P)}</div>`);
        return { el, layerEls };
      };
      const front = face(meta.faces.front);
      const back = face(meta.faces.back || { background: meta.faces.front.background, text: 'monogram-back' });
      const decor = (meta.decor || []).map((d) => {
        const el = h('img', { src: m.assets.pick({ base: p(d.src.base), widths: d.src.widths }, (d.box[2] / 100) * 520), alt: '', decoding: 'async', draggable: 'false', class: `lp-decor ${d.blur ? 'lp-decor--soft' : ''}` });
        if (d.rotate) m.set(el, { rotate: d.rotate });
        return { el, place: d.place, box: d.box, enter: d.enter, finale: d.finale };
      });
      const preload = [meta.faces.front.background, ...(meta.faces.front.layers || []).map((l) => l.src)].filter((s) => typeof s === 'string').map((s) => ({ type: 'image', src: p(s), preload: true }));
      if (typeof meta.faces.front.background === 'object') preload.push({ type: 'image', src: m.assets.pickPath({ base: p(meta.faces.front.background.base), widths: meta.faces.front.background.widths }, dw), preload: true });
      return {
        design: { w: dw, h: dh }, palette: P, tone: meta.tone || 'light', radius: meta.radius || '3px',
        fonts: fontSet.fonts, fontFaces: fontSet.faces, sheetTexture: meta.sheetTexture,
        front: front.el, back: back.el, layers: front.layerEls, decor, assets: preload,
      };
    },
  });
}
