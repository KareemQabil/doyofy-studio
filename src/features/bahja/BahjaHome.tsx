import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import type { Event } from '../../domain/types';
import { eventPhase, eventTypeInfo, EVENT_TYPES } from '../../domain/event';
import { formatEventDate, formatTime, countdownLabel } from '../../domain/format';
import { todayFor } from '../../domain/event';
import { defaultDesign, publishState, toInvitationData } from '../../domain/invitation';
import { useNow } from '../../app/data';
import { Link } from '../../app/router';
import { paths } from '../../app/paths';
import { ErrorState, Icon, LinkButton, Skeleton } from '../../ui';
import { JourneyArtwork } from '../../ui/primitives/JourneyArtwork';
import { OccasionArtwork } from '../occasions/OccasionArtwork';
import { TemplateThumb } from '../templates/TemplateThumb';
import { useDesign, useEvents } from '../shared/queries';
import { BahjaShell } from './BahjaShell';

function FeaturedMoment({ event }: { event: Event }) {
  const design=useDesign(event.id),now=useNow(),phase=eventPhase(event,now),base=design.data?.draft??defaultDesign(event),ps=publishState(design.data);
  const past=['completed','archived'].includes(phase);
  const to=past?paths.summary(event.id):phase==='event_day'?paths.gate(event.id):['none','draft'].includes(ps)?paths.design(event.id):paths.overview(event.id);
  const action=past?'استعد الذكرى':phase==='event_day'?'افتح الاستقبال':['none','draft'].includes(ps)?'راجع دعوتك':'كمّل تجهيز فرحتك';
  return <article className="bahja-moment" key={event.id}><div className="bahja-moment-copy"><p className="bahja-overline">{eventTypeInfo(event.type).label} <span>·</span> {past?'ذكرى جميلة':countdownLabel(event.date,todayFor(event,now))}</p><h2>{event.title}</h2><p>{formatEventDate(event.date)} <bdi>{formatTime(event.time)}</bdi></p><p>{event.venue.name}، {event.venue.city}</p><LinkButton to={to} variant="primary" size="lg" iconEnd="forward">{action}</LinkButton><Link to={paths.overview(event.id)} className="bahja-underlink">كل التفاصيل <Icon name="forward" size="sm"/></Link></div><div className="bahja-moment-art"><span className="bahja-poster-label" aria-hidden="true">دعوة لها حضور.</span><div className="bahja-poster"><TemplateThumb preset={{id:event.id,name:'',line:'',styles:[],occasionTags:[],cardId:base.cardId,sceneId:base.sceneId,experience:base.experience}} invitation={toInvitationData(event,base,2)}/></div><OccasionArtwork type={event.type} framed={false}/><span className="bahja-orbit-mark" aria-hidden="true">✦</span></div></article>;
}

