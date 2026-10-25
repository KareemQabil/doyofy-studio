/**
 * «توقيع» shell and event workspace.
 *   Shell: paper header with the mark, an edition chip, the essential links and the appearance picker.
 *   Workspace: a journey rail — the four essential stages carry seal numerals and the current stage is
 *   tied with the coral ribbon; optional details are disclosed. Phones get the same four stages + «المزيد»
 *   as a bottom bar (safe-area aware). Reading order follows Arabic source order (no DOM re-ordering).
 */
import { AccountMenu } from '../account/AccountMenu';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from '../../app/router';
import { paths } from '../../app/paths';
import { ThemePicker } from '../../ui/primitives/ThemePicker';
import { Logo } from '../../ui/brand';
import { Icon } from '../../ui/icons';
import type { NavItem } from '../../ui/layouts/Layouts';

export function SignatureShell({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="sig-shell">
      <a href="#main" className="skip-link">تخطَّ إلى المحتوى</a>
      <header className="sig-header">
        <Link to={paths.events} className="sig-brand" aria-label="ضيوفي — مناسباتي"><Logo height={30} /></Link>
        <span className="sig-edition" aria-hidden="true">توقيع</span>
        <nav className="sig-header-nav" aria-label="القائمة الرئيسية">
          <Link to={paths.events}>مناسباتي</Link>
          <Link to={paths.newEvent} className="sig-header-new"><Icon name="plus" size="sm" />مناسبة جديدة</Link>
        </nav>
        <span className="sig-header-tools"><ThemePicker compact />{right ?? <AccountMenu />}</span>
      </header>
      {children}
    </div>
  );
}

const ESSENTIAL = ['home', 'envelope', 'users', 'door'];

export function SignatureWorkspace({ context, nav, mobileNav, footer, children }: { context: ReactNode; nav: NavItem[]; mobileNav: NavItem[]; footer?: ReactNode; children: ReactNode }) {
  const essential = nav.filter((n) => ESSENTIAL.includes(n.icon));
  const optional = nav.filter((n) => !essential.includes(n));
  const optionalActive = optional.some((n) => n.active);
  const [more, setMore] = useState(optionalActive);
  useEffect(() => { if (optionalActive) setMore(true); }, [optionalActive]);
  return (
    <div className="sig-ws">
      <aside className="sig-rail" aria-label="رحلة المناسبة">
        <div className="sig-rail-context">{context}</div>
        <nav className="sig-journey" aria-label="مراحل المناسبة">
          <ol>
            {essential.map((n, i) => (
              <li key={n.to}>
                <Link to={n.to} aria-current={n.active ? 'page' : undefined} className={`sig-journey-link${n.active ? ' is-active' : ''}`}>
                  <span className="sig-step-num num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <span className="sig-step-label">{n.label}</span>
                  {n.badge != null && n.badge !== 0 && <span className={`sig-step-badge num${n.tone ? ` tone-${n.tone}` : ''}`}>{n.badge}</span>}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
        <button type="button" className="sig-more-toggle" aria-expanded={more} onClick={() => setMore((v) => !v)}>
          <Icon name="sliders" size="sm" />تفاصيل إضافية<Icon name={more ? 'chevron-up' : 'chevron-down'} size="sm" />
        </button>
        {more && (
          <nav className="sig-optional" aria-label="تفاصيل إضافية">
            {optional.map((n) => <Link key={n.to} to={n.to} aria-current={n.active ? 'page' : undefined}><Icon name={n.icon} size="sm" /><span>{n.label}</span>{n.icon === 'table' && <small>اختياري</small>}</Link>)}
          </nav>
        )}
        {footer && <div className="sig-rail-foot">{footer}</div>}
      </aside>
      <main id="main" className="sig-content" tabIndex={-1}>{children}</main>
      <nav className="sig-tabbar" aria-label="أقسام المناسبة">
        {mobileNav.map((n) => (
          <Link key={n.to} to={n.to} aria-current={n.active ? 'page' : undefined} className={`sig-tab${n.active ? ' is-active' : ''}`}>
            <span className="sig-tab-icon"><Icon name={n.icon} />{n.badge != null && n.badge !== 0 && <span className="sig-tab-dot" aria-hidden="true" />}</span>
            <span className="sig-tab-label">{n.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
