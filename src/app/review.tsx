/** Organizer appearance (light · dark · follow the device), persisted locally and shareable by URL (?appearance=dark).
 *  One visual identity — «توقيع». The invitation itself never follows the platform's appearance. */
import { useEffect, useSyncExternalStore } from 'react';
import { usePrototype } from './data';
import { useLocation } from './router';

import { isAppearance, type Appearance } from '../domain/appearance';
export { APPEARANCE_LABEL, isAppearance, type Appearance } from '../domain/appearance';

const darkQuery = () => (typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null);
export const resolveAppearance = (a: Appearance): 'light' | 'dark' => (a === 'system' ? (darkQuery()?.matches ? 'dark' : 'light') : a);

function subscribeSystem(cb: () => void) { const q = darkQuery(); q?.addEventListener('change', cb); return () => q?.removeEventListener('change', cb); }

export function useAppearance(): { appearance: Appearance; resolved: 'light' | 'dark' } {
  const proto = usePrototype();
  const appearance = useSyncExternalStore(proto.subscribe, () => proto.settings().appearance ?? 'light');
  const system = useSyncExternalStore(subscribeSystem, () => !!darkQuery()?.matches);
  return { appearance, resolved: appearance === 'system' ? (system ? 'dark' : 'light') : appearance };
}

function paint(resolved: 'light' | 'dark') {
  const root = document.documentElement;
  root.dataset.theme = 'signature'; // compatibility hook for the Signature stylesheet
  root.dataset.appearance = resolved;
  root.style.colorScheme = resolved;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', resolved === 'dark' ? '#171615' : '#FFFFFF'));
}

/** review links (?appearance=…, in the query or after the #route) — applied before the first render */
export function applyReviewLink(proto: { update(p: { appearance?: Appearance }): void; settings(): { appearance: Appearance } }) {
  const q = new URLSearchParams(location.search);
  const h = new URLSearchParams(location.hash.split('?')[1] ?? '');
  const a = q.get('appearance') ?? h.get('appearance');
  if (isAppearance(a)) proto.update({ appearance: a });
  paint(resolveAppearance(proto.settings().appearance ?? 'light'));
}

/** keeps <html data-appearance> in sync with the setting and the device, and accepts review links on navigation */
export function ThemeSync() {
  const proto = usePrototype();
  const loc = useLocation();
  const { resolved } = useAppearance();
  useEffect(() => {
    const a = loc.search.get('appearance');
    if (isAppearance(a)) proto.update({ appearance: a });
  }, [loc.search, proto]);
  useEffect(() => { paint(resolved); }, [resolved]);
  return null;
}
