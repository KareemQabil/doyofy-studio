/**
 * The organizer device's sync with the Vercel backend. It does nothing until /api/health says a storage is connected;
 * then, while the app is open:
 *  - every event change (design, guests, replies, settings) sends that event's public snapshot, debounced, only when
 *    it actually changed;
 *  - every 20 s, on focus and when the tab becomes visible, guests' replies from any device are pulled and merged into
 *    the local store (the replies page, counts, seating and check-in then show them like any other reply);
 *  - the account's uploaded music and voice welcome are uploaded once to Blob storage (IndexedDB stays the local copy),
 *    so a guest's device can play them; a deleted track is deleted there too.
 * The local store remains the organizer's source of truth; a failed call simply retries on the next change or tick.
 */
import type { MockStore } from '../mock/store';
import { applyRemoteReplies, eventSnapshot, type PublicSnapshot } from '../mock/cloud-bridge';
import { CloudState, newPublicSlug } from './state';
import { backendStatus, deleteAudio, fetchReplies, putEvent, uploadAudio } from './api';
import { loadAudioTrackBlob, readAudioLibrary, subscribeAudioLibrary } from '../../domain/audio-library';
import { currentDialect } from '../../data/copy-preference.js';
import type { Dialect } from '../../domain/copy';

export interface SyncOptions {
  debounceMs?: number;
  pullEveryMs?: number;
  isOn?: () => Promise<boolean>;
  /** injectable for tests; defaults to the real calls in api.ts */
  calls?: Partial<{ putEvent: typeof putEvent; fetchReplies: typeof fetchReplies; uploadAudio: typeof uploadAudio; deleteAudio: typeof deleteAudio }>;
}

export function startCloudSync(store: MockStore, state: CloudState, opts: SyncOptions = {}): () => void {
  const calls = { putEvent, fetchReplies, uploadAudio, deleteAudio, ...opts.calls };
  const cleanups: Array<() => void> = [];
  let stopped = false, timer: ReturnType<typeof setTimeout> | null = null, running: Promise<void> | null = null, again = false;
  const uploading = new Set<string>();

  /** a prototype reset (new seed) starts over with new public slugs, so replies to the old demo never land on the new one */
  const checkSeed = () => {
    const seededAt = store.read().seededAt;
    if (state.meta.seededAt !== seededAt) { state.meta = { ...state.meta, seededAt, events: {} }; state.save(); }
  };

  const withAudioUrls = (a: PublicSnapshot['design']['audio']) => {
    if (!a) return a;
    const up = state.meta.uploads;
    const tracks = readAudioLibrary().tracks;
    const music = a.mode === 'library' && a.trackId ? up[a.trackId] : undefined;
    const track = a.trackId ? tracks.find((t) => t.id === a.trackId) : undefined;
    return {
      ...a,
      ...(music ? { trackUrl: music.url, trackStart: track?.startSec ?? 0, trackFade: track?.fadeInSec ?? 0 } : {}),
      ...(a.voiceId && up[a.voiceId] ? { voiceUrl: up[a.voiceId]!.url } : {}),
    };
  };

  async function pushEvents() {
    checkSeed();
    const db = store.read();
    for (const ev of db.events) {
      if (stopped) return;
      let meta = state.meta.events[ev.id];
      const slug = meta?.slug ?? newPublicSlug(ev.slug);
      const snap = eventSnapshot(db, ev.id, { slug, dialect: currentDialect() as Dialect, audio: withAudioUrls });
      if (!snap) continue;
      const hash = JSON.stringify(snap);
      if (meta?.hash === hash) continue;
      let out = await calls.putEvent(slug, state.meta.key, snap);
      if (out === 'taken' && !meta?.hash) {
        // someone else holds that slug (or this device lost its key before the first success): take a new one
        const retry = newPublicSlug(ev.slug);
        out = await calls.putEvent(retry, state.meta.key, { ...snap, event: { ...snap.event, slug: retry } });
        if (out === 'ok') { state.meta.events[ev.id] = { slug: retry, codes: snap.guests.map((g) => g.code), general: snap.general.allowed, hash: JSON.stringify({ ...snap, event: { ...snap.event, slug: retry } }) }; state.save(); }
        continue;
      }
      if (out !== 'ok') continue;
      meta = state.meta.events[ev.id];
      state.meta.events[ev.id] = { ...meta, slug, codes: snap.guests.map((g) => g.code), general: snap.general.allowed, hash };
      state.save();
    }
  }

  /** uploads tracks not yet on the backend (under any event slug this device owns) and removes deleted ones */
  async function syncAudio() {
    const owned = Object.values(state.meta.events).find((e) => e.hash)?.slug;
    if (!owned) return;
    const tracks = readAudioLibrary().tracks;
    let changed = false;
    for (const [id, up] of Object.entries(state.meta.uploads)) {
      if (tracks.some((t) => t.id === id)) continue;
      if (await calls.deleteAudio(up.slug, state.meta.key, up.url)) { delete state.meta.uploads[id]; changed = true; }
    }
    for (const t of tracks) {
      if (stopped || state.meta.uploads[t.id] || uploading.has(t.id)) continue;
      uploading.add(t.id);
      try {
        const blob = await loadAudioTrackBlob(t.id);
        if (!blob) continue;
        const url = await calls.uploadAudio(owned, state.meta.key, t.id, blob.type ? blob : new Blob([blob], { type: t.mime }));
        state.meta.uploads[t.id] = { url, slug: owned }; changed = true;
      } catch { /* retried on the next change */ }
      finally { uploading.delete(t.id); }
    }
    if (changed) state.save();
    return changed;
  }

  async function pull() {
    for (const [eventId, meta] of Object.entries(state.meta.events)) {
      if (stopped || !meta.hash) continue;
      let since = meta.cursor ?? 0;
      for (let page = 0; page < 10; page++) {
        const res = await calls.fetchReplies(meta.slug, state.meta.key, since);
        if (!res) break;
        const applied = { ...(meta.applied ?? {}) };
        if (res.replies.length) applyRemoteReplies(store, eventId, res.replies, applied);
        since = res.cursor;
        const current = state.meta.events[eventId];
        if (current) { state.meta.events[eventId] = { ...current, cursor: since, applied }; state.save(); }
        if (!res.more) break;
      }
    }
  }

  const cycle = (work: () => Promise<unknown>) => {
    if (running) { again = true; return running; }
    running = (async () => {
      try { await work(); } catch { /* next tick */ }
      finally { running = null; if (again && !stopped) { again = false; schedule(); } }
    })();
    return running;
  };
  const push = async () => { await pushEvents(); if (await syncAudio()) await pushEvents(); };
  const schedule = () => {
    if (stopped) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = null; void cycle(push); }, opts.debounceMs ?? 1200);
  };

  void (opts.isOn ?? (() => backendStatus()))().then((on) => {
    state.setStatus(on);
    if (!on || stopped) return;
    cleanups.push(store.subscribe(schedule), subscribeAudioLibrary(schedule));
    const refresh = () => { if (typeof document === 'undefined' || document.visibilityState !== 'hidden') void cycle(async () => { await pushEvents(); await pull(); }); };
    const tick = setInterval(refresh, opts.pullEveryMs ?? 20000);
    cleanups.push(() => clearInterval(tick));
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
      cleanups.push(() => { window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); });
    }
    void cycle(async () => { await push(); await pull(); });
  });

  return () => { stopped = true; if (timer) clearTimeout(timer); for (const c of cleanups) c(); };
}
