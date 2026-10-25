import {useRef,useState} from 'react';
import type {Event,InvitationDesignContent} from '../../domain/types';
import {applyPreset,type TemplatePreset} from '../../domain/templates';
import {toInvitationData} from '../../domain/invitation';
import {swipeStep} from '../../domain/gestures';
import {usePointerGesture} from '../../ui/hooks/usePointerGesture';
import {Button,Icon} from '../../ui';
import {TemplateThumb} from '../templates/TemplateThumb';
import {OrbitArtwork} from './OrbitArtwork';

export function OrbitTemplateDesk({presets,event,base,current,pending,onPreview,onUse}:{presets:TemplatePreset[];event:Event;base:InvitationDesignContent;current?:string;pending:boolean;onPreview:(p:TemplatePreset)=>void;onUse:(p:TemplatePreset)=>void}){
 const [focused,setFocused]=useState(current??''),stage=useRef<HTMLDivElement>(null),index=Math.max(0,presets.findIndex(p=>p.id===focused)),preset=presets[index];
 const step=(d:number)=>{const p=presets[index+d];if(!pending&&p)setFocused(p.id);};
 const gesture=usePointerGesture({axis:'x',enabled:!pending,onMove:d=>stage.current?.style.setProperty('--deck-drag',`${Math.max(-100,Math.min(100,d*.65))}px`),onEnd:g=>{stage.current?.style.removeProperty('--deck-drag');if(!g.cancelled&&g.moved){const d=swipeStep(g.dx,g.dy,g.duration);if(d)step(d);}}});
 if(!preset)return <p className="tg-empty">لا قوالب بهذا الأسلوب بعد.</p>;
 return <div className="orbit-template-desk"><div className="orbit-template-stage" ref={stage} {...gesture} tabIndex={0} role="group" aria-label="منضدة القوالب؛ اسحب للتصفّح" onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.key==='ArrowLeft'){e.preventDefault();step(1);}if(e.key==='ArrowRight'){e.preventDefault();step(-1);}}}>
  <OrbitArtwork/>{[-1,0,1].map(offset=>{const p=presets[index+offset];return p?<div key={p.id} className={`orbit-desk-poster${offset===0?' is-front':''}`} data-slot={offset} aria-hidden="true"><TemplateThumb preset={p} invitation={toInvitationData(event,applyPreset(base,p),2)}/></div>:null;})}<span className="orbit-desk-stamp">اسحب لتغيّر الإحساس <Icon name="motion" size="sm"/></span>
 </div><section className="orbit-template-copy" aria-live="polite"><p className="orbit-overline">شكل {String(index+1).padStart(2,'0')} / {presets.length}</p><h3>{preset.name}</h3><p>{preset.line}</p><span>نفس أسمائكم وكلماتكم. إحساس مختلف.</span><div className="orbit-template-actions"><Button variant="primary" loading={pending} onClick={()=>onUse(preset)} iconEnd="forward">{current===preset.id?'تابع بهذا الشكل':'اعتمد هذا الشكل'}</Button><Button variant="secondary" disabled={pending} onClick={()=>onPreview(preset)} icon="play">تأمّل الدعوة</Button></div><div className="orbit-template-arrows"><button type="button" aria-label="الشكل السابق" disabled={pending||index===0} onClick={()=>step(-1)}><Icon name="back"/></button><span>{index+1} / {presets.length}</span><button type="button" aria-label="الشكل التالي" disabled={pending||index===presets.length-1} onClick={()=>step(1)}><Icon name="forward"/></button></div></section>
 <div className="orbit-template-index" aria-label="الوصول إلى كل القوالب">{presets.map((p,i)=><button type="button" key={p.id} aria-pressed={preset.id===p.id} disabled={pending} onClick={()=>setFocused(p.id)}><span>{String(i+1).padStart(2,'0')}</span>{p.name}</button>)}</div></div>;
}
