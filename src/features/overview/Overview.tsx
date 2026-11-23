import { JourneyBanner } from '../shared/JourneyBanner';
/** One next step, then actionable exceptions. The event lifecycle shapes the composition. */
import { useState } from 'react';
import type { Event } from '../../domain/types';
import { eventPhase, PHASE_LABEL, todayFor } from '../../domain/event';
import { countdownLabel, formatEventDate, formatTime, relativeTime } from '../../domain/format';
import { checklist, needsAttention, nextAction, type OverviewInput } from '../../domain/overview';
import { journeyStage, overviewFacts, rankAttention } from '../../domain/experience';
import { publishState } from '../../domain/invitation';
import { activityText, activityTone } from '../../domain/activity';
import { actorLabel } from '../../domain/roles';
import { PHASE_KEY } from '../../domain/copy/activity';
import { useCopy } from '../../ui/copy';
import { Button, ErrorState, Icon, LinkButton, ProgressBar, Skeleton, Status, PageLoader } from '../../ui';
import { Link } from '../../app/router';
import { useNow } from '../../app/data';
import { paths, targetPath } from '../../app/paths';
import { useActivity, useCheckIns, useDesign, useParties, useResponses, useTables } from '../shared/queries';
import { DateSeal, Stage } from '../signature/SignatureArt';
import { CardThumb } from '../invitation/CardThumb';
import { defaultDesign } from '../../domain/invitation';
import { CapacityMeter } from '../billing/CapacityMeter';

const STAGE_LINE = { welcome: 'ovStWelcome', remember: 'ovStRemember', prepare: 'ovStPrepare', arrange: 'ovStArrange', invite: 'ovStInvite' } as const;

