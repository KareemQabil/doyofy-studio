/**
 * «توقيع» design deck (template gallery): the invitation designs as a tactile stack, each rendered live with
 * the event's names/date. The front design is described beside the deck with two clear actions:
 * «شاهد الدعوة» (deliberate full preview) and «استخدم هذا الشكل». Nothing is applied by swiping.
 * Only ±2 neighbours are mounted, so 59 live faces never render at once.
 */
import { useState } from 'react';
import type { Event, InvitationDesignContent } from '../../domain/types';
import { applyPreset, TEMPLATE_STYLES, type TemplatePreset } from '../../domain/templates';
import { Button, Icon } from '../../ui';
import { TactileDeck } from '../../ui/primitives/TactileDeck';
import { CardThumb } from '../invitation/CardThumb';

export function SignatureTemplateDeck({ presets, event, base, current, pending, onPreview, onUse }: {
  presets: TemplatePreset[]; event: Event; base: InvitationDesignContent; current?: string; pending: boolean; onPreview: (p: TemplatePreset) => void; onUse: (p: TemplatePreset) => void;
}) {
  const start = Math.max(0, presets.findIndex((p) => p.id === current));
  const [index, setIndex] = useState(start);
  const at = Math.min(index, Math.max(0, presets.length - 1));
  const p = presets[at];
  if (!p) return <p className="tg-empty" role="status">لا قوالب بهذا الأسلوب بعد.</p>;
  return (
    <div className="sig-tpl">
      <TactileDeck items={presets} index={at} onIndexChange={setIndex} getKey={(x) => x.id} window={2} disabled={pending}
        label="أشكال الدعوة — اسحب يسارًا للشكل التالي" itemLabel={(x) => x.name} activateHint="اضغط لمشاهدة الدعوة"
        onActivate={(x) => onPreview(x)} hint="اسحب لترى دعوتك بأشكال مختلفة"
        renderCard={(x, s) => (
          <span className={`sig-tpl-card${s.active ? ' is-active' : ''}`}>
            <span className="sig-tpl-tableau">
              <picture className="sig-tpl-surface" aria-hidden="true"><source srcSet="assets/editorial/studio-workbench.avif" type="image/avif" /><img src="assets/editorial/studio-workbench.webp" alt="" width="1536" height="1024" decoding="async" loading="lazy" /></picture>
              <CardThumb event={event} content={applyPreset(base, x)} width={180} />
            </span>
            {current === x.id && <span className="sig-tpl-current"><Icon name="check" size="sm" />شكلك الحالي</span>}
          </span>
        )} className="sig-tpl-deck" />
      <aside className="sig-tpl-copy" aria-live="polite">
        <p className="sig-deck-kind">{TEMPLATE_STYLES.find((s) => s.id === p.styles[0])?.label} · <span className="num">{at + 1}</span> من <span className="num">{presets.length}</span></p>
        <h3>{p.name}</h3>
        <p>{p.line}</p>
        <p className="sig-tpl-safe"><Icon name="check-circle" size="sm" />الأسماء والكلمة والبرنامج تبقى كما كتبتها.</p>
        <div className="sig-tpl-actions">
          <Button variant="primary" size="lg" loading={pending} onClick={() => onUse(p)} iconEnd="forward">{current === p.id ? 'كمّل بهذا الشكل' : 'استخدم هذا الشكل'}</Button>
          <Button variant="secondary" icon="play" disabled={pending} onClick={() => onPreview(p)}>شاهد الدعوة</Button>
        </div>
      </aside>
    </div>
  );
}
