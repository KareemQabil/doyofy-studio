/**
 * Event-driven audio. Components never play files; they emit semantic events:
 *   audio.emit('reveal') · 'page-change' · 'transition' · 'click' · 'seal' · 'finale'
 *   · 'rsvp-success' · 'rsvp-decline'  (ambient is managed with startAmbient/stopAmbient)
 *
 * A pack maps cues → files and/or synthesised fallbacks:
 *   { id, cues: { ambient: { src, volume, loop:true }, reveal: { src, volume }, … },
 *     synth: { reveal(ctx, out, t) {…}, … } }
 * Missing or failing files fall back to the pack's synth, then to the generic synth set.
 * Mobile autoplay: nothing sounds until unlock() runs inside a user gesture.
 */
import { genericSynth } from '../audio/synth.js';

const EVENT_TO_CUE = {
  reveal: 'reveal', 'page-change': 'page', transition: 'transition', click: 'click', seal: 'seal',
  finale: 'finale', 'rsvp-success': 'success', 'rsvp-decline': 'decline',
};

export class AudioEngine {
  constructor({ assets, bus }) {
    this.assets = assets; this.bus = bus;
    this.ctx = null; this.master = null; this.musicGain = null; this.sfxGain = null;
    this.pack = null; this.buffers = new Map(); this.muted = false; this.volume = 0.8;
    this.ambientSrc = null; this.unlocked = false; this.wantAmbient = false;
  }

  setPack(pack) {
    const changed = this.pack?.id !== pack?.id;
    this.pack = pack;
    if (changed && this.ambientSrc) { this.stopAmbient(0.4); if (this.wantAmbient) setTimeout(() => this.startAmbient(), 450); }
    if (this.ctx) this._prefetch();
  }

  /** Must be called from a user gesture (tap on the card, sound button…). */
  unlock() {
    if (!this.ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return false;
      this.ctx = new C();
      this.master = this.ctx.createGain(); this.master.gain.value = this.muted ? 0 : this.volume;
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.55;
      this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.9;
      this.musicGain.connect(this.master); this.sfxGain.connect(this.master); this.master.connect(this.ctx.destination);
      this._prefetch();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    this.unlocked = true;
    if (this.wantAmbient && !this.ambientSrc) this.startAmbient();
    return true;
  }

  async _buffer(src) {
    if (!src) return null;
    if (this.buffers.has(src)) return this.buffers.get(src);
    const p = this.assets.arrayBuffer(src)
      .then((ab) => new Promise((res, rej) => this.ctx.decodeAudioData(ab.slice(0), res, rej)))
      .catch(() => null);
    this.buffers.set(src, p);
    return p;
  }

  _prefetch() {
    if (!this.pack?.cues || !this.ctx) return;
    for (const cue of Object.values(this.pack.cues)) if (cue?.src) this._buffer(cue.src);
  }

  emit(event, opts = {}) {
    const cue = EVENT_TO_CUE[event] || event;
    this.bus?.emit('audio:cue', { event, cue });
    if (!this.ctx || !this.unlocked || this.muted || !this.pack || this.pack.silent) return;
    this.play(cue, opts);
  }

  async play(cue, { volume = 1, delay = 0 } = {}) {
    const def = this.pack.cues?.[cue];
    const t = this.ctx.currentTime + 0.01 + delay;
    const buf = def?.src ? await this._buffer(def.src) : null;
    if (buf) {
      const s = this.ctx.createBufferSource(); s.buffer = buf;
      const g = this.ctx.createGain(); g.gain.value = (def.volume ?? 1) * volume;
      s.connect(g); g.connect(this.sfxGain); s.start(t);
      return;
    }
    const synth = this.pack.synth?.[cue] || genericSynth[cue];
    try { synth?.(this.ctx, this.sfxGain, t, volume); } catch (e) { console.warn('[audio] synth failed', cue, e); }
  }

  async startAmbient(fade = 2.5) {
    this.wantAmbient = true;
    if (!this.ctx || !this.unlocked || !this.pack || this.pack.silent || this.ambientSrc) return;
    const def = this.pack.cues?.ambient;
    const g = this.ctx.createGain(); g.gain.value = 0.0001; g.connect(this.musicGain);
    const buf = def?.src ? await this._buffer(def.src) : null;
    if (this.ambientSrc || !this.wantAmbient) return;
    let node;
    if (buf) { node = this.ctx.createBufferSource(); node.buffer = buf; node.loop = true; node.connect(g); node.start(); }
    else if (this.pack.synth?.ambient || genericSynth.ambient) { node = (this.pack.synth?.ambient || genericSynth.ambient)(this.ctx, g); }
    if (!node) return;
    g.gain.exponentialRampToValueAtTime(def?.volume ?? 0.8, this.ctx.currentTime + fade);
    this.ambientSrc = { node, gain: g };
  }

  stopAmbient(fade = 1.2) {
    this.wantAmbient = false;
    const a = this.ambientSrc; this.ambientSrc = null;
    if (!a || !this.ctx) return;
    const now = this.ctx.currentTime;
    a.gain.gain.cancelScheduledValues(now);
    a.gain.gain.setValueAtTime(Math.max(0.0001, a.gain.gain.value), now);
    a.gain.gain.exponentialRampToValueAtTime(0.0001, now + fade);
    setTimeout(() => { try { a.node.stop ? a.node.stop() : a.node.disconnect?.(); } catch { /* already stopped */ } a.gain.disconnect(); }, fade * 1000 + 100);
  }

  /** Duck the music under a big moment (reveal, seal). */
  duck(amount = 0.45, dur = 1.6) {
    if (!this.ctx || !this.musicGain) return;
    const g = this.musicGain.gain, now = this.ctx.currentTime;
    g.cancelScheduledValues(now); g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0.55 * amount, now + 0.2); g.linearRampToValueAtTime(0.55, now + dur);
  }

  setMuted(m) {
    this.muted = m;
    if (this.master && this.ctx) { const now = this.ctx.currentTime; this.master.gain.cancelScheduledValues(now); this.master.gain.setTargetAtTime(m ? 0 : this.volume, now, 0.08); }
    this.bus?.emit('audio:muted', m);
  }

  setVolume(v) { this.volume = v; if (!this.muted) this.master?.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1); }

  destroy() {
    this.stopAmbient(0.2);
    const ctx = this.ctx; this.ctx = null;
    if (ctx) setTimeout(() => ctx.close().catch(() => {}), 400);
  }
}
