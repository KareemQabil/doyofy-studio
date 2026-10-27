/**
 * Studio — the canonical "Invitation Studio — full interactive flow", productionized.
 *
 * Owns: the 390×844 virtual stage (scaled to any viewport), the canonical state machine, and the
 * composition of the independent layers: card (CardRegistry), scene (SceneRegistry, best renderer
 * with fallback), pages (PageRegistry), finale (FinaleRegistry), audio (AudioRegistry) and the
 * card/scene switcher. Content comes only from InvitationData (data/derive.js).
 *
 * Changing the card re-renders card surfaces only; changing the scene swaps the scene renderer
 * only; replay tears the run down (timers, listeners, renderers) and starts clean.
 */
import { CardRegistry, SceneRegistry, PageRegistry, FinaleRegistry, RevealRegistry, AudioRegistry } from '../engine/registries.js';
import { StateMachine } from '../engine/StateMachine.js';
import { AudioEngine } from '../engine/AudioEngine.js';
import { detectQuality, tierAtLeast } from '../engine/Quality.js';
import { deriveContent, countdown } from '../data/derive.js';
import { STRINGS as T } from '../data/strings.js';
import { PAGE_ORDER } from '../pages/index.js';
import { SCENE_AMBIENCE } from '../audio/index.js';
import { LocalRSVPAdapter } from '../engine/rsvp.js';
import { studioMarkup, ICON } from './markup.js';
import { renderSwitcher } from './switcher.js';

