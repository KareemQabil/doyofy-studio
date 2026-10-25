import { useEffect, useRef } from 'react';
import type { Event, InvitationDesignContent } from '../../domain/types';
import { CARD_NAMES } from '../../domain/invitation';
import { CardThumb } from '../invitation/CardThumb';
import { LogoMark } from '../../ui/brand';
import { useTilt } from '../signature/useTilt';
import { resolvedNames } from '../../domain/invitation';
import { isCoupleEvent } from '../../domain/event';
import { formatTime } from '../../domain/format';
export type WorkbenchPage = 'card' | 'message' | 'program';

/** The editable face stays actual HTML. Photography only supplies the studio's material surface. */
export function EditorWorkbench({ event, content, caption, page = 'card' }: { event: Event; content: InvitationDesignContent; caption?: string; page?: WorkbenchPage }) {
  const names = resolvedNames(event, content);
  const headingNames = isCoupleEvent(event.type) && names.b ? `${names.a} و ${names.b}` : names.a;
  const surface = useRef<HTMLDivElement>(null);
  const paper = useTilt<HTMLDivElement>(3);
  useEffect(() => {
    const el = surface.current;
    if (!el) return;
    const fit = () => {
      const { width, height } = el.getBoundingClientRect();
      el.style.setProperty('--paper-scale', String(Math.max(.1, Math.min(1.12, (width - 64) / 300, (height - 72) / 420))));
    };
    fit();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null;
    observer?.observe(el);
    return () => observer?.disconnect();
  }, []);
  return <div ref={surface} className="ed-workbench" data-tilt-zone="">
    <picture className="ed-workbench-photo" aria-hidden="true"><source srcSet="assets/editorial/studio-workbench.avif" type="image/avif" /><img src="assets/editorial/studio-workbench.webp" alt="" width="1536" height="1024" decoding="async" /></picture>
    <div ref={paper} className="ed-workbench-paper">{page === 'card' ? <CardThumb event={event} content={content} width={300} label={`معاينة البطاقة: ${CARD_NAMES[content.cardId] ?? 'دعوتك'}`} /> : <article className="ed-copy-paper" aria-label={page === 'message' ? 'معاينة كلمة الدعوة' : 'معاينة البرنامج'}><LogoMark size={28} /><p className="ed-copy-names">{headingNames}</p><h2>{page === 'message' ? 'يسعدنا حضورك.' : 'لحظات ننتظرك فيها.'}</h2><div className="ed-copy-body">{page === 'message' ? <><p className="ed-copy-message">{content.message.ar || 'اكتب كلمة دعوتك، وستظهر هنا.'}</p>{content.message.en && <p className="ed-copy-english" lang="en" dir="ltr">{content.message.en}</p>}</> : <ol className="ed-copy-program">{content.program.map((p,i) => <li key={i}><bdi className="num">{formatTime(p.time)}</bdi><span>{p.ar}{p.en && <small lang="en" dir="ltr">{p.en}</small>}</span></li>)}</ol>}</div><span className="ed-copy-foot">ضيوفي · {event.venue.name}</span></article>}</div>
    <span className="ed-workbench-mark" aria-hidden="true"><LogoMark size={26} /></span>
    <span className="ed-workbench-caption">{caption ?? <>{CARD_NAMES[content.cardId] ?? 'دعوتك'} <span aria-hidden="true">·</span> تتغيّر مع كتابتك</>}</span>
  </div>;
}
