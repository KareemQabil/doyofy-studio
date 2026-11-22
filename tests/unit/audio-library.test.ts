import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import {
  AUDIO_LIBRARY_KEY, LEGACY_AUDIO_LIBRARY_KEY, MAX_AUDIO_BYTES, MAX_AUDIO_TRACKS, MIN_LOOP_SEC, PREVIEW_WINDOW_SEC, AudioLibraryError,
  addAudioTrack, baseMime, clampStartSec, computePeaks, deleteAudioTrack, formatClock, inferAudioMime, loadAudioTrackBlob, migrateLegacyAudioLibrary,
  parseAudioLibrary, playbackPlan, previewWindow, readAudioLibrary, resolveAudioSelection, validateAudioFile, type AudioTrack,
} from '../../src/domain/audio-library';
import { indexedDbAudioStore, memoryAudioStore, type AudioStore } from '../../src/domain/audio-store';

const track: AudioTrack = { id: 'a1', name: 'My music', kind: 'music', mime: 'audio/mpeg', bytes: 3, durationSec: 95, startSec: 12, fadeInSec: 1.5 };
const voice: AudioTrack = { id: 'v1', name: 'Welcome', kind: 'voice', mime: 'audio/webm', bytes: 3, durationSec: 20, startSec: 0, fadeInSec: 0 };

/** a browser-ish window with a localStorage the test controls (and can make fail) */
function fakeWindow() {
  const memory = new Map<string, string>();
  const state = { failWrites: false };
  const previous = (globalThis as unknown as { window?: unknown }).window;
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => { if (state.failWrites) throw new Error('QuotaExceededError'); memory.set(key, value); },
      removeItem: (key: string) => memory.delete(key),
    },
    addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; },
  };
  return { memory, state, restore: () => { (globalThis as unknown as { window?: unknown }).window = previous; } };
}

// ---------------------------------------------------------------- validation and limits
test('audio upload rejects empty, unsupported, and oversized files; 8 MB is allowed', () => {
  assert.equal(validateAudioFile({ type: 'text/html', size: 10 }), 'type');
  assert.equal(validateAudioFile({ type: 'audio/mpeg', size: 0 }), 'empty');
  assert.equal(validateAudioFile({ type: 'audio/mpeg', size: MAX_AUDIO_BYTES + 1 }), 'size');
  assert.equal(MAX_AUDIO_BYTES, 8 * 1024 * 1024);
  assert.equal(validateAudioFile({ type: 'audio/mpeg', size: MAX_AUDIO_BYTES }), undefined);
  assert.equal(validateAudioFile({ type: 'audio/webm;codecs=opus', size: 1000 }), undefined, 'MediaRecorder types carry codec parameters');
  assert.equal(baseMime('Audio/WebM; codecs=opus'), 'audio/webm');
  assert.equal(inferAudioMime({ name: 'song.M4A', type: '' }), 'audio/mp4');
  assert.equal(inferAudioMime({ name: 'song.mp3', type: 'application/octet-stream' }), 'audio/mpeg');
  assert.equal(inferAudioMime({ name: 'x.mp3', type: 'audio/wav' }), 'audio/wav');
});

test('audio library ignores invalid storage, duplicate IDs, voice over a minute, and caps at five tracks', () => {
  assert.deepEqual(parseAudioLibrary('{'), { tracks: [] });
  assert.deepEqual(parseAudioLibrary(JSON.stringify({ tracks: [{ ...track, kind: 'video' }] })).tracks, []);
  assert.deepEqual(parseAudioLibrary(JSON.stringify({ tracks: [{ ...voice, durationSec: 75 }] })).tracks, []);
  assert.deepEqual(parseAudioLibrary(JSON.stringify({ tracks: [track, track], defaultTrackId: 'missing' })), { tracks: [track], defaultTrackId: undefined });
  assert.equal(parseAudioLibrary(JSON.stringify({ tracks: [track, voice], defaultTrackId: voice.id })).defaultTrackId, undefined, 'a voice is never the account music default');
  const many = Array.from({ length: 7 }, (_, i) => ({ ...track, id: `t${i}` }));
  assert.equal(parseAudioLibrary(JSON.stringify({ tracks: many })).tracks.length, MAX_AUDIO_TRACKS);
  // a start beyond the end is pulled back so at least MIN_LOOP_SEC remains
  assert.equal(parseAudioLibrary(JSON.stringify({ tracks: [{ ...track, startSec: 500 }] })).tracks[0]!.startSec, 95 - MIN_LOOP_SEC);
});

