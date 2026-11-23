/** Phone-only "more" page: the event sections that don't fit in the bottom tab bar. */
import type { Event } from '../../domain/types';
import { eventPhase } from '../../domain/event';
import { countParties } from '../../domain/parties';
import { Icon, PageHeader, type IconName } from '../../ui';
import { Link } from '../../app/router';
import { useNow } from '../../app/data';
import { paths } from '../../app/paths';
import { useParties } from '../shared/queries';
import { useCopy } from '../../ui/copy';

export function MorePage({ event }: { event: Event }) {
  const now = useNow();
  const { t, n } = useCopy();
  const parties = useParties(event.id);
  const phase = eventPhase(event, now);
  const c = parties.data ? countParties(parties.data) : null;
  const items: Array<{ to: string; icon: IconName; label: string; hint: string }> = [
    { to: paths.seating(event.id), icon: 'table', label: t('wsTables'), hint: t('moreTablesHint') },
    { to: paths.rsvp(event.id), icon: 'envelope', label: t('moreReplies'), hint: c ? `${c.awaitingReply} ${t('pendingReply')} · ${t('moreConfirmed', { people: n(c.confirmedPeople, 'person') })}` : t('moreRepliesHint') },
    { to: paths.checkin(event.id), icon: 'door', label: t('wsCheckin'), hint: t(phase === 'event_day' ? 'moreCheckinToday' : 'moreCheckinHint') },
    { to: paths.gate(event.id), icon: 'scan', label: t('moreGate'), hint: t('moreGateHint') },
    { to: paths.settings(event.id), icon: 'settings', label: t('wsSettings'), hint: t('moreSettingsHint') },
    ...(phase === 'completed' || phase === 'archived' ? [{ to: paths.summary(event.id), icon: 'flag' as IconName, label: t('wsSummary'), hint: t('moreSummaryHint') }] : []),
    { to: paths.events, icon: 'list', label: t('wsAllEvents'), hint: t('moreAllEventsHint') },
  ];
  return (
    <>
      <PageHeader title={t('wsMore')} />
      <ul className="more-list">
        {items.map((it) => (
          <li key={it.to}>
            <Link to={it.to} className="more-item">
              <span className="more-icon"><Icon name={it.icon} /></span>
              <span className="grow"><span className="more-label">{it.label}</span><span className="more-hint">{it.hint}</span></span>
              <Icon name="forward" size="sm" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
