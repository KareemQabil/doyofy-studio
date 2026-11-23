import { useEffect, useRef, useState } from 'react';
import type { Event, InvitationDesignContent } from '../../domain/types';
import { CARD_NAMES, toInvitationData } from '../../domain/invitation';
import { CardThumb } from '../invitation/CardThumb';
import { SceneBackdrop } from '../invitation/SceneBackdrop';
import { loadEngine } from '../invitation/engine';
import { LogoMark } from '../../ui/brand';
import { useTilt } from '../signature/useTilt';
import { resolvedNames } from '../../domain/invitation';
import { isCoupleEvent } from '../../domain/event';
import { formatTime } from '../../domain/format';
import { prefersReducedMotion } from '../../ui/motion/motion';
import { useCopy } from '../../ui/copy';
import type { CopyKey } from '../../domain/copy';
import { Button, Dialog } from '../../ui';
import type { EditField } from './sections';
export type WorkbenchPage = 'card' | 'message' | 'program';

/** One page of the invitation at any width: the card face (real HTML from the engine), or the message / program paper.
 *  The paper pages mark what a tap edits with `data-edit` (the card face is searched for its texts instead). */
function Paper({ event, content, page, width, motion = 0, label }: { event: Event; content: InvitationDesignContent; page: WorkbenchPage; width: number; motion?: number; label?: string }) {
  const { t } = useCopy();
  if (page === 'card') return <CardThumb event={event} content={content} width={width} motion={motion} label={label ?? t('shCardPreview', { name: CARD_NAMES[content.cardId] ?? t('edYourInvitation') })} />;
  const names = resolvedNames(event, content);
  const headingNames = isCoupleEvent(event.type) && names.b ? `${names.a} و${names.b}` : names.a;
  const k = width / 300;
  return <span className="ed-copy-frame" style={{ width, height: 420 * k }}>
    <article className="ed-copy-paper" style={k === 1 ? undefined : { transform: `scale(${k})` }} aria-label={page === 'message' ? t('shMsgPreview') : t('shProgPreview')}>
      <LogoMark size={28} /><p className="ed-copy-names" data-edit="names">{headingNames}</p><h2>{page === 'message' ? t('shPaperMsg') : t('shPaperProg')}</h2>
      <div className="ed-copy-body">{page === 'message'
        ? <div data-edit="message"><p className="ed-copy-message">{content.message.ar || t('shWriteMsg')}</p>{content.message.en && <p className="ed-copy-english" lang="en" dir="ltr">{content.message.en}</p>}</div>
        : <ol className="ed-copy-program" data-edit="program">{content.program.map((p, i) => <li key={i}><bdi className="num">{formatTime(p.time)}</bdi><span>{p.ar}{p.en && <small lang="en" dir="ltr">{p.en}</small>}</span></li>)}</ol>}</div>
      <span className="ed-copy-foot">ضيوفي · <span data-edit="venue">{event.venue.name}</span></span>
    </article>
  </span>;
}

// ------------------------------------------------------------------ tap to edit
const FIELDS: EditField[] = ['names', 'date', 'venue', 'message', 'program'];
const TAP_LABEL: Record<EditField, CopyKey> = { names: 'edEditNames', date: 'edEditDate', venue: 'edEditVenue', message: 'edEditMessage', program: 'edEditProgram' };
interface Target { field: EditField; x: number; y: number; w: number; h: number; primary: boolean }
const norm = (s: string) => s.replace(/\s+/g, ' ').trim();

/** the deepest elements under `root` whose text contains `needle` (a line split over several spans finds their parent) */
function deepestWith(root: Element, needle: string): Element[] {
  const out: Element[] = [];
  const walk = (el: Element): boolean => {
    if (!norm(el.textContent ?? '').includes(needle)) return false;
    let inChild = false;
    for (const child of Array.from(el.children)) if (walk(child)) inChild = true;
    if (!inChild) out.push(el);
    return true;
  };
  for (const child of Array.from(root.children)) walk(child);
  return out;
}

/** the box of the text itself (a centred line in a full-width block hugs its words), else the element's box */
function textRect(el: Element): DOMRect {
  if (el instanceof HTMLElement && typeof document.createRange === 'function') {
    const range = document.createRange();
    range.selectNodeContents(el);
    const r = typeof range.getBoundingClientRect === 'function' ? range.getBoundingClientRect() : null;
    if (r && r.width >= 1 && r.height >= 1) return r;
  }
  return el.getBoundingClientRect();
}

