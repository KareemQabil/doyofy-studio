/** A full-height design feed; opening the invitation is a separate, deliberate action. */
import { useEffect, useState } from 'react';
import type { Event, InvitationDesignContent } from '../../domain/types';
import { SCENE_NAMES, toInvitationData } from '../../domain/invitation';
import { applyPreset, type TemplatePreset } from '../../domain/templates';
import { Button, Dialog } from '../../ui';
import { useCopy } from '../../ui/copy';
import { LivePreview } from '../invitation/LivePreview';
import { TemplateThumb } from './TemplateThumb';
import { TemplateFeed } from './TemplateFeed';

export function TemplatePreview({ presets, preset, event, base, isCurrent, pending, onNavigate, onClose, onUse }: {
  presets: TemplatePreset[]; preset: TemplatePreset; event: Event; base: InvitationDesignContent; isCurrent: boolean; pending: boolean;
  onNavigate: (p: TemplatePreset) => void; onClose: () => void; onUse: (p: TemplatePreset) => void;
}) {
  const { t } = useCopy();
  const variants = presets.filter(p => p.cardId === preset.cardId);
  const designs = presets.filter((p, i) => presets.findIndex(x => x.cardId === p.cardId) === i).map(p => p.cardId === preset.cardId ? preset : p);
  const content = applyPreset(base, preset);
  const invitation = toInvitationData(event, content, event.settings.defaultPartySize);
  const [playing, setPlaying] = useState(false);
  const [replay, setReplay] = useState(0);
  useEffect(() => { setPlaying(false); setReplay(0); }, [preset.id]);
  return <Dialog open size="xl" className="tp tp-feed-dialog" dismissible={!pending} onClose={onClose} title={t('templateBrowse')}
    description="التصميم باسم مناسبتك. لا يتغيّر شيء حتى تختار استخدامه."
    footer={<><Button variant="ghost" onClick={onClose} disabled={pending}>{t('back')}</Button><Button variant="primary" size="lg" loading={pending} onClick={() => onUse(preset)}>{isCurrent ? 'متابعة بالتصميم الحالي' : t('templateUse')}</Button></>}>
    {playing ? <div className="template-full-experience"><div className="template-full-screen"><LivePreview key={preset.id} start="intro" invitation={invitation} content={content} muted={false} replayToken={replay} label={t('previewInvitation')} /></div><div className="template-full-controls"><Button size="sm" variant="secondary" icon="play" onClick={() => setReplay(n => n + 1)}>إعادة من البداية</Button><Button size="sm" variant="ghost" onClick={() => setPlaying(false)}>{t('templateBrowse')}</Button></div></div>
      : <TemplateFeed presets={designs} preset={preset} event={event} base={base} current={isCurrent ? preset.id : undefined} pending={pending} onNavigate={onNavigate} onPreview={() => setPlaying(true)} onUse={onUse} showUse={false} />}
    {!playing && variants.length > 1 && <details className="template-scene-options"><summary>تغيير الخلفية <span>اختياري · {variants.length} خيارات</span></summary><div className="tp-scenes-row">{variants.map(p => <button key={p.id} type="button" className="tp-scene" aria-label={`خلفية ${SCENE_NAMES[p.sceneId]}`} aria-pressed={p.id === preset.id} disabled={pending} onClick={() => onNavigate(p)}><TemplateThumb preset={p} invitation={toInvitationData(event, applyPreset(base, p), event.settings.defaultPartySize)} /><span>{SCENE_NAMES[p.sceneId]}</span></button>)}</div></details>}
  </Dialog>;
}
