/** Typed React binding for the preference shared with the guest invitation engine. */
import { useCallback, useSyncExternalStore } from 'react';
import { copyFor, type CopyKey, type Dialect } from '../domain/copy';
import { currentDialect, setDialect, subscribeDialect } from '../data/copy-preference.js';
export { currentDialect, setDialect } from '../data/copy-preference.js';
export function useCopy() {
  const dialect = useSyncExternalStore(subscribeDialect, currentDialect, () => 'ar' as Dialect);
  const copy = copyFor(dialect);
  const t = useCallback((key: CopyKey) => copy[key], [copy]);
  return { dialect, setDialect, copy, t };
}
