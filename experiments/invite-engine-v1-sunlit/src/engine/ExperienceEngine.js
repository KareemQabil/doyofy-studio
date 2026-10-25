/**
 * ExperienceEngine — turns one declarative config into a running invitation.
 *
 *   const engine = new ExperienceEngine(host, { rsvp: { type: 'local' } });
 *   await engine.load({ preset: 'sunlit-architectural-botanical' });
 *   await engine.load({ ...config, card: { template: 'wine_gold_crest' } });   // swap any layer
 *
 * Responsibilities: resolve modules from the registries, build the stage, preload the
 * first scene, run the flow states, and own every lifecycle (setup → enter → idle →
 * interact → exit → destroy) so that restart/replay never leaks timers, listeners,
 * videos, audio nodes or WebGL contexts.
 */
import { EventBus } from './EventBus.js';
import { registries, PresetRegistry } from './registries.js';
import { AssetManager } from './AssetManager.js';
import { AudioEngine } from './AudioEngine.js';
import { CameraEngine } from './Camera.js';
import { CompatibilityEngine } from './CompatibilityEngine.js';
import { deriveContent, languageHelper } from './Content.js';
import { FlowEngine } from './FlowEngine.js';
import { FontManager } from './Fonts.js';
import { FXEngine } from './FXEngine.js';
import { PageEngine } from './PageEngine.js';
import { detectQuality } from './Quality.js';
import { Stage } from './Stage.js';
import { createRSVPAdapter } from './rsvp/adapters.js';
import { createTimeline, TimelineDefaults, setProps } from './motion/Timeline.js';
import { h, icons } from './dom.js';
import { sampleContent } from '../content/sample.js';

export const DEFAULT_FLOW = ['intro', 'hero', 'opening', 'invitation', 'date', 'program', 'venue', 'rsvp', 'finale', 'thankYou'];

export const DEFAULT_CONFIG = {
  id: 'demo-invitation',
  content: sampleContent,
  card: { template: 'arabic_botanical_luxury', variant: 'ivory_olive' },
  environment: { id: 'sunlit_architectural_studio', renderMode: 'hybrid' },
  reveal: { id: 'fade' },
  motion: { idle: 'subtle_breathing', interaction: 'soft_depth_parallax', pageTransition: 'editorial_slide', engine: 'builtin' },
  camera: { preset: 'static_centered' },
  fx: { pack: 'none', intensity: 0.5 },
  audio: { pack: 'modern_romantic', enabled: true },
  finale: { type: 'translucent_sleeve' },
  flow: DEFAULT_FLOW,
};

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
export function deepMerge(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b || {})) out[k] = isObj(v) && isObj(a?.[k]) ? deepMerge(a[k], v) : v;
  return out;
}

export function normalizeConfig(input = {}) {
  let base = DEFAULT_CONFIG;
  if (input.preset && PresetRegistry.has(input.preset)) base = deepMerge(base, PresetRegistry.get(input.preset).config);
  const { preset, ...rest } = input;
  const cfg = deepMerge(base, rest);
  cfg.preset = preset || null;
  return cfg;
}

export class ExperienceEngine {
  constructor(host, opts = {}) {
    this.host = host;
    this.opts = opts;
    this.bus = new EventBus();
    this.fonts = new FontManager({ remote: opts.remoteFonts ?? true, manifest: opts.fontManifest });
    this.fonts.base = opts.assetBase || 'assets/';
    this.rsvp = createRSVPAdapter(opts.rsvp);
    this.compat = new CompatibilityEngine(registries);
    this.overrides = { reducedMotion: null, muted: false };
    this.assets = new AssetManager({ base: opts.assetBase || 'assets/' });
    this.m = null;
    this._loadId = 0;
  }

  // ------------------------------------------------------------------ public API
  async load(config) {
    const id = ++this._loadId;
    this._teardown();
    this.config = normalizeConfig(config);
    await this._build(id);
  }
  restart() { return this.load(this.config); }
  update(partial) { return this.load(deepMerge(this.config, partial)); }
  getConfig() { const { preset, ...c } = this.config; return JSON.parse(JSON.stringify({ preset: preset || undefined, ...c })); }
  setReducedMotion(v) { this.overrides.reducedMotion = v; return this.restart(); }
  setMuted(v) { this.overrides.muted = v; this.audio?.setMuted(v); this._syncSoundBtn(); }
  on(type, fn) { return this.bus.on(type, fn); }

