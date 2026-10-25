/**
 * FlowEngine — configuration-driven experience states.
 *
 *   flow: ['intro', 'hero', 'opening', 'invitation', 'date', 'program', 'venue', 'rsvp', 'finale', 'thankYou']
 *   flow: ['hero', 'gallery', 'invitation', 'venue', 'finale']
 *
 * State kinds:
 *   intro      – scene establishes, reveal plays (auto-advances)
 *   hero       – card at rest, interaction on, waits for "open"
 *   opening    – card → pages transition (auto)
 *   page       – any registered page id (invitation, details, date, program, venue, gallery, rsvp)
 *   finale     – finale module (aliases: packing, seal)
 *   thankYou   – closing screen with replay
 * States not present in a preset are simply skipped; unavailable pages (e.g. gallery with
 * no photos) are dropped automatically.
 */
import { PageRegistry } from './registries.js';

const ALIASES = { packing: 'finale', seal: 'finale', details: 'details' };

export class FlowEngine {
  constructor(m, states) {
    this.m = m;
    const norm = [];
    for (const s of states) {
      const k = ALIASES[s] || s;
      if (k === 'finale' && norm.includes('finale')) continue;
      if (PageRegistry.has(k) && !(PageRegistry.get(k).available?.(m.content) ?? true)) continue;
      norm.push(k);
    }
    this.states = norm;
    this.pageIds = norm.filter((s) => PageRegistry.has(s));
    this.i = -1;
    this.state = null;
  }

  kind(s) { return PageRegistry.has(s) ? 'page' : s; }
  has(s) { return this.states.includes(s); }
  hasAfterPages() { const last = this.states.lastIndexOf(this.pageIds[this.pageIds.length - 1]); return this.states.slice(last + 1).length > 0; }

  async start() { await this.enter(0); }

  async enter(i) {
    if (i >= this.states.length) return;
    this.i = i; this.state = this.states[i];
    const kind = this.kind(this.state);
    this.m.stage.setState(kind === 'page' ? 'pages' : kind);
    this.m.bus.emit('state:change', { state: this.state, kind, index: i });
    await this.m.engine.runState(this.state, kind);
  }

  next() { return this.enter(this.i + 1); }

  /** Jump to the next state of a kind (e.g. from the hero to the first page). */
  async advanceFrom(kind) {
    const j = this.states.findIndex((s, k) => k > this.i && this.kind(s) !== kind);
    if (j >= 0) await this.enter(j);
  }

  /** Called by the page engine when the viewer moves between pages. */
  notePage(id) { const j = this.states.indexOf(id); if (j >= 0) { this.i = j; this.state = id; this.m.bus.emit('state:change', { state: id, kind: 'page', index: j }); } }

  /** Viewer pressed "next" on the last page (no RSVP in this flow). */
  afterPages() {
    const last = this.states.lastIndexOf(this.pageIds[this.pageIds.length - 1]);
    return this.enter(last + 1);
  }

  backToCard() { return this.m.engine.backToCard(); }
}
