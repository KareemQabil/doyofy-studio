/**
 * Depth for stationery on a stage: fine pointers tilt the object toward the cursor and move its glare.
 * Touch never needs hover — the tableau has its own tap action (lift the card). Reduced motion: no tilt.
 * Listeners live on the nearest [data-tilt-zone] and are removed on unmount.
 */
import { useEffect, useRef, type RefObject } from 'react';

export function useTilt<T extends HTMLElement>(max = 8): RefObject<T | null> {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof matchMedia !== 'function') return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const zone = el.closest<HTMLElement>('[data-tilt-zone]') ?? el;
    let raf = 0;
    const set = (x: number, y: number, on: boolean) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--ry', `${((x - 0.5) * 2 * max).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${((0.5 - y) * 1.6 * max).toFixed(2)}deg`);
        el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
        el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
        el.classList.toggle('is-tilting', on);
      });
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      const b = zone.getBoundingClientRect();
      set(Math.min(1, Math.max(0, (e.clientX - b.left) / b.width)), Math.min(1, Math.max(0, (e.clientY - b.top) / b.height)), true);
    };
    const leave = () => set(0.5, 0.5, false);
    zone.addEventListener('pointermove', move);
    zone.addEventListener('pointerleave', leave);
    return () => { cancelAnimationFrame(raf); zone.removeEventListener('pointermove', move); zone.removeEventListener('pointerleave', leave); };
  }, [max]);
  return ref;
}
