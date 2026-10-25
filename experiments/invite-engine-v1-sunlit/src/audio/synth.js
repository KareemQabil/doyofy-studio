// Generated fallback sounds (Web Audio). Used when a pack has no file for a cue, a file
// fails to load, or a pack is synth-only (e.g. playful_clay).
const noiseBuf = new WeakMap();
function noise(ctx) {
  if (noiseBuf.has(ctx)) return noiseBuf.get(ctx);
  const b = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  noiseBuf.set(ctx, b);
  return b;
}
const hz = (m) => 440 * 2 ** ((m - 69) / 12);

export function bell(ctx, out, t, midi, vol = 0.12, dur = 1.6, type = 'sine') {
  [[1, vol], [2, vol * 0.2], [4.01, vol * 0.08]].forEach(([mul, v]) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = hz(midi) * mul;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur / mul);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.1);
  });
}

export function swish(ctx, out, t, dur = 0.4, f0 = 600, f1 = 2200, vol = 0.06) {
  const s = ctx.createBufferSource(); s.buffer = noise(ctx);
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass';
  bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(bp); bp.connect(g); g.connect(out); s.start(t); s.stop(t + dur + 0.05);
}

export function thump(ctx, out, t, vol = 0.5) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(44, t + 0.35);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.5);
}

export const genericSynth = {
  reveal: (ctx, out, t) => { swish(ctx, out, t, 1.2, 300, 2400, 0.05); [74, 78, 81].forEach((m, i) => bell(ctx, out, t + 0.9 + i * 0.1, m, 0.06)); },
  transition: (ctx, out, t) => swish(ctx, out, t, 0.6, 400, 1800, 0.05),
  page: (ctx, out, t) => swish(ctx, out, t, 0.25, 900, 3500, 0.04),
  click: (ctx, out, t) => bell(ctx, out, t, 91, 0.03, 0.15, 'triangle'),
  seal: (ctx, out, t) => thump(ctx, out, t, 0.55),
  finale: (ctx, out, t) => [62, 66, 69, 74, 78].forEach((m, i) => bell(ctx, out, t + i * 0.12, m, 0.06, 2)),
  success: (ctx, out, t) => { bell(ctx, out, t, 81, 0.07); bell(ctx, out, t + 0.14, 86, 0.06); },
  decline: (ctx, out, t) => { bell(ctx, out, t, 69, 0.06); bell(ctx, out, t + 0.3, 66, 0.06); },
  /** Returns a stoppable node-like object. */
  ambient: (ctx, out) => {
    const chords = [[50, 54, 57], [47, 50, 54], [43, 47, 50], [45, 49, 52]];
    let step = 0;
    const id = setInterval(() => {
      const ch = chords[Math.floor(step / 8) % 4];
      const pat = [ch[0] + 12, ch[2] + 12, ch[1] + 24, ch[2] + 12, ch[0] + 24, ch[2] + 12, ch[1] + 24, ch[2] + 24];
      bell(ctx, out, ctx.currentTime + 0.03, pat[step % 8], 0.05, 1.6);
      step++;
    }, 360);
    return { stop: () => clearInterval(id) };
  },
};

/** Brighter, bouncier synth set for the playful clay pack. */
export const claySynth = {
  reveal: (ctx, out, t) => [72, 76, 79, 84].forEach((m, i) => bell(ctx, out, t + i * 0.08, m, 0.08, 0.6, 'triangle')),
  transition: (ctx, out, t) => bell(ctx, out, t, 79, 0.05, 0.3, 'triangle'),
  page: (ctx, out, t) => bell(ctx, out, t, 84, 0.05, 0.25, 'triangle'),
  click: (ctx, out, t) => bell(ctx, out, t, 96, 0.04, 0.12, 'square'),
  seal: (ctx, out, t) => { thump(ctx, out, t, 0.35); bell(ctx, out, t + 0.05, 88, 0.05, 0.3, 'triangle'); },
  finale: (ctx, out, t) => [72, 76, 79, 84, 88, 91].forEach((m, i) => bell(ctx, out, t + i * 0.09, m, 0.07, 0.8, 'triangle')),
  success: (ctx, out, t) => [84, 88, 91].forEach((m, i) => bell(ctx, out, t + i * 0.08, m, 0.07, 0.5, 'triangle')),
  decline: (ctx, out, t) => [76, 72].forEach((m, i) => bell(ctx, out, t + i * 0.18, m, 0.06, 0.5, 'triangle')),
  ambient: (ctx, out) => {
    const notes = [72, 76, 79, 76, 74, 77, 81, 77, 72, 76, 79, 84, 83, 79, 74, 71];
    let i = 0;
    const id = setInterval(() => { bell(ctx, out, ctx.currentTime + 0.02, notes[i++ % notes.length], 0.04, 0.7, 'triangle'); }, 300);
    return { stop: () => clearInterval(id) };
  },
};
