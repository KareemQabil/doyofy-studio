/**
 * TactileDeck — the Signature "physical" browsing surface (occasions, invitation designs).
 *   · drag/swipe horizontally: the deck follows the finger 1:1, meets rubber-band resistance at the ends,
 *     and snaps with momentum (domain/gestures.ts: deckDragPosition / deckRelease / deckPose)
 *   · RTL: the next card lies to the LEFT. Swipe left / ArrowLeft / the «التالي» button all advance.
 *   · tap a neighbour to bring it forward; tap (Enter/Space) the front card to choose it
 *   · vertical scrolling stays native (touch-action: pan-y + axis lock); pointer cancel restores the card
 *   · trackpad horizontal scroll steps one card; reduced motion = instant moves, no tilt
 *   · teaches the gesture once (a small nudge + hint chip) and then remembers
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { deckDragPosition, deckPose, deckRelease } from '../../domain/gestures';
import { usePointerGesture } from '../hooks/usePointerGesture';
import { Icon } from '../icons';
import { SPRING } from '../../domain/motion';
import { haptic, springTo } from '../motion/motion';

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const HINT_KEY = 'doyofy:deck-hint';
const seenHint = () => { try { return localStorage.getItem(HINT_KEY) === '1'; } catch { return true; } };
const rememberHint = () => { try { localStorage.setItem(HINT_KEY, '1'); } catch { /* storage unavailable: hint simply shows again */ } };

export interface TactileDeckProps<T> {
  items: T[];
  index: number;
  onIndexChange: (index: number) => void;
  onActivate?: (item: T, index: number) => void;
  getKey: (item: T) => string;
  renderCard: (item: T, state: { active: boolean; near: boolean }) => ReactNode;
  itemLabel: (item: T, index: number) => string;
  label: string;
  /** spacing between card centres, as a fraction of card width */
  spread?: number;
  disabled?: boolean;
  className?: string;
  /** how many cards either side are mounted (heavy faces: keep small) */
  window?: number;
  activateHint?: string;
  hint?: string;
}

