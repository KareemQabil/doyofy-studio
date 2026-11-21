import { useEffect, useRef, useState } from 'react';
import { AUDIO_MIME, MAX_AUDIO_TRACKS, audioTrackBlob, readAudioLibrary, saveAudioLibrary, validateAudioFile, type AudioTrack } from '../../domain/audio-library';
import { Banner, Button, Field, Input, Panel } from '../../ui';
import { useAudioLibrary } from './audio-state';

function AudioSample({ track }: { track: AudioTrack }) {
  const [url, setUrl] = useState('');
  useEffect(() => { const src = URL.createObjectURL(audioTrackBlob(track)); setUrl(src); return () => URL.revokeObjectURL(src); }, [track.id, track.dataUrl]);
  return url ? <audio controls preload="metadata" src={url} aria-label={`معاينة ${track.name}`} /> : null;
}

async function readPlayableAudio(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      const audio = new Audio();
      const finish = (error?: Error) => { clearTimeout(timer); audio.onloadedmetadata = null; audio.onerror = null; audio.removeAttribute('src'); audio.load(); error ? reject(error) : resolve(); };
      const timer = setTimeout(() => finish(new Error('تعذّر قراءة المقطع. جرّب ملف MP3 آخر.')), 8000);
      audio.onloadedmetadata = () => { audio.onloadedmetadata = null; audio.onerror = null; finish(); };
      audio.onerror = () => { audio.onloadedmetadata = null; audio.onerror = null; finish(new Error('هذا الملف غير قابل للتشغيل. اختر ملفًا صوتيًا صالحًا.')); };
      audio.preload = 'metadata'; audio.src = url;
    });
  } finally { URL.revokeObjectURL(url); }
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('تعذّر قراءة الملف. حاول مرة أخرى.')); reader.readAsDataURL(file); });
}

export function AudioLibrary() {
  const library = useAudioLibrary();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [loading, setLoading] = useState(false), [name, setName] = useState('');
  const upload = async (file?: File) => {
    if (!file) return;
    setError(''); setNotice('');
    const invalid = validateAudioFile(file);
    if (invalid) { setError(invalid); return; }
    if (readAudioLibrary().tracks.length >= MAX_AUDIO_TRACKS) { setError('يمكن حفظ 3 مقاطع. احذف مقطعًا قبل إضافة آخر.'); return; }
    setLoading(true);
    try {
      const dataUrl = await readPlayableAudio(file), current = readAudioLibrary();
      if (current.tracks.length >= MAX_AUDIO_TRACKS) throw new Error('المكتبة ممتلئة. احذف مقطعًا قبل إضافة آخر.');
      const id = `audio_${crypto.randomUUID()}`;
      const track: AudioTrack = { id, name: (name.trim() || file.name.replace(/\.[^.]+$/, '')).slice(0, 80), mime: file.type, bytes: file.size, dataUrl };
      saveAudioLibrary({ tracks: [...current.tracks, track], defaultTrackId: current.defaultTrackId || id });
      setName(''); setNotice('حُفظ المقطع في مكتبتك. يمكنك اختياره من محرر الدعوة.');
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذّر حفظ المقطع. حاول مرة أخرى.'); }
    finally { setLoading(false); if (input.current) input.current.value = ''; }
  };
  const change = (fn: () => void, message: string) => { setError(''); try { fn(); setNotice(message); } catch (e) { setError(e instanceof Error ? e.message : 'تعذّر حفظ التغيير.'); } };
  return <Panel title="مكتبتي الصوتية">
    <p className="muted">أضف صوتًا لدعواتك، واختره من «الحركة والصوت» داخل المحرر.</p>
    <p className="field-hint">حتى 3 مقاطع، بحد 300 كيلوبايت للمقطع. الملفات محفوظة على هذا المتصفح فقط؛ مشاركتها مع أجهزة الضيوف تحتاج ربط تخزين لاحقًا.</p>
    <div className="audio-library-upload stack gap-3">
      <Field label="اسم المقطع" optional><Input value={name} maxLength={80} placeholder="مثلًا: موسيقى حفلنا" onChange={e => setName(e.target.value)} /></Field>
      <input ref={input} className="sr-only" type="file" tabIndex={-1} aria-label="رفع مقطع صوتي" accept={AUDIO_MIME.join(',')} onChange={e => void upload(e.target.files?.[0])} />
      <Button variant="secondary" loading={loading} disabled={library.tracks.length >= MAX_AUDIO_TRACKS} onClick={() => input.current?.click()}>إضافة مقطع صوتي</Button>
    </div>
    {error && <Banner tone="danger" compact>{error}</Banner>}
    {notice && <p role="status" className="field-hint">{notice}</p>}
    {library.tracks.length > 0 && <ul className="audio-library-list">{library.tracks.map(track => <li key={track.id}>
      <strong>{track.name}</strong>{library.defaultTrackId === track.id && <span className="field-hint">الافتراضي للدعوات</span>}
      <AudioSample track={track} />
      <div className="row wrap gap-2"><Button size="sm" variant="ghost" disabled={library.defaultTrackId === track.id} onClick={() => change(() => saveAudioLibrary({ ...readAudioLibrary(), defaultTrackId: track.id }), 'أصبح هذا المقطع هو الصوت الافتراضي.')}>اجعله الافتراضي</Button><Button size="sm" variant="ghost" onClick={() => change(() => { const current = readAudioLibrary(); saveAudioLibrary({ tracks: current.tracks.filter(t => t.id !== track.id), defaultTrackId: current.defaultTrackId === track.id ? undefined : current.defaultTrackId }); }, 'حُذف المقطع. الدعوات التي استخدمته تعود إلى الصوت الأساسي.')}>حذف المقطع</Button></div>
    </li>)}</ul>}
    {library.defaultTrackId && <Button size="sm" variant="ghost" onClick={() => change(() => saveAudioLibrary({ ...readAudioLibrary(), defaultTrackId: undefined }), 'أصبح الصوت الأساسي هو الافتراضي.')}>استخدام الصوت الأساسي كافتراضي</Button>}
  </Panel>;
}
