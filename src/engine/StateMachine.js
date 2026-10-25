/**
 * The canonical Studio state machine (Studio.dc.html), as data.
 *
 *   intro ──4.7 s──▶ card ──open──▶ opening ──0.95 s──▶ pages ──close──▶ card
 *                                                          └─submit─▶ pack ─1.75 s▶ seal ─1.75 s▶ fly ─1.45 s▶ done
 *   any ──replay──▶ intro
 *
 * Timers are owned here so replay/teardown cancels every pending transition. Durations come from
 * the active reveal (intro) and finale (pack/seal/fly) modules; these defaults are the canonical ones.
 */
export const CANONICAL_TIMING = { intro: 4700, opening: 950, pack: 1750, seal: 1750, fly: 1450, pageLeave: 340 };

export const TRANSITIONS = {
  intro: { auto: 'card' },
  card: { open: 'opening', replay: 'intro' },
  opening: { auto: 'pages', replay: 'intro' },
  pages: { close: 'card', submit: 'pack', replay: 'intro' },
  pack: { auto: 'seal', replay: 'intro' },
  seal: { auto: 'fly', replay: 'intro' },
  fly: { auto: 'done', replay: 'intro' },
  done: { replay: 'intro' },
};

export class StateMachine {
  constructor({ timing = {}, onEnter } = {}) {
    this.timing = { ...CANONICAL_TIMING, ...timing };
    this.onEnter = onEnter;
    this.state = null;
    this.timer = null;
    this.history = [];
  }
  start(state = 'intro') { this._enter(state); }
  can(event) { return !!TRANSITIONS[this.state]?.[event]; }
  send(event) {
    const to = TRANSITIONS[this.state]?.[event];
    if (!to) return false;
    this._enter(to, event);
    return true;
  }
  _enter(state, via = 'start') {
    clearTimeout(this.timer);
    const from = this.state;
    this.state = state;
    this.history.push({ state, via, t: Math.round(performance.now()) });
    this.onEnter?.(state, from, via);
    const next = TRANSITIONS[state]?.auto;
    if (next && this.timing[state] != null) this.timer = setTimeout(() => this.state === state && this._enter(next, 'auto'), this.timing[state]);
  }
  /** jump straight to a state (preview / deep link: ?start=card|pages|rsvp|done) */
  jump(state) { this._enter(state, 'jump'); }
  destroy() { clearTimeout(this.timer); }
}
