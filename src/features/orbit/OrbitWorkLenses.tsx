import type {CSSProperties} from 'react';
import type {TableOccupancy} from '../../domain/seating';
import {Icon} from '../../ui/icons';

/** Selecting a table focuses its real guest list. The rings encode actual occupancy. */
export function OrbitTableAtlas({tables,value,onChange}:{tables:TableOccupancy[];value:string;onChange:(id:string)=>void}){
 return <section className="orbit-table-atlas" aria-label="أطلس الطاولات"><header><div><p className="orbit-overline">لكل حبيب مكان</p><h2>طاولة، ثم حكاياتها.</h2><p>اختر طاولة لتفتح قائمة أحبابها. أو اعرض القاعة كلها.</p></div><button type="button" aria-pressed={value==='all'} onClick={()=>onChange('all')}><Icon name="table" size="sm"/>كل الطاولات</button></header>
 <div className="orbit-table-ring" role="group" aria-label="اختر طاولة">{tables.map((o,i)=><button type="button" key={o.table.id} aria-pressed={value===o.table.id} className={o.over?'is-over':''} onClick={()=>onChange(o.table.id)} style={{'--table-fill':`${Math.min(100,o.used/Math.max(1,o.table.capacity)*100)}%`} as CSSProperties}><span className="orbit-table-circle" aria-hidden="true"><i/><span>{String(i+1).padStart(2,'0')}</span></span><strong>{o.table.name}</strong><small>{o.used} / {o.table.capacity} مقعد</small><em>{o.over?`زيادة ${-o.remaining}`:o.remaining===0?'مكتملة':'متبقٍ '+o.remaining}</em></button>)}</div></section>;
}

export function OrbitResponseLenses({value,onChange,pending,recent,unmatched}:{value:string;onChange:(id:'pending'|'recent'|'unmatched')=>void;pending:number;recent:number;unmatched:number}){
 const items=[{id:'pending' as const,label:'ننتظر أحبابنا',line:'الدعوات التي تحتاج ردًا',count:pending,icon:'chat' as const},{id:'recent' as const,label:'وصلت علامة فرح',line:'الردود المرتبطة بالضيوف',count:recent,icon:'envelope' as const},{id:'unmatched' as const,label:'نصل الاسم بحكايته',line:'ردود تحتاج مطابقة',count:unmatched,icon:'link' as const}];
 return <div className="orbit-response-lenses" role="group" aria-label="مسارات الردود">{items.map(item=><button type="button" key={item.id} aria-pressed={item.id===value} onClick={()=>onChange(item.id)}><span><Icon name={item.icon}/><b>{item.count}</b></span><strong>{item.label}</strong><small>{item.line}</small><Icon name="forward" size="sm"/></button>)}</div>;
}
