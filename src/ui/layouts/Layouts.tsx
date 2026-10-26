/**
 * Page layouts. They know nothing about events or guests: features pass titles, nav items and slots.
 *   AppShell     top bar for the organizer area (brand, account, prototype tools)
 *   WorkspaceLayout  sidebar (desktop) / bottom tabs (phone) + content
 *   PageHeader   where am I · state · one primary action
 *   FocusLayout  a single task (create event, import, design): back + title, nothing else
 */
import type { ReactNode } from 'react';
import { Link } from '../../app/router';
import { Icon, type IconName } from '../icons';
import { Logo } from '../brand';
import { useReviewSettings } from '../../app/review';
import { OrbitShell, OrbitWorkspace } from '../../features/orbit/OrbitShell';
import { BahjaShell, BahjaWorkspace } from '../../features/bahja/BahjaShell';
import { HorizonShell, HorizonWorkspace } from '../../features/horizon/HorizonShell';
import { SignatureShell, SignatureWorkspace } from '../../features/signature/SignatureShell';
import { ThemePicker } from '../primitives/ThemePicker';
import { AccountMenu } from '../../features/account/AccountMenu';

export interface NavItem { to: string; label: string; icon: IconName; active: boolean; badge?: number | string; tone?: 'warning' | 'accent'; group?: string }

export function Brand({ to = '/app/events' }: { to?: string }) {
  return (
    <Link to={to} className="brand" aria-label="Doyofy — مناسباتي">
      <Logo height={30} title="Doyofy" />
    </Link>
  );
}

export function AppShell({ children, right, mobileContext, compact }: { children: ReactNode; right?: ReactNode; mobileContext?: ReactNode; compact?: boolean }) {
  const {theme}=useReviewSettings();
  right = right ?? <AccountMenu />;
  if(theme==='signature')return <SignatureShell right={right} mobileContext={mobileContext}>{children}</SignatureShell>;
  if(theme==='horizon')return <HorizonShell right={right}>{children}</HorizonShell>;
  if(theme==='bahja')return <BahjaShell right={right}>{children}</BahjaShell>;
  if(theme==='orbit')return <OrbitShell right={right}>{children}</OrbitShell>;
  return (
    <div className={`shell${compact ? ' shell-compact' : ''}${mobileContext ? ' has-mobile-context' : ''}`}>
      <a href="#main" className="skip-link">تخطَّ إلى المحتوى</a>
      <header className="topbar">
        <div className="topbar-inner">
          <span className="topbar-brand"><Brand /></span>
          {mobileContext && <div className="topbar-context">{mobileContext}</div>}
          <nav className="topbar-links" aria-label="القائمة الرئيسية"><Link to="/app/events">مناسباتي</Link><Link to="/prototype/screen-review">مراجعة الرحلة</Link></nav>
          <div className="grow" />
          <ThemePicker />
          {right}
        </div>
      </header>
      {children}
    </div>
  );
}

export function WorkspaceLayout({ context, nav, mobileNav, footer, children }: {
  context: ReactNode; nav: NavItem[]; mobileNav: NavItem[]; footer?: ReactNode; children: ReactNode;
}) {
  const {theme}=useReviewSettings();
  if(theme==='signature')return <SignatureWorkspace context={context} nav={nav} mobileNav={mobileNav} footer={footer}>{children}</SignatureWorkspace>;
  if(theme==='horizon')return <HorizonWorkspace context={context} nav={nav} footer={footer}>{children}</HorizonWorkspace>;
  if(theme==='bahja')return <BahjaWorkspace context={context} nav={nav} footer={footer}>{children}</BahjaWorkspace>;
  if(theme==='orbit')return <OrbitWorkspace context={context} nav={nav} footer={footer}>{children}</OrbitWorkspace>;
  return (
    <div className="ws has-tabbar-on-mobile">
      <aside className="ws-side" aria-label="أقسام المناسبة">
        <div className="ws-context">{context}</div>
        <nav className="ws-nav">
          <ul>
            {nav.filter(n=>n.group!=='خيارات إضافية').map((n, index, primary) => (
              <li key={n.to}>
                {n.group && n.group !== primary[index - 1]?.group && <p className="ws-nav-group">{n.group}</p>}
                <Link to={n.to} className={`ws-link${n.active ? ' is-active' : ''}`} aria-current={n.active ? 'page' : undefined}>
                  <Icon name={n.icon} />
                  <span className="grow">{n.label}</span>
                  {n.badge != null && n.badge !== 0 && <span className={`ws-badge ${n.tone ? `tone-${n.tone}` : ''} num`}>{n.badge}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <details className="ws-extra-sections" open={nav.some(n=>n.group==='خيارات إضافية'&&n.active)||undefined}><summary>تفاصيل إضافية<Icon name="chevron-down" size="sm"/></summary><nav aria-label="تفاصيل إضافية">{nav.filter(n=>n.group==='خيارات إضافية').map(n=><Link key={n.to} to={n.to} className={`ws-link${n.active?' is-active':''}`} aria-current={n.active?'page':undefined}><Icon name={n.icon}/><span>{n.label}{n.icon==='table'&&' · اختياري'}</span></Link>)}</nav></details>
        {footer && <div className="ws-foot">{footer}</div>}
      </aside>
      <main id="main" className="ws-main" tabIndex={-1}>{children}</main>
      <nav className="tabbar" aria-label="أقسام المناسبة">
        {mobileNav.map((n) => (
          <Link key={n.to} to={n.to} className={`tab${n.active ? ' is-active' : ''}`} aria-current={n.active ? 'page' : undefined}>
            <span className="tab-icon"><Icon name={n.icon} />{n.badge != null && n.badge !== 0 && <span className={`tab-dot ${n.tone ? `tone-${n.tone}` : ''}`} aria-hidden="true" />}</span>
            <span className="tab-label">{n.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageHeader({ title, subtitle, status, actions, back, kicker }: { title: ReactNode; subtitle?: ReactNode; status?: ReactNode; actions?: ReactNode; back?: { to: string; label: string }; kicker?: ReactNode }) {
  return (
    <header className="page-head">
      {back && <Link to={back.to} className="page-back"><Icon name="back" size="sm" />{back.label}</Link>}
      <div className="page-head-row">
        <div className="page-head-text">
          {kicker && <p className="page-kicker">{kicker}</p>}
          <div className="row wrap gap-2"><h1 className="page-title">{title}</h1>{status}</div>
          {subtitle && <p className="page-sub">{subtitle}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
    </header>
  );
}

export function FocusLayout({ title, back, right, children, width = 'narrow', footer }: { title: ReactNode; back: { to: string; label: string }; right?: ReactNode; children: ReactNode; width?: 'narrow' | 'wide' | 'full'; footer?: ReactNode }) {
  return (
    <div className={`focus focus-${width}`}>
      <header className="focus-bar">
        <Link to={back.to} className="focus-back" aria-label={back.label}><Icon name="close" /><span className="focus-back-label">{back.label}</span></Link>
        <h1 className="focus-title truncate">{title}</h1>
        <div className="focus-right"><ThemePicker compact /><AccountMenu />{right}</div>
      </header>
      <main id="main" className="focus-main" tabIndex={-1}>{children}</main>
      {footer && <footer className="focus-foot"><div className="focus-foot-inner">{footer}</div></footer>}
    </div>
  );
}

export function Section({ title, children, actions, id }: { title?: ReactNode; children: ReactNode; actions?: ReactNode; id?: string }) {
  return (
    <section className="section" id={id}>
      {(title || actions) && <div className="section-head"><h2 className="section-title">{title}</h2>{actions}</div>}
      {children}
    </section>
  );
}
