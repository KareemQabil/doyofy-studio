/** Organizer appearance and occasion discovery preference, persisted locally and shareable by URL. */
import { useEffect, useSyncExternalStore } from 'react';
import { usePrototype } from './data';
import { useLocation } from './router';

import { isTheme, THEMES, type ThemeId } from '../domain/themes';
export type { ThemeId } from '../domain/themes';
export type ChooserVariant = 'curated' | 'coverflow' | 'rail';

export const THEME_LABEL = Object.fromEntries(THEMES.map(t=>[t.id,t.label])) as Record<ThemeId,string>;
export const CHOOSER_LABEL: Record<ChooserVariant, string> = { curated: 'المعرض المباشر', coverflow: 'عرض متتابع', rail: 'شريط المناسبات' };

export function useReviewSettings(): { theme: ThemeId; chooser: ChooserVariant } {
  const proto = usePrototype();
  const theme = useSyncExternalStore(proto.subscribe, () => proto.settings().theme ?? 'warm');
  const chooser = useSyncExternalStore(proto.subscribe, () => proto.settings().occasionChooser ?? 'curated');
  return { theme, chooser };
}

/** review links (?theme=…&chooser=…, in the query or after the #route) — applied before the first render */
export function applyReviewLink(proto: { update(p: { theme?: ThemeId; occasionChooser?: ChooserVariant }): void; settings(): { theme: ThemeId } }) {
  const q = new URLSearchParams(location.search);
  const h = new URLSearchParams(location.hash.split('?')[1] ?? '');
  const t = q.get('theme') ?? h.get('theme');
  const c = q.get('chooser') ?? h.get('chooser');
  const patch: { theme?: ThemeId; occasionChooser?: ChooserVariant } = {};
  if (isTheme(t)) patch.theme = t;
  if (c === 'curated' || c === 'coverflow' || c === 'rail') patch.occasionChooser = c;
  if (Object.keys(patch).length) proto.update(patch);
  document.documentElement.dataset.theme = proto.settings().theme ?? 'warm';
}

/** applies the theme to <html> and accepts review links on in-app navigation */
export function ThemeSync() {
  const proto = usePrototype();
  const loc = useLocation();
  const { theme } = useReviewSettings();
  useEffect(() => {
    const t = loc.search.get('theme');
    const c = loc.search.get('chooser');
    const patch: { theme?: ThemeId; occasionChooser?: ChooserVariant } = {};
    if (isTheme(t)) patch.theme = t;
    if (c === 'curated' || c === 'coverflow' || c === 'rail') patch.occasionChooser = c;
    if (Object.keys(patch).length) proto.update(patch);
  }, [loc.search, proto]);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  return null;
}
