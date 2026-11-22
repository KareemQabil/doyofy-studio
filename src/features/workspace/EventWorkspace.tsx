/**
 * Event workspace: loads the event once and frames every event section with the same navigation
 * (sidebar on desktop, bottom tabs on phones). Sections receive the loaded Event.
 */
import type { ReactNode } from 'react';
import type { Event } from '../../domain/types';
import { eventPhase, PHASE_LABEL } from '../../domain/event';
import { PHASE_KEY } from '../../domain/copy/activity';
import { countdownLabel, formatEventDate } from '../../domain/format';
import { countParties } from '../../domain/parties';
import { todayFor } from '../../domain/event';
import { AppShell, Badge, ErrorState, Icon, LinkButton, Skeleton, WorkspaceLayout, type NavItem, PageLoader } from '../../ui';
import { Link } from '../../app/router';
import { useNow, useServices } from '../../app/data';
import { canViewFood } from '../../domain/roles';
import { paths } from '../../app/paths';
import { useEvent, useParties } from '../shared/queries';
import { isAppError } from '../../services/errors';
import { NotFound } from './NotFound';
import { OccasionGlyph } from '../../ui/icons';
import { AccountMenu } from '../account/AccountMenu';
import { GuestExperienceSettings } from '../settings/GuestExperienceSettings';
import { useCopy } from '../../ui/copy';

export type Section = 'overview' | 'invitation' | 'guests' | 'rsvp' | 'seating' | 'checkin' | 'settings' | 'summary' | 'more';

export function UserChip() {
  return <AccountMenu />;
}

export function EventWorkspace({ eventId, section, children }: { eventId: string; section: Section; children: (e: Event) => ReactNode }) {
  const catering = canViewFood(useServices().session.currentUser().role);
  const ev = useEvent(eventId);
  const parties = useParties(eventId);
  const now = useNow();
  const { t, dialect } = useCopy();

  if (ev.error && isAppError(ev.error) && ev.error.code === 'not_found') return <NotFound message={ev.error.message} />;

  const e = ev.data;
  const phase = e ? eventPhase(e, now) : 'upcoming';
  const c = parties.data ? countParties(parties.data) : null;
  const id = eventId;
  const nav: NavItem[] = [
    { to: paths.overview(id), label: t('wsOverview'), icon: 'home', active: section === 'overview', group: t('wsGroupPrep') },
    { to: paths.invitation(id), label: t('wsInvitation'), icon: 'envelope', active: section === 'invitation', group: t('wsGroupPrep') },
    { to: paths.guests(id), label: t('wsGuestsReplies'), icon: 'users', active: section === 'guests' || section === 'rsvp', badge: c?.parties, group: t('wsGroupPrep') },
    { to: paths.seating(id), label: t('wsTables'), icon: 'table', active: section === 'seating', group: t('wsGroupMore') },
    { to: paths.checkin(id), label: t('wsCheckin'), icon: 'door', active: section === 'checkin', badge: phase === 'event_day' ? t('wsToday') : undefined, tone: 'accent', group: t('phEventDay') },
    { to: paths.settings(id), label: t('wsSettings'), icon: 'settings', active: section === 'settings', group: t('wsGroupMore') },
  ];
  if (phase === 'completed' || phase === 'archived') nav.push({ to: paths.summary(id), label: t('wsSummary'), icon: 'flag', active: section === 'summary', group: t('wsGroupMore') });
  const mobile: NavItem[] = [
    { ...nav[0]!, label: t('wsEvent') }, nav[1]!, { ...nav[2]!, label: t('wsGuests') },
    nav[4]!,
    { to: `/app/events/${encodeURIComponent(id)}/more`, label: t('wsMore'), icon: 'menu', active: ['settings','summary','more','seating'].includes(section) },
  ];
  const cateringNav: NavItem[] = [
    { to: `${paths.guests(id)}?view=food`, label: t('glCatering'), icon: 'sparkle', active: section === 'guests', group: t('acByCaterer') },
    { to: paths.seating(id), label: t('wsTables'), icon: 'table', active: section === 'seating', group: t('acByCaterer') },
    { to: paths.settings(id), label: t('xsFoodTitle'), icon: 'settings', active: section === 'settings', group: t('acByCaterer') },
  ];
  const cateringAllowed = ['guests', 'seating', 'settings'].includes(section);

  const context = e ? (
    <div className="ws-event">
      <span className="ws-event-art" aria-hidden="true"><OccasionGlyph type={e.type} /></span>
      <Link to={paths.events} className="ws-allevents"><Icon name="back" size="sm" />{t('wsAllEvents')}</Link>
      <p className="ws-event-title">{e.title}</p>
      <p className="ws-event-meta"><span>{formatEventDate(e.date, { year: false })}</span><span aria-hidden="true">·</span><span>{countdownLabel(e.date, todayFor(e, now), dialect)}</span></p>
      <Badge tone={PHASE_LABEL[phase].tone} dot>{t(PHASE_KEY[phase])}</Badge>
    </div>
  ) : <Skeleton lines={3} />;

  const mobileContext = (
    <>
      <Link to={paths.events} className="btn btn-ghost btn-icon" aria-label={t('wsAllEvents')}><Icon name="back" /></Link>
      <span className="ws-mobile-head">
        <span className="ws-mobile-title truncate">{e?.title ?? ''}</span>
        {e && <span className="ws-mobile-meta"><span className={`ws-mobile-phase tone-${PHASE_LABEL[phase].tone}`} aria-hidden="true" />{t(PHASE_KEY[phase])} · {countdownLabel(e.date, todayFor(e, now), dialect)}</span>}
      </span>
    </>
  );

  return (
    <AppShell right={<UserChip />} mobileContext={mobileContext}>
      <WorkspaceLayout
        context={context}
        nav={catering ? cateringNav : nav}
        mobileNav={catering ? cateringNav : mobile}
        footer={<><p className="ws-footer-note">{catering ? t('wsCatFooter') : <>{t('wsFooterA')}<br />{t('wsFooterB')}</>}</p>{!catering && (phase === 'event_day' || section === 'checkin') && <LinkButton to={paths.gate(id)} variant="primary" icon="scan" block>{t('stepGate')}</LinkButton>}</>}
      >
        {ev.loading ? <PageLoader /> : ev.error ? <ErrorState error={ev.error} onRetry={ev.refetch} /> : e ? catering && !cateringAllowed
          ? <section className="stack gap-3"><h1>{t('auCatTitle')}</h1><p>{t('wsCatText')}</p><LinkButton to={`${paths.guests(id)}?view=food`} variant="primary" icon="sparkle">{t('auCatOpen')}</LinkButton></section>
          : catering && section === 'settings' ? <GuestExperienceSettings event={e} foodOnly /> : children(e) : null}
      </WorkspaceLayout>
    </AppShell>
  );
}
