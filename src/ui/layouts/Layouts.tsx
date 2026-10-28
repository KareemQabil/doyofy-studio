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
import { SignatureShell, SignatureWorkspace } from '../../features/signature/SignatureShell';
import { AccountMenu } from '../../features/account/AccountMenu';

export interface NavItem { to: string; label: string; icon: IconName; active: boolean; badge?: number | string; tone?: 'warning' | 'accent'; group?: string }

export function Brand({ to = '/app/events' }: { to?: string }) {
  return (
    <Link to={to} className="brand" aria-label="Doyofy — مناسباتي">
      <Logo height={30} title="Doyofy" />
    </Link>
  );
}

export function AppShell({ children, right, mobileContext }: { children: ReactNode; right?: ReactNode; mobileContext?: ReactNode; compact?: boolean }) {
  return <SignatureShell right={right ?? <AccountMenu />} mobileContext={mobileContext}>{children}</SignatureShell>;
}

export function WorkspaceLayout({ context, nav, mobileNav, footer, children }: {
  context: ReactNode; nav: NavItem[]; mobileNav: NavItem[]; footer?: ReactNode; children: ReactNode;
}) {
  return <SignatureWorkspace context={context} nav={nav} mobileNav={mobileNav} footer={footer}>{children}</SignatureWorkspace>;
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
        <div className="focus-right"><AccountMenu />{right}</div>
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
