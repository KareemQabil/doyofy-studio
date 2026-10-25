/**
 * HTML card templates (source: 'html'). Markup lives in ported-markup.js; this file adds
 * what makes each design a first-class module: palette, fonts, tags, compatibility,
 * back face and pack metadata (assets/cards/<id>/meta.json mirrors this for tooling).
 */
import { CardRegistry } from '../engine/registries.js';
import { h, html } from '../engine/dom.js';
import { STACK, GOOGLE } from '../engine/Fonts.js';
import { cardText, palette } from './CardTemplate.js';
import { DEFS, MARKUP } from './ported-markup.js';

const F = {
  ruqaa: { fonts: { arDisplay: STACK.arDisplay, ar: STACK.arNaskh, enDisplay: STACK.enSerif, en: STACK.enSerif }, faces: [GOOGLE.arefRuqaa, GOOGLE.amiri, GOOGLE.cormorant] },
  kufi: { fonts: { arDisplay: STACK.arKufi, ar: STACK.arNaskh, enDisplay: STACK.enSerif, en: STACK.enSerif }, faces: [GOOGLE.reemKufi, GOOGLE.amiri, GOOGLE.cormorant] },
  script: { fonts: { arDisplay: STACK.arDisplay, ar: STACK.arNaskh, enDisplay: STACK.enScript, en: STACK.enSerif }, faces: [GOOGLE.arefRuqaa, GOOGLE.amiri, GOOGLE.cormorant, GOOGLE.greatVibes] },
};

