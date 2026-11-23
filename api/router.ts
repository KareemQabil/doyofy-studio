/**
 * Doyofy's small backend: ONE Vercel Function (Node.js runtime, Web `Request → Response` signature). vercel.json rewrites
 * every /api/<route> to /api/router?route=<route>; see docs/BACKEND.md for the data model, privacy rules and set-up.
 *
 *   GET    /api/health                      → { backend }  (false until a Blob store is connected: BLOB_READ_WRITE_TOKEN)
 *   PUT    /api/events/:slug                owner key   the organizer device's PUBLIC snapshot of one event
 *   GET    /api/invite/:slug[/:code]                    the guest view (general link: ?reply=<id> shows this device's reply)
 *   POST   /api/replies/:slug[/:code]                   a guest's reply (latest wins per code / per general-link reply id)
 *   GET    /api/replies/:slug?since=<cursor> owner key  replies for the organizer's device to merge
 *   POST   /api/upload                      owner key   Vercel Blob client-upload token for one audio file (≤ 8 MB, audio/*)
 *   DELETE /api/upload                      owner key   removes an uploaded audio file of that event
 *
 * Self-contained on purpose: Node resolves this file as ESM on Vercel without a bundler, so it imports nothing from src/
 * (those modules use extensionless imports) and nothing from Node: Web Crypto, fetch and Response are globals.
 *
 * Storage is an injected interface: Vercel Blob in production, an in-memory map in tests and tools/dev-api.mjs.
 * Every data pathname starts with an HMAC of the slug keyed by a server secret (the Blob token), so nobody who learns the
 * public store host from an audio URL can guess where an event's guest list or replies live; data URLs never leave here.
 * Objects are never overwritten: each write is a new pathname and readers take the newest from a (fresh) listing, so the
 * Blob CDN cache can never serve a stale snapshot or reply.
 */

// ------------------------------------------------------------------ wire types (kept local: see header)
type Status = 'pending' | 'confirmed' | 'declined';
interface Meal { optionId: string; count: number }
interface Dietary { answered: boolean; needs: string[]; affectedCount?: number; note?: string }
interface GuestEntry {
  code: string; name: string; max: number; status: Status; count?: number; companions?: string[]; note?: string;
  meals?: Meal[]; dietary?: Dietary; table?: string; checkedIn?: number; at?: string;
}
interface Experience {
  revision: number;
  meals: { enabled: boolean; required: boolean; options: Array<{ id: string; label: string }> };
  dietary: { enabled: boolean };
  gifts: { enabled: boolean; afterDecline: boolean; intro?: string; items: Array<{ id: string; kind: string; title: string; note?: string; url?: string; linkLabel?: string }> };
}
interface PublicEvent {
  id: string; slug: string; type: string; title: string; names: { a: string; b?: string; aEn?: string; bEn?: string };
  date: string; time: string; timeZone: string; durationHours: number;
  venue: { name: string; city: string; nameEn?: string; cityEn?: string; mapUrl?: string };
}
export interface Snapshot {
  v: 1; event: PublicEvent; startsAt: string; endsAt: string; design: Record<string, unknown>; dialect?: string;
  experience?: Experience; general: { allowed: boolean; maxGuests: number }; guests: GuestEntry[]; archived?: boolean; updatedAt: string;
}
export interface Reply {
  id: string; code: string | null; name: string; attending: boolean; count: number; companionNames?: string[]; note?: string;
  meals?: Meal[]; dietary?: Dietary; experienceRevision?: number; at: string;
}

// ------------------------------------------------------------------ storage
export interface Storage {
  /** writes `body` at `pathname`; `ifAbsent` → 'exists' (nothing written) when the pathname is taken */
  put(pathname: string, body: string, opts?: { ifAbsent?: boolean }): Promise<'ok' | 'exists'>;
  get(pathname: string): Promise<string | null>;
  /** every pathname under the prefix (all pages) */
  list(prefix: string): Promise<string[]>;
  del(pathnames: string[]): Promise<void>;
}

/** tests and tools/dev-api.mjs: the same contract, in memory */
export function memoryStorage(): Storage & { dump(): Map<string, string> } {
  const rows = new Map<string, string>();
  return {
    async put(p, body, opts) { if (opts?.ifAbsent && rows.has(p)) return 'exists'; rows.set(p, body); return 'ok'; },
    async get(p) { return rows.get(p) ?? null; },
    async list(prefix) { return [...rows.keys()].filter((k) => k.startsWith(prefix)).sort(); },
    async del(ps) { for (const p of ps) rows.delete(p); },
    dump: () => rows,
  };
}