/**
 * Finds the names, date, place and message drawn on the page and lays a transparent button over each, in the page's own
 * 300×420 space (so they follow the page's scale and tilt). Each field's first button is in the tab order with an Arabic
 * label; repeats of the same field (a name printed twice) are pointer-only. Every target is at least 44px on screen.
 */
function useTapTargets(paper: React.RefObject<HTMLDivElement | null>, layer: React.RefObject<HTMLDivElement | null>, key: string, cardId: string, invitation: string, enabled: boolean) {
  const [targets, setTargets] = useState<Target[]>([]);
  useEffect(() => {
    const host = paper.current;
    if (!enabled || !host) { setTargets([]); return; }
    let alive = true, raf = 0;
    let texts: Record<'names' | 'date' | 'venue', string[]> | null = null;
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const box = layer.current?.getBoundingClientRect();
        if (!alive || !box || !box.width) return;
        const s = box.width / 300;
        const face = host.querySelector('.card-thumb-inner');
        const found: Array<{ field: EditField; el: Element }> = [];
        host.querySelectorAll('[data-edit]').forEach((el) => found.push({ field: el.getAttribute('data-edit') as EditField, el }));
        if (face && texts) for (const field of ['names', 'date', 'venue'] as const) for (const needle of texts[field]) for (const el of deepestWith(face, needle)) found.push({ field, el });
        const seen = new Set<Element>(), next: Target[] = [], min = 44 / s;
        for (const field of FIELDS) {
          const mine = found.filter((f) => f.field === field && !seen.has(f.el));
          // keep the innermost match: a parent whose matched child is also listed adds nothing
          const els = [...new Set(mine.map((f) => f.el))].filter((el, _, all) => !all.some((o) => o !== el && el.contains(o)));
          for (const el of els) {
            seen.add(el);
            const r = textRect(el);
            if (r.width < 1 || r.height < 1) continue;
            let x = (r.left - box.left) / s - 4, y = (r.top - box.top) / s - 4, w = r.width / s + 8, h = r.height / s + 8;
            if (w * h > 300 * 420 * .45) continue; // a whole panel matched, not a line
            if (w < min) { x -= (min - w) / 2; w = min; }
            if (h < min) { y -= (min - h) / 2; h = min; }
            x = Math.max(0, Math.min(300 - w, x)); y = Math.max(0, Math.min(420 - h, y));
            next.push({ field, x, y, w: Math.min(w, 300), h: Math.min(h, 420), primary: !next.some((n) => n.field === field) });
          }
        }
        setTargets((prev) => JSON.stringify(prev) === JSON.stringify(next) ? prev : next);
      });
    };
    // the face arrives asynchronously and plays its entrance: measure on arrival and again once it has settled
    const later = () => { measure(); timers.push(setTimeout(measure, 300), setTimeout(measure, 1400)); };
    loadEngine().then((eng) => { if (!alive) return; texts = eng.cardFaceTexts(cardId, JSON.parse(invitation)); later(); }).catch(() => later());
    const mo = new MutationObserver(later);
    mo.observe(host, { childList: true, subtree: true, characterData: true });
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    if (layer.current) ro?.observe(layer.current);
    void document.fonts?.ready.then(() => { if (alive) measure(); });
    return () => { alive = false; cancelAnimationFrame(raf); timers.forEach(clearTimeout); mo.disconnect(); ro?.disconnect(); };
  }, [key, cardId, invitation, enabled]); // eslint-disable-line react-hooks/exhaustive-deps
  return targets;
}

/**
 * The editable invitation standing on its own setting: the backdrop is the invitation's flat scene (the same one the
 * guest sees), never a photograph. The page is scaled to fill the surface (less `bottom`, the room kept for the page
 * dots), so the card is as large as the room allows and shrinks smoothly when the surface does (phones: while typing,
 * the stage becomes a live mini card). With `onEdit`, each text on the page is a button that opens its field.
 */
