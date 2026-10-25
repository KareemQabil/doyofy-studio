import { useEffect, useState, type ReactNode } from 'react';
import { Link, Redirect, useLocation, useNavigate } from '../../app/router';
import { useServices } from '../../app/data';
import { safeAccountReturn } from '../../domain/account';
import { Logo } from '../../ui/brand';
import { Button, Field, Input, Icon, LinkButton, Panel, PageHeader, AppShell } from '../../ui';
import { ThemePicker } from '../../ui/primitives/ThemePicker';
import { AccountMenu } from './AccountMenu';
import { saveDemoAccount, useDemoAccount } from './session';

function AuthLayout({ children, title, line }: { children: ReactNode; title: string; line: string }) {
  return <div className="auth-page"><header className="auth-header"><Link to="/app/welcome" aria-label="ضيوفي"><Logo height={32} /></Link><Link to="/app/events">الدخول للمنصة<Icon name="forward" size="sm" /></Link></header><main className="auth-main"><section className="auth-copy"><p className="auth-kicker">كل فرحة تبدأ بدعوة.</p><h1>{title}</h1><p className="auth-line">{line}</p>{children}</section><aside className="auth-art" aria-label="خامات من هوية ضيوفي"><picture><source srcSet="assets/editorial/celebration-folds.avif" type="image/avif" /><img src="assets/editorial/celebration-folds.webp" alt="" width="1536" height="1024" decoding="async" /></picture><div className="auth-art-caption"><span className="auth-art-index">01 / ضيوفي</span><p>فرحتك لها<br />شكلها الخاص.</p><span>دعوة · ضيوف · ردود · استقبال</span></div></aside></main><footer className="auth-footer">ضيوفي — من أول دعوة إلى آخر ضيف.<span>نسخة تجربة</span></footer></div>;
}

export function WelcomePage() {
  const navigate = useNavigate();
  return <AuthLayout title="للفرح، مكان يجمعه." line="صمّم دعوتك، رتّب ضيوفك، وابدأ مناسبتك وأنت مطمئن."><div className="auth-welcome-actions"><LinkButton to="/app/signup" variant="primary" size="lg" iconEnd="forward">ابدأ فرحتك</LinkButton><LinkButton to="/app/login" variant="secondary" size="lg">عندي حساب</LinkButton></div><button type="button" className="auth-demo-link" onClick={() => { saveDemoAccount({ status: 'demo' }); navigate('/app/events'); }}>جاهز للتجربة؟ استكشف بمناسبة جاهزة ←</button><ol className="auth-journey"><li><b>01</b><span>اختر مناسبتك</span></li><li><b>02</b><span>أضف لمستك</span></li><li><b>03</b><span>رحّب بضيوفك</span></li></ol></AuthLayout>;
}

export function LoginPage({ signup = false }: { signup?: boolean }) {
  const navigate = useNavigate(), loc = useLocation(); const a = useDemoAccount();
  const [name, setName] = useState(a.name || ''), [email, setEmail] = useState(a.email || ''), [error, setError] = useState('');
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('اكتب اسمك وبريدًا إلكترونيًا صحيحًا.'); return; }
    saveDemoAccount({ status: 'demo', name: name.trim(), email: email.trim() }); navigate(safeAccountReturn(loc.search.get('next')), { replace: true }); };
  return <AuthLayout title={signup ? 'أول خطوة لفرحة مرتّبة.' : 'أهلًا بعودتك.'} line={signup ? 'مساحة لدعواتك ومناسباتك وكل من تحب.' : 'دعواتك وتفاصيل مناسباتك، في مكان واحد.'}><form className="auth-form" onSubmit={submit}><Field label="اسمك" required error={error && !name.trim() ? error : undefined}><Input autoComplete="name" value={name} maxLength={70} onChange={e => { setName(e.target.value); setError(''); }} placeholder="الاسم الذي تحب أن نناديك به" /></Field><Field label="البريد الإلكتروني" required error={error && !!name.trim() ? error : undefined}><Input type="email" ltr autoComplete="email" inputMode="email" value={email} maxLength={160} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="you@example.com" /></Field><Button type="submit" variant="primary" size="lg" block iconEnd="forward">{signup ? 'ابدأ التجربة' : 'دخول تجريبي'}</Button><p className="auth-demo-note"><Icon name="info" size="sm" />جلسة تجربة على هذا الجهاز. لا نطلب كلمة مرور ولا نرسل بريدًا فعليًا.</p></form><p className="auth-switch">{signup ? 'بدأت رحلتك من قبل؟' : 'أول مرة معنا؟'} <Link to={`${signup ? '/app/login' : '/app/signup'}?next=${encodeURIComponent(safeAccountReturn(loc.search.get('next')))}`}>{signup ? 'تسجيل الدخول' : 'ابدأ هنا'}</Link></p></AuthLayout>;
}