export function TactileDeck<T>({ items, index, onIndexChange, onActivate, getKey, renderCard, itemLabel, label, spread = 0.66, disabled = false, className = '', window: win = 3, activateHint, hint = 'اسحب البطاقات لتتصفّح' }: TactileDeckProps<T>) {
  const count = items.length;
  const stage = useRef<HTMLDivElement>(null);
  const cards = useRef<Array<HTMLElement | null>>([]);
  const pos = useRef(index);            // live float position
  const startPos = useRef(index);
  const anim = useRef(0);
  const [step, setStep] = useState(200);
  const [showHint, setShowHint] = useState(false);
  const hintTimers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const stopHint = () => { hintTimers.current.forEach(clearTimeout); hintTimers.current = []; };
  const [mounted, setMounted] = useState(index);  // window centre for mounting heavy cards

  const paint = useCallback((p: number) => {
    pos.current = p;
    cards.current.forEach((el, i) => {
      if (!el) return;
      const o = i - p, pose = deckPose(o, step);
      el.style.transform = `translate3d(${pose.x.toFixed(1)}px, ${pose.lift.toFixed(1)}px, 0) rotate(${pose.rotate.toFixed(2)}deg) scale(${pose.scale.toFixed(3)})`;
      el.style.opacity = String(Math.max(0, pose.opacity));
      el.style.zIndex = String(pose.z);
      el.style.setProperty('--deck-dim', String(Math.min(1, Math.abs(o))));
      el.style.visibility = Math.abs(o) > 3.2 ? 'hidden' : 'visible';
    });
  }, [step]);

  // settle on a spring that starts with the release velocity (cards per second), so a flick feels thrown
  const stopSpring = useRef<() => void>(() => {});
  const animateTo = useCallback((to: number, done?: () => void, velocity = 0) => {
    cancelAnimationFrame(anim.current);
    stopSpring.current();
    if (reduced() || (Math.abs(to - pos.current) < 0.001 && Math.abs(velocity) < 0.01)) { paint(to); done?.(); return; }
    stopSpring.current = springTo(pos.current, to, { velocity, config: SPRING.snap, precision: 0.002, onUpdate: paint, onRest: done });
  }, [paint]);

  // measure card width → spacing (responsive)
  useLayoutEffect(() => {
    const el = stage.current; if (!el) return;
    const measure = () => { const c = el.querySelector<HTMLElement>('.deck-card'); const w = c?.offsetWidth || 220; setStep(Math.round(w * spread)); };
    measure();
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null; ro?.observe(el);
    return () => ro?.disconnect();
  }, [spread, count]);

  useLayoutEffect(() => { paint(pos.current); }, [paint, count]);
  // external index changes (buttons, keys, parent) glide to the new card
  useEffect(() => { setMounted(index); animateTo(index); }, [index, animateTo]);
  useEffect(() => () => { cancelAnimationFrame(anim.current); stopSpring.current(); }, []);

  // teach once: a small nudge toward the next card, then back
  useEffect(() => {
    if (seenHint() || count < 2) return;
    setShowHint(true);
    if (reduced()) return;
    hintTimers.current.push(setTimeout(() => animateTo(Math.min(count - 1, index + 0.32), () => {
      hintTimers.current.push(setTimeout(() => animateTo(index), 260));
    }), 900));
    return stopHint;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const learned = () => { stopHint(); if (showHint) { setShowHint(false); rememberHint(); } };

  const go = (i: number) => { if (disabled) return; const n = Math.max(0, Math.min(count - 1, i)); learned(); if (n !== index) onIndexChange(n); else animateTo(n); };

  const gesture = usePointerGesture({
    axis: 'x', enabled: !disabled,
    onStart: () => { learned(); cancelAnimationFrame(anim.current); stopSpring.current(); startPos.current = pos.current; },
    onMove: (dx) => { stage.current?.classList.add('is-dragging'); const p = deckDragPosition(startPos.current, dx, step, count); setMounted(Math.round(p)); paint(p); },
    onEnd: (g) => {
      stage.current?.classList.remove('is-dragging');
      if (!g.moved || g.cancelled) { animateTo(index); return; }
      learned();
      const { target } = deckRelease(pos.current, g.velocity, step, count, index);
      if (target !== index) haptic('snap');
      // dx < 0 advances in RTL: px/ms → cards/s
      animateTo(target, () => { if (target !== index) onIndexChange(target); }, (-g.velocity * 1000) / Math.max(1, step));
    },
  });

  // trackpad / shift-wheel horizontal scrolling steps one card (vertical wheel keeps scrolling the page)
  const wheelAcc = useRef(0), wheelLock = useRef(0);
  useEffect(() => {
    const el = stage.current; if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const dx = e.deltaX || (e.shiftKey ? e.deltaY : 0);
      if (!dx || Math.abs(dx) < Math.abs(e.deltaY) * (e.shiftKey ? 0 : 1)) return;
      e.preventDefault();
      if (performance.now() < wheelLock.current) return;
      wheelAcc.current += dx;
      if (Math.abs(wheelAcc.current) > 60) {
        // physical scroll right (dx>0) moves content left, i.e. toward the next card in RTL
        const n = index + (wheelAcc.current > 0 ? 1 : -1); wheelAcc.current = 0; wheelLock.current = performance.now() + 380; go(n);
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });

  const onKeyDown = (e: React.KeyboardEvent) => {
    const k = e.key;
    if (k === 'ArrowLeft') { e.preventDefault(); go(index + 1); }
    else if (k === 'ArrowRight') { e.preventDefault(); go(index - 1); }
    else if (k === 'Home') { e.preventDefault(); go(0); }
    else if (k === 'End') { e.preventDefault(); go(count - 1); }
    else return;
    requestAnimationFrame(() => stage.current?.querySelector<HTMLElement>('.deck-card[aria-current="true"]')?.focus());
  };

  const current = items[index];
  return (
    <div className={`deck${disabled ? ' is-busy' : ''} ${className}`} role="group" aria-roledescription="معرض بطاقات" aria-label={label}>
      <div ref={stage} className="deck-stage" {...gesture} onKeyDown={onKeyDown}>
        {items.map((item, i) => {
          const near = Math.abs(i - mounted) <= win;
          const active = i === index;
          return (
            <button key={getKey(item)} ref={(el) => { cards.current[i] = el; }} type="button" className={`deck-card${active ? ' is-active' : ''}`}
              tabIndex={active ? 0 : -1} aria-current={active ? 'true' : undefined} disabled={disabled}
              aria-label={`${itemLabel(item, i)} — ${i + 1} من ${count}${active && activateHint ? `، ${activateHint}` : ''}`}
              data-gesture-surface="" style={{ '--deck-i': i } as CSSProperties}
              onClick={() => { if (active) onActivate?.(item, i); else go(i); }}>
              {near ? renderCard(item, { active, near }) : <span className="deck-card-placeholder" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      <div className="deck-controls">
        <button type="button" className="deck-arrow" onClick={() => go(index - 1)} disabled={disabled || index === 0} aria-label="البطاقة السابقة"><Icon name="back" /></button>
        <div className="deck-progress" aria-hidden="true">
          <span className="deck-count num"><b>{String(index + 1).padStart(2, '0')}</b> / {String(count).padStart(2, '0')}</span>
          <span className="deck-rail"><span style={{ width: `${((index + 1) / Math.max(1, count)) * 100}%` }} /></span>
        </div>
        <button type="button" className="deck-arrow" onClick={() => go(index + 1)} disabled={disabled || index === count - 1} aria-label="البطاقة التالية"><Icon name="forward" /></button>
      </div>
      {showHint && <p className="deck-hint" aria-hidden="true"><span className="deck-hint-hand" />{hint}</p>}
      <p className="sr-only" aria-live="polite">{current ? `${itemLabel(current, index)}، ${index + 1} من ${count}` : ''}</p>
    </div>
  );
}
