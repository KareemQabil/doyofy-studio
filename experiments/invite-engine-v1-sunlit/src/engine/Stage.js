/**
 * Stage — the layered DOM every experience renders into.
 *
 *  .xp                               root (dir, state classes, parallax vars --px/--py)
 *   .xp-viewport                     clipping frame (the "screen")
 *     .xp-camera                     camera rig (CameraEngine transforms this)
 *       far · background · mid · subject · card · foreground · lighting   (depth layers)
 *     .xp-fx                         canvas + DOM effects (own parallax depth)
 *     overlay                        film/grain/vignette + reveal overlays (fabric, curtains…)
 *   .xp-pages                        storytelling pages (sheet)
 *   .xp-finale                       finale / thank-you surface
 *   .xp-ui                           controls (sound, replay, hint)
 *
 * The card lives in the card layer inside a chain of single-purpose wrappers so that
 * interaction, idle motion, reveal and opening never fight over one transform:
 *   anchor(fit box) › tilt › idle › reveal › flip › scale(design size) › faces
 */
import { h } from './dom.js';
import { fitCard } from './fit.js';

export const DEPTHS = { far: 0.06, background: 0.14, mid: 0.32, subject: 0.5, card: 0.55, foreground: 1.25, lighting: 0.2, fx: 0.8, overlay: 0 };

export class Stage {
  constructor(host, { dir = 'rtl' } = {}) {
    this.host = host;
    this.layers = {};
    this.root = h('div', { class: 'xp', dir, 'data-state': 'boot' });
    this.viewport = h('div', { class: 'xp-viewport' });
    this.camera = h('div', { class: 'xp-camera' });
    for (const name of ['far', 'background', 'mid', 'subject', 'card', 'foreground', 'lighting']) {
      this.layers[name] = h('div', { class: `xp-layer xp-layer--${name}`, 'data-layer': name, style: `--d:${DEPTHS[name]}` });
      this.camera.append(this.layers[name]);
    }
    this.layers.fx = h('div', { class: 'xp-layer xp-layer--fx', 'data-layer': 'fx', style: `--d:${DEPTHS.fx}` });
    this.layers.overlay = h('div', { class: 'xp-layer xp-layer--overlay', 'data-layer': 'overlay', style: '--d:0' });

    // card rig
    this.card = {};
    const c = this.card;
    c.decorBack = h('div', { class: 'xp-decor xp-decor--back' });
    c.shadow = h('div', { class: 'xp-card-shadow' });
    c.anchor = h('div', { class: 'xp-card-anchor' });
    c.tilt = h('div', { class: 'xp-card-tilt' });
    c.idle = h('div', { class: 'xp-card-idle' });
    c.reveal = h('div', { class: 'xp-card-reveal' });
    c.flip = h('div', { class: 'xp-card-flip' });
    c.scale = h('div', { class: 'xp-card-scale' });
    c.front = h('div', { class: 'xp-face xp-face--front' });
    c.back = h('div', { class: 'xp-face xp-face--back' });
    c.hit = h('button', { class: 'xp-card-hit', type: 'button' });
    c.decorFront = h('div', { class: 'xp-decor xp-decor--front' });
    c.scale.append(c.front, c.back);
    c.flip.append(c.scale);
    c.reveal.append(c.flip);
    c.idle.append(c.reveal);
    c.tilt.append(c.idle, c.hit);
    c.anchor.append(c.tilt);
    this.layers.card.append(c.decorBack, c.shadow, c.anchor, c.decorFront);

    this.viewport.append(this.camera, this.layers.fx, this.layers.overlay);
    this.pages = h('div', { class: 'xp-pages', 'aria-hidden': 'true' });
    this.finale = h('div', { class: 'xp-finale', 'aria-hidden': 'true' });
    this.ui = h('div', { class: 'xp-ui' });
    this.root.append(this.viewport, this.pages, this.finale, this.ui);
    host.append(this.root);
    this.design = { w: 300, h: 420 };
    this.fit = null;
  }

  setCardDesign({ w, h: hh }) { this.design = { w, h: hh }; }

  /** Compute the responsive card box from the real viewport and write it to the DOM. */
  layout() {
    const vw = this.viewport.clientWidth || this.root.clientWidth;
    const vh = this.viewport.clientHeight || this.root.clientHeight;
    const aspect = this.design.w / this.design.h;
    const f = fitCard({ vw, vh, aspect });
    this.fit = f;
    const s = f.w / this.design.w;
    const box = { left: `${f.x}px`, top: `${f.y}px`, width: `${f.w}px`, height: `${f.h}px` };
    for (const el of [this.card.anchor, this.card.decorBack, this.card.decorFront]) Object.assign(el.style, box);
    Object.assign(this.card.shadow.style, box);
    Object.assign(this.card.scale.style, { width: `${this.design.w}px`, height: `${this.design.h}px`, transform: `scale(${s})` });
    const st = this.root.style;
    st.setProperty('--card-w', `${f.w}px`); st.setProperty('--card-h', `${f.h}px`);
    st.setProperty('--card-x', `${f.x}px`); st.setProperty('--card-y', `${f.y}px`);
    st.setProperty('--card-cx', `${f.x + f.w / 2}px`); st.setProperty('--card-cy', `${f.y + f.h / 2}px`);
    st.setProperty('--vw', `${vw}px`); st.setProperty('--vh', `${vh}px`);
    st.setProperty('--card-scale', String(s));
    this.camera.style.transformOrigin = `${f.x + f.w / 2}px ${f.y + f.h / 2}px`;
    this.root.classList.toggle('is-compact', f.mobile);
    this.root.classList.toggle('is-wide', vw / vh > 1.9);
    return f;
  }

  setState(name) { this.root.dataset.state = name; }
  clear() { for (const l of Object.values(this.layers)) if (l !== this.layers.card) l.replaceChildren(); }
  destroy() { this.root.remove(); }
}
