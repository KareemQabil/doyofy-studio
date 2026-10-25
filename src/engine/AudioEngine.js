/**
 * AudioEngine — event-based sound. Components never touch audio files: they call
 *   audio.emit('open' | 'page' | 'click' | 'choose' | 'pack' | 'seal' | 'fly' | 'done')
 * and the active audio pack (AudioRegistry) maps events to cues.
 *
 * - Real localized files first (P0 Mixkit cues). A cue's synth fallback plays only when its file
 *   failed to load/decode, or when the pack defines no file for it (the canonical seal thump).
 * - Nothing is audible before the first user gesture: unlock() is called from the first
 *   pointer/keyboard interaction and resumes the AudioContext.
 * - Music (the canonical bell arpeggio) runs only while the invitation pages are open.
 * - Scene ambience (optional, per scene) loops quietly under the card/pages and ducks for the finale.
 */
export class AudioEngine {
  constructor({ base = 'assets/' } = {}) {
    this.base = base;
    this.enabled = true;          // canonical default: sound on
    this.ac = null; this.master = null;
    this.buffers = new Map();     // path → AudioBuffer | 'failed'
    this.raw = new Map();         // path → Promise<ArrayBuffer>
    this.pack = null;
    this.music = null; this.amb = null;
    this.stats = { played: [], fallbacks: [] };
  }

  usePack(pack) {
    this.pack = pack;
    // fetch (not decode) every cue file up front; decoding needs the AudioContext (after a gesture)
    for (const cue of Object.values(pack.cues)) for (const l of [].concat(cue)) if (l.file) this._fetch(l.file).catch(() => { this.buffers.set(l.file, 'failed'); });
  }

