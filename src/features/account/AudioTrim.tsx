/**
 * Start point for an uploaded song: a waveform with a draggable start handle and the highlighted 30-second window
 * guests hear first. Like every audio editor the timeline runs left → right even on this RTL page (the strip is
 * dir="ltr" and says so); the handle is a native range input, so it works with touch, mouse and arrow keys.
 */
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { DEFAULT_FADE_IN_SEC, clampStartSec, formatClock, previewWindow } from '../../domain/audio-library';
import { Button, Switch } from '../../ui';
import { useCopy } from '../../ui/copy';
import type { AudioSummary } from './audio-media';

/** half the handle's hit width: the waveform is inset by it so the handle's centre sits on the time it shows */
const HANDLE_HALF = 22;

export function AudioTrim({ src, summary, start, fadeIn, onStart, onFadeIn }: {
  src: string; summary: AudioSummary; start: number; fadeIn: boolean;
  onStart: (sec: number) => void; onFadeIn: (on: boolean) => void;
}) {
  const { t } = useCopy();
  const hintId = useId();
  const canvas = useRef<HTMLCanvasElement>(null), audio = useRef<HTMLAudioElement>(null), ramp = useRef(0);
  const [width, setWidth] = useState(0), [playing, setPlaying] = useState(false);
  const { duration } = summary;
  const win = previewWindow(start, duration);

  useEffect(() => {
    const el = canvas.current?.parentElement;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, []);

  // bars inside the window take the brand colour; the rest stay quiet (colours come from tokens)
  useEffect(() => {
    const c = canvas.current, ctx = c?.getContext('2d');
    if (!c || !ctx || !width) return;
    const dpr = window.devicePixelRatio || 1, h = 64, w = Math.max(1, width - HANDLE_HALF * 2);
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); c.style.width = `${w}px`; c.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    const css = getComputedStyle(c), on = css.getPropertyValue('--c-accent-strong').trim() || 'currentColor', off = css.getPropertyValue('--c-text-3').trim() || 'currentColor';
    const bars = Math.max(1, Math.floor(w / 3)), peaks = summary.peaks;
    for (let i = 0; i < bars; i++) {
      const from = Math.floor(i / bars * peaks.length), to = Math.max(from + 1, Math.floor((i + 1) / bars * peaks.length));
      let p = 0; for (let k = from; k < to; k++) p = Math.max(p, peaks[k] ?? 0);
      const at = (i + 0.5) / bars * duration, bh = Math.max(2, p * (h - 4));
      ctx.fillStyle = at >= win.start && at <= win.end ? on : off;
      ctx.fillRect(i * 3, (h - bh) / 2, 2, bh);
    }
  }, [summary, width, win.start, win.end, duration]);

  const stop = () => { cancelAnimationFrame(ramp.current); audio.current?.pause(); setPlaying(false); };
  useEffect(() => () => { cancelAnimationFrame(ramp.current); audio.current?.pause(); }, []);
  const play = async () => {
    const el = audio.current;
    if (!el) return;
    el.currentTime = win.start; el.volume = fadeIn ? 0 : 1;
    try { await el.play(); } catch { setPlaying(false); return; }
    setPlaying(true);
    if (fadeIn) {
      const t0 = performance.now();
      const step = () => { const k = Math.min(1, (performance.now() - t0) / (DEFAULT_FADE_IN_SEC * 1000)); el.volume = k; if (k < 1) ramp.current = requestAnimationFrame(step); };
      ramp.current = requestAnimationFrame(step);
    }
  };
  const pick = (sec: number) => { const s = clampStartSec(sec, duration); onStart(s); if (playing && audio.current) audio.current.currentTime = s; };
  // iOS Safari moves a range only by its thumb: a tap anywhere on the strip jumps the start there too
  const tapTo = (e: PointerEvent<HTMLInputElement>) => {
    const r = e.currentTarget.getBoundingClientRect(), span = r.width - HANDLE_HALF * 2;
    if (span > 0) pick((e.clientX - r.left - HANDLE_HALF) / span * duration);
  };

  // the range keeps 0.1 s precision for dragging; from the keyboard an arrow moves a whole second and Page Up/Down ten
  // (the strip runs left → right, so → and ↑ move later)
  const stepBy = (e: KeyboardEvent<HTMLInputElement>) => {
    const by = ({ ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 } as Record<string, number>)[e.key];
    if (!by) return;
    e.preventDefault();
    pick(Math.round(start) + by);
  };

  return <div className="audio-trim">
    <p id={hintId} className="field-hint">{t('audioTrimHint')}</p>
    <div className="audio-wave" dir="ltr">
      <div className="audio-wave-window" aria-hidden="true" style={{ left: `calc(${HANDLE_HALF}px + (100% - ${HANDLE_HALF * 2}px) * ${win.start / duration})`, width: `calc((100% - ${HANDLE_HALF * 2}px) * ${(win.end - win.start) / duration})` }} />
      <canvas ref={canvas} aria-hidden="true" />
      <input type="range" className="audio-wave-range" min={0} max={Math.round(duration * 10) / 10} step={0.1} value={start}
        aria-label={t('audioStartLabel')} aria-valuetext={formatClock(start)} aria-describedby={hintId}
        onPointerDown={tapTo} onChange={e => pick(Number(e.target.value))} onKeyDown={stepBy} />
    </div>
    <div className="audio-wave-scale" dir="ltr" aria-hidden="true"><span>0:00</span><span>{t('audioTimeline')}</span><span>{formatClock(duration)}</span></div>
    <div className="audio-trim-row">
      <strong className="audio-trim-at">{t('audioStartAt').replace('{time}', formatClock(start))}</strong>
      <Button size="sm" variant="secondary" onClick={() => playing ? stop() : void play()}>{playing ? t('audioPreviewStop') : t('audioPreviewPlay')}</Button>
    </div>
    <Switch label={t('audioFadeIn')} hint={t('audioFadeInHint')} checked={fadeIn} onChange={onFadeIn} />
    <audio ref={audio} src={src} preload="auto" hidden onTimeUpdate={e => { if (e.currentTarget.currentTime >= win.end - 0.05) stop(); }} onEnded={stop} />
  </div>;
}
