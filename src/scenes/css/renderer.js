/**
 * DOM/CSS + SVG scene renderer (render mode "dom").
 *
 * Renders one of the 10 canonical scenes from the generated markup. This is the reference look
 * for every scene and the guaranteed fallback for scenes that also have a heavier renderer
 * (Three/WebGL, video). It never fails, needs no assets and costs nothing to mount.
 */
import { SCENES, SCENE_ROOT } from './generated.js';
import { SCENE_VALS, parallaxVars } from './vals.js';

export function createDomSceneRenderer(sceneId) {
  return {
    mode: 'dom',
    label: 'DOM/CSS + SVG',
    async mount(layer, ctx) {
      const root = document.createElement('div');
      root.className = 'scene-dom';
      root.innerHTML = `<div ${SCENE_ROOT.replace('aria-hidden="true"', '')}>${SCENES[sceneId](SCENE_VALS)}</div>`;
      root.setAttribute('aria-hidden', 'true');
      layer.append(root);
      const apply = (nx, ny) => { for (const [k, v] of Object.entries(parallaxVars(nx, ny))) root.style.setProperty(k, v); };
      apply(0, 0);
      return {
        mode: 'dom',
        el: root,
        setPointer: apply,
        setStage() {},
        resize() {},
        destroy() { root.remove(); },
      };
    },
  };
}
