/**
 * Card templates — the 10 canonical CardFace designs.
 *
 * Markup: generated 1:1 from canonical/CardFace.dc.html (cards/canon/generated.js).
 * Theme:  the canonical THEMES table from Studio.dc.html (paper/ink/muted/accent/aText/env/fAr) —
 *         it colours the invitation sheet, the card back, edges and the envelope for that card.
 * Metadata (tone, tags, scene affinities) drives the compatibility rules; nothing here binds a card
 * to a scene.
 */
import { CardRegistry } from '../engine/registries.js';
import { CARD_FACES, CARD_DEFS, CARD_ROOT } from './canon/generated.js';
import './occasion-cards.js';
import './signature-cards.js';
import './celebration-suite.js';
import './collection.js';

const RQ = "'Aref Ruqaa', 'Amiri', serif", KF = "'Reem Kufi', 'Amiri', sans-serif";

// seeded star field of the Midnight card — same generator/seed as the canonical renderVals()
const STARS = (() => {
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const out = [];
  for (let i = 0; i < 34; i++) out.push({ x: Math.round(rnd() * 290), y: Math.round(rnd() * 410), r: (rnd() * 1.8 + 0.8).toFixed(1), d: (rnd() * 4).toFixed(1), t: (rnd() * 2.5 + 2).toFixed(1) });
  return out;
})();

const CARDS = [
  ['lace', 'Ivory Lace', '#F4EAE0', 'light', ['classic', 'embossed', 'romantic', 'warm'], { paper: '#F4EAE0', ink: '#4A2E29', muted: '#6E5048', accent: '#B8925A', aText: '#7A5A2F', env: '#6B1E2C', fAr: RQ }, ['marble', 'silk', 'palace']],
  ['wine', 'Wine & Gold', '#5B1523', 'dark', ['luxury', 'gold', 'crest', 'warm', 'night'], { paper: '#5B1523', ink: '#F6E7D0', muted: '#E3C9B0', accent: '#D9B77A', aText: '#E8C98A', env: '#3E0F18', fAr: RQ }, ['candlelit', 'palace', 'starry']],
  ['emerald', 'Emerald Deco', '#12352D', 'dark', ['deco', 'gold', 'geometric', 'night'], { paper: '#12352D', ink: '#F2E8D5', muted: '#CFC3A8', accent: '#D4B06A', aText: '#E2C27E', env: '#0B241E', fAr: KF }, ['garden', 'palace', 'candlelit']],
  ['sage', 'Sage Botanical', '#C9D2B8', 'light', ['botanical', 'natural', 'calm'], { paper: '#E6EADC', ink: '#2F3B2C', muted: '#56624F', accent: '#8A9A6E', aText: '#4F5E3F', env: '#5C6B4A', fAr: RQ }, ['garden', 'marble', 'petals']],
  ['blush', 'Blush Watercolor', '#F3C6CB', 'light', ['watercolor', 'romantic', 'pastel'], { paper: '#FBF1ED', ink: '#5A3A3F', muted: '#7A5A5F', accent: '#D9A0A6', aText: '#9A5560', env: '#B87880', fAr: RQ }, ['petals', 'silk', 'marble']],
  ['midnight', 'Midnight Stars', '#1E2A4C', 'dark', ['celestial', 'night', 'gold'], { paper: '#141C35', ink: '#F1E9D8', muted: '#C9C3B5', accent: '#E8C98A', aText: '#E8C98A', env: '#0C1226', fAr: RQ }, ['starry', 'sea', 'desert']],
  ['arabesque', 'Arabesque', '#E9D3A6', 'light', ['arabic', 'geometric', 'classic', 'warm'], { paper: '#F7F0E3', ink: '#3A2A1E', muted: '#5E4A3A', accent: '#B08A4A', aText: '#7E5E2A', env: '#1F4A55', fAr: RQ }, ['palace', 'desert', 'candlelit']],
  ['minimal', 'Modern Minimal', '#FAFAF7', 'light', ['modern', 'minimal', 'editorial'], { paper: '#FAFAF7', ink: '#1C1C1C', muted: '#5A5A5A', accent: '#B89A5E', aText: '#7A6230', env: '#1C1C1C', fAr: KF }, ['marble', 'silk', 'sea']],
  ['terracotta', 'Terracotta Sun', '#B4583A', 'light', ['desert', 'warm', 'earthy'], { paper: '#EFE2D2', ink: '#4A2A1E', muted: '#6E4A3A', accent: '#B4583A', aText: '#9A4428', env: '#B4583A', fAr: KF }, ['desert', 'palace', 'garden']],
  ['clay', 'Pastel Clay', '#FFD6E4', 'light', ['playful', 'pastel', 'clay'], { paper: '#FFF4F0', ink: '#7A4F5E', muted: '#8D6879', accent: '#F2A7BF', aText: '#A0506C', env: '#E98AAA', fAr: RQ }, ['clay', 'petals', 'silk']],
];

CardRegistry.registerMany(CARDS.map(([id, name, swatch, tone, tags, theme, recommended]) => ({
  id, name, swatch, tone, tags: [tone, ...tags], theme,
  renderMode: 'svg', // DOM + inline SVG, CSS-animated details
  compat: { recommended },
  reducedMotion: 'static',
  source: 'canonical/CardFace.dc.html',
  /** front face markup (300×420) */
  render(c) {
    const length = String(c.arA || '').length + String(c.arB || '').length;
    const enLength = String(c.enA || '').length + String(c.enB || '').length;
    const reserve = Math.max(0, String(c.venueEn || '').length - 28) + Math.max(0, String(c.venueAr || '').length - 28);
    const ar = Math.max(11, Math.min(46, Math.floor(330 / Math.max(8, length + reserve * .3))));
    const en = Math.max(10, Math.min(54, Math.floor(360 / Math.max(8, enLength + reserve * .3))));
    const root = CARD_ROOT.replace('style="', `style="--cf-name-ar:${ar}px;--cf-name-en:${en}px;`);
    return `<div ${root}>${CARD_FACES[id]({ c, stars: STARS })}</div>`;
  },
})));

export { CARD_DEFS };
