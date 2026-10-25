import {useId,useRef,useState,type PointerEvent as PE} from 'react';
import type {Event} from '../../domain/types';
import {checklist,nextAction,needsAttention,type OverviewInput} from '../../domain/overview';
import {rankAttention} from '../../domain/experience';
import {defaultDesign,publishState,toInvitationData} from '../../domain/invitation';
import {formatEventDate,formatTime} from '../../domain/format';
import {ORBIT_POSITIONS,placeNode,readPositions,type Point} from '../../domain/orbit';
import {useNow} from '../../app/data';
import {Link} from '../../app/router';
import {paths,targetPath} from '../../app/paths';
import {ErrorState,Icon,LinkButton,Skeleton} from '../../ui';
import {useCheckIns,useDesign,useParties,useResponses,useTables} from '../shared/queries';
import {TemplateThumb} from '../templates/TemplateThumb';
import {useSpatialView} from './useSpatialView';
import {OrbitArtwork} from './OrbitArtwork';
import type {ChecklistItem} from '../../domain/overview';
import type {IconName} from '../../ui/icons';

const ICONS:Record<string,IconName>={details:'pin',invitation:'envelope',guests:'users',share:'send',rsvp:'chat',seating:'table',checkin:'door'};
function SpatialNote({item,point,eventId,scale,onPlace,onMove}:{item:ChecklistItem;point:Point;eventId:string;scale:()=>number;onPlace:(p:Point)=>void;onMove:(p:Point)=>void}){
 const ref=useRef<HTMLDivElement>(null),drag=useRef<{id:number;x:number;y:number;p:Point;moved:boolean}|null>(null);
 const reset=()=>{ref.current?.style.removeProperty('--node-dx');ref.current?.style.removeProperty('--node-dy');ref.current?.removeAttribute('data-dragging');onMove(point);};
 const finish=(e:PE<HTMLButtonElement>,cancelled:boolean)=>{const d=drag.current;if(!d||d.id!==e.pointerId)return;drag.current=null;reset();if(!cancelled&&d.moved)onPlace(placeNode({x:d.p.x+(e.clientX-d.x)/scale(),y:d.p.y+(e.clientY-d.y)/scale()}));};
 return <div ref={ref} className={`orbit-note${item.done?' is-ready':''}`} style={{left:point.x,top:point.y}}>
  <button type="button" className="orbit-note-handle" aria-label={`حرّك مساحة ${item.label}{item.optional&&<small> · اختياري</small>}`} title="اسحب للتحريك، أو استخدم الأسهم" onPointerDown={e=>{if(e.button!==0||e.isPrimary===false)return;drag.current={id:e.pointerId,x:e.clientX,y:e.clientY,p:point,moved:false};e.currentTarget.setPointerCapture?.(e.pointerId);}}
   onPointerMove={e=>{const d=drag.current;if(!d||d.id!==e.pointerId)return;const dx=(e.clientX-d.x)/scale(),dy=(e.clientY-d.y)/scale();if(Math.hypot(dx,dy)<6&&!d.moved)return;d.moved=true;ref.current?.setAttribute('data-dragging','true');ref.current?.style.setProperty('--node-dx',`${dx}px`);ref.current?.style.setProperty('--node-dy',`${dy}px`);onMove({x:d.p.x+dx,y:d.p.y+dy});}}
   onPointerUp={e=>finish(e,false)} onPointerCancel={e=>finish(e,true)} onLostPointerCapture={e=>finish(e,true)}
   onKeyDown={e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const d=e.shiftKey?8:24;onPlace(placeNode({x:point.x+(e.key==='ArrowLeft'?-d:e.key==='ArrowRight'?d:0),y:point.y+(e.key==='ArrowUp'?-d:e.key==='ArrowDown'?d:0)}));}}><span/><span/><span/></button>
  <Link to={targetPath(eventId,item.target)} className="orbit-note-open"><span className="orbit-note-symbol"><Icon name={ICONS[item.id]??'sparkle'}/></span><span><strong>{item.label}{item.optional&&<small> · اختياري</small>}</strong><small>{item.detail}</small></span><span className="orbit-note-mark" aria-label={item.done?'مكتملة':'تحتاج تجهيزًا'}><Icon name={item.done?'check':'forward'} size="sm"/></span></Link>
 </div>;
}

