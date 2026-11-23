/**
 * The account's sounds: upload music (≤ 8 MB, choose where it starts), record a voice welcome, preview, delete,
 * account default. Bytes go through the AudioStore (IndexedDB here); the panel says plainly that they play on this
 * device only until the server store is connected.
 */
import { useEffect, useRef, useState } from 'react';
import {
  AUDIO_MIME, AudioLibraryError, DEFAULT_FADE_IN_SEC, MAX_AUDIO_TRACKS, addAudioTrack, deleteAudioTrack, formatClock, inferAudioMime,
  loadAudioTrackBlob, readAudioLibrary, saveAudioLibrary, updateAudioTrack, validateAudioFile, type AudioIssue, type AudioTrack,
} from '../../domain/audio-library';
import type { CopyKey } from '../../domain/copy';
import { Banner, Button, Field, Input, LinkButton, Panel } from '../../ui';
import { useCopy } from '../../ui/copy';
import { useAudioLibrary, useTrackUrl } from './audio-state';
import { AudioTrim } from './AudioTrim';
import { VoiceRecorder } from './VoiceRecorder';
import { audioMedia, type AudioSummary } from './audio-media';
import { audioErrorKey } from './audio-errors';

const issueOf = (e: unknown): AudioIssue => e instanceof AudioLibraryError ? e.code : 'storage';
/** a draft start point: a fresh upload (file) or an existing track being re-trimmed (trackId) */
interface Draft { url: string; summary: AudioSummary; start: number; fadeIn: boolean; file?: File; trackId?: string }

function useDraftUrl(draft: Draft | null) { useEffect(() => () => { if (draft) URL.revokeObjectURL(draft.url); }, [draft?.url]); } // eslint-disable-line react-hooks/exhaustive-deps

function TrackSample({ track }: { track: AudioTrack }) {
  const { t } = useCopy();
  const url = useTrackUrl(track.id);
  if (url === null) return <p className="field-hint">{t('audioErrBytes')}</p>;
  return url ? <audio controls preload="metadata" src={url} aria-label={t('audioPreviewOf').replace('{name}', track.name)} /> : null;
}

/**
 * `focus`: arrived from the editor (/app/account?section=audio) — scroll here and put focus on «ارفع موسيقى».
 * `back`: the editor tab to return to; «ارجع للتصميم» sits at the top and again under the saved notice.
 */
