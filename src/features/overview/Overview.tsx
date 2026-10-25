import { JourneyBanner } from '../shared/JourneyBanner';
/** One next step, then actionable exceptions. The event lifecycle shapes the composition. */
import { useReviewSettings } from '../../app/review';
import { OrbitBoard } from '../orbit/OrbitBoard';
import { useState } from 'react';
import type { Event } from '../../domain/types';
import { eventPhase, PHASE_LABEL, todayFor } from '../../domain/event';
import { countdownLabel, formatEventDate, formatTime, relativeTime } from '../../domain/format';
import { checklist, needsAttention, nextAction, type OverviewInput } from '../../domain/overview';
import { journeyStage, overviewFacts, rankAttention } from '../../domain/experience';
import { publishState } from '../../domain/invitation';
import { activityText, activityTone } from '../../domain/activity';
import { Button, ErrorState, Icon, LinkButton, ProgressBar, Skeleton, Status } from '../../ui';
import { Link } from '../../app/router';
import { useNow } from '../../app/data';
import { paths, targetPath } from '../../app/paths';
import { useActivity, useCheckIns, useDesign, useParties, useResponses, useTables } from '../shared/queries';
import { DateSeal, Stage } from '../signature/SignatureArt';
import { CardThumb } from '../invitation/CardThumb';
import { defaultDesign } from '../../domain/invitation';

export function Overview({event}:{event:Event}){const {theme}=useReviewSettings();return theme==='orbit'?<OrbitBoard key={event.id} event={event}/>:<EditorialOverview event={event}/>;}

