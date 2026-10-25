/**
 * FXEngine — composes independent effect modules on one shared canvas (+ DOM overlays).
 *
 *   fx: { pack: 'soft_sun_dust', intensity: 0.55 }                       // a named composition
 *   fx: { modules: [{ id: 'petals', params: { density: 0.4 } }], intensity: 1 }  // explicit
 *
 * Every module receives normalised params { intensity, density, speed, opacity, … }
 * and is scaled by the device quality and the stage area, so the same config looks
 * equally dense on a phone and on an ultra-wide screen.
 */
import { FXRegistry, FXPackRegistry } from './registries.js';

export class FXEngine {
  constructor(m) {
    this.m = m;
    this.layer = m.stage.layers.fx;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'xp-fx-canvas';
    this.ctx = this.canvas.getContext('2d');
    this.layer.append(this.canvas);
    this.instances = [];
    this.running = false;
    this.t = 0;
  }

  mount(cfg = {}) {
    this.clear();
    const intensity = cfg.intensity ?? 0.6;
    const pack = cfg.pack && FXPackRegistry.has(cfg.pack) ? FXPackRegistry.get(cfg.pack) : null;
    const list = [...(pack?.modules || []), ...(cfg.modules || [])];
    for (const entry of list) this.add(entry.id, { ...(entry.params || {}) }, intensity);
    this.resize();
    this.start();
  }

  add(id, params = {}, intensity = 1) {
    if (!FXRegistry.has(id)) { console.warn('[fx] unknown module', id); return null; }
    const def = FXRegistry.get(id);
    const p = { intensity: 1, density: 0.5, speed: 1, opacity: 1, ...def.params, ...params };
    p.intensity *= intensity;
    const inst = def.create({ ...this.m, fx: this, params: p, def });
    inst.id = id; inst.kind = def.renderMode;
    this.instances.push(inst);
    inst.resize?.(this.w, this.h);
    return inst;
  }

  /** One-shot effects (confetti at the finale, sparkle burst on reveal…). */
  burst(id, opts = {}) {
    let inst = this.instances.find((i) => i.id === id);
    if (!inst) inst = this.add(id, { density: 0 }, 1);
    inst?.burst?.(opts);
    this.start();
  }

  count(density, perArea = 1) {
    const area = (this.w * this.h) / 100000;
    return Math.round(density * perArea * area * this.m.quality.fxScale * (this.m.quality.reducedMotion ? 0.35 : 1));
  }

  resize() {
    const r = this.layer.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, this.m.quality.dprCap);
    this.w = Math.max(1, r.width); this.h = Math.max(1, r.height); this.dpr = dpr;
    this.canvas.width = Math.round(this.w * dpr); this.canvas.height = Math.round(this.h * dpr);
    this.canvas.style.width = `${this.w}px`; this.canvas.style.height = `${this.h}px`;
    for (const i of this.instances) i.resize?.(this.w, this.h);
  }

  start() {
    if (this.running) return;
    this.running = true;
    let last = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now; this.t += dt;
      const ctx = this.ctx;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, this.w, this.h);
      let any = false;
      for (const i of this.instances) {
        if (i.kind !== 'canvas') continue;
        any = true;
        i.update?.(dt, this.t);
        ctx.save(); i.draw?.(ctx, this.w, this.h, this.t); ctx.restore();
      }
      this.raf = any && !document.hidden ? requestAnimationFrame(loop) : (this.running = false, 0);
    };
    this.raf = requestAnimationFrame(loop);
    if (!this._vis) { this._vis = () => { if (!document.hidden) this.start(); }; document.addEventListener('visibilitychange', this._vis); }
  }

  stop() { this.running = false; cancelAnimationFrame(this.raf); }
  clear() { for (const i of this.instances) i.destroy?.(); this.instances = []; this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height); }
  destroy() { this.stop(); this.clear(); document.removeEventListener('visibilitychange', this._vis); this.canvas.remove(); }
}