export function OrbitBoard({event,compact=false}:{event:Event;compact?:boolean}){
 const now=useNow(60000),parties=useParties(event.id),design=useDesign(event.id),tables=useTables(event.id),responses=useResponses(event.id),checkIns=useCheckIns(event.id);
 const spatial=useSpatialView(),hint=useId(),threads=useRef<Record<string,SVGPathElement|null>>({});const [mode,setMode]=useState<'space'|'list'>('space'),[notice,setNotice]=useState('');
 const storageKey=`doyofy:orbit:v1:${event.id}`;
 const [positions,setPositions]=useState<Record<string,Point>>(()=>{try{return readPositions(window.localStorage.getItem(storageKey));}catch{return{};}});
 const loading=parties.loading||design.loading||tables.loading||responses.loading||checkIns.loading,error=parties.error||design.error||tables.error||responses.error||checkIns.error;
 if(error)return <ErrorState error={error} onRetry={()=>{parties.refetch();design.refetch();tables.refetch();responses.refetch();checkIns.refetch();}}/>;
 if(loading)return <Skeleton lines={6} block/>;
 const input:OverviewInput={event,publish:publishState(design.data),parties:parties.data!,tables:tables.data!,responses:responses.data!,checkIns:checkIns.data!,now};
 const items=checklist(input),action=nextAction(input),attention=rankAttention(needsAttention(input),input),done=items.filter(i=>!i.optional&&i.done).length,required=items.filter(i=>!i.optional);
 const content=design.data?.draft??defaultDesign(event),invitation=toInvitationData(event,content,2);
 const curve=(p:Point)=>`M500 365 Q${(500+p.x)/2+45} ${(365+p.y)/2-55} ${p.x} ${p.y}`;
 const points=items.map((item,i)=>positions[item.id]??ORBIT_POSITIONS[i]!);
 const save=(id:string,p:Point)=>{const next={...positions,[id]:p};setPositions(next);try{window.localStorage.setItem(storageKey,JSON.stringify(next));setNotice('تم حفظ ترتيب مساحتك.');}catch{setNotice('تم تحريك العنصر لهذه الجلسة.');}};
 const resetLayout=()=>{setPositions({});spatial.reset();try{window.localStorage.removeItem(storageKey);}catch{}setNotice('عادت المساحة لترتيب البداية.');};
 return <section className={`orbit-board${compact?' is-compact':''}`} aria-label="خريطة المناسبة">
  <header className="orbit-board-head"><div><span className="orbit-overline">المناسبة في مدارها</span><h2>{event.title}</h2><p>{formatEventDate(event.date)} <span>· {formatTime(event.time)}</span></p></div><div className="orbit-board-tools"><div className="orbit-mode" role="group" aria-label="شكل مساحة العمل"><button type="button" aria-pressed={mode==='space'} onClick={()=>setMode('space')}><Icon name="sparkle" size="sm"/>مساحة</button><button type="button" aria-pressed={mode==='list'} onClick={()=>setMode('list')}><Icon name="menu" size="sm"/>مهام</button></div><span className="orbit-ready"><b>{done}</b> / {required.length}<span>تفاصيل جاهزة</span></span></div></header>
  {mode==='space'&&<><div className="orbit-canvas" ref={spatial.frame} {...spatial.bind} tabIndex={0} role="group" aria-label="مساحة تفاعلية للمناسبة" aria-describedby={hint}>
   <div className="orbit-canvas-grid"/><div className="orbit-world"><svg className="orbit-threads" viewBox="0 0 1000 720" aria-hidden="true"><ellipse cx="500" cy="365" rx="335" ry="230"/><ellipse cx="500" cy="365" rx="420" ry="290"/>{points.map((p,i)=><path key={items[i]!.id} ref={el=>{threads.current[items[i]!.id]=el;}} d={curve(p)}/>)}</svg>
    <div className="orbit-center"><OrbitArtwork/><Link to={paths.design(event.id)} className="orbit-invitation" aria-label="افتح تصميم الدعوة"><TemplateThumb preset={{id:'orbit-current',name:'',line:'',styles:[],occasionTags:[],cardId:content.cardId,sceneId:content.sceneId,experience:content.experience}} invitation={invitation}/><span>دعوتك، قلب الحكاية<Icon name="forward" size="sm"/></span></Link><span className="orbit-center-caption">{event.venue.city} · {event.date.slice(0,4)}</span></div>
    {items.map((item,i)=><SpatialNote key={item.id} item={item} point={points[i]!} eventId={event.id} scale={spatial.getScale} onPlace={p=>save(item.id,p)} onMove={p=>threads.current[item.id]?.setAttribute('d',curve(p))}/>)}
   </div><span className="orbit-canvas-corner" aria-hidden="true">D / 06 <i/> فرحتك لها مدار</span>
  </div><div className="orbit-canvas-controls"><p id={hint}><Icon name="motion" size="sm"/>اسحب الفراغ للتحريك · إصبعان للتقريب · مقابض العناصر لترتيبها</p><div role="group" aria-label="تحريك وتقريب المساحة"><button type="button" aria-label="حرّك المساحة يمينًا" onClick={()=>spatial.pan(100,0)}><Icon name="back" size="sm"/></button><button type="button" aria-label="حرّك المساحة يسارًا" onClick={()=>spatial.pan(-100,0)}><Icon name="forward" size="sm"/></button><button type="button" aria-label="تصغير المساحة" onClick={()=>spatial.zoom(-.1)}>−</button><output aria-label="نسبة التقريب">{Math.round(spatial.view.scale*100)}%</output><button type="button" aria-label="تكبير المساحة" onClick={()=>spatial.zoom(.1)}>+</button><button type="button" aria-label="إعادة ترتيب المساحة" onClick={resetLayout}><Icon name="refresh" size="sm"/></button></div></div></>}
  <div className={`orbit-task-strip${mode==='list'?' is-list':''}`} aria-label="مهام المناسبة">{items.map(item=><Link key={item.id} to={targetPath(event.id,item.target)}><span className={item.done?'is-ready':''}><Icon name={ICONS[item.id]??'sparkle'} size="sm"/></span><strong>{item.label}{item.optional&&<small> · اختياري</small>}</strong>{mode==='list'&&<small>{item.detail}</small>}<Icon name={item.done?'check':'forward'} size="sm"/></Link>)}</div>
  <footer className="orbit-next"><div><span className="orbit-overline">من هنا تكتمل الحكاية</span><p>{action.reason}</p></div><LinkButton to={targetPath(event.id,action.target)} variant="primary" iconEnd="forward">{action.label}</LinkButton></footer>
  {attention.length>0&&<details className="orbit-attention"><summary><Icon name="alert" size="sm"/>{attention.length} تفاصيل صغيرة تحتاجك<Icon name="chevron-down" size="sm"/></summary><ul>{attention.map(a=><li key={a.id}><p>{a.text}</p><Link to={targetPath(event.id,a.target)}>{a.action}<Icon name="forward" size="sm"/></Link></li>)}</ul></details>}
  <p className="orbit-position-notice sr-only" role="status">{notice}</p>
 </section>;
}
