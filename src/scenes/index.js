/**
 * Scenes — the flat settings behind the card (see flat.js).
 *
 * Renderer contract: { mode, mount(layerEl, ctx) → Promise<instance> }
 *   instance: { mode, el, setPointer(nx, ny), setStage(stage), resize(frame), destroy() }
 * There is no 3D/WebGL renderer: the owner chose flat settings over staged environments.
 */
import { SceneRegistry } from '../engine/registries.js';
import { FLAT_SCENES, flatSceneHtml } from './flat.js';

/** a slow 2D drift of the motif against the pointer — never a depth effect */
const drift = (el, nx, ny) => el.style.setProperty('--fs-x', `${Math.round(-nx * 60) / 10}px`) || el.style.setProperty('--fs-y', `${Math.round(-ny * 40) / 10}px`);

export function createFlatSceneRenderer(sceneId) {
  return {
    mode: 'flat',
    label: 'Flat colour + SVG motif',
    async mount(layer) {
      const host = document.createElement('div');
      host.className = 'scene-flat';
      host.setAttribute('aria-hidden', 'true');
      host.innerHTML = flatSceneHtml(sceneId);
      layer.append(host);
      return {
        mode: 'flat', el: host,
        setPointer: (nx, ny) => drift(host, nx, ny),
        setStage() {}, resize() {},
        destroy() { host.remove(); },
      };
    },
  };
}

SceneRegistry.registerMany(Object.entries(FLAT_SCENES).map(([id, s]) => ({
  id, name: s.name, swatch: s.field, tone: s.tone, tags: [s.tone],
  renderers: [createFlatSceneRenderer(id)],
  renderMode: 'flat', ambience: null, heavy: false, mobileFallback: 'flat', compat: {}, assets: [],
  source: 'src/scenes/flat.js',
})));
