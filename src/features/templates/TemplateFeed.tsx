/**
 * The design feed — one invitation design per screen, TikTok-style (creation step 2 and the in-event gallery).
 *   · native vertical scrolling with one snap point per design; swipe up/down, the rail's arrows, or the keyboard
 *     (↑/↓, Page Up/Down, Home/End) move between designs. Only the visible design and its neighbours render art.
 *   · the card is sized to the space the feed actually has (it fills the screen; ≥ 220px wide on a 320px phone).
 *     On phones the rail becomes one row under the card, so the card is centred and takes the full width.
 *   · a labelled side rail holds the secondary actions: share, style filter (a small sheet) and a full playback of
 *     the CURRENT design. The primary («اختر هذا التصميم») belongs to the page footer.
 *   · on arrival the card itself bounces upward twice to teach the gesture; reduced motion shows a still hint instead
 * Browsing shows each face at rest, never mid-entrance; nothing is applied until the page's primary action.
 */
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { Event, InvitationDesignContent } from '../../domain/types';
import { toInvitationData } from '../../domain/invitation';
import { applyPreset, type TemplatePreset } from '../../domain/templates';
import { Button, Dialog, Icon } from '../../ui';
import type { IconName } from '../../ui/icons';
import { useCopy } from '../../ui/copy';
import { prefersReducedMotion } from '../../ui/motion/motion';
import { CardThumb } from '../invitation/CardThumb';
import { LivePreview } from '../invitation/LivePreview';
import { CopyField } from '../shared/CopyField';
import { useTemplateShare } from './template-share';

export type FeedFilter = { id: string; label: string; count: number };

const RAIL = 60;      // the side rail's width
const INFO = 62;      // the design name under the card
const MAX_CARD = 440; // past this the face only grows its whitespace
const RAIL_ROW = 66;  // the rail as one row under the card (phones)

/**
 * Fit a 5:7 card in the feed. Wide boxes keep the rail beside a centred card; when the rail would squeeze the card
 * (phones) it moves under the card as one row and the card takes the full width, centred (`bottom` = that row).
 */
export function fitFeedCard(width: number, height: number) {
  if (!width || !height) return { card: 260, padEnd: 0, railInset: 6, bottom: RAIL_ROW };
  const byHeight = (height - INFO - 28) / 1.4;
  const centredWidth = width - 2 * (RAIL + 16);
  if (Math.min(byHeight, MAX_CARD) <= centredWidth) {
    const card = Math.round(Math.max(160, Math.min(byHeight, MAX_CARD)));
    return { card, padEnd: 0, railInset: Math.max(6, Math.round((width - card) / 2 - RAIL - 20)), bottom: 0 };
  }
  const card = Math.round(Math.max(160, Math.min((height - INFO - 28 - RAIL_ROW) / 1.4, MAX_CARD, width - 32)));
  return { card, padEnd: 0, railInset: 6, bottom: RAIL_ROW };
}

function RailButton({ icon, label, onClick, disabled, pressed }: { icon: IconName; label: string; onClick: () => void; disabled?: boolean; pressed?: boolean }) {
  return <button type="button" className="tf-rail-btn" onClick={onClick} disabled={disabled} aria-pressed={pressed}><span className="tf-rail-icon"><Icon name={icon} size="sm" /></span><span className="tf-rail-label">{label}</span></button>;
}