function EditorialOverview({ event }: { event: Event }) {
  const now = useNow();
  const { theme } = useReviewSettings();
  const parties = useParties(event.id), design = useDesign(event.id), tables = useTables(event.id), responses = useResponses(event.id), checkIns = useCheckIns(event.id), activity = useActivity(event.id, 6);
  const [allAttention, setAllAttention] = useState(false);
  const loading = parties.loading || design.loading || tables.loading || responses.loading || checkIns.loading;
  const error = parties.error || design.error || tables.error || responses.error || checkIns.error;
  if (error) return <ErrorState error={error} onRetry={()=>{parties.refetch();design.refetch();tables.refetch();responses.refetch();checkIns.refetch();}} />;
  if (loading) return <Skeleton lines={8} block />;
  const input: OverviewInput = { event, publish:publishState(design.data), parties:parties.data!, tables:tables.data!, responses:responses.data!, checkIns:checkIns.data!, now };
  const phase = eventPhase(event,now), stage=journeyStage(event,input.publish,input.parties,now);
  const action=nextAction(input), attention=rankAttention(needsAttention(input),input), steps=checklist(input), facts=overviewFacts(input);
  const required=steps.filter(s=>!s.optional), done=required.filter(s=>s.done).length;
  const journey=[{label:'دعوتك',to:paths.design(event.id)},{label:'ضيوفك والردود',to:paths.guests(event.id)},{label:stage==='remember'?'ذكرى مناسبتك':'الاستقبال',to:stage==='remember'?paths.summary(event.id):paths.checkin(event.id)}];
  const index=['design','invitation'].includes(action.target.to)?0:['guests','rsvp','import'].includes(action.target.to)?1:2;
  const [day,...month]=formatEventDate(event.date,{weekday:false,year:false}).split(' ');
  return <div className="overview">
    <header className="event-overview-head">
      <div><p className="eyebrow">نظرة عامة على مناسبتك</p><div className="row wrap gap-3"><h1>{event.title}</h1><Status tone={PHASE_LABEL[phase].tone}>{PHASE_LABEL[phase].label}</Status></div>
        <p className="overview-location"><Icon name="pin" size="sm" />{event.venue.name}، {event.venue.city}</p></div>
      <LinkButton to={paths.settings(event.id)} variant="ghost" icon="edit" size="sm">تفاصيل المناسبة</LinkButton>
    </header>
    {theme==='signature' ? <Stage size="md" tone="charcoal" pattern="knot" className="sig-moment" aria-label="الخطوة التالية">
      <DateSeal day={day!} month={month.join(' ')} time={formatTime(event.time)} />
      <div className="moment-copy"><p className="sig-moment-eyebrow">{countdownLabel(event.date,todayFor(event,now))}</p><h2>{stage==='welcome'?'اليوم نفرح بوصولهم.':stage==='remember'?'لحظات مرّت… وذكريات تبقى.':stage==='prepare'?'حكايتكم تبدأ بدعوة.':stage==='arrange'?'نرتّب التفاصيل، ونطمئن.':'الفرحة تكتمل بضيوفكم.'}</h2><p>{action.reason}</p><LinkButton to={targetPath(event.id,action.target)} variant="primary" iconEnd="forward">{action.label}</LinkButton></div>
      <Link to={paths.invitation(event.id)} className="sig-moment-card" aria-label="الدعوة كما يراها الضيوف"><CardThumb event={event} content={design.data?.draft ?? defaultDesign(event)} width={150} /></Link>
    </Stage> : <section className="event-moment" aria-label="الخطوة التالية">
      <div className="moment-calendar"><span className="moment-day num">{day}</span><span>{month.join(' ')}</span><span className="moment-time">{formatTime(event.time)}</span></div>
      <div className="moment-copy"><p className="eyebrow">{countdownLabel(event.date,todayFor(event,now))}</p><h2>{stage==='welcome'?'اليوم نفرح بوصولهم.':stage==='remember'?'لحظات مرّت… وذكريات تبقى.':stage==='prepare'?'حكايتكم تبدأ بدعوة.':stage==='arrange'?'نرتّب التفاصيل، ونطمئن.':'الفرحة تكتمل بضيوفكم.'}</h2><p>{action.reason}</p><LinkButton to={targetPath(event.id,action.target)} variant="primary" iconEnd="forward">{action.label}</LinkButton></div>
      <div className="moment-flourish" aria-hidden="true"><span /><span /><Icon name={stage==='welcome'?'door':stage==='remember'?'heart':'envelope'} /></div>
    </section>}
    <nav className="journey" aria-label="مراحل المناسبة"><ol>{journey.map((s,n)=><li key={s.to} className={n<index?'is-done':n===index?'is-current':''}><Link to={s.to} aria-current={n===index?'step':undefined}><span className="journey-number">{n<index?<Icon name="check" size="sm"/>:n+1}</span><span>{s.label}</span></Link></li>)}</ol></nav>
    <p className="optional-journey-note"><Icon name="table" size="sm"/>الطاولات اختيارية.<Link to={paths.seating(event.id)}>أضف توزيعًا لو تحتاجه</Link></p>
    <dl className="event-facts">{facts.map(f=><div key={f.label}><dt>{f.label}</dt><dd className={`tone-text-${f.tone}`}><strong className="num">{f.value}</strong><span>{f.unit}</span></dd></div>)}</dl>
    <JourneyBanner title="فرحتك مرتّبة، خطوة بخطوة." line="ابدأ بالدعوة، ثم الضيوف والردود، واترك يوم المناسبة للترحيب." />
    <div className="overview-columns">
      <div className="stack gap-6">
        <section className="attention-section" aria-labelledby="attention-title"><header className="section-head"><h2 id="attention-title">{attention.length?'تفاصيل تستحق انتباهك':'أمورك مرتّبة'}</h2>{attention.length>0&&<span className="faint t-sm num">{attention.length} تفاصيل</span>}</header>
          {!attention.length?<p className="all-good"><Icon name="check-circle"/>لا توجد تفاصيل تحتاج تدخلك الآن.</p>:<ul className="attention-list">{attention.slice(0,allAttention?undefined:3).map(a=><li key={a.id}><span className={`attention-icon tone-text-${a.tone}`}><Icon name={a.tone==='danger'?'alert':a.id==='unassigned'?'table':'info'} size="sm"/></span><span>{a.text}</span><Link to={targetPath(event.id,a.target)}>{a.action}<Icon name="forward" size="sm"/></Link></li>)}</ul>}
          {attention.length>3&&<Button size="sm" variant="ghost" onClick={()=>setAllAttention(v=>!v)} aria-expanded={allAttention}>{allAttention?'عرض أقل':`عرض ${attention.length-3} تفاصيل أخرى`}</Button>}
        </section>
        <details className="preparation-list" open={stage==='prepare'||undefined}><summary><span>خطوات التجهيز</span><span className="faint t-sm">{done} من {required.length} مكتملة</span><Icon name="chevron-down" size="sm"/></summary><ProgressBar value={done} max={required.length} label="تقدم التجهيز"/><ol className="checklist">{steps.map((s,n)=><li key={s.id} className={`check-item${s.done?' is-done':''}`}><Link to={targetPath(event.id,s.target)} className="check-link"><span className="check-num" aria-hidden="true">{s.done?<Icon name="check" size="sm"/>:n+1}</span><span className="grow"><span className="check-title">{s.label}{s.optional&&<span className="faint t-xs"> · اختياري</span>}{s.done&&<span className="sr-only">، مكتملة</span>}</span><span className="check-detail">{s.detail}</span></span><Icon name="forward" size="sm"/></Link></li>)}</ol></details>
      </div>
      <section className="recent-section" aria-labelledby="recent-title"><div className="section-head"><h2 id="recent-title">آخر ما حدث</h2><span className="eyebrow">مع ضيوفك</span></div>{activity.loading?<Skeleton lines={4}/>:activity.error?<ErrorState error={activity.error} onRetry={activity.refetch}/>:!activity.data?.length?<p className="muted t-sm">هنا تظهر الردود وتفاصيل تجهيز مناسبتك، أولًا بأول.</p>:<ol className="timeline">{activity.data.map(a=><li key={a.id} className={`timeline-item tone-${activityTone(a.kind)}`}><span className="timeline-dot" aria-hidden="true"/><div><p>{activityText(a)}</p><time dateTime={a.at}>{relativeTime(a.at,now)}</time></div></li>)}</ol>}<Link to={paths.rsvp(event.id)} className="link-btn">كل الردود والمتابعة</Link></section>
    </div>
  </div>;
}
