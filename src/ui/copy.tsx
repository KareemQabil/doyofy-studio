/** Typed React binding for the preference shared with the guest invitation engine. */
import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from 'react';
import { copyFor, type CopyKey, type Dialect } from '../domain/copy';
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
  const t = useCallback((key: CopyKey) => copy[key], [copy]);
  return { dialect, setDialect, copy, t };
}
