/**
 * Minimal pub/sub. Every layer talks through the bus instead of calling each other:
 *   bus.emit('page:change', { from, to })   →  audio, analytics, studio… react independently.
 */
export class EventBus {
  constructor() { this.map = new Map(); }

  on(type, fn) {
    if (!this.map.has(type)) this.map.set(type, new Set());
    this.map.get(type).add(fn);
    return () => this.off(type, fn);
  }

  once(type, fn) {
    const off = this.on(type, (p) => { off(); fn(p); });
    return off;
  }

  off(type, fn) { this.map.get(type)?.delete(fn); }

  emit(type, payload) {
    for (const fn of [...(this.map.get(type) || [])]) {
      try { fn(payload); } catch (e) { console.error(`[bus] handler for "${type}" failed`, e); }
    }
    for (const fn of [...(this.map.get('*') || [])]) fn({ type, payload });
  }

  clear() { this.map.clear(); }
}
