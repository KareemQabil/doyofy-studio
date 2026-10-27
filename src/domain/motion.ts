/**
 * Motion physics, kept pure so release behaviour is unit-testable.
 * A damped spring carries the finger's release velocity into the settle, so a flick feels thrown and a
 * slow drag feels placed — the cubic ease used before always started from zero speed.
 */
export interface SpringConfig { stiffness: number; damping: number; mass: number }
export interface SpringState { x: number; v: number }

/** tuned presets: `snap` for decks/rows (≈260–380ms), `soft` for sheets, `stiff` for small chips */
export const SPRING = {
  snap: { stiffness: 380, damping: 34, mass: 1 },
  soft: { stiffness: 240, damping: 30, mass: 1 },
  stiff: { stiffness: 620, damping: 44, mass: 1 },
} satisfies Record<string, SpringConfig>;

/** one semi-implicit Euler step; dt in seconds, units are whatever x is measured in */
export function springStep(s: SpringState, to: number, dt: number, c: SpringConfig): SpringState {
  const force = -c.stiffness * (s.x - to) - c.damping * s.v;
  const v = s.v + (force / c.mass) * dt;
  return { x: s.x + v * dt, v };
}

/** settled once both the distance and the speed are imperceptible for the unit in use */
export function springSettled(s: SpringState, to: number, precision = 0.5): boolean {
  return Math.abs(s.x - to) < precision && Math.abs(s.v) < precision * 4;
}

/** simulate to rest; used by tests and to budget durations (never more than `maxMs`) */
export function springDuration(from: number, to: number, v0: number, c: SpringConfig, precision = 0.5, maxMs = 2000): number {
  let s: SpringState = { x: from, v: v0 }, t = 0;
  const dt = 1 / 120;
  while (t * 1000 < maxMs && !springSettled(s, to, precision)) { s = springStep(s, to, dt, c); t += dt; }
  return Math.round(t * 1000);
}

/** rubber band beyond a bound: the further you pull, the less it moves (iOS-like, never infinite) */
export function rubberBand(over: number, dimension: number, k = 0.55): number {
  const sign = Math.sign(over), a = Math.abs(over);
  return sign * (1 - 1 / ((a * k) / Math.max(1, dimension) + 1)) * dimension;
}

/* ------------------------------------------------------------------ swipe-to-reveal rows
 * A row's content can be dragged sideways to reveal an action tray. Positions are signed px of the
 * content's translateX. In RTL a finger moving left (dx < 0) uncovers the tray on the right (inline-start). */
export type RevealSide = 'start' | 'end';
export type RevealOutcome = { open: RevealSide | null; commit: RevealSide | null };

/** where a released row settles: open the tray, close it, or commit the side's primary action on a long swipe */
export function revealRelease(x: number, velocity: number, tray: number, width: number, sides: { start: boolean; end: boolean }): RevealOutcome {
  // dx < 0 moves content left → exposes the start (right-hand, RTL) tray
  const side: RevealSide | null = x < 0 ? (sides.start ? 'start' : null) : x > 0 ? (sides.end ? 'end' : null) : null;
  if (!side) return { open: null, commit: null };
  const a = Math.abs(x), flick = Math.abs(velocity) >= 0.55 && Math.sign(velocity) === Math.sign(x);
  if (a >= width * 0.58) return { open: null, commit: side };
  if (a >= tray * 0.5 || (flick && a >= 24)) return { open: side, commit: null };
  return { open: null, commit: null };
}