/** Vercel Blob (public store; secrecy comes from the HMAC'd pathnames, never from the URL alone) */
export function vercelBlobStorage(token: string): Storage {
  const sdk = () => import('@vercel/blob');
  const storeId = token.split('_')[3] ?? '';
  const urlOf = (p: string) => `https://${storeId}.public.blob.vercel-storage.com/${p}`;
  const read = async (p: string) => {
    const r = await fetch(urlOf(p), { cache: 'no-store' });
    if (r.status === 404 || r.status === 403) return null;
    if (!r.ok) throw new Error(`blob read ${r.status}`);
    return r.text();
  };
  return {
    async put(p, body, opts) {
      const { put } = await sdk();
      try {
        await put(p, body, { access: 'public', token, addRandomSuffix: false, allowOverwrite: !opts?.ifAbsent, contentType: 'application/json', cacheControlMaxAge: 3600 });
        return 'ok';
      } catch (e) {
        if (opts?.ifAbsent && (await read(p)) !== null) return 'exists';
        throw e;
      }
    },
    get: read,
    async list(prefix) {
      const { list } = await sdk();
      const out: string[] = [];
      let cursor: string | undefined;
      do {
        const page = await list({ prefix, cursor, limit: 1000, token });
        out.push(...page.blobs.map((b) => b.pathname));
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
      return out.sort();
    },
    async del(ps) { if (ps.length) { const { del } = await sdk(); await del(ps.map(urlOf), { token }); } },
  };
}

/** the Vercel Blob client-upload handshake (`handleUpload` from @vercel/blob/client), injectable for tests */
export type UploadHandshake = (args: {
  request: Request; body: unknown; token: string;
  onBeforeGenerateToken: (pathname: string, clientPayload: string | null) => Promise<Record<string, unknown>>;
}) => Promise<unknown>;

export interface ApiDeps {
  /** null = no Blob store connected: /api/health says backend:false and everything else answers 503 */
  storage: Storage | null;
  /** keys the pathname HMAC; the Blob token in production */
  secret: string;
  token?: string;
  now?: () => Date;
  upload?: UploadHandshake;
}

// ------------------------------------------------------------------ limits
export const LIMITS = {
  snapshotBytes: 512 * 1024, replyBytes: 16 * 1024, guests: 2000, audioBytes: 8 * 1024 * 1024,
  /** naive per-instance rate limit: replies per code (or per IP on the general link) in a 10-minute window */
  repliesPerWindow: 12, windowMs: 10 * 60 * 1000, repliesReturned: 300,
};
export const AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/webm'];
const BLOB_AUDIO_URL = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/a\/[a-z0-9-]+\/[A-Za-z0-9._-]+$/;
const SLUG = /^[a-z0-9][a-z0-9-]{2,80}$/;
const CODE = /^[A-Z0-9]{3,16}$/;
const KEY = /^[A-Za-z0-9_-]{32,128}$/;
const REPLY_ID = /^[a-z0-9]{16,40}$/;
const DIETARY_NEEDS = ['nuts', 'dairy', 'gluten', 'eggs', 'seafood', 'halal', 'vegetarian', 'vegan', 'other'];

// ------------------------------------------------------------------ validation toolkit
class Invalid extends Error { constructor(readonly field: string) { super(`invalid ${field}`); } }
type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
function obj(v: unknown, f: string): Obj { if (!isObj(v)) throw new Invalid(f); return v; }
function str(v: unknown, f: string, max: number, opts: { min?: number; re?: RegExp } = {}): string {
  if (typeof v !== 'string') throw new Invalid(f);
  const s = v.trim();
  if (s.length < (opts.min ?? 0) || s.length > max || (opts.re && !opts.re.test(s))) throw new Invalid(f);
  return s;
}
const optStr = (v: unknown, f: string, max: number, re?: RegExp) => v === undefined || v === null || v === '' ? undefined : str(v, f, max, { re });
function int(v: unknown, f: string, min: number, max: number): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) throw new Invalid(f);
  return v;
}
function num(v: unknown, f: string, min: number, max: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) throw new Invalid(f);
  return v;
}
function bool(v: unknown, f: string): boolean { if (typeof v !== 'boolean') throw new Invalid(f); return v; }
function arr<T>(v: unknown, f: string, max: number, each: (x: unknown, i: number) => T): T[] {
  if (!Array.isArray(v) || v.length > max) throw new Invalid(f);
  return v.map(each);
}
function iso(v: unknown, f: string): string {
  const s = str(v, f, 40);
  if (!Number.isFinite(Date.parse(s))) throw new Invalid(f);
  return new Date(s).toISOString();
}
const httpUrl = (v: unknown, f: string) => { const s = optStr(v, f, 2000); return s && /^https?:\/\/[^\s]+$/i.test(s) ? s : undefined; };
/** drops undefined keys so stored JSON stays minimal */
const clean = <T extends Obj>(o: T): T => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;
const normaliseCode = (s: string) => s.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');

