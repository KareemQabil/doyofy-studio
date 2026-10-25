/**
 * Three.js render mode adapter (optional).
 *
 * The engine never bundles Three.js. A scene that declares renderMode: 'three' calls
 * loadThree(); it resolves the global THREE (e.g. a <script> tag), or a localized module
 * declared in config.vendor.three (e.g. 'vendor/three.module.min.js'). If neither exists the promise resolves to null and
 * the scene falls back to its WebGL/DOM version — so the demo works without the library.
 *
 * createThreeLayer() gives a scene a renderer + camera with:
 *   - DPR cap from the quality profile · resize via ResizeObserver
 *   - camera distance computed from the card box so the subject always fits (fitDistance)
 *   - full disposal (geometries, materials, textures, renderer, context)
 */
let pending = null;
export function loadThree(m) {
  if (window.THREE) return Promise.resolve(window.THREE);
  const src = m.config.vendor?.three; // e.g. 'vendor/three.module.min.js' after localizing it
  if (!src) return Promise.resolve(null);
  if (!pending) pending = import(/* @vite-ignore */ m.assets.url(src)).then((mod) => mod.default || mod).catch(() => null);
  return pending;
}

/** Distance at which an object of height `h` fills `fill` of a vertical FOV. */
export function fitDistance(h, fovDeg, fill = 0.8) { return (h / fill) / (2 * Math.tan((fovDeg * Math.PI) / 360)); }

export function createThreeLayer(m, THREE, { layer = 'background', fov = 35 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: m.quality.level === 'high', alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, m.quality.dprCap));
  renderer.domElement.className = 'xp-gl';
  m.stage.layers[layer].append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
  const resize = () => {
    const r = renderer.domElement.parentElement.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / Math.max(1, r.height);
    camera.position.z = fitDistance(2, fov, Math.min(0.9, camera.aspect > 1 ? 0.7 : 0.85));
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize); ro.observe(m.stage.layers[layer]);
  const offCam = m.bus.on('camera:update', (s) => { if (s.scale) camera.zoom = s.scale; camera.updateProjectionMatrix(); });
  return {
    renderer, scene, camera,
    destroy() {
      ro.disconnect(); offCam();
      scene.traverse((o) => { o.geometry?.dispose?.(); const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []; mats.forEach((mt) => { Object.values(mt).forEach((v) => v?.isTexture && v.dispose()); mt.dispose(); }); });
      renderer.dispose(); renderer.forceContextLoss?.(); renderer.domElement.remove();
    },
  };
}
