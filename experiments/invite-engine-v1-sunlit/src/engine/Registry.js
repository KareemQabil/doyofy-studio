/**
 * Generic module registry. Every layer of the engine (cards, scenes, reveals, motion,
 * interaction, camera, fx, audio, finales, pages, transitions, presets) is a Registry.
 *
 * A module definition:
 * {
 *   id: 'fabric_peel_and_card_lift',
 *   meta: { title, description, thumbnail? },
 *   tags: ['cinematic', 'soft', 'editorial'],           // what it IS (scored by CompatibilityEngine)
 *   compat: { prefer: [], avoid: [], require: [], exclude: [] },  // what it likes next to it
 *   renderMode: 'dom' | 'svg' | 'canvas' | 'video' | 'webgl' | 'three' | 'hybrid',
 *   assets: [{ id, type, src, preload }],
 *   params: { …defaults },
 *   // lifecycle hooks — each receives a ModuleContext (see ExperienceEngine.makeContext)
 *   setup(m), enter(m, tl), idle(m), interact(m, input), exit(m, tl), destroy(m)
 * }
 */
const HOOKS = ['setup', 'enter', 'idle', 'interact', 'exit', 'destroy'];

export function defineModule(kind, def) {
  if (!def || !def.id) throw new Error(`[registry:${kind}] module needs an id`);
  const out = {
    kind,
    meta: { title: def.id, description: '', ...(def.meta || {}) },
    tags: [],
    renderMode: 'dom',
    assets: [],
    params: {},
    ...def,
    compat: { prefer: [], avoid: [], require: [], exclude: [], ...(def.compat || {}) },
  };
  for (const h of HOOKS) if (typeof out[h] !== 'function') out[h] = undefined;
  return Object.freeze(out);
}

export class Registry {
  constructor(kind) { this.kind = kind; this.items = new Map(); }

  register(def) {
    const mod = def.kind === this.kind && Object.isFrozen(def) ? def : defineModule(this.kind, def);
    if (this.items.has(mod.id)) console.warn(`[registry:${this.kind}] "${mod.id}" re-registered`);
    this.items.set(mod.id, mod);
    return mod;
  }

  registerMany(defs) { defs.forEach((d) => this.register(d)); return this; }
  has(id) { return this.items.has(id); }

  get(id, fallback) {
    if (this.items.has(id)) return this.items.get(id);
    if (fallback && this.items.has(fallback)) {
      console.warn(`[registry:${this.kind}] unknown "${id}", using "${fallback}"`);
      return this.items.get(fallback);
    }
    throw new Error(`[registry:${this.kind}] unknown module "${id}"`);
  }

  list({ tag, renderMode } = {}) {
    return [...this.items.values()].filter((m) => (!tag || m.tags.includes(tag)) && (!renderMode || m.renderMode === renderMode));
  }

  ids() { return [...this.items.keys()]; }
}
