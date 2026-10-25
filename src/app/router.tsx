/**
 * Minimal router: path patterns with :params, history mode (local server) or hash mode (static
 * hosts), <Link>, navigate(), and navigation blocking for unsaved changes.
 * Route paths mirror the spec IA 1:1 so they map onto Next.js App Router folders later.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from 'react';

export type RouterMode = 'history' | 'hash';

function currentPath(mode: RouterMode): string {
  if (mode === 'hash') {
    const h = location.hash.replace(/^#/, '');
    return h.startsWith('/') ? h : '/';
  }
  return location.pathname + location.search;
}

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
window.addEventListener('popstate', notify);
window.addEventListener('hashchange', notify);

export interface RouteLocation { pathname: string; search: URLSearchParams; href: string }

function parse(full: string): RouteLocation {
  const [p = '/', q = ''] = full.split('?');
  return { pathname: p.replace(/\/+$/, '') || '/', search: new URLSearchParams(q), href: full };
}

export function matchPath(pattern: string, pathname: string): Record<string, string> | null {
  const a = pattern.split('/').filter(Boolean), b = pathname.split('/').filter(Boolean);
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < a.length; i++) {
    const seg = a[i]!, val = b[i]!;
    if (seg.startsWith(':')) { try { params[seg.slice(1)] = decodeURIComponent(val); } catch { return null; } }
    else if (seg !== val) return null;
  }
  return params;
}

type Blocker = { when: () => boolean; message: string };

interface RouterCtx {
  mode: RouterMode;
  location: RouteLocation;
  navigate: (to: string, opts?: { replace?: boolean; force?: boolean }) => void;
  href: (to: string) => string;
  /** absolute URL for sharing (guest links) */
  absolute: (to: string) => string;
  register: (b: Blocker) => () => void;
  pendingNav: { to: string; message: string } | null;
  resolvePending: (go: boolean) => void;
}
const Ctx = createContext<RouterCtx | null>(null);

export function RouterProvider({ mode, children }: { mode: RouterMode; children: ReactNode }) {
  const full = useSyncExternalStore((cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; }, () => currentPath(mode));
  const loc = useMemo(() => parse(full), [full]);
  const blockers = useRef(new Set<Blocker>());
  const [pendingNav, setPending] = useState<{ to: string; message: string; replace?: boolean } | null>(null);
  const last = useRef(full);

  const href = useCallback((to: string) => (mode === 'hash' ? `#${to}` : to), [mode]);
  const absolute = useCallback((to: string) => (mode === 'hash' ? `${window.location.origin}${window.location.pathname}${window.location.search}#${to}` : `${window.location.origin}${to}`), [mode]);

  const go = useCallback((to: string, replace?: boolean) => {
    last.current = to; // in-app navigation: never mistaken for back/forward by the blocker check below
    if (mode === 'hash') {
      if (replace) history.replaceState(null, '', `#${to}`); else if (window.location.hash !== `#${to}`) history.pushState(null, '', `#${to}`);
    } else if (replace) history.replaceState(null, '', to);
    else history.pushState(null, '', to);
    notify();
    window.scrollTo(0, 0);
  }, [mode]);

  const blocking = () => [...blockers.current].find((b) => b.when());

  const navigate = useCallback((to: string, opts: { replace?: boolean; force?: boolean } = {}) => {
    const b = !opts.force && blocking();
    if (b && to !== full) { setPending({ to, message: b.message, replace: opts.replace }); return; }
    go(to, opts.replace);
  }, [full, go]);

  // back/forward while blocked: restore the URL and ask
  useEffect(() => {
    if (full === last.current) return;
    const b = blocking();
    if (b && !pendingNav) {
      const target = full;
      if (mode === 'hash') history.pushState(null, '', `#${last.current}`); else history.pushState(null, '', last.current);
      notify();
      setPending({ to: target, message: b.message });
      return;
    }
    last.current = full;
  }, [full]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => { if (blocking()) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);

  const resolvePending = useCallback((proceed: boolean) => {
    const p = pendingNav;
    setPending(null);
    if (proceed && p) go(p.to, p.replace);
  }, [pendingNav, go]);

  const register = useCallback((b: Blocker) => { blockers.current.add(b); return () => { blockers.current.delete(b); }; }, []);

  const value = useMemo<RouterCtx>(() => ({ mode, location: loc, navigate, href, absolute, register, pendingNav, resolvePending }), [mode, loc, navigate, href, absolute, register, pendingNav, resolvePending]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRouter(): RouterCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('RouterProvider missing');
  return c;
}
export const useLocation = () => useRouter().location;
export const useNavigate = () => useRouter().navigate;

/** block in-app navigation (and tab close) while `when` is true */
export function useBlocker(when: boolean, message = 'لديك تغييرات غير محفوظة. هل تريد المغادرة دون حفظها؟') {
  const { register } = useRouter();
  const ref = useRef(when);
  ref.current = when;
  useEffect(() => register({ when: () => ref.current, message }), [register, message]);
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string; replace?: boolean };

export function Link({ to, replace, onClick, target, ...rest }: LinkProps) {
  const { navigate, href } = useRouter();
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || target === '_blank') return;
    e.preventDefault();
    navigate(to, { replace });
  };
  return <a href={href(to)} onClick={handle} target={target} {...rest} />;
}

export interface RouteDef { path: string; render: (params: Record<string, string>) => ReactNode }

export function Routes({ routes, fallback }: { routes: RouteDef[]; fallback: ReactNode }) {
  const { location } = useRouter();
  for (const r of routes) {
    const params = matchPath(r.path, location.pathname);
    if (params) return <>{r.render(params)}</>;
  }
  return <>{fallback}</>;
}

export function Redirect({ to }: { to: string }) {
  const { navigate } = useRouter();
  useEffect(() => { navigate(to, { replace: true, force: true }); }, [to, navigate]);
  return null;
}