  // ------------------------------------------------------------------ build
  async _build(loadId) {
    const cfg = this.config;
    // config.quality { level, reducedMotion, dprCap } < Studio / runtime overrides < OS detection defaults
    const quality = detectQuality({ ...(cfg.quality || {}), ...(this.overrides.reducedMotion != null ? { reducedMotion: this.overrides.reducedMotion } : {}) });
    TimelineDefaults.timeScale = quality.reducedMotion ? 5 : 1;
    this.assets.quality = quality;
    this.audio = this.audio || new AudioEngine({ assets: this.assets, bus: this.bus });
    this.audio.setMuted(this.overrides.muted);

    const content = deriveContent(cfg.content);
    const L = languageHelper(content);
    const stage = new Stage(this.host, { dir: L.dir });
    stage.root.lang = L.primary;
    const disposers = []; const timelines = new Set();
    this._disposers = disposers; this._timelines = timelines;

    const m = this.m = {
      engine: this, config: cfg, content, L, stage, quality, bus: this.bus, assets: this.assets, audio: this.audio, rsvp: this.rsvp, compat: this.compat,
      tl: (opts) => { const t = createTimeline(opts, { useGsap: cfg.motion?.engine === 'gsap' }); timelines.add(t); return t; },
      set: setProps,
      track: (fn) => { disposers.push(fn); return fn; },
      listen: (el, ev, fn, o) => { el.addEventListener(ev, fn, o); disposers.push(() => el.removeEventListener(ev, fn, o)); },
      loop: (fn) => {
        let id = 0, last = performance.now(), alive = true;
        const f = (now) => { if (!alive) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; if (fn(dt, now / 1000) !== false) id = requestAnimationFrame(f); };
        id = requestAnimationFrame(f);
        const stop = () => { alive = false; cancelAnimationFrame(id); };
        disposers.push(stop); return stop;
      },
    };
    const R = registries;
    const mods = this.mods = {
      card: R.card.get(cfg.card.template, 'arabic_botanical_luxury'),
      scene: R.scene.get(cfg.environment.id, 'sunlit_architectural_studio'),
      reveal: R.reveal.get(cfg.reveal.id, 'fade'),
      idle: R.motion.get(cfg.motion.idle, 'subtle_breathing'),
      interaction: R.interaction.get(cfg.motion.interaction, 'soft_depth_parallax'),
      transition: R.transition.get(cfg.motion.pageTransition, 'editorial_slide'),
      camera: R.camera.get(cfg.camera.preset, 'static_centered'),
      audio: cfg.audio.enabled === false ? R.audio.get('silent') : R.audio.get(cfg.audio.pack, 'modern_romantic'),
      finale: R.finale.get(cfg.finale.type, 'translucent_sleeve'),
    };
    const ctx = (def, params = {}) => Object.assign(Object.create(m), { def, params: { ...def.params, ...params }, state: {} });
    this.ctx = {
      card: ctx(mods.card, cfg.card), scene: ctx(mods.scene, cfg.environment), reveal: ctx(mods.reveal, cfg.reveal),
      idle: ctx(mods.idle, cfg.motion.idleParams), interaction: ctx(mods.interaction, cfg.motion.interactionParams),
      transition: ctx(mods.transition, cfg.motion.transitionParams), finale: ctx(mods.finale, cfg.finale),
    };
    m.transition = { def: mods.transition, ctx: this.ctx.transition };
    stage.root.dataset.scene = mods.scene.id;
    stage.root.dataset.card = mods.card.id;
    stage.root.style.setProperty('--scene-bg', mods.scene.backdrop || '#111');
    stage.root.classList.toggle('is-reduced', quality.reducedMotion);

    // card first (its design size drives the fit), then the scene around it
    m.card = this._safe(() => mods.card.render(this.ctx.card), 'card.render') || { palette: {}, design: { w: 300, h: 420 } };
    stage.setCardDesign(m.card.design || { w: 300, h: 420 });
    this._mountCard(m.card);
    this._safe(() => mods.scene.setup?.(this.ctx.scene), 'scene.setup');
    this.audio.setPack(mods.audio);

    m.camera = new CameraEngine(m); m.camera.setPreset(mods.camera);
    m.fx = new FXEngine(m);
    m.flow = new FlowEngine(m, cfg.flow);
    m.pages = new PageEngine(m, m.flow.pageIds);
    m.pages.theme(m.card);
    this._buildUI();

    // preload what the first frame needs; fonts are raced so a slow network never blocks
    stage.root.classList.add('is-loading');
    const critical = [...(mods.scene.assets || []), ...(m.card.assets || [])].filter((a) => a.preload !== false).map((a) => ({ ...a, src: a.src }));
    await Promise.all([
      this.assets.preload(critical, { timeout: 4000 }),
      this.fonts.ensure([...(m.card.fontFaces || []), ...(mods.scene.fontFaces || [])]),
    ]);
    if (loadId !== this._loadId) return; // a newer load() superseded this one
    stage.layout();
    m.fx.resize();
    m.fx.mount(cfg.fx);
    this._safe(() => mods.scene.layout?.(this.ctx.scene), 'scene.layout');
    const ro = new ResizeObserver(() => this._relayout());
    ro.observe(stage.root);
    disposers.push(() => ro.disconnect());
    stage.root.classList.remove('is-loading');
    this.bus.emit('engine:ready', { config: cfg, mods });
    m.flow.start();
  }

