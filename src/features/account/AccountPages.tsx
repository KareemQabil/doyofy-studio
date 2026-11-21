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

/** each account moment gets its own still life (A10) instead of one repeated hero; phones show it as a slim band */
const AUTH_ART = {
  folds: { src: 'celebration-folds', line: <>فرحتك لها<br />شكلها الخاص.</> },
  collection: { src: 'occasion-collection', line: <>كل مناسبة<br />تبدأ بورقة بيضاء.</> },
  table: { src: 'celebration-table', line: <>المائدة جاهزة،<br />والضيوف قادمون.</> },
} as const;
function AuthLayout({ children, title, line, art = 'folds' }: { children: ReactNode; title: string; line: string; art?: keyof typeof AUTH_ART }) {
  const a = AUTH_ART[art];
  return <div className={`auth-page art-${art}`}><header className="auth-header"><Link to="/app/welcome" aria-label="ضيوفي"><Logo height={32} /></Link><Link to="/app/events">الدخول للمنصة<Icon name="forward" size="sm" /></Link></header><main className="auth-main"><section className="auth-copy"><p className="auth-kicker">كل فرحة تبدأ بدعوة.</p><h1>{title}</h1><p className="auth-line">{line}</p>{children}</section><aside className="auth-art" aria-label="خامات من هوية ضيوفي"><picture><source srcSet={`assets/editorial/${a.src}.avif`} type="image/avif" /><img src={`assets/editorial/${a.src}.webp`} alt="" width="1536" height="1024" decoding="async" /></picture><div className="auth-art-caption"><span className="auth-art-index">ضيوفي</span><p>{a.line}</p><span>دعوة · ضيوف · ردود · استقبال</span></div></aside></main><footer className="auth-footer">ضيوفي — من أول دعوة إلى آخر ضيف.<span>نسخة تجربة</span></footer></div>;
}

export { WelcomePage } from './Welcome';

export function LoginPage({ signup = false }: { signup?: boolean }) {
  const navigate = useNavigate(), loc = useLocation(); const a = useDemoAccount();
  const [name, setName] = useState(a.name || ''), [email, setEmail] = useState(a.email || ''), [error, setError] = useState('');
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('اكتب اسمك وبريدًا إلكترونيًا صحيحًا.'); return; }
    saveDemoAccount({ status: 'demo', name: name.trim(), email: email.trim() }); navigate(safeAccountReturn(loc.search.get('next')), { replace: true }); };
  return <AuthLayout art={signup ? 'collection' : 'folds'} title={signup ? 'أول خطوة لفرحة مرتّبة.' : 'أهلًا بعودتك.'} line={signup ? 'مساحة لدعواتك ومناسباتك وكل من تحب.' : 'دعواتك وتفاصيل مناسباتك، في مكان واحد.'}><form className="auth-form" onSubmit={submit}><Field label="اسمك" required error={error && !name.trim() ? error : undefined}><Input autoComplete="name" value={name} maxLength={70} onChange={e => { setName(e.target.value); setError(''); }} placeholder="الاسم الذي تحب أن نناديك به" /></Field><Field label="البريد الإلكتروني" required error={error && !!name.trim() ? error : undefined}><Input type="email" ltr autoComplete="email" inputMode="email" value={email} maxLength={160} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="you@example.com" /></Field><Button type="submit" variant="primary" size="lg" block iconEnd="forward">{signup ? 'ابدأ التجربة' : 'دخول تجريبي'}</Button><p className="auth-demo-note"><Icon name="info" size="sm" />جلسة تجربة على هذا الجهاز. لا نطلب كلمة مرور ولا نرسل بريدًا فعليًا.</p></form><p className="auth-switch">{signup ? 'بدأت رحلتك من قبل؟' : 'أول مرة معنا؟'} <Link to={`${signup ? '/app/login' : '/app/signup'}?next=${encodeURIComponent(safeAccountReturn(loc.search.get('next')))}`}>{signup ? 'تسجيل الدخول' : 'ابدأ هنا'}</Link></p></AuthLayout>;
}

export function LogoutPage() {
  useEffect(() => { saveDemoAccount({ status: 'signed-out' }); }, []);
  return <AuthLayout art="table" title="نراك في فرحة قادمة." line="تم تسجيل الخروج من جلسة التجربة. مناسباتك ودعواتك المحفوظة على هذا الجهاز بقيت كما هي."><LinkButton to="/app/login" variant="primary" size="lg" iconEnd="forward">العودة لتسجيل الدخول</LinkButton><Link to="/app/welcome" className="auth-switch">إلى الصفحة الترحيبية</Link></AuthLayout>;
}

