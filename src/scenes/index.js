/**
 * Scenes — the 10 canonical environments.
 *
 * Every scene lists its renderers best-first. The Studio picks the first renderer the device and
 * quality tier allow, and falls back down the list if loading fails or times out, so a heavy
 * renderer can never leave a blank stage. Every scene ends with the canonical DOM/CSS + SVG
 * renderer (generated from canonical/Scene.dc.html).
 *
 * Renderer contract (see css/renderer.js):
 *   { mode, label, minQuality?, requires?: ['webgl'], mount(layerEl, ctx) → Promise<instance> }
 *   instance: { mode, setPointer(nx, ny), setStage(stage), resize(frame), destroy() }
 *
 * Migrating another scene to Three/WebGL = add a renderer in front of its DOM renderer. Nothing else.
 */
import { SceneRegistry } from '../engine/registries.js';
import { createDomSceneRenderer } from './css/renderer.js';

const threeCandlelit = {
  mode: 'three',
  label: 'Three.js / WebGL (PBR, GLB, HDRI)',
  minQuality: 'low',
  requires: ['webgl'],
  async mount(layer, ctx) {
    const { mountCandlelitHall } = await import('./three/candlelit-hall.js');
    return mountCandlelitHall(layer, ctx);
  },
};

const S = (id, name, swatch, tone, tags, extra = {}) => ({
  id, name, swatch, tone, tags: [tone, ...tags],
  renderers: [...(extra.renderers || []), createDomSceneRenderer(id)],
  renderMode: extra.renderers?.length ? 'hybrid' : 'dom',
  ambience: extra.ambience || null,
  heavy: !!extra.renderers?.length,
  mobileFallback: 'dom',
  compat: extra.compat || {},
  assets: extra.assets || [],
  source: 'canonical/Scene.dc.html',
});

SceneRegistry.registerMany([
  S('candlelit', 'Candlelit Hall', '#3A1A1F', 'dark', ['night', 'warm', 'luxury', 'candles'], {
    renderers: [threeCandlelit],
    compat: { recommended: ['kit-seal-arch', 'kit-henna-rosette', 'kit-lantern-night', 'kit-laurel-gala'] },
    assets: [
      { path: 'p0-derived/models/lantern-chandelier-01/lantern-chandelier-01.gltf.json', kind: 'model' },
      { path: 'p0-derived/models/brass-vase-02/brass-vase-02.gltf.json', kind: 'model' },
      { path: 'p0-derived/models/brass-goblets/brass-goblets.gltf.json', kind: 'model' },
      { path: 'p0-derived/models/lantern-01/lantern-01.gltf.json', kind: 'model' },
      { path: 'p0-derived/hdri/courtyard-2k-rgbm16.png', kind: 'hdri' },
    ],
  }),
  S('marble', 'Marble Morning', '#EDE7E0', 'light', ['morning', 'bright', 'classic']),
  S('garden', 'Garden Night', '#14271C', 'dark', ['garden', 'night', 'botanical']),
  S('desert', 'Desert Sunset', '#E07A6E', 'warm', ['desert', 'sunset', 'warm']),
  S('starry', 'Starry Night', '#121B45', 'dark', ['night', 'celestial']),
  S('silk', 'Silk Drapes', '#EAD4CA', 'light', ['soft', 'romantic', 'fabric']),
  S('petals', 'Floating Petals', '#F4EAFB', 'light', ['pastel', 'romantic', 'playful']),
  S('clay', 'Clay Stage', '#F7D7E6', 'light', ['playful', 'pastel', 'clay']),
  S('sea', 'Moonlit Sea', '#1B2B58', 'dark', ['night', 'sea', 'calm']),
  S('palace', 'Palace Arches', '#D6B27A', 'warm', ['arabic', 'architectural', 'warm']),
]);
