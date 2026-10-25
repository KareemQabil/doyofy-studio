// Scene building blocks: declarative layer insertion + responsive placement helpers.
import { html } from '../engine/dom.js';

/** Insert markup into a depth layer and return the element. */
export function put(m, layer, markup) {
  const el = typeof markup === 'string' ? html(markup) : markup;
  m.stage.layers[layer].append(el);
  return el;
}

/** Card-shadow lighting model for the scene (direction, softness, colour). */
export function shadow(m, { x = 0.04, y = 0.03, blur = 22, opacity = 0.32, color = '40,24,12', contact = 0.35 } = {}) {
  const s = m.stage.root.style;
  s.setProperty('--sh-x', String(x)); s.setProperty('--sh-y', String(y)); s.setProperty('--sh-blur', `${blur}px`);
  s.setProperty('--sh-op', String(opacity)); s.setProperty('--sh-color', color); s.setProperty('--ct-op', String(contact));
}

/** Position an element in viewport pixels from a fit-relative rect. */
export function place(el, { x, y, w, h }) {
  Object.assign(el.style, { left: `${Math.round(x)}px`, top: `${Math.round(y)}px`, width: `${Math.round(w)}px`, ...(h != null ? { height: `${Math.round(h)}px` } : {}) });
}

export const pct = (v) => `${v}%`;
