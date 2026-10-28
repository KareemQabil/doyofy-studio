/**
 * Layer modules that the canonical Studio has exactly one of. They are registered (not inlined)
 * so presets can swap them later without touching the Studio controller.
 *
 * Their visual behaviour lives in CSS (styles/canon-motion.css = the canonical motion language);
 * the registry entries carry timing, metadata and reduced-motion behaviour.
 */
import { RevealRegistry, MotionRegistry, InteractionRegistry, CameraRegistry, FXRegistry, FinaleRegistry, PresetRegistry } from './engine/registries.js';

RevealRegistry.register({
  id: 'depth-arrival', name: 'Cinematic depth arrival (canonical)',
  tags: ['cinematic', 'dark', 'canonical'],
  timing: { intro: 4700 },   // black 0–3.2 s, credit 0.3–2.8 s, card flies in 2.2–4.8 s, bars lift at 3.8 s
  css: ['.st-intro', '.st-credit', '.st-black', '.st-bar'],
  reducedMotion: 'static',   // starts settled on the card (no-intro), no fly-in
});

MotionRegistry.registerMany([
  { id: 'bob', name: 'Card bob (7 s)', tags: ['canonical', 'subtle'], css: '.st-bob', reducedMotion: 'static' },
  { id: 'glint', name: 'Foil glint sweep (every 7 s)', tags: ['canonical'], css: '.st-glint', reducedMotion: 'static' },
  { id: 'page-change', name: 'Page leave/enter (340 ms + fx-rise)', tags: ['canonical'], css: '.st-page.leaving', reducedMotion: 'simplified' },
]);

InteractionRegistry.registerMany([
  { id: 'pointer-tilt', name: 'Pointer tilt + scene parallax', tags: ['canonical'], activeIn: ['intro', 'card'], maxTilt: { x: 16, y: 20 }, reducedMotion: 'static' },
  { id: 'page-gestures', name: 'Swipe (50 px), wheel (900 ms debounce), dots, chevrons, keys', tags: ['canonical', 'touch'], activeIn: ['pages'] },
]);

CameraRegistry.registerMany([
  { id: 'css-perspective', name: 'DOM stage: CSS perspective 1100 px @ 50% 42%', renderMode: 'dom', tags: ['canonical'] },
  { id: 'stage-locked-dolly', name: 'WebGL: stage-locked framing + intro dolly + pointer parallax', renderMode: 'three', tags: ['three'], source: 'src/camera/framing.js' },
]);

FXRegistry.registerMany([
  { id: 'film-grain', name: 'SVG grain (screen 6%)', tags: ['canonical'], css: 'svg[filter=st-grain]' },
  { id: 'letterbox', name: 'Letterbox bars (intro, fly, done)', tags: ['canonical'], css: '.st-bar' },
  { id: 'candle-flames', name: 'WebGL candle flames + flicker lights', renderMode: 'three', tags: ['three', 'candles'] },
]);

FinaleRegistry.register({
  id: 'envelope', name: 'Envelope · seal · fly-away (canonical)',
  tags: ['canonical'],
  timing: { pack: 1750, seal: 1750, fly: 1450 }, // done appears 4.95 s after submit
  sealImpactAt: 1250,                             // ms into "seal": stamp lands → thump + shake + flash
  reducedMotion: 'simplified',
});

PresetRegistry.register({
  id: 'canonical-default', name: 'Wine & Gold · Candlelit Hall',
  config: { card: 'kit-rose-garden', scene: 'silk', reveal: 'depth-arrival', finale: 'envelope', audio: 'studio' },
});
