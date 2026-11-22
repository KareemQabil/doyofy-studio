import { useEffect, useState, type ReactNode } from 'react';
import { Link, Redirect, useLocation, useNavigate } from '../../app/router';
import { usePrototype, useServices } from '../../app/data';
import { safeAccountReturn } from '../../domain/account';
import { DIALECTS, type Dialect } from '../../domain/copy';
import type { Role } from '../../domain/types';
import { useCopy } from '../../ui/copy';
import { AudioLibrary } from './AudioLibrary';
import { Logo } from '../../ui/brand';
import { Button, Field, Input, Icon, LinkButton, Panel, PageHeader, AppShell, Select } from '../../ui';
import { AppearanceSwitch } from '../../ui/primitives/AppearanceSwitch';
import { AccountMenu } from './AccountMenu';
import { saveDemoAccount, useDemoAccount } from './session';
import { CateringHome } from './CateringHome';
import { canViewFood } from '../../domain/roles';
import { paths } from '../../app/paths';
import { ReceiptList } from '../billing/Receipt';
import { allReceipts } from '../../domain/billing';
import { useEvents } from '../shared/queries';
import { useCapacityVersion } from '../billing/CapacityMeter';

/** each account moment gets its own still life (A10) instead of one repeated hero; phones show it as a slim band */
const AUTH_ART = {
  folds: { src: 'celebration-folds', line: ['auArtFolds1', 'auArtFolds2'] },
  collection: { src: 'occasion-collection', line: ['auArtCollection1', 'auArtCollection2'] },
  table: { src: 'celebration-table', line: ['auArtTable1', 'auArtTable2'] },
} as const;
/** the header's one link points to the OTHER door: sign-up ↔ log-in (never «into the platform» before an account exists) */
function AuthLayout({ children, title, line, art = 'folds', other }: { children: ReactNode; title: string; line: string; art?: keyof typeof AUTH_ART; other?: { to: string; label: string } }) {
  const { t } = useCopy();
  const a = AUTH_ART[art], door = other ?? { to: '/app/login', label: t('login') };
  return <div className={`auth-page art-${art}`}><header className="auth-header"><Link to="/app/welcome" aria-label="ضيوفي"><Logo height={32} /></Link><Link to={door.to}>{door.label}<Icon name="forward" size="sm" /></Link></header><main className="auth-main"><section className="auth-copy"><p className="auth-kicker">{t('auKicker')}</p><h1>{title}</h1><p className="auth-line">{line}</p>{children}</section><aside className="auth-art" aria-label={t('auArtLabel')}><picture><source srcSet={`assets/editorial/${a.src}.avif`} type="image/avif" /><img src={`assets/editorial/${a.src}.webp`} alt="" width="1536" height="1024" decoding="async" /></picture><div className="auth-art-caption"><span className="auth-art-index">ضيوفي</span><p>{t(a.line[0])}<br />{t(a.line[1])}</p><span>{t('auArtSteps')}</span></div></aside></main><footer className="auth-footer">{t('auFooter')}<span>{t('auDemo')}</span></footer></div>;
}

export { WelcomePage } from './Welcome';

