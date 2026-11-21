import { useEffect, useRef, useState } from 'react';
import type { Event, InvitationDesignContent } from '../../domain/types';
import { CARD_NAMES } from '../../domain/invitation';
import { CardThumb } from '../invitation/CardThumb';
import { LogoMark } from '../../ui/brand';
import { useTilt } from '../signature/useTilt';
import { resolvedNames } from '../../domain/invitation';
import { isCoupleEvent } from '../../domain/event';
import { formatTime } from '../../domain/format';
import { Button, Dialog, IconButton } from '../../ui';
export type WorkbenchPage = 'card' | 'message' | 'program';

/** The editable face stays actual HTML. Photography only supplies the studio's material surface. */
export function EditorWorkbench({ event, content, caption, page = 'card', motion = 0, expandable = false }: { event: Event; content: InvitationDesignContent; caption?: string; page?: WorkbenchPage; motion?: number; expandable?: boolean }) {
  const names = resolvedNames(event, content);
  const headingNames = isCoupleEvent(event.type) && names.b ? `${names.a} و ${names.b}` : names.a;
  const surface = useRef<HTMLDivElement>(null);
  const paper = useTilt<HTMLDivElement>(3);
  const [expanded, setExpanded] = useState(false);
  const [expandedWidth, setExpandedWidth] = useState(300);
  useEffect(() => {
    const el = surface.current;
    if (!el) return;
    const fit = () => {
      const { width, height } = el.getBoundingClientRect();
      const compact = width < 600 || height < 440;
      el.style.setProperty('--paper-scale', String(Math.max(.1, Math.min(1.5, (width - (compact ? 24 : 48)) / 300, (height - (compact ? 24 : 48)) / 420))));
    };
    fit();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null;
    observer?.observe(el);
    return () => observer?.disconnect();
  }, []);
  return <div ref={surface} className="ed-workbench" data-tilt-zone="">
    <picture className="ed-workbench-photo" aria-hidden="true"><source srcSet="assets/editorial/studio-workbench.avif" type="image/avif" /><img src="assets/editorial/studio-workbench.webp" alt="" width="1536" height="1024" decoding="async" /></picture>
    <div ref={paper} className="ed-workbench-paper">{page === 'card' ? <CardThumb event={event} content={content} width={300} motion={motion} label={`معاينة البطاقة: ${CARD_NAMES[content.cardId] ?? 'دعوتك'}`} /> : <article className="ed-copy-paper" aria-label={page === 'message' ? 'معاينة كلمة الدعوة' : 'معاينة البرنامج'}><LogoMark size={28} /><p className="ed-copy-names">{headingNames}</p><h2>{page === 'message' ? 'يسعدنا حضورك.' : 'لحظات ننتظرك فيها.'}</h2><div className="ed-copy-body">{page === 'message' ? <><p className="ed-copy-message">{content.message.ar || 'اكتب كلمة دعوتك، وستظهر هنا.'}</p>{content.message.en && <p className="ed-copy-english" lang="en" dir="ltr">{content.message.en}</p>}</> : <ol className="ed-copy-program">{content.program.map((p,i) => <li key={i}><bdi className="num">{formatTime(p.time)}</bdi><span>{p.ar}{p.en && <small lang="en" dir="ltr">{p.en}</small>}</span></li>)}</ol>}</div><span className="ed-copy-foot">ضيوفي · {event.venue.name}</span></article>}</div>
    <span className="ed-workbench-mark" aria-hidden="true"><LogoMark size={26} /></span>
    <span className="ed-workbench-caption">{caption ?? <>{CARD_NAMES[content.cardId] ?? 'دعوتك'} <span aria-hidden="true">·</span> تتغيّر مع كتابتك</>}</span>
    {expandable && page === 'card' && <IconButton className="ed-workbench-expand" icon="expand" label="تكبير البطاقة" onClick={() => { setExpandedWidth(Math.min(420, window.innerWidth - 56, (window.innerHeight - 184) / 1.4)); setExpanded(true); }} />}
    {expanded && <Dialog open title="البطاقة بحجم أكبر" size="lg" onClose={() => setExpanded(false)} className="ed-expanded-dialog" footer={<Button variant="primary" onClick={() => setExpanded(false)}>العودة للتعديل</Button>}><div className="ed-expanded-paper"><CardThumb event={event} content={content} width={expandedWidth} label="معاينة البطاقة بحجم أكبر" /></div></Dialog>}
  </div>;
}
