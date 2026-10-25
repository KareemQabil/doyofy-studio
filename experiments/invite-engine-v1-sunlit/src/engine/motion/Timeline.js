/**
 * Built-in timeline engine with a GSAP-compatible subset:
 *   tl.to(el, { x, y, z, rotateX, scale, opacity, clipPath, filter, '--v': 1, duration, ease, stagger }, position)
 *   tl.from / fromTo / set / call / add(childTimeline) / addLabel
 *   tl.play() pause() kill() seek(t) timeScale(v) then()
 * Positions: 1.2 | '<' | '>' | '+=0.3' | '-=0.2' | '<+=0.1' | 'label' | 'label+=0.4'
 *
 * If window.gsap is present and the engine opts in (config.motion.engine = 'gsap'),
 * createTimeline() returns a real gsap.timeline() instead — module code is identical.
 */
import { getEase } from './ease.js';

const TKEYS = new Set(['x', 'y', 'z', 'xPercent', 'yPercent', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 'scale', 'scaleX', 'scaleY', 'skewX', 'skewY']);
const DEFAULTS = { x: 0, y: 0, z: 0, xPercent: 0, yPercent: 0, rotate: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 };
const RESERVED = new Set(['duration', 'ease', 'delay', 'stagger', 'onStart', 'onComplete', 'onUpdate', 'immediateRender', 'transformOrigin', 'overwrite']);
const tstate = new WeakMap();

export function getTransform(el) {
  let s = tstate.get(el);
  if (!s) { s = { ...DEFAULTS }; tstate.set(el, s); }
  return s;
}

export function applyTransform(el, s = getTransform(el)) {
  const p = [];
  if (s.xPercent || s.yPercent) p.push(`translate(${s.xPercent}%, ${s.yPercent}%)`);
  if (s.x || s.y || s.z) p.push(`translate3d(${r(s.x)}px, ${r(s.y)}px, ${r(s.z)}px)`);
  if (s.rotateX) p.push(`rotateX(${r(s.rotateX)}deg)`);
  if (s.rotateY) p.push(`rotateY(${r(s.rotateY)}deg)`);
  if (s.rotate || s.rotateZ) p.push(`rotate(${r(s.rotate + s.rotateZ)}deg)`);
  if (s.skewX || s.skewY) p.push(`skew(${r(s.skewX)}deg, ${r(s.skewY)}deg)`);
  const sx = s.scale * s.scaleX, sy = s.scale * s.scaleY;
  if (sx !== 1 || sy !== 1) p.push(`scale(${r(sx)}, ${r(sy)})`);
  el.style.transform = p.join(' ') || 'none';
}
const r = (v) => Math.round(v * 1000) / 1000;

/** Set values immediately (transforms, css, css variables) without animating. */
export function setProps(el, vars) {
  if (!el) return;
  let t = false;
  for (const [k, v] of Object.entries(vars)) {
    if (RESERVED.has(k)) { if (k === 'transformOrigin') el.style.transformOrigin = v; continue; }
    if (TKEYS.has(k)) { getTransform(el)[k] = Number(v); t = true; } else writeProp(el, k, v);
  }
  if (t) applyTransform(el);
}

function writeProp(el, k, v) {
  if (k.startsWith('--')) el.style.setProperty(k, typeof v === 'number' ? String(v) : v);
  else if (k === 'opacity' || k === 'zIndex') el.style[k] = String(v);
  else if (typeof v === 'number' && /^(width|height|top|left|right|bottom|borderRadius|letterSpacing)$/.test(k)) el.style[k] = `${v}px`;
  else el.style[k] = v;
}

const NUM = /-?\d*\.?\d+(?:e-?\d+)?/g;
function parseStr(s) { const nums = []; const tpl = String(s).replace(NUM, (m) => { nums.push(parseFloat(m)); return '\u0000'; }); return { raw: String(s), tpl, nums }; }
function interpStr(a, b, t) {
  if (a.nums.length !== b.nums.length) return t < 1 ? a.raw : b.raw;
  let i = 0;
  return b.tpl.replace(/\u0000/g, () => { const v = a.nums[i] + (b.nums[i] - a.nums[i]) * t; i++; return String(Math.round(v * 10000) / 10000); });
}

