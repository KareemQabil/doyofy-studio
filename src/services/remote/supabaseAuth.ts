/**
 * Minimal Supabase Auth (GoTrue) client over fetch: one-time codes by email or SMS, refresh, sign-out.
 * The app owns where the session lives (memory / storage) and feeds `accessToken` to
 * createRemoteServices({ getAccessToken }). Request shapes follow the public GoTrue REST API; they are
 * covered by mocked tests only and have NOT been exercised against a live project.
 */
import type { RemoteConfig } from './config';
import { appErrorFromResponse, networkError } from './remoteErrors';

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  /** epoch ms */
  expiresAt: number;
  userId: string;
  email?: string;
  phone?: string;
}

type GoTrueSession = {
  access_token: string; refresh_token: string; expires_in?: number; expires_at?: number;
  user?: { id: string; email?: string; phone?: string };
};

export interface SupabaseAuth {
  /** sends a 6-digit code (and, if the email template includes it, a magic link) */
  requestEmailCode(email: string, redirectTo?: string): Promise<void>;
  /** sends an SMS code; requires an SMS provider configured in the Supabase project */
  requestPhoneCode(phoneE164: string): Promise<void>;
  verifyEmailCode(email: string, token: string): Promise<AuthSession>;
  verifyPhoneCode(phoneE164: string, token: string): Promise<AuthSession>;
  refresh(refreshToken: string): Promise<AuthSession>;
  signOut(accessToken: string): Promise<void>;
}

export function createSupabaseAuth(cfg: Pick<RemoteConfig, 'url' | 'anonKey' | 'fetch' | 'now'>): SupabaseAuth {
  const base = `${cfg.url.replace(/\/+$/, '')}/auth/v1`;
  const f = cfg.fetch ?? globalThis.fetch;
  const now = cfg.now ?? (() => new Date());

  async function call<T>(path: string, body: unknown, bearer?: string): Promise<T> {
    let res: Response;
    try {
      res = await f(`${base}${path}`, {
        method: 'POST',
        headers: { apikey: cfg.anonKey, Authorization: `Bearer ${bearer ?? cfg.anonKey}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });
    } catch { throw networkError(); }
    const text = await res.text().catch(() => '');
    let json: unknown = null;
    if (text) { try { json = JSON.parse(text); } catch { json = null; } }
    if (!res.ok) throw appErrorFromResponse(res.status, json);
    return json as T;
  }

  const toSession = (s: GoTrueSession): AuthSession => ({
    accessToken: s.access_token, refreshToken: s.refresh_token,
    expiresAt: s.expires_at ? s.expires_at * 1000 : now().getTime() + (s.expires_in ?? 3600) * 1000,
    userId: s.user?.id ?? '', email: s.user?.email || undefined, phone: s.user?.phone || undefined,
  });

  return {
    requestEmailCode: async (email, redirectTo) => {
      await call(`/otp${redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : ''}`, { email: email.trim().toLowerCase(), create_user: true });
    },
    requestPhoneCode: async (phone) => { await call('/otp', { phone, create_user: true, channel: 'sms' }); },
    verifyEmailCode: async (email, token) => toSession(await call<GoTrueSession>('/verify', { type: 'email', email: email.trim().toLowerCase(), token: token.trim() })),
    verifyPhoneCode: async (phone, token) => toSession(await call<GoTrueSession>('/verify', { type: 'sms', phone, token: token.trim() })),
    refresh: async (refreshToken) => toSession(await call<GoTrueSession>('/token?grant_type=refresh_token', { refresh_token: refreshToken })),
    signOut: async (accessToken) => { await call('/logout', {}, accessToken); },
  };
}
