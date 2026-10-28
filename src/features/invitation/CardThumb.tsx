/** A card face from the Invitation Studio, scaled to any width (event content merged in).
 *  `motion` (a replay token > 0) plays the face's entrance when the face first appears, when the card changes and
 *  whenever the token changes — never while the organizer types (text updates keep the face at rest). */
import { useEffect, useRef, useState } from 'react';
import type { Event, InvitationDesignContent } from '../../domain/types';
import { toInvitationData } from '../../domain/invitation';
import { loadEngine } from './engine';

export function CardThumb({ event, content, width = 180, label, motion = 0 }: { event: Event; content: InvitationDesignContent; width?: number; label?: string; motion?: number }) {
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const inv = JSON.stringify(toInvitationData(event, content));
  useEffect(() => {
    let alive = true;
    setFailed(false);
    loadEngine().then((eng) => { if (alive) setHtml(eng.cardFaceHtml(content.cardId, JSON.parse(inv))); }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [content.cardId, inv]);
  const inner = useRef<HTMLSpanElement>(null);
  const played = useRef('');
  useEffect(() => {
    const el = inner.current;
    if (!motion || !html || !el) return;
    const key = `${content.cardId}|${motion}`;
    if (played.current === key) return;
    played.current = key;
    let handle: { revert(): void } | null = null, alive = true;
    loadEngine().then((eng) => { if (alive) handle = eng.playCardMotion(el); }).catch(() => {});
    return () => { alive = false; handle?.revert(); };
  }, [html, motion, content.cardId]);
  const scale = width / 300;
  return (
    <span className="card-thumb" style={{ width, height: 420 * scale }} aria-label={label} role={label ? 'img' : undefined}>
      {failed ? <span className="ed-card-load-error" role="status">تعذر عرض البطاقة. أعد تحميل الصفحة.</span> : html ? <span ref={inner} className="card-thumb-inner" style={{ transform: `scale(${scale})` }} dangerouslySetInnerHTML={{ __html: html }} aria-hidden="true" /> : <span className="card-thumb-skel" />}
    </span>
  );
}