export function EditorWorkbench({ event, content, caption, page = 'card', motion = 0, bottom = 0, onEdit }: { event: Event; content: InvitationDesignContent; caption?: string; page?: WorkbenchPage; motion?: number; bottom?: number; onEdit?: (field: EditField) => void }) {
  const { t } = useCopy();
  const surface = useRef<HTMLDivElement>(null);
  const paper = useTilt<HTMLDivElement>(3);
  const layer = useRef<HTMLDivElement>(null);
  const inv = JSON.stringify(toInvitationData(event, content));
  const targets = useTapTargets(paper, layer, `${page}|${content.message.ar}|${content.program.length}|${motion}`, content.cardId, inv, !!onEdit);
  useEffect(() => {
    const el = surface.current;
    if (!el) return;
    const fit = () => {
      const { width, height: full } = el.getBoundingClientRect();
      const height = full - bottom;
      const pad = width < 600 || height < 440 ? (height < 260 ? 16 : 28) : 56;
      el.style.setProperty('--paper-scale', String(Math.max(.1, Math.min(2.2, (width - pad) / 300, (height - pad) / 420))));
    };
    fit();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null;
    observer?.observe(el);
    return () => observer?.disconnect();
  }, [bottom]);
  return <div ref={surface} className="ed-workbench" data-tilt-zone="" data-page={page} style={{ '--wb-bottom': `${bottom}px` } as React.CSSProperties}>
    <SceneBackdrop sceneId={content.sceneId} className="ed-workbench-scene" />
    <div ref={paper} className="ed-workbench-paper">
      <Paper event={event} content={content} page={page} width={300} motion={motion} />
      {onEdit && <div ref={layer} className="ed-tap-layer">
        {targets.map((tg, i) => <button key={`${tg.field}-${i}`} type="button" className="ed-tap" data-edit-target={tg.field} data-gesture-surface=""
          tabIndex={tg.primary ? 0 : -1} aria-hidden={tg.primary ? undefined : true} aria-label={t(TAP_LABEL[tg.field])}
          style={{ left: tg.x, top: tg.y, width: tg.w, height: tg.h }} onClick={() => onEdit(tg.field)} />)}
      </div>}
    </div>
    {caption && <span className="ed-workbench-caption">{caption}</span>}
  </div>;
}

/**
 * «البطاقة بحجم أكبر»: the page alone on its setting, filling the screen. «قرّب» doubles it inside a scroll area,
 * so small print can be read and panned with one finger — no pinch needed.
 */
export function ExpandedCard({ event, content, page, onClose }: { event: Event; content: InvitationDesignContent; page: WorkbenchPage; onClose: () => void }) {
  const { t } = useCopy();
  const measure = () => typeof window === 'undefined' ? 360 : Math.max(240, Math.min(window.innerWidth - 24, (window.innerHeight - 140) / 1.4));
  const [fit, setFit] = useState(measure);
  const [zoom, setZoom] = useState<1 | 2>(1);
  const art = useRef<HTMLDivElement>(null);
  useEffect(() => { const on = () => setFit(measure()); window.addEventListener('resize', on); return () => window.removeEventListener('resize', on); }, []);
  // the card rises into place (GSAP, loaded on demand); reduced motion shows it at once
  useEffect(() => {
    if (prefersReducedMotion() || !art.current) return;
    let tween: { kill(): void } | null = null, alive = true;
    import('gsap').then(({ gsap }) => { if (alive && art.current) tween = gsap.from(art.current, { y: 28, scale: .94, opacity: 0, duration: .55, ease: 'power3.out', clearProps: 'all' }); }).catch(() => {});
    return () => { alive = false; tween?.kill(); };
  }, []);
  return <Dialog open title={t('shBigCard')} size="xl" className="ed-expanded-dialog" onClose={onClose}>
    <div className="ed-expanded-stage">
      <SceneBackdrop sceneId={content.sceneId} />
      <div className="ed-expanded-scroll" data-zoom={zoom} tabIndex={zoom === 2 ? 0 : -1} aria-label={zoom === 2 ? t('shZoomed') : undefined}>
        <div ref={art} className="ed-expanded-paper"><Paper event={event} content={content} page={page} width={Math.round(fit * zoom)} label={t('shBigPreview')} /></div>
      </div>
      <div className="ed-expanded-tools">
        <Button size="sm" icon={zoom === 1 ? 'plus' : 'minus'} aria-pressed={zoom === 2} onClick={() => setZoom(zoom === 1 ? 2 : 1)}>{zoom === 1 ? t('editorZoomIn') : t('editorZoomOut')}</Button>
        <Button size="sm" variant="primary" onClick={onClose}>{t('editorBackToEdit')}</Button>
      </div>
    </div>
  </Dialog>;
}