export function TemplateFeed({ presets, preset, event, base, current, currentLabel, pending, onNavigate, filters, filter, onFilter, emptyAction }: {
  presets: TemplatePreset[]; preset: TemplatePreset | null; event: Event; base: InvitationDesignContent; current?: string; currentLabel?: string; pending: boolean;
  onNavigate: (p: TemplatePreset) => void;
  /** style filters, offered in a small sheet; the feed shows only the chosen subset */
  filters?: FeedFilter[]; filter?: string; onFilter?: (id: string) => void;
  emptyAction?: () => void;
}) {
  const { t } = useCopy();
  const { share, copyUrl } = useTemplateShare(event.type);
  const frame = useRef<HTMLDivElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined);
  const observed = useRef<number | null>(null);
  const index = preset ? Math.max(0, presets.findIndex(p => p.id === preset.id)) : 0;
  const indexRef = useRef(index);
  indexRef.current = index;
  const firstMount = useRef(true);
  const catalogueKey = presets.map(p => p.id).join('|');
  const [fit, setFit] = useState(() => fitFeedCard(0, 0));
  const [hint, setHint] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [replay, setReplay] = useState(0);
  const reduced = prefersReducedMotion();

  // size the card to the feed's real box (the page gives the feed whatever its header and footer leave)
  useLayoutEffect(() => {
    const node = scroll.current;
    if (!node) return;
    let raf = 0;
    const measure = () => {
      const r = node.getBoundingClientRect();
      const next = fitFeedCard(r.width, r.height);
      setFit(f => f.card === next.card && f.padEnd === next.padEnd && f.railInset === next.railInset && f.bottom === next.bottom ? f : next);
    };
    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); };
    measure();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { schedule(); node.scrollTop = indexRef.current * node.clientHeight; }) : null;
    observer?.observe(node);
    window.addEventListener('resize', schedule);
    return () => { cancelAnimationFrame(raf); observer?.disconnect(); window.removeEventListener('resize', schedule); clearTimeout(settle.current); };
  }, []);
  useEffect(() => {
    const node = scroll.current;
    if (!node) return;
    if (observed.current === index) { observed.current = null; return; }
    const top = index * node.clientHeight;
    if (typeof node.scrollTo === 'function') node.scrollTo({ top, behavior: firstMount.current || reduced ? 'instant' : 'smooth' });
    else node.scrollTop = top;
    if (!firstMount.current) setHint(false);
    firstMount.current = false;
  }, [index, catalogueKey]); // eslint-disable-line react-hooks/exhaustive-deps
  // the bounce lasts two cycles; afterwards the hint is gone for good
  useEffect(() => { if (reduced || !hint) return; const timer = setTimeout(() => setHint(false), 3400); return () => clearTimeout(timer); }, [hint, reduced]);

  const select = (next: number) => { const p = presets[next]; if (p && !pending) { setHint(false); onNavigate(p); } };
  const keyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const next = e.key === 'ArrowDown' || e.key === 'PageDown' ? index + 1 : e.key === 'ArrowUp' || e.key === 'PageUp' ? index - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? presets.length - 1 : null;
    if (next === null) return;
    e.preventDefault(); select(next);
  };
  const shown = preset && presets.some(p => p.id === preset.id) ? preset : presets[0];
  const activeFilter = filters?.find(f => f.id === filter);
  const content = shown ? applyPreset(base, shown) : base;

  return <div ref={frame} className={`tf${fit.bottom ? ' is-row-rail' : ''}`} style={{ '--tf-card': `${fit.card}px`, '--tf-pad-end': `${fit.padEnd}px`, '--tf-rail-inset': `${fit.railInset}px`, '--tf-bottom': `${fit.bottom}px` } as React.CSSProperties}>
    <div ref={scroll} className="tf-scroll template-feed-scroll" tabIndex={0} role="region" aria-label={`${t('templateBrowse')} — ${t('templateSwipe')}`} aria-roledescription={t('tfRole')} onKeyDown={keyDown}
      onScroll={() => {
        clearTimeout(settle.current);
        settle.current = setTimeout(() => {
          const node = scroll.current;
          if (!node || !node.clientHeight || pending) return;
          const at = Math.max(0, Math.min(presets.length - 1, Math.round(node.scrollTop / node.clientHeight)));
          if (at !== indexRef.current) { observed.current = at; select(at); }
        }, 100);
      }}>
      {presets.map((p, i) => <article key={p.id} className={`tf-slide template-feed-slide${i === index ? ' is-active' : ''}`} aria-hidden={i !== index} inert={i !== index}>
        <div className={`tf-card${i === index && hint && !reduced && presets.length > 1 ? ' is-hinting' : ''}`}>
          {Math.abs(index - i) <= 1 ? <CardThumb event={event} content={applyPreset(base, p)} width={fit.card} label={t('tfOf', { name: p.name, i: i + 1, n: presets.length })} /> : <span className="tf-placeholder" style={{ width: fit.card, height: fit.card * 1.4 }}><Icon name="envelope" size="lg" /></span>}
          {current === p.id && <span className="tf-current"><Icon name="check" size="sm" />{currentLabel ?? t('wzCurrentDesign')}</span>}
        </div>
        <div className="tf-info template-feed-title"><h3>{p.name}</h3><p>{p.line}</p></div>
      </article>)}
      {!presets.length && <div className="tf-empty" role="status"><p>{t('tfNoStyle')}</p>{emptyAction && <Button size="sm" variant="secondary" onClick={emptyAction}>{t('tfShowAll')}</Button>}</div>}
    </div>
    {hint && reduced && presets.length > 1 && <p className="tf-still-hint"><Icon name="chevron-up" size="sm" />{t('templateSwipe')}</p>}
    <div className="tf-rail" role="toolbar" aria-label={t('tfToolbar')} aria-orientation={fit.bottom ? 'horizontal' : 'vertical'}>
      <div className="tf-rail-nav">
        <button type="button" className="tf-rail-arrow" aria-label={t('tfPrev')} onClick={() => select(index - 1)} disabled={pending || index <= 0}><Icon name="chevron-up" size="sm" /></button>
        <span className="tf-count num" dir="ltr" aria-live="polite" aria-atomic="true"><span className="sr-only">{t('tfCountWord')}</span>{presets.length ? index + 1 : 0}<span aria-hidden="true">/</span><span className="sr-only">{t('tfCountOf')}</span>{presets.length}</span>
        <button type="button" className="tf-rail-arrow" aria-label={t('tfNext')} onClick={() => select(index + 1)} disabled={pending || index >= presets.length - 1}><Icon name="chevron-down" size="sm" /></button>
      </div>
      {filters && onFilter && <RailButton icon="sliders" label={t('templateFilter')} onClick={() => setSheet(true)} disabled={pending} pressed={!!activeFilter && activeFilter.id !== filters[0]?.id} />}
      {shown && <RailButton icon="share" label={t('templateShareShort')} onClick={() => void share(shown)} disabled={pending} />}
      {shown && <RailButton icon="play" label={t('templateWatch')} onClick={() => { setReplay(0); setPlaying(true); }} disabled={pending} />}
    </div>
    {copyUrl && <div className="tf-copy"><CopyField label={t('tfCopyLabel')} value={copyUrl} /></div>}
    {sheet && filters && onFilter && <Dialog open variant="drawer" size="sm" title={t('templateFilter')} description={t('tfFilterHint')} onClose={() => setSheet(false)} className="tf-sheet">
      <div className="tf-filters" role="radiogroup" aria-label={t('templateFilter')}>
        {filters.map(f => <button key={f.id} type="button" role="radio" aria-checked={filter === f.id} className="tf-filter" disabled={!f.count} onClick={() => { onFilter(f.id); setSheet(false); }}>
          <span>{f.label}</span><span className="num">{f.count}</span>{filter === f.id && <Icon name="check" size="sm" />}
        </button>)}
      </div>
    </Dialog>}
    {playing && shown && <Dialog open size="xl" className="tf-play" title={shown.name} description={t('previewInvitation')} onClose={() => setPlaying(false)}
      footer={<><Button variant="ghost" icon="play" onClick={() => setReplay(n => n + 1)}>{t('tfReplay')}</Button><Button variant="primary" onClick={() => setPlaying(false)}>{t('back')}</Button></>}>
      <div className="tf-play-screen"><LivePreview key={shown.id} start="intro" invitation={toInvitationData(event, content, event.settings.defaultPartySize)} content={content} muted={false} replayToken={replay} label={`${t('previewInvitation')}: ${shown.name}`} /></div>
    </Dialog>}
  </div>;
}