const DESIGNS = [
  { id: 'ivory_lace', key: 'lace', title: 'Ivory Lace', fonts: 'ruqaa', tags: ['classic', 'romantic', 'light', 'paper', 'botanical', 'arabic', 'soft'], compat: { prefer: ['light', 'romantic', 'soft'], avoid: ['neon', 'chrome'] },
    palette: { paper: '#F4EAE0', ink: '#4A2E29', muted: '#6E5048', accent: '#B8925A', accentText: '#7A5A2F', env: '#6B1E2C' } },
  { id: 'wine_gold_crest', key: 'wine', title: 'Wine & Gold Crest', fonts: 'ruqaa', tags: ['luxury', 'classic', 'night', 'warm', 'gold', 'arabic', 'cinematic'], compat: { prefer: ['luxury', 'night', 'warm'], avoid: ['pastel', 'playful'] },
    palette: { paper: '#5B1523', ink: '#F6E7D0', muted: '#E3C9B0', accent: '#D9B77A', accentText: '#E8C98A', env: '#3E0F18' }, tone: 'dark' },
  { id: 'emerald_deco', key: 'emerald', title: 'Emerald Deco', fonts: 'kufi', tags: ['luxury', 'deco', 'night', 'gold', 'arabic', 'glam', 'classic'], compat: { prefer: ['luxury', 'arabic', 'night'], avoid: ['pastel'] },
    palette: { paper: '#12352D', ink: '#F2E8D5', muted: '#CFC3A8', accent: '#D4B06A', accentText: '#E2C27E', env: '#0B241E' }, tone: 'dark' },
  { id: 'sage_botanical', key: 'sage', title: 'Sage Botanical', fonts: 'script', tags: ['botanical', 'garden', 'organic', 'light', 'soft', 'romantic'], compat: { prefer: ['botanical', 'garden', 'light'], avoid: ['chrome', 'neon'] },
    palette: { paper: '#E6EADC', ink: '#2F3B2C', muted: '#56624F', accent: '#8A9A6E', accentText: '#4F5E3F', env: '#5C6B4A' } },
  { id: 'blush_watercolor', key: 'blush', title: 'Blush Watercolor', fonts: 'script', tags: ['romantic', 'pastel', 'floral', 'soft', 'dreamy', 'light'], compat: { prefer: ['romantic', 'pastel', 'floral'], avoid: ['moody', 'chrome'] },
    palette: { paper: '#FBF1ED', ink: '#5A3A3F', muted: '#7A5A5F', accent: '#D9A0A6', accentText: '#9A5560', env: '#B87880' } },
  { id: 'midnight_stars', key: 'midnight', title: 'Midnight Stars', fonts: 'ruqaa', tags: ['night', 'celestial', 'dreamy', 'gold', 'calm', 'romantic'], compat: { prefer: ['night', 'celestial', 'calm'], avoid: ['sun', 'pastel'] },
    palette: { paper: '#141C35', ink: '#F1E9D8', muted: '#C9C3B5', accent: '#E8C98A', accentText: '#E8C98A', env: '#0C1226' }, tone: 'dark' },
  { id: 'arabesque', key: 'arabesque', title: 'Arabesque', fonts: 'ruqaa', tags: ['arabic', 'classic', 'geometric', 'warm', 'luxury', 'paper'], compat: { prefer: ['arabic', 'classic', 'architectural'], avoid: ['playful', 'chrome'] },
    palette: { paper: '#F7F0E3', ink: '#3A2A1E', muted: '#5E4A3A', accent: '#B08A4A', accentText: '#7E5E2A', env: '#1F4A55' } },
  { id: 'modern_minimal', key: 'minimal', title: 'Modern Minimal', fonts: 'kufi', tags: ['minimal', 'modern', 'editorial', 'light', 'chrome'], compat: { prefer: ['minimal', 'modern', 'editorial'], avoid: ['festive', 'classic'] },
    palette: { paper: '#FAFAF7', ink: '#1C1C1C', muted: '#5A5A5A', accent: '#B89A5E', accentText: '#7A6230', env: '#1C1C1C' } },
  { id: 'terracotta_sun', key: 'terracotta', title: 'Terracotta Sun', fonts: 'kufi', tags: ['earthy', 'warm', 'desert', 'sun', 'modern', 'arabic'], compat: { prefer: ['desert', 'warm', 'earthy'], avoid: ['night', 'pastel'] },
    palette: { paper: '#EFE2D2', ink: '#4A2A1E', muted: '#6E4A3A', accent: '#B4583A', accentText: '#9A4428', env: '#B4583A' } },
  { id: 'pastel_clay', key: 'clay', title: 'Pastel Clay', fonts: 'ruqaa', tags: ['playful', 'pastel', 'clay', 'festive', 'soft'], compat: { prefer: ['playful', 'pastel', 'clay'], avoid: ['moody', 'luxury', 'night'] },
    palette: { paper: '#FFF4F0', ink: '#7A4F5E', muted: '#8D6879', accent: '#F2A7BF', accentText: '#A0506C', env: '#E98AAA' } },
];

for (const d of DESIGNS) {
  CardRegistry.register({
    id: d.id,
    meta: { title: d.title, category: 'html-template', thumbnail: `cards/${d.id}/thumbnail.webp` },
    tags: d.tags, compat: d.compat, renderMode: 'dom', source: 'html',
    render(m) {
      const t = cardText(m);
      const P = palette(d.palette, d.variants, m.params.variant);
      const front = html(`<div class="ct-face">${DEFS}${MARKUP[d.key](t)}</div>`);
      const back = h('div', { class: 'ct-face ct-back', style: `background:${P.env};--acc:${P.accent}` },
        h('div', { class: 'ct-back__frame' }),
        h('div', { class: 'ct-back__seal' }, h('span', { class: 'fx-foil', style: `font-family:${F[d.fonts].fonts.arDisplay}` }, `${t.monoA} ${t.monoB}`)),
        h('div', { class: 'ct-back__date', dir: 'ltr' }, t.dateNum));
      return {
        design: { w: 300, h: 420 }, palette: P, tone: d.tone || 'light', radius: '10px',
        fonts: F[d.fonts].fonts, fontFaces: F[d.fonts].faces, front, back, layers: [], decor: [], assets: [],
      };
    },
  });
}
