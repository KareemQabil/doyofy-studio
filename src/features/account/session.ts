import { useMemo, useSyncExternalStore } from 'react';
import { parseAccount, DEMO_ACCOUNT_KEY, type DemoAccount } from '../../domain/account';
const KEY = DEMO_ACCOUNT_KEY;
const CHANGE = 'doyofy-account-change';
let memory = '';
const snapshot = () => { try { return window.localStorage.getItem(KEY) || ''; } catch { return memory; } };
const subscribe = (fn: () => void) => { const changed = () => fn(); window.addEventListener(CHANGE, changed); window.addEventListener('storage', changed); return () => { window.removeEventListener(CHANGE, changed); window.removeEventListener('storage', changed); }; };
export function currentDemoAccount() { return parseAccount(typeof window === 'undefined' ? memory : snapshot()); }
export function saveDemoAccount(account: DemoAccount) {
  const next = JSON.stringify(account); if (snapshot() === next) return;
  memory = next; try { window.localStorage.setItem(KEY, next); } catch { /* in-memory session remains usable */ }
  window.dispatchEvent(new Event(CHANGE));
}
export function useDemoAccount() { const raw = useSyncExternalStore(subscribe, snapshot, () => ''); return useMemo(() => parseAccount(raw), [raw]); }
