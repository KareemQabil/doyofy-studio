import { useEffect, useMemo } from 'react';
import { createServices } from '../services';
import { ServicesProvider } from './data';
import { Redirect, RouterProvider, Routes, useRouter, type RouteDef, type RouterMode } from './router';
import { ToastProvider } from '../ui/primitives/Feedback';
import { ConfirmDialog } from '../ui/primitives/Overlay';
import { EventWorkspace } from '../features/workspace/EventWorkspace';
import { EventsHome } from '../features/events/EventsHome';
import { CreateEvent } from '../features/events/CreateEvent';
import { Overview } from '../features/overview/Overview';
import { InvitationSummary } from '../features/invitation/InvitationSummary';
import { InvitationEditor } from '../features/editor/InvitationEditor';
import { GuestPreview } from '../features/invitation/GuestPreview';
import { TemplateGallery } from '../features/templates/TemplateGallery';
import { GuestsPage } from '../features/guests/GuestsPage';
import { ImportFlow } from '../features/guests/import/ImportFlow';
import { RsvpPage } from '../features/rsvp/RsvpPage';
import { SeatingPage } from '../features/seating/SeatingPage';
import { CheckInSetup } from '../features/check-in/CheckInSetup';
import { GateMode } from '../features/check-in/GateMode';
import { SettingsPage } from '../features/settings/SettingsPage';
import { SummaryPage } from '../features/summary/SummaryPage';
import { MorePage } from '../features/workspace/MorePage';
import { GuestInvite } from '../features/guest/GuestInvite';
import { NotFound } from '../features/workspace/NotFound';
import { PrototypeTools } from '../features/prototype/PrototypeTools';
import { DemoBar } from '../features/prototype/DemoBar';
import { AppErrorBoundary } from './AppErrorBoundary';
import { ScreenReview } from '../features/prototype/ScreenReview';
import { paths } from './paths';
import { ThemeSync, applyReviewLink } from './review';
import { WelcomePage, LoginPage, LogoutPage, AccountPage, HelpPage, OrganizerSessionGate } from '../features/account/AccountPages';

const ws = (section: Parameters<typeof EventWorkspace>[0]['section'], render: Parameters<typeof EventWorkspace>[0]['children']) =>
  (p: Record<string, string>) => <EventWorkspace eventId={p.eventId!} section={section}>{render}</EventWorkspace>;

const routes: RouteDef[] = [
  { path: '/', render: () => <Redirect to="/app/welcome" /> },
  { path: '/app/welcome', render: () => <WelcomePage /> },
  { path: '/app/login', render: () => <LoginPage /> },
  { path: '/app/signup', render: () => <LoginPage signup /> },
  { path: '/app/logout', render: () => <LogoutPage /> },
  { path: '/app/account', render: () => <AccountPage /> },
  { path: '/app/help', render: () => <HelpPage /> },
  { path: '/app', render: () => <Redirect to={paths.events} /> },
  { path: '/app/events', render: () => <EventsHome /> },
  { path: '/app/events/new', render: () => <CreateEvent /> },
  { path: '/app/events/:eventId', render: (p) => <Redirect to={paths.overview(p.eventId!)} /> },
  { path: '/app/events/:eventId/overview', render: ws('overview', (e) => <Overview event={e} />) },
  { path: '/app/events/:eventId/invitation', render: ws('invitation', (e) => <InvitationSummary event={e} />) },
  { path: '/app/events/:eventId/invitation/templates', render: (p) => <TemplateGallery eventId={p.eventId!} /> },
  { path: '/app/events/:eventId/invitation/design', render: (p) => <InvitationEditor eventId={p.eventId!} /> },
  { path: '/app/events/:eventId/invitation/preview', render: (p) => <GuestPreview eventId={p.eventId!} /> },
  { path: '/app/events/:eventId/guests', render: ws('guests', (e) => <GuestsPage event={e} />) },
  { path: '/app/events/:eventId/guests/import', render: (p) => <ImportFlow eventId={p.eventId!} /> },
  { path: '/app/events/:eventId/rsvp', render: ws('rsvp', (e) => <RsvpPage event={e} />) },
  { path: '/app/events/:eventId/seating', render: ws('seating', (e) => <SeatingPage event={e} />) },
  { path: '/app/events/:eventId/check-in', render: ws('checkin', (e) => <CheckInSetup event={e} />) },
  { path: '/app/events/:eventId/settings', render: ws('settings', (e) => <SettingsPage event={e} />) },
  { path: '/app/events/:eventId/summary', render: ws('summary', (e) => <SummaryPage event={e} />) },
  { path: '/app/events/:eventId/more', render: ws('more', (e) => <MorePage event={e} />) },
  { path: '/i/:slug', render: (p) => <GuestInvite slug={p.slug!} /> },
  { path: '/i/:slug/:code', render: (p) => <GuestInvite slug={p.slug!} code={p.code!} /> },
  { path: '/check-in/:eventId', render: (p) => <GateMode eventId={p.eventId!} /> },
  { path: '/prototype/screen-review', render: () => <ScreenReview /> },
];

function PendingNavigation() {
  const { pendingNav, resolvePending } = useRouter();
  return (
    <ConfirmDialog open={!!pendingNav} title="مغادرة الصفحة؟" body={pendingNav?.message} confirmLabel="غادر دون حفظ" cancelLabel="ابقَ هنا" tone="danger"
      onConfirm={() => resolvePending(true)} onCancel={() => resolvePending(false)} />
  );
}

export function App({ mode }: { mode: RouterMode }) {
  const { services, prototype } = useMemo(() => {
    const made = createServices();
    applyReviewLink(made.prototype);
    return made;
  }, []);
  // test/QA hook (Playwright): reset scenarios and read state without touching storage directly
  useEffect(() => { (window as unknown as { __doyofy?: unknown }).__doyofy = { services, prototype }; }, [services, prototype]);
  return (
    <ServicesProvider services={services} prototype={prototype}>
      <RouterProvider mode={mode}>
        <ToastProvider>
          <ThemeSync />
          <DemoBar />
          <AppErrorBoundary><OrganizerSessionGate><Routes routes={routes} fallback={<NotFound />} /></OrganizerSessionGate></AppErrorBoundary>
          <PendingNavigation />
          <PrototypeTools />
        </ToastProvider>
      </RouterProvider>
    </ServicesProvider>
  );
}
