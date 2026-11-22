/**
 * Record a voice welcome from the phone: microphone permission → live level and timer (max 60 s) → listen back →
 * re-record or save as a 'voice' track. Browsers without MediaRecorder, or a refused microphone, get a clear
 * Arabic explanation instead of a dead button.
 */
import { useEffect, useRef, useState } from 'react';
import { AudioLibraryError, MAX_VOICE_SECONDS, addAudioTrack, baseMime, formatClock } from '../../domain/audio-library';
import type { CopyKey } from '../../domain/copy';
import { Banner, Button, Field, Input } from '../../ui';
import { useCopy } from '../../ui/copy';
import { audioMedia, type RecorderProblem } from './audio-media';
import { audioErrorKey } from './audio-errors';

const PROBLEM: Record<RecorderProblem, CopyKey> = { unsupported: 'audioErrNoRecorder', denied: 'audioErrMicDenied', nomic: 'audioErrNoMic', failed: 'audioErrRecord' };
type Take = { blob: Blob; url: string; seconds: number };

export function VoiceRecorder({ disabled, onSaved }: { disabled?: boolean; onSaved: (message: string) => void }) {
  const { t } = useCopy();
  const supported = audioMedia.canRecord();
  const [phase, setPhase] = useState<'idle' | 'asking' | 'recording' | 'review'>('idle');
  const [problem, setProblem] = useState<CopyKey | ''>(supported ? '' : PROBLEM.unsupported);
  const [elapsed, setElapsed] = useState(0), [take, setTake] = useState<Take | null>(null), [name, setName] = useState(''), [saving, setSaving] = useState(false);
  const live = useRef<{ stream?: MediaStream; recorder?: MediaRecorder; level?: ReturnType<typeof audioMedia.level>; timer?: ReturnType<typeof setInterval>; raf?: number; t0: number }>({ t0: 0 });
  const meter = useRef<HTMLSpanElement>(null);

  const release = () => {
    const l = live.current;
    clearInterval(l.timer); cancelAnimationFrame(l.raf ?? 0);
    l.level?.close(); l.stream?.getTracks().forEach(track => track.stop());
    live.current = { t0: 0 };
  };
  useEffect(() => () => { const r = live.current.recorder; if (r && r.state !== 'inactive') { r.ondataavailable = null; r.onstop = null; r.stop(); } release(); }, []);
  useEffect(() => () => { if (take) URL.revokeObjectURL(take.url); }, [take]);

  const stop = () => { const r = live.current.recorder; if (r && r.state !== 'inactive') r.stop(); };
  const start = async () => {
    setProblem(''); setTake(null); setElapsed(0); setPhase('asking');
    let stream: MediaStream;
    try { stream = await audioMedia.microphone(); }
    catch (e) { setProblem(PROBLEM[(e as { problem?: RecorderProblem }).problem ?? 'failed']); setPhase('idle'); return; }
    try {
      const recorder = audioMedia.recorder(stream), chunks: Blob[] = [];
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = () => {
        const seconds = Math.min(MAX_VOICE_SECONDS, (performance.now() - live.current.t0) / 1000);
        // a recorder may label an audio-only take video/webm: it is still audio
        const type = baseMime(recorder.mimeType || chunks[0]?.type || 'audio/webm').replace(/^video\//, 'audio/');
        release();
        const blob = new Blob(chunks, { type });
        if (!blob.size) { setProblem(PROBLEM.failed); setPhase('idle'); return; }
        setTake({ blob, url: URL.createObjectURL(blob), seconds }); setPhase('review');
      };
      live.current = { stream, recorder, level: audioMedia.level(stream), t0: performance.now() };
      recorder.start(250);
      setPhase('recording');
      live.current.timer = setInterval(() => {
        const s = (performance.now() - live.current.t0) / 1000;
        setElapsed(s);
        if (s >= MAX_VOICE_SECONDS) stop();
      }, 200);
      const draw = () => {
        const level = live.current.level?.read() ?? 0;
        if (meter.current) meter.current.style.transform = `scaleX(${Math.max(0.03, level)})`;
        live.current.raf = requestAnimationFrame(draw);
      };
      draw();
    } catch { release(); setProblem(PROBLEM.failed); setPhase('idle'); }
  };
  const save = async () => {
    if (!take) return;
    setSaving(true); setProblem('');
    try {
      await addAudioTrack({ blob: take.blob, name: name.trim() || t('audioVoiceDefaultName'), kind: 'voice', durationSec: take.seconds });
      setTake(null); setName(''); setPhase('idle'); onSaved(t('audioVoiceSaved'));
    } catch (e) { setProblem(audioErrorKey(e instanceof AudioLibraryError ? e.code : 'storage')); }
    finally { setSaving(false); }
  };

  return <section className="audio-voice stack gap-3" aria-labelledby="audio-voice-title">
    <h3 id="audio-voice-title" className="audio-sub-title">{t('audioVoiceTitle')}</h3>
    <p className="field-hint">{t('audioVoiceHint')}</p>
    {problem && <Banner tone={problem === 'audioErrNoRecorder' ? 'info' : 'danger'} compact>{t(problem)}</Banner>}
    {supported && phase !== 'recording' && phase !== 'review' && <>
      <p className="field-hint">{t('audioMicAsk')}</p>
      <div><Button variant="secondary" loading={phase === 'asking'} disabled={disabled} onClick={() => void start()}>{t('audioRecord')}</Button></div>
    </>}
    {phase === 'recording' && <div className="audio-rec" data-recording>
      <span className="audio-rec-dot" aria-hidden="true" />
      <span className="audio-rec-label">{t('audioRecording')}</span>
      <span className="audio-rec-time" role="timer">{t('audioRecordOf').replace('{time}', formatClock(elapsed))}</span>
      <span className="audio-rec-meter" aria-hidden="true" title={t('audioRecordLevel')}><span ref={meter} /></span>
      <Button variant="primary" onClick={stop}>{t('audioRecordStop')}</Button>
    </div>}
    {phase === 'review' && take && <div className="stack gap-3">
      <audio controls src={take.url} aria-label={t('audioPreviewOf').replace('{name}', t('audioVoiceDefaultName'))} />
      <Field label={t('audioTrackName')} optional><Input value={name} maxLength={80} placeholder={t('audioVoiceDefaultName')} onChange={e => setName(e.target.value)} /></Field>
      <div className="row wrap gap-2">
        <Button variant="primary" loading={saving} onClick={() => void save()}>{t('audioSaveVoice')}</Button>
        <Button variant="ghost" disabled={saving} onClick={() => void start()}>{t('audioRerecord')}</Button>
      </div>
    </div>}
  </section>;
}
