/**
 * Browser media for the account's sound tools: decoding an upload into a waveform summary and recording a voice
 * welcome. Kept behind one object so DOM tests (jsdom has no Web Audio or MediaRecorder) can stand in for them.
 */
import { AudioLibraryError, computePeaks } from '../../domain/audio-library';

/** what the trim view needs; the decoded samples themselves are dropped right away (a song is tens of MB) */
export interface AudioSummary { duration: number; peaks: number[] }
export const WAVE_BUCKETS = 480;

type OfflineCtor = new (channels: number, length: number, sampleRate: number) => OfflineAudioContext;
async function decode(blob: Blob): Promise<AudioSummary> {
  const w = window as unknown as { OfflineAudioContext?: OfflineCtor; webkitOfflineAudioContext?: OfflineCtor };
  const Offline = w.OfflineAudioContext || w.webkitOfflineAudioContext;
  if (!Offline) throw new AudioLibraryError('decode');
  const bytes = await blob.arrayBuffer();
  // a low sample rate is plenty for peaks and keeps a 4-minute song to a few MB while decoding
  for (const rate of [8000, 44100]) {
    let ctx: OfflineAudioContext;
    try { ctx = new Offline(1, 1, rate); } catch { continue; }
    try {
      const buf = await ctx.decodeAudioData(bytes.slice(0));
      if (!(buf.duration > 0)) break;
      const channels = Array.from({ length: buf.numberOfChannels }, (_, i) => buf.getChannelData(i));
      return { duration: buf.duration, peaks: computePeaks(channels, WAVE_BUCKETS) };
    } catch { /* some engines reject a low decode rate: try the next */ }
  }
  throw new AudioLibraryError('decode');
}

export type RecorderProblem = 'unsupported' | 'denied' | 'nomic' | 'failed';
/** MediaRecorder's own format, in order of what plays back everywhere (Safari records MP4/AAC) */
const RECORD_TYPES = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'];

export const audioMedia = {
  decode,
  canRecord(): boolean {
    return typeof window !== 'undefined' && typeof (window as unknown as { MediaRecorder?: unknown }).MediaRecorder === 'function' && !!navigator.mediaDevices?.getUserMedia;
  },
  async microphone(): Promise<MediaStream> {
    try { return await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
    catch (e) {
      const name = (e as { name?: string })?.name;
      throw Object.assign(new Error(name || 'failed'), { problem: (name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : name === 'NotFoundError' || name === 'OverconstrainedError' ? 'nomic' : 'failed') as RecorderProblem });
    }
  },
  recorder(stream: MediaStream): MediaRecorder {
    const type = RECORD_TYPES.find(t => MediaRecorder.isTypeSupported?.(t));
    return new MediaRecorder(stream, type ? { mimeType: type } : undefined);
  },
  /** a live level 0..1 from the microphone, or null where Web Audio is missing (the timer still runs) */
  level(stream: MediaStream): { read(): number; close(): void } | null {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    try {
      const ac = new C(), analyser = ac.createAnalyser();
      analyser.fftSize = 512;
      ac.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      return {
        read() { analyser.getByteTimeDomainData(data); let sum = 0; for (const v of data) sum += ((v - 128) / 128) ** 2; return Math.min(1, Math.sqrt(sum / data.length) * 3); },
        close() { void ac.close().catch(() => {}); },
      };
    } catch { return null; }
  },
};