test('a v1 inline track reads as music metadata until migrated', () => {
  const legacy = { id: 'old', name: 'Old', mime: 'audio/mpeg', bytes: 3, dataUrl: 'data:audio/mpeg;base64,YWJj' };
  assert.deepEqual(parseAudioLibrary(JSON.stringify({ tracks: [legacy], defaultTrackId: 'old' })), { tracks: [{ id: 'old', name: 'Old', kind: 'music', mime: 'audio/mpeg', bytes: 3, durationSec: 0, startSec: 0, fadeInSec: 1.5 }], defaultTrackId: 'old' });
  assert.deepEqual(parseAudioLibrary(JSON.stringify({ tracks: [{ ...legacy, dataUrl: 'https://host/private.mp3' }] })).tracks, []);
});

test('default resolves to the account track, built-in and off are explicit, voice rides along, missing uploads keep a reference', () => {
  const library = { tracks: [track, voice], defaultTrackId: track.id };
  assert.deepEqual(resolveAudioSelection(undefined, library), { mode: 'library', trackId: track.id, trackName: track.name });
  assert.deepEqual(resolveAudioSelection({ mode: 'builtin' }, library), { mode: 'builtin' });
  assert.deepEqual(resolveAudioSelection({ mode: 'off', voiceId: 'v1' }, library), { mode: 'off', voiceId: 'v1', voiceName: 'Welcome' });
  assert.deepEqual(resolveAudioSelection(undefined, { tracks: [] }), { mode: 'builtin' }, 'resolved built-in never re-resolves to another device\'s default');
  assert.deepEqual(resolveAudioSelection({ mode: 'library', trackId: 'deleted', trackName: 'Deleted' }, library), { mode: 'library', trackId: 'deleted', trackName: 'Deleted' });
  assert.deepEqual(resolveAudioSelection({ mode: 'library', trackId: voice.id }, { tracks: [voice] }), { mode: 'library', trackId: voice.id }, 'a voice is not playable as the music');
});

// ---------------------------------------------------------------- start point math
test('start point clamps to the track and keeps a loopable remainder', () => {
  assert.equal(clampStartSec(-4, 100), 0);
  assert.equal(clampStartSec(42.26, 100), 42.3);
  assert.equal(clampStartSec(99, 100), 100 - MIN_LOOP_SEC);
  assert.equal(clampStartSec(3, 6), 0, 'a track shorter than the loop minimum always starts at 0');
  assert.equal(clampStartSec(Number.NaN, 100), 0);
  assert.deepEqual(previewWindow(10, 100), { start: 10, end: 10 + PREVIEW_WINDOW_SEC });
  assert.deepEqual(previewWindow(80, 100), { start: 80, end: 100 }, 'the window is cut at the end of the song');
});

test('music plays from its start with a fade and loops back to it; voice plays once from 0', () => {
  assert.deepEqual(playbackPlan({ kind: 'music', startSec: 30, fadeInSec: 1.5 }, 180), { offset: 30, loop: true, loopStart: 30, loopEnd: 180, fadeInSec: 1.5 });
  assert.deepEqual(playbackPlan({ kind: 'music', startSec: 175, fadeInSec: 9 }, 180), { offset: 170, loop: true, loopStart: 170, loopEnd: 180, fadeInSec: 5 });
  assert.deepEqual(playbackPlan({ kind: 'voice', startSec: 5, fadeInSec: 1 }, 20), { offset: 0, loop: false, loopStart: 0, loopEnd: 20, fadeInSec: 0 });
});

test('waveform peaks are normalised per column and the clock reads m:ss', () => {
  const samples = Float32Array.from({ length: 1000 }, (_, i) => (i < 500 ? 0.1 : -0.5));
  const peaks = computePeaks([samples], 4);
  assert.equal(peaks.length, 4);
  assert.deepEqual(peaks, [0.2, 0.2, 1, 1]);
  assert.deepEqual(computePeaks([new Float32Array(0)], 3), [0, 0, 0]);
  assert.equal(formatClock(0), '0:00'); assert.equal(formatClock(65.9), '1:05'); assert.equal(formatClock(600), '10:00');
});

