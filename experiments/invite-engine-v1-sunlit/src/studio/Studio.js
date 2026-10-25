/**
 * Studio — internal authoring panel. Minimised to a single pill by default so it never
 * competes with the invitation. Every layer can be switched; each option shows how well
 * it fits the rest of the current combination (CompatibilityEngine), weak/invalid
 * options can be hidden, and "Random" builds a coherent combination.
 */
import { h, icons } from '../engine/dom.js';
import { registries, PresetRegistry, CardRegistry } from '../engine/registries.js';

const SLOTS = [
  { key: 'card', label: 'Card', reg: 'card', path: ['card', 'template'] },
  { key: 'scene', label: 'World', reg: 'scene', path: ['environment', 'id'] },
  { key: 'reveal', label: 'Reveal', reg: 'reveal', path: ['reveal', 'id'] },
  { key: 'motion', label: 'Idle motion', reg: 'motion', path: ['motion', 'idle'] },
  { key: 'interaction', label: 'Interaction', reg: 'interaction', path: ['motion', 'interaction'] },
  { key: 'transition', label: 'Page transition', reg: 'transition', path: ['motion', 'pageTransition'] },
  { key: 'camera', label: 'Camera', reg: 'camera', path: ['camera', 'preset'] },
  { key: 'fx', label: 'FX', reg: 'fxpack', path: ['fx', 'pack'] },
  { key: 'audio', label: 'Audio', reg: 'audio', path: ['audio', 'pack'] },
  { key: 'finale', label: 'Finale', reg: 'finale', path: ['finale', 'type'] },
];
const BADGE = { great: '●', good: '○', weak: '△', invalid: '✕' };
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } } };

export class Studio {
  constructor(engine, app) {
    this.engine = engine; this.app = app;
    this.open = store.get('studio:open', false);
    this.hideWeak = store.get('studio:hideWeak', false);
    this.device = store.get('studio:device', 'auto');
    this.el = h('aside', { class: 'studio', 'aria-label': 'Invitation studio', dir: 'ltr' });
    app.append(this.el);
    this.applyDevice();
    engine.on('engine:ready', () => this.render());
    engine.on('state:change', ({ state }) => { const s = this.el.querySelector('.studio__state'); if (s) s.textContent = state; });
    this.render();
  }

  combo() {
    const c = this.engine.config || {};
    const out = {};
    for (const s of SLOTS) out[s.key] = s.path.reduce((o, k) => o?.[k], c);
    return out;
  }

  patch(slot, value) {
    const [a, b] = SLOTS.find((s) => s.key === slot).path;
    const extra = slot === 'card' ? { variant: undefined } : {};
    return this.engine.update({ preset: undefined, [a]: { ...this.engine.config[a], [b]: value, ...extra } });
  }

  toggle(v = !this.open) { this.open = v; store.set('studio:open', v); this.render(); }

  applyDevice() {
    this.app.dataset.device = this.device;
    // the stage is observed by a ResizeObserver, so the engine re-fits automatically
  }

