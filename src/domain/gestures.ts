/** Intent thresholds in CSS pixels. Vertical scrolling must win over a horizontal swipe. */
export type GestureAxis = 'x' | 'y';
export function lockAxis(dx: number, dy: number, wanted: GestureAxis): 'pending' | 'locked' | 'rejected' {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 10) return 'pending';
  const along = Math.abs(wanted === 'x' ? dx : dy), across = Math.abs(wanted === 'x' ? dy : dx);
  if (across > along) return 'rejected';
  return along > across * 1.25 ? 'locked' : 'pending';
}
export function swipeStep(dx: number, dy: number, duration: number): -1 | 0 | 1 {
  if (lockAxis(dx,dy,'x') !== 'locked') return 0;
  const speed = Math.abs(dx) / Math.max(duration,16);
  // RTL: what is under the finger follows it, so a swipe to the RIGHT brings the next page in from the left
  return Math.abs(dx) >= 64 || (Math.abs(dx) >= 28 && speed >= .5) ? (dx > 0 ? 1 : -1) : 0;
}
/** touches that start in the system edge zones belong to the OS (back/forward swipe), not to our surfaces (FX-09) */
export const EDGE_ZONE = 24;
export function startsAtScreenEdge(x: number, viewportWidth: number, zone = EDGE_ZONE): boolean {
  return x < zone || x > viewportWidth - zone;
}
export function sheetSnap(dy: number, velocity: number, current: 'half' | 'full'): 'half' | 'full' {
  return Math.abs(dy) >= 48 || (Math.abs(dy) >= 20 && Math.abs(velocity) >= .5) ? dy < 0 ? 'full' : 'half' : current;
}
export function shouldDismiss(dy: number, velocity: number): boolean {
  return dy >= 100 || (dy >= 36 && velocity >= .65);
}

/* ------------------------------------------------------------------ tactile deck (Signature)
 * A deck position is a float: 0 = first card centred, n-1 = last. In RTL reading order the next
 * card lies to the LEFT. The card under the finger moves with the finger, so dragging RIGHT (dx > 0)
 * pulls the next card in from the left: pos = start + dx / step.
 * These are pure so drag, edge resistance, momentum and cancellation are unit-testable. */
export interface DeckRelease { target: number; projected: number }
/** live position while dragging; beyond the first/last card the motion meets rubber-band resistance */
export function deckDragPosition(start: number, dx: number, step: number, count: number): number {
  const raw = start + dx / Math.max(1, step);
  const max = Math.max(0, count - 1);
  if (raw < 0) return raw * 0.28;
  if (raw > max) return max + (raw - max) * 0.28;
  return raw;
}
/** a fling faster than this (px/ms) may travel two cards; anything slower settles on the neighbour */
export const DECK_FAST_FLING = 1.2;
/** where a released deck settles: velocity (px/ms, signed like dx) projects ahead, then snaps.
 *  A normal swipe moves exactly one card; only a fast fling may move two (FX-05). */
export function deckRelease(pos: number, velocity: number, step: number, count: number, from: number, maxJump = 2): DeckRelease {
  const projected = pos + (velocity * 220) / Math.max(1, step);
  let target = Math.round(projected);
  // a deliberate small drag past ~22% of a card still counts as a step
  if (target === from && Math.abs(pos - from) > 0.22) target = from + Math.sign(pos - from);
  const jump = Math.abs(velocity) > DECK_FAST_FLING ? maxJump : 1;
  target = Math.max(from - jump, Math.min(from + jump, target));
  return { target: Math.max(0, Math.min(count - 1, target)), projected };
}
/** visual pose of a card at `offset` cards from the centre (negative = previous, to the right in RTL) */
export function deckPose(offset: number, spacing: number) {
  const a = Math.abs(offset);
  const clamped = Math.min(a, 3);
  return {
    x: -offset * spacing * (1 - Math.min(a, 2.2) * 0.08), // RTL: next cards sit to the left
    scale: 1 - Math.min(clamped, 2.5) * 0.11,
    rotate: Math.max(-10, Math.min(10, offset * 4.5)),
    lift: Math.max(0, 1 - a) * -10,
    opacity: a > 2.6 ? 0 : 1 - Math.max(0, a - 1.6) * 0.9,
    z: 100 - Math.round(a * 10),
  };
}
/** sheet snap points (phone editor): fraction of viewport height the sheet occupies */
export type SheetPoint = 'peek' | 'half' | 'full';
export const SHEET_HEIGHT: Record<SheetPoint, number> = { peek: 0.22, half: 0.56, full: 0.92 };
export function sheetSnapPoint(fraction: number, velocityY: number, current: SheetPoint): SheetPoint {
  const order: SheetPoint[] = ['peek', 'half', 'full'];
  // a fling (px/ms; negative = upward) moves one stop in its direction
  if (Math.abs(velocityY) >= 0.55) {
    const i = order.indexOf(current) + (velocityY < 0 ? 1 : -1);
    return order[Math.max(0, Math.min(2, i))]!;
  }
  return order.reduce((best, p) => Math.abs(SHEET_HEIGHT[p] - fraction) < Math.abs(SHEET_HEIGHT[best] - fraction) ? p : best, current);
}
/** Snap against the rendered editor stops, including the bar, dock and keyboard viewport. */
export function sheetSnapHeight(height: number, velocityY: number, current: SheetPoint, stops: Record<SheetPoint, number>): SheetPoint {
  const order: SheetPoint[] = ['peek', 'half', 'full'];
  if (Math.abs(velocityY) >= 0.55) {
    return order[Math.max(0, Math.min(2, order.indexOf(current) + (velocityY < 0 ? 1 : -1)))]!;
  }
  return order.reduce((best, point) => Math.abs(stops[point] - height) < Math.abs(stops[best] - height) ? point : best, current);
}
/** the invitation seal: lifting it far enough (or a quick flick up) opens the invitation */
export function sealOpens(dy: number, velocityY: number, travel: number): boolean {
  return -dy >= travel * 0.55 || (-dy >= travel * 0.2 && velocityY <= -0.6);
}
