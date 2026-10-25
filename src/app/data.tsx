/**
 * React bindings for the service layer: a tiny query cache (stale-while-revalidate, refetch on any
 * data change — including other tabs) and a mutation helper with pending/error state.
 * Replaceable by TanStack Query later; feature code only uses useQuery/useMutation/useServices.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { Services } from '../services/contracts';
import type { PrototypeControls } from '../services';

interface Entry { data?: unknown; error?: unknown; promise?: Promise<void>; loadedOnce: boolean; stale: boolean; version: number; fn: (s: Services) => Promise<unknown>; subs: Set<() => void> }

class QueryClient {
  private entries = new Map<string, Entry>();
  constructor(private services: Services) {
    services.onChange(() => this.invalidateAll());
  }
  entry(key: string, fn: (s: Services) => Promise<unknown>): Entry {
    let e = this.entries.get(key);
    if (!e) { e = { loadedOnce: false, stale: true, version: 0, fn, subs: new Set() }; this.entries.set(key, e); }
    e.fn = fn;
    return e;
  }
  fetch(key: string) {
    const e = this.entries.get(key);
    if (!e || e.promise) return;
    e.stale = false;
    e.promise = e.fn(this.services).then(
      (d) => { e.data = d; e.error = undefined; },
      (err) => { e.error = err; },
    ).finally(() => {
      e.promise = undefined; e.loadedOnce = true; e.version++;
      e.subs.forEach((s) => s());
      if (e.stale && e.subs.size) this.fetch(key); // changed while in flight
    });
    e.version++;
    e.subs.forEach((s) => s());
  }
  subscribe(key: string, cb: () => void) {
    const e = this.entries.get(key)!;
    e.subs.add(cb);
    if (e.stale) this.fetch(key);
    return () => { e.subs.delete(cb); };
  }
  invalidateAll() {
    for (const [key, e] of this.entries) {
      e.stale = true;
      if (e.subs.size) this.fetch(key);
    }
  }
}

interface Ctx { services: Services; prototype: PrototypeControls; client: QueryClient }
const ServicesContext = createContext<Ctx | null>(null);

export function ServicesProvider({ services, prototype, children }: { services: Services; prototype: PrototypeControls; children: ReactNode }) {
  const value = useMemo(() => ({ services, prototype, client: new QueryClient(services) }), [services, prototype]);
  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}

function useCtx(): Ctx {
  const c = useContext(ServicesContext);
  if (!c) throw new Error('ServicesProvider missing');
  return c;
}
export const useServices = () => useCtx().services;
export const usePrototype = () => useCtx().prototype;

export interface QueryResult<T> {
  data: T | undefined;
  error: unknown;
  /** first load, nothing to show yet */
  loading: boolean;
  /** background refresh while showing previous data */
  refreshing: boolean;
  refetch: () => void;
}

/** `key` identifies the data (include ids); `null` disables the query. */
export function useQuery<T>(key: string | null, fn: (s: Services) => Promise<T>): QueryResult<T> {
  const { client } = useCtx();
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const k = key ?? '__disabled__';
  const entry = client.entry(k, (s) => (key ? fnRef.current(s) : Promise.resolve(undefined)));
  useSyncExternalStore(
    useCallback((cb) => (key ? client.subscribe(k, cb) : () => {}), [client, k, key]),
    () => entry.version,
  );
  return {
    data: entry.data as T | undefined,
    error: entry.error,
    loading: !!key && !entry.loadedOnce,
    refreshing: !!entry.promise && entry.loadedOnce,
    refetch: () => { entry.stale = true; client.fetch(k); },
  };
}

export interface Mutation<A extends unknown[], R> {
  run: (...args: A) => Promise<R | undefined>;
  pending: boolean;
  error: unknown;
  reset: () => void;
}

/** wraps a service call; `run` never throws — read `error` (or the optional onError) */
export function useMutation<A extends unknown[], R>(fn: (s: Services, ...args: A) => Promise<R>, opts: { onSuccess?: (r: R) => void; onError?: (e: unknown) => void } = {}): Mutation<A, R> {
  const services = useServices();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const fnRef = useRef(fn);
  fnRef.current = fn; // always call the latest closure (it may read current component state)
  const run = useCallback(async (...args: A) => {
    setPending(true); setError(null);
    try {
      const r = await fnRef.current(services, ...args);
      if (alive.current) setPending(false);
      optsRef.current.onSuccess?.(r);
      return r;
    } catch (e) {
      if (alive.current) { setPending(false); setError(e); }
      optsRef.current.onError?.(e);
      return undefined;
    }
  }, [services]); // eslint-disable-line react-hooks/exhaustive-deps
  return { run, pending, error, reset: () => setError(null) };
}

/** prototype clock, re-rendering every `everyMs` (countdowns, "قبل 5 دقائق") */
export function useNow(everyMs = 30000): Date {
  const services = useServices();
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), everyMs);
    const off = services.onChange(() => tick((n) => n + 1));
    return () => { clearInterval(id); off(); };
  }, [everyMs, services]);
  return services.clock.now();
}