function readMeals(v: unknown, f: string, max: number): Meal[] | undefined {
  if (v === undefined || v === null) return undefined;
  return arr(v, f, 30, (m) => { const o = obj(m, f); return { optionId: str(o.optionId, f, 64), count: int(o.count, f, 1, max) }; });
}
function readDietary(v: unknown, f: string, max: number): Dietary | undefined {
  if (v === undefined || v === null) return undefined;
  const o = obj(v, f);
  const needs = arr(o.needs ?? [], f, DIETARY_NEEDS.length, (n) => { const s = str(n, f, 20); if (!DIETARY_NEEDS.includes(s)) throw new Invalid(f); return s; });
  return clean({ answered: bool(o.answered, f), needs: [...new Set(needs)], affectedCount: o.affectedCount == null ? undefined : int(o.affectedCount, f, 1, max), note: optStr(o.note, f, 300) });
}
const readNames = (v: unknown, f: string, max: number) => v === undefined || v === null ? undefined : arr(v, f, 49, (n) => str(n, f, 80)).filter(Boolean).slice(0, Math.max(0, max - 1));

function readEvent(v: unknown, slug: string): PublicEvent {
  const e = obj(v, 'event');
  const names = obj(e.names, 'event.names'), venue = obj(e.venue, 'event.venue');
  const timeZone = str(e.timeZone, 'event.timeZone', 64);
  try { new Intl.DateTimeFormat('en', { timeZone }); } catch { throw new Invalid('event.timeZone'); }
  if (e.slug !== slug) throw new Invalid('event.slug');
  return {
    id: str(e.id, 'event.id', 64, { min: 1 }), slug, type: str(e.type, 'event.type', 40, { re: /^[a-z_]+$/ }), title: str(e.title, 'event.title', 200),
    names: clean({ a: str(names.a, 'event.names', 80, { min: 1 }), b: optStr(names.b, 'event.names', 80), aEn: optStr(names.aEn, 'event.names', 80), bEn: optStr(names.bEn, 'event.names', 80) }),
    date: str(e.date, 'event.date', 10, { re: /^\d{4}-\d{2}-\d{2}$/ }), time: str(e.time, 'event.time', 5, { re: /^\d{2}:\d{2}$/ }), timeZone,
    durationHours: num(e.durationHours, 'event.durationHours', 0.5, 72),
    venue: clean({ name: str(venue.name, 'event.venue', 200), city: str(venue.city, 'event.venue', 100), nameEn: optStr(venue.nameEn, 'event.venue', 200), cityEn: optStr(venue.cityEn, 'event.venue', 100), mapUrl: httpUrl(venue.mapUrl, 'event.venue') }),
  };
}

function readExperience(v: unknown): Experience | undefined {
  if (v === undefined || v === null) return undefined;
  const x = obj(v, 'experience'), meals = obj(x.meals, 'experience.meals'), dietary = obj(x.dietary, 'experience.dietary'), gifts = obj(x.gifts, 'experience.gifts');
  const active = (o: Obj) => o.archived !== true;
  return {
    revision: int(x.revision, 'experience.revision', 0, 1e9),
    meals: { enabled: bool(meals.enabled, 'experience.meals'), required: bool(meals.required, 'experience.meals'), options: arr(meals.options, 'experience.meals', 30, (o) => obj(o, 'experience.meals')).filter(active).map((o) => ({ id: str(o.id, 'experience.meals', 64, { min: 1 }), label: str(o.label, 'experience.meals', 120) })) },
    dietary: { enabled: bool(dietary.enabled, 'experience.dietary') },
    gifts: clean({
      enabled: bool(gifts.enabled, 'experience.gifts'), afterDecline: bool(gifts.afterDecline, 'experience.gifts'), intro: optStr(gifts.intro, 'experience.gifts', 500),
      items: arr(gifts.items, 'experience.gifts', 30, (o) => obj(o, 'experience.gifts')).filter(active).map((o) => clean({
        id: str(o.id, 'experience.gifts', 64, { min: 1 }), kind: str(o.kind, 'experience.gifts', 20, { re: /^(gift|contribution|flowers)$/ }), title: str(o.title, 'experience.gifts', 120),
        note: optStr(o.note, 'experience.gifts', 500), url: (() => { const u = httpUrl(o.url, 'experience.gifts'); return u && u.startsWith('https://') ? u : undefined; })(), linkLabel: optStr(o.linkLabel, 'experience.gifts', 60),
      })),
    }),
  };
}

