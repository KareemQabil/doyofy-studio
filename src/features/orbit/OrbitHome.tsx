import {useState} from 'react';
import {useNow} from '../../app/data';
import {Link} from '../../app/router';
import {paths} from '../../app/paths';
import {eventPhase,eventTypeInfo} from '../../domain/event';
import {formatEventDate} from '../../domain/format';
import {ErrorState,Icon,LinkButton,Skeleton} from '../../ui';
import {useEvents} from '../shared/queries';
import {OrbitShell} from './OrbitShell';
import {OrbitArtwork} from './OrbitArtwork';
import {OrbitBoard} from './OrbitBoard';

export function OrbitHome(){
 const events=useEvents(),now=useNow(60000),[selected,setSelected]=useState(''),[memories,setMemories]=useState(false);
 const all=events.data??[],upcoming=all.filter(e=>!['completed','archived'].includes(eventPhase(e,now))).sort((a,b)=>a.date.localeCompare(b.date));
 const past=all.filter(e=>['completed','archived'].includes(eventPhase(e,now))).sort((a,b)=>b.date.localeCompare(a.date));
 const list=memories?past:upcoming,event=list.find(e=>e.id===selected)??list[0];
 return <OrbitShell><main id="main" className="orbit-home" tabIndex={-1}><header className="orbit-home-intro"><div><p className="orbit-overline"><span>✦</span> مساحة صغيرة لفرحة كبيرة</p><h1>خلّي التفاصيل<br/>تدور حول <em>فرحتك.</em></h1><p>دعوتك في القلب. أحبابك حولها.<br/>والخطوة الجاية أقرب مما تتخيّل.</p></div><div className="orbit-home-sculpture"><OrbitArtwork interactive/><span className="orbit-art-label">صُنعت لتتحرّك معك</span></div><LinkButton to={paths.newEvent} variant="primary" icon="plus">ابدأ فرحة جديدة</LinkButton></header>
  {events.loading?<Skeleton lines={6} block/>:events.error?<ErrorState error={events.error} onRetry={events.refetch}/>:!all.length?<section className="orbit-empty"><h2>أول حكاية تنتظرك.</h2><p>اختر اللحظة، ثم نجمع تفاصيلها في مدار واحد.</p><LinkButton to={paths.newEvent} variant="primary">ابدأ مناسبتك الأولى</LinkButton></section>:<>
   <div className="orbit-stories-head"><h2>حكاياتك</h2><div className="orbit-mode" role="group" aria-label="عرض المناسبات"><button type="button" aria-pressed={!memories} onClick={()=>{setMemories(false);setSelected('');}}>القادمة <span>{upcoming.length}</span></button><button type="button" aria-pressed={memories} onClick={()=>{setMemories(true);setSelected('');}}>الذكريات <span>{past.length}</span></button></div></div>
   <div className="orbit-stories" aria-label="اختر المناسبة">{list.map((e,i)=><button type="button" key={e.id} aria-pressed={event?.id===e.id} onClick={()=>setSelected(e.id)}><span className="orbit-story-index">0{i+1}</span><span><strong>{e.title}</strong><small>{eventTypeInfo(e.type).label} · {formatEventDate(e.date,{year:false,weekday:false})}</small></span><Icon name="sparkle" size="sm"/></button>)}<Link to={paths.newEvent} className="orbit-new-story"><Icon name="plus"/>فرحة جديدة</Link></div>
   {event?<OrbitBoard key={event.id} event={event}/>:<div className="orbit-empty"><h2>{memories?'لسه الذكريات جاية.':'مدار جديد ينتظرك.'}</h2><p>{memories?'كل حكاية تنتهي تجد مكانها هنا.':'ابدأ مناسبة جديدة، أو استعد حكاياتك من الذكريات.'}</p></div>}
  </>}
  <footer className="orbit-home-end"><span>✦</span><p>كل تفصيلة في مكانها. وأنت في قلب اللحظة.</p><Link to="/prototype/design-directions">كل الاتجاهات</Link></footer>
 </main></OrbitShell>;
}
