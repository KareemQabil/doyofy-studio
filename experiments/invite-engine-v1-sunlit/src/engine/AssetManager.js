/**
 * AssetManager — one place that resolves, preloads, caches and picks responsive variants.
 *
 *   assets.url('cards/arabic-botanical-01/front-1200.webp')
 *   assets.pick({ base: 'textures/plaster', widths: [1000, 2000], ext: 'webp' }, cssWidth)
 *   await assets.preload([{ type: 'image', src }, { type: 'json', src }], { timeout: 4000 })
 *   assets.video({ mp4, webm, poster })  → <video> that pauses when the tab is hidden
 */
export class AssetManager {
  constructor({ base = 'assets/', quality } = {}) {
    this.base = base.endsWith('/') ? base : base + '/';
    this.quality = quality;
    this.cache = new Map();
    this.videos = new Set();
    this._onVis = () => {
      for (const v of this.videos) {
        if (document.hidden) { v._wasPlaying = !v.paused; v.pause(); } else if (v._wasPlaying) v.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', this._onVis);
  }

  url(path) {
    if (!path) return '';
    if (/^(data:|blob:|https?:|\/|\.\/)/.test(path)) return path;
    return this.base + path;
  }

  /** Choose the smallest variant that covers cssWidth × effective DPR. */
  pick(spec, cssWidth = 1000) { return this.url(this.pickPath(spec, cssWidth)); }

  /** Same as pick() but returns the asset-relative path (for preload lists). */
  pickPath(spec, cssWidth = 1000) {
    if (typeof spec === 'string') return spec;
    const dpr = Math.min(window.devicePixelRatio || 1, this.quality?.dprCap ?? 2);
    const need = cssWidth * dpr;
    const widths = [...spec.widths].sort((a, b) => a - b);
    const w = widths.find((x) => x >= need) ?? widths[widths.length - 1];
    return `${spec.base}-${w}.${spec.ext || 'webp'}`;
  }

  image(src) {
    const url = this.url(src);
    if (this.cache.has(url)) return this.cache.get(url);
    const p = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => resolve(img));
      img.onerror = () => reject(new Error('image failed: ' + url));
      img.src = url;
    });
    this.cache.set(url, p);
    return p;
  }

  json(src) {
    const url = this.url(src);
    if (!this.cache.has(url)) this.cache.set(url, fetch(url).then((r) => { if (!r.ok) throw new Error(`json ${r.status}: ${url}`); return r.json(); }));
    return this.cache.get(url);
  }

  arrayBuffer(src) {
    const url = this.url(src);
    if (!this.cache.has(url)) this.cache.set(url, fetch(url).then((r) => { if (!r.ok) throw new Error(`fetch ${r.status}: ${url}`); return r.arrayBuffer(); }));
    return this.cache.get(url);
  }

  /** Preload a list of assets; never rejects. Resolves after all settle or the timeout. */
  preload(list = [], { timeout = 5000 } = {}) {
    const jobs = list.filter(Boolean).map((a) => {
      const src = typeof a === 'string' ? a : a.src;
      const type = a.type || (/\.(json)$/.test(src) ? 'json' : /\.(mp3|ogg|wav)$/.test(src) ? 'audio' : 'image');
      if (type === 'json') return this.json(src);
      if (type === 'audio') return this.arrayBuffer(src);
      if (type === 'video') return Promise.resolve();
      return this.image(src);
    });
    return Promise.race([Promise.allSettled(jobs), new Promise((r) => setTimeout(r, timeout))]);
  }

  /**
   * First-class video background: muted autoplay, poster fallback, mobile/low-quality
   * fallback to the poster image, lazy source attachment, paused while the tab is hidden.
   */
  video({ mp4, webm, poster, loop = true, lazy = true, allowOnLowQuality = false } = {}) {
    const v = document.createElement('video');
    v.muted = true; v.defaultMuted = true; v.loop = loop; v.playsInline = true;
    v.setAttribute('playsinline', ''); v.setAttribute('muted', ''); v.setAttribute('aria-hidden', 'true');
    v.preload = lazy ? 'none' : 'auto';
    if (poster) v.poster = this.url(poster);
    const useVideo = allowOnLowQuality || !this.quality || (this.quality.level !== 'low' && !this.quality.saveData);
    v.dataset.fallback = useVideo ? 'false' : 'true';
    const attach = () => {
      if (!useVideo || v.dataset.attached) return;
      v.dataset.attached = '1';
      if (webm) v.append(Object.assign(document.createElement('source'), { src: this.url(webm), type: 'video/webm' }));
      if (mp4) v.append(Object.assign(document.createElement('source'), { src: this.url(mp4), type: 'video/mp4' }));
      v.load();
      v.play().catch(() => { /* autoplay refused: poster stays visible */ });
    };
    v.start = attach;
    v.addEventListener('error', () => { v.dataset.fallback = 'true'; }, true);
    this.videos.add(v);
    if (!lazy) attach();
    return v;
  }

  releaseVideo(v) { v.pause(); v.removeAttribute('src'); v.querySelectorAll('source').forEach((s) => s.remove()); v.load(); this.videos.delete(v); }

  destroy() {
    document.removeEventListener('visibilitychange', this._onVis);
    for (const v of this.videos) this.releaseVideo(v);
  }
}
