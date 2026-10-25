/**
 * The real invitation (Invitation Studio engine), embedded and live.
 * - card / setting / text changes update IN PLACE (no replay of the opening — Interaction System)
 * - an experience change (2D/3D, animated/static) rebuilds the preview, as the engine requires
 * - `replayToken` changes → the opening plays again (explicit "replay" only)
 */
import { useEffect, useRef, useState } from 'react';
import type { InvitationDesignContent } from '../../domain/types';
import { loadEngine } from './engine';
import { Button } from '../../ui';
import type { Studio } from '../../studio/Studio.js';

export function LivePreview({ invitation, content, start, replayToken = 0, muted = true, className = '', label = 'معاينة حية للدعوة' }: {
  invitation: unknown;
  content: Pick<InvitationDesignContent, 'cardId' | 'sceneId' | 'experience'>;
  start?: 'intro' | 'card';
  replayToken?: number;
  /** sound in the preview (rebuilds the preview when toggled) */
  muted?: boolean;
  className?: string;
  label?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading'|'ready'|'error'>('loading');
  const [retry, setRetry] = useState(0);
  const studio = useRef<Studio | null>(null);
  const latest = useRef({ invitation, content, start });
  latest.current = { invitation, content, start };
  const expKey = `${content.experience.dimension}|${content.experience.motion}|${muted}`;
  const invKey = JSON.stringify(invitation);

  useEffect(() => {
    let alive = true;
    setState('loading');
    let s: Studio | null = null;
    loadEngine().then((eng) => {
      if (!alive || !host.current) return;
      const el = document.createElement('div');
      host.current.replaceChildren(el);
      const { invitation: inv, content: c, start: st } = latest.current;
      s = new eng.Studio(el, {
        invitation: inv, card: c.cardId, scene: c.sceneId, experience: { ...c.experience },
        assetBase: 'assets/', embedded: true, showSwitcher: false, muted, params: new URLSearchParams(), start: st,
      });
      studio.current = s;
      setState('ready');
      (window as unknown as { __studio?: unknown }).__studio = s; // QA hook
    }).catch(() => { if (alive) setState('error'); });
    return () => { alive = false; s?.destroy(); if (studio.current === s) studio.current = null; };
  }, [expKey, retry]);

  useEffect(() => { studio.current?.setCard(content.cardId); }, [content.cardId]);
  useEffect(() => { studio.current?.setScene(content.sceneId); }, [content.sceneId]);
  useEffect(() => {
    const t = setTimeout(() => studio.current?.setContent(latest.current.invitation), 220);
    return () => clearTimeout(t);
  }, [invKey]);
  useEffect(() => { if (replayToken) studio.current?.replay(); }, [replayToken]);

  return <div className={`live-preview ${className}`} role="region" aria-label={label}><div ref={host} />{state !== 'ready' && <div className="live-preview-status" role="status">{state === 'loading' ? 'تجهيز المعاينة…' : <><span>تعذّر فتح المعاينة.</span><Button size="sm" onClick={()=>setRetry(n=>n+1)}>أعد المحاولة</Button></>}</div>}</div>;
}