/**
 * The design is public by nature (it is the card guests see). Known fields are type-checked; uploaded audio may only
 * point at this store's public audio paths; any field another version adds passes only as small plain JSON.
 */
function readDesign(v: unknown): Obj {
  const d = obj(v, 'design');
  const exp = obj(d.experience, 'design.experience'), names = obj(d.displayNames ?? {}, 'design.displayNames'), msg = obj(d.message, 'design.message');
  const out: Obj = {
    experience: { dimension: str(exp.dimension, 'design.experience', 4, { re: /^(3d|2d)$/ }), motion: str(exp.motion, 'design.experience', 10, { re: /^(animated|static)$/ }) },
    cardId: str(d.cardId, 'design.cardId', 80, { re: /^[A-Za-z0-9_.-]+$/ }), sceneId: str(d.sceneId, 'design.sceneId', 80, { re: /^[A-Za-z0-9_.-]+$/ }),
    displayNames: clean({ a: optStr(names.a, 'design.displayNames', 80), b: optStr(names.b, 'design.displayNames', 80), aEn: optStr(names.aEn, 'design.displayNames', 80), bEn: optStr(names.bEn, 'design.displayNames', 80) }),
    message: { ar: str(msg.ar, 'design.message', 2000), en: typeof msg.en === 'string' ? str(msg.en, 'design.message', 2000) : '' },
    program: arr(d.program, 'design.program', 20, (p) => { const o = obj(p, 'design.program'); return { time: str(o.time, 'design.program', 10), ar: str(o.ar, 'design.program', 200), en: typeof o.en === 'string' ? str(o.en, 'design.program', 200) : '' }; }),
  };
  if (d.audio !== undefined && d.audio !== null) {
    const a = obj(d.audio, 'design.audio');
    const mode = str(a.mode, 'design.audio', 10, { re: /^(default|builtin|library|off)$/ });
    const url = (u: unknown) => typeof u === 'string' && BLOB_AUDIO_URL.test(u) ? u : undefined;
    out.audio = clean({
      mode: mode === 'default' ? 'builtin' : mode, trackId: optStr(a.trackId, 'design.audio', 100), trackName: optStr(a.trackName, 'design.audio', 80),
      voiceId: optStr(a.voiceId, 'design.audio', 100), voiceName: optStr(a.voiceName, 'design.audio', 80),
      trackUrl: url(a.trackUrl), voiceUrl: url(a.voiceUrl),
      trackStart: a.trackStart == null ? undefined : num(a.trackStart, 'design.audio', 0, 6 * 3600), trackFade: a.trackFade == null ? undefined : num(a.trackFade, 'design.audio', 0, 5),
    });
  }
  for (const [k, val] of Object.entries(d)) {
    if (k in out || k === 'audio' || !/^[a-zA-Z]{1,40}$/.test(k)) continue;
    const json = JSON.stringify(val);
    if (json !== undefined && json.length <= 4096) out[k] = JSON.parse(json);
  }
  return out;
}

function readGuest(v: unknown): GuestEntry {
  const g = obj(v, 'guests');
  const max = int(g.max, 'guests.max', 1, 50);
  const status = str(g.status, 'guests.status', 10, { re: /^(pending|confirmed|declined)$/ }) as Status;
  return clean({
    code: normaliseCode(str(g.code, 'guests.code', 20)), name: str(g.name, 'guests.name', 120, { min: 1 }), max, status,
    count: status === 'confirmed' ? int(g.count, 'guests.count', 1, max) : undefined,
    companions: readNames(g.companions, 'guests.companions', max), note: optStr(g.note, 'guests.note', 1000),
    meals: readMeals(g.meals, 'guests.meals', max), dietary: readDietary(g.dietary, 'guests.dietary', max),
    table: optStr(g.table, 'guests.table', 80), checkedIn: g.checkedIn == null ? undefined : int(g.checkedIn, 'guests.checkedIn', 0, 50), at: g.at == null ? undefined : iso(g.at, 'guests.at'),
  });
}

