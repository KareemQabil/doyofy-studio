import assert from 'node:assert/strict';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { IDBFactory } from 'fake-indexeddb';
import { AudioLibrary } from '../../src/features/account/AudioLibrary';
import { audioMedia } from '../../src/features/account/audio-media';
import { SoundSection } from '../../src/features/editor/sections';
import { RouterProvider } from '../../src/app/router';
import { AUDIO_LIBRARY_KEY, MAX_AUDIO_BYTES, readAudioLibrary } from '../../src/domain/audio-library';
import { indexedDbAudioStore, setAudioStore, audioStore } from '../../src/domain/audio-store';
import { copyFor } from '../../src/domain/copy';
import type { InvitationDesignContent } from '../../src/domain/types';

const k = copyFor('ar');
const original = { ...audioMedia };

export async function run() {
  let root: Root;
  const render = async (node: React.ReactNode) => { await act(async () => { root.render(<RouterProvider mode="history">{node}</RouterProvider>); }); };
  const settle = async (ms = 20) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
  const until = async (what: string, ok: () => boolean) => { for (let i = 0; i < 100 && !ok(); i++) await settle(10); assert.ok(ok(), what); };
  const button = (label: string) => [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === label) as HTMLButtonElement | undefined;
  const click = async (el: Element | undefined | null) => { assert.ok(el, 'element to click'); await act(async () => { (el as HTMLElement).click(); }); };
  const choose = async (input: HTMLInputElement, file: File) => {
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    await act(async () => { input.dispatchEvent(new Event('change', { bubbles: true })); });
  };
  const setRange = async (input: HTMLInputElement, value: string) => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!.call(input, value);
    await act(async () => { input.dispatchEvent(new Event('input', { bubbles: true })); });
  };
  const text = () => document.body.textContent ?? '';
  const check = async (name: string, fn: () => Promise<void>) => {
    root = createRoot(document.querySelector('#root')!);
    try { await fn(); console.log(`✔ audio DOM: ${name}`); }
    finally { await settle(40); await act(async () => root.unmount()); Object.assign(audioMedia, original); }
  };
  setAudioStore(indexedDbAudioStore(new IDBFactory()));
  localStorage.clear();

  await check('upload → choose the start on a left-to-right waveform → save, with the device-only line', async () => {
    audioMedia.decode = async () => ({ duration: 125, peaks: Array.from({ length: 480 }, (_, i) => (i % 7) / 7) });
    await render(<AudioLibrary />);
    assert.ok(text().includes(k.audioDeviceOnly), 'the account says uploads play on this device only');
    const input = document.querySelector<HTMLInputElement>('input[type=file]')!;
    assert.match(input.accept, /audio\/mpeg/);
    // oversized and unsupported files never reach the store
    await choose(input, new File([new Uint8Array(MAX_AUDIO_BYTES + 1)], 'huge.mp3', { type: 'audio/mpeg' }));
    assert.ok(text().includes(k.audioErrSize));
    await choose(input, new File(['<html>'], 'page.html', { type: 'text/html' }));
    assert.ok(text().includes(k.audioErrType));
    assert.equal(readAudioLibrary().tracks.length, 0);

    await choose(input, new File([new Uint8Array(2048)], 'Our song.mp3', { type: 'audio/mpeg' }));
    await until('trim view opens', () => !!document.querySelector('.audio-wave-range'));
    const wave = document.querySelector('.audio-wave')!;
    assert.equal(wave.getAttribute('dir'), 'ltr', 'time flows left → right like every audio editor');
    assert.ok(text().includes(k.audioTrimHint));
    const range = document.querySelector<HTMLInputElement>('.audio-wave-range')!;
    assert.equal(range.getAttribute('aria-label'), k.audioStartLabel);
    await setRange(range, '42');
    assert.ok(text().includes(k.audioStartAt.replace('{time}', '0:42')));
    assert.equal(range.getAttribute('aria-valuetext'), '0:42');
    await setRange(range, '124');   // too close to the end: pulled back so 10 s still loop
    assert.equal(range.value, '115');
    await setRange(range, '42');
    assert.equal(document.querySelector<HTMLInputElement>(`input[placeholder="${k.audioTrackNamePh}"]`)?.value, 'Our song', 'the file name fills an empty track name');
    await click(button(k.audioSaveTrack));
    await until('saved', () => readAudioLibrary().tracks.length === 1);
    const [saved] = readAudioLibrary().tracks;
    assert.deepEqual({ name: saved!.name, kind: saved!.kind, start: saved!.startSec, duration: saved!.durationSec, fade: saved!.fadeInSec }, { name: 'Our song', kind: 'music', start: 42, duration: 125, fade: 1.5 });
    assert.ok((await audioStore().get(saved!.id))?.size === 2048, 'bytes are in IndexedDB, not localStorage');
    assert.ok(localStorage.getItem(AUDIO_LIBRARY_KEY)!.length < 1000, 'localStorage holds metadata only');
    await until('listed', () => !!document.querySelector('.audio-library-list li'));
    assert.ok(text().includes(k.audioSaved));
  });

  await check('the editor offers none / built-in / my music and keeps the voice choice alongside', async () => {
    const [track] = readAudioLibrary().tracks;
    const content = { audio: { mode: 'builtin' }, experience: { dimension: '2d', motion: 'animated' } } as unknown as InvitationDesignContent;
    let last: Partial<InvitationDesignContent> = {};
    await render(<SoundSection content={content} update={p => { last = p; }} />);
    const group = document.querySelector(`[role=radiogroup][aria-label="${k.audioChoiceLabel}"]`)!;
    const radios = [...group.querySelectorAll('[role=radio]')];
    assert.deepEqual(radios.map(r => r.querySelector('.ed-option-title')?.textContent), [k.audioChoiceNone, k.audioChoiceBuiltin, k.audioChoiceMine]);
    assert.equal(radios[1]!.getAttribute('aria-checked'), 'true');
    assert.ok(!text().includes(k.audioDeviceOnly), 'no device note while the built-in sound is chosen');
    await click(radios[2]);
    assert.deepEqual(last.audio, { mode: 'library', trackId: track!.id, trackName: track!.name });
    const voiceSwitch = [...document.querySelectorAll('[role=switch]')].find(s => s.getAttribute('aria-labelledby') && document.getElementById(s.getAttribute('aria-labelledby')!)?.textContent === k.audioVoiceToggle) as HTMLButtonElement;
    assert.ok(voiceSwitch.disabled, 'no recording yet: the voice toggle waits, with a link to record one');
    assert.ok(text().includes(k.audioRecordInAccount));
    // a chosen upload shows the honest device-only line
    await render(<SoundSection content={{ ...content, audio: last.audio } as InvitationDesignContent} update={p => { last = p; }} />);
    assert.ok(text().includes(k.audioDeviceOnly));
    assert.equal(document.querySelector<HTMLSelectElement>('select[data-audio-track]')?.value, track!.id);
  });

  await check('recording falls back clearly without MediaRecorder or with a refused microphone', async () => {
    audioMedia.canRecord = () => false;
    await render(<AudioLibrary />);
    assert.ok(text().includes(k.audioErrNoRecorder));
    assert.equal(button(k.audioRecord), undefined, 'no dead record button');
    await act(async () => root.unmount()); root = createRoot(document.querySelector('#root')!);
    audioMedia.canRecord = () => true;
    audioMedia.microphone = async () => { throw Object.assign(new Error('NotAllowedError'), { problem: 'denied' }); };
    await render(<AudioLibrary />);
    await click(button(k.audioRecord));
    await until('denied message', () => text().includes(k.audioErrMicDenied));
    assert.ok(button(k.audioRecord), 'the organizer can try again');
  });

  await check('record → timer and level → stop → listen → save as a voice track the editor can switch on', async () => {
    let stopped = 0;
    audioMedia.canRecord = () => true;
    audioMedia.microphone = async () => ({ getTracks: () => [{ stop: () => { stopped++; } }] }) as unknown as MediaStream;
    audioMedia.level = () => ({ read: () => 0.5, close() {} });
    audioMedia.recorder = () => {
      const r = { state: 'inactive', mimeType: 'audio/webm;codecs=opus', ondataavailable: null as null | ((e: { data: Blob }) => void), onstop: null as null | (() => void),
        start() { r.state = 'recording'; }, stop() { r.state = 'inactive'; r.ondataavailable?.({ data: new Blob([new Uint8Array(900)], { type: 'audio/webm;codecs=opus' }) }); r.onstop?.(); } };
      return r as unknown as MediaRecorder;
    };
    await render(<AudioLibrary />);
    await click(button(k.audioRecord));
    await until('recording', () => !!document.querySelector('[data-recording]'));
    assert.ok(document.querySelector('[role=timer]')?.textContent?.includes('من 1:00'));
    await click(button(k.audioRecordStop));
    await until('review', () => !!button(k.audioSaveVoice));
    assert.equal(stopped, 1, 'the microphone is released as soon as recording stops');
    assert.ok(document.querySelector('.audio-voice audio'), 'listen back before saving');
    assert.ok(button(k.audioRerecord));
    await click(button(k.audioSaveVoice));
    await until('voice saved', () => readAudioLibrary().tracks.some(t => t.kind === 'voice'));
    const voice = readAudioLibrary().tracks.find(t => t.kind === 'voice')!;
    assert.equal(voice.mime, 'audio/webm'); assert.equal(voice.name, k.audioVoiceDefaultName);
    assert.equal(readAudioLibrary().defaultTrackId, readAudioLibrary().tracks.find(t => t.kind === 'music')!.id, 'a voice never replaces the music default');

    let last: Partial<InvitationDesignContent> = {};
    const content = { audio: { mode: 'off' }, experience: { dimension: '2d', motion: 'animated' } } as unknown as InvitationDesignContent;
    await render(<SoundSection content={content} update={p => { last = p; }} />);
    const voiceSwitch = [...document.querySelectorAll('[role=switch]')].find(s => document.getElementById(s.getAttribute('aria-labelledby') ?? '')?.textContent === k.audioVoiceToggle) as HTMLButtonElement;
    assert.equal(voiceSwitch.disabled, false);
    await click(voiceSwitch);
    assert.deepEqual(last.audio, { mode: 'off', voiceId: voice.id, voiceName: voice.name }, 'a voice welcome works even with no music');
  });
}
