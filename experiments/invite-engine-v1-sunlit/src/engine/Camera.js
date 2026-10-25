/**
 * CameraEngine. For DOM/SVG/video scenes the "camera" is the .xp-camera container
 * (translate/scale/rotate + optional background focus blur). WebGL scenes subscribe to
 * 'camera:update' and mirror the same state on a real camera.
 *
 * Presets (src/camera) only describe *how* to arrive; framing is always computed from
 * the fitted card box, so every preset ends with the card fully in view.
 */
import { frameInto } from './fit.js';
import { getTransform } from './motion/Timeline.js';

export class CameraEngine {
  constructor(m) { this.m = m; this.el = m.stage.camera; this.preset = null; this._stopIdle = null; }

  setPreset(def) { this.preset = def; }
  get state() { return getTransform(this.el); }

  /** Intro move, added to the hero timeline. Presets receive the fit so moves scale with the screen. */
  intro(tl, at = 0) { this.preset?.enter?.({ ...this.m, camera: this }, tl, at); }

  startIdle() {
    this.stopIdle();
    if (this.m.quality.reducedMotion || !this.preset?.idle) return;
    this._stopIdle = this.preset.idle({ ...this.m, camera: this });
  }
  stopIdle() { this._stopIdle?.(); this._stopIdle = null; }

  /** Where the card sits while pages are open: beside the sheet (wide) or small & high (compact). */
  pagesFrame() {
    const f = this.m.stage.fit;
    const rtl = this.m.L.dir === 'rtl';
    if (!f.mobile && f.vw >= 900) {
      const sheetW = Math.min(560, f.vw * 0.46);
      const freeW = f.vw - sheetW - 64;
      const target = { x: rtl ? 24 : f.vw - freeW - 24, y: f.safe.t, w: freeW - 24, h: f.vh - f.safe.t - f.safe.b };
      return frameInto({ x: f.x, y: f.y, w: f.w, h: f.h }, target);
    }
    return { scale: 0.42, x: 0, y: -(f.cy - f.vh * 0.2), blur: 0 };
  }

  toPages(tl, at = 0, dur = 1.1) {
    this.stopIdle();
    const fr = this.pagesFrame();
    tl.to(this.el, { x: fr.x, y: fr.y, scale: fr.scale, rotateX: 0, rotateY: 0, duration: dur, ease: 'editorial' }, at);
    this.m.bus.emit('camera:update', { ...fr, phase: 'pages' });
    return fr;
  }

  toRest(tl, at = 0, dur = 1) {
    tl.to(this.el, { x: 0, y: 0, scale: 1, rotateX: 0, rotateY: 0, duration: dur, ease: 'editorial' }, at);
    this.m.bus.emit('camera:update', { x: 0, y: 0, scale: 1, phase: 'rest' });
  }

  pullBack(tl, at = 0, amount = 0.88, dur = 1.6) {
    const f = this.m.stage.fit;
    tl.to(this.el, { x: 0, y: -f.h * 0.06, scale: amount, rotateX: 0, rotateY: 0, duration: dur, ease: 'cinematic' }, at);
    this.m.bus.emit('camera:update', { scale: amount, phase: 'finale' });
  }

  destroy() { this.stopIdle(); }
}
