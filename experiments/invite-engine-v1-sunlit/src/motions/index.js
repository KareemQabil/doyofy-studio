/**
 * Motion library: idle motion (MotionRegistry) and page transitions (TransitionRegistry).
 * Both are independent of scene and card — any preset can pick any of them.
 */
import { MotionRegistry, TransitionRegistry } from '../engine/registries.js';

// ------------------------------------------------------------------ idle motion
const idle = (fn) => (m) => {
  if (m.quality.reducedMotion) return null;
  const el = m.stage.card.idle, root = m.stage.root;
  let t0 = null;
  return m.loop((dt, t) => { t0 ??= t; fn(m, el, root, t - t0); });
};

MotionRegistry.registerMany([
  { id: 'none', meta: { title: 'Still', description: 'No idle motion — pure stillness.' }, tags: ['minimal', 'calm', 'editorial'], idle: () => null },
  {
    id: 'subtle_breathing', meta: { title: 'Subtle breathing', description: 'A barely-there scale and lift.' }, tags: ['calm', 'soft', 'editorial', 'luxury'],
    idle: idle((m, el, root, t) => { const b = Math.sin(t * 0.9); m.set(el, { scale: 1 + b * 0.004, y: b * -1.5 }); root.style.setProperty('--lift', (0.5 + b * 0.5).toFixed(3)); }),
  },
  {
    id: 'cinematic_breathing', meta: { title: 'Cinematic breathing', description: 'Breathing card, drifting light and shadow.' }, tags: ['cinematic', 'soft', 'light', 'editorial', 'luxury'],
    idle: idle((m, el, root, t) => {
      const b = Math.sin(t * 0.7), d = Math.sin(t * 0.23);
      m.set(el, { scale: 1 + b * 0.005, y: b * -2, rotateZ: d * 0.25 });
      root.style.setProperty('--lift', (0.5 + b * 0.5).toFixed(3));
      root.style.setProperty('--light-drift', (d * 1).toFixed(3));
    }),
  },
  {
    id: 'floating', meta: { title: 'Floating', description: 'Gentle float with a slow sway.' }, tags: ['playful', 'dreamy', 'soft', 'pastel'],
    idle: idle((m, el, root, t) => { const b = Math.sin(t * 1.1); m.set(el, { y: b * -8, rotateZ: Math.sin(t * 0.6) * 0.8 }); root.style.setProperty('--lift', (0.5 + b * 0.5).toFixed(3)); }),
  },
  {
    id: 'orbit_drift', meta: { title: 'Orbit drift', description: 'Slow three-quarter turn back and forth.' }, tags: ['cinematic', 'glam', 'modern', 'chrome'],
    idle: idle((m, el, root, t) => { m.set(el, { rotateY: Math.sin(t * 0.35) * 4, rotateX: Math.sin(t * 0.27) * 1.5, y: Math.sin(t * 0.8) * -3 }); }),
  },
]);

// ------------------------------------------------------------------ page transitions
const items = (el) => [...(el?.querySelectorAll('.pg-anim, .pg-kicker') || [])];
const side = (m) => (m.L.dir === 'rtl' ? 1 : -1); // +1: pages enter from the right

function staggerIn(tl, el, at, { y = 14, x = 0, blur = 5, dur = 0.8, gap = 0.06 } = {}) {
  const list = items(el);
  if (list.length) tl.fromTo(list, { opacity: 0, y, x, filter: `blur(${blur}px)` }, { opacity: 1, y: 0, x: 0, filter: 'blur(0px)', duration: dur, ease: 'editorial', stagger: gap }, at);
}