const STAGE_W = 390, STAGE_H = 844;
const e = (v) => String(v ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const mix = (hex, amt) => {
  const n = parseInt(hex.replace('#', ''), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const tg = amt < 0 ? 0 : 255, k = Math.abs(amt);
  r = Math.round(r + (tg - r) * k); g = Math.round(g + (tg - g) * k); b = Math.round(b + (tg - b) * k);
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
};

export class Studio {
  /**
   * @param {object} opts
   *   invitation  InvitationData (data/invitation.js shape)
   *   card, scene ids; start = intro|card|pages|rsvp|done
   *   experience  { dimension: '3d' | '2d', motion: 'animated' | 'static' } — what the customer chose in the wizard.
   *               3d = best renderer per scene (Three.js where a scene has one), 2d = canonical illustrated renderers;
   *               static = no intro, no idle motion, frozen WebGL frame, fades instead of travel.
   *   embedded    render inside a sized container (wizard preview) instead of the full viewport
   *   showSwitcher  the authoring card/scene chooser (off for guests and inside the wizard)
   *   muted       start with sound off (wizard preview)
   *   guest       (platform) the invitation party from a personal link: { name, nameLocked, maxGuests, attending, guests }
   *               — prefills the RSVP and bounds the guest count by the party's allowance
   *   doneAction  (platform) an extra button on the thank-you screen: { ar, en, onClick }
   */
  constructor(host, { invitation, card = 'wine', scene = 'candlelit', start = 'intro', assetBase = 'assets/', rsvp, experience = null, embedded = false, showSwitcher = true, muted = false, params = new URLSearchParams(location.search), guest = null, doneAction = null } = {}) {
    this.host = host;
    this.params = params;
    this.quality = detectQuality(params);
    this.experience = experience || { dimension: this.quality.renderer === 'dom' ? '2d' : '3d', motion: this.quality.reducedMotion ? 'static' : 'animated' };
    if (experience) {
      if (experience.dimension === '2d') this.quality.renderer = 'dom';
      if (experience.motion === 'static') this.quality.reducedMotion = true;
    }
    this.quality.static = this.experience.motion === 'static';
    this.embedded = embedded; this.showSwitcher = showSwitcher; this.startMuted = muted;
    this.guest = guest;
    this.doneAction = doneAction;
    this.data = this._derive(invitation);
    this.assetBase = assetBase;
    this.cardId = CardRegistry.has(params.get('card')) ? params.get('card') : card;
    this.sceneId = SceneRegistry.has(params.get('scene')) ? params.get('scene') : scene;
    this.startAt = params.get('start') || start;
    this.reveal = RevealRegistry.get('depth-arrival');
    this.finale = FinaleRegistry.get('envelope');
    this.audio = new AudioEngine({ base: assetBase });
    this.audio.usePack(AudioRegistry.get('studio'));
    this.rsvpAdapter = rsvp || new LocalRSVPAdapter();
    this.cleanups = [];
    this.debug = { sceneRenderer: null, sceneErrors: [], states: [] };
    this._build();
  }

  _derive(invitation) {
    const d = deriveContent(invitation);
    if (this.guest?.maxGuests) d.rsvp = { ...d.rsvp, maxGuests: this.guest.maxGuests, defaultGuests: Math.min(d.rsvp.defaultGuests ?? 2, this.guest.maxGuests) };
    return d;
  }

  // ---------------------------------------------------------------- build (once)
  _build() {
    const host = this.host;
    host.classList.add('host');
    host.classList.toggle('rm', this.quality.reducedMotion);
    host.classList.toggle('embedded', this.embedded);
    host.classList.toggle('static', this.quality.static);
    host.dataset.experience = `${this.experience.dimension}-${this.experience.motion}`;
    host.dataset.tier = this.quality.tier;
    host.innerHTML = studioMarkup();
    const $ = (s) => host.querySelector(s);
    this.el = {
      frame: $('.st-frame'), st: $('.st'), layer: $('.st-layer'), hostScene: $('.host-scene'),
      tilt: $('.st-tilt'), face: $('.st-face-slot'), back: $('.st-back'), cardBtn: $('.st-cardbtn'),
      edges: [...host.querySelectorAll('.st-edge')], sheet: $('.st-sheet'), page: $('.st-page'), dots: $('.st-dots'),
      mono: $('.st-sheet-mono'), env: $('.st-env'), credit: $('.st-credit'), done: $('.st-done'),
      ctrls: $('.st-ctrls'), swSlot: $('.st-switch-slot'), soundBtn: $('[data-act="sound"]'), swBtn: $('[data-act="switcher"]'),
    };
    const c = this.data.c;
    $('.bar-date').textContent = c.dateNum;
    $('.bar-city').textContent = c.cityEnU;
    host.querySelectorAll('.seal-mono').forEach((t) => { t.textContent = `${c.monoA} ${c.monoB}`; });

    this._fit();
    const ro = new ResizeObserver(() => this._fit());
    ro.observe(host);
    this.cleanups.push(() => ro.disconnect());

    if (!this.showSwitcher) this.el.swBtn.remove();
    if (this.doneAction) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'st-cta st-dl st-e5'; b.dataset.act = 'done-action';
      b.style.cssText = 'margin-top: 32px; background: #F4EAE0; color: #2A1418; border-color: #F4EAE0';
      b.innerHTML = `<span class="ar" style="font-size: 15px">${e(this.doneAction.ar)}</span>${this.doneAction.en ? `<span dir="ltr" style="font-size: 14px; font-style: italic">${e(this.doneAction.en)}</span>` : ''}`;
      const replayBtn = this.el.done.querySelector('[data-act="replay"]');
      this.el.done.insertBefore(b, replayBtn);
      replayBtn.style.marginTop = '12px';
    }
    if (this.startMuted) this.toggleSound();
    this._wireInput();
    this._applyCard();
    this._mountScene();
    this._run(this.startAt);
  }

  /** contain-fit the 390×844 virtual stage into the host and expose its rect to overlays/renderers */
  _fit() {
    const W = this.host.clientWidth, H = this.host.clientHeight;
    const s = Math.min(W / STAGE_W, H / STAGE_H);
    const left = (W - STAGE_W * s) / 2, top = (H - STAGE_H * s) / 2;
    this.stageRect = { left, top, width: STAGE_W * s, height: STAGE_H * s, scale: s, viewW: W, viewH: H };
    const st = this.host.style;
    st.setProperty('--s', s); st.setProperty('--cover', Math.max(W / STAGE_W, H / STAGE_H)); st.setProperty('--st-left', `${left}px`); st.setProperty('--st-top', `${top}px`);
    st.setProperty('--st-right', `${left + STAGE_W * s}px`); st.setProperty('--st-bottom', `${top + STAGE_H * s}px`);
    this.el.frame.style.transform = `translate(${left}px, ${top}px) scale(${s})`;
    this.scene?.resize?.(this.stageRect);
  }

  // ---------------------------------------------------------------- run (per play-through)
  _run(startAt) {
    this.page = startAt === 'rsvp' ? 4 : 0;
    const g = this.guest;
    this.rsvp = {
      name: g?.name ?? '', locked: !!g?.nameLocked, attending: g?.attending ?? null,
      guests: Math.min(this.data.rsvp.maxGuests, Math.max(this.data.rsvp.minGuests ?? 1, g?.guests ?? this.data.rsvp.defaultGuests ?? 2)),
      tried: false, sent: false, submitting: false, error: '',
    };
    this.nx = 0; this.ny = 0;
    const noIntro = startAt !== 'intro' || this.quality.reducedMotion;
    this.el.st.classList.toggle('no-intro', noIntro);
    this.host.classList.toggle('no-intro', noIntro);
    this._renderCredit();
    this.sm?.destroy();
    this.sm = new StateMachine({
      timing: { ...this.reveal.timing, ...this.finale.timing },
      onEnter: (s, from, via) => this._onState(s, from, via),
    });
    const startState = { intro: noIntro ? 'card' : 'intro', card: 'card', pages: 'pages', rsvp: 'pages', 'thank-you': 'done', done: 'done' }[startAt] || 'intro';
    this.sm.start(startState);
  }

  _renderCredit() {
    const c = this.data.c, couple = !!c.arB;
    const ar = couple ? `${e(c.arA)} و ${e(c.arB)}` : e(c.arA);
    const en = couple ? [c.enAU, c.enBU].filter(Boolean).map(e).join(' &amp; ') : e(c.enAU);
    this.el.credit.innerHTML = `<span class="fx-foil" style="font-family: ${this.theme.fAr}; font-size: ${couple ? 58 : Math.min(58, Math.max(30, Math.round(420 / Math.max(1, [...c.arA].length))))}px; line-height: 1.45; text-align: center">${ar}</span>
      ${en ? `<span dir="ltr" style="font-size: 12px; letter-spacing: 0.42em; color: #E3C58C; margin-top: 4px">${en}</span>` : ''}
      <span dir="ltr" style="font-size: 11px; letter-spacing: 0.34em; color: rgba(243,217,160,.7); margin-top: 18px">${couple ? T.honour : T.honourSingle}</span>`;
  }

  _onState(state, from, via) {
    this.debug.states.push([state, Math.round(performance.now())]);
    const cls = 's-' + state;
    for (const el of [this.el.st, this.host]) {
      el.className = el.className.replace(/\bs-[a-z]+\b/g, '').trim() + ' ' + cls;
    }
    this.host.dataset.state = state;
    if (state === 'intro') this.introT0 = performance.now();
    this.scene?.setStage?.(state, from);
    clearInterval(this.clock); clearTimeout(this.sealTimer);
    if (state !== 'card' && state !== 'intro') this._setPointer(0, 0);
    switch (state) {
      case 'card':
        this.el.cardBtn.disabled = false;
        this.el.sheet.inert = true;
        if (from === 'pages') { this.audio.stopMusic(); requestAnimationFrame(() => this.el.cardBtn.focus({ preventScroll: true })); }
        break;
      case 'opening':
        this.el.cardBtn.disabled = true;
        this._closeSwitcher();
        break;
      case 'pages':
        if (from === 'opening') this.page = 0;   // canonical: opening the card always starts at the Invitation page
        this.el.cardBtn.disabled = true;
        this.el.sheet.inert = false;
        this._renderPage(false);
        this.audio.startMusic();
        requestAnimationFrame(() => this.el.sheet.focus({ preventScroll: true }));
        break;
      case 'pack':
        this.el.sheet.inert = true;
        this.audio.stopMusic(); this.audio.duckAmbience(0.3);
        this.audio.emit('pack');
        break;
      case 'seal':
        this.sealTimer = setTimeout(() => this.audio.emit('seal'), this.finale.sealImpactAt);
        break;
      case 'fly': this.audio.emit('fly'); break;
      case 'done':
        this._renderDone();
        this.audio.emit('done');
        setTimeout(() => this.host.querySelector('.st-done [data-act="replay"]')?.focus({ preventScroll: true }), 1950);
        break;
      default:
        this.el.cardBtn.disabled = true;
        this.el.sheet.inert = true;
    }
  }

  // ---------------------------------------------------------------- card
  get theme() { return CardRegistry.get(this.cardId).theme; }

  _applyCard() {
    const card = CardRegistry.get(this.cardId);
    const t = card.theme;
    const c = this.data.c;
    this.el.face.innerHTML = card.render(c);
    const accDark = mix(t.accent, -0.35), accLight = mix(t.accent, 0.35);
    this.el.edges.forEach((el) => {
      const v = el.classList.contains('st-el') || el.classList.contains('st-er');
      el.style.background = `linear-gradient(${v ? '180deg' : '90deg'}, ${accDark}, ${accLight} 50%, ${accDark})`;
    });
    this.el.back.style.background = t.env;
    this.el.back.innerHTML = `<div style="position: absolute; inset: 12px; border: 1px solid ${t.accent}; border-radius: 6px; opacity: 0.8"></div>
      <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px">
        <div style="width: 120px; height: 120px; border-radius: 50%; border: 1px solid ${t.accent}; display: flex; align-items: center; justify-content: center">
          <span class="fx-foil" style="font-family: ${t.fAr}; font-size: 48px; line-height: 1">${e(c.monoA)} ${e(c.monoB)}</span>
        </div>
        <span dir="ltr" style="font-size: 12px; letter-spacing: 0.34em; color: #F3D9A0">${e(c.dateNum)}</span>
      </div>`;
    // invitation sheet + envelope colours
    const s = this.el.st.style;
    for (const [k, v] of Object.entries({ paper: t.paper, ink: t.ink, muted: t.muted, accent: t.accent, atext: t.aText, env: t.env, far: t.fAr, envmid: mix(t.env, -0.12), envdark: mix(t.env, -0.4), envlight: mix(t.env, 0.14) })) s.setProperty('--' + k, v);
    this.el.mono.textContent = c.arB ? `${c.monoA} · ${c.monoB}` : `${c.monoA}`;
    const mLatin = c.arB ? [c.enA, c.enB].filter(Boolean).map(e).join(' &amp; ') : e(c.enA);
    this.host.querySelector('.st-mcard').innerHTML = `<span style="font-family: ${t.fAr}; font-size: 28px; line-height: 1.35; text-align: center">${c.arB ? `${e(c.arA)} و ${e(c.arB)}` : e(c.arA)}</span>
      ${mLatin ? `<span dir="ltr" style="font-size: 14px; font-style: italic; color: ${t.muted}">${mLatin}</span>` : ''}
      <span dir="ltr" style="font-size: 10px; letter-spacing: 0.3em; color: ${t.aText}; margin-top: 6px">${e(c.dateNum)}</span>`;
    this.host.dataset.card = this.cardId;
    if (this.sm?.state === 'pages') this._renderPage(false, true);
    if (this.sm?.state === 'done') this._renderDone();
  }

  /** live content update (wizard details step): re-derive and refresh every surface that shows content */
  setContent(invitation) {
    this.data = this._derive(invitation);
    const c = this.data.c, $ = (q) => this.host.querySelector(q);
    $('.bar-date').textContent = c.dateNum;
    $('.bar-city').textContent = c.cityEnU;
    this.host.querySelectorAll('.seal-mono').forEach((t) => { t.textContent = `${c.monoA} ${c.monoB}`; });
    this.rsvp.guests = Math.min(this.rsvp.guests, this.data.rsvp.maxGuests);
    this._applyCard();
    if (this.sm?.state === 'intro') this._renderCredit();
  }

  setCard(id) {
    if (!CardRegistry.has(id) || id === this.cardId) return;
    this.cardId = id;
    this._applyCard();
    this._syncSwitcher();
    this.scene?.setCard?.(CardRegistry.get(id));
  }

  // ---------------------------------------------------------------- scene (renderer selection + fallback)
  /**
   * Progressive mount: the canonical DOM renderer goes up immediately (the stage is never blank),
   * then heavier renderers are tried best-first; the first that loads within its timeout crossfades
   * in over the DOM scene. Any failure leaves the DOM scene in place.
   */
  async _mountScene() {
    const token = (this._sceneToken = (this._sceneToken || 0) + 1);
    const stale = () => token !== this._sceneToken;
    const def = SceneRegistry.get(this.sceneId, 'candlelit');
    const ok = (r) => {
      if (r.mode === 'dom') return true;
      if (r.requires?.includes('webgl') && !this.quality.webgl) return false;
      if (this.quality.renderer === 'dom') return false;
      if (this.quality.renderer !== 'auto' && this.quality.renderer !== r.mode) return false;
      return tierAtLeast(this.quality.tier, r.minQuality);
    };
    const ctx = {
      quality: this.quality, assetBase: this.assetBase, stageRect: () => this.stageRect,
      state: () => this.sm?.state, card: () => CardRegistry.get(this.cardId), reducedMotion: this.quality.reducedMotion,
      introStart: () => this.introT0 ?? null,
    };
    const dom = def.renderers.find((r) => r.mode === 'dom');
    const heavy = def.renderers.filter((r) => r.mode !== 'dom' && ok(r));
    if (heavy.length && !this.quality.webgl && heavy.every((r) => r.requires?.includes('webgl'))) this.debug.sceneErrors.push(`${def.id}: WebGL unavailable → DOM`);

    const domInst = await dom.mount(this.el.layer, ctx);
    if (stale()) return domInst.destroy();
    this._swapScene(domInst, def);

    for (const r of heavy) {
      this.host.dataset.loading = r.mode;
      try {
        const inst = await withTimeout(r.mount(this.el.hostScene, ctx), r.timeoutMs || 20000, `${def.id}/${r.mode}`);
        if (stale()) return inst.destroy();
        this._swapScene(inst, def);
        delete this.host.dataset.loading;
        return;
      } catch (err) {
        console.warn(`[scene] ${def.id} ${r.mode} renderer failed — keeping the DOM renderer`, err);
        this.debug.sceneErrors.push(`${def.id}/${r.mode}: ${err?.message || err}`);
      }
    }
    delete this.host.dataset.loading;
  }

  _swapScene(inst, def) {
    const old = this.scene;
    const fullBleed = inst.mode !== 'dom';
    this.scene = inst;
    this.host.dataset.renderer = inst.mode;
    this.host.dataset.scene = def.id;
    this.debug.sceneRenderer = `${def.id}:${inst.mode}`;
    inst.resize?.(this.stageRect);
    inst.setStage?.(this.sm?.state);
    inst.setPointer?.(this.nx, this.ny);
    if (fullBleed) {
      // crossfade: canvas fades in, the DOM scene + ambient echo fade out, then are destroyed
      this.host.classList.add('full-bleed');
      inst.el.classList.add('scene-in');
      const amb = this.ambient; this.ambient = null;
      if (old) old.el.classList.add('scene-out');
      amb?.classList.add('scene-out');
      setTimeout(() => { old?.destroy(); amb?.remove(); }, 1000);
    } else {
      this.host.classList.remove('full-bleed');
      old?.destroy();
      this._mountAmbient(inst);
    }
    this.audio.setAmbience(SCENE_AMBIENCE[def.id] || null);
  }

  /** DOM scenes are composed for 390×844: beyond the stage (desktop/ultrawide) show a soft, darkened
   *  cover-scaled echo of the same scene instead of flat bars. */
  _mountAmbient(inst) {
    this.ambient?.remove();
    this.el.hostScene.querySelectorAll('.scene-ambient').forEach((n) => n.remove());
    const amb = inst.el.cloneNode(true);
    amb.classList.add('scene-ambient');
    this.el.hostScene.prepend(amb);
    this.ambient = amb;
  }

  setScene(id) {
    if (!SceneRegistry.has(id) || id === this.sceneId) return;
    this.sceneId = id;
    this._syncSwitcher();
    this._mountScene();
  }

  // ---------------------------------------------------------------- pages
  _renderPage(leaving, instant = false) {
    const id = PAGE_ORDER[this.page];
    const v = { t: this.theme, c: this.data.c, copy: this.data.copy, program: this.data.program, calHref: this.data.calHref, mapHref: this.data.mapHref, rsvp: this.rsvp };
    this.el.page.innerHTML = PageRegistry.get(id).render(v);
    this.el.page.classList.toggle('instant', instant);
    this.el.page.dataset.page = id;
    this.el.dots.innerHTML = PAGE_ORDER.map((p, i) => `<button type="button" class="st-dotbtn ${i === this.page ? 'on' : ''}" data-go="${i}" aria-label="Go to ${T.pageLabels[i]}" aria-current="${i === this.page ? 'page' : 'false'}"><span class="st-dot"></span></button>`).join('');
    this.host.querySelector('[data-act="prev"]').disabled = this.page === 0;
    this.host.querySelector('[data-act="next"]').disabled = this.page === 4;
    if (id === 'date') this._tickCountdown();
    if (id === 'rsvp') this._syncRsvp();
  }

  _tickCountdown() {
    const paint = () => {
      const cd = countdown(this.data.start);
      for (const k of ['days', 'h', 'm', 's']) { const el = this.el.page.querySelector(`[data-cd="${k}"]`); if (el) el.textContent = cd[k]; }
    };
    paint();
    clearInterval(this.clock);
    this.clock = setInterval(() => { if (this.sm.state === 'pages' && PAGE_ORDER[this.page] === 'date') paint(); else clearInterval(this.clock); }, 1000);
  }

  go(n) {
    if (this.sm.state !== 'pages' || n < 0 || n > 4 || n === this.page || this.leaving) return;
    this.audio.emit('page');
    this.leaving = true;
    this.el.page.classList.add('leaving');
    this._leaveTimer = setTimeout(() => {
      this.leaving = false;
      this.page = n;
      this.el.page.classList.remove('leaving');
      this._renderPage();
    }, this.sm.timing.pageLeave);
  }

  // ---------------------------------------------------------------- RSVP
  _syncRsvp() {
    const r = this.rsvp, t = this.theme, root = this.el.page;
    root.querySelectorAll('[data-attend]').forEach((b) => {
      const on = b.dataset.attend === r.attending;
      b.setAttribute('aria-pressed', String(on));
      b.style.background = on ? t.ink : 'transparent';
      b.style.color = on ? t.paper : t.ink;
    });
    const out = root.querySelector('.rsvp-guests'); if (out) out.textContent = r.guests;
    const [dn, up] = root.querySelectorAll('[data-guests]');
    if (dn) dn.disabled = r.guests <= this.data.rsvp.minGuests;
    if (up) up.disabled = r.guests >= this.data.rsvp.maxGuests;
    const need = root.querySelector('.rsvp-need');
    if (need) need.classList.toggle('is-on', r.tried && (!r.name.trim() || !r.attending));
    const input = root.querySelector('#st-name');
    if (input) input.setAttribute('aria-invalid', String(r.tried && !r.name.trim()));
    const submit = root.querySelector('.rsvp-submit');
    if (submit) submit.disabled = r.submitting;
    const error = root.querySelector('.rsvp-save-error');
    if (error) { error.hidden = !r.error; error.textContent = r.error; }
  }

  async submit() {
    if (this.sm.state !== 'pages' || this.rsvp.sent || this.rsvp.submitting) return;
    const r = this.rsvp;
    if (!r.name.trim() || !r.attending) { r.tried = true; this._syncRsvp(); return; }
    r.submitting = true;
    r.error = '';
    this._syncRsvp();
    try {
      const receipt = await this.rsvpAdapter.submit({ name: r.name.trim(), attending: r.attending === 'yes', guests: r.attending === 'yes' ? r.guests : 0 });
      if (this.rsvp !== r || this.sm.state !== 'pages') return;
      if (receipt?.ok === true) { r.receipt = receipt; r.sent = true; this.sm.send('submit'); return; }
      r.error = receipt?.error || 'تعذر حفظ الرد. أعد المحاولة.';
    } catch (err) { r.error = err instanceof Error ? err.message : 'تعذر حفظ الرد. أعد المحاولة.'; }
    if (this.rsvp === r && this.sm.state === 'pages') { r.submitting = false; this._syncRsvp(); }
  }

  _renderDone() {
    const r = this.rsvp, c = this.data.c, declined = r.attending === 'no';
    const th = declined ? T.thanks.no : T.thanks.yes;
    const q = (s) => this.el.done.querySelector(s);
    q('.done-ar').textContent = th.ar; q('.done-ar').style.fontFamily = this.theme.fAr;
    q('.done-en').textContent = th.en;
    const name = r.name.trim().toUpperCase();
    q('.done-who').textContent = name ? (declined ? name : `${name} · ${r.guests} ${r.guests === 1 ? 'GUEST' : 'GUESTS'}`) : `${[c.enAU, c.arB ? c.enBU : ''].filter(Boolean).join(' & ') || c.arA} · ${c.dateShort}`;
  }

  // ---------------------------------------------------------------- input
  _wireInput() {
    const on = (el, ev, fn, o) => { el.addEventListener(ev, fn, o); this.cleanups.push(() => el.removeEventListener(ev, fn, o)); };
    const host = this.host;

    // first meaningful gesture unlocks audio (never audible before)
    const unlock = () => { if (this.audio.unlock()) { this.audio.setAmbience(SCENE_AMBIENCE[this.sceneId] || null); if (this.sm.state === 'pages') this.audio.startMusic(); } };
    on(host, 'pointerdown', unlock, { capture: true });
    on(host, 'keydown', unlock, { capture: true });

    // pointer tilt + parallax (intro/card only, as canonical)
    on(host, 'pointermove', (ev) => {
      const st = this.sm.state;
      if ((st !== 'card' && st !== 'intro') || this.quality.reducedMotion || ev.pointerType === 'touch') return;
      const R = this.stageRect;
      const nx = Math.max(-0.5, Math.min(0.5, (ev.clientX - R.left) / R.width - 0.5));
      const ny = Math.max(-0.5, Math.min(0.5, (ev.clientY - R.top) / R.height - 0.5));
      this._pending = [nx, ny];
      if (this._raf) return;
      this._raf = requestAnimationFrame(() => { this._raf = null; this._setPointer(...this._pending); });
    });
    on(host, 'pointerleave', () => this._setPointer(0, 0));

    on(host, 'click', (ev) => {
      const t = ev.target.closest('button, a');
      if (!t || !host.contains(t)) return;
      if (t === this.el.cardBtn) return this.openCard();
      const act = t.dataset.act;
      if (act === 'close') { this.audio.emit('click'); return this.sm.state === 'pages' && this.sm.send('close'); }
      if (act === 'next') return this.go(this.page + 1);
      if (act === 'prev') return this.go(this.page - 1);
      if (act === 'replay') { this.audio.emit('click'); return this.replay(); }
      if (act === 'done-action') { this.audio.emit('click'); return this.doneAction?.onClick(); }
      if (act === 'sound') return this.toggleSound();
      if (act === 'switcher') { this.audio.emit('click'); return this.swOpen ? this._closeSwitcher() : this._openSwitcher(); }
      if (t.dataset.go) return this.go(Number(t.dataset.go));
      if (t.dataset.attend) { this.audio.emit('choose'); this.rsvp.attending = t.dataset.attend; return this._syncRsvp(); }
      if (t.dataset.guests) { this.audio.emit('click'); const r = this.rsvp, d = this.data.rsvp; r.guests = Math.max(d.minGuests, Math.min(d.maxGuests, r.guests + Number(t.dataset.guests))); return this._syncRsvp(); }
      if (t.dataset.pickCard) { this.audio.emit('choose'); return this.setCard(t.dataset.pickCard); }
      if (t.dataset.pickScene) { this.audio.emit('choose'); return this.setScene(t.dataset.pickScene); }
    });
    on(host, 'input', (ev) => { if (ev.target.id === 'st-name') { this.rsvp.name = ev.target.value; if (this.rsvp.tried) this._syncRsvp(); } });
    on(host, 'submit', (ev) => { ev.preventDefault(); this.submit(); });

    // sheet gestures: vertical swipe (50 px), wheel (900 ms debounce) — canonical thresholds
    const sheet = this.el.sheet;
    on(sheet, 'pointerdown', (ev) => {
      if (ev.isPrimary === false || ev.button !== 0) { this._down = null; return; }
      if (ev.target.closest?.('button, a, input, textarea, select, [contenteditable], [data-gesture-ignore]')) { this._down = null; return; }
      this._down = { id: ev.pointerId, x: ev.clientX, y: ev.clientY };
    });
    on(sheet, 'pointerup', (ev) => {
      if (!this._down || ev.pointerId !== this._down.id) return;
      const down = this._down;
      this._down = null;
      if (this.sm.state !== 'pages') return;
      const s = this.stageRect.scale;
      const dx = (ev.clientX - down.x) / s, dy = (ev.clientY - down.y) / s;
      if (Math.abs(dy) > 50 && Math.abs(dy) > Math.abs(dx)) this.go(this.page + (dy < 0 ? 1 : -1));
    });
    on(sheet, 'pointercancel', (ev) => { if (this._down?.id === ev.pointerId) this._down = null; });
    on(sheet, 'wheel', (ev) => {
      if (this.sm.state !== 'pages' || Math.abs(ev.deltaY) < 24) return;
      if (ev.target.closest?.('button, a, input, textarea, select, [contenteditable], [data-gesture-ignore]')) return;
      const now = Date.now();
      if (this._lastWheel && now - this._lastWheel < 900) return;
      this._lastWheel = now;
      this.go(this.page + (ev.deltaY > 0 ? 1 : -1));
    }, { passive: true });

    // keyboard
    on(window, 'keydown', (ev) => {
      if (ev.target.closest?.('input, textarea, select')) return;
      if (this.embedded && !host.contains(document.activeElement)) return; // inside the wizard: only when the preview has focus
      if (ev.key === 'Escape') {
        if (this.swOpen) return this._closeSwitcher();
        if (this.sm.state === 'pages') return this.sm.send('close');
      }
      if (this.sm.state !== 'pages') return;
      if (['ArrowDown', 'PageDown'].includes(ev.key)) { ev.preventDefault(); this.go(this.page + 1); }
      if (['ArrowUp', 'PageUp'].includes(ev.key)) { ev.preventDefault(); this.go(this.page - 1); }
    });
  }

  _setPointer(nx, ny) {
    this.nx = nx; this.ny = ny;
    const r1 = (v) => Math.round(v * 10) / 10;
    this.el.tilt.style.transform = `rotateX(${r1(-ny * 16)}deg) rotateY(${r1(nx * 20)}deg)`;
    this.scene?.setPointer?.(r1(nx), r1(ny));
    if (this.ambient) for (const [k, v] of Object.entries(this.scene?.el?.style ? { '--pf': this.scene.el.style.getPropertyValue('--pf'), '--pm': this.scene.el.style.getPropertyValue('--pm'), '--pn': this.scene.el.style.getPropertyValue('--pn') } : {})) this.ambient.style.setProperty(k, v);
  }

  openCard() {
    if (this.sm.state !== 'card') return;
    this.audio.unlock();
    this.audio.emit('open');
    this.sm.send('open');
  }

  toggleSound() {
    const on = !this.audio.enabled;
    this.audio.setEnabled(on);
    if (on && this.sm.state === 'pages') this.audio.startMusic();
    const b = this.el.soundBtn;
    b.innerHTML = on ? ICON.soundOn : ICON.soundOff;
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', on ? 'Mute music' : 'Play music');
  }

  replay() {
    clearTimeout(this._leaveTimer); clearTimeout(this.sealTimer); clearInterval(this.clock);
    this.leaving = false;
    this.el.page.classList.remove('leaving');
    this.audio.stopMusic();
    this._closeSwitcher();
    // canonical: unmount for 40 ms, then restart at intro (CSS animations restart from frame 0)
    this.el.st.style.visibility = 'hidden';
    this.host.classList.add('replaying');
    this.scene?.setStage?.('reset');
    this._replayTimer = setTimeout(() => {
      this.el.st.style.visibility = '';
      this.host.classList.remove('replaying');
      this.el.page.innerHTML = '';
      this._restartAnimations();
      this._run('intro');
    }, 40);
  }

  _restartAnimations() {
    // re-insert the stage subtree so every CSS animation restarts at t=0 (React remount equivalent)
    const st = this.el.st, parent = st.parentNode, next = st.nextSibling;
    parent.removeChild(st); void parent.offsetWidth; parent.insertBefore(st, next);
  }

  // ---------------------------------------------------------------- switcher
  _openSwitcher() {
    this.swOpen = true;
    this.el.swSlot.innerHTML = renderSwitcher({ cards: CardRegistry.list(), scenes: SceneRegistry.list(), cardId: this.cardId, sceneId: this.sceneId, debug: this.params.has('author') ? this.debug : null });
    this.el.swBtn.setAttribute('aria-expanded', 'true');
    // centre the active chips inside their own rows (scrollIntoView would also scroll the host and shift the stage)
    this.el.swSlot.querySelectorAll('.st-chiprow').forEach((row) => { const on = row.querySelector('.st-chip.on'); if (on) row.scrollLeft = on.offsetLeft - (row.clientWidth - on.offsetWidth) / 2; });
  }
  _closeSwitcher() {
    if (!this.swOpen) return;
    this.swOpen = false;
    this.el.swSlot.innerHTML = '';
    this.el.swBtn.setAttribute('aria-expanded', 'false');
  }
  _syncSwitcher() { if (this.swOpen) { const sc = [...this.el.swSlot.querySelectorAll('.st-chiprow')].map((r) => r.scrollLeft); this._openSwitcher(); this.el.swSlot.querySelectorAll('.st-chiprow').forEach((r, i) => { r.scrollLeft = sc[i]; }); } }

  destroy() {
    this.sm?.destroy(); this.scene?.destroy(); this.audio.destroy();
    clearTimeout(this._leaveTimer); clearTimeout(this.sealTimer); clearTimeout(this._replayTimer); clearInterval(this.clock);
    this.cleanups.forEach((f) => f());
    this.host.innerHTML = '';
  }
}

function withTimeout(p, ms, label) {
  let timedOut = false;
  // a renderer that finishes after its timeout is destroyed instead of leaking behind the fallback
  p.then((inst) => { if (timedOut) inst?.destroy?.(); }, () => {});
  return Promise.race([p, new Promise((_, rej) => setTimeout(() => { timedOut = true; rej(new Error(`${label} timed out after ${ms} ms`)); }, ms))]);
}
