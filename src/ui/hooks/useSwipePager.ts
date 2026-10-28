/**
 * A sideways pager (template preview, the editor's invitation pages): what is under the finger moves with it 1:1,
 * resists at the first/last item, and on release is thrown off the way it travelled while the next one slides in
 * from the other side. RTL: a swipe to the right shows the next item (domain/gestures swipeStep).
 * Spread `gesture` on the surface; put `ref`, `data-pager` and `data-enter={enter}` (plus a `key` per item) on what moves.
 */
import { useRef, useState } from 'react';
import { swipeStep } from '../../domain/gestures';
import { haptic } from '../motion/motion';
import { usePointerGesture } from './usePointerGesture';

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useSwipePager<T extends HTMLElement = HTMLDivElement>({ canStep, onStep, enabled = true }: {
  canStep: (dir: 1 | -1) => boolean; onStep: (dir: 1 | -1) => void; enabled?: boolean;
}) {
  const ref = useRef<T>(null);
  const [enter, setEnter] = useState<'' | 'from-left' | 'from-right'>('');
  const x = (v: string | null) => { const n = ref.current; if (!n) return; if (v === null) n.style.removeProperty('--pager-x'); else n.style.setProperty('--pager-x', v); };
  const gesture = usePointerGesture({
    axis: 'x', enabled,
    onStart: () => setEnter(''),
    onMove: (dx) => { ref.current?.setAttribute('data-dragging', ''); x(`${(canStep(dx > 0 ? 1 : -1) ? dx : dx * 0.18).toFixed(1)}px`); },
    onEnd: (g) => {
      ref.current?.removeAttribute('data-dragging');
      const s = g.moved && !g.cancelled ? swipeStep(g.dx, g.dy, g.duration) : 0;
      if (!s || !canStep(s)) { x(null); return; }
      haptic('snap');
      if (reduced()) { x(null); onStep(s); return; }
      x(`${s > 0 ? 112 : -112}%`);
      window.setTimeout(() => { x(null); setEnter(s > 0 ? 'from-left' : 'from-right'); onStep(s); }, 170);
    },
  });
  return { ref, gesture, enter };
}