  _fetch(path) {
    if (!this.raw.has(path)) this.raw.set(path, fetch(this.base + path).then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }));
    return this.raw.get(path);
  }

  async _buffer(path) {
    if (this.buffers.has(path)) return this.buffers.get(path);
    try {
      const ab = await this._fetch(path);
      const buf = await this.ac.decodeAudioData(ab.slice(0));
      this.buffers.set(path, buf);
      return buf;
    } catch (e) {
      console.warn('[audio] cue file failed, using synth fallback:', path, e?.message || e);
      this.buffers.set(path, 'failed');
      return 'failed';
    }
  }

  /** first meaningful gesture */
  unlock() {
    try {
      if (!this.ac) {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return false;
        this.ac = new C();
        this.master = this.ac.createGain();
        this.master.gain.value = this.enabled ? 1 : 0;
        this.master.connect(this.ac.destination);
        if (this.pack) for (const cue of Object.values(this.pack.cues)) for (const l of [].concat(cue)) if (l.file) this._buffer(l.file);
      }
      if (this.ac.state === 'suspended') this.ac.resume();
      return true;
    } catch { return false; }
  }

  setEnabled(on) {
    this.enabled = on;
    if (this.master) this.master.gain.setTargetAtTime(on ? 1 : 0, this.ac.currentTime, 0.05);
    if (!on) this.stopMusic();
  }

  async emit(event) {
    if (!this.pack || !this.ac || !this.enabled) return;
    const cue = this.pack.cues[event];
    if (!cue) return;
    this.stats.played.push(event);
    for (const layer of [].concat(cue)) {
      const t = this.ac.currentTime + 0.02 + (layer.at || 0);
      if (layer.file) {
        const buf = await this._buffer(layer.file);
        if (buf !== 'failed') { this._play(buf, t, layer.gain ?? 0.5); continue; }
        this.stats.fallbacks.push(layer.file);
      }
      if (layer.synth) this._synth(layer.synth, t);
    }
  }

  _play(buf, t, gain) {
    const src = this.ac.createBufferSource(); src.buffer = buf;
    const g = this.ac.createGain(); g.gain.value = gain;
    src.connect(g); g.connect(this.master); src.start(Math.max(t, this.ac.currentTime));
    return src;
  }

  // ---------------------------------------------------------------- canonical synth voices (Studio.dc.html)
  _bell(t, midi, vol) {
    const ac = this.ac, f = 440 * Math.pow(2, (midi - 69) / 12);
    [[1, vol, 1.7], [2, vol * 0.18, 0.7], [4.01, vol * 0.1, 0.5]].forEach(([m, v, d]) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = f * m;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + d + 0.05);
    });
  }
  _noise(t, dur, f0, f1, vol) {
    const ac = this.ac, len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(); src.buffer = buf;
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp); bp.connect(g); g.connect(this.master); src.start(t); src.stop(t + dur + 0.02);
  }
  _thump(t) {
    const ac = this.ac, o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.35);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.6 * 0.22, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 0.5);
    this._noise(t, 0.12, 1800, 900, 0.12 * 0.22);
  }
  _synth(name, t) {
    const V = 0.22; // canonical master gain
    switch (name) {
      case 'open': this._noise(t, 0.8, 500, 1500, 0.05 * V); [74, 78, 81].forEach((m, i) => this._bell(t + 0.5 + i * 0.1, m, 0.05 * V)); break;
      case 'page': this._noise(t, 0.3, 600, 1500, 0.03 * V); break;
      case 'pack': this._noise(t, 0.9, 380, 900, 0.05 * V); break;
      case 'thump': this._thump(t); break;
      case 'fly': this._noise(t, 1.3, 300, 2600, 0.07 * V); break;
      case 'done': [74, 78, 81, 86, 90].forEach((m, i) => this._bell(t + 0.2 + i * 0.12, m, 0.06 * V)); break;
      case 'click': this._noise(t, 0.05, 2400, 2000, 0.02 * V); break;
      default: break;
    }
  }

  /** canonical background music: bell arpeggio over four chords, 340 ms steps */
  startMusic() {
    if (this.music || !this.enabled || !this.ac || !this.pack?.music) return;
    const chords = [[50, 54, 57], [47, 50, 54], [43, 47, 50], [45, 49, 52]];
    let step = 0;
    this.music = setInterval(() => {
      if (!this.ac) return;
      const i = step++, ch = chords[Math.floor(i / 8) % 4];
      const pat = [ch[0] + 12, ch[2] + 12, ch[1] + 24, ch[2] + 12, ch[0] + 24, ch[2] + 12, ch[1] + 24, ch[2] + 24];
      const t = this.ac.currentTime + 0.03;
      this._bell(t, pat[i % 8], 0.04 * 0.22);
      if (i % 8 === 0) this._bell(t, ch[0], 0.028 * 0.22);
    }, 340);
  }
  stopMusic() { if (this.music) { clearInterval(this.music); this.music = null; } }

  /** scene ambience loop (optional) */
  async setAmbience(spec) {
    if (this.amb) { const a = this.amb; this.amb = null; try { a.g.gain.setTargetAtTime(0, this.ac.currentTime, 0.4); setTimeout(() => a.src.stop(), 1500); } catch {} }
    if (!spec || !this.ac) return;
    const buf = await this._buffer(spec.file);
    if (buf === 'failed') return;
    const src = this.ac.createBufferSource(); src.buffer = buf; src.loop = true;
    const g = this.ac.createGain(); g.gain.value = 0;
    src.connect(g); g.connect(this.master); src.start();
    g.gain.setTargetAtTime(spec.gain ?? 0.08, this.ac.currentTime, 1.2);
    this.amb = { src, g, spec };
  }
  duckAmbience(to = 0.25) { if (this.amb) this.amb.g.gain.setTargetAtTime((this.amb.spec.gain ?? 0.08) * to, this.ac.currentTime, 0.4); }

  destroy() { this.stopMusic(); this.setAmbience(null); try { this.ac?.close(); } catch {} this.ac = null; }
}
