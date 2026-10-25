export type DemoAccount = { status: 'demo' | 'signed-out'; name?: string; email?: string };
export const DEFAULT_ACCOUNT: DemoAccount = { status: 'demo' };
export function parseAccount(raw: string | null): DemoAccount {
  try { const p = JSON.parse(raw || 'null'); if (p?.status === 'signed-out') return { status: 'signed-out' };
    if (p?.status === 'demo') return { status: 'demo', name: typeof p.name === 'string' ? p.name.slice(0, 70) : undefined, email: typeof p.email === 'string' ? p.email.slice(0, 160) : undefined };
  } catch { /* an invalid local preference never blocks the app */ }
  return DEFAULT_ACCOUNT;
}
export function safeAccountReturn(value: string | null | undefined) {
  if (!value || !/^\/(?:app\/(?:events|account)|check-in)(?:[/?]|$)/.test(value) || /[\\\r\n]/.test(value)) return '/app/events';
  return value;
}

export const DEMO_ACCOUNT_KEY = 'doyofy:demo-account:v1';
export function demoProfileName(): string | undefined {
  try { return typeof window === 'undefined' ? undefined : parseAccount(window.localStorage.getItem(DEMO_ACCOUNT_KEY)).name; } catch { return undefined; }
}
