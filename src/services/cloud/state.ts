/**
 * The sync layer's memory on the organizer's device: the owner key (a random secret only this device holds; the server
 * keeps its SHA-256), which public slug each event got, which guest codes reached the backend, the reply cursor, and the
 * uploaded audio URLs. Plus the CloudService the screens read synchronously (services/contracts.ts).
 */
import type { CloudService } from '../contracts';

export const CLOUD_META_KEY = 'doyofy:cloud:v1';

export interface EventMeta {
  /** the event's public slug on the backend: its local slug + a random tail, so two organizers never collide */
  slug: string;
  /** codes present in the last snapshot the backend accepted (a guest added a second ago keeps the portable link) */
  codes: string[];
  /** the general link was allowed in that snapshot */
  general: boolean;
  /** what was last sent, so an unchanged event is not sent again */
  hash?: string;
  /** reply cursor (the server's version stamp) and, per reply key, the reply time already merged */
  cursor?: number;
  applied?: Record<string, string>;
}
export interface CloudMeta {
  key: string;
  /** the demo store's seed time: a prototype reset starts fresh slugs, so old replies never land on the new seed */
  seededAt?: string;
  events: Record<string, EventMeta>;
  /** audio track id → its public URL and the event slug it was uploaded under */
  uploads: Record<string, { url: string; slug: string }>;
}

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export const newOwnerKey = () => b64url(crypto.getRandomValues(new Uint8Array(32)));
/** `<local slug>-<6 random>` within the server's slug rule */
export function newPublicSlug(local: string): string {
  const base = local.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'e';
  const tail = [...crypto.getRandomValues(new Uint8Array(6))].map((x) => 'abcdefghijkmnpqrstuvwxyz23456789'[x % 32]).join('');
  return `${base}-${tail}`;
}

export function readMeta(storage: Pick<Storage, 'getItem'> | null): CloudMeta {
  try {
    const m = JSON.parse(storage?.getItem(CLOUD_META_KEY) ?? 'null') as Partial<CloudMeta> | null;
    if (m && typeof m.key === 'string' && /^[A-Za-z0-9_-]{32,128}$/.test(m.key)) return { key: m.key, seededAt: m.seededAt, events: m.events ?? {}, uploads: m.uploads ?? {} };
  } catch { /* damaged: start over with a new key */ }
  return { key: newOwnerKey(), events: {}, uploads: {} };
}
export function writeMeta(storage: Pick<Storage, 'setItem'> | null, meta: CloudMeta): void {
  try { storage?.setItem(CLOUD_META_KEY, JSON.stringify(meta)); } catch { /* the sync keeps working for this session */ }
}

export class CloudState implements CloudService {
  private on: boolean | null = null;
  private v = 0;
  private listeners = new Set<() => void>();
  meta: CloudMeta;
  constructor(readonly storage: Storage | null) {
    this.meta = readMeta(storage);
    if (typeof window !== 'undefined') window.addEventListener('storage', (e) => { if (e.key === CLOUD_META_KEY) { this.meta = readMeta(storage); this.emit(); } });
  }
  // arrow properties: screens pass these straight to useSyncExternalStore
  status = () => this.on;
  setStatus(on: boolean) { if (on !== this.on) { this.on = on; this.emit(); } }
  guestPath = (eventId: string, code?: string): string | null => {
    const e = this.on ? this.meta.events[eventId] : undefined;
    if (!e?.slug || !e.hash) return null;
    if (code) return e.codes.includes(code) ? `/i/${encodeURIComponent(e.slug)}/${encodeURIComponent(code)}` : null;
    return e.general ? `/i/${encodeURIComponent(e.slug)}` : null;
  };
  version = () => this.v;
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  save() { writeMeta(this.storage, this.meta); this.emit(); }
  emit() { this.v++; for (const l of [...this.listeners]) l(); }
}

/** a services container without the Vercel backend (the Supabase adapter, tests): links stay portable */
export const CLOUD_OFF: CloudService = { status: () => false, guestPath: () => null, version: () => 0, subscribe: () => () => {} };
