/**
 * PageEngine — hosts the storytelling pages on a themed "sheet" and delegates every
 * visual change to the active page-transition module (open / change / close).
 * Navigation: buttons, dots, swipe, wheel (only when the page isn't scrolling), arrow keys.
 */
import { h, icons } from './dom.js';
import { PageRegistry } from './registries.js';

export class PageEngine {
  constructor(m, pageIds) {
    this.m = m;
    this.ids = pageIds.filter((id) => PageRegistry.has(id) && (PageRegistry.get(id).available?.(m.content) ?? true));
    this.index = -1; this.current = null; this.unmount = null; this.busy = false; this.isOpen = false;
    const { L } = m;
    this.sheet = h('section', { class: 'xp-sheet', role: 'dialog', 'aria-modal': 'false', 'aria-label': L.t('invitation'), dir: L.dir });
    this.surface = h('div', { class: 'xp-sheet__surface' });
    this.frame = h('div', { class: 'xp-sheet__frame', 'aria-hidden': 'true' });
    this.viewport = h('div', { class: 'xp-sheet__viewport', 'aria-live': 'polite' });
    this.closeBtn = h('button', { class: 'xp-sheet__close', type: 'button', 'aria-label': L.t('close'), html: icons.close });
    this.prevBtn = h('button', { class: 'xp-nav__btn', type: 'button', 'aria-label': L.t('prev'), html: L.dir === 'rtl' ? icons.prev : icons.next });
    this.nextBtn = h('button', { class: 'xp-nav__btn xp-nav__btn--next', type: 'button', 'aria-label': L.t('next'), html: L.dir === 'rtl' ? icons.next : icons.prev });
    this.dots = h('div', { class: 'xp-nav__dots' });
    this.ids.forEach((id, i) => this.dots.append(h('button', { class: 'xp-nav__dot', type: 'button', 'aria-label': `${L.t('page')} ${i + 1}: ${PageRegistry.get(id).meta.title}`, onclick: () => this.go(i) }, h('span'))));
    this.nav = h('nav', { class: 'xp-nav', 'aria-label': L.t('invitation') }, this.prevBtn, this.dots, this.nextBtn);
    this.sheet.append(this.surface, this.frame, this.closeBtn, this.viewport, this.nav);
    m.stage.pages.replaceChildren(this.sheet);

    this.closeBtn.addEventListener('click', () => m.flow.backToCard());
    this.prevBtn.addEventListener('click', () => this.go(this.index - 1));
    this.nextBtn.addEventListener('click', () => (this.index >= this.ids.length - 1 ? m.flow.afterPages() : this.go(this.index + 1)));
    this._bindGestures();
  }