/**
 * The ONLY shape the server stores for an event. Everything is rebuilt field by field, so whatever the client sends
 * (phone numbers, organizer notes, sides, account data…) never reaches storage.
 */
export function readSnapshot(v: unknown, slug: string): Snapshot {
  const s = obj(v, 'snapshot');
  if (s.v !== 1) throw new Invalid('v');
  const general = obj(s.general, 'general');
  const guests = arr(s.guests, 'guests', LIMITS.guests, readGuest);
  if (guests.some((g) => !CODE.test(g.code)) || new Set(guests.map((g) => g.code)).size !== guests.length) throw new Invalid('guests.code');
  const startsAt = iso(s.startsAt, 'startsAt'), endsAt = iso(s.endsAt, 'endsAt');
  if (Date.parse(endsAt) < Date.parse(startsAt)) throw new Invalid('endsAt');
  const dialect = s.dialect === 'ar-EG' || s.dialect === 'ar-SA' ? s.dialect : undefined;
  return clean({
    v: 1 as const, event: readEvent(s.event, slug), startsAt, endsAt, design: readDesign(s.design), dialect, experience: readExperience(s.experience),
    general: { allowed: bool(general.allowed, 'general'), maxGuests: int(general.maxGuests, 'general', 1, 50) }, guests,
    archived: s.archived === true ? true : undefined, updatedAt: new Date().toISOString(),
  });
}

// ------------------------------------------------------------------ crypto helpers (Web Crypto)
const enc = new TextEncoder();
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
export const sha256 = async (s: string) => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
async function hmac(secret: string, s: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(s))).slice(0, 32);
}
function sameHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
const randomId = (n = 20) => { const b = crypto.getRandomValues(new Uint8Array(n)); return [...b].map((x) => 'abcdefghijklmnopqrstuvwxyz0123456789'[x % 36]).join(''); };
/** sortable version stamp: 13-digit epoch ms + random tail; `after` keeps it later than the newest existing version */
const stamp = (now: Date, after = 0) => `${String(Math.max(now.getTime(), after + 1)).padStart(13, '0')}-${randomId(6)}`;
const stampTime = (pathname: string) => Number(pathname.split('/').pop()?.slice(0, 13) ?? 0);

// ------------------------------------------------------------------ responses
const HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: HEADERS });
const fail = (status: number, error: string, field?: string) => json(status, field ? { error, field } : { error });

async function readBody(request: Request, max: number): Promise<unknown> {
  if (!/^application\/json\b/i.test(request.headers.get('content-type') ?? '')) throw new HttpError(415, 'json_only');
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > max) throw new HttpError(413, 'too_large');
  const text = await request.text();
  if (enc.encode(text).length > max) throw new HttpError(413, 'too_large');
  try { return JSON.parse(text); } catch { throw new HttpError(400, 'bad_json'); }
}
class HttpError extends Error { constructor(readonly status: number, readonly code: string) { super(code); } }

/** same-origin only: no CORS headers are ever sent, and a write a browser marks cross-site is refused outright */
function crossSite(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') return true;
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try { return new URL(origin).host !== new URL(request.url).host && new URL(origin).host !== request.headers.get('x-forwarded-host'); } catch { return true; }
}

