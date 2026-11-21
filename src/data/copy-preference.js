/** Shared by React UI and the invitation engine, including when browser storage is blocked. */
const KEY = 'doyofy:copy-preference:v1';
const CHANGE = 'doyofy-copy-change';
let memory = 'ar';
let memoryOnly = false;
const valid = value => value === 'ar-EG' || value === 'ar-SA' ? value : 'ar';
export function currentDialect() {
  if (memoryOnly) return memory;
  try { return typeof window === 'undefined' ? memory : valid(window.localStorage.getItem(KEY)); }
  catch { return memory; }
}
export function setDialect(dialect) {
  memory = valid(dialect);
  try { window.localStorage.setItem(KEY, memory); memoryOnly = false; } catch { memoryOnly = true; }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGE));
}
export function subscribeDialect(changed) {
  const onStorage = e => { if (e.key === KEY || e.key === null) { memoryOnly = false; changed(); } };
  window.addEventListener(CHANGE, changed); window.addEventListener('storage', onStorage);
  return () => { window.removeEventListener(CHANGE, changed); window.removeEventListener('storage', onStorage); };
}