export function BahjaHome() {
  const events=useEvents(),now=useNow(60000),[chosen,setChosen]=useState(''),[memories,setMemories]=useState(false);
  const art=useRef<HTMLDivElement>(null);
  const all=events.data??[],active=all.filter(e=>!['completed','archived'].includes(eventPhase(e,now))).sort((a,b)=>a.date.localeCompare(b.date)),past=all.filter(e=>['completed','archived'].includes(eventPhase(e,now))).sort((a,b)=>b.date.localeCompare(a.date));
  const list=memories?past:active,event=list.find(e=>e.id===chosen)??list[0];
  const move=(e:PointerEvent<HTMLDivElement>)=>{if(e.pointerType==='touch'||!matchMedia('(pointer:fine)').matches||matchMedia('(prefers-reduced-motion:reduce)').matches)return;const rect=e.currentTarget.getBoundingClientRect();art.current?.style.setProperty('--tilt-y',`${(e.clientX-rect.left)/Math.max(1,rect.width)*12-6}deg`);art.current?.style.setProperty('--tilt-x',`${6-(e.clientY-rect.top)/Math.max(1,rect.height)*12}deg`);};
  const reset=()=>{art.current?.style.setProperty('--tilt-y','0deg');art.current?.style.setProperty('--tilt-x','0deg');};
  return <BahjaShell><main id="main" className="bahja-home" tabIndex={-1}>
    <section className="bahja-hero" onPointerMove={move} onPointerLeave={reset}><div className="bahja-hero-copy"><p className="bahja-overline"><span className="bahja-dot"/>مساحة لفرحة لها حضور</p><h1>خلّها<br/><em>فرحة.</em></h1><p className="bahja-hero-note">دعوة تشبهك. أحبابك حولك.<br/>وكل خطوة أبسط مما تتخيّل.</p><a href="#bahja-stories" className="bahja-scroll-link">{active.length?'نكمل حكايتك':'نبدأ حكايتك'}<Icon name="chevron-down" size="sm"/></a></div><div className="bahja-hero-art" ref={art}><span className="bahja-hero-disc"/><img src="assets/directions/bahja-world.webp" alt="" aria-hidden="true" fetchPriority="high" decoding="async"/><span className="bahja-art-seal" aria-hidden="true"><span>كل لحظة تستحق</span><strong>✦</strong><span>تفاصيل تشبهك</span></span><span className="bahja-art-sticker" aria-hidden="true">من القلب<br/>إلى أحبابك.</span></div><span className="bahja-hero-index" aria-hidden="true">ضيوفي / بهجة / 07</span></section>
    <div className="bahja-marquee" aria-hidden="true"><div>{[0,1].map(i=><span key={i}>دعوة <i>✦</i> أحباب <i>✦</i> لحظة <i>✦</i> فرحة <i>✦</i> دعوة <i>✦</i> أحباب <i>✦</i> لحظة <i>✦</i> فرحة <i>✦</i></span>)}</div></div>
    <section id="bahja-stories" className="bahja-stories"><header className="bahja-section-head"><div><p className="bahja-overline">الحكاية لك. والترتيب علينا.</p><h2>{memories?'لحظات تبقى.':'هنا نكمّل فرحتك.'}</h2></div>{past.length>0&&<button type="button" aria-pressed={memories} onClick={()=>{setMemories(v=>!v);setChosen('');}}>{memories?'المناسبات القادمة':'افتح الذكريات'}<Icon name={memories?'calendar':'heart'} size="sm"/></button>}</header>
      {events.loading?<Skeleton lines={5} block/>:events.error?<ErrorState error={events.error} onRetry={events.refetch}/>:event?<><div className="bahja-story-index" role="group" aria-label="اختر مناسبة">{list.map((e,i)=><button key={e.id} type="button" aria-pressed={event.id===e.id} onClick={()=>setChosen(e.id)}><span>{String(i+1).padStart(2,'0')}</span>{e.title}</button>)}</div><FeaturedMoment event={event}/></>:<div className="bahja-first"><JourneyArtwork kind="invitation"/><h3>{memories?'لسه الحكايات جاية.':'أول دعوة… وأجمل بداية.'}</h3><p>اختر المناسبة. نجهّز قالبًا باسمك وموعدك، وتضيف لمستك وقت ما تحب.</p><LinkButton to={paths.newEvent} variant="primary" size="lg" iconEnd="forward">ابدأ مناسبتك</LinkButton></div>}
    </section>
    <section className="bahja-occasion-section"><header className="bahja-section-head"><div><p className="bahja-overline">كل مناسبة. لها حكاية.</p><h2>وش فرحتك الجاية؟</h2></div><span className="bahja-side-note">من ليلة العمر،<br/>لأبسط لمّة.</span></header><div className="bahja-occasion-strip">{EVENT_TYPES.map((t,i)=><Link key={t.id} to={`${paths.newEvent}?type=${t.id}`} className="bahja-occasion-ticket" style={{'--ticket-turn':`${i%2===0?-3:3}deg`} as CSSProperties}><span className="bahja-ticket-art"><OccasionArtwork type={t.id} framed={false}/></span><span className="bahja-ticket-caption"><small>{String(i+1).padStart(2,'0')} / {t.line}</small><strong>{t.label}</strong><Icon name="forward" size="sm"/></span></Link>)}</div><p className="bahja-browse-note"><Icon name="motion" size="sm"/>مرّر لتكتشف المناسبات، واختر ما يجمعكم.</p></section>
    <section className="bahja-manifesto"><span aria-hidden="true">✦</span><p>أنت تعيش اللحظة.<br/><em>وضيوفي يجمع التفاصيل.</em></p><LinkButton to={paths.newEvent} variant="primary" size="lg" icon="plus">مناسبة جديدة</LinkButton></section>
  </main></BahjaShell>;
}