export function Overview({ event }: { event: Event }) {
  const now = useNow();
  const { t, dialect } = useCopy();
  const parties = useParties(event.id), design = useDesign(event.id), tables = useTables(event.id), responses = useResponses(event.id), checkIns = useCheckIns(event.id), activity = useActivity(event.id, 6);
  const [allAttention, setAllAttention] = useState(false);
  const loading = parties.loading || design.loading || tables.loading || responses.loading || checkIns.loading;
  const error = parties.error || design.error || tables.error || responses.error || checkIns.error;
  if (error) return <ErrorState error={error} onRetry={()=>{parties.refetch();design.refetch();tables.refetch();responses.refetch();checkIns.refetch();}} />;
  if (loading) return <PageLoader />;
  const input: OverviewInput = { event, publish:publishState(design.data), parties:parties.data!, tables:tables.data!, responses:responses.data!, checkIns:checkIns.data!, now, dialect };
  const phase = eventPhase(event,now), stage=journeyStage(event,input.publish,input.parties,now);
  const action=nextAction(input), attention=rankAttention(needsAttention(input),input), steps=checklist(input), facts=overviewFacts(input);
  const required=steps.filter(s=>!s.optional), done=required.filter(s=>s.done).length;
  const journey=[{label:t('ovJInvite'),to:paths.design(event.id)},{label:t('ovJGuests'),to:paths.guests(event.id)},{label:stage==='remember'?t('ovJMemory'):t('ovJReception'),to:stage==='remember'?paths.summary(event.id):paths.checkin(event.id)}];
  const index=['design','invitation'].includes(action.target.to)?0:['guests','rsvp','import'].includes(action.target.to)?1:2;
  const [day,...month]=formatEventDate(event.date,{weekday:false,year:false}).split(' ');
  return <div className="overview">
    <header className="event-overview-head">
      <div><p className="eyebrow">{t('ovEyebrow')}</p><div className="row wrap gap-3"><h1>{event.title}</h1><Status tone={PHASE_LABEL[phase].tone}>{t(PHASE_KEY[phase])}</Status></div>
        <p className="overview-location"><Icon name="pin" size="sm" />{event.venue.name}، {event.venue.city}</p></div>
      <LinkButton to={paths.settings(event.id)} variant="ghost" icon="edit" size="sm">{t('wsSettings')}</LinkButton>
    </header>
    <Stage size="md" tone="charcoal" pattern="knot" className="sig-moment" aria-label={t('ovNextStep')}>
      <DateSeal day={day!} month={month.join(' ')} time={formatTime(event.time)} />
      <div className="moment-copy"><p className="sig-moment-eyebrow">{countdownLabel(event.date,todayFor(event,now),dialect)}</p><h2>{t(STAGE_LINE[stage])}</h2><p>{action.reason}</p><LinkButton to={targetPath(event.id,action.target)} variant="primary" iconEnd="forward">{action.label}</LinkButton></div>
      <Link to={paths.invitation(event.id)} className="sig-moment-card" aria-label={t('ovCardLabel')}><CardThumb event={event} content={design.data?.draft ?? defaultDesign(event)} width={150} /></Link>
    </Stage>
    <nav className="journey" aria-label={t('ovJourneyLabel')}><ol>{journey.map((s,n)=><li key={s.to} className={n<index?'is-done':n===index?'is-current':''}><Link to={s.to} aria-current={n===index?'step':undefined}><span className="journey-number">{n<index?<Icon name="check" size="sm"/>:n+1}</span><span>{s.label}</span></Link></li>)}</ol></nav>
    {/* only while the event has no tables: once seating exists the line would contradict the hall (ops review) */}
    {tables.data!.length === 0 && <p className="optional-journey-note"><Icon name="table" size="sm"/>{t('ovTablesOptional')}{' '}<Link to={paths.seating(event.id)}>{t('ovAddSeating')}</Link></p>}
    {/* each count opens exactly the list it counts (F037) */}
    <dl className="event-facts is-linked">{facts.map(f=><div key={f.filter+f.label}><dt>{f.label}</dt><dd className={`tone-text-${f.tone}`}><Link to={`${paths.guests(event.id)}${f.filter==='all'?'':`?filter=${f.filter}`}`} className="fact-link" aria-label={t('ovFactAria',{label:f.label,value:f.value,unit:f.unit})}><strong className="num">{f.value}</strong><span>{f.unit}</span><Icon name="forward" size="sm" /></Link></dd></div>)}</dl>
    {parties.data!.length > 0 && <CapacityMeter eventId={event.id} parties={parties.data!} />}
    <JourneyBanner title={t('ovBannerTitle')} line={t('ovBannerLine')} />
    <div className="overview-columns">
      <div className="stack gap-6">
        <section className="attention-section" aria-labelledby="attention-title"><header className="section-head"><h2 id="attention-title">{attention.length?t('ovAttention'):t('ovAllGood')}</h2>{attention.length>0&&<span className="faint t-sm num">{t('ovAttCount',{n:attention.length})}</span>}</header>
          {!attention.length?<p className="all-good"><Icon name="check-circle"/>{t('ovNothing')}</p>:<ul className="attention-list">{attention.slice(0,allAttention?undefined:3).map(a=><li key={a.id}><span className={`attention-icon tone-text-${a.tone}`}><Icon name={a.tone==='danger'?'alert':a.id==='unassigned'?'table':'info'} size="sm"/></span><span>{a.text}</span><Link to={targetPath(event.id,a.target)}>{a.action}<Icon name="forward" size="sm"/></Link></li>)}</ul>}
          {attention.length>3&&<Button size="sm" variant="ghost" onClick={()=>setAllAttention(v=>!v)} aria-expanded={allAttention}>{allAttention?t('ovLess'):t('ovMore',{n:attention.length-3})}</Button>}
        </section>
        <details className="preparation-list" open={stage==='prepare'||undefined}><summary><span>{t('ovSteps')}</span><span className="faint t-sm">{t('ovStepsDone',{n:done,of:required.length})}</span><Icon name="chevron-down" size="sm"/></summary><ProgressBar value={done} max={required.length} label={t('ovProgress')}/><ol className="checklist">{steps.map((s,n)=><li key={s.id} className={`check-item${s.done?' is-done':''}`}><Link to={targetPath(event.id,s.target)} className="check-link"><span className="check-num" aria-hidden="true">{s.done?<Icon name="check" size="sm"/>:n+1}</span><span className="grow"><span className="check-title">{s.label}{s.optional&&<span className="faint t-xs">{t('ovOptional')}</span>}{s.done&&<span className="sr-only">{t('ovDoneSr')}</span>}</span><span className="check-detail">{s.detail}</span></span><Icon name="forward" size="sm"/></Link></li>)}</ol></details>
      </div>
      <section className="recent-section" aria-labelledby="recent-title"><div className="section-head"><h2 id="recent-title">{t('ovRecent')}</h2><span className="eyebrow">{t('ovWithGuests')}</span></div>{activity.loading?<Skeleton lines={4}/>:activity.error?<ErrorState error={activity.error} onRetry={activity.refetch}/>:!activity.data?.length?<p className="muted t-sm">{t('ovRecentEmpty')}</p>:<ol className="timeline">{activity.data.map(a=><li key={a.id} className={`timeline-item tone-${activityTone(a.kind)}`}><span className="timeline-dot" aria-hidden="true"/><div><p>{activityText(a,dialect)}{actorLabel(a.actor,dialect)&&<span className="timeline-actor"> — {actorLabel(a.actor,dialect)}</span>}</p><time dateTime={a.at}>{relativeTime(a.at,now,dialect)}</time></div></li>)}</ol>}<Link to={paths.rsvp(event.id)} className="link-btn">{t('ovAllReplies')}</Link></section>
    </div>
  </div>;
}
