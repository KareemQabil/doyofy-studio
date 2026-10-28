/**
 * Phone-first gestures built on the shared pointer handler. Each one is a shortcut for a visible
 * control that does the same thing — never the only way to act.
 *   useSwipeReveal  drag a row sideways to uncover its actions; a long swipe commits the primary one
 *   useLongPress    press and hold (touch/pen) — e.g. enter selection mode; mouse uses the checkbox
 *   useScrolled     true once the page has scrolled past a threshold (compact sticky headers)
 *   useScrollHide   true while the reader scrolls down past a threshold (a phone app bar steps aside; scrolling up brings it back)
 *   mergeHandlers   combine event props of several hooks on one element
 */
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type SyntheticEvent } from 'react';
import { revealRelease, rubberBand, type RevealSide } from '../../domain/motion';
import { usePointerGesture } from './usePointerGesture';
import { haptic, springTo } from '../motion/motion';

type AnyHandler = (e: never) => void;
type Handlers = Record<string, AnyHandler | undefined>;
/** call every hook's handler for the same event name, in order */
export function mergeHandlers(...sets: Handlers[]): Record<string, (e: SyntheticEvent) => void> {
  const out: Record<string, (e: SyntheticEvent) => void> = {};
  for (const set of sets) for (const [k, fn] of Object.entries(set)) {
    if (!fn) continue;
    const prev = out[k];
    out[k] = prev ? (e) => { prev(e); (fn as (e: SyntheticEvent) => void)(e); } : fn as (e: SyntheticEvent) => void;
  }
  return out;
}

// only one row is open at a time, like native lists
let closeOpenRow: (() => void) | null = null;

export function useSwipeReveal({ start, end, tray = 96, enabled = true, onCommit }: {
  /** whether a tray exists on that side (start = right in RTL, uncovered by a leftward swipe) */
  start?: boolean; end?: boolean; tray?: number; enabled?: boolean; onCommit?: (side: RevealSide) => void;
}) {
  const content = useRef<HTMLDivElement>(null);
  const x = useRef(0), base = useRef(0), armed = useRef(false);
  const stop = useRef<() => void>(() => {});
  const [open, setOpen] = useState<RevealSide | null>(null);
  const sides = { start: !!start, end: !!end };

  const paint = useCallback((v: number) => {
    x.current = v;
    const el = content.current; if (!el) return;
    el.style.setProperty('--swipe-x', `${v.toFixed(1)}px`);
    el.style.setProperty('--swipe-p', String(Math.min(1, Math.abs(v) / tray).toFixed(3)));
    el.parentElement?.setAttribute('data-swipe', v < 0 ? 'start' : v > 0 ? 'end' : '');
  }, [tray]);

  const settle = useCallback((to: number, velocity = 0, done?: () => void) => {
    stop.current();
    stop.current = springTo(x.current, to, { velocity: velocity * 1000, onUpdate: paint, onRest: done });
  }, [paint]);

  const close = useCallback(() => { setOpen(null); settle(0); }, [settle]);

  useEffect(() => {
    if (!open) return;
    closeOpenRow?.();
    closeOpenRow = close;
    const outside = (e: PointerEvent) => { if (!content.current?.parentElement?.contains(e.target as Node)) close(); };
    document.addEventListener('pointerdown', outside, true);
    return () => { document.removeEventListener('pointerdown', outside, true); if (closeOpenRow === close) closeOpenRow = null; };
  }, [open, close]);
  useEffect(() => () => stop.current(), []);

  const gesture = usePointerGesture({
    axis: 'x', enabled: enabled && (sides.start || sides.end),
    onStart: () => { stop.current(); base.current = x.current; armed.current = false; },
    onMove: (dx) => {
      const el = content.current; if (!el) return;
      const width = el.offsetWidth || 320;
      let v = base.current + dx;
      if ((v < 0 && !sides.start) || (v > 0 && !sides.end)) v = rubberBand(v, 40);
      el.parentElement?.setAttribute('data-dragging', 'true');
      const nowArmed = Math.abs(v) >= width * 0.58 && (v < 0 ? sides.start : sides.end);
      if (nowArmed !== armed.current) { armed.current = nowArmed; el.parentElement?.toggleAttribute('data-armed', nowArmed); haptic(nowArmed ? 'select' : 'tick'); }
      paint(v);
    },
    onEnd: (g) => {
      const el = content.current;
      el?.parentElement?.removeAttribute('data-dragging');
      el?.parentElement?.removeAttribute('data-armed');
      if (g.cancelled || !g.moved) { settle(open === 'start' ? -tray : open === 'end' ? tray : 0); return; }
      const width = el?.offsetWidth || 320;
      const out = revealRelease(x.current, g.velocity, tray, width, sides);
      if (out.commit) {
        const side = out.commit;
        haptic('success');
        // commit inside the pointerup itself: opening a link (WhatsApp) needs the user's activation
        onCommit?.(side);
        settle(side === 'start' ? -width : width, g.velocity, () => { setOpen(null); settle(0); });
        return;
      }
      if (out.open) haptic('snap');
      setOpen(out.open);
      settle(out.open === 'start' ? -tray : out.open === 'end' ? tray : 0, g.velocity);
    },
  });

  return { content, gesture, open, close, openSide: (side: RevealSide) => { setOpen(side); haptic('snap'); settle(side === 'start' ? -tray : tray); } };
}

export function useLongPress(onLongPress: () => void, { ms = 460, enabled = true }: { ms?: number; enabled?: boolean } = {}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);
  const clear = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; origin.current = null; };
  useEffect(() => clear, []);
  return {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      fired.current = false;
      if (!enabled || e.pointerType === 'mouse' || e.isPrimary === false) return;
      origin.current = { x: e.clientX, y: e.clientY };
      const el = e.currentTarget;
      el.setAttribute('data-pressing', 'true');
      timer.current = setTimeout(() => { fired.current = true; el.removeAttribute('data-pressing'); haptic('select'); onLongPress(); clear(); }, ms);
    },
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
      const o = origin.current; if (!o) return;
      if (Math.hypot(e.clientX - o.x, e.clientY - o.y) > 8) { e.currentTarget.removeAttribute('data-pressing'); clear(); }
    },
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => { e.currentTarget.removeAttribute('data-pressing'); clear(); },
    onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => { e.currentTarget.removeAttribute('data-pressing'); clear(); },
    // the long press already acted; the click that follows must not also open the row
    onClickCapture: (e: React.MouseEvent<HTMLElement>) => { if (fired.current) { fired.current = false; e.preventDefault(); e.stopPropagation(); } },
    onContextMenu: (e: React.MouseEvent<HTMLElement>) => { if (fired.current || timer.current) e.preventDefault(); },
  };
}

export function useScrolled(threshold = 24): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let raf = 0;
    const read = () => { raf = 0; setScrolled(window.scrollY > threshold); };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    window.addEventListener('scroll', on, { passive: true });
    return () => { window.removeEventListener('scroll', on); cancelAnimationFrame(raf); };
  }, [threshold]);
  return scrolled;
}

export function useScrollHide(threshold = 56, slack = 6): boolean {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let raf = 0, last = window.scrollY;
    const read = () => {
      raf = 0;
      const y = window.scrollY, d = y - last;
      if (Math.abs(d) < slack) return;
      setHidden(y > threshold && d > 0);
      last = y;
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    window.addEventListener('scroll', on, { passive: true });
    return () => { window.removeEventListener('scroll', on); cancelAnimationFrame(raf); };
  }, [threshold, slack]);
  return hidden;
}
