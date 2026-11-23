/**
 * The overview: ONE next action (design → add guests → send → follow replies → reception) and a compact status
 * (the countdown, the replies) — never a checklist of chores, no plan tiles or promotions. Real exceptions follow
 * only when there are some; the activity feed stays folded under «النشاط». On a phone the hero's button sits above
 * the fold even at 320×640 (the event's name is already in the app bar, so the page heading is for screen readers).
 */
import { useState } from 'react';
import type { Event } from '../../domain/types';
import { hasVenue, placeLine, todayFor } from '../../domain/event';
import { countdownLabel, formatEventDate, formatTime, relativeTime } from '../../domain/format';
import { needsAttention, nextAction, type OverviewInput } from '../../domain/overview';
import { journeyStage, overviewFacts, rankAttention } from '../../domain/experience';
import { activityText, activityTone } from '../../domain/activity';
import { actorLabel } from '../../domain/roles';
import { useCopy } from '../../ui/copy';
import { Button, ErrorState, Icon, LinkButton, Skeleton, PageLoader } from '../../ui';
import { Link } from '../../app/router';
import { useNow } from '../../app/data';
import { paths, targetPath } from '../../app/paths';
import { useActivity, useCheckIns, useDesign, useParties, useResponses, useTables } from '../shared/queries';
import { DateSeal, Stage } from '../signature/SignatureArt';
import { CardThumb } from '../invitation/CardThumb';
import { liveDesign } from '../../domain/invitation';

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
  const input: OverviewInput = { event, designed:!!design.data, parties:parties.data!, tables:tables.data!, responses:responses.data!, checkIns:checkIns.data!, now, dialect };
  const stage=journeyStage(event,input.parties,now);
  const action=nextAction(input), attention=rankAttention(needsAttention(input),input), facts=overviewFacts(input);
  const [day,...month]=formatEventDate(event.date,{weekday:false,year:false}).split(' ');
  return <div className="overview">
    <header className="event-overview-head">
      <div><h1>{event.title}</h1>
        {hasVenue(event.venue) && <p className="overview-location"><Icon name="pin" size="sm" />{placeLine(event.venue)}</p>}</div>
      <LinkButton to={paths.settings(event.id)} variant="ghost" icon="edit" size="sm">{t('wsSettings')}</LinkButton>
    </header>
    <Stage size="md" tone="charcoal" pattern="knot" className="sig-moment" aria-label={t('ovNextStep')}>
      <DateSeal day={day!} month={month.join(' ')} time={formatTime(event.time)} />
      {/* a neutral countdown («بعد ٩ أيام»), never a state word to learn */}
      <div className="moment-copy"><p className="sig-moment-eyebrow">{countdownLabel(event.date,todayFor(event,now),dialect)}</p><h2>{t(STAGE_LINE[stage])}</h2><p>{action.reason}</p><LinkButton to={targetPath(event.id,action.target)} variant="primary" iconEnd="forward">{action.label}</LinkButton></div>
      <Link to={paths.design(event.id)} className="sig-moment-card" aria-label={t('ovCardLabel')}><CardThumb event={event} content={liveDesign(design.data, event)} width={150} /></Link>
    </Stage>
    {/* the replies at a glance; each count opens exactly the list it counts (F037) */}
    <dl className="event-facts is-linked">{facts.map(f=><div key={f.filter+f.label}><dt>{f.label}</dt><dd className={`tone-text-${f.tone}`}><Link to={`${paths.guests(event.id)}${f.filter==='all'?'':`?filter=${f.filter}`}`} className="fact-link" aria-label={t('ovFactAria',{label:f.label,value:f.spelled??`${f.value} ${f.unit}`.trim()})}>{f.spelled?<strong className="fact-spelled">{f.spelled}</strong>:<><strong className="num">{f.value}</strong>{f.unit&&<span>{f.unit}</span>}</>}<Icon name="forward" size="sm" /></Link></dd></div>)}</dl>
    {/* exceptions only when there are some: no «all good» chore list */}
    {attention.length>0&&<section className="attention-section" aria-labelledby="attention-title"><header className="section-head"><h2 id="attention-title">{t('ovAttention')}</h2><span className="faint t-sm num">{t('ovAttCount',{n:attention.length})}</span></header>
      <ul className="attention-list">{attention.slice(0,allAttention?undefined:3).map(a=><li key={a.id}><span className={`attention-icon tone-text-${a.tone}`}><Icon name={a.tone==='danger'?'alert':a.id==='unassigned'?'table':'info'} size="sm"/></span><span>{a.text}</span><Link to={targetPath(event.id,a.target)}>{a.action}<Icon name="forward" size="sm"/></Link></li>)}</ul>
      {attention.length>3&&<Button size="sm" variant="ghost" onClick={()=>setAllAttention(v=>!v)} aria-expanded={allAttention}>{allAttention?t('ovLess'):t('ovMore',{n:attention.length-3})}</Button>}
    </section>}
    {/* the activity feed is there when wanted, folded by default */}
    <details className="ov-activity">
      <summary><span className="grow">{t('ovActivity')}</span><Icon name="chevron-down" size="sm" /></summary>
      <div className="ov-activity-body">{activity.loading?<Skeleton lines={4}/>:activity.error?<ErrorState error={activity.error} onRetry={activity.refetch}/>:!activity.data?.length?<p className="muted t-sm">{t('ovRecentEmpty')}</p>:<ol className="timeline">{activity.data.map(a=><li key={a.id} className={`timeline-item tone-${activityTone(a.kind)}`}><span className="timeline-dot" aria-hidden="true"/><div><p>{activityText(a,dialect)}{actorLabel(a.actor,dialect)&&<span className="timeline-actor"> — {actorLabel(a.actor,dialect)}</span>}</p><time dateTime={a.at}>{relativeTime(a.at,now,dialect)}</time></div></li>)}</ol>}<Link to={paths.rsvp(event.id)} className="link-btn">{t('ovAllReplies')}</Link></div>
    </details>
  </div>;
}