export function LoginPage({ signup = false }: { signup?: boolean }) {
  const navigate = useNavigate(), loc = useLocation(); const a = useDemoAccount(); const proto = usePrototype(); const { t } = useCopy();
  const [name, setName] = useState(a.name || ''), [email, setEmail] = useState(a.email || ''), [error, setError] = useState('');
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError(t('auBadInput')); return; }
    saveDemoAccount({ status: 'demo', name: name.trim(), email: email.trim() });
    // a brand-new account (sign-up with nowhere to return to) starts empty and lands in its first event; a sign-up that
    // returns to something on this device (?next=…) keeps it. The demo events stay one tap away on the welcome page.
    const next = safeAccountReturn(loc.search.get('next'));
    if (signup && next === '/app/events') { proto.reset('empty'); navigate(paths.newEvent, { replace: true, force: true }); }
    else navigate(next, { replace: true }); };
  return <AuthLayout art={signup ? 'collection' : 'folds'} other={signup ? { to: '/app/login', label: t('login') } : { to: '/app/signup', label: t('auNewAccount') }} title={signup ? t('auSignupTitle') : t('auLoginTitle')} line={signup ? t('auSignupLine') : t('auLoginLine')}><form className="auth-form" onSubmit={submit}><Field label={t('auYourName')} required error={error && !name.trim() ? error : undefined}><Input autoComplete="name" value={name} maxLength={70} onChange={e => { setName(e.target.value); setError(''); }} placeholder={t('auNamePh')} /></Field><Field label={t('email')} required error={error && !!name.trim() ? error : undefined}><Input type="email" ltr autoComplete="email" inputMode="email" value={email} maxLength={160} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="you@example.com" /></Field><Button type="submit" variant="primary" size="lg" block iconEnd="forward">{signup ? t('auStartDemo') : t('auDemoLogin')}</Button><p className="auth-demo-note"><Icon name="info" size="sm" />{t('auDemoNote')}</p></form><p className="auth-switch">{signup ? t('auHaveAccount') : t('auFirstTime')} <Link to={`${signup ? '/app/login' : '/app/signup'}?next=${encodeURIComponent(safeAccountReturn(loc.search.get('next')))}`}>{signup ? t('login') : t('auStartHere')}</Link></p></AuthLayout>;
}

export function LogoutPage() {
  useEffect(() => { saveDemoAccount({ status: 'signed-out' }); }, []);
  const { t } = useCopy();
  return <AuthLayout art="table" title={t('auByeTitle')} line={t('auByeLine')}><LinkButton to="/app/login" variant="primary" size="lg" iconEnd="forward">{t('auBackToLogin')}</LinkButton><Link to="/app/welcome" className="auth-switch">{t('auToWelcome')}</Link></AuthLayout>;
}

