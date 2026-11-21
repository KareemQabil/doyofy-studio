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