TransitionRegistry.registerMany([
  {
    id: 'editorial_slide', meta: { title: 'Editorial masked slide', description: 'Masked horizontal wipes with a depth shift.' },
    tags: ['editorial', 'modern', 'luxury', 'architectural', 'cinematic'],
    open(m, tl, { sheet, page }) {
      const s = side(m);
      const from = s > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)';
      tl.fromTo(sheet, { clipPath: from, opacity: 1, x: 40 * s }, { clipPath: 'inset(0% 0% 0% 0%)', x: 0, duration: 1.05, ease: 'editorial' }, 0.15);
      staggerIn(tl, page, 0.55, { x: 18 * s, y: 6 });
    },
    change(m, tl, { from, to, dir }) {
      const s = side(m) * dir;
      tl.to(from, { x: -46 * s, opacity: 0, scale: 0.975, filter: 'blur(4px)', duration: 0.5, ease: 'power2.in' }, 0);
      tl.fromTo(to, { clipPath: s > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)', x: 30 * s, opacity: 1 }, { clipPath: 'inset(0% 0% 0% 0%)', x: 0, duration: 0.85, ease: 'editorial' }, 0.2);
      staggerIn(tl, to, 0.4, { x: 16 * s, y: 4, dur: 0.7, gap: 0.05 });
    },
    close(m, tl, { sheet }) {
      const s = side(m);
      tl.to(sheet, { clipPath: s > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)', x: 30 * s, duration: 0.8, ease: 'power3.inOut' }, 0);
    },
  },
  {
    id: 'vertical_slide', meta: { title: 'Vertical slide', description: 'Pages glide up like a scroll story.' }, tags: ['modern', 'soft', 'playful', 'calm'],
    open(m, tl, { sheet, page }) { tl.fromTo(sheet, { y: 60, opacity: 0, clipPath: 'inset(0% 0% 0% 0%)' }, { y: 0, opacity: 1, duration: 0.9, ease: 'editorial' }, 0.1); staggerIn(tl, page, 0.4); },
    change(m, tl, { from, to, dir }) {
      tl.to(from, { y: -60 * dir, opacity: 0, duration: 0.5, ease: 'power2.in' }, 0);
      tl.fromTo(to, { y: 70 * dir, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'editorial' }, 0.28);
      staggerIn(tl, to, 0.4);
    },
    close(m, tl, { sheet }) { tl.to(sheet, { y: 60, opacity: 0, duration: 0.6, ease: 'power2.in' }, 0); },
  },
  {
    id: 'dissolve', meta: { title: 'Dissolve', description: 'Soft cross-dissolve with defocus.' }, tags: ['calm', 'dreamy', 'minimal', 'night'],
    open(m, tl, { sheet, page }) { tl.fromTo(sheet, { opacity: 0, filter: 'blur(10px)', clipPath: 'inset(0% 0% 0% 0%)' }, { opacity: 1, filter: 'blur(0px)', duration: 1, ease: 'sine.out' }, 0.1); staggerIn(tl, page, 0.4, { y: 6, blur: 8 }); },
    change(m, tl, { from, to }) {
      tl.to(from, { opacity: 0, filter: 'blur(8px)', duration: 0.55, ease: 'sine.in' }, 0);
      tl.fromTo(to, { opacity: 0, filter: 'blur(8px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.8, ease: 'sine.out' }, 0.3);
    },
    close(m, tl, { sheet }) { tl.to(sheet, { opacity: 0, filter: 'blur(10px)', duration: 0.6 }, 0); },
  },
  {
    id: 'depth_zoom', meta: { title: 'Depth zoom', description: 'The card flips into the sheet; pages move through depth.' }, tags: ['cinematic', 'luxury', 'dramatic', 'night'],
    open(m, tl, { sheet, page }) {
      tl.to(m.stage.card.flip, { rotateY: -180, duration: 0.9, ease: 'power3.inOut' }, 0);
      tl.fromTo(sheet, { scale: 0.84, opacity: 0, y: 30, clipPath: 'inset(0% 0% 0% 0%)' }, { scale: 1, opacity: 1, y: 0, duration: 0.9, ease: 'editorial' }, 0.55);
      staggerIn(tl, page, 0.9);
    },
    change(m, tl, { from, to, dir }) {
      tl.to(from, { scale: dir > 0 ? 0.92 : 1.06, opacity: 0, filter: 'blur(6px)', duration: 0.5, ease: 'power2.in' }, 0);
      tl.fromTo(to, { scale: dir > 0 ? 1.06 : 0.92, opacity: 0, filter: 'blur(6px)' }, { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.8, ease: 'editorial' }, 0.3);
    },
    close(m, tl, { sheet }) {
      tl.to(sheet, { scale: 0.86, opacity: 0, duration: 0.55, ease: 'power2.in' }, 0);
      tl.to(m.stage.card.flip, { rotateY: 0, duration: 0.9, ease: 'power3.inOut' }, 0.25);
    },
  },
  {
    id: 'page_turn', meta: { title: 'Page turn', description: 'Pages hinge like a folio.' }, tags: ['classic', 'arabic', 'luxury', 'paper'],
    open(m, tl, { sheet, page }) { tl.fromTo(sheet, { rotateY: side(m) * 70, opacity: 0, transformOrigin: side(m) > 0 ? '100% 50%' : '0% 50%', clipPath: 'inset(0% 0% 0% 0%)' }, { rotateY: 0, opacity: 1, duration: 1.1, ease: 'editorial' }, 0.1); staggerIn(tl, page, 0.6); },
    change(m, tl, { from, to, dir }) {
      const s = side(m) * dir;
      tl.to(from, { rotateY: -80 * s, opacity: 0, transformOrigin: s > 0 ? '0% 50%' : '100% 50%', duration: 0.55, ease: 'power2.in' }, 0);
      tl.fromTo(to, { rotateY: 80 * s, opacity: 0, transformOrigin: s > 0 ? '100% 50%' : '0% 50%' }, { rotateY: 0, opacity: 1, duration: 0.75, ease: 'editorial' }, 0.4);
    },
    close(m, tl, { sheet }) { tl.to(sheet, { rotateY: side(m) * 70, opacity: 0, duration: 0.7, ease: 'power2.in' }, 0); },
  },
]);
