/** Typed React binding for the preference shared with the guest invitation engine. */
import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { copyFor, countOf, fill, type CopyKey, type Dialect, type Noun } from '../domain/copy';
import { currentDialect, setDialect, subscribeDialect } from '../data/copy-preference.js';
export { currentDialect, setDialect } from '../data/copy-preference.js';

/** the guest pages speak the organizer's voice (carried with the invitation), not this device's preference */
const Voice = createContext<Dialect | null>(null);
export function GuestVoice({ dialect, children }: { dialect: Dialect | undefined; children: ReactNode }) {
  return <Voice.Provider value={dialect ?? 'ar'}>{children}</Voice.Provider>;
}

export function useCopy() {
  const device = useSyncExternalStore(subscribeDialect, currentDialect, () => 'ar' as Dialect);
  const dialect = useContext(Voice) ?? device;
  const copy = copyFor(dialect);
  /** t('key') or t('key', { n: 3 }) for a string with named slots */
  const t = useCallback((key: CopyKey, vars?: Readonly<Record<string, string | number>>) => fill(copy[key], vars), [copy]);
  /** «3 ضيوف» / «ضيفين» in the voice (classical forms in modern Arabic) */
  const n = useCallback((count: number, noun: Noun, oblique = false) => countOf(dialect, count, noun, oblique), [dialect]);
  return useMemo(() => ({ dialect, setDialect, copy, t, n }), [dialect, copy, t, n]);
}