  _mountCard(card) {
    const c = this.m.stage.card;
    if (card.front) c.front.append(card.front);
    if (card.back) c.back.append(card.back);
    for (const d of card.decor || []) {
      const [x, y, w, hh] = d.box;
      Object.assign(d.el.style, { left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${hh}%` });
      d.el.classList.add('xp-decor__item');
      (d.place === 'front' ? c.decorFront : c.decorBack).append(d.el);
    }
    this.m.stage.root.style.setProperty('--card-radius', card.radius ?? '6px');
    card.settle = (tl, at = 0) => {
      const items = [...(card.layers || []), ...(card.decor || [])].filter((x) => x.enter);
      items.forEach((x, i) => {
        const e = x.enter;
        tl.fromTo(x.el, { ...e.from }, { ...(e.to || {}), duration: e.duration ?? 1.3, ease: e.ease || 'settle' }, at + (e.delay ?? i * 0.12));
      });
    };
  }

  _relayout() {
    const m = this.m; if (!m) return;
    m.stage.layout(); m.fx.resize();
    this._safe(() => this.mods.scene.layout?.(this.ctx.scene), 'scene.layout');
    if (m.pages.isOpen) { const fr = m.camera.pagesFrame(); m.set(m.stage.camera, { x: fr.x, y: fr.y, scale: fr.scale }); }
  }

  _safe(fn, label) { try { return fn(); } catch (e) { console.error(`[engine] ${label} failed`, e); return null; } }

  // ------------------------------------------------------------------ UI chrome
  _buildUI() {
    const { stage, L } = this.m;
    this.soundBtn = h('button', { class: 'xp-ctrl', type: 'button', 'aria-label': L.t('sound'), 'aria-pressed': 'false' });
    this.replayBtn = h('button', { class: 'xp-ctrl', type: 'button', 'aria-label': L.t('replay'), html: icons.replay });
    this.hint = h('div', { class: 'xp-hint', 'aria-hidden': 'true' }, h('span', L.lang(L.primary), L.t('tapToOpen')), L.secondary && h('small', L.lang(L.secondary), L.ts('tapToOpen')));
    stage.ui.append(h('div', { class: 'xp-controls' }, this.soundBtn, this.replayBtn), this.hint);
    this.m.listen(this.soundBtn, 'click', () => {
      if (!this.audio.unlocked) { this.audio.unlock(); this.setMuted(false); this.audio.startAmbient(); }
      else this.setMuted(!this.overrides.muted);
      this._syncSoundBtn();
    });
    this.m.listen(this.replayBtn, 'click', () => { this.audio.emit('click'); this.restart(); });
    stage.card.hit.setAttribute('aria-label', L.t('open'));
    stage.card.hit.disabled = true;
    this.m.listen(stage.card.hit, 'click', () => this.openInvitation());
    this._syncSoundBtn();
  }

  _syncSoundBtn() {
    if (!this.soundBtn) return;
    const on = this.audio?.unlocked && !this.overrides.muted;
    this.soundBtn.innerHTML = on ? icons.sound : icons.mute;
    this.soundBtn.setAttribute('aria-pressed', String(!!on));
  }

  // ------------------------------------------------------------------ states
  async runState(state, kind) {
    const m = this.m;
    switch (kind) {
      case 'intro': await this._intro(); return m.flow.next();
      case 'hero': return this._hero();
      case 'opening': return this._opening();
      case 'page': if (!m.pages.isOpen) { this._leaveHero(); m.camera.toPages(m.tl(), 0); return m.pages.open(state); } return m.pages.goTo(state);
      case 'finale': await this._finale(); return m.flow.next();
      case 'thankYou': return this._thankYou();
      default: console.warn('[flow] unknown state', state); return m.flow.next();
    }
  }

  async _intro() {
    const m = this.m;
    const tl = m.tl();
    this._safe(() => this.mods.scene.enter?.(this.ctx.scene, tl, 0), 'scene.enter');
    m.camera.intro(tl, 0);
    this._safe(() => this.mods.reveal.enter?.(this.ctx.reveal, tl), 'reveal.enter');
    m.card.settle(tl, tl.labels.decor ?? Math.max(0, tl.duration() - 1));
    tl.call(() => { this.audio.emit('reveal'); this.bus.emit('reveal:card'); }, [], tl.labels.card ?? 0.4);
    // A tap anywhere on the scene (not on a control) fast-forwards the intro — nobody waits for it.
    let skipped = false;
    m.listen(m.stage.root, 'pointerdown', (e) => {
      if (skipped || e.target.closest?.('.xp-controls, .studio, a, input') || m.flow.kind(m.flow.state) !== 'intro') return;
      skipped = true; tl.timeScale(5); this.bus.emit('intro:skip');
    });
    await tl;
  }

  _hero() {
    const m = this.m;
    m.stage.setState('hero');
    m.stage.card.hit.disabled = false;
    this.hint.classList.add('is-on');
    if (!this._idleOn) {
      this._idleOn = true;
      const stopIdle = this._safe(() => this.mods.idle.idle?.(this.ctx.idle), 'motion.idle'); if (typeof stopIdle === 'function') m.track(stopIdle);
      const stopScene = this._safe(() => this.mods.scene.idle?.(this.ctx.scene), 'scene.idle'); if (typeof stopScene === 'function') m.track(stopScene);
    }
    if (!this._interactOn) {
      this._interactOn = true;
      const stop = this._safe(() => this.mods.interaction.interact?.(this.ctx.interaction), 'interaction'); if (typeof stop === 'function') m.track(stop);
    }
    m.camera.startIdle();
    this.bus.emit('interaction:enabled');
  }

  _leaveHero() {
    this.hint.classList.remove('is-on');
    this.m.stage.card.hit.disabled = true;
    this.m.camera.stopIdle();
  }

  /** Viewer opened the card (tap / click / Enter). This is the gesture that unlocks audio. */
  openInvitation() {
    const m = this.m;
    if (m.flow.kind(m.flow.state) !== 'hero') return;
    this.audio.unlock(); this.audio.startAmbient(); this._syncSoundBtn();
    this.audio.emit('transition');
    this.bus.emit('card:open');
    m.flow.advanceFrom('hero');
  }

  async _opening() {
    const m = this.m;
    this._leaveHero();
    m.stage.root.classList.add('is-open');
    const first = m.flow.pageIds[0];
    m.camera.toPages(m.tl(), 0, 1.1);
    await m.pages.open(first);
    m.flow.notePage(first);
  }

  async backToCard() {
    const m = this.m;
    m.stage.root.classList.remove('is-open');
    const tl = m.tl();
    m.camera.toRest(tl, 0.1, 1);
    await Promise.all([m.pages.close(), tl]);
    const i = m.flow.states.indexOf('hero');
    if (i >= 0) { m.flow.i = i; m.flow.state = 'hero'; m.stage.setState('hero'); this.bus.emit('state:change', { state: 'hero', kind: 'hero', index: i }); this._hero(); }
  }

  async submitRSVP(response) {
    const res = await this.rsvp.submit(response);
    if (!res.ok) return res;
    this.lastResponse = response;
    this.audio.emit(response.attending ? 'rsvp-success' : 'rsvp-decline');
    this.bus.emit('rsvp:success', { response, result: res });
    const m = this.m;
    const at = m.flow.states.indexOf('rsvp');
    await m.flow.enter(at + 1);
    return res;
  }

  async _finale() {
    const m = this.m;
    m.stage.root.classList.remove('is-open');
    m.stage.root.classList.add('is-finale');
    this.hint.classList.remove('is-on');
    this.audio.duck(0.5, 3);
    const tl = m.tl();
    if (m.pages.isOpen) m.pages.close({ keepCamera: true });
    this._safe(() => this.mods.finale.enter?.(this.ctx.finale, tl, { response: this.lastResponse }), 'finale.enter');
    tl.call(() => this.audio.emit('finale'), [], tl.labels.finale ?? Math.max(0, tl.duration() - 1.2));
    await tl;
  }

  _thankYou() {
    const m = this.m;
    m.stage.finale.setAttribute('aria-hidden', 'false');
    const r = this.lastResponse;
    const declined = r && !r.attending;
    const { L } = m;
    const custom = this._safe(() => this.mods.finale.thankYou?.(this.ctx.finale, { response: r }), 'finale.thankYou');
    const replay = h('button', { class: 'xp-thanks__replay', type: 'button' }, h('span', { html: icons.replay }), h('span', L.lang(L.primary), L.t('replay')), L.secondary && h('small', L.lang(L.secondary), L.ts('replay')));
    replay.addEventListener('click', () => this.restart());
    const panel = custom || h('div', { class: 'xp-thanks' },
      h('h2', { class: 'xp-thanks__title', ...L.lang(L.primary) }, L.t(declined ? 'missed' : 'thanks')),
      L.secondary && h('p', { class: 'xp-thanks__title-s', ...L.lang(L.secondary) }, L.ts(declined ? 'missed' : 'thanks')),
      h('p', { class: 'xp-thanks__body', ...L.lang(L.primary) }, L.t(declined ? 'missedBody' : 'thanksBody')),
      L.secondary && h('p', { class: 'xp-thanks__body-s', ...L.lang(L.secondary) }, L.ts(declined ? 'missedBody' : 'thanksBody')),
      r && h('p', { class: 'xp-thanks__who', dir: 'auto' }, r.attending ? `${r.name} · ${r.guests}` : r.name));
    panel.append(replay);
    m.stage.finale.replaceChildren(panel);
    const tl = m.tl();
    tl.fromTo([...panel.children], { opacity: 0, y: 14, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: 'editorial', stagger: 0.12 }, 0.1);
    this.bus.emit('finale:done', { response: r });
  }

  // ------------------------------------------------------------------ teardown
  _teardown() {
    if (!this.m) return;
    const m = this.m;
    for (const t of this._timelines) t.kill?.();
    this._timelines.clear();
    const mods = this.mods || {};
    for (const [k, def] of Object.entries(mods)) { if (k !== 'audio') this._safe(() => def.destroy?.(this.ctx?.[k] || m), `${k}.destroy`); }
    [...this._disposers].reverse().forEach((fn) => this._safe(fn, 'dispose'));
    m.camera?.destroy(); m.fx?.destroy(); m.pages?.destroy();
    this.audio?.stopAmbient(0.6);
    for (const v of [...this.assets.videos]) if (m.stage.root.contains(v)) this.assets.releaseVideo(v);
    m.stage.destroy();
    this._idleOn = false; this._interactOn = false; this.lastResponse = null;
    this.bus.emit('engine:destroy');
    this.m = null;
  }

  destroy() { this._teardown(); this.audio?.destroy(); this.assets?.destroy(); this.bus.clear(); }
}
