import { useEffect, useRef, type KeyboardEvent } from 'react';
import type { Event, InvitationDesignContent } from '../../domain/types';
import { applyPreset, type TemplatePreset } from '../../domain/templates';
import { Button, Icon, IconButton } from '../../ui';
import { useCopy } from '../../ui/copy';
import { EditorWorkbench } from '../editor/EditorWorkbench';
import { CopyField } from '../shared/CopyField';
import { useTemplateShare } from './template-share';

/** Native vertical scrolling, with one snap point per design. Only the visible design and its neighbours render art. */
export function TemplateFeed({ presets, preset, event, base, current, pending, onNavigate, onPreview, onUse, showUse = true }: {
  presets: TemplatePreset[]; preset: TemplatePreset; event: Event; base: InvitationDesignContent; current?: string; pending: boolean;
  onNavigate: (p: TemplatePreset) => void; onPreview: (p: TemplatePreset) => void; onUse: (p: TemplatePreset) => void; showUse?: boolean;
}) {
  const { t } = useCopy();
  const { share, copyUrl } = useTemplateShare(event.type);
  const scroll = useRef<HTMLDivElement>(null);
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined);
  const observed = useRef<number | null>(null);
  const index = Math.max(0, presets.findIndex(p => p.cardId === preset.cardId));
  const indexRef = useRef(index);
  indexRef.current = index;
  const firstMount = useRef(true);
  const catalogueKey = presets.map(p => p.cardId).join('|');
  useEffect(() => {
    const node = scroll.current;
    if (!node) return;
    if (observed.current === index) { observed.current = null; return; }
    const top = index * node.clientHeight;
    if (typeof node.scrollTo === 'function') node.scrollTo({ top, behavior: firstMount.current || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    else node.scrollTop = top;
    firstMount.current = false;
  }, [index, catalogueKey]);
  useEffect(() => {
    const node = scroll.current;
    const observer = node && typeof ResizeObserver === 'function' ? new ResizeObserver(() => { node.scrollTop = indexRef.current * node.clientHeight; }) : null;
    if (node) observer?.observe(node);
    return () => { observer?.disconnect(); clearTimeout(settle.current); };
  }, []);
  const select = (next: number) => { const p = presets[next]; if (p && !pending) onNavigate(p); };
  const keyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const next = e.key === 'ArrowDown' || e.key === 'PageDown' ? index + 1 : e.key === 'ArrowUp' || e.key === 'PageUp' ? index - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? presets.length - 1 : null;
    if (next === null) return;
    e.preventDefault(); select(next);
  };
  return <div className="template-feed">
    <div ref={scroll} className="template-feed-scroll" tabIndex={0} role="region" aria-label={t('templateBrowse')} aria-roledescription="معرض عمودي" onKeyDown={keyDown}
      onScroll={() => {
        clearTimeout(settle.current);
        settle.current = setTimeout(() => {
          const node = scroll.current;
          if (!node || !node.clientHeight || pending) return;
          const at = Math.max(0, Math.min(presets.length - 1, Math.round(node.scrollTop / node.clientHeight)));
          if (at !== indexRef.current) { observed.current = at; select(at); }
        }, 100);
      }}>
      {presets.map((p, i) => <article key={p.cardId} className={`template-feed-slide${i === index ? ' is-active' : ''}`} aria-hidden={i !== index} inert={i !== index}>
        {Math.abs(index - i) <= 1 ? <EditorWorkbench event={event} content={applyPreset(base, p)} caption={p.name} motion={i === index ? 1 : 0} /> : <div className="template-feed-placeholder"><Icon name="envelope" size="lg" /></div>}
        {current === p.id && <span className="template-feed-current"><Icon name="check" size="sm" />التصميم الحالي</span>}
      </article>)}
    </div>
    <div className="template-feed-meta"><div className="template-feed-title"><h3>{preset.name}</h3><p>{preset.line}</p></div><div className="template-feed-nav">
      <IconButton icon="chevron-up" label="التصميم السابق" onClick={() => select(index - 1)} disabled={pending || index === 0} />
      <span className="num" aria-live="polite" aria-atomic="true">{index + 1} / {presets.length}</span>
      <IconButton icon="chevron-down" label="التصميم التالي" onClick={() => select(index + 1)} disabled={pending || index === presets.length - 1} />
    </div></div>
    <p className="template-feed-hint"><Icon name="chevron-up" size="sm" />{t('templateSwipe')}</p>
    <div className="template-feed-actions">
      {showUse && <Button variant="primary" loading={pending} onClick={() => onUse(preset)}>{t('templateUse')}</Button>}
      <Button variant="secondary" icon="play" disabled={pending} onClick={() => onPreview(preset)}>{t('previewInvitation')}</Button>
      <IconButton icon="share" label={t('templateShare')} disabled={pending} onClick={() => void share(preset)} />
    </div>
    {copyUrl && <CopyField label="رابط التصميم — انسخه للمشاركة" value={copyUrl} />}
  </div>;
}
