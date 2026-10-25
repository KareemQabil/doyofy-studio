/**
 * Interaction library. Every module turns input (mouse, touch, device tilt, keyboard)
 * into two outputs: parallax vars on the stage (--px/--py, consumed by the depth layers)
 * and a transform on the card's tilt wrapper. Touch is first-class: drag-to-look on
 * phones, device orientation where the browser grants it without a prompt.
 */
import { InteractionRegistry } from '../engine/registries.js';

/** Shared input source: smoothed pointer / touch / orientation in -1..1. */
function inputSource(m, { stiffness = 0.07, touchDrag = true } = {}) {
  const root = m.stage.root;
  const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  let dragging = false, lastOrient = 0;
  const fromEvent = (e) => {
    const r = root.getBoundingClientRect();
    target.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
    target.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
  };
  m.listen(root, 'pointermove', (e) => { if (e.pointerType === 'mouse' || (touchDrag && dragging)) fromEvent(e); });
  m.listen(root, 'pointerdown', (e) => { if (e.pointerType !== 'mouse') { dragging = true; fromEvent(e); } });
  m.listen(window, 'pointerup', () => { dragging = false; if (performance.now() - lastOrient > 500) { target.x = 0; target.y = 0; } });
  m.listen(root, 'pointerleave', (e) => { if (e.pointerType === 'mouse') { target.x = 0; target.y = 0; } });
  m.listen(window, 'deviceorientation', (e) => {
    if (e.gamma == null || dragging) return;
    lastOrient = performance.now();
    target.x = Math.max(-1, Math.min(1, e.gamma / 25));
    target.y = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
  });
  return {
    target, cur,
    step() { cur.x += (target.x - cur.x) * stiffness; cur.y += (target.y - cur.y) * stiffness; return cur; },
  };
}

function parallax(m, { strength = 1, tiltX = 2.2, tiltY = 3, move = 0, glare = false, stiffness } = {}) {
  if (m.quality.reducedMotion) return null;
  const src = inputSource(m, { stiffness });
  const root = m.stage.root, tilt = m.stage.card.tilt;
  return m.loop(() => {
    const c = src.step();
    root.style.setProperty('--px', (c.x * strength).toFixed(4));
    root.style.setProperty('--py', (c.y * strength).toFixed(4));
    if (glare) { root.style.setProperty('--glare-x', `${50 + c.x * 40}%`); root.style.setProperty('--glare-y', `${50 + c.y * 40}%`); }
    m.set(tilt, { rotateY: c.x * tiltY, rotateX: -c.y * tiltX, x: c.x * move, y: c.y * move });
  });
}

InteractionRegistry.registerMany([
  { id: 'none', meta: { title: 'None', description: 'Static — clicks only.' }, tags: ['minimal', 'calm'], interact: () => null },
  {
    id: 'soft_depth_parallax', meta: { title: 'Soft depth parallax', description: 'Layers shift with the pointer; the card barely tilts and stays readable.' },
    tags: ['editorial', 'soft', 'luxury', 'architectural', 'cinematic'],
    interact: (m) => parallax(m, { strength: 1, tiltX: 1.6, tiltY: 2.4, stiffness: 0.06 }),
  },
  {
    id: 'tilt', meta: { title: '3D tilt', description: 'Pronounced tilt with specular glare.' }, tags: ['playful', 'glam', 'dramatic', 'chrome'],
    interact: (m) => parallax(m, { strength: 0.8, tiltX: 9, tiltY: 12, glare: true, stiffness: 0.1 }),
  },
  {
    id: 'magnetic', meta: { title: 'Magnetic', description: 'The card is gently pulled toward the pointer.' }, tags: ['playful', 'modern', 'pastel'],
    interact: (m) => parallax(m, { strength: 0.7, tiltX: 3, tiltY: 4, move: 12, stiffness: 0.09 }),
  },
  {
    id: 'drag_rotate', meta: { title: 'Drag to rotate', description: 'Drag the card to turn it and see the back; it springs home.' },
    tags: ['modern', 'playful', 'glam', 'chrome'],
    interact(m) {
      const stopPar = parallax(m, { strength: 0.6, tiltX: 1.5, tiltY: 0, stiffness: 0.06 });
      if (m.quality.reducedMotion) return stopPar;
      const hit = m.stage.card.hit, flip = m.stage.card.flip;
      let down = false, sx = 0, rot = 0, vel = 0, moved = false;
      m.listen(hit, 'pointerdown', (e) => { down = true; moved = false; sx = e.clientX; hit.setPointerCapture?.(e.pointerId); });
      m.listen(hit, 'pointermove', (e) => { if (!down) return; const dx = e.clientX - sx; sx = e.clientX; if (Math.abs(dx) > 1) moved = true; vel = dx * 0.6; rot = Math.max(-200, Math.min(200, rot + vel)); });
      m.listen(window, 'pointerup', () => { down = false; });
      m.listen(hit, 'click', (e) => { if (moved) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
      const stopSpring = m.loop(() => { if (m.stage.root.dataset.state !== 'hero') return; if (!down) { rot += (0 - rot) * 0.06; } m.set(flip, { rotateY: rot }); });
      return () => { stopPar?.(); stopSpring(); };
    },
  },
]);
