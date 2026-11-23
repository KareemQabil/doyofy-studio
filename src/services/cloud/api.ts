/**
 * HTTP calls to the Vercel backend (api/router.ts). Same origin, JSON only. Guest-facing failures become AppErrors with
 * the same Arabic lines the mock uses; organizer-side sync calls return plain outcomes (the sync retries quietly).
 */
import type { GuestView } from '../contracts';
import type { DietaryAnswer, MealAllocation } from '../../domain/types';
import { AppError, copyError } from '../errors';

export interface RemoteReply {
  id: string; code: string | null; name: string; attending: boolean; count: number; companionNames?: string[]; note?: string;
  meals?: MealAllocation[]; dietary?: DietaryAnswer; experienceRevision?: number; at: string;
}

type Fetch = typeof fetch;
const f = (): Fetch => globalThis.fetch.bind(globalThis);
const JSON_HEADERS = { 'Content-Type': 'application/json' };
const auth = (key: string) => ({ Authorization: `Bearer ${key}` });
const isJson = (r: Response) => /application\/json/i.test(r.headers.get('content-type') ?? '');

async function withTimeout(url: string, init: RequestInit, ms: number, fetchImpl: Fetch): Promise<Response> {
  const ctl = typeof AbortController === 'undefined' ? null : new AbortController();
  const timer = ctl ? setTimeout(() => ctl.abort(), ms) : null;
  try { return await fetchImpl(url, { ...init, ...(ctl ? { signal: ctl.signal } : {}), credentials: 'same-origin' }); }
  finally { if (timer) clearTimeout(timer); }
}

let probe: Promise<boolean> | null = null;
/**
 * Asks /api/health once per page. A static host (no functions: the SPA's index.html comes back), an error, a timeout or
 * `backend:false` all mean off — links stay portable and replies device-local, exactly as before the backend existed.
 */
export function backendStatus(fetchImpl: Fetch = f()): Promise<boolean> {
  return probe ??= (async () => {
    try {
      const r = await withTimeout('/api/health', { headers: { Accept: 'application/json' } }, 5000, fetchImpl);
      return r.ok && isJson(r) && (await r.json() as { backend?: unknown }).backend === true;
    } catch { return false; }
  })();
}
/** tests: forget the cached answer */
export function resetBackendStatus(): void { probe = null; }

// ------------------------------------------------------------------ organizer device
export type PutOutcome = 'ok' | 'taken' | 'invalid' | 'error';
export async function putEvent(slug: string, key: string, snapshot: unknown, fetchImpl: Fetch = f()): Promise<PutOutcome> {
  try {
    const r = await withTimeout(`/api/events/${encodeURIComponent(slug)}`, { method: 'PUT', headers: { ...JSON_HEADERS, ...auth(key) }, body: JSON.stringify(snapshot) }, 15000, fetchImpl);
    return r.ok ? 'ok' : r.status === 401 ? 'taken' : r.status === 422 || r.status === 413 ? 'invalid' : 'error';
  } catch { return 'error'; }
}
export async function fetchReplies(slug: string, key: string, since: number, fetchImpl: Fetch = f()): Promise<{ replies: RemoteReply[]; cursor: number; more: boolean } | null> {
  try {
    const r = await withTimeout(`/api/replies/${encodeURIComponent(slug)}?since=${since}`, { headers: auth(key) }, 15000, fetchImpl);
    if (!r.ok || !isJson(r)) return null;
    const body = await r.json() as { replies?: RemoteReply[]; cursor?: number; more?: boolean };
    return Array.isArray(body.replies) ? { replies: body.replies, cursor: Number(body.cursor) || since, more: !!body.more } : null;
  } catch { return null; }
}

/** Vercel Blob client upload: the bytes go straight to Blob storage (no 4.5 MB function body limit); /api/upload only signs. */
export async function uploadAudio(slug: string, key: string, trackId: string, blob: Blob): Promise<string> {
  const { upload } = await import('@vercel/blob/client');
  const ext = ({ 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/wave': 'wav', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/aac': 'aac', 'audio/webm': 'webm' } as Record<string, string>)[blob.type.split(';')[0]!.trim()] ?? 'audio';
  const res = await upload(`a/${slug}/${trackId.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 60)}.${ext}`, blob, {
    access: 'public', handleUploadUrl: '/api/upload', clientPayload: JSON.stringify({ slug }), headers: auth(key), contentType: blob.type.split(';')[0]!.trim(),
  });
  return res.url;
}
export async function deleteAudio(slug: string, key: string, url: string, fetchImpl: Fetch = f()): Promise<boolean> {
  try {
    const r = await withTimeout('/api/upload', { method: 'DELETE', headers: { ...JSON_HEADERS, ...auth(key) }, body: JSON.stringify({ slug, url }) }, 15000, fetchImpl);
    return r.ok;
  } catch { return false; }
}

// ------------------------------------------------------------------ guest device
async function guestError(r: Response | null): Promise<AppError> {
  if (!r) return copyError('network', 'erOffline');
  const code = isJson(r) ? (await r.json().catch(() => ({})) as { error?: string; field?: string }) : {};
  if (r.status === 404 && code.error === 'personal_only') return new AppError('not_found', 'هذه الدعوة شخصية. استخدم الرابط الذي وصلك من صاحب الدعوة.');
  if (r.status === 404) return new AppError('not_found', 'هذه الدعوة غير موجودة. تأكد من الرابط مع صاحب الدعوة.');
  if (r.status === 409) return new AppError('conflict', 'انتهى وقت الرد على هذه الدعوة.');
  if (r.status === 429) return new AppError('conflict', 'وصلتنا ردود كثيرة من هذه الدعوة خلال دقائق. انتظروا قليلًا ثم أعيدوا الإرسال.');
  if (r.status === 422) return new AppError('validation', 'راجعوا الرد: بعض البيانات غير صحيحة.', code.field);
  return copyError('network', 'erOffline');
}
export async function fetchInvite(slug: string, code: string | null | undefined, replyId?: string, fetchImpl: Fetch = f()): Promise<GuestView> {
  const path = `/api/invite/${encodeURIComponent(slug)}${code ? `/${encodeURIComponent(code)}` : ''}${replyId ? `?reply=${encodeURIComponent(replyId)}` : ''}`;
  let r: Response | null = null;
  try { r = await withTimeout(path, { headers: { Accept: 'application/json' } }, 12000, fetchImpl); } catch { /* network */ }
  if (!r?.ok || !isJson(r)) throw await guestError(r?.ok ? null : r);
  return await r.json() as GuestView;
}
export async function postReply(slug: string, code: string | null, body: unknown, fetchImpl: Fetch = f()): Promise<{ reply: RemoteReply; view: GuestView }> {
  let r: Response | null = null;
  try { r = await withTimeout(`/api/replies/${encodeURIComponent(slug)}${code ? `/${encodeURIComponent(code)}` : ''}`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(body) }, 15000, fetchImpl); } catch { /* network */ }
  if (!r?.ok || !isJson(r)) throw await guestError(r?.ok ? null : r);
  return await r.json() as { reply: RemoteReply; view: GuestView };
}