export function AccountPage() {
  const a = useDemoAccount(), services = useServices(), proto = usePrototype(), user = services.session.currentUser();
  const { t, dialect, setDialect } = useCopy();
  const [name, setName] = useState(a.name || user.name), [email, setEmail] = useState(a.email || '');
  const [saved, setSaved] = useState(false), [nameError, setNameError] = useState('');
  const [role, setRole] = useState<Role>(user.role), [preferenceSaved, setPreferenceSaved] = useState<'language' | 'role' | null>(null);
  useEffect(() => services.onChange(() => setRole(services.session.currentUser().role)), [services]);
  const events = useEvents(); useCapacityVersion();
  return <AppShell right={<AccountMenu />}>
    <main id="main" className="account-page">
      <PageHeader title={t('account')} subtitle={t('accountSubtitle')} />
      <div className="account-page-grid">
        <div className="stack gap-5">
          <Panel title={t('profile')}>
            <form className="stack gap-5" onSubmit={e => {
              e.preventDefault();
              if (!name.trim()) { setNameError(t('nameRequired')); return; }
              setNameError(''); saveDemoAccount({ status: 'demo', name: name.trim(), email: email.trim() }); setSaved(true);
            }}>
              <Field label={t('name')} required error={nameError}><Input value={name} required maxLength={70} onChange={e => { setName(e.target.value); setSaved(false); }} /></Field>
              <Field label={t('email')} optional><Input type="email" ltr value={email} maxLength={160} onChange={e => { setEmail(e.target.value); setSaved(false); }} /></Field>
              <div className="row wrap gap-3"><Button type="submit" variant="primary">{t('saveProfile')}</Button>{saved && <span role="status" className="account-saved">{t('profileSaved')}</span>}</div>
            </form>
          </Panel>
          <AudioLibrary />
        </div>
        <div className="stack gap-5">
          <Panel title={t('languageStyle')}>
            <Field label={t('languageStyle')} hint={t('languageHint')}>
              <Select value={dialect} onChange={e => { setDialect(e.target.value as Dialect); setPreferenceSaved('language'); }}>
                {DIALECTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </Select>
            </Field>
            {preferenceSaved === 'language' && <p role="status" className="account-saved">{t('languageSaved')}</p>}
          </Panel>
          <Panel title={t('roleTitle')}>
            <Field label={t('roleTitle')} hint={t('roleHint')}>
              <Select value={role} onChange={e => { const next = e.target.value as Role; proto.update({ role: next }); setRole(next); setPreferenceSaved('role'); }}>
                <option value="organizer">{t('organizer')}</option><option value="coordinator">{t('coordinator')}</option><option value="caterer">{t('caterer')}</option>
              </Select>
            </Field>
            {preferenceSaved === 'role' && <p role="status" className="account-saved">{t('roleSaved')}</p>}
          </Panel>
          <Panel title={t('appearance')}><p className="muted">{t('appearanceHint')}</p><AppearanceSwitch /></Panel>
          {/* receipts live with each event's capacity; the account lists them all in one place too */}
          <Panel title={t('auPayments')}><ReceiptList receipts={allReceipts()} eventName={(id) => events.data?.find((e) => e.id === id)?.title} empty={t('auNoPayments')} /></Panel>
          <Panel title={t('demoSession')}><p className="muted">{t('demoSessionHint')}</p><LinkButton to="/app/logout" variant="secondary" icon="back">{t('logout')}</LinkButton></Panel>
        </div>
      </div>
    </main>
  </AppShell>;
}

const HELP_STEPS = [['01', 'hp1', 'hp1Line', '/app/events/new'], ['02', 'hp2', 'hp2Line', '/app/events'], ['03', 'hp3', 'hp3Line', '/app/events'], ['04', 'hp4', 'hp4Line', '/app/events']] as const;
export function HelpPage() {
  const { t } = useCopy();
  return <AppShell><main id="main" className="account-page"><PageHeader title={t('hpTitle')} subtitle={t('hpSub')} /><div className="help-grid">{HELP_STEPS.map(([n, title, line, to]) => <Panel key={n}><span className="help-number">{n}</span><h2>{t(title)}</h2><p>{t(line)}</p><LinkButton to={to} variant="ghost" iconEnd="forward">{t('hpGo')}</LinkButton></Panel>)}</div><p className="auth-demo-note">{t('hpDemoNote')}</p></main></AppShell>;
}

export function OrganizerSessionGate({ children }: { children: ReactNode }) {
  const services = useServices();
  const { t } = useCopy();
  const [role, setRole] = useState(services.session.currentUser().role);
  useEffect(() => services.onChange(() => setRole(services.session.currentUser().role)), [services]);
  const account = useDemoAccount(), loc = useLocation(); const open = ['/app/login','/app/signup','/app/logout','/app/welcome','/app/help'].includes(loc.pathname);
  if (account.status === 'signed-out' && (loc.pathname.startsWith('/app/') || loc.pathname.startsWith('/check-in/') || loc.pathname.startsWith('/prototype/')) && !open) return <Redirect to={`/app/login?next=${encodeURIComponent(loc.href)}`} />;
  if (canViewFood(role)) {
    if (loc.pathname === '/app/events') return <CateringHome />;
    const eventRoute = loc.pathname.match(/^\/app\/events\/([^/]+)(?:\/(.*))?$/);
    const allowed = eventRoute && ['guests', 'seating', 'settings'].includes(eventRoute[2] || '');
    const organizerRoute = eventRoute || loc.pathname.startsWith('/check-in/') || loc.pathname.startsWith('/prototype/');
    if (organizerRoute && !allowed) {
      const id = eventRoute?.[1] !== 'new' ? eventRoute?.[1] : undefined;
      const recovery = id ? `${paths.guests(id)}?view=food` : paths.events;
      return <AppShell right={<AccountMenu />}><main id="main" className="account-page"><PageHeader title={t('auCatTitle')} subtitle={t('auCatSub')} /><div className="row wrap gap-3"><LinkButton to={recovery} variant="primary" icon="sparkle">{t('auCatOpen')}</LinkButton><LinkButton to="/app/account" icon="settings">{t('roleTitle')}</LinkButton></div></main></AppShell>;
    }
  }
  return <>{children}</>;
}
