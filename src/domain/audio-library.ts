/**
 * The account's own sounds: uploaded music and a recorded voice welcome. This module holds the small METADATA
 * (name, kind, start point, fade) in localStorage so React and the engine can read it synchronously; the bytes go
 * through the AudioStore (audio-store.ts — IndexedDB in this prototype, a server store later).
 * Links carry a track id, never bytes: until a server store is connected, uploads play on this device only and
 * guests elsewhere silently get the built-in sound.
 */
import { audioStore, type AudioStore } from './audio-store';

export const AUDIO_LIBRARY_KEY = 'doyofy:audio-library:v2';
/** v1 kept the bytes as data: URLs in localStorage (300 KB cap); migrateLegacyAudioLibrary moves them to the store. */
export const LEGACY_AUDIO_LIBRARY_KEY = 'doyofy:audio-library:v1';
export const AUDIO_LIBRARY_EVENT = 'doyofy:audio-library-change';
export const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
export const MAX_AUDIO_TRACKS = 5;
export const MAX_VOICE_SECONDS = 60;
/** the highlighted window the organizer previews from the chosen start */
export const PREVIEW_WINDOW_SEC = 30;
/** the start can't sit so close to the end that the loop is a stutter */
export const MIN_LOOP_SEC = 10;
export const DEFAULT_FADE_IN_SEC = 1.5;
export const MAX_FADE_IN_SEC = 5;
export const AUDIO_MIME = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/webm'] as const;

export type AudioKind = 'music' | 'voice';
export interface AudioTrack {
  id: string; name: string; kind: AudioKind; mime: string; bytes: number;
  /** 0 = unknown (migrated v1 tracks until they are opened for trimming) */
  durationSec: number;
  /** music starts here and loops back here; voice always plays from 0 */
  startSec: number;
  fadeInSec: number;
}
export interface AudioLibrary { tracks: AudioTrack[]; defaultTrackId?: string }
/**
 * The invitation's sound choice. `default` = the account default (a track, or built-in); after resolution it never
 * remains: `builtin` | `library` | `off`. The voice welcome is independent of the music choice.
 */
export interface AudioSelection { mode: 'default' | 'builtin' | 'library' | 'off'; trackId?: string; trackName?: string; voiceId?: string; voiceName?: string }

/** Error codes; the UI words live in copy.ts (audioErr*). */
export type AudioIssue = 'type' | 'empty' | 'size' | 'full' | 'storage' | 'decode' | 'voiceLong';
export class AudioLibraryError extends Error { constructor(readonly code: AudioIssue) { super(code); } }

/** `audio/webm;codecs=opus` (MediaRecorder) → `audio/webm` */
export const baseMime = (type: string) => (type || '').split(';')[0]!.trim().toLowerCase();

