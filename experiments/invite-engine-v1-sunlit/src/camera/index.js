/**
 * Camera presets. Every preset only describes how the camera *arrives* (enter) and how
 * it breathes at rest (idle). Distances are expressed relative to the fitted card box
 * (m.stage.fit), never as fixed pixels, so framing holds from 360px phones to 3440px
 * ultra-wides. All presets end at identity = the card fully in view.
 */
import { CameraRegistry } from '../engine/registries.js';

const drift = (amp = 1, speed = 1) => (m) => m.loop((dt, t) => {
  const el = m.stage.camera;
  m.set(el, { x: Math.sin(t * 0.21 * speed) * 3 * amp, y: Math.sin(t * 0.17 * speed + 1) * 2 * amp, scale: 1 + Math.sin(t * 0.13 * speed) * 0.004 * amp });
});

CameraRegistry.registerMany([
  { id: 'static_centered', meta: { title: 'Static centred', description: 'Locked-off frame.' }, tags: ['minimal', 'editorial', 'calm'], enter() {} },
  {
    id: 'cinematic_dolly', meta: { title: 'Cinematic dolly', description: 'Small controlled dolly-in with a settle.' }, tags: ['cinematic', 'luxury', 'editorial', 'architectural'],
    enter(m, tl, at) { const f = m.stage.fit; tl.fromTo(m.stage.camera, { scale: 1.1, y: f.h * 0.05, rotateX: 3 }, { scale: 1, y: 0, rotateX: 0, duration: 4.2, ease: 'cinematic' }, at + 0.3); },
    idle: drift(0.8, 0.9),
  },
  {
    id: 'slow_push', meta: { title: 'Slow push', description: 'Patient push-in from a wider frame.' }, tags: ['calm', 'romantic', 'soft'],
    enter(m, tl, at) { tl.fromTo(m.stage.camera, { scale: 0.93 }, { scale: 1, duration: 6, ease: 'power1.out' }, at); },
    idle: drift(0.6, 0.7),
  },
  {
    id: 'side_orbit', meta: { title: 'Side orbit', description: 'Arc in from the side.' }, tags: ['cinematic', 'glam', 'dramatic', 'modern'],
    enter(m, tl, at) { const f = m.stage.fit; tl.fromTo(m.stage.camera, { rotateY: -12, x: -f.w * 0.18, scale: 1.04 }, { rotateY: 0, x: 0, scale: 1, duration: 3.4, ease: 'cinematic' }, at + 0.2); },
    idle: drift(1, 1),
  },
  {
    id: 'macro_to_wide', meta: { title: 'Macro to wide', description: 'Starts on a detail, pulls out to the whole card.' }, tags: ['cinematic', 'luxury', 'dramatic'],
    enter(m, tl, at) { const f = m.stage.fit; tl.fromTo(m.stage.camera, { scale: 2.1, y: f.h * 0.34 }, { scale: 1, y: 0, duration: 3.6, ease: 'expo.inOut' }, at + 0.2); },
  },
  {
    id: 'top_down_drop', meta: { title: 'Top-down drop', description: 'Tilts down from a bird’s-eye angle.' }, tags: ['playful', 'modern', 'dramatic'],
    enter(m, tl, at) { const f = m.stage.fit; tl.fromTo(m.stage.camera, { rotateX: 34, y: -f.h * 0.12, scale: 1.08 }, { rotateX: 0, y: 0, scale: 1, duration: 2.8, ease: 'back.out(1.1)' }, at + 0.2); },
  },
  {
    id: 'soft_handheld', meta: { title: 'Soft handheld', description: 'Organic micro-motion, like a steady hand.' }, tags: ['organic', 'romantic', 'garden'],
    enter(m, tl, at) { tl.fromTo(m.stage.camera, { scale: 1.03 }, { scale: 1, duration: 3, ease: 'sine.out' }, at); },
    idle: (m) => m.loop((dt, t) => m.set(m.stage.camera, { x: Math.sin(t * 1.3) * 1.6 + Math.sin(t * 2.9) * 0.6, y: Math.cos(t * 1.1) * 1.2, rotate: Math.sin(t * 0.9) * 0.12 })),
  },
  {
    id: 'editorial_pan', meta: { title: 'Editorial pan', description: 'Lateral pan that lands on the card.' }, tags: ['editorial', 'modern', 'architectural'],
    enter(m, tl, at) { const f = m.stage.fit; tl.fromTo(m.stage.camera, { x: (m.L.dir === 'rtl' ? -1 : 1) * f.vw * 0.12 }, { x: 0, duration: 3.2, ease: 'editorial' }, at + 0.2); },
    idle: drift(0.5, 0.6),
  },
  {
    id: 'focus_pull', meta: { title: 'Focus pull', description: 'Background racks out of focus as the card arrives.' }, tags: ['cinematic', 'editorial', 'luxury', 'soft'],
    enter(m, tl, at) {
      const bg = [m.stage.layers.far, m.stage.layers.background];
      tl.fromTo(bg, { filter: 'blur(0px)' }, { filter: 'blur(3px)', duration: 2.6, ease: 'sine.inOut' }, at + 1.6);
      tl.fromTo(m.stage.camera, { scale: 1.05 }, { scale: 1, duration: 4, ease: 'cinematic' }, at);
    },
    idle: drift(0.5, 0.8),
  },
]);
