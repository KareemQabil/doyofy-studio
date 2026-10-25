import {useRef,useState} from 'react';
import type {EventType} from '../../domain/types';
import {EVENT_TYPES,OCCASION_GROUPS,type OccasionGroup} from '../../domain/event';
import {normaliseForSearch} from '../../domain/parties';
import {swipeStep} from '../../domain/gestures';
import {usePointerGesture} from '../../ui/hooks/usePointerGesture';
import {Button,Icon,SearchInput} from '../../ui';
import {OccasionArtwork} from '../occasions/OccasionArtwork';
import {OrbitArtwork} from './OrbitArtwork';

export function OrbitOccasions({value,onChange,onConfirm}:{value:EventType|null;onChange:(t:EventType)=>void;onConfirm:(t:EventType)=>void}){
 const[q,setQ]=useState(''),[group,setGroup]=useState<OccasionGroup|'all'>('all');const stage=useRef<HTMLDivElement>(null);
 const items=EVENT_TYPES.filter(t=>(group==='all'||t.group===group)&&normaliseForSearch(`${t.label} ${t.line} ${t.hint}`).includes(normaliseForSearch(q)));
 const found=items.findIndex(t=>t.id===value),index=found<0?0:found,item=items[index];
 const step=(n:number)=>{if(!n||!items.length)return;onChange(items[(index+n+items.length)%items.length]!.id);};
 const gesture=usePointerGesture({axis:'x',onMove:d=>stage.current?.style.setProperty('--deck-drag',`${Math.max(-110,Math.min(110,d))}px`),onEnd:g=>{stage.current?.style.removeProperty('--deck-drag');if(g.moved&&!g.cancelled)step(swipeStep(g.dx,g.dy,g.duration));}});
 return <section className="orbit-occasion-lab"><header><p className="orbit-overline">01 · نختار اللحظة</p><h2>أي فرحة<br/>نصنع لها <em>مدارًا؟</em></h2><p>اسحب بين الحكايات، أو اختر اسم المناسبة مباشرة.</p></header>
 <div className="orbit-occasion-search"><SearchInput value={q} onChange={setQ} placeholder="ما مناسبتك؟"/><div className="orbit-category-ring" aria-label="عائلات المناسبات">{[{id:'all',label:'كل اللحظات'},...OCCASION_GROUPS].map(g=><button type="button" key={g.id} aria-pressed={group===g.id} onClick={()=>setGroup(g.id as OccasionGroup|'all')}>{g.label}</button>)}</div></div>
 {item?<><div className="orbit-occasion-stage" ref={stage} {...gesture} tabIndex={0} role="group" aria-label="تصفّح المناسبات بالسحب" onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.key==='ArrowLeft'){e.preventDefault();step(1);}if(e.key==='ArrowRight'){e.preventDefault();step(-1);}}}>
  <OrbitArtwork/><div className="orbit-occasion-object" key={item.id}><OccasionArtwork type={item.id} framed={false}/></div><span className="orbit-occasion-stamp">{String(index+1).padStart(2,'0')} / {items.length}</span><div className="orbit-occasion-title"><span>{item.line}</span><h3>{item.label}</h3></div>
 </div><div className="orbit-occasion-actions"><button type="button" aria-label="المناسبة السابقة" onClick={()=>step(-1)}><Icon name="back"/></button><Button variant="primary" iconEnd="forward" onClick={()=>onConfirm(item.id)}>هذه مناسبتي</Button><button type="button" aria-label="المناسبة التالية" onClick={()=>step(1)}><Icon name="forward"/></button></div>
 <div className="orbit-occasion-index" role="group" aria-label="كل أنواع المناسبات">{items.map(t=><button type="button" key={t.id} aria-pressed={value===t.id} onClick={()=>onChange(t.id)}>{t.label}</button>)}</div></>:<div className="orbit-empty"><h3>هذه الفرحة لا تظهر هنا بعد.</h3><p>جرّب اسمًا آخر، أو اختر «مناسبة أخرى».</p><Button onClick={()=>{setQ('');setGroup('all');}}>عرض كل المناسبات</Button></div>}
 </section>;
}