export function LogoutPage() {
  useEffect(() => { saveDemoAccount({ status: 'signed-out' }); }, []);
  return <AuthLayout title="نراك في فرحة قادمة." line="تم تسجيل الخروج من جلسة التجربة. مناسباتك ودعواتك المحفوظة على هذا الجهاز بقيت كما هي."><LinkButton to="/app/login" variant="primary" size="lg" iconEnd="forward">العودة لتسجيل الدخول</LinkButton><Link to="/app/welcome" className="auth-switch">إلى الصفحة الترحيبية</Link></AuthLayout>;
}

export function AccountPage() {
  const a = useDemoAccount(), user = useServices().session.currentUser(); const [name, setName] = useState(a.name || user.name), [email, setEmail] = useState(a.email || ''), [saved, setSaved] = useState(false), [nameError,setNameError] = useState('');
  return <AppShell right={<AccountMenu />}><main id="main" className="account-page"><PageHeader title="حسابك، على طريقتك." subtitle="الاسم والبريد والمظهر في مكان واحد." /><div className="account-page-grid"><Panel title="الملف الشخصي"><form className="stack gap-5" onSubmit={e => { e.preventDefault(); if (!name.trim()) { setNameError('اكتب اسمًا قبل الحفظ.'); return; } setNameError(''); saveDemoAccount({ status: 'demo', name: name.trim(), email: email.trim() }); setSaved(true); }}><Field label="الاسم" required error={nameError}><Input value={name} required maxLength={70} onChange={e => { setName(e.target.value); setSaved(false); }} /></Field><Field label="البريد الإلكتروني" optional><Input type="email" ltr value={email} maxLength={160} onChange={e => { setEmail(e.target.value); setSaved(false); }} /></Field><div className="row wrap gap-3"><Button type="submit" variant="primary">حفظ الملف</Button>{saved && <span role="status" className="account-saved">تم حفظ ملفك</span>}</div></form></Panel><div className="stack gap-5"><Panel title="إحساس المنصة"><p className="muted">اختيارك يغيّر واجهة المنصة. تصميم دعوتك يبقى كما اخترته.</p><div className="account-theme-picker"><ThemePicker /></div></Panel><Panel title="جلسة التجربة"><p className="muted">بيانات الملف والمناسبات محفوظة على هذا الجهاز. هذه ليست حسابات موثقة عبر خادم.</p><LinkButton to="/app/logout" variant="secondary" icon="back">تسجيل الخروج</LinkButton></Panel></div></div></main></AppShell>;
}

export function HelpPage() {
  return <AppShell><main id="main" className="account-page"><PageHeader title="كل خطوة لها طريق واضح." subtitle="من اختيار المناسبة حتى استقبال آخر ضيف." /><div className="help-grid">{[['01','ابدأ بمناسبتك','اكتب الأسماء والموعد والمكان. نختار بداية مناسبة يمكنك تغييرها.','/app/events/new'],['02','دعوة تحمل لمستك','اختر البطاقة وأجواء الدعوة، ثم عدّل الكلمة والبرنامج.','/app/events'],['03','لكل ضيف دعوته','أضف ضيوفك وشارك الروابط بعد نشر الدعوة.','/app/events'],['04','استقبال على مهل','تابع الردود وجهّز فريق الاستقبال قبل يوم المناسبة.','/app/events']].map(([n,title,line,to]) => <Panel key={n}><span className="help-number">{n}</span><h2>{title}</h2><p>{line}</p><LinkButton to={to!} variant="ghost" iconEnd="forward">ابدأ الخطوة</LinkButton></Panel>)}</div><p className="auth-demo-note">هذه نسخة تجربة؛ إرسال الدعوات والمصادقة الحقيقيان يتطلبان ربط الخدمات.</p></main></AppShell>;
}

export function OrganizerSessionGate({ children }: { children: ReactNode }) {
  const account = useDemoAccount(), loc = useLocation(); const open = ['/app/login','/app/signup','/app/logout','/app/welcome','/app/help'].includes(loc.pathname);
  if (account.status === 'signed-out' && (loc.pathname.startsWith('/app/') || loc.pathname.startsWith('/check-in/') || loc.pathname.startsWith('/prototype/')) && !open) return <Redirect to={`/app/login?next=${encodeURIComponent(loc.href)}`} />;
  return <>{children}</>;
}
