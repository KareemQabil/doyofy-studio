import { useState } from 'react';
import type { EventType } from '../../domain/types';
import { EVENT_TYPES, eventTypeInfo, OCCASION_GROUPS, type OccasionGroup } from '../../domain/event';
import { OccasionArtwork } from '../occasions/OccasionArtwork';
import { Icon } from '../../ui';
/** A poster selection with one confirm action; detail controls appear only after selection. */
export function BahjaOccasions({ value, onChange }: { value: EventType|null; onChange:(t:EventType)=>void }) {
  const [group,setGroup]=useState<OccasionGroup|'all'>('all');
  const items=EVENT_TYPES.filter(t=>group==='all'||t.group===group);
  const current=value?eventTypeInfo(value):null;
  return <div className="bahja-chooser"><header><p className="bahja-overline">نبدأ من اللحظة</p><h2>اختر فرحتك.<br/><em>الباقي علينا.</em></h2><p>لكل مناسبة قالب جاهز. ما تحتاج تختار كل تفصيلة الآن.</p></header><div className="bahja-picker-layout"><div><nav className="bahja-categories" aria-label="أنواع المناسبات">{[{id:'all',label:'الكل'},...OCCASION_GROUPS].map(g=><button type="button" key={g.id} aria-pressed={group===g.id} onClick={()=>setGroup(g.id as OccasionGroup|'all')}>{g.label}</button>)}</nav><div className="bahja-choice-grid" role="group" aria-label="اختر المناسبة">{items.map((t,i)=><button type="button" key={t.id} aria-pressed={value===t.id} onClick={()=>onChange(t.id)}><span>{String(i+1).padStart(2,'0')}</span><strong>{t.label}</strong><Icon name={value===t.id?'check':'plus'} size="sm"/></button>)}</div></div><aside className="bahja-choice-preview"><div><OccasionArtwork type={value??'other'} framed={false}/></div><p className="bahja-overline">{current?.line??'لكل لحظة مكان'}</p><h3>{current?.label??'وش المناسبة؟'}</h3><p>نضيف الأسماء والموعد والمكان، وتطلع دعوتك جاهزة للمراجعة.</p></aside></div></div>;
}
