/**
 * Dynamic camera framing for WebGL scenes that sit behind the 390×844 DOM stage.
 *
 * The world is laid out so the canonical stage maps to a plane at z = 0: 1 stage px = 1 mm
 * (stage = 0.390 × 0.844 m, card = 0.300 × 0.420 m, origin at the stage's top-left, +y up).
 *
 * Rule (never a hard-coded camera position):
 *   visibleH = stageH_world × viewportH / stageH_screen        (the stage is contain-fitted)
 *   visibleW = stageW_world × viewportW / stageW_screen
 *   distH    = (visibleH / 2) / tan(vfov / 2)
 *   distW    = (visibleW / 2) / (tan(vfov / 2) × aspect)
 *   distance = max(distH, distW) × (1 + margin)
 * then a lens shift (setViewOffset) puts the principal point where the DOM stage's
 * perspective-origin is (50 % 42 %), so CSS-3D card and WebGL room share one vanishing point.
 * The result keeps the whole card (and the stage composition around it) on screen at any aspect
 * ratio; wider screens simply reveal more of the room.
 */
export const STAGE_W = 390, STAGE_H = 844, MM = 0.001;
export const PERSPECTIVE_ORIGIN = { x: 0.5, y: 0.42 };

/** stage px → world metres (stage plane z = 0) */
export const sx = (px) => (px - STAGE_W / 2) * MM;
export const sy = (py) => (STAGE_H * PERSPECTIVE_ORIGIN.y - py) * MM; // y=0 at the eye line

export function computeFraming({ viewW, viewH, stageRect, vfov = 42, margin = 0 }) {
  const t = Math.tan((vfov * Math.PI) / 360);
  const aspect = viewW / viewH;
  const visibleH = (STAGE_H * MM * viewH) / stageRect.height;
  const visibleW = (STAGE_W * MM * viewW) / stageRect.width;
  const distH = visibleH / 2 / t;
  const distW = visibleW / 2 / (t * aspect);
  const distance = Math.max(distH, distW) * (1 + margin);
  // where the stage's perspective origin lands on screen, relative to the viewport centre (px)
  const poX = stageRect.left + stageRect.width * PERSPECTIVE_ORIGIN.x;
  const poY = stageRect.top + stageRect.height * PERSPECTIVE_ORIGIN.y;
  return { distance, distH, distW, aspect, vfov, shiftX: viewW / 2 - poX, shiftY: viewH / 2 - poY, visibleW, visibleH };
}

/** apply to a THREE.PerspectiveCamera looking down −z at the eye line */
export function applyFraming(camera, f, { viewW, viewH, offset = { x: 0, y: 0, z: 0 } }) {
  camera.fov = f.vfov;
  camera.aspect = f.aspect;
  camera.position.set(offset.x, offset.y, f.distance + offset.z);
  camera.lookAt(offset.x * 0.35, offset.y * 0.35, 0);
  // lens shift: move the principal point to the stage perspective origin
  camera.setViewOffset(viewW, viewH, f.shiftX, f.shiftY, viewW, viewH);
  camera.updateProjectionMatrix();
}
