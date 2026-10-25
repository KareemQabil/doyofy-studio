/** A static card face from the Invitation Studio, scaled to any width (event content merged in). */
import { useEffect, useState } from 'react';
import type { Event, InvitationDesignContent } from '../../domain/types';
import { toInvitationData } from '../../domain/invitation';
import { loadEngine } from './engine';

export function CardThumb({ event, content, width = 180, label }: { event: Event; content: InvitationDesignContent; width?: number; label?: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const inv = JSON.stringify(toInvitationData(event, content));
  useEffect(() => {
    let alive = true;
    setFailed(false);
    loadEngine().then((eng) => { if (alive) setHtml(eng.cardFaceHtml(content.cardId, JSON.parse(inv))); }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [content.cardId, inv]);
  const scale = width / 300;
  return (
    <span className="card-thumb" style={{ width, height: 420 * scale }} aria-label={label} role={label ? 'img' : undefined}>
      {failed ? <span className="ed-card-load-error" role="status">تعذر عرض البطاقة. أعد تحميل الصفحة.</span> : html ? <span className="card-thumb-inner" style={{ transform: `scale(${scale})` }} dangerouslySetInnerHTML={{ __html: html }} aria-hidden="true" /> : <span className="card-thumb-skel" />}
    </span>
  );
}
