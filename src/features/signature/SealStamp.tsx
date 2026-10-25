/**
 * A short authored success moment: a wax seal stamps down with a word, then lifts away (~1.3s).
 * It never blocks the next action (pointer-events: none) and the real state/announcement is rendered
 * elsewhere (banner, status). Reduced motion: a still seal that fades out.
 */
import { useEffect, useState } from 'react';
import { Seal } from './SignatureArt';

export function SealStamp({ show, label, tone = 'gold', onDone }: { show: boolean; label: string; mark?: string; tone?: 'gold' | 'charcoal' | 'turquoise' | 'red' | 'coral' | 'plum'; onDone?: () => void }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!show) return;
    setOn(true);
    const t = window.setTimeout(() => { setOn(false); onDone?.(); }, 1500);
    return () => window.clearTimeout(t);
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!on) return null;
  return (
    <div className="sig-stamp" aria-hidden="true">
      <span className="sig-stamp-ring" />
      <Seal size={120} tone={tone} className="sig-stamp-seal" />
      <span className="sig-stamp-label">{label}</span>
    </div>
  );
}