/** Some phones hand over an m4a/mp3 with an empty or generic type: fall back to the extension. */
export function inferAudioMime(file: { name?: string; type: string }): string {
  const type = baseMime(file.type);
  if (type && type !== 'application/octet-stream') return type;
  const ext = (file.name || '').toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return ({ mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac', wav: 'audio/wav', ogg: 'audio/ogg', oga: 'audio/ogg', opus: 'audio/ogg', webm: 'audio/webm' } as Record<string, string>)[ext ?? ''] ?? type;
}

export function validateAudioFile(file: { type: string; size: number }): AudioIssue | undefined {
  if (!(AUDIO_MIME as readonly string[]).includes(baseMime(file.type))) return 'type';
  if (!Number.isFinite(file.size) || file.size <= 0) return 'empty';
  if (file.size > MAX_AUDIO_BYTES) return 'size';
}

// ---------------------------------------------------------------- start point and playback math
const round1 = (n: number) => Math.round(n * 10) / 10;
/** The latest start that still leaves MIN_LOOP_SEC (or the whole of a short track) to play. */
export function clampStartSec(start: number, duration: number): number {
  if (!(duration > 0)) return Math.max(0, round1(Number(start) || 0));
  const latest = Math.max(0, duration - Math.min(MIN_LOOP_SEC, duration));
  return round1(Math.min(Math.max(0, Number(start) || 0), latest));
}
export const clampFadeIn = (sec: number) => round1(Math.min(MAX_FADE_IN_SEC, Math.max(0, Number(sec) || 0)));
/** The highlighted preview window: 30 s from the start, cut at the end of the track. */
export function previewWindow(start: number, duration: number): { start: number; end: number } {
  const s = clampStartSec(start, duration);
  return { start: s, end: Math.min(duration, s + PREVIEW_WINDOW_SEC) };
}
/**
 * How the engine plays a track. Music: starts at the chosen point with a short fade-in and loops the remainder back
 * to that point (never to 0:00, which the organizer cut). Voice: once from the beginning, no fade, no loop.
 */
export function playbackPlan(track: Pick<AudioTrack, 'kind' | 'startSec' | 'fadeInSec'>, duration: number) {
  if (track.kind === 'voice') return { offset: 0, loop: false, loopStart: 0, loopEnd: duration, fadeInSec: 0 };
  const offset = clampStartSec(track.startSec, duration);
  return { offset, loop: true, loopStart: offset, loopEnd: duration, fadeInSec: clampFadeIn(track.fadeInSec) };
}
/** Waveform peaks (0..1) for `buckets` columns: the loudest sample of any channel in each column, normalised. */
export function computePeaks(channels: ArrayLike<number>[], buckets: number): number[] {
  const length = channels[0]?.length ?? 0, n = Math.max(1, Math.floor(buckets));
  const peaks = new Array<number>(n).fill(0);
  if (!length) return peaks;
  const step = length / n;
  for (let b = 0; b < n; b++) {
    const from = Math.floor(b * step), to = Math.max(from + 1, Math.floor((b + 1) * step));
    // sample at most ~400 points per column: a 4-minute track has ~10M samples
    const stride = Math.max(1, Math.floor((to - from) / 400));
    let max = 0;
    for (const ch of channels) for (let i = from; i < to && i < length; i += stride) { const v = Math.abs(ch[i] ?? 0); if (v > max) max = v; }
    peaks[b] = max;
  }
  const top = Math.max(...peaks);
  return top > 0 ? peaks.map(p => Math.round(p / top * 1000) / 1000) : peaks;
}
/** m:ss with Latin digits (the waveform is a left-to-right timeline) */
export function formatClock(sec: number): string {
  const s = Math.max(0, Math.floor(Number(sec) || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ---------------------------------------------------------------- metadata (sync)
const validId = (id: unknown): id is string => typeof id === 'string' && !!id && id.length <= 100;
/** v2 metadata, or a v1 entry (bytes inline) read as metadata until the migration has moved its bytes */
function readTrack(t: unknown): AudioTrack | null {
  if (!t || typeof t !== 'object') return null;
  const v = t as Partial<AudioTrack> & { dataUrl?: unknown };
  if (!validId(v.id) || typeof v.name !== 'string' || v.name.length > 80 || typeof v.mime !== 'string' || typeof v.bytes !== 'number' || validateAudioFile({ type: v.mime, size: v.bytes })) return null;
  if (v.kind === undefined && typeof v.dataUrl === 'string') {
    if (!v.dataUrl.startsWith(`data:${v.mime};base64,`)) return null;
    return { id: v.id, name: v.name, kind: 'music', mime: v.mime, bytes: v.bytes, durationSec: 0, startSec: 0, fadeInSec: DEFAULT_FADE_IN_SEC };
  }
  if (v.kind !== 'music' && v.kind !== 'voice') return null;
  const durationSec = typeof v.durationSec === 'number' && v.durationSec > 0 && v.durationSec < 6 * 3600 ? round1(v.durationSec) : 0;
  if (v.kind === 'voice' && durationSec > MAX_VOICE_SECONDS + 1) return null;
  return { id: v.id, name: v.name, kind: v.kind, mime: v.mime, bytes: v.bytes, durationSec, startSec: v.kind === 'voice' ? 0 : clampStartSec(v.startSec ?? 0, durationSec), fadeInSec: v.kind === 'voice' ? 0 : clampFadeIn(v.fadeInSec ?? DEFAULT_FADE_IN_SEC) };
}

export function parseAudioLibrary(raw: string | null): AudioLibrary {
  try {
    const parsed = JSON.parse(raw || 'null');
    if (!parsed || !Array.isArray(parsed.tracks)) return { tracks: [] };
    const ids = new Set<string>(), tracks: AudioTrack[] = [];
    for (const entry of parsed.tracks) {
      const track = readTrack(entry);
      if (!track || ids.has(track.id)) continue;
      ids.add(track.id); tracks.push(track);
      if (tracks.length >= MAX_AUDIO_TRACKS) break;
    }
    // the account default is music; a voice welcome is chosen per invitation
    const defaultTrackId = tracks.some(t => t.id === parsed.defaultTrackId && t.kind === 'music') ? parsed.defaultTrackId as string : undefined;
    return { tracks, defaultTrackId };
  } catch { return { tracks: [] }; }
}

const storage = () => { try { return typeof window === 'undefined' ? null : window.localStorage; } catch { return null; } };
export function audioLibrarySnapshot(): string | null {
  const s = storage();
  try { return s ? s.getItem(AUDIO_LIBRARY_KEY) ?? s.getItem(LEGACY_AUDIO_LIBRARY_KEY) : null; } catch { return null; }
}
export function readAudioLibrary(): AudioLibrary { return parseAudioLibrary(audioLibrarySnapshot()); }
export function subscribeAudioLibrary(fn: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const changed = (e: Event) => { const key = (e as StorageEvent).key; if (e.type !== 'storage' || key === AUDIO_LIBRARY_KEY || key === LEGACY_AUDIO_LIBRARY_KEY || key === null) fn(); };
  window.addEventListener('storage', changed); window.addEventListener(AUDIO_LIBRARY_EVENT, changed);
  return () => { window.removeEventListener('storage', changed); window.removeEventListener(AUDIO_LIBRARY_EVENT, changed); };
}
/** Writes metadata only (no bytes); throws AudioLibraryError('storage') and leaves the old library intact on failure. */
export function saveAudioLibrary(library: AudioLibrary): void {
  const clean = parseAudioLibrary(JSON.stringify(library));
  try { window.localStorage.setItem(AUDIO_LIBRARY_KEY, JSON.stringify(clean)); }
  catch { throw new AudioLibraryError('storage'); }
  window.dispatchEvent(new Event(AUDIO_LIBRARY_EVENT));
}
export function updateAudioTrack(id: string, patch: Partial<Pick<AudioTrack, 'name' | 'startSec' | 'fadeInSec' | 'durationSec'>>): void {
  const current = readAudioLibrary();
  saveAudioLibrary({ ...current, tracks: current.tracks.map(t => t.id === id ? { ...t, ...patch } : t) });
}

// ---------------------------------------------------------------- bytes (async, through the AudioStore)
export interface NewAudioTrack { blob: Blob; name: string; kind: AudioKind; durationSec: number; startSec?: number; fadeInSec?: number }
/** Validates, stores the bytes, then the metadata; a failed metadata write removes the orphaned bytes. */
export async function addAudioTrack(input: NewAudioTrack, store: AudioStore = audioStore()): Promise<AudioTrack> {
  const mime = baseMime(input.blob.type);
  const invalid = validateAudioFile({ type: mime, size: input.blob.size });
  if (invalid) throw new AudioLibraryError(invalid);
  if (input.kind === 'voice' && input.durationSec > MAX_VOICE_SECONDS + 1) throw new AudioLibraryError('voiceLong');
  if (readAudioLibrary().tracks.length >= MAX_AUDIO_TRACKS) throw new AudioLibraryError('full');
  let id: string;
  try { id = await store.put(input.blob.type === mime ? input.blob : new Blob([input.blob], { type: mime })); }
  catch { throw new AudioLibraryError('storage'); }
  const current = readAudioLibrary();
  const track = readTrack({ id, name: input.name.trim().slice(0, 80), kind: input.kind, mime, bytes: input.blob.size, durationSec: input.durationSec, startSec: input.startSec ?? 0, fadeInSec: input.fadeInSec ?? (input.kind === 'music' ? DEFAULT_FADE_IN_SEC : 0) });
  try {
    if (!track) throw new AudioLibraryError('decode');
    if (current.tracks.length >= MAX_AUDIO_TRACKS) throw new AudioLibraryError('full');
    saveAudioLibrary({ tracks: [...current.tracks, track], defaultTrackId: current.defaultTrackId || (track.kind === 'music' ? id : undefined) });
  } catch (e) { await store.delete(id).catch(() => {}); throw e instanceof AudioLibraryError ? e : new AudioLibraryError('storage'); }
  return track;
}
/** Removes the track from the library (invitations that used it fall back to built-in), then its bytes. */
export async function deleteAudioTrack(id: string, store: AudioStore = audioStore()): Promise<void> {
  const current = readAudioLibrary();
  saveAudioLibrary({ tracks: current.tracks.filter(t => t.id !== id), defaultTrackId: current.defaultTrackId === id ? undefined : current.defaultTrackId });
  await store.delete(id).catch(() => {});
}

function legacyEntries(): Array<{ id: string; mime: string; bytes: number; dataUrl: string }> {
  try {
    const parsed = JSON.parse(storage()?.getItem(LEGACY_AUDIO_LIBRARY_KEY) || 'null');
    return Array.isArray(parsed?.tracks) ? parsed.tracks.filter((t: { dataUrl?: unknown }) => readTrack(t) && typeof t.dataUrl === 'string') : [];
  } catch { return []; }
}
/** v1 data: URL → bytes, or null when the payload is not exactly the recorded size (corrupt/tampered storage). */
export function legacyBlob(entry: { mime: string; bytes: number; dataUrl: string }): Blob | null {
  const payload = entry.dataUrl.split(',')[1] || '';
  if (!payload || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(payload)) return null;
  try {
    const binary = atob(payload);
    if (binary.length !== entry.bytes) return null;
    return new Blob([Uint8Array.from(binary, c => c.charCodeAt(0))], { type: entry.mime });
  } catch { return null; }
}

/** The bytes for a track: the store first, then (until migrated) the v1 inline copy. Null = not on this device. */
export async function loadAudioTrackBlob(id: string, store: AudioStore = audioStore()): Promise<Blob | null> {
  const saved = await store.get(id).catch(() => null);
  if (saved) return saved;
  const legacy = legacyEntries().find(t => t.id === id);
  return legacy ? legacyBlob(legacy) : null;
}

let migrating: Promise<number> | null = null;
/**
 * Moves v1 inline tracks into the store under the same ids (so saved invitations keep pointing at them), writes
 * v2 metadata and removes the v1 key. On any store failure the v1 key stays and keeps playing; it retries next time.
 */
export function migrateLegacyAudioLibrary(store: AudioStore = audioStore()): Promise<number> {
  return migrating ??= (async () => {
    const s = storage();
    if (!s || s.getItem(LEGACY_AUDIO_LIBRARY_KEY) === null) return 0;
    const legacy = parseAudioLibrary(s.getItem(LEGACY_AUDIO_LIBRARY_KEY));
    const moved: AudioTrack[] = [];
    for (const entry of legacyEntries()) {
      const blob = legacyBlob(entry), track = legacy.tracks.find(t => t.id === entry.id);
      if (!blob || !track) continue;
      await store.put(blob, { id: entry.id });
      moved.push(track);
    }
    const existing = s.getItem(AUDIO_LIBRARY_KEY) === null ? { tracks: [] } : readAudioLibrary();
    saveAudioLibrary({ tracks: [...existing.tracks, ...moved.filter(t => !existing.tracks.some(e => e.id === t.id))], defaultTrackId: existing.defaultTrackId ?? legacy.defaultTrackId });
    s.removeItem(LEGACY_AUDIO_LIBRARY_KEY);
    window.dispatchEvent(new Event(AUDIO_LIBRARY_EVENT));
    return moved.length;
  })().catch(() => 0).finally(() => { migrating = null; });
}

// ---------------------------------------------------------------- the invitation's choice
/** Resolve the account default at render/share time; missing deleted uploads keep their reference (the engine falls back to built-in). */
export function resolveAudioSelection(selection?: AudioSelection, library = readAudioLibrary()): AudioSelection {
  const voice: Pick<AudioSelection, 'voiceId' | 'voiceName'> = {};
  if (selection?.voiceId) {
    const v = library.tracks.find(t => t.id === selection.voiceId && t.kind === 'voice');
    voice.voiceId = selection.voiceId; voice.voiceName = v?.name ?? selection.voiceName;
    if (!voice.voiceName) delete voice.voiceName;
  }
  if (selection?.mode === 'off') return { mode: 'off', ...voice };
  if (selection?.mode === 'builtin') return { mode: 'builtin', ...voice };
  const id = selection?.mode === 'library' ? selection.trackId : library.defaultTrackId;
  const track = library.tracks.find(t => t.id === id && t.kind === 'music');
  if (track) return { mode: 'library', trackId: track.id, trackName: track.name, ...voice };
  // Keep a shared upload reference so the receiving device can explain its absence (organizer only).
  if (selection?.mode === 'library' && selection.trackId) return { mode: 'library', trackId: selection.trackId, ...(selection.trackName ? { trackName: selection.trackName } : {}), ...voice };
  return { mode: 'builtin', ...voice };
}
