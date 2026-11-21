/**
 * Event workspace: loads the event once and frames every event section with the same navigation
 * (sidebar on desktop, bottom tabs on phones). Sections receive the loaded Event.
 */
import type { ReactNode } from 'react';
import type { Event } from '../../domain/types';
import { eventPhase, PHASE_LABEL } from '../../domain/event';
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

export type Section = 'overview' | 'invitation' | 'guests' | 'rsvp' | 'seating' | 'checkin' | 'settings' | 'summary' | 'more';

export function UserChip() {
  return <AccountMenu />;
}

export function EventWorkspace({ eventId, section, children }: { eventId: string; section: Section; children: (e: Event) => ReactNode }) {
  const catering = canViewFood(useServices().session.currentUser().role);
  const ev = useEvent(eventId);
  const parties = useParties(eventId);
  const now = useNow();

  if (ev.error && isAppError(ev.error) && ev.error.code === 'not_found') return <NotFound message={ev.error.message} />;

  const e = ev.data;
  const phase = e ? eventPhase(e, now) : 'upcoming';
  const c = parties.data ? countParties(parties.data) : null;
  const id = eventId;
  const nav: NavItem[] = [
    { to: paths.overview(id), label: 'نظرة عامة', icon: 'home', active: section === 'overview', group: 'تجهيز المناسبة' },
    { to: paths.invitation(id), label: 'الدعوة', icon: 'envelope', active: section === 'invitation', group: 'تجهيز المناسبة' },
    { to: paths.guests(id), label: 'الضيوف والردود', icon: 'users', active: section === 'guests' || section === 'rsvp', badge: c?.parties, group: 'تجهيز المناسبة' },
    { to: paths.seating(id), label: 'الطاولات', icon: 'table', active: section === 'seating', group: 'خيارات إضافية' },
    { to: paths.checkin(id), label: 'الاستقبال', icon: 'door', active: section === 'checkin', badge: phase === 'event_day' ? 'اليوم' : undefined, tone: 'accent', group: 'يوم المناسبة' },
    { to: paths.settings(id), label: 'تفاصيل المناسبة', icon: 'settings', active: section === 'settings', group: 'خيارات إضافية' },
  ];
  if (phase === 'completed' || phase === 'archived') nav.push({ to: paths.summary(id), label: 'ملخص المناسبة', icon: 'flag', active: section === 'summary', group: 'خيارات إضافية' });
  const mobile: NavItem[] = [
    { ...nav[0]!, label: 'المناسبة' }, nav[1]!, { ...nav[2]!, label: 'الضيوف' },
    nav[4]!,
    { to: `/app/events/${encodeURIComponent(id)}/more`, label: 'المزيد', icon: 'menu', active: ['settings','summary','more','seating'].includes(section) },
  ];
  const cateringNav: NavItem[] = [
    { to: `${paths.guests(id)}?view=food`, label: 'الضيافة', icon: 'sparkle', active: section === 'guests', group: 'فريق الضيافة' },
    { to: paths.seating(id), label: 'الطاولات', icon: 'table', active: section === 'seating', group: 'فريق الضيافة' },
    { to: paths.settings(id), label: 'قائمة الطعام', icon: 'settings', active: section === 'settings', group: 'فريق الضيافة' },
  ];
  const cateringAllowed = ['guests', 'seating', 'settings'].includes(section);

  const context = e ? (
    <div className="ws-event">
      <span className="ws-event-art" aria-hidden="true"><OccasionGlyph type={e.type} /></span>
      <Link to={paths.events} className="ws-allevents"><Icon name="back" size="sm" />كل المناسبات</Link>
      <p className="ws-event-title">{e.title}</p>
      <p className="ws-event-meta"><span>{formatEventDate(e.date, { year: false })}</span><span aria-hidden="true">·</span><span>{countdownLabel(e.date, todayFor(e, now))}</span></p>
      <Badge tone={PHASE_LABEL[phase].tone} dot>{PHASE_LABEL[phase].label}</Badge>
    </div>
  ) : <Skeleton lines={3} />;

  const mobileContext = (
    <>
      <Link to={paths.events} className="btn btn-ghost btn-icon" aria-label="كل المناسبات"><Icon name="back" /></Link>
      <span className="ws-mobile-head">
        <span className="ws-mobile-title truncate">{e?.title ?? ''}</span>
        {e && <span className="ws-mobile-meta"><span className={`ws-mobile-phase tone-${PHASE_LABEL[phase].tone}`} aria-hidden="true" />{PHASE_LABEL[phase].label} · {countdownLabel(e.date, todayFor(e, now))}</span>}
      </span>
    </>
  );

  return (
    <AppShell right={<UserChip />} mobileContext={mobileContext}>
      <WorkspaceLayout
        context={context}
        nav={catering ? cateringNav : nav}
        mobileNav={catering ? cateringNav : mobile}
        footer={<><p className="ws-footer-note">{catering ? 'عرض لفريق الضيافة' : <>تفاصيل مرتّبة.<br />وفرحة على راحتك.</>}</p>{!catering && (phase === 'event_day' || section === 'checkin') && <LinkButton to={paths.gate(id)} variant="primary" icon="scan" block>افتح الاستقبال</LinkButton>}</>}
      >
        {ev.loading ? <PageLoader /> : ev.error ? <ErrorState error={ev.error} onRetry={ev.refetch} /> : e ? catering && !cateringAllowed
          ? <section className="stack gap-3"><h1>مساحة الضيافة</h1><p>تابع الوجبات والاحتياجات والطاولات. إدارة الدعوات والضيوف متاحة لفريق التنظيم.</p><LinkButton to={`${paths.guests(id)}?view=food`} variant="primary" icon="sparkle">افتح الضيافة</LinkButton></section>
          : catering && section === 'settings' ? <GuestExperienceSettings event={e} foodOnly /> : children(e) : null}
      </WorkspaceLayout>
    </AppShell>
  );
}
