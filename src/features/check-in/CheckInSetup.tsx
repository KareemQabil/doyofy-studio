import { JourneyArtwork } from '../../ui/primitives/JourneyArtwork';
/**
 * Organizer's check-in page: before the day — prepare the gate (link for staff, try it);
 * on the day — live arrivals, partial parties still expected, and exceptions to review.
 */
import type { Event } from '../../domain/types';
import { countParties } from '../../domain/parties';
import { eventPhase, todayFor } from '../../domain/event';
import { expectedArrivals } from '../../domain/checkin';
import { clockTime, countdownLabel, relativeTime } from '../../domain/format';
import { EXCEPTION_KEY } from '../../domain/copy/event-pages';
import { useCopy } from '../../ui/copy';
import { Badge, Banner, EmptyState, ErrorState, LinkButton, PageHeader, Panel, ProgressBar, Stat, PageLoader } from '../../ui';
import { useMutation, useNow } from '../../app/data';
import { Link, useRouter } from '../../app/router';
import { paths } from '../../app/paths';
import { useActivity, useCheckIns, useParties } from '../shared/queries';
import { CopyField } from '../shared/CopyField';

export function CheckInSetup({ event }: { event: Event }) {
  const now = useNow();
  const { t, n, dialect } = useCopy();
  const parties = useParties(event.id);
  const records = useCheckIns(event.id);
  const activity = useActivity(event.id, 200);
  const { absolute } = useRouter();
  const prepare = useMutation((s) => s.events.markCheckInPrepared(event.id));
  const phase = eventPhase(event, now);
  if (parties.error || records.error) return <ErrorState error={parties.error || records.error} onRetry={() => { parties.refetch(); records.refetch(); }} />;
  if (parties.loading || records.loading) return <PageLoader />;
  const all = parties.data!;
  const c = countParties(all);
  const live = records.data!.filter((r) => !r.undone);
  const exceptions = live.filter((r) => r.exceptions.some((e) => e !== 'no_table'));
  const partial = all.filter((p) => p.checkInStatus === 'partial');
  const notArrived = all.filter((p) => p.rsvpStatus === 'confirmed' && p.checkedInCount === 0);
  // people let in who were not on the list (gate «ضيف من خارج القائمة»): no invitation, only the staff note
  const walkIns = (activity.data ?? []).filter((a) => a.kind === 'check_in_walk_in');
  const name = (id: string) => all.find((p) => p.id === id)?.primaryGuestName ?? '—';

  return (
    <>
      <PageHeader title={t('wsCheckin')} status={phase === 'event_day' ? <Badge tone="accent" dot>{t('wsToday')}</Badge> : undefined}
        subtitle={phase === 'event_day' ? t('csLive') : phase === 'completed' ? t('ovEnded') : t('csSoon', { when: countdownLabel(event.date, todayFor(event, now), dialect) })}
        actions={<LinkButton to={paths.gate(event.id)} variant="primary" icon="scan" onClick={() => void prepare.run()}>{t('stepGate')}</LinkButton>} />

      <div className="stack gap-6">
        {(phase === 'event_day' || phase === 'completed' || c.checkedInPeople > 0) && <div className="counts">
          <div className="counts-checkin">
            <Stat label={t('ovArrived')} value={c.checkedInPeople} sub={t('csOfConfirmed', { people: n(c.confirmedPeople, 'person', true) })} tone="accent" emphasis />
            <ProgressBar value={c.checkedInPeople} max={Math.max(1, c.confirmedPeople)} tone="success" label={t('csRate')} />
          </div>
          <Stat label={t('csPartiesIn')} value={c.arrivedParties} sub={t('csOfConfirmedParties', { n: c.confirmedParties })} />
          <Stat label={t('csPartial')} value={c.partialParties} sub={t('csOthersWaiting')} tone={c.partialParties ? 'warning' : undefined} />
          <Stat label={t('csNotYet')} value={notArrived.length} sub={t('csConfirmedInv')} />
        </div>}

        {phase !== 'event_day' && phase !== 'completed' && (
          <Panel title={t('csPrepTitle')} subtitle={t('csPrepSub')} className="reception-prep">
            <JourneyArtwork kind="reception" className="reception-art"/><div className="stack gap-4"><ol className="reception-steps"><li><strong>١</strong><span>{t('csStep1')}</span></li><li><strong>٢</strong><span>{t('csStep2')}</span></li><li><strong>٣</strong><span>{t('csStep3')}</span></li></ol>
              <p className="muted">{t('csExplain')}</p>
              <CopyField label={t('csLinkLabel')} value={absolute(paths.gate(event.id))} hint={t('csLinkHint')} onCopied={() => void prepare.run()} />
              {event.checkInPreparedAt ? <Banner tone="success" compact>{t('csReady')}</Banner> : <p className="faint t-sm">{t('csTryOnce')}</p>}
            </div>
          </Panel>
        )}

        {(phase === 'event_day' || phase === 'completed' || live.length > 0) && <><div className="overview-grid">
          <Panel title={t('csExceptions', { n: exceptions.length + walkIns.length })} subtitle={t('csExceptionsSub')}>
            {exceptions.length + walkIns.length === 0 ? <p className="faint t-sm">{t('csNoExceptions')}</p> : (
              <ul className="plain-list">
                {walkIns.map((a) => (
                  <li key={a.id} className="plain-row">
                    <span className="grow">
                      <span className="row-title">{String(a.data.name ?? '')}</span>
                      <span className="row-sub"><Badge tone="warning">{t('csWalkIn')}</Badge><span>{n(Number(a.data.count) || 1, 'person')}</span></span>
                      {a.data.note && <span className="row-note t-sm">«{String(a.data.note)}»</span>}
                    </span>
                    <time className="faint t-xs">{relativeTime(a.at, now, dialect)}</time>
                  </li>
                ))}
                {exceptions.map((r) => (
                  <li key={r.id} className="plain-row">
                    <span className="grow">
                      <Link to={paths.guests(event.id, { party: r.partyId })} className="row-title">{name(r.partyId)}</Link>
                      <span className="row-sub">{r.exceptions.filter((e) => e !== 'no_table').map((e) => <Badge key={e} tone="warning">{t(EXCEPTION_KEY[e].title)}</Badge>)}<span>{n(r.count, 'person')} · {r.by}</span></span>
                      {r.staffNote && <span className="row-note t-sm">«{r.staffNote}»</span>}
                    </span>
                    <time className="faint t-xs">{relativeTime(r.at, now, dialect)}</time>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title={t('csWaiting', { n: partial.length })}>
            {partial.length === 0 ? <p className="faint t-sm">{t('csNoPartial')}</p> : (
              <ul className="plain-list">
                {partial.map((p) => <li key={p.id} className="plain-row"><span className="grow t-bold">{p.primaryGuestName}</span><span className="num t-sm">{p.checkedInCount} / {expectedArrivals(p)}</span></li>)}
              </ul>
            )}
          </Panel>
        </div>

        <Panel title={t('csLatest')}>
          {live.length === 0 ? <EmptyState compact icon="door" title={t('csNobody')}>{t('csNobodyHint')}</EmptyState> : (
            <ul className="plain-list">
              {live.slice(0, 20).map((r) => (
                <li key={r.id} className="plain-row">
                  <span className="grow"><span className="row-title">{name(r.partyId)}</span><span className="row-sub">{n(r.count, 'person')} · {r.method === 'qr' ? t('csByCode') : t('csBySearch')}</span></span>
                  <time className="faint t-xs num">{clockTime(r.at, event.timeZone)}</time>
                </li>
              ))}
            </ul>
          )}
          {live.length > 20 && <p className="faint t-sm">{t('csMore', { invitations: n(live.length - 20, 'invitation') })}</p>}
        </Panel></>}
      </div>
    </>
  );
}
