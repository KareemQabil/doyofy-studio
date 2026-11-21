/** Account audio is deliberately local in this prototype. Links carry an id, never file bytes. */
export const AUDIO_LIBRARY_KEY = 'doyofy:audio-library:v1';
export const AUDIO_LIBRARY_EVENT = 'doyofy:audio-library-change';
export const MAX_AUDIO_BYTES = 300 * 1024;
export const MAX_AUDIO_TRACKS = 3;
export const AUDIO_MIME = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/webm'] as const;

export interface AudioTrack { id: string; name: string; mime: string; bytes: number; dataUrl: string }
export interface AudioLibrary { tracks: AudioTrack[]; defaultTrackId?: string }
export interface AudioSelection { mode: 'default' | 'library' | 'off'; trackId?: string; trackName?: string }

export function validateAudioFile(file: { type: string; size: number }): string | undefined {
  if (!(AUDIO_MIME as readonly string[]).includes(file.type)) return 'اختر ملف MP3 أو WAV أو OGG أو M4A أو WebM صوتيًا.';
  if (!Number.isFinite(file.size) || file.size <= 0) return 'الملف فارغ. اختر ملفًا صوتيًا آخر.';
  if (file.size > MAX_AUDIO_BYTES) return 'حجم المقطع أكبر من 300 كيلوبايت. استخدم مقطعًا قصيرًا أو مضغوطًا.';
}

export function parseAudioLibrary(raw: string | null): AudioLibrary {
  try {
    const parsed = JSON.parse(raw || 'null');
    if (!parsed || !Array.isArray(parsed.tracks)) return { tracks: [] };
    const ids = new Set<string>();
    const tracks: AudioTrack[] = parsed.tracks.filter((t: unknown): t is AudioTrack => {
      if (!t || typeof t !== 'object') return false;
      const v = t as AudioTrack;
      if (typeof v.id !== 'string' || !v.id || v.id.length > 100 || ids.has(v.id) || typeof v.name !== 'string' || v.name.length > 80 || validateAudioFile({ type: v.mime, size: v.bytes })) return false;
      if (typeof v.dataUrl !== 'string' || v.dataUrl.length > MAX_AUDIO_BYTES * 1.4 || !v.dataUrl.startsWith(`data:${v.mime};base64,`)) return false;
      const payload = v.dataUrl.split(',')[1] || '';
      if (!payload || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(payload)) return false;
      const decodedBytes = payload.length * 3 / 4 - (payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0);
      if (decodedBytes !== v.bytes) return false;
      ids.add(v.id); return true;
    }).slice(0, MAX_AUDIO_TRACKS);
    const defaultTrackId = tracks.some(t => t.id === parsed.defaultTrackId) ? parsed.defaultTrackId as string : undefined;
    return { tracks, defaultTrackId };
  } catch { return { tracks: [] }; }
}

export function audioLibrarySnapshot(): string | null {
  try { return typeof window === 'undefined' ? null : window.localStorage.getItem(AUDIO_LIBRARY_KEY); } catch { return null; }
}
export function readAudioLibrary(): AudioLibrary { return parseAudioLibrary(audioLibrarySnapshot()); }
export function subscribeAudioLibrary(fn: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const changed = (e: Event) => { if (e.type !== 'storage' || (e as StorageEvent).key === AUDIO_LIBRARY_KEY || (e as StorageEvent).key === null) fn(); };
  window.addEventListener('storage', changed); window.addEventListener(AUDIO_LIBRARY_EVENT, changed);
  return () => { window.removeEventListener('storage', changed); window.removeEventListener(AUDIO_LIBRARY_EVENT, changed); };
}
export function saveAudioLibrary(library: AudioLibrary): void {
  const clean = parseAudioLibrary(JSON.stringify(library));
  try { window.localStorage.setItem(AUDIO_LIBRARY_KEY, JSON.stringify(clean)); }
  catch { throw new Error('تعذّر حفظ الصوت على هذا الجهاز. احذف مقطعًا قديمًا أو أفرغ بعض مساحة المتصفح.'); }
  window.dispatchEvent(new Event(AUDIO_LIBRARY_EVENT));
}

/** Resolve the account default at render/share time; missing deleted uploads safely use built-in sound. */
export function resolveAudioSelection(selection?: AudioSelection, library = readAudioLibrary()): AudioSelection {
  if (selection?.mode === 'off') return { mode: 'off' };
  const id = selection?.mode === 'library' ? selection.trackId : library.defaultTrackId;
  const track = library.tracks.find(t => t.id === id);
  if (track) return { mode: 'library', trackId: track.id, trackName: track.name };
  // Keep a shared upload reference so the receiving device can explain its absence.
  if (selection?.mode === 'library' && selection.trackId) return { ...selection };
  return { mode: 'default' };
}

/** Blob media avoids requiring media-src data: in the deployed CSP. Callers revoke on cleanup. */
export function audioTrackBlob(track: AudioTrack): Blob {
  const binary = atob(track.dataUrl.split(',')[1]!);
  return new Blob([Uint8Array.from(binary, c => c.charCodeAt(0))], { type: track.mime });
}
