/**
 * Generic module registry — one per engine layer (cards, scenes, reveals, motion, interaction,
 * camera, fx, audio, finales, pages, presets).
 *
 * Module definition (all fields optional except id):
 * {
 *   id, name, tags: [],                       // what it IS (read by the compatibility rules)
 *   renderMode: 'dom'|'svg'|'canvas'|'video'|'three'|'hybrid',
 *   assets: [{ path, kind, required }],       // public/assets-relative; checked by tools/check_assets.mjs
 *   compat: { recommended: [], compatible: [], incompatible: [], requires: [] },
 *   quality: { min: 'low'|'balanced'|'high', heavy: false },
 *   mobile: true,                             // usable on phones
 *   reducedMotion: 'static'|'simplified'|'same',
 *   // lifecycle hooks the engine may call
 *   setup(ctx), enter(ctx), idle(ctx), interact(ctx, input), exit(ctx), destroy(ctx)
 * }
 */
const HOOKS = ['setup', 'enter', 'idle', 'interact', 'exit', 'destroy'];

export function defineModule(kind, def) {
  if (!def?.id) throw new Error(`[registry:${kind}] module needs an id`);
  const mod = {
    kind, name: def.id, tags: [], renderMode: 'dom', assets: [], mobile: true, reducedMotion: 'simplified',
    quality: { min: 'low', heavy: false }, ...def,
    compat: { recommended: [], compatible: [], incompatible: [], requires: [], ...(def.compat || {}) },
  };
  for (const h of HOOKS) if (mod[h] && typeof mod[h] !== 'function') throw new Error(`[registry:${kind}] ${def.id}.${h} must be a function`);
  return Object.freeze(mod);
}

export class Registry {
  constructor(kind) { this.kind = kind; this.items = new Map(); }
  register(def) { const m = defineModule(this.kind, def); this.items.set(m.id, m); return m; }
  registerMany(defs) { defs.forEach((d) => this.register(d)); return this; }
  has(id) { return this.items.has(id); }
  get(id, fallback) {
    const m = this.items.get(id);
    if (m) return m;
    if (fallback !== undefined && this.items.has(fallback)) {
      console.warn(`[registry:${this.kind}] "${id}" not found — using "${fallback}"`);
      return this.items.get(fallback);
    }
    throw new Error(`[registry:${this.kind}] unknown "${id}"`);
  }
  list() { return [...this.items.values()]; }
  ids() { return [...this.items.keys()]; }
}
