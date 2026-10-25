/**
 * Remote (Supabase) adapter configuration. Nothing here is read automatically: services/index.ts keeps
 * the mock until someone passes a config to createRemoteServices() (see backend/README.md).
 */
import type { User } from '../../domain/types';

export interface RemoteConfig {
  /** https://<project-ref>.supabase.co (http://localhost / 127.0.0.1 allowed for `supabase start`) */
  url: string;
  /** public anon / publishable key. NEVER the service-role / secret key (rejected below). */
  anonKey: string;
  /** current signed-in user's access token (JWT). null/undefined = anonymous (guest pages). */
  getAccessToken?: () => string | null | undefined | Promise<string | null | undefined>;
  /** SessionService.currentUser() is synchronous; the app owns the auth state and passes it in. */
  currentUser?: () => User;
  /** injectable for tests; defaults to globalThis.fetch */
  fetch?: typeof fetch;
  /** per-request timeout, default 15 s */
  timeoutMs?: number;
  /** idempotency-key generator, default crypto.randomUUID() */
  makeKey?: () => string;
  now?: () => Date;
}

/** names used in .env.example; injected at build time (backend/README.md § Build-time config) */
export interface RemoteEnv {
  DOYOFY_SUPABASE_URL?: string;
  DOYOFY_SUPABASE_ANON_KEY?: string;
}

/** a config only when BOTH values are present; otherwise null → keep the mock */
export function remoteConfigFromEnv(env: RemoteEnv): Pick<RemoteConfig, 'url' | 'anonKey'> | null {
  const url = env.DOYOFY_SUPABASE_URL?.trim();
  const anonKey = env.DOYOFY_SUPABASE_ANON_KEY?.trim();
  return url && anonKey ? { url, anonKey } : null;
}

function jwtRole(token: string): string | null {
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '='));
    const role = (JSON.parse(json) as { role?: unknown }).role;
    return typeof role === 'string' ? role : null;
  } catch { return null; }
}

/** Throws a plain Error (programmer/configuration mistake, not a user-facing AppError). */
export function validateRemoteConfig(c: RemoteConfig): void {
  let u: URL;
  try { u = new URL(c.url); } catch { throw new Error('Doyofy remote config: url is not a valid URL'); }
  const local = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  if (u.protocol !== 'https:' && !(local && u.protocol === 'http:')) throw new Error('Doyofy remote config: url must be https');
  if (!c.anonKey || !c.anonKey.trim()) throw new Error('Doyofy remote config: anonKey is required');
  if (c.anonKey.startsWith('sb_secret_') || jwtRole(c.anonKey) === 'service_role') {
    throw new Error('Doyofy remote config: a service-role/secret key must never be shipped to the browser');
  }
}
