/** read-only link + copy button with a polite confirmation (falls back to selecting the text) */
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '../../ui';
import { useCopy } from '../../ui/copy';

export async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

export function CopyField({ label, value, hint, onCopied }: { label: string; value: string; hint?: string; onCopied?: () => void }) {
  const id = useId();
  const ref = useRef<HTMLInputElement>(null);
  const { t } = useCopy();
  const [msg, setMsg] = useState<'' | 'copied' | 'selected'>('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>{label}</label>
      <div className="copy-row">
        <input id={id} ref={ref} className="input copy-input" readOnly dir="ltr" value={value} onFocus={(e) => e.currentTarget.select()} />
        <Button icon={msg==='copied'?'check':'copy'} onClick={async () => {
          if (await copyText(value)) { setMsg('copied'); onCopied?.(); }
          else { ref.current?.select(); setMsg('selected'); }
          clearTimeout(timer.current); timer.current = setTimeout(() => setMsg(''), 3000);
        }}>{msg === 'copied' ? t('shCopiedShort') : t('shCopy')}</Button>
      </div>
      <p className="field-hint" role="status" aria-live="polite">{msg === 'copied' ? t('linkCopied') : msg === 'selected' ? t('shSelected') : hint}</p>
    </div>
  );
}
