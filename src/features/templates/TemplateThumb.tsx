/**
 * A template preset as a still poster: the real 2D setting with the real card face standing in it
 * — rendered with the event's own
 * names and date. Scenes stay paused; on hover (fine pointer, motion allowed) they come alive.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { TemplatePreset } from '../../domain/templates';
import { loadEngine } from '../invitation/engine';

const faces = new Map<string, string>();

export function TemplateThumb({ preset, invitation, className = '' }: { preset: TemplatePreset; invitation: unknown; className?: string }) {
  const frame = useRef<HTMLSpanElement>(null);
  const [art, setArt] = useState<{ scene: string; card: string } | null>(null);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!frame.current || typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => { if (entry?.isIntersecting) { setVisible(true); observer.disconnect(); } }, { rootMargin: '240px' });
    observer.observe(frame.current);
    return () => observer.disconnect();
  }, []);
  const invKey = JSON.stringify(invitation);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    setFailed(false);
    loadEngine().then((eng) => {
      if (!alive) return;
      const k = `${preset.cardId}|${invKey}`;
      if (!faces.has(k)) { if (faces.size > 80) faces.delete(faces.keys().next().value!); faces.set(k, eng.cardFaceHtml(preset.cardId, invitation)); }
      setArt({ scene: eng.sceneArtHtml(preset.sceneId), card: faces.get(k)! });
    }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [preset.cardId, preset.sceneId, invKey, visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // fit the 390×844 stage / 300×420 card to the frame width
  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    const fit = () => {
      const w = el.clientWidth;
      el.style.setProperty('--k', String(w / 390));
      el.style.setProperty('--kc', String((w * 0.769) / 300));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <span ref={frame} className={`tpl-thumb ${className}`} aria-hidden="true">
      {failed ? <span className="tpl-fallback">افتح لمعاينة القالب</span> : !art ? <span className="tpl-skel" /> : (
        <span className="tpl-media">
          <span className="tpl-stage" dangerouslySetInnerHTML={{ __html: art.scene }} />
          <span className="tpl-stage tpl-stage-card"><span className="tpl-mini-card" dangerouslySetInnerHTML={{ __html: art.card }} /></span>
        </span>
      )}
    </span>
  );
}
