import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_AUDIO_BYTES, parseAudioLibrary, resolveAudioSelection, validateAudioFile, type AudioTrack } from '../../src/domain/audio-library';

const track: AudioTrack = { id: 'a1', name: 'My music', mime: 'audio/mpeg', bytes: 3, dataUrl: 'data:audio/mpeg;base64,YWJj' };

test('audio upload rejects empty, unsupported, and oversized files', () => {
  assert.ok(validateAudioFile({ type: 'text/html', size: 10 }));
  assert.ok(validateAudioFile({ type: 'audio/mpeg', size: 0 }));
  assert.ok(validateAudioFile({ type: 'audio/mpeg', size: MAX_AUDIO_BYTES + 1 }));
  assert.equal(validateAudioFile({ type: 'audio/mpeg', size: MAX_AUDIO_BYTES }), undefined);
});

test('audio library ignores invalid storage, duplicate IDs and non-audio data', () => {
  assert.deepEqual(parseAudioLibrary('{'), { tracks: [] });
  assert.deepEqual(parseAudioLibrary(JSON.stringify({ tracks: [{ ...track, dataUrl: 'https://host/private.mp3' }] })).tracks, []);
  assert.deepEqual(parseAudioLibrary(JSON.stringify({ tracks: [{ ...track, dataUrl: 'data:audio/mpeg;base64,a===' }] })).tracks, []);
  assert.deepEqual(parseAudioLibrary(JSON.stringify({ tracks: [track, track], defaultTrackId: 'missing' })), { tracks: [track], defaultTrackId: undefined });
});

test('default resolves to account track, off overrides default, missing uploads keep a truthful reference', () => {
  const library = { tracks: [track], defaultTrackId: track.id };
  assert.deepEqual(resolveAudioSelection(undefined, library), { mode: 'library', trackId: track.id, trackName: track.name });
  assert.deepEqual(resolveAudioSelection({ mode: 'off' }, library), { mode: 'off' });
  assert.deepEqual(resolveAudioSelection(undefined, { tracks: [] }), { mode: 'default' });
  assert.deepEqual(resolveAudioSelection({ mode: 'library', trackId: 'deleted', trackName: 'Deleted' }, library), { mode: 'library', trackId: 'deleted', trackName: 'Deleted' });
});

test('an invitation soundtrack and silence survive reconstructing the browser services', async () => {
  const memory = new Map<string, string>();
  const previous = (globalThis as unknown as { window?: unknown }).window;
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value), removeItem: (key: string) => memory.delete(key) },
    addEventListener() {}, dispatchEvent() {},
  };
  try {
    const { createServices } = await import('../../src/services');
    const first = createServices(); first.prototype.update({ latencyMs: 0 });
    const original = (await first.services.invitations.get('evt_wedding'))!;
    const chosen = { mode: 'library' as const, trackId: 'audio_saved', trackName: 'Saved soundtrack' };
    await first.services.invitations.saveDraft('evt_wedding', { ...original.draft, audio: chosen });
    const second = createServices(); second.prototype.update({ latencyMs: 0 });
    assert.deepEqual((await second.services.invitations.get('evt_wedding'))?.draft.audio, chosen);
    await second.services.invitations.saveDraft('evt_wedding', { ...original.draft, audio: { mode: 'off' } });
    const third = createServices(); third.prototype.update({ latencyMs: 0 });
    assert.deepEqual((await third.services.invitations.get('evt_wedding'))?.draft.audio, { mode: 'off' });
  } finally { (globalThis as unknown as { window?: unknown }).window = previous; }
});
