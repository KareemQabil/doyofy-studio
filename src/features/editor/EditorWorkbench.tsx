import { useEffect, useRef, useState } from 'react';
import type { Event, InvitationDesignContent } from '../../domain/types';
import { CARD_NAMES } from '../../domain/invitation';
import { CardThumb } from '../invitation/CardThumb';
import { SceneBackdrop } from '../invitation/SceneBackdrop';
import { LogoMark } from '../../ui/brand';
import { useTilt } from '../signature/useTilt';
import { resolvedNames } from '../../domain/invitation';
import { isCoupleEvent } from '../../domain/event';
import { formatTime } from '../../domain/format';
import { prefersReducedMotion } from '../../ui/motion/motion';
import { useCopy } from '../../ui/copy';
import { Button, Dialog } from '../../ui';
export type WorkbenchPage = 'card' | 'message' | 'program';

/** One page of the invitation at any width: the card face (real HTML from the engine), or the message / program paper. */
function Paper({ event, content, page, width, motion = 0, label }: { event: Event; content: InvitationDesignContent; page: WorkbenchPage; width: number; motion?: number; label?: string }) {
  const { t } = useCopy();
  if (page === 'card') return <CardThumb event={event} content={content} width={width} motion={motion} label={label ?? t('shCardPreview', { name: CARD_NAMES[content.cardId] ?? t('edYourInvitation') })} />;
  const names = resolvedNames(event, content);
  const headingNames = isCoupleEvent(event.type) && names.b ? `${names.a} و${names.b}` : names.a;
  const k = width / 300;
  return <span className="ed-copy-frame" style={{ width, height: 420 * k }}>
    <article className="ed-copy-paper" style={k === 1 ? undefined : { transform: `scale(${k})` }} aria-label={page === 'message' ? t('shMsgPreview') : t('shProgPreview')}>
      <LogoMark size={28} /><p className="ed-copy-names">{headingNames}</p><h2>{page === 'message' ? t('shPaperMsg') : t('shPaperProg')}</h2>
      <div className="ed-copy-body">{page === 'message'
        ? <><p className="ed-copy-message">{content.message.ar || t('shWriteMsg')}</p>{content.message.en && <p className="ed-copy-english" lang="en" dir="ltr">{content.message.en}</p>}</>
        : <ol className="ed-copy-program">{content.program.map((p, i) => <li key={i}><bdi className="num">{formatTime(p.time)}</bdi><span>{p.ar}{p.en && <small lang="en" dir="ltr">{p.en}</small>}</span></li>)}</ol>}</div>
      <span className="ed-copy-foot">ضيوفي · {event.venue.name}</span>
    </article>
  </span>;
}

/**
 * The editable invitation standing on its own setting: the backdrop is the invitation's flat scene (the same one the
 * guest sees), never a photograph. The page is scaled to fill the surface, so the card is as large as the room allows
 * and shrinks smoothly when the surface does (phones: while typing, the stage becomes a live mini card).
 */
export function EditorWorkbench({ event, content, caption, page = 'card', motion = 0 }: { event: Event; content: InvitationDesignContent; caption?: string; page?: WorkbenchPage; motion?: number }) {
  const surface = useRef<HTMLDivElement>(null);
  const paper = useTilt<HTMLDivElement>(3);
  useEffect(() => {
    const el = surface.current;
    if (!el) return;
    const fit = () => {
      const { width, height } = el.getBoundingClientRect();
      const pad = width < 600 || height < 440 ? (height < 260 ? 16 : 28) : 56;
      el.style.setProperty('--paper-scale', String(Math.max(.1, Math.min(2.2, (width - pad) / 300, (height - pad) / 420))));
    };
    fit();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null;
    observer?.observe(el);
    return () => observer?.disconnect();
  }, []);
  return <div ref={surface} className="ed-workbench" data-tilt-zone="" data-page={page}>
    <SceneBackdrop sceneId={content.sceneId} className="ed-workbench-scene" />
    <div ref={paper} className="ed-workbench-paper"><Paper event={event} content={content} page={page} width={300} motion={motion} /></div>
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