// ------------------------------------------------------------------ the API
export function createApi(deps: ApiDeps) {
  const now = deps.now ?? (() => new Date());
  const hits = new Map<string, number[]>();
  const limited = (key: string) => {
    const t = now().getTime(), recent = (hits.get(key) ?? []).filter((x) => t - x < LIMITS.windowMs);
    if (recent.length >= LIMITS.repliesPerWindow) { hits.set(key, recent); return true; }
    recent.push(t); hits.set(key, recent);
    if (hits.size > 5000) hits.clear();   // bounded memory: the limit is a courtesy, not a guarantee
    return false;
  };
  const base = async (slug: string) => `e/${await hmac(deps.secret, slug)}`;

  async function latest(storage: Storage, prefix: string): Promise<string | null> {
    for (let attempt = 0; attempt < 2; attempt++) {
      const names = await storage.list(prefix);
      const newest = names.filter((n) => n.endsWith('.json')).sort().pop();
      if (!newest) return null;
      const body = await storage.get(newest);
      if (body !== null) return body;    // a newer write may have removed it between list and read: list again
    }
    return null;
  }
  const loadSnapshot = async (storage: Storage, slug: string): Promise<Snapshot | null> => {
    const body = await latest(storage, `${await base(slug)}/s/`);
    return body ? JSON.parse(body) as Snapshot : null;
  };
  const replyKey = (code: string | null, id: string) => code ? `c-${code}` : `g-${id}`;
  const loadReply = async (storage: Storage, slug: string, key: string): Promise<Reply | null> => {
    const body = await latest(storage, `${await base(slug)}/r/${key}/`);
    return body ? JSON.parse(body) as Reply : null;
  };
  /** writes a new version under `prefix`, always sorting after the ones already there (even within the same millisecond) */
  const putVersion = async (storage: Storage, prefix: string, body: string) => {
    const newest = (await storage.list(prefix)).sort().pop();
    await storage.put(`${prefix}${stamp(now(), newest ? stampTime(newest) : 0)}.json`, body);
  };
  /** keep the newest `keep` versions under a prefix; older ones are removed (best effort) */
  const prune = async (storage: Storage, prefix: string, keep: number) => {
    const names = (await storage.list(prefix)).sort();
    if (names.length > keep) await storage.del(names.slice(0, names.length - keep)).catch(() => {});
  };

  async function ownerCheck(storage: Storage, request: Request, slug: string, register: boolean): Promise<Response | null> {
    const key = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!KEY.test(key)) return fail(401, 'owner_key_required');
    const path = `${await base(slug)}/owner.json`;
    const hash = await sha256(key);
    const stored = await storage.get(path);
    if (stored === null) {
      if (!register) return fail(401, 'not_registered');
      if (await storage.put(path, JSON.stringify({ hash, at: now().toISOString() }), { ifAbsent: true }) === 'ok') return null;
      return ownerCheck(storage, request, slug, false);
    }
    try { return sameHex((JSON.parse(stored) as { hash: string }).hash, hash) ? null : fail(401, 'wrong_owner_key'); }
    catch { return fail(500, 'owner_record_damaged'); }
  }

  const phaseOf = (s: Snapshot) => {
    const t = now().getTime();
    if (s.archived || t > Date.parse(s.endsAt) + 3 * 36e5) return 'after' as const;
    let today = '';
    try { today = new Intl.DateTimeFormat('en-CA', { timeZone: s.event.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now()); } catch { /* validated on write */ }
    return today >= s.event.date ? 'event_day' as const : 'before' as const;
  };
  const canEdit = (s: Snapshot) => !s.archived && now().getTime() < Date.parse(s.startsAt);

  /** the GuestView the guest pages already know (services/contracts.ts), for one code or the general link */
  function guestView(s: Snapshot, entry: GuestEntry | null, reply: Reply | null) {
    const useReply = !!reply && (!entry?.at || Date.parse(reply.at) >= Date.parse(entry.at));
    const party = entry && (useReply && reply
      ? clean({ code: entry.code, name: entry.name, maxPartySize: entry.max, rsvpStatus: reply.attending ? 'confirmed' : 'declined', confirmedPartySize: reply.attending ? reply.count : undefined, companionNames: reply.companionNames?.length ? reply.companionNames : entry.companions, guestNote: reply.note, meals: reply.meals, dietary: reply.dietary, tableName: entry.table, checkedInCount: entry.checkedIn ?? 0 })
      : clean({ code: entry.code, name: entry.name, maxPartySize: entry.max, rsvpStatus: entry.status, confirmedPartySize: entry.count, companionNames: entry.companions, guestNote: entry.note, meals: entry.meals, dietary: entry.dietary, tableName: entry.table, checkedInCount: entry.checkedIn ?? 0 }));
    return clean({
      event: s.event, design: s.design, party: party ?? null, canEdit: canEdit(s), maxGuests: entry?.max ?? s.general.maxGuests, phase: phaseOf(s),
      experience: s.experience, dialect: s.dialect,
      reply: !entry && reply ? clean({ id: reply.id, name: reply.name, attending: reply.attending, count: reply.count, companionNames: reply.companionNames, meals: reply.meals, dietary: reply.dietary }) : undefined,
    });
  }

  function readReplyInput(body: unknown, s: Snapshot, entry: GuestEntry | null): Omit<Reply, 'id' | 'at' | 'code'> & { replaces?: string } {
    const b = obj(body, 'reply');
    const max = entry?.max ?? s.general.maxGuests;
    const attending = bool(b.attending, 'attending');
    const count = attending ? int(b.count, 'count', 1, max) : 0;
    const name = entry ? entry.name : str(b.name, 'name', 80, { min: 1 });
    const x = s.experience;
    let meals = attending && x?.meals.enabled ? readMeals(b.meals, 'meals', count) : undefined;
    if (meals) {
      const ids = new Set(x!.meals.options.map((o) => o.id));
      if (meals.some((m) => !ids.has(m.optionId)) || meals.reduce((n, m) => n + m.count, 0) > count) throw new Invalid('meals');
      if (!meals.length) meals = undefined;
    }
    const dietary = attending && x?.dietary.enabled ? readDietary(b.dietary, 'dietary', count) : undefined;
    return clean({
      name, attending, count, companionNames: attending ? readNames(b.companionNames, 'companionNames', count) : undefined, note: optStr(b.note, 'note', 500),
      meals, dietary, experienceRevision: attending && x ? x.revision : undefined,
      replaces: !entry && typeof b.replaces === 'string' && REPLY_ID.test(b.replaces) ? b.replaces : undefined,
    });
  }

  async function route(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const raw = url.searchParams.get('route') ?? url.pathname.replace(/^\/api\/?/, '');
    const parts = raw.split('/').filter(Boolean).map((p) => decodeURIComponent(p));
    const [name, slugRaw, codeRaw, extra] = parts;
    const method = request.method.toUpperCase();
    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: { Allow: 'GET, PUT, POST, DELETE' } });
    if (name === 'health' && parts.length === 1 && method === 'GET') return json(200, { backend: !!deps.storage });
    const storage = deps.storage;
    if (!storage) return fail(503, 'backend_off');
    if (method !== 'GET' && crossSite(request)) return fail(403, 'cross_site');
    if (extra !== undefined) return fail(404, 'not_found');

    if (name === 'upload' && !slugRaw) {
      if (method === 'POST') return upload(storage, request);
      if (method === 'DELETE') return removeUpload(storage, request);
      return fail(405, 'method');
    }
    const slug = (slugRaw ?? '').toLowerCase();
    if (!SLUG.test(slug)) return fail(404, 'not_found');
    const code = codeRaw === undefined ? null : normaliseCode(codeRaw);
    if (code !== null && !CODE.test(code)) return fail(404, 'not_found');

    if (name === 'events' && code === null) {
      if (method !== 'PUT') return fail(405, 'method');
      const denied = await ownerCheck(storage, request, slug, true);
      if (denied) return denied;
      const snap = readSnapshot(await readBody(request, LIMITS.snapshotBytes), slug);
      const prefix = `${await base(slug)}/s/`;
      await putVersion(storage, prefix, JSON.stringify(snap));
      await prune(storage, prefix, 2);
      return json(200, { ok: true, slug, guests: snap.guests.length, updatedAt: snap.updatedAt });
    }

    if (name === 'invite') {
      if (method !== 'GET') return fail(405, 'method');
      const s = await loadSnapshot(storage, slug);
      if (!s || s.archived) return fail(404, 'not_found');
      if (code) {
        const entry = s.guests.find((g) => g.code === code);
        if (!entry) return fail(404, 'not_found');
        return json(200, guestView(s, entry, await loadReply(storage, slug, replyKey(code, ''))));
      }
      if (!s.general.allowed) return fail(404, 'personal_only');
      const own = url.searchParams.get('reply');
      const reply = own && REPLY_ID.test(own) ? await loadReply(storage, slug, replyKey(null, own)) : null;
      return json(200, guestView(s, null, reply));
    }

    if (name === 'replies') {
      if (method === 'GET' && code === null) {
        const denied = await ownerCheck(storage, request, slug, false);
        if (denied) return denied;
        const since = Number(url.searchParams.get('since') ?? 0) || 0;
        const prefix = `${await base(slug)}/r/`;
        const newest = new Map<string, string>();
        for (const p of await storage.list(prefix)) {
          const key = p.slice(prefix.length).split('/')[0]!;
          if (!newest.has(key) || p > newest.get(key)!) newest.set(key, p);
        }
        const fresh = [...newest.values()].filter((p) => stampTime(p) > since).sort((a, b) => stampTime(a) - stampTime(b)).slice(0, LIMITS.repliesReturned);
        const replies: Reply[] = [];
        for (const p of fresh) { const body = await storage.get(p); if (body) replies.push(JSON.parse(body) as Reply); }
        const cursor = fresh.length ? stampTime(fresh[fresh.length - 1]!) : since;
        return json(200, { replies, cursor, more: fresh.length === LIMITS.repliesReturned });
      }
      if (method !== 'POST') return fail(405, 'method');
      const s = await loadSnapshot(storage, slug);
      if (!s || s.archived) return fail(404, 'not_found');
      const entry = code ? s.guests.find((g) => g.code === code) ?? null : null;
      if (code && !entry) return fail(404, 'not_found');
      if (!code && !s.general.allowed) return fail(404, 'personal_only');
      if (!canEdit(s)) return fail(409, 'closed');
      const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0]!.trim() || 'local';
      if (limited(`${slug}/${code ?? `ip:${ip}`}`)) return fail(429, 'slow_down');
      const input = readReplyInput(await readBody(request, LIMITS.replyBytes), s, entry);
      const { replaces, ...answer } = input;
      // a general-link correction replaces its own earlier reply (the id is the capability, unguessable)
      const id = !code && replaces && await loadReply(storage, slug, replyKey(null, replaces)) ? replaces : randomId(20);
      const reply: Reply = { id, code, ...answer, at: now().toISOString() };
      const prefix = `${await base(slug)}/r/${replyKey(code, id)}/`;
      await putVersion(storage, prefix, JSON.stringify(reply));
      await prune(storage, prefix, 1);
      return json(200, { reply, view: guestView(s, entry, reply) });
    }
    return fail(404, 'not_found');
  }

  async function upload(storage: Storage, request: Request): Promise<Response> {
    if (!deps.upload || !deps.token) return fail(501, 'upload_unavailable');
    const body = await readBody(request, 8 * 1024);
    const payload = isObj(body) && isObj(body.payload) ? body.payload : {};
    const clientPayload = typeof payload.clientPayload === 'string' ? payload.clientPayload : '';
    let slug = '';
    try { slug = String((JSON.parse(clientPayload) as { slug?: unknown }).slug ?? ''); } catch { /* checked below */ }
    if (!SLUG.test(slug)) return fail(400, 'slug');
    const denied = await ownerCheck(storage, request, slug, false);
    if (denied) return denied;
    try {
      const result = await deps.upload({
        request, body, token: deps.token,
        onBeforeGenerateToken: async (pathname) => {
          if (!new RegExp(`^a/${slug}/[A-Za-z0-9._-]{1,80}$`).test(pathname)) throw new Invalid('pathname');
          return { allowedContentTypes: AUDIO_TYPES, maximumSizeInBytes: LIMITS.audioBytes, addRandomSuffix: true, allowOverwrite: false, cacheControlMaxAge: 31536000, validUntil: now().getTime() + 10 * 60 * 1000 };
        },
      });
      return json(200, result);
    } catch (e) {
      return e instanceof Invalid ? fail(400, e.message.replace(/^invalid /, '')) : fail(400, 'upload_refused');
    }
  }

  async function removeUpload(storage: Storage, request: Request): Promise<Response> {
    const b = obj(await readBody(request, 4 * 1024), 'body');
    const slug = str(b.slug, 'slug', 81, { re: SLUG });
    const denied = await ownerCheck(storage, request, slug, false);
    if (denied) return denied;
    const target = str(b.url, 'url', 400);
    if (!BLOB_AUDIO_URL.test(target) || new URL(target).pathname.split('/')[2] !== slug) return fail(400, 'url');
    await storage.del([new URL(target).pathname.slice(1)]);
    return json(200, { ok: true });
  }

  return async (request: Request): Promise<Response> => {
    try { return await route(request); }
    catch (e) {
      if (e instanceof Invalid) return fail(422, 'invalid', e.field);
      if (e instanceof HttpError) return fail(e.status, e.code);
      console.error('[api]', e instanceof Error ? e.message : e);
      return fail(500, 'server_error');
    }
  };
}

// ------------------------------------------------------------------ Vercel entry
const env = (name: string): string | undefined => (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[name]?.trim() || undefined;
let handler: ((request: Request) => Promise<Response>) | null = null;
function fromEnv() {
  const token = env('BLOB_READ_WRITE_TOKEN');
  return createApi({
    storage: token ? vercelBlobStorage(token) : null,
    secret: env('DOYOFY_PATH_SECRET') ?? token ?? '',
    token,
    upload: async ({ request, body, token: t, onBeforeGenerateToken }) => {
      const { handleUpload } = await import('@vercel/blob/client');
      return handleUpload({ request, body: body as Parameters<typeof handleUpload>[0]['body'], token: t, onBeforeGenerateToken: (p, c) => onBeforeGenerateToken(p, c) });
    },
  });
}

export default {
  fetch(request: Request): Promise<Response> {
    handler ??= fromEnv();
    return handler(request);
  },
};
