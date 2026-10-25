/**
 * Minimal fetch-based PostgREST + RPC client (no SDK: the npm registry is unavailable in the build
 * sandbox, and the surface we need is small). Every failure becomes an AppError.
 */
import type { AppError } from '../errors';
import type { RemoteConfig } from './config';
import { appErrorFromResponse, networkError } from './remoteErrors';

export type Query = Array<[string, string]>;
export interface RequestOptions {
  query?: Query;
  body?: unknown;
  /** 'anon' never sends the user's token (public guest path must not break on an expired session) */
  auth?: 'user' | 'anon';
  /** PostgREST single-object response (406 / PGRST116 when no row) */
  single?: boolean;
  prefer?: string[];
}

export class SupabaseRest {
  private readonly base: string;
  private readonly doFetch: typeof fetch;
  private readonly timeoutMs: number;

  constructor(private readonly cfg: RemoteConfig) {
    this.base = cfg.url.replace(/\/+$/, '');
    const f = cfg.fetch ?? globalThis.fetch;
    if (!f) throw new Error('Doyofy remote: fetch is not available');
    this.doFetch = (input, init) => f(input, init);
    this.timeoutMs = cfg.timeoutMs ?? 15000;
  }

  async request<T>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, opt: RequestOptions = {}): Promise<T> {
    const qs = opt.query?.length ? `?${opt.query.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')}` : '';
    const token = opt.auth === 'anon' ? null : await this.cfg.getAccessToken?.();
    const headers: Record<string, string> = {
      apikey: this.cfg.anonKey,
      Authorization: `Bearer ${token || this.cfg.anonKey}`,
      Accept: opt.single ? 'application/vnd.pgrst.object+json' : 'application/json',
    };
    if (opt.body !== undefined) headers['Content-Type'] = 'application/json';
    if (opt.prefer?.length) headers.Prefer = opt.prefer.join(',');

    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), this.timeoutMs) : null;
    let res: Response;
    try {
      res = await this.doFetch(`${this.base}${path}${qs}`, {
        method, headers, body: opt.body === undefined ? undefined : JSON.stringify(opt.body), signal: ctrl?.signal,
      });
    } catch {
      throw networkError();            // offline, DNS, CORS, abort/timeout
    } finally {
      if (timer) clearTimeout(timer);
    }
    const text = await res.text().catch(() => '');
    let json: unknown = null;
    if (text) { try { json = JSON.parse(text); } catch { json = null; } }
    if (!res.ok) throw appErrorFromResponse(res.status, json);
    return json as T;
  }

  select<T>(table: string, query: Query): Promise<T[]> {
    return this.request<T[]>('GET', `/rest/v1/${table}`, { query });
  }
  /** pages through PostgREST's max-rows cap (Supabase default 1000) so long guest lists are never truncated */
  async selectAll<T>(table: string, query: Query, pageSize = 1000): Promise<T[]> {
    const out: T[] = [];
    for (let offset = 0; ; offset += pageSize) {
      const page = await this.select<T>(table, [...query, ['limit', String(pageSize)], ['offset', String(offset)]]);
      out.push(...page);
      if (page.length < pageSize || offset > 200_000) return out;
    }
  }
  async maybeOne<T>(table: string, query: Query): Promise<T | null> {
    const rows = await this.select<T>(table, [...query, ['limit', '1']]);
    return rows[0] ?? null;
  }
  selectOne<T>(table: string, query: Query): Promise<T> {
    return this.request<T>('GET', `/rest/v1/${table}`, { query, single: true });
  }
  insert<T>(table: string, rows: unknown): Promise<T[]> {
    return this.request<T[]>('POST', `/rest/v1/${table}`, { query: [['select', '*']], body: rows, prefer: ['return=representation'] });
  }
  update<T>(table: string, filter: Query, patch: unknown): Promise<T[]> {
    return this.request<T[]>('PATCH', `/rest/v1/${table}`, { query: [...filter, ['select', '*']], body: patch, prefer: ['return=representation'] });
  }
  async remove(table: string, filter: Query): Promise<void> {
    await this.request<unknown>('DELETE', `/rest/v1/${table}`, { query: filter, prefer: ['return=minimal'] });
  }
  rpc<T>(fn: string, args: Record<string, unknown>, opt: Pick<RequestOptions, 'auth'> = {}): Promise<T> {
    return this.request<T>('POST', `/rest/v1/rpc/${fn}`, { body: args, auth: opt.auth });
  }
}

export const eq = (v: string | number | boolean): string => `eq.${v}`;
export const isNetworkError = (e: unknown): boolean => (e as AppError | undefined)?.code === 'network';