export function AccountPage() {
  const a = useDemoAccount(), services = useServices(), proto = usePrototype(), user = services.session.currentUser();
  const { t, dialect, setDialect } = useCopy();
  const [name, setName] = useState(a.name || user.name), [email, setEmail] = useState(a.email || '');
  const [saved, setSaved] = useState(false), [nameError, setNameError] = useState('');
  const [role, setRole] = useState<Role>(user.role), [preferenceSaved, setPreferenceSaved] = useState<'language' | 'role' | null>(null);
  useEffect(() => services.onChange(() => setRole(services.session.currentUser().role)), [services]);
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
          <Panel title={t('demoSession')}><p className="muted">{t('demoSessionHint')}</p><LinkButton to="/app/logout" variant="secondary" icon="back">{t('logout')}</LinkButton></Panel>
        </div>
      </div>
    </main>
  </AppShell>;
}

export function HelpPage() {
  return <AppShell><main id="main" className="account-page"><PageHeader title="كل خطوة لها طريق واضح." subtitle="من اختيار المناسبة حتى استقبال آخر ضيف." /><div className="help-grid">{[['01','ابدأ بمناسبتك','اكتب الأسماء والموعد والمكان. نختار بداية مناسبة يمكنك تغييرها.','/app/events/new'],['02','دعوة تحمل لمستك','اختر البطاقة وأجواء الدعوة، ثم عدّل الكلمة والبرنامج.','/app/events'],['03','لكل ضيف دعوته','أضف ضيوفك وشارك الروابط بعد نشر الدعوة.','/app/events'],['04','استقبال على مهل','تابع الردود وجهّز فريق الاستقبال قبل يوم المناسبة.','/app/events']].map(([n,title,line,to]) => <Panel key={n}><span className="help-number">{n}</span><h2>{title}</h2><p>{line}</p><LinkButton to={to!} variant="ghost" iconEnd="forward">ابدأ الخطوة</LinkButton></Panel>)}</div><p className="auth-demo-note">هذه نسخة تجربة؛ إرسال الدعوات والمصادقة الحقيقيان يتطلبان ربط الخدمات.</p></main></AppShell>;
}

export function OrganizerSessionGate({ children }: { children: ReactNode }) {
  const services = useServices();
  const [role, setRole] = useState(services.session.currentUser().role);
  useEffect(() => services.onChange(() => setRole(services.session.currentUser().role)), [services]);
  const account = useDemoAccount(), loc = useLocation(); const open = ['/app/login','/app/signup','/app/logout','/app/welcome','/app/help'].includes(loc.pathname);
  if (account.status === 'signed-out' && (loc.pathname.startsWith('/app/') || loc.pathname.startsWith('/check-in/') || loc.pathname.startsWith('/prototype/')) && !open) return <Redirect to={`/app/login?next=${encodeURIComponent(loc.href)}`} />;
  if (canViewFood(role)) {
    if (loc.pathname === '/app/events') return <CateringHome />;
    const eventRoute = loc.pathname.match(/^\/app\/events\/([^/]+)(?:\/(.*))?$/);
    const allowed = eventRoute && ['guests', 'seating'].includes(eventRoute[2] || '');
    const organizerRoute = eventRoute || loc.pathname.startsWith('/check-in/') || loc.pathname.startsWith('/prototype/');
    if (organizerRoute && !allowed) {
      const id = eventRoute?.[1] !== 'new' ? eventRoute?.[1] : undefined;
      const recovery = id ? `${paths.guests(id)}?view=food` : paths.events;
      return <AppShell right={<AccountMenu />}><main id="main" className="account-page"><PageHeader title="مساحة الضيافة" subtitle="هذه الأدوات متاحة لفريق التنظيم. يمكنك متابعة الطعام والطاولات أو تغيير طريقة عرض الحساب." /><div className="row wrap gap-3"><LinkButton to={recovery} variant="primary" icon="sparkle">افتح الضيافة</LinkButton><LinkButton to="/app/account" icon="settings">طريقة عرض الحساب</LinkButton></div></main></AppShell>;
    }
  }
  return <>{children}</>;
}
