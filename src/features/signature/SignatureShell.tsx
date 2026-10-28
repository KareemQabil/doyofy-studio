/**
 * «توقيع» shell and event workspace.
 *   Shell: paper header with the mark, an edition chip, the essential links and the appearance picker.
 *   Workspace: a journey rail — the four essential stages carry seal numerals and the current stage is
 *   tied with the coral ribbon; optional details are disclosed. Phones get the same four stages + «المزيد»
 *   as a bottom bar (safe-area aware). Reading order follows Arabic source order (no DOM re-ordering).
 */
import { AccountMenu } from '../account/AccountMenu';
import { AppearanceToggle } from '../../ui/primitives/AppearanceSwitch';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { haptic } from '../../ui/motion/motion';
import { useScrollHide, useScrolled } from '../../ui/hooks/useTouchGestures';
import { Link, setNavIntent, useNavigate } from '../../app/router';
import { swipeStep } from '../../domain/gestures';
import { usePointerGesture } from '../../ui/hooks/usePointerGesture';
import { paths } from '../../app/paths';
import { Logo } from '../../ui/brand';
import { Icon } from '../../ui/icons';
import type { NavItem } from '../../ui/layouts/Layouts';

export function SignatureShell({ children, right, mobileContext }: { children: ReactNode; right?: ReactNode; mobileContext?: ReactNode }) {
  const scrolled = useScrolled(8);
  const hidden = useScrollHide(56) && !!mobileContext;
  return (
    <div className={`sig-shell${mobileContext ? ' has-appbar' : ''}`}>
      <a href="#main" className="skip-link">تخطَّ إلى المحتوى</a>
      {/* phones inside an event: one compact bar (back · event · account) instead of brand + banner + title */}
      {mobileContext && <header className={`sig-appbar${scrolled ? ' is-scrolled' : ''}${hidden ? ' is-hidden' : ''}`} onFocusCapture={(e) => e.currentTarget.classList.remove('is-hidden')}><div className="sig-appbar-context">{mobileContext}</div><span className="sig-appbar-tools"><AppearanceToggle />{right ?? <AccountMenu />}</span></header>}
      <header className="sig-header">
        <Link to={paths.events} className="sig-brand" aria-label="ضيوفي — مناسباتي"><Logo height={30} /></Link>
        <span className="sig-edition" aria-hidden="true">توقيع</span>
        <nav className="sig-header-nav" aria-label="القائمة الرئيسية">
          <Link to={paths.events}>مناسباتي</Link>
          <Link to={paths.newEvent} className="sig-header-new"><Icon name="plus" size="sm" />مناسبة جديدة</Link>
        </nav>
        <span className="sig-header-tools"><AppearanceToggle />{right ?? <AccountMenu />}</span>
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
  const navigate = useNavigate();
  const active = mobileNav.findIndex((n) => n.active);
  // phones: swipe the section sideways to reach the next tab (RTL: right = next, the content follows the finger).
  // Rows, the deck, the hall map and other inner gestures claim their own pointers first.
  const content = useRef<HTMLElement>(null);
  const phone = typeof matchMedia === 'function' && matchMedia('(max-width: 959px)').matches;
  const drag = (v: string | null) => { const el = content.current; if (!el) return; if (v === null) { el.style.removeProperty('--ws-x'); el.removeAttribute('data-dragging'); } else { el.style.setProperty('--ws-x', v); el.setAttribute('data-dragging', ''); } };
  const swipe = usePointerGesture({
    axis: 'x', enabled: phone && active >= 0,
    onMove: (dx) => { const to = mobileNav[active + (dx > 0 ? 1 : -1)]; drag(`${(to ? dx * 0.5 : dx * 0.14).toFixed(1)}px`); },
    onEnd: (g) => {
      drag(null);
      const s = g.moved && !g.cancelled ? swipeStep(g.dx, g.dy, g.duration) : 0;
      const to = s ? mobileNav[active + s] : undefined;
      if (to) { haptic('snap'); setNavIntent(s > 0 ? 'next' : 'prev'); navigate(to.to); }
    },
  });
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
      <main id="main" ref={content} className="sig-content" tabIndex={-1} {...swipe}>{children}</main>
      <nav className="sig-tabbar" aria-label="أقسام المناسبة" style={{ '--tab-i': Math.max(0, mobileNav.findIndex((n) => n.active)), '--tab-n': mobileNav.length } as CSSProperties} data-has-active={mobileNav.some((n) => n.active) || undefined}>
        <span className="sig-tab-indicator" aria-hidden="true" />
        {mobileNav.map((n) => (
          <Link key={n.to} to={n.to} aria-current={n.active ? 'page' : undefined} className={`sig-tab${n.active ? ' is-active' : ''}`} onClick={() => { if (!n.active) { haptic('tick'); setNavIntent(mobileNav.indexOf(n) > active ? 'next' : 'prev'); } }}>
            <span className="sig-tab-icon"><Icon name={n.icon} />{n.badge != null && n.badge !== 0 && <span className="sig-tab-dot" aria-hidden="true" />}</span>
            <span className="sig-tab-label">{n.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
