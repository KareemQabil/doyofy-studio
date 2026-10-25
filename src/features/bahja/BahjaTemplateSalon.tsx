import { useRef, useState } from 'react';
import type { Event, InvitationDesignContent } from '../../domain/types';
import { applyPreset, type TemplatePreset } from '../../domain/templates';
import { toInvitationData } from '../../domain/invitation';
import { swipeStep } from '../../domain/gestures';
import { usePointerGesture } from '../../ui/hooks/usePointerGesture';
import { Button, IconButton } from '../../ui';
import { TemplateThumb } from '../templates/TemplateThumb';

export function BahjaTemplateSalon({ presets,event,base,current,pending,onPreview,onUse }: { presets:TemplatePreset[];event:Event;base:InvitationDesignContent;current?:string;pending:boolean;onPreview:(p:TemplatePreset)=>void;onUse:(p:TemplatePreset)=>void }) {
  const [selected,setSelected]=useState(current??''),frame=useRef<HTMLDivElement>(null);
  const index=Math.max(0,presets.findIndex(p=>p.id===selected)),preset=presets[index];
  const step=(n:number)=>{if(!pending&&presets[index+n])setSelected(presets[index+n]!.id);};
  const gesture=usePointerGesture({axis:'x',enabled:!pending,onMove:d=>frame.current?.style.setProperty('--salon-drag',`${Math.max(-80,Math.min(80,d*.4))}px`),onEnd:g=>{frame.current?.style.removeProperty('--salon-drag');if(g.moved&&!g.cancelled)step(swipeStep(g.dx,g.dy,g.duration));}});
  if(!preset)return <p role="status">لا قوالب بهذا الأسلوب.</p>;
  return <div className="bahja-salon"><div className="bahja-salon-stage" ref={frame} {...gesture} tabIndex={0} role="group" aria-label="معرض الدعوات، يسار للقالب التالي ويمين للسابق" onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.key==='ArrowLeft'){e.preventDefault();step(1);}if(e.key==='ArrowRight'){e.preventDefault();step(-1);}}}><span className="bahja-salon-sun" aria-hidden="true"/>{[-1,0,1].map(offset=>{const p=presets[index+offset];return p?<div key={p.id} className={`bahja-salon-poster${offset===0?' is-current':''}`} data-slot={offset} aria-hidden="true"><TemplateThumb preset={p} invitation={toInvitationData(event,applyPreset(base,p),2)}/></div>:null;})}</div><section className="bahja-salon-copy" aria-live="polite"><p className="bahja-overline">الشكل {String(index+1).padStart(2,'0')} / {presets.length}</p><h3>{preset.name}</h3><p>{preset.line}</p><p className="bahja-salon-note">محتوى دعوتك محفوظ. غيّر إحساسها على راحتك.</p><Button variant="primary" size="lg" loading={pending} onClick={()=>onUse(preset)} iconEnd="forward">{current===preset.id?'كمّل بهذا القالب':'هذا يشبهني'}</Button><Button variant="ghost" disabled={pending} icon="play" onClick={()=>onPreview(preset)}>شاهد الدعوة</Button><div className="bahja-salon-controls"><IconButton icon="back" label="القالب السابق" disabled={pending||index===0} onClick={()=>step(-1)}/><span>{index+1} / {presets.length}</span><IconButton icon="forward" label="القالب التالي" disabled={pending||index===presets.length-1} onClick={()=>step(1)}/></div></section><div className="bahja-salon-index" aria-label="كل أشكال الدعوة">{presets.map((p,i)=><button key={p.id} type="button" disabled={pending} aria-pressed={preset.id===p.id} onClick={()=>setSelected(p.id)}><span>{String(i+1).padStart(2,'0')}</span>{p.name}</button>)}</div></div>;
}
