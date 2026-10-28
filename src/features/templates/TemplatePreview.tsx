/** Browse on a light poster with RTL swipe; activate the real cinematic experience explicitly. */
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { Event, InvitationDesignContent } from '../../domain/types';
import { toInvitationData } from '../../domain/invitation';
import { applyPreset, type TemplatePreset } from '../../domain/templates';
import { swipeStep } from '../../domain/gestures';
import { usePointerGesture } from '../../ui/hooks/usePointerGesture';
import { Button, Dialog, Icon, IconButton } from '../../ui';
import { LivePreview } from '../invitation/LivePreview';
import { TemplateThumb } from './TemplateThumb';
import { EditorWorkbench } from '../editor/EditorWorkbench';
import { SCENE_NAMES } from '../../domain/invitation';

export function TemplatePreview({ presets, preset, event, base, isCurrent, pending, onNavigate, onClose, onUse }: {
  presets: TemplatePreset[]; preset: TemplatePreset; event: Event; base: InvitationDesignContent; isCurrent: boolean; pending: boolean;
  onNavigate: (p: TemplatePreset) => void; onClose: () => void; onUse: (p: TemplatePreset) => void;
}) {
  const variants = presets.filter(p => p.cardId === preset.cardId);
  const railPresets = presets.filter((p, index) => presets.findIndex(x => x.cardId === p.cardId) === index).map(p => p.cardId === preset.cardId ? preset : p);
  const i=railPresets.findIndex(p=>p.cardId===preset.cardId),content=applyPreset(base,preset),invitation=toInvitationData(event,content,2);
  const [replay,setReplay]=useState(0),[playingId,setPlayingId]=useState<string|null>(null);
  const playing=playingId===preset.id;
  const surface=useRef<HTMLDivElement>(null),rail=useRef<HTMLDivElement>(null);
  useEffect(()=>{setReplay(0);setPlayingId(null);rail.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.scrollIntoView?.({block:'nearest',inline:'center',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});},[preset.id]);
  const step=(d:number)=>{if(!d)return;const n=railPresets[i+d];if(n&&!pending)onNavigate(n);};
  const gesture=usePointerGesture({axis:'x',enabled:!playing&&!pending,
    onMove:d=>surface.current?.style.setProperty('--browse-drag',`${Math.max(-90,Math.min(90,d*.35))}px`),
    onEnd:g=>{surface.current?.style.removeProperty('--browse-drag');if(g.moved&&!g.cancelled)step(swipeStep(g.dx,g.dy,g.duration));}
  });
  const onKey=(e:KeyboardEvent)=>{if(e.target!==e.currentTarget||playing)return;if(e.key==='ArrowLeft'){e.preventDefault();step(1);}if(e.key==='ArrowRight'){e.preventDefault();step(-1);}};
  return <Dialog open size="xl" className="tp" gestureDismiss dismissible={!pending} onClose={onClose} title={preset.name} description={`${i+1} من ${railPresets.length} · معروض باسم مناسبتك`} footer={<><Button variant="ghost" onClick={onClose} disabled={pending}>رجوع</Button><Button variant="primary" size="lg" loading={pending} onClick={()=>onUse(preset)} data-autofocus>{isCurrent?'متابعة بهذا القالب':'استخدم هذا القالب'}</Button></>}>
    <div className="tp-body">
      <div className={`tp-stage${playing?' is-playing':''}`} ref={surface} {...gesture} tabIndex={0} onKeyDown={onKey} aria-label="معاينة القالب؛ اسحب أفقيًا أو استخدم السهمين للتنقل">
        {playing?<LivePreview key={preset.id} start="card" className="tp-screen" invitation={invitation} content={content} muted={false} replayToken={replay} label={`معاينة قالب ${preset.name}`}/>:<><div className="tp-poster tp-stationery"><EditorWorkbench event={event} content={content} caption={preset.name} /></div><span className="tp-swipe-hint"><Icon name="back" size="sm"/>اسحب لتكتشف<Icon name="forward" size="sm"/></span></>}
      </div>
      <div className="tp-info"><p className="eyebrow">لمسة تليق بفرحتكم</p><h3 className="tp-line">{preset.name}</h3><p className="tp-description">{preset.line}</p><p className="tp-note">شكل الدعوة يتغيّر. أسماؤكم وكلماتكم تبقى كما هي.</p>
        {playing?<div className="row wrap gap-2"><Button variant="secondary" size="sm" icon="play" onClick={()=>setReplay(n=>n+1)}>أعد العرض</Button><Button variant="ghost" size="sm" onClick={()=>setPlayingId(null)}>إلى الصورة</Button></div>:<Button variant="secondary" icon="play" onClick={()=>setPlayingId(preset.id)}>شاهد التجربة</Button>}
        <div className="tp-nav"><IconButton icon="back" label="القالب السابق" variant="secondary" onClick={()=>step(-1)} disabled={pending||i<=0}/><span className="num faint t-sm" aria-live="polite">{i+1} / {railPresets.length}</span><IconButton icon="forward" label="القالب التالي" variant="secondary" onClick={()=>step(1)} disabled={pending||i<0||i>=railPresets.length-1}/></div>
        {variants.length > 1 && <div className="tp-scenes"><p>خلفيات هذا التصميم</p><div className="tp-scenes-row">{variants.map(p => <button key={p.id} type="button" className="tp-scene" aria-label={`أجواء ${SCENE_NAMES[p.sceneId]}`} aria-pressed={p.id === preset.id} disabled={pending} onClick={() => onNavigate(p)}><TemplateThumb preset={p} invitation={toInvitationData(event,applyPreset(base,p),2)} /><span>{SCENE_NAMES[p.sceneId]}{p.experience.dimension === '3d' ? ' · مجسّم' : ''}</span></button>)}</div></div>}
        <div ref={rail} className="tp-rail" aria-label="اختيار قالب سريع">{railPresets.map(p=><button type="button" key={p.id} className="tp-rail-item" aria-label={p.name} aria-pressed={p.cardId===preset.cardId} disabled={pending} data-gesture-ignore onClick={()=>onNavigate(p)}><TemplateThumb preset={p} invitation={toInvitationData(event,applyPreset(base,p),2)}/></button>)}</div>
      </div>
    </div>
  </Dialog>;
}
