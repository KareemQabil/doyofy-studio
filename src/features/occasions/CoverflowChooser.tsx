/**
 * Variant A · Focused Coverflow. One occasion is in focus; neighbours peek from both sides.
 * - native horizontal scrolling with scroll-snap (swipe / trackpad / shift+wheel) — the browser's own
 *   momentum, so it is never hard to stop and always lands centred on a card
 * - arrows and keyboard (RTL: ← moves forward, → back; Home/End) · Enter confirms
 * - the focused card IS the selection (ring + check); tapping a side card brings it to the centre
 * - no autoplay, no rotation; reduced motion removes the scale and smooth scrolling
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { EventType } from '../../domain/types';
import { OCCASIONS_ORDERED, OCCASION_GROUPS } from '../../domain/event';
import { IconButton } from '../../ui';
import { OccasionCard } from './OccasionCard';

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function CoverflowChooser({ value, onChange, onConfirm }: { value: EventType | null; onChange: (t: EventType) => void; onConfirm: (t: EventType) => void }) {
  const items = OCCASIONS_ORDERED;
  const start = Math.max(0, items.findIndex((i) => i.id === value));
  const [index, setIndex] = useState(start);
  const track = useRef<HTMLDivElement>(null);
  const settling = useRef(false);
  const current = items[index]!;

  const centre = useCallback((i: number, smooth = true) => {
    const el = track.current?.children[i] as HTMLElement | undefined;
    const t = track.current;
    if (!el || !t) return;
    // centre the card inside the track only (scrollIntoView could also scroll the page)
    const delta = el.getBoundingClientRect().left + el.offsetWidth / 2 - (t.getBoundingClientRect().left + t.clientWidth / 2);
    settling.current = smooth;
    t.scrollBy({ left: delta, behavior: smooth && !reduced() ? 'smooth' : 'auto' });
  }, []);

  useLayoutEffect(() => { centre(start, false); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { onChange(current.id); }, [current.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // the focused card follows the scroll position (swipe, trackpad, arrows all end here)
  useEffect(() => {
    const t = track.current;
    if (!t) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const mid = t.getBoundingClientRect().left + t.clientWidth / 2;
        let best = 0, bestD = Infinity;
        Array.from(t.children).forEach((c, i) => {
          const r = (c as HTMLElement).getBoundingClientRect();
          const d = Math.abs(r.left + r.width / 2 - mid);
          if (d < bestD) { bestD = d; best = i; }
        });
        setIndex(best);
      });
    };
    t.addEventListener('scroll', onScroll, { passive: true });
    return () => { t.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  const go = (i: number) => { const n = Math.max(0, Math.min(items.length - 1, i)); setIndex(n); centre(n); };
  const onKey = (e: KeyboardEvent) => {
    const k = e.key;
    if (k === 'ArrowLeft') { e.preventDefault(); go(index + 1); }
    else if (k === 'ArrowRight') { e.preventDefault(); go(index - 1); }
    else if (k === 'Home') { e.preventDefault(); go(0); }
    else if (k === 'End') { e.preventDefault(); go(items.length - 1); }
    else if (k === 'Enter' || k === ' ') { e.preventDefault(); onConfirm(current.id); }
  };
  const group = OCCASION_GROUPS.find((g) => g.id === current.group)?.label;

  return (
    <div className="cf">
      <div className="cf-stage">
        <div ref={track} className="cf-track" role="listbox" tabIndex={0} aria-label="أنواع المناسبات" aria-activedescendant={`occ-${current.id}`} onKeyDown={onKey}>
          {items.map((it, i) => (
            <div key={it.id} id={`occ-${it.id}`} role="option" aria-selected={i === index} aria-posinset={i + 1} aria-setsize={items.length}
              className={`cf-item${i === index ? ' is-focused' : Math.abs(i - index) === 1 ? ' is-near' : ''}`}
              onClick={() => (i === index ? onConfirm(it.id) : go(i))}>
              <OccasionCard info={it} selected={i === index} size="lg" />
            </div>
          ))}
        </div>
      </div>
      <div className="cf-nav">
        <IconButton icon="back" label="المناسبة السابقة" variant="secondary" className="cf-arrow" onClick={() => go(index - 1)} disabled={index === 0} />
        <p className="cf-meta" aria-live="polite"><span className="num">{index + 1} / {items.length}</span><span aria-hidden="true" className="cf-sep" />{group}</p>
        <IconButton icon="forward" label="المناسبة التالية" variant="secondary" className="cf-arrow" onClick={() => go(index + 1)} disabled={index === items.length - 1} />
      </div>
      <div className="cf-dots" aria-hidden="true">{items.map((it, i) => <span key={it.id} className={i === index ? 'on' : ''} />)}</div>
    </div>
  );
}
