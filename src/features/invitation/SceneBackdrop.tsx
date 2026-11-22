/**
 * The invitation's own flat setting (src/scenes/flat.js) as a backdrop: one colour field and one slow motif
 * (twinkle, drift, fall). It replaces decorative photography behind the card in the editor and the invitation
 * pages, so what surrounds the card is what the guest will see. Motion stops under reduced motion (studio.css).
 */
import { useEffect, useState } from 'react';
import { loadEngine } from './engine';

const cache = new Map<string, string>();

export function SceneBackdrop({ sceneId, className = '' }: { sceneId: string; className?: string }) {
  const [html, setHtml] = useState(() => cache.get(sceneId) ?? '');
  useEffect(() => {
    let alive = true;
    if (cache.has(sceneId)) { setHtml(cache.get(sceneId)!); return; }
    loadEngine().then((eng) => { const art = eng.sceneArtHtml(sceneId); cache.set(sceneId, art); if (alive) setHtml(art); }).catch(() => {});
    return () => { alive = false; };
  }, [sceneId]);
  return <span className={`scene-backdrop ${className}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />;
}
