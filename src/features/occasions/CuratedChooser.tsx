import { useRef, useState } from 'react';
import type { EventType } from '../../domain/types';
import { EVENT_TYPES, OCCASION_GROUPS, type OccasionGroup } from '../../domain/event';
import { normaliseForSearch } from '../../domain/parties';
import { Button, EmptyState, SearchInput } from '../../ui';
import { OccasionCard } from './OccasionCard';

/** Direct selection: every occasion is discoverable without scrolling a carousel. */
export function CuratedChooser({ value, onChange }: { value: EventType | null; onChange: (type: EventType) => void }) {
  const [q,setQ]=useState('');
  const [group,setGroup]=useState<OccasionGroup|'all'>('all');
  const grid=useRef<HTMLDivElement>(null);
  const items=EVENT_TYPES.filter(t=>(group==='all'||t.group===group)&&normaliseForSearch(`${t.label} ${t.line} ${t.hint}`).includes(normaliseForSearch(q)));
  const tabbable=items.some(t=>t.id===value)?value:items[0]?.id;
  return <div className="curated-chooser">
    <div className="occasion-discovery"><div className="occasion-categories" aria-label="أنواع المناسبات">{[{id:'all',label:'كل المناسبات'},...OCCASION_GROUPS].map(g=><button key={g.id} type="button" aria-pressed={group===g.id} className={group===g.id?'is-current':''} onClick={()=>setGroup(g.id as OccasionGroup|'all')}>{g.label}</button>)}</div><SearchInput value={q} onChange={setQ} placeholder="ابحث عن مناسبتك" /></div>
    {!items.length?<EmptyState compact icon="search" title="لم نجد هذه المناسبة" action={<Button onClick={()=>{setQ('');setGroup('all');}}>عرض كل المناسبات</Button>}>جرّب اسمًا آخر، أو اختر «مناسبة أخرى».</EmptyState>:<div ref={grid} className="occasion-catalogue" role="radiogroup" aria-label="اختر نوع المناسبة" onKeyDown={e=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
      const buttons=Array.from(grid.current!.querySelectorAll<HTMLButtonElement>('[role="radio"]'));
      const i=buttons.indexOf(document.activeElement as HTMLButtonElement); if(i<0)return;
      e.preventDefault();
      const cols=getComputedStyle(grid.current!).gridTemplateColumns.split(' ').length;
      const jump=e.key==='ArrowLeft'?1:e.key==='ArrowRight'?-1:e.key==='ArrowDown'?cols:-cols;
      const n=e.key==='Home'?0:e.key==='End'?buttons.length-1:e.key==='ArrowDown'||e.key==='ArrowUp'?Math.max(0,Math.min(buttons.length-1,i+jump)):(i+jump+buttons.length)%buttons.length;
      onChange(items[n]!.id);buttons[n]?.focus();
    }}>{items.map(t=><button type="button" key={t.id} role="radio" aria-checked={value===t.id} tabIndex={tabbable===t.id?0:-1} className="catalogue-option" data-occ={t.id} onClick={()=>onChange(t.id)}><OccasionCard info={t} selected={value===t.id}/></button>)}</div>}
    <p className="occasion-reassurance">لكل فرحة مكان. ويمكنك تعديل نوع المناسبة في أي وقت.</p>
  </div>;
}