  render() {
    const E = this.engine;
    if (!E.config) return;
    const combo = this.combo();
    const score = E.compat.score(combo, { quality: E.m?.quality });
    this.el.classList.toggle('is-open', this.open);
    const pill = h('button', { class: 'studio__pill', type: 'button', 'aria-expanded': String(this.open), onclick: () => this.toggle() },
      h('span', { html: icons.sliders }), h('span', {}, 'Studio'), h('span', { class: `studio__dot is-${score.verdict}`, title: `Compatibility ${score.score}` }));
    if (!this.open) { this.el.replaceChildren(pill); return; }

    const presetSel = h('select', { id: 'studio-preset', class: 'studio__select', onchange: (e) => e.target.value && E.load({ preset: e.target.value }) },
      h('option', { value: '' }, E.config.preset ? '— custom —' : '— custom combination —'),
      PresetRegistry.list().map((p) => h('option', { value: p.id, selected: p.id === E.config.preset }, p.meta.title)));

    const rows = SLOTS.map((s) => {
      const ranked = E.compat.rank(s.key === 'scene' ? 'scene' : s.key, combo);
      const opts = ranked.filter((r) => !this.hideWeak || r.id === combo[s.key] || (r.verdict !== 'weak' && r.verdict !== 'invalid'));
      const sel = h('select', { id: `studio-${s.key}`, class: 'studio__select', onchange: (e) => this.patch(s.key, e.target.value) },
        opts.map((r) => h('option', { value: r.id, selected: r.id === combo[s.key], disabled: r.verdict === 'invalid' && r.id !== combo[s.key] }, `${BADGE[r.verdict]} ${r.mod.meta.title}${r.mod.renderMode && ['webgl', 'three', 'hybrid', 'video'].includes(r.mod.renderMode) ? ` · ${r.mod.renderMode}` : ''}`)));
      const row = h('div', { class: 'studio__row' }, h('label', { for: `studio-${s.key}` }, s.label), sel);
      if (s.key === 'card') {
        const variants = CardRegistry.get(combo.card)?.meta?.pack?.variants;
        if (variants) row.append(h('select', { id: 'studio-variant', class: 'studio__select studio__select--sub', 'aria-label': 'Card variant', onchange: (e) => E.update({ card: { ...E.config.card, variant: e.target.value } }) },
          Object.keys(variants).map((v) => h('option', { value: v, selected: v === (E.config.card.variant || 'ivory_olive') }, v.replace(/_/g, ' ')))));
      }
      if (s.key === 'fx') {
        const range = h('input', { id: 'studio-fx-intensity', type: 'range', min: '0', max: '1', step: '0.05', value: String(E.config.fx.intensity ?? 0.5), 'aria-label': 'FX intensity' });
        range.addEventListener('change', () => E.update({ fx: { ...E.config.fx, intensity: Number(range.value) } }));
        row.append(range);
      }
      return row;
    });

    const toggle = (id, label, on, fn) => h('label', { class: 'studio__toggle', for: id }, h('input', { id, type: 'checkbox', checked: on, onchange: (e) => fn(e.target.checked) }), h('span', {}, label));
    const btn = (label, icon, fn, title) => h('button', { class: 'studio__btn', type: 'button', title: title || label, onclick: fn }, h('span', { html: icons[icon] }), h('span', {}, label));
    const status = h('p', { class: 'studio__status', role: 'status' });
    const json = () => JSON.stringify(E.getConfig(), null, 2);

    const panel = h('div', { class: 'studio__panel' },
      h('header', { class: 'studio__head' }, h('strong', {}, 'Studio'), h('span', { class: 'studio__state', title: 'Current state' }, E.m?.flow?.state || ''),
        h('button', { class: 'studio__close', type: 'button', 'aria-label': 'Minimise studio', html: icons.close, onclick: () => this.toggle(false) })),
      h('div', { class: 'studio__row' }, h('label', { for: 'studio-preset' }, 'Preset'), presetSel),
      h('div', { class: `studio__score is-${score.verdict}` },
        h('div', { class: 'studio__meter' }, h('span', { style: `width:${score.score}%` })),
        h('span', { class: 'studio__verdict' }, `${score.verdict} · ${score.score}`),
        score.reasons.length ? h('ul', { class: 'studio__reasons' }, score.reasons.map((r) => h('li', {}, r))) : null),
      h('div', { class: 'studio__grid' }, rows),
      h('div', { class: 'studio__toggles' },
        toggle('studio-hide', 'Hide weak combos', this.hideWeak, (v) => { this.hideWeak = v; store.set('studio:hideWeak', v); this.render(); }),
        toggle('studio-reduced', 'Reduced motion', !!E.m?.quality.reducedMotion, (v) => E.setReducedMotion(v)),
        toggle('studio-mute', 'Mute', !!E.overrides.muted, (v) => E.setMuted(v))),
      h('div', { class: 'studio__devices', role: 'group', 'aria-label': 'Preview device' },
        ['auto', 'mobile', 'desktop'].map((d) => h('button', { type: 'button', class: 'studio__seg', 'aria-pressed': String(this.device === d), onclick: () => { this.device = d; store.set('studio:device', d); this.applyDevice(); this.render(); } },
          h('span', { html: d === 'mobile' ? icons.phone : icons.desktop }), h('span', {}, d)))),
      h('div', { class: 'studio__actions' },
        btn('Restart', 'replay', () => E.restart()),
        btn('Random', 'dice', () => { const c = E.compat.randomCompatible(); E.load(this.toConfig(c)); }, 'Random compatible combination'),
        btn('Copy JSON', 'copy', async () => { try { await navigator.clipboard.writeText(json()); status.textContent = 'Config copied.'; } catch { this.showJSON(json()); status.textContent = 'Clipboard blocked — select the JSON below.'; } }),
        btn('Save JSON', 'save', () => { this.download(json()); store.set('studio:saved', E.getConfig()); this.showJSON(json()); status.textContent = 'Saved in this browser and shown below.'; })),
      status,
      h('div', { class: 'studio__json', hidden: true }));
    this.el.replaceChildren(pill, panel);
  }

  toConfig(c) {
    const base = this.engine.config;
    return { content: base.content, flow: base.flow, card: { template: c.card }, environment: { id: c.scene }, reveal: { id: c.reveal },
      motion: { idle: c.motion, interaction: c.interaction, pageTransition: c.transition }, camera: { preset: c.camera },
      fx: { pack: c.fx, intensity: base.fx.intensity }, audio: { pack: c.audio, enabled: true }, finale: { type: c.finale } };
  }

  download(text) {
    try {
      const a = h('a', { href: URL.createObjectURL(new Blob([text], { type: 'application/json' })), download: `invitation-${Date.now()}.json` });
      document.body.append(a); a.click(); a.remove();
    } catch { /* sandboxed viewers block downloads; the JSON panel is the fallback */ }
  }

  showJSON(text) {
    const box = this.el.querySelector('.studio__json'); if (!box) return;
    box.hidden = false;
    const ta = h('textarea', { id: 'studio-json', readonly: true, rows: '10', 'aria-label': 'Current configuration JSON' }, text);
    box.replaceChildren(ta);
    ta.focus(); ta.select();
  }
}