function readProp(el, k, toVal) {
  if (TKEYS.has(k)) return getTransform(el)[k];
  if (k.startsWith('--')) { const v = el.style.getPropertyValue(k) || getComputedStyle(el).getPropertyValue(k); return typeof toVal === 'number' ? parseFloat(v) || 0 : v.trim(); }
  const inline = el.style[k];
  const v = inline !== '' && inline != null ? inline : getComputedStyle(el)[k];
  if (typeof toVal === 'number') return parseFloat(v) || (k === 'opacity' ? 1 : 0);
  return v;
}

function toArray(targets) {
  if (!targets) return [];
  if (typeof targets === 'string') return [...document.querySelectorAll(targets)];
  if (targets instanceof Element || targets === window) return [targets];
  return [...targets].filter(Boolean);
}

class Tween {
  constructor(el, fromVars, toVars, dur, ease) {
    this.el = el; this.fromVars = fromVars; this.toVars = toVars; this.dur = dur; this.ease = getEase(ease);
    this.started = false; this.done = false; this.props = null;
  }
  init() {
    this.props = [];
    for (const [k, to] of Object.entries(this.toVars)) {
      if (RESERVED.has(k)) continue;
      const fromRaw = this.fromVars && k in this.fromVars ? this.fromVars[k] : readProp(this.el, k, to);
      if (typeof to === 'number' || TKEYS.has(k)) this.props.push({ k, num: true, a: Number(fromRaw), b: Number(to) });
      else {
        let a = parseStr(fromRaw); const b = parseStr(to);
        if (a.nums.length !== b.nums.length) a = { ...b, nums: b.nums.map(() => 0), raw: String(fromRaw) };
        this.props.push({ k, num: false, a, b });
      }
    }
    if (this.toVars.transformOrigin) this.el.style.transformOrigin = this.toVars.transformOrigin;
  }
  render(p) {
    if (!this.props) this.init();
    const e = p >= 1 ? 1 : this.ease(p);
    let t = false;
    for (const pr of this.props) {
      if (TKEYS.has(pr.k)) { getTransform(this.el)[pr.k] = pr.a + (pr.b - pr.a) * e; t = true; } else if (pr.num) writeProp(this.el, pr.k, pr.a + (pr.b - pr.a) * e);
      else writeProp(this.el, pr.k, interpStr(pr.a, pr.b, e));
    }
    if (t) applyTransform(this.el);
  }
}

// ---------------------------------------------------------------- ticker
const active = new Set();
let rafId = 0, last = 0;
function tick(now) {
  const dt = Math.min(0.1, (now - (last || now)) / 1000);
  last = now;
  for (const tl of [...active]) tl._advance(dt);
  rafId = active.size ? requestAnimationFrame(tick) : 0;
  if (!rafId) last = 0;
}
function wake() { if (!rafId) rafId = requestAnimationFrame(tick); }

export const TimelineDefaults = { timeScale: 1 };

export class Timeline {
  constructor({ paused = false, onComplete, onUpdate, timeScale } = {}) {
    this.children = []; this.labels = {}; this._dur = 0; this._t = 0; this._lastT = -1;
    this._prevStart = 0; this._prevEnd = 0; this._ts = timeScale ?? TimelineDefaults.timeScale;
    this._paused = paused; this._killed = false; this._completed = false;
    this.onComplete = onComplete; this.onUpdate = onUpdate;
    this._promise = new Promise((res) => { this._resolve = res; });
    if (!paused) { active.add(this); wake(); }
  }

  _pos(position) {
    if (position == null) return this._prevEnd === 0 && this.children.length === 0 ? 0 : this._dur;
    if (typeof position === 'number') return position;
    const m = String(position).match(/^([<>]|[a-zA-Z_][\w-]*)?\s*(?:([+-])=\s*([\d.]+))?$/);
    if (!m) return this._dur;
    const [, anchor, sign, amount] = m;
    let base = this._dur;
    if (anchor === '<') base = this._prevStart; else if (anchor === '>') base = this._prevEnd;
    else if (anchor) base = this.labels[anchor] ?? this._dur;
    const off = amount ? Number(amount) * (sign === '-' ? -1 : 1) : 0;
    return Math.max(0, base + off);
  }

  _push(child, start) {
    child.start = start;
    this.children.push(child);
    this._prevStart = start; this._prevEnd = start + child.dur;
    this._dur = Math.max(this._dur, this._prevEnd);
    this._completed = false;
    if (!this._paused && !this._killed) { active.add(this); wake(); }
    return this;
  }