  _bindGestures() {
    let sx = 0, sy = 0, t0 = 0;
    const vp = this.viewport;
    this.m.listen(vp, 'pointerdown', (e) => { sx = e.clientX; sy = e.clientY; t0 = performance.now(); });
    this.m.listen(vp, 'pointerup', (e) => {
      if (/INPUT|TEXTAREA|BUTTON|SELECT|A/.test(e.target.tagName)) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (performance.now() - t0 > 700) return;
      const rtl = this.m.L.dir === 'rtl';
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) this.go(this.index + ((dx > 0) === rtl ? 1 : -1));
      else if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) * 1.3 && !this._scrollable()) this.go(this.index + (dy < 0 ? 1 : -1));
    });
    let lastWheel = 0;
    this.m.listen(vp, 'wheel', (e) => {
      if (Math.abs(e.deltaY) < 20 || this._scrollable(e.deltaY)) return;
      const now = performance.now(); if (now - lastWheel < 900) return; lastWheel = now;
      this.go(this.index + (e.deltaY > 0 ? 1 : -1));
    }, { passive: true });
    this.m.listen(window, 'keydown', (e) => {
      if (!this.isOpen || /INPUT|TEXTAREA/.test(document.activeElement?.tagName)) return;
      const rtl = this.m.L.dir === 'rtl';
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) { e.preventDefault(); this.go(this.index + 1); }
      if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) { e.preventDefault(); this.go(this.index - 1); }
      if (e.key === 'Escape') this.m.flow.backToCard();
    });
  }

  /** True when the current page can still scroll in the gesture's direction. */
  _scrollable(dir = 0) {
    const el = this.current; if (!el) return false;
    if (el.scrollHeight <= el.clientHeight + 2) return false;
    if (dir > 0) return el.scrollTop + el.clientHeight < el.scrollHeight - 2;
    if (dir < 0) return el.scrollTop > 2;
    return true;
  }

  theme(card) {
    const p = card.palette;
    for (const s of [this.sheet.style, this.m.stage.root.style]) this._vars(s, card, p);
    this.surface.style.backgroundImage = card.sheetTexture ? `url(${this.m.assets.url(card.sheetTexture)})` : '';
    this.sheet.dataset.tone = card.tone || 'light';
    this.m.stage.root.dataset.tone = card.tone || 'light';
  }

  _vars(s, card, p) {
    s.setProperty('--paper', p.paper); s.setProperty('--ink', p.ink); s.setProperty('--muted', p.muted);
    s.setProperty('--accent', p.accent); s.setProperty('--accent-text', p.accentText || p.accent);
    s.setProperty('--f-ar-display', card.fonts?.arDisplay); s.setProperty('--f-ar', card.fonts?.ar); s.setProperty('--f-en-display', card.fonts?.enDisplay); s.setProperty('--f-en', card.fonts?.en);
    s.setProperty('--env', p.env || p.ink);
  }

  indexOf(id) { return this.ids.indexOf(id); }

  _render(i) {
    const def = PageRegistry.get(this.ids[i]);
    const el = h('div', { class: 'xp-page', 'data-page': def.id, tabindex: '-1' }, def.render(this.m));
    return { def, el };
  }

  async open(startId) {
    const i = Math.max(0, this.indexOf(startId));
    const { def, el } = this._render(i);
    this.viewport.replaceChildren(el);
    this.current = el; this.index = i; this.isOpen = true;
    this.unmount = def.mount?.(this.m, el.firstElementChild) || null;
    this.m.stage.pages.setAttribute('aria-hidden', 'false');
    this._syncNav();
    const tl = this.m.tl();
    this.m.transition.def.open?.(this.m.transition.ctx, tl, { sheet: this.sheet, page: el });
    await tl;
    el.focus({ preventScroll: true });
  }

  async go(i) {
    if (i < 0 || i >= this.ids.length) return;
    if (this.busy) { this._queued = i; return; } // remember the latest request, run it after this transition
    if (i === this.index) return;
    this.busy = true;
    const dir = i > this.index ? 1 : -1;
    const from = this.current;
    const { def, el } = this._render(i);
    this.viewport.append(el);
    this.unmount?.();
    this.unmount = def.mount?.(this.m, el.firstElementChild) || null;
    this.index = i; this.current = el;
    this._syncNav();
    this.m.audio.emit('page-change');
    this.m.bus.emit('page:change', { id: def.id, index: i, dir });
    this.m.flow.notePage(def.id);
    const tl = this.m.tl();
    this.m.transition.def.change(this.m.transition.ctx, tl, { from, to: el, dir, sheet: this.sheet });
    await tl;
    from?.remove();
    el.focus({ preventScroll: true });
    this.busy = false;
    if (this._queued != null) { const q = this._queued; this._queued = null; if (q !== this.index) this.go(q); }
  }

  goTo(id) { const i = this.indexOf(id); if (i >= 0) return this.go(i); return null; }

  _syncNav() {
    [...this.dots.children].forEach((d, k) => d.setAttribute('aria-current', k === this.index ? 'step' : 'false'));
    this.prevBtn.disabled = this.index <= 0;
    const last = this.index >= this.ids.length - 1;
    const onRsvp = this.ids[this.index] === 'rsvp';
    this.nextBtn.disabled = last && (onRsvp || !this.m.flow.hasAfterPages());
    this.sheet.dataset.page = this.ids[this.index];
  }

  async close({ keepCamera = false } = {}) {
    if (!this.isOpen) return;
    const tl = this.m.tl();
    this.unmount?.(); this.unmount = null;
    this.m.transition.def.close?.(this.m.transition.ctx, tl, { sheet: this.sheet, page: this.current, keepCamera });
    await tl;
    this.isOpen = false;
    this.m.stage.pages.setAttribute('aria-hidden', 'true');
  }

  destroy() { this.unmount?.(); this.m.stage.pages.replaceChildren(); }
}