export function AudioLibrary({ focus = false, back }: { focus?: boolean; back?: string | null }) {
  const { t } = useCopy();
  useEffect(() => {
    if (!focus) return;
    const panel = document.getElementById('audio');
    if (!panel) return;
    const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    panel.scrollIntoView({ block: 'start', behavior: still ? 'auto' : 'smooth' });
    (panel.querySelector<HTMLElement>('[data-audio-upload]:not(:disabled)') ?? panel.querySelector<HTMLElement>('h2'))?.focus({ preventScroll: true });
  }, [focus]);
  const library = useAudioLibrary();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<CopyKey | ''>(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(''), [name, setName] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  useDraftUrl(draft);
  const full = library.tracks.length >= MAX_AUDIO_TRACKS;
  const say = (message: string) => { setError(''); setNotice(message); };
  const fail = (e: unknown) => { setNotice(''); setError(audioErrorKey(issueOf(e))); };

  const pickFile = async (file?: File) => {
    if (input.current) input.current.value = '';
    if (!file) return;
    setError(''); setNotice('');
    const type = inferAudioMime(file), invalid = validateAudioFile({ type, size: file.size });
    if (invalid) { setError(audioErrorKey(invalid)); return; }
    if (readAudioLibrary().tracks.length >= MAX_AUDIO_TRACKS) { setError('audioErrFull'); return; }
    setBusy('read');
    try {
      const typed = file.type === type ? file : new File([file], file.name, { type });
      const summary = await audioMedia.decode(typed);
      setDraft({ url: URL.createObjectURL(typed), summary, start: 0, fadeIn: true, file: typed });
      if (!name.trim()) setName(file.name.replace(/\.[^.]+$/, '').slice(0, 80));
    } catch (e) { fail(e); }
    finally { setBusy(''); }
  };
  const retrim = async (track: AudioTrack) => {
    setError(''); setNotice(''); setBusy(`trim:${track.id}`);
    try {
      const blob = await loadAudioTrackBlob(track.id);
      if (!blob) { setError('audioErrBytes'); return; }
      const summary = await audioMedia.decode(blob);
      setDraft({ url: URL.createObjectURL(blob), summary, start: track.startSec, fadeIn: track.fadeInSec > 0, trackId: track.id });
    } catch (e) { fail(e); }
    finally { setBusy(''); }
  };
  const saveDraft = async () => {
    if (!draft) return;
    setBusy('save');
    try {
      const fadeInSec = draft.fadeIn ? DEFAULT_FADE_IN_SEC : 0;
      if (draft.trackId) { updateAudioTrack(draft.trackId, { startSec: draft.start, fadeInSec, durationSec: draft.summary.duration }); say(t('audioStartSaved')); }
      else if (draft.file) {
        await addAudioTrack({ blob: draft.file, name: name.trim() || draft.file.name.replace(/\.[^.]+$/, ''), kind: 'music', durationSec: draft.summary.duration, startSec: draft.start, fadeInSec });
        setName(''); say(t('audioSaved'));
      }
      setDraft(null);
    } catch (e) { fail(e); }
    finally { setBusy(''); }
  };
  const change = (fn: () => void | Promise<void>, message: string) => { void (async () => { try { await fn(); say(message); } catch (e) { fail(e); } })(); };

  const trim = (d: Draft) => <div className="audio-draft stack gap-3">
    <h3 className="audio-sub-title">{t('audioTrimTitle')}</h3>
    <AudioTrim src={d.url} summary={d.summary} start={d.start} fadeIn={d.fadeIn} onStart={start => setDraft({ ...d, start })} onFadeIn={fadeIn => setDraft({ ...d, fadeIn })} />
    <div className="row wrap gap-2">
      <Button variant="primary" loading={busy === 'save'} onClick={() => void saveDraft()}>{d.trackId ? t('audioSaveStart') : t('audioSaveTrack')}</Button>
      <Button variant="ghost" disabled={busy === 'save'} onClick={() => setDraft(null)}>{t('cancel')}</Button>
    </div>
  </div>;

  const backLink = back ? <LinkButton to={back} variant="secondary" size="sm" icon="back">{t('audioBackToDesign')}</LinkButton> : null;
  return <Panel title={t('audioTitle')} id="audio" className="audio-library-panel">
    {backLink && <div className="audio-back row wrap gap-3">{backLink}<span className="field-hint">{t('audioBackHint')}</span></div>}
    <p className="muted">{t('audioIntro')}</p>
    <p className="field-hint">{t('audioLimits')}</p>
    <p className="audio-device-note" data-audio-device-note>{t('audioDeviceOnly')}</p>
    <div className="audio-library-upload stack gap-3">
      <Field label={t('audioTrackName')} optional><Input value={name} maxLength={80} placeholder={t('audioTrackNamePh')} onChange={e => setName(e.target.value)} /></Field>
      <input ref={input} className="sr-only" type="file" tabIndex={-1} aria-label={t('audioUploadLabel')} accept={[...AUDIO_MIME, '.mp3', '.m4a', '.wav', '.ogg', '.webm', '.aac'].join(',')} onChange={e => void pickFile(e.target.files?.[0])} />
      {!(draft && !draft.trackId) && <div><Button data-audio-upload variant="secondary" icon="upload" loading={busy === 'read'} disabled={full || !!busy} onClick={() => input.current?.click()}>{t('audioUpload')}</Button></div>}
      {busy === 'read' && <p role="status" className="field-hint">{t('audioReading')}</p>}
      {full && <p className="field-hint">{t('audioErrFull')}</p>}
    </div>
    {draft && !draft.trackId && trim(draft)}
    {error && <Banner tone="danger" compact>{t(error)}</Banner>}
    {notice && <p role="status" className="field-hint">{notice}</p>}
    {notice && backLink && <div>{backLink}</div>}
    {library.tracks.length > 0 && <ul className="audio-library-list">{library.tracks.map(track => <li key={track.id} data-track-kind={track.kind}>
      <div className="audio-track-head">
        <strong>{track.name}</strong>
        <span className="audio-track-kind">{track.kind === 'voice' ? t('audioKindVoice') : t('audioKindMusic')}</span>
        {track.durationSec > 0 && <span className="audio-length num">{formatClock(track.durationSec)}</span>}
        {library.defaultTrackId === track.id && <span className="field-hint">{t('audioIsDefault')}</span>}
        {track.kind === 'music' && track.startSec > 0 && <span className="field-hint">{t('audioStartAt').replace('{time}', formatClock(track.startSec))}</span>}
      </div>
      <TrackSample track={track} />
      {draft?.trackId === track.id ? trim(draft) : <div className="row wrap gap-2">
        {track.kind === 'music' && <Button size="sm" variant="ghost" loading={busy === `trim:${track.id}`} disabled={!!busy || !!draft} onClick={() => void retrim(track)}>{t('audioEditStart')}</Button>}
        {track.kind === 'music' && <Button size="sm" variant="ghost" disabled={library.defaultTrackId === track.id} onClick={() => change(() => saveAudioLibrary({ ...readAudioLibrary(), defaultTrackId: track.id }), t('audioDefaultSaved'))}>{t('audioMakeDefault')}</Button>}
        <Button size="sm" variant="ghost" disabled={!!draft} onClick={() => change(() => deleteAudioTrack(track.id), t('audioDeleted'))}>{t('audioDelete')}</Button>
      </div>}
    </li>)}</ul>}
    {library.defaultTrackId && <Button size="sm" variant="ghost" onClick={() => change(() => saveAudioLibrary({ ...readAudioLibrary(), defaultTrackId: undefined }), t('audioBuiltinDefaultSaved'))}>{t('audioUseBuiltinDefault')}</Button>}
    <VoiceRecorder disabled={full} onSaved={say} />
  </Panel>;
}