  _tween(targets, fromVars, toVars, position, immediate) {
    const els = toArray(targets);
    const dur = Math.max(0, toVars.duration ?? 0.5);
    const stagger = toVars.stagger || 0;
    let start = this._pos(position) + (toVars.delay || 0);
    const firstStart = start;
    els.forEach((el, i) => {
      const tw = new Tween(el, fromVars, toVars, dur, toVars.ease || 'power2.out');
      tw.onStart = i === 0 ? toVars.onStart : null;
      tw.onComplete = i === els.length - 1 ? toVars.onComplete : null;
      if (immediate && fromVars) { setProps(el, fromVars); }
      this._push(tw, start + i * stagger);
    });
    if (els.length) { this._prevStart = firstStart; this._prevEnd = firstStart + dur + stagger * (els.length - 1); }
    return this;
  }

  to(targets, vars, position) { return this._tween(targets, null, vars, position, false); }
  from(targets, vars, position) {
    const els = toArray(targets);
    const start = this._pos(position);
    const fromVars = {};
    for (const [k, v] of Object.entries(vars)) if (!RESERVED.has(k)) fromVars[k] = v;
    els.forEach((el, i) => {
      // "to" = the element's current values at creation time
      const toVars = { ...vars, stagger: 0 };
      for (const k of Object.keys(fromVars)) toVars[k] = readProp(el, k, fromVars[k]);
      this._tween(el, fromVars, toVars, start + i * (vars.stagger || 0), vars.immediateRender !== false);
    });
    if (els.length) { this._prevStart = start; }
    return this;
  }
  fromTo(targets, fromVars, toVars, position) { return this._tween(targets, fromVars, toVars, position, toVars.immediateRender !== false); }
  set(targets, vars, position) { return this._tween(targets, vars, { ...vars, duration: 0 }, position, false); }
  call(fn, args = [], position) { return this._push({ dur: 0, call: () => fn(...args), fired: false }, this._pos(position)); }
  add(child, position) {
    if (typeof child === 'function') return this.call(child, [], position);
    if (child instanceof Timeline) { child.pause(); active.delete(child); return this._push({ dur: child.duration(), tl: child }, this._pos(position)); }
    return this;
  }
  addLabel(name, position) { this.labels[name] = this._pos(position); return this; }

  duration() { return this._dur; }
  time() { return this._t; }
  progress() { return this._dur ? this._t / this._dur : 1; }
  timeScale(v) { if (v == null) return this._ts; this._ts = v; return this; }
  isActive() { return !this._paused && !this._killed && !this._completed; }
  play() { if (this._killed) return this; this._paused = false; active.add(this); wake(); return this; }
  pause() { this._paused = true; active.delete(this); return this; }
  seek(t) { this.render(typeof t === 'string' ? this.labels[t] ?? 0 : t); return this; }
  // resolve with undefined: resolving with `this` (a thenable) would deadlock the promise
  kill() { this._killed = true; active.delete(this); this._resolve?.(); return this; }
  then(res, rej) { return this._promise.then(res, rej); }

  _advance(dt) {
    if (this._paused || this._killed) return;
    this.render(this._t + dt * this._ts);
    if (this._t >= this._dur) this._finish();
  }

  _finish() {
    if (this._completed) return;
    this._completed = true;
    active.delete(this);
    try { this.onComplete?.(); } catch (e) { console.error(e); }
    this._resolve();
  }

  render(t) {
    this._t = Math.max(0, Math.min(t, this._dur));
    for (const c of this.children) {
      const local = this._t - c.start;
      if (c.call) { if (local >= 0 && !c.fired) { c.fired = true; try { c.call(); } catch (e) { console.error(e); } } continue; }
      if (c.tl) { if (local >= 0) c.tl.render(local); continue; }
      if (local < 0 || (c.done && this._t >= this._lastT)) continue;
      if (!c.started) { c.started = true; c.onStart?.(); }
      const p = c.dur ? Math.min(1, local / c.dur) : 1;
      c.render(p);
      if (p >= 1 && !c.done) { c.done = true; c.onComplete?.(); }
    }
    this._lastT = this._t;
    this.onUpdate?.(this._t);
  }
}

export function createTimeline(opts = {}, { useGsap = false } = {}) {
  if (useGsap && typeof window !== 'undefined' && window.gsap) return window.gsap.timeline(opts);
  return new Timeline(opts);
}

/** One-off tween helper, returns the timeline (thenable). */
export function tween(targets, vars) { return new Timeline().to(targets, vars, 0); }