// ---------------------------------------------------------------- the storage layer (one contract, two stores)
const contract = (name: string, make: () => AudioStore) => test(`${name} keeps, returns and deletes bytes by id`, async () => {
  const store = make();
  const id = await store.put(new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/wav' }));
  assert.match(id, /^audio_/);
  const back = await store.get(id);
  assert.ok(back);
  assert.equal(back.type, 'audio/wav');
  assert.deepEqual([...new Uint8Array(await back.arrayBuffer())], [1, 2, 3]);
  assert.equal(await store.put(new Blob(['x'], { type: 'audio/ogg' }), { id: 'kept' }), 'kept', 'an existing reference can be kept');
  assert.equal(await store.get('missing'), null);
  await store.delete(id); await store.delete(id);
  assert.equal(await store.get(id), null);
  assert.equal(store.scope, 'device');
});
contract('IndexedDB audio store', () => indexedDbAudioStore(new IDBFactory()));
contract('in-memory audio store', () => memoryAudioStore());

test('IndexedDB store survives reopening the database (a reload)', async () => {
  const factory = new IDBFactory();
  const id = await indexedDbAudioStore(factory).put(new Blob(['song'], { type: 'audio/mpeg' }));
  assert.equal(await (await indexedDbAudioStore(factory).get(id))?.text(), 'song');
});

test('a missing IndexedDB reports unavailable instead of hanging', async () => {
  await assert.rejects(indexedDbAudioStore(undefined).get('x'), /unavailable/);
});

// ---------------------------------------------------------------- library writes over the store
test('adding tracks stores bytes then metadata, enforces five tracks and the one-minute voice', async () => {
  const w = fakeWindow(), store = memoryAudioStore();
  try {
    const first = await addAudioTrack({ blob: new Blob(['abc'], { type: 'audio/mpeg' }), name: '  Our song ', kind: 'music', durationSec: 95.04, startSec: 40 }, store);
    assert.deepEqual({ ...first, id: 'x' }, { id: 'x', name: 'Our song', kind: 'music', mime: 'audio/mpeg', bytes: 3, durationSec: 95, startSec: 40, fadeInSec: 1.5 });
    assert.equal(readAudioLibrary().defaultTrackId, first.id, 'the first music becomes the account default');
    assert.equal(await (await loadAudioTrackBlob(first.id, store))?.text(), 'abc');
    const rec = await addAudioTrack({ blob: new Blob(['v'], { type: 'audio/webm;codecs=opus' }), name: 'Hi', kind: 'voice', durationSec: 12 }, store);
    assert.equal(rec.mime, 'audio/webm'); assert.equal(rec.fadeInSec, 0);
    await assert.rejects(addAudioTrack({ blob: new Blob(['v'], { type: 'audio/webm' }), name: 'Long', kind: 'voice', durationSec: 75 }, store), (e: unknown) => e instanceof AudioLibraryError && e.code === 'voiceLong');
    await assert.rejects(addAudioTrack({ blob: new Blob(['<html>'], { type: 'text/html' }), name: 'x', kind: 'music', durationSec: 3 }, store), (e: unknown) => (e as AudioLibraryError).code === 'type');
    for (let i = 0; i < 3; i++) await addAudioTrack({ blob: new Blob(['m'], { type: 'audio/ogg' }), name: `m${i}`, kind: 'music', durationSec: 30 }, store);
    await assert.rejects(addAudioTrack({ blob: new Blob(['m'], { type: 'audio/ogg' }), name: 'sixth', kind: 'music', durationSec: 30 }, store), (e: unknown) => (e as AudioLibraryError).code === 'full');
    assert.equal(readAudioLibrary().tracks.length, MAX_AUDIO_TRACKS);
    await deleteAudioTrack(first.id, store);
    assert.equal(readAudioLibrary().defaultTrackId, undefined);
    assert.equal(await store.get(first.id), null, 'deleting a track removes its bytes');
  } finally { w.restore(); }
});

test('a failed metadata write removes the orphaned bytes and leaves the library intact', async () => {
  const w = fakeWindow(), store = memoryAudioStore();
  const puts: string[] = [];
  const spy: AudioStore = { ...store, scope: 'device', put: async (b, o) => { const id = await store.put(b, o); puts.push(id); return id; } };
  try {
    w.state.failWrites = true;
    await assert.rejects(addAudioTrack({ blob: new Blob(['abc'], { type: 'audio/mpeg' }), name: 'x', kind: 'music', durationSec: 20 }, spy), (e: unknown) => (e as AudioLibraryError).code === 'storage');
    assert.equal(puts.length, 1);
    assert.equal(await store.get(puts[0]!), null);
    assert.deepEqual(readAudioLibrary(), { tracks: [] });
  } finally { w.restore(); }
});

test('v1 inline tracks migrate into the store under the same id; corrupt entries are dropped', async () => {
  const w = fakeWindow(), store = indexedDbAudioStore(new IDBFactory());
  try {
    w.memory.set(LEGACY_AUDIO_LIBRARY_KEY, JSON.stringify({ defaultTrackId: 'old', tracks: [
      { id: 'old', name: 'Old song', mime: 'audio/mpeg', bytes: 3, dataUrl: 'data:audio/mpeg;base64,YWJj' },
      { id: 'bad', name: 'Bad', mime: 'audio/mpeg', bytes: 9, dataUrl: 'data:audio/mpeg;base64,YWJj' },
    ] }));
    assert.equal(await (await loadAudioTrackBlob('old', store))?.text(), 'abc', 'v1 bytes still play before migrating');
    assert.equal(await migrateLegacyAudioLibrary(store), 1);
    assert.equal(w.memory.has(LEGACY_AUDIO_LIBRARY_KEY), false);
    const lib = JSON.parse(w.memory.get(AUDIO_LIBRARY_KEY)!);
    assert.deepEqual(lib.tracks.map((t: AudioTrack) => [t.id, t.kind]), [['old', 'music']]);
    assert.equal(lib.defaultTrackId, 'old');
    assert.equal(await (await store.get('old'))?.text(), 'abc');
    assert.equal(await migrateLegacyAudioLibrary(store), 0, 'idempotent');
  } finally { w.restore(); }
});

test('a store failure during migration keeps the v1 library playing', async () => {
  const w = fakeWindow();
  const broken: AudioStore = { scope: 'device', put: async () => { throw new Error('quota'); }, get: async () => null, delete: async () => {} };
  try {
    const v1 = JSON.stringify({ tracks: [{ id: 'old', name: 'Old', mime: 'audio/mpeg', bytes: 3, dataUrl: 'data:audio/mpeg;base64,YWJj' }] });
    w.memory.set(LEGACY_AUDIO_LIBRARY_KEY, v1);
    assert.equal(await migrateLegacyAudioLibrary(broken), 0);
    assert.equal(w.memory.get(LEGACY_AUDIO_LIBRARY_KEY), v1);
    assert.equal(readAudioLibrary().tracks[0]?.id, 'old');
    assert.equal(await (await loadAudioTrackBlob('old', broken))?.text(), 'abc');
  } finally { w.restore(); }
});

test('an invitation soundtrack, voice and silence survive reconstructing the browser services', async () => {
  const w = fakeWindow();
  try {
    const { createServices } = await import('../../src/services');
    const first = createServices(); first.prototype.update({ latencyMs: 0 });
    const original = (await first.services.invitations.get('evt_wedding'))!;
    const chosen = { mode: 'library' as const, trackId: 'audio_saved', trackName: 'Saved soundtrack', voiceId: 'audio_voice', voiceName: 'Welcome' };
    await first.services.invitations.saveDraft('evt_wedding', { ...original.draft, audio: chosen });
    const second = createServices(); second.prototype.update({ latencyMs: 0 });
    assert.deepEqual((await second.services.invitations.get('evt_wedding'))?.draft.audio, chosen);
    await second.services.invitations.saveDraft('evt_wedding', { ...original.draft, audio: { mode: 'off' } });
    const third = createServices(); third.prototype.update({ latencyMs: 0 });
    assert.deepEqual((await third.services.invitations.get('evt_wedding'))?.draft.audio, { mode: 'off' });
  } finally { w.restore(); }
});
