/**
 * Customer wizard — the front door of the Studio.
 *
 *   1 Experience   3D or 2D · animated or static
 *   2 Card         the 10 canonical designs, rendered live with the customer's names
 *   3 Scene        settings available for the chosen experience, shown with the chosen card on them
 *   4 Details      names, date/time/time zone, venue, message, program, RSVP limit
 *   5 Share        summary, guest link, full-screen preview
 *
 * A live Studio preview (the real product, embedded) updates as choices change: card/scene/content
 * update in place; changing the experience rebuilds the preview. The draft is kept in localStorage
 * (per-browser convenience only).
 *
 * Platform mode (Doyofy): `new Wizard(root, { platform })` — opt-in, standalone behaviour unchanged.
 *   - state comes from / goes to the platform (`initial`, `onChange`) — no localStorage draft
 *   - event-owned data (date, time, venue) is read-only in Details, with "edit event details"
 *   - names on the card are overrides of the event names (blank = use the event's names)
 *   - step 5 is "Publish": status, publish, preview as guest, guest link — driven by the platform
 */
import { CardRegistry, SceneRegistry } from '../engine/registries.js';
import { CARD_DEFS } from '../cards/index.js';
import { SCENES, SCENE_DEFS, SCENE_ROOT } from '../scenes/css/generated.js';
import { SCENE_VALS } from '../scenes/css/vals.js';
import { deriveContent } from '../data/derive.js';
import { sampleInvitation } from '../data/invitation.js';
import { Studio } from '../studio/Studio.js';
import { DEFAULT_CONFIG, guestLink, TIME_ZONES, offsetFor, splitStart } from './config.js';

const e = (v) => String(v ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const DRAFT_KEY = 'invitation-studio:draft';

const CARD_AR = { lace: 'دانتيل عاجي', wine: 'نبيذي وذهبي', emerald: 'زمرّد آرت ديكو', sage: 'أغصان المريمية', blush: 'ألوان مائية وردية', midnight: 'نجوم منتصف الليل', arabesque: 'أرابيسك', minimal: 'بسيط عصري', terracotta: 'شمس التراكوتا', clay: 'صلصال باستيل' };
const SCENE_AR = { candlelit: 'قاعة الشموع', marble: 'صباح رخامي', garden: 'ليلة في الحديقة', desert: 'غروب الصحراء', starry: 'ليلة النجوم', silk: 'ستائر الحرير', petals: 'بتلات طائرة', clay: 'مسرح الصلصال', sea: 'بحر مقمر', palace: 'أقواس القصر' };

const STEPS = [
  { id: 'experience', ar: 'التجربة', en: 'Experience' },
  { id: 'card', ar: 'البطاقة', en: 'Card' },
  { id: 'scene', ar: 'المكان', en: 'Setting' },
  { id: 'details', ar: 'التفاصيل', en: 'Details' },
  { id: 'share', ar: 'المشاركة', en: 'Share' },
];

const PLATFORM_LAST = { id: 'share', ar: 'النشر', en: 'Publish' };

const has3D = (scene) => scene.renderers.some((r) => r.mode === 'three');

// ------------------------------------------------------------------ form <-> InvitationData
function formFrom(inv) {
  const { date, time } = splitStart(inv.event.start);
  return {
    aAr: inv.couple.a.ar, aEn: inv.couple.a.en, bAr: inv.couple.b.ar, bEn: inv.couple.b.en,
    date, time, tz: inv.event.timeZone,
    venueAr: inv.venue.ar, venueEn: inv.venue.en, cityAr: inv.venue.city.ar, cityEn: inv.venue.city.en, mapUrl: inv.venue.mapUrl || '',
    msgAr: inv.copy.invitation.ar, msgEn: inv.copy.invitation.en,
    program: inv.program.map((p) => ({ ...p })),
    maxGuests: inv.rsvp.maxGuests,
  };
}

function invitationFrom(f) {
  const first = (s) => [...String(s || '').trim()][0] || '';
  const start = `${f.date}T${f.time}:00${offsetFor(f.tz, f.date, f.time)}`;
  const sameAsSample = start === sampleInvitation.event.start && f.tz === sampleInvitation.event.timeZone;
  return {
    id: `${(f.aEn || 'a').toLowerCase()}-${(f.bEn || 'b').toLowerCase()}-${f.date}`.replace(/[^a-z0-9-]/g, ''),
    locale: { primary: 'ar', secondary: 'en' },
    couple: {
      a: { ar: f.aAr.trim(), en: f.aEn.trim() || f.aAr.trim(), monogram: first(f.aAr), initial: first(f.aEn || f.aAr).toUpperCase() },
      b: { ar: f.bAr.trim(), en: f.bEn.trim() || f.bAr.trim(), monogram: first(f.bAr), initial: first(f.bEn || f.bAr).toUpperCase() },
    },
    event: { start, timeZone: f.tz, durationHours: 5 },
    venue: { ar: f.venueAr.trim(), en: f.venueEn.trim(), city: { ar: f.cityAr.trim(), en: f.cityEn.trim() }, mapUrl: f.mapUrl.trim() || null },
    copy: { invitation: { ar: f.msgAr.trim(), en: f.msgEn.trim() } },
    program: f.program.filter((p) => p.time && (p.ar || p.en)),
    rsvp: { minGuests: 1, maxGuests: Math.max(1, Math.min(20, Number(f.maxGuests) || 8)), defaultGuests: 2 },
    display: sameAsSample ? { ...sampleInvitation.display } : {},
  };
}

// ------------------------------------------------------------------ wizard
export class Wizard {
  constructor(root, { assetBase = 'assets/', platform = null, startStep = 0 } = {}) {
    this.root = root;
    this.assetBase = assetBase;
    this.platform = platform;
    if (platform) {
      const st = platform.initial;
      this.form = structuredClone(st.form);
      this.cfg = { v: 1, experience: { ...st.experience }, card: st.card, scene: st.scene, invitation: null };
      this.cfg.invitation = this._inv();
    } else {
      const draft = this._loadDraft();
      this.cfg = draft?.cfg || structuredClone(DEFAULT_CONFIG);
      this.form = draft?.form || formFrom(this.cfg.invitation);
    }
    this.step = Math.max(0, Math.min(STEPS.length - 1, Number(startStep) || 0));
    this.errors = {};
    this._ac = new AbortController();
    this._render();
    this._mountPreview();
    if (typeof matchMedia === 'function') {
      matchMedia('(max-width: 899px)').addEventListener('change', () => { if (!!this.studio !== this._wantPreview()) this._mountPreview(); }, { signal: this._ac.signal });
    }
  }

  /** Studio content for the current state */
  _inv() { return this.platform ? this.platform.toInvitation(this._state()) : invitationFrom(this.form); }
  _state() { return { experience: { ...this.cfg.experience }, card: this.cfg.card, scene: this.cfg.scene, form: structuredClone(this.form) }; }
  _steps() { return this.platform ? [...STEPS.slice(0, 4), PLATFORM_LAST] : STEPS; }

  /** re-render the current step (platform status changed) */
  refresh() { if (this.root.isConnected) this._renderStep(); }

  destroy() {
    clearTimeout(this._contentTimer);
    this._ac.abort();
    this._lookRO?.disconnect();
    this.studio?.destroy(); this.studio = null;
    this.fullStudio?.destroy(); this.fullStudio = null;
    this.root.innerHTML = '';
    this.root.className = '';
  }

  // ---------------------------------------------------------------- shell
  _render() {
    this.root.className = this.platform ? 'wz wz-platform' : 'wz';
    this.root.setAttribute('dir', 'rtl');
    this.root.setAttribute('lang', 'ar');
    this.root.innerHTML = `
      <svg class="wz-defs" width="0" height="0" aria-hidden="true" focusable="false">${CARD_DEFS.replace(/<\/?svg[^>]*>/g, '')}${SCENE_DEFS.replace(/<\/?svg[^>]*>/g, '')}</svg>
      <header class="wz-top">
        ${this.platform ? '<span class="wz-brand wz-brand-quiet"><span class="wz-brand-ar">تصميم الدعوة</span><span class="wz-brand-en" lang="en" dir="ltr">Invitation design</span></span>' : `<a class="wz-brand" href="#" aria-label="Invitation Studio — start">
          <svg class="wz-mark" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3 L25 15 L20 37 L15 15 Z" fill="currentColor"/><circle cx="20" cy="15" r="2.4" fill="var(--paper)"/></svg>
          <span class="wz-brand-ar">استوديو الدعوات</span><span class="wz-brand-en" lang="en" dir="ltr">Invitation Studio</span>
        </a>`}
        <nav class="wz-rail" aria-label="خطوات التصميم · Steps"><ol>${this._steps().map((s, i) => `
          <li><button type="button" class="wz-step" data-step="${i}"><span class="wz-num" aria-hidden="true">${'١٢٣٤٥'[i]}</span><span class="wz-step-ar">${s.ar}</span><span class="wz-step-en" lang="en">${s.en}</span></button></li>`).join('')}
        </ol></nav>
      </header>
      <main class="wz-body">
        <section class="wz-panel" tabindex="-1" aria-live="polite"></section>
        <aside class="wz-preview" aria-label="معاينة حية · Live preview">
          <div class="wz-preview-head">
            <span class="wz-preview-ar">معاينة حية</span><span class="wz-preview-en" lang="en" dir="ltr">Live preview — tap the card to open it</span>
            <button type="button" class="wz-preview-close" data-wz="hide-preview" aria-label="إغلاق المعاينة · Close preview">×</button>
          </div>
          <div class="wz-device"><div class="wz-screen"></div></div>
          <button type="button" class="wz-link" data-wz="replay-preview">أعيدوا العرض <span lang="en" dir="ltr">Replay</span></button>
        </aside>
      </main>
      <footer class="wz-bar">
        <button type="button" class="wz-btn wz-btn-ghost" data-wz="back">السابق <span lang="en" dir="ltr">Back</span></button>
        <button type="button" class="wz-btn wz-btn-quiet wz-only-mobile" data-wz="show-preview">معاينة <span lang="en" dir="ltr">Preview</span></button>
        <button type="button" class="wz-btn wz-btn-primary" data-wz="next">التالي <span lang="en" dir="ltr">Next</span></button>
      </footer>
      <div class="wz-full" hidden></div>`;
    this.el = {
      panel: this.root.querySelector('.wz-panel'), screen: this.root.querySelector('.wz-screen'), full: this.root.querySelector('.wz-full'),
      back: this.root.querySelector('[data-wz="back"]'), next: this.root.querySelector('[data-wz="next"]'),
    };
    const opt = { signal: this._ac.signal };
    this.root.addEventListener('click', (ev) => this._onClick(ev), opt);
    this.root.addEventListener('input', (ev) => this._onInput(ev), opt);
    this.root.addEventListener('change', (ev) => this._onInput(ev), opt);
    this._renderStep();
  }

  _renderStep(focus = false) {
    const STEPS_ = this._steps();
    const s = STEPS_[this.step];
    this.root.dataset.step = s.id;
    this.root.querySelectorAll('.wz-step').forEach((b, i) => {
      b.toggleAttribute('aria-current', i === this.step);
      if (i === this.step) b.setAttribute('aria-current', 'step');
      b.classList.toggle('done', i < this.step);
      b.disabled = i > this.step && !this._canReach(i);
    });
    this.el.panel.innerHTML = this[`_step_${s.id}`]();
    this.el.back.disabled = this.step === 0;
    this.el.next.hidden = this.step === STEPS_.length - 1;
    if (this.step === STEPS_.length - 2) this.el.next.innerHTML = this.platform ? 'التالي<span class="wz-hide-sm">: المراجعة والنشر</span> <span lang="en" dir="ltr">Review</span>' : 'جاهزة؟ لنشارك <span lang="en" dir="ltr">Finish</span>';
    else this.el.next.innerHTML = 'التالي <span lang="en" dir="ltr">Next</span>';
    if (focus) { this.el.panel.focus({ preventScroll: true }); this.el.panel.scrollTop = 0; window.scrollTo?.({ top: 0 }); }
    this._fitLookCards();
  }

  /** scale the live 300×420 card faces laid over the experience tiles to the tile size */
  _fitLookCards() {
    this._lookRO?.disconnect();
    const cards = [...this.el.panel.querySelectorAll('.wz-look-card')];
    if (!cards.length) return;
    const fit = () => cards.forEach((c) => { const s = c.firstElementChild; if (s) s.style.transform = `scale(${c.clientWidth / 300})`; });
    fit();
    this._lookRO = new ResizeObserver(fit);
    cards.forEach((c) => this._lookRO.observe(c));
  }

  _head(ar, en, lead) {
    return `<header class="wz-head"><h1 class="wz-h">${ar}</h1><p class="wz-h-en" lang="en" dir="ltr">${en}</p>${lead ? `<p class="wz-lead">${lead}</p>` : ''}</header>`;
  }

  // ---------------------------------------------------------------- step 1 · experience
  _step_experience() {
    const x = this.cfg.experience;
    // the tile photos were captured with the sample couple; the live card (real names, chosen design) is laid over them
    const liveCard = `<span class="wz-look-card" aria-hidden="true"><span class="wz-card-scale">${CardRegistry.get(this.cfg.card).render(deriveContent(this._inv()).c)}</span></span>`;
    const tile = (val, img, ar, en, dAr, dEn) => `
      <button type="button" class="wz-look ${x.dimension === val ? 'on' : ''}" data-dim="${val}" aria-pressed="${x.dimension === val}">
        <span class="wz-look-img"><img src="${this.assetBase}wizard/${img}.webp" alt="" loading="lazy">${liveCard}</span>
        <span class="wz-look-text"><span class="wz-look-ar">${ar}</span><span class="wz-look-en" lang="en" dir="ltr">${en}</span>
        <span class="wz-look-d">${dAr}</span><span class="wz-look-d en" lang="en" dir="ltr">${dEn}</span></span>
      </button>`;
    const move = (val, ar, en, dAr, dEn, glyph) => `
      <button type="button" class="wz-move ${x.motion === val ? 'on' : ''}" data-motion="${val}" aria-pressed="${x.motion === val}">
        <span class="wz-move-glyph" aria-hidden="true">${glyph}</span>
        <span><span class="wz-move-ar">${ar}</span> <span class="wz-move-en" lang="en" dir="ltr">${en}</span>
        <span class="wz-move-d">${dAr}</span><span class="wz-move-d en" lang="en" dir="ltr">${dEn}</span></span>
      </button>`;
    const animatedGlyph = '<svg viewBox="0 0 48 48"><rect x="15" y="9" width="18" height="26" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 38c6 3 26 3 32 0M10 31c-3-6-3-14 0-20M38 11c3 6 3 14 0 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
    const staticGlyph = '<svg viewBox="0 0 48 48"><rect x="15" y="9" width="18" height="26" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 40h24" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
    return `${this._head('كيف تبدو دعوتكم؟', 'How should your invitation look?')}
      <div class="wz-looks" role="group" aria-label="الشكل · Look">
        ${tile('3d', '3d-candlelit', 'ثلاثية الأبعاد', '3D', 'قاعة حقيقية بإضاءة الشموع، تتحرك مع حركة اليد.', 'A real candlelit room with light and depth.')}
        ${tile('2d', '2d-candlelit', 'رسوم ثنائية الأبعاد', '2D illustrated', 'عشرة مشاهد مرسومة بعناية، خفيفة على أي هاتف.', 'Ten hand-drawn settings, light on any phone.')}
      </div>
      <h2 class="wz-h2">وكيف تتحرك؟ <span lang="en" dir="ltr">And how should it move?</span></h2>
      <div class="wz-moves" role="group" aria-label="الحركة · Motion">
        ${move('animated', 'متحركة', 'Animated', 'افتتاحية سينمائية، ظرف يُختم ويطير، وموسيقى هادئة.', 'Cinematic opening, a sealed envelope that flies away, soft music.', animatedGlyph)}
        ${move('static', 'ثابتة', 'Static', 'تصميم هادئ بلا حركة، يفتح مباشرة على البطاقة.', 'Calm and still — opens straight on the card.', staticGlyph)}
      </div>
      ${x.dimension === '3d' ? `<p class="wz-note">التجربة ثلاثية الأبعاد متاحة الآن في «${SCENE_AR.candlelit}». <span lang="en" dir="ltr">3D is available with the Candlelit Hall for now.</span></p>` : ''}`;
  }

  // ---------------------------------------------------------------- step 2 · card
  _step_card() {
    const c = deriveContent(this._inv()).c;
    const scene = SceneRegistry.get(this.cfg.scene);
    return `${this._head('اختاروا البطاقة', 'Choose your card', 'كل التصاميم تُعرض بأسمائكم. <span lang="en" dir="ltr">Every design is shown with your names.</span>')}
      <div class="wz-cards" role="group" aria-label="البطاقات · Cards">${CardRegistry.list().map((card) => {
        const on = card.id === this.cfg.card, rec = card.compat.recommended.includes(scene.id);
        return `<button type="button" class="wz-card ${on ? 'on' : ''}" data-card="${card.id}" aria-pressed="${on}">
          <span class="wz-card-face" aria-hidden="true"><span class="wz-card-scale">${card.render(c)}</span></span>
          <span class="wz-card-name">${CARD_AR[card.id]}</span><span class="wz-card-en" lang="en" dir="ltr">${e(card.name)}</span>
          ${rec ? `<span class="wz-pair">يليق بـ${SCENE_AR[scene.id]}</span>` : ''}
        </button>`;
      }).join('')}</div>`;
  }

  // ---------------------------------------------------------------- step 3 · scene
  _step_scene() {
    const card = CardRegistry.get(this.cfg.card);
    const c = deriveContent(this._inv()).c;
    const three = this.cfg.experience.dimension === '3d';
    const scenes = SceneRegistry.list().filter((s) => !three || has3D(s));
    const cardMini = `<span class="wz-mini-card" aria-hidden="true"><span class="wz-card-scale">${card.render(c)}</span></span>`;
    return `${this._head('اختاروا المكان', 'Choose the setting', three
      ? 'مشهد ثلاثي الأبعاد حقيقي. مشاهد أخرى قادمة قريبًا. <span lang="en" dir="ltr">A real 3D room — more 3D settings are on the way.</span>'
      : 'بطاقتكم معروضة في كل مكان. <span lang="en" dir="ltr">Your card, shown in each setting.</span>')}
      <div class="wz-scenes ${three ? 'is-3d' : ''}" role="group" aria-label="الأماكن · Settings">${scenes.map((s) => {
        const on = s.id === this.cfg.scene, rec = card.compat.recommended.includes(s.id) || s.compat.recommended?.includes(card.id);
        const art = three
          ? `<img class="wz-scene-img" src="${this.assetBase}wizard/3d-candlelit.webp" alt="">`
          : `<span class="wz-scene-art"><span class="wz-scene-scale"><div ${SCENE_ROOT}>${SCENES[s.id](SCENE_VALS)}</div>${cardMini}</span></span>`;
        return `<button type="button" class="wz-scene ${on ? 'on' : ''}" data-scene="${s.id}" aria-pressed="${on}">
          ${art}<span class="wz-scene-name">${SCENE_AR[s.id]}</span><span class="wz-scene-en" lang="en" dir="ltr">${e(s.name)}</span>
          ${rec ? '<span class="wz-pair">يليق ببطاقتكم</span>' : ''}${three ? '<span class="wz-badge">3D</span>' : ''}
        </button>`;
      }).join('')}</div>
      ${three ? `<button type="button" class="wz-link" data-dim="2d">أو اختاروا من عشرة مشاهد مرسومة <span lang="en" dir="ltr">Or pick from ten 2D settings</span></button>` : ''}`;
  }

  // ---------------------------------------------------------------- step 4 · details
  _step_details() {
    if (this.platform) return this._step_details_platform();
    const f = this.form, er = this.errors;
    const field = (name, ar, en, { dir = 'rtl', type = 'text', req = false, ph = '', auto = 'off' } = {}) => `
      <label class="wz-field ${er[name] ? 'bad' : ''}"><span class="wz-label">${ar} <span lang="en" dir="ltr">${en}</span>${req ? '<span class="wz-req" aria-hidden="true">*</span>' : ''}</span>
        <input name="${name}" type="${type}" dir="${dir}" value="${e(f[name])}" ${req ? 'required aria-required="true"' : ''} ${er[name] ? 'aria-invalid="true"' : ''} placeholder="${e(ph)}" autocomplete="${auto}">
        ${er[name] ? `<span class="wz-err">${er[name]}</span>` : ''}</label>`;
    const area = (name, ar, en, dir) => `<label class="wz-field wide"><span class="wz-label">${ar} <span lang="en" dir="ltr">${en}</span></span><textarea name="${name}" rows="3" dir="${dir}">${e(f[name])}</textarea></label>`;
    return `${this._head('تفاصيل المناسبة', 'Your details', 'تظهر هذه التفاصيل على البطاقة والصفحات فورًا. <span lang="en" dir="ltr">They appear on the card and pages as you type.</span>')}
      <form class="wz-form" novalidate>
        <fieldset><legend>العروسان <span lang="en" dir="ltr">The couple</span></legend><div class="wz-grid">
          ${field('aAr', 'اسم العروس', 'Bride (Arabic)', { req: true })}${field('aEn', 'بالإنجليزية', 'Bride (English)', { dir: 'ltr' })}
          ${field('bAr', 'اسم العريس', 'Groom (Arabic)', { req: true })}${field('bEn', 'بالإنجليزية', 'Groom (English)', { dir: 'ltr' })}
        </div></fieldset>
        <fieldset><legend>الموعد <span lang="en" dir="ltr">Date &amp; time</span></legend><div class="wz-grid three">
          ${field('date', 'التاريخ', 'Date', { type: 'date', dir: 'ltr', req: true })}${field('time', 'الساعة', 'Time', { type: 'time', dir: 'ltr', req: true })}
          <label class="wz-field"><span class="wz-label">المدينة الزمنية <span lang="en" dir="ltr">Time zone</span></span>
            <select name="tz">${TIME_ZONES.map(([id, ar, en]) => `<option value="${id}" ${id === f.tz ? 'selected' : ''}>${ar} · ${en}</option>`).join('')}</select></label>
        </div></fieldset>
        <fieldset><legend>المكان <span lang="en" dir="ltr">Venue</span></legend><div class="wz-grid">
          ${field('venueAr', 'اسم القاعة', 'Venue (Arabic)')}${field('venueEn', 'بالإنجليزية', 'Venue (English)', { dir: 'ltr' })}
          ${field('cityAr', 'المدينة', 'City (Arabic)')}${field('cityEn', 'بالإنجليزية', 'City (English)', { dir: 'ltr' })}
          <span class="wide">${field('mapUrl', 'رابط الخريطة (اختياري)', 'Map link (optional)', { dir: 'ltr', type: 'url', ph: 'https://maps.google.com/…' })}</span>
        </div></fieldset>
        <fieldset><legend>كلمة الدعوة <span lang="en" dir="ltr">Invitation message</span></legend><div class="wz-grid">
          ${area('msgAr', 'بالعربية', 'Arabic', 'rtl')}${area('msgEn', 'بالإنجليزية', 'English', 'ltr')}
        </div></fieldset>
        <fieldset><legend>برنامج الأمسية <span lang="en" dir="ltr">Program</span></legend>
          <ol class="wz-program">${f.program.map((p, i) => `
            <li><input type="time" dir="ltr" data-prog="${i}" data-k="time" value="${e(p.time)}" aria-label="الوقت · Time">
              <input type="text" dir="rtl" data-prog="${i}" data-k="ar" value="${e(p.ar)}" aria-label="الفقرة بالعربية · Item (Arabic)" placeholder="الفقرة">
              <input type="text" dir="ltr" data-prog="${i}" data-k="en" value="${e(p.en)}" aria-label="Item (English)" placeholder="Item">
              <button type="button" class="wz-x" data-prog-del="${i}" aria-label="احذفوا الفقرة · Remove item">×</button></li>`).join('')}
          </ol>
          ${f.program.length < 6 ? '<button type="button" class="wz-link" data-wz="prog-add">أضيفوا فقرة <span lang="en" dir="ltr">Add item</span></button>' : ''}
        </fieldset>
        <fieldset><legend>الردود <span lang="en" dir="ltr">Replies</span></legend><div class="wz-grid">
          ${field('maxGuests', 'أقصى عدد ضيوف لكل رد', 'Max guests per reply', { type: 'number', dir: 'ltr' })}
        </div></fieldset>
      </form>`;
  }

  _step_details_platform() {
    const f = this.form, ev = this.platform.eventSummary;
    const field = (name, ar, en, { dir = 'rtl', ph = '' } = {}) => `
      <label class="wz-field"><span class="wz-label">${ar} <span lang="en" dir="ltr">${en}</span></span>
        <input name="${name}" type="text" dir="${dir}" value="${e(f[name])}" placeholder="${e(ph)}" autocomplete="off"></label>`;
    const area = (name, ar, en, dir) => `<label class="wz-field wide"><span class="wz-label">${ar} <span lang="en" dir="ltr">${en}</span></span><textarea name="${name}" rows="3" dir="${dir}">${e(f[name])}</textarea></label>`;
    const [phA = '', phB = ''] = ev.names.split(' و');
    const [phAEn = '', phBEn = ''] = ev.namesEn.split(' & ');
    return `${this._head('نص الدعوة', 'Invitation text', 'ما تكتبه هنا يظهر على الدعوة فقط ولا يغيّر بيانات المناسبة. <span lang="en" dir="ltr">Edits here change the invitation only.</span>')}
      <section class="wz-event" aria-label="بيانات المناسبة">
        <p class="wz-event-k">من بيانات المناسبة <span lang="en" dir="ltr">From the event</span></p>
        <dl class="wz-event-dl"><div><dt>الموعد</dt><dd>${e(ev.when)}</dd></div><div><dt>المكان</dt><dd>${e(ev.where)}</dd></div></dl>
        <button type="button" class="wz-link" data-wz="edit-event">${e(ev.editLabel)}</button>
      </section>
      <form class="wz-form" novalidate>
        <fieldset><legend>الأسماء كما تظهر على البطاقة <span lang="en" dir="ltr">Names on the card</span></legend>
          <p class="wz-hint">اتركوا الحقل فارغًا لاستخدام أسماء المناسبة: ${e(ev.names)}.</p>
          <div class="wz-grid">
          ${field('aAr', 'الاسم الأول', 'First name (Arabic)', { ph: phA })}${field('aEn', 'بالإنجليزية', 'First name (English)', { dir: 'ltr', ph: phAEn })}
          ${field('bAr', 'الاسم الثاني', 'Second name (Arabic)', { ph: phB })}${field('bEn', 'بالإنجليزية', 'Second name (English)', { dir: 'ltr', ph: phBEn })}
        </div></fieldset>
        <fieldset><legend>كلمة الدعوة <span lang="en" dir="ltr">Invitation message</span></legend><div class="wz-grid">
          ${area('msgAr', 'بالعربية', 'Arabic', 'rtl')}${area('msgEn', 'بالإنجليزية', 'English', 'ltr')}
        </div></fieldset>
        <fieldset><legend>برنامج الأمسية <span lang="en" dir="ltr">Program</span></legend>
          <ol class="wz-program">${f.program.map((p, i) => `
            <li><input type="time" dir="ltr" data-prog="${i}" data-k="time" value="${e(p.time)}" aria-label="الوقت · Time">
              <input type="text" dir="rtl" data-prog="${i}" data-k="ar" value="${e(p.ar)}" aria-label="الفقرة بالعربية · Item (Arabic)" placeholder="الفقرة">
              <input type="text" dir="ltr" data-prog="${i}" data-k="en" value="${e(p.en)}" aria-label="Item (English)" placeholder="Item">
              <button type="button" class="wz-x" data-prog-del="${i}" aria-label="احذفوا الفقرة · Remove item">×</button></li>`).join('')}
          </ol>
          ${f.program.length < 6 ? '<button type="button" class="wz-link" data-wz="prog-add">أضيفوا فقرة <span lang="en" dir="ltr">Add item</span></button>' : ''}
        </fieldset>
      </form>`;
  }

  _step_publish() {
    const inv = this._inv();
    const c = deriveContent(inv).c, x = this.cfg.experience, st = this.platform.status();
    const xAr = `${x.dimension === '3d' ? 'ثلاثية الأبعاد' : 'ثنائية الأبعاد'} · ${x.motion === 'animated' ? 'متحركة' : 'ثابتة'}`;
    const row = (ar, vAr, step) => `<div class="wz-sum-row"><dt>${ar}</dt><dd>${vAr}</dd><dd>${step != null ? `<button type="button" class="wz-link" data-step="${step}">تعديل</button>` : ''}</dd></div>`;
    const state = {
      none: ['لم تُنشر بعد', 'الضيوف لا يرون شيئًا حتى تنشروا الدعوة.'],
      draft: ['مسودة محفوظة — غير منشورة', 'كل تعديل يُحفظ تلقائيًا. الضيوف لا يرون الدعوة حتى تنشروها.'],
      published: ['منشورة', 'هذا ما يراه الضيوف الآن.'],
      changed: ['منشورة · فيها تعديلات غير منشورة', 'الضيوف يرون النسخة السابقة حتى تنشروا التعديلات.'],
    }[st.state];
    const publishLabel = st.state === 'changed' ? 'انشروا التعديلات' : st.state === 'published' ? 'منشورة ✓' : 'انشروا الدعوة';
    return `${this._head('راجعوا وانشروا', 'Review & publish')}
      <dl class="wz-sum">
        ${row('التجربة', xAr, 0)}
        ${row('البطاقة', CARD_AR[this.cfg.card], 1)}
        ${row('المكان', SCENE_AR[this.cfg.scene], 2)}
        ${row('الأسماء', `${e(c.arA)}${c.arB ? ` و ${e(c.arB)}` : ''}`, 3)}
        ${row('الموعد', `${e(c.dayAr)} ${e(c.dateAr)} · ${e(c.timeAr)}`, null)}
        ${row('القاعة', `${e(c.venueAr)}، ${e(c.cityAr)}`, null)}
      </dl>
      <section class="wz-status is-${st.state}" aria-live="polite">
        <p class="wz-status-t">${state[0]}</p><p class="wz-status-d">${state[1]}</p>
        ${st.error ? `<p class="wz-err" role="alert">${e(st.error)}</p>` : ''}
        ${st.state === 'published' || st.state === 'changed' ? `<div class="wz-share"><label class="wz-label" for="wz-link">رابط الدعوة العام <span lang="en" dir="ltr">Invitation link</span></label>
          <div class="wz-linkbox"><input id="wz-link" readonly dir="ltr" value="${e(st.link)}"><button type="button" class="wz-btn wz-btn-ghost" data-wz="copy">انسخوا</button></div>
          <p class="wz-copied" role="status" aria-live="polite"></p><p class="wz-hint">لكل ضيف رابط شخصي يُرسل من صفحة الضيوف.</p></div>` : ''}
      </section>
      <div class="wz-actions">
        <button type="button" class="wz-btn wz-btn-primary" data-wz="publish" ${st.state === 'published' || st.busy ? 'disabled' : ''} ${st.busy ? 'aria-busy="true"' : ''}>${st.busy ? 'جارٍ النشر…' : publishLabel}</button>
        <button type="button" class="wz-btn wz-btn-ghost" data-wz="preview-guest">اعرضوها كما يراها الضيف <span lang="en" dir="ltr">Preview as guest</span></button>
        <button type="button" class="wz-btn wz-btn-quiet" data-wz="done">العودة إلى المناسبة</button>
      </div>`;
  }

  // ---------------------------------------------------------------- step 5 · share
  _step_share() {
    if (this.platform) return this._step_publish();
    const inv = invitationFrom(this.form);
    const c = deriveContent(inv).c, x = this.cfg.experience;
    const link = guestLink({ ...this.cfg, invitation: inv });
    const xAr = `${x.dimension === '3d' ? 'ثلاثية الأبعاد' : 'ثنائية الأبعاد'} · ${x.motion === 'animated' ? 'متحركة' : 'ثابتة'}`;
    const xEn = `${x.dimension === '3d' ? '3D' : '2D'}, ${x.motion}`;
    const row = (ar, en, vAr, vEn, step) => `<div class="wz-sum-row"><dt>${ar} <span lang="en" dir="ltr">${en}</span></dt><dd>${vAr}${vEn ? ` <span lang="en" dir="ltr">${vEn}</span>` : ''}</dd><dd><button type="button" class="wz-link" data-step="${step}">تعديل <span lang="en" dir="ltr">Edit</span></button></dd></div>`;
    return `${this._head('دعوتكم جاهزة', 'Your invitation is ready', 'شاركوا الرابط مع ضيوفكم؛ يفتح الدعوة كاملة مع تأكيد الحضور. <span lang="en" dir="ltr">Share the link — it opens the full invitation with RSVP.</span>')}
      <dl class="wz-sum">
        ${row('التجربة', 'Experience', xAr, xEn, 0)}
        ${row('البطاقة', 'Card', CARD_AR[this.cfg.card], CardRegistry.get(this.cfg.card).name, 1)}
        ${row('المكان', 'Setting', SCENE_AR[this.cfg.scene], SceneRegistry.get(this.cfg.scene).name, 2)}
        ${row('العروسان', 'Couple', `${e(c.arA)} و ${e(c.arB)}`, `${e(c.enA)} &amp; ${e(c.enB)}`, 3)}
        ${row('الموعد', 'When', `${e(c.dayAr)} ${e(c.dateAr)} · ${e(c.timeAr)}`, '', 3)}
        ${row('المكان', 'Where', `${e(c.venueAr)}، ${e(c.cityAr)}`, '', 3)}
      </dl>
      <div class="wz-share">
        <label class="wz-label" for="wz-link">رابط الدعوة <span lang="en" dir="ltr">Invitation link</span></label>
        <div class="wz-linkbox"><input id="wz-link" readonly dir="ltr" value="${e(link)}"><button type="button" class="wz-btn wz-btn-primary" data-wz="copy">انسخوا الرابط <span lang="en" dir="ltr">Copy link</span></button></div>
        <p class="wz-copied" role="status" aria-live="polite"></p>
      </div>
      <div class="wz-actions">
        <button type="button" class="wz-btn wz-btn-primary" data-wz="open-full">افتحوا الدعوة بملء الشاشة <span lang="en" dir="ltr">Open full screen</span></button>
        <button type="button" class="wz-btn wz-btn-ghost" data-wz="restart">ابدؤوا تصميمًا جديدًا <span lang="en" dir="ltr">Start a new design</span></button>
      </div>`;
  }

  // ---------------------------------------------------------------- events
  _onClick(ev) {
    if (ev.target.closest('.wz-screen .host, .wz-full-host')) return; // the embedded invitation handles its own controls
    const t = ev.target.closest('button, a');
    if (!t || !this.root.contains(t)) return;
    if (t.classList.contains('wz-brand')) { ev.preventDefault(); return this._go(0); }
    const d = t.dataset;
    if (d.step != null && t.closest('.wz-rail, .wz-sum, .wz-panel')) return this._go(Number(d.step));
    if (d.dim) return this._setExperience({ dimension: d.dim });
    if (d.motion) return this._setExperience({ motion: d.motion });
    if (d.card) { this.cfg.card = d.card; this.studio?.setCard(d.card); this._save(); this._emit(); return this._renderStep(); }
    if (d.scene) { this.cfg.scene = d.scene; this.studio?.setScene(d.scene); this._save(); this._emit(); return this._renderStep(); }
    if (d.progDel != null) { this.form.program.splice(Number(d.progDel), 1); this._contentChanged(); return this._renderStep(); }
    switch (d.wz) {
      case 'back': return this._go(this.step - 1);
      case 'next': return this._go(this.step + 1);
      case 'prog-add': this.form.program.push({ time: '', ar: '', en: '' }); this._contentChanged(); this._renderStep(); this.el.panel.querySelector('.wz-program li:last-child input')?.focus(); return;
      case 'show-preview': this.root.classList.add('show-preview'); if (!this.studio) this._mountPreview(); return;
      case 'hide-preview': this.root.classList.remove('show-preview'); if (this._phone()) this._mountPreview(); return;
      case 'replay-preview': return this.studio?.replay();
      case 'copy': return this._copy();
      case 'open-full': return this._openFull();
      case 'close-full': return this._closeFull();
      case 'publish': case 'preview-guest': case 'edit-event': case 'done':
        return this.platform?.onAction(d.wz);
      case 'restart':
        this.cfg = structuredClone(DEFAULT_CONFIG); this.form = formFrom(this.cfg.invitation); this.errors = {};
        this._save(); this._mountPreview(); return this._go(0);
      default:
    }
  }

  _onInput(ev) {
    const t = ev.target;
    if (t.closest('.wz-screen .host, .wz-full-host')) return;
    if (t.dataset.prog != null) { this.form.program[Number(t.dataset.prog)][t.dataset.k] = t.value; return this._contentChanged(); }
    if (!t.name || !(t.name in this.form)) return;
    this.form[t.name] = t.value;
    if (this.errors[t.name]) { delete this.errors[t.name]; t.removeAttribute('aria-invalid'); t.closest('.wz-field')?.classList.remove('bad'); t.parentElement.querySelector('.wz-err')?.remove(); }
    this._contentChanged();
  }

  _contentChanged() {
    this._save();
    clearTimeout(this._contentTimer);
    this._contentTimer = setTimeout(() => {
      if (!this._valid(false)) return;
      this.cfg.invitation = this._inv();
      this.studio?.setContent(this.cfg.invitation);
      this._emit();
    }, 350);
  }

  _emit() { this.platform?.onChange(this._state()); }

  _setExperience(patch) {
    this.cfg.experience = { ...this.cfg.experience, ...patch };
    if (this.cfg.experience.dimension === '3d' && !has3D(SceneRegistry.get(this.cfg.scene))) this.cfg.scene = 'candlelit';
    this._save();
    this._emit();
    this._renderStep();
    this._mountPreview();
  }

  _valid(show = true) {
    if (this.platform) { if (show) this.errors = {}; return true; }
    const f = this.form, er = {};
    if (!f.aAr.trim()) er.aAr = 'اكتبوا الاسم بالعربية · Add the name in Arabic';
    if (!f.bAr.trim()) er.bAr = 'اكتبوا الاسم بالعربية · Add the name in Arabic';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date)) er.date = 'اختاروا التاريخ · Pick the date';
    if (!/^\d{2}:\d{2}$/.test(f.time)) er.time = 'اختاروا الساعة · Pick the time';
    if (show) this.errors = er;
    return !Object.keys(er).length;
  }

  _canReach(i) { return i <= 2 || this._valid(false); }

  _go(i) {
    if (i < 0 || i >= this._steps().length || i === this.step) return;
    if (i > 3 && this.step <= 3 && !this._valid(true)) {
      this.step = 3; this._renderStep();
      this.el.panel.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    if (i > this.step && !this._canReach(i)) return;
    this.cfg.invitation = this._inv();
    this.step = i;
    const wasOpen = this.root.classList.contains('show-preview');
    this.root.classList.remove('show-preview');
    if (wasOpen && this._phone()) this._mountPreview();
    this._renderStep(true);
  }

  async _copy() {
    const input = this.root.querySelector('#wz-link'), out = this.root.querySelector('.wz-copied');
    try { await navigator.clipboard.writeText(input.value); out.innerHTML = 'تم نسخ الرابط. <span lang="en" dir="ltr">Link copied.</span>'; }
    catch { input.select(); out.innerHTML = 'الرابط محدد — انسخوه يدويًا. <span lang="en" dir="ltr">The link is selected — copy it manually.</span>'; }
  }

  // ---------------------------------------------------------------- preview
  _studioOpts(extra = {}) {
    return { invitation: this._valid(false) ? this._inv() : this.cfg.invitation, card: this.cfg.card, scene: this.cfg.scene, experience: this.cfg.experience, assetBase: this.assetBase, params: new URLSearchParams(), ...extra };
  }

  /** phones show the preview in a sheet: only render it while the sheet is open (GPU, battery) */
  _phone() { return typeof matchMedia === 'function' && matchMedia('(max-width: 899px)').matches; }
  _wantPreview() { return !this._phone() || this.root.classList.contains('show-preview'); }

  _mountPreview() {
    this.studio?.destroy(); this.studio = null;
    if (!this._wantPreview()) { this.el.screen.replaceChildren(); return; }
    const host = document.createElement('div');
    this.el.screen.replaceChildren(host);
    this.studio = new Studio(host, this._studioOpts({ embedded: true, showSwitcher: false, muted: true }));
    window.__studio = this.studio; // QA hook
  }

  _openFull() {
    this.studio?.destroy(); this.studio = null;   // one WebGL context at a time
    this.el.screen.replaceChildren();
    this.el.full.hidden = false;
    this.el.full.innerHTML = '<div class="wz-full-host"></div><button type="button" class="wz-btn wz-btn-float" data-wz="close-full">رجوع للتعديل <span lang="en" dir="ltr">Back to editing</span></button>';
    this.fullStudio = new Studio(this.el.full.firstElementChild, this._studioOpts({ showSwitcher: false }));
    window.__studio = this.fullStudio;
    this.root.classList.add('full-open');
  }

  _closeFull() {
    this.fullStudio?.destroy(); this.fullStudio = null;
    this.el.full.hidden = true; this.el.full.innerHTML = '';
    this.root.classList.remove('full-open');
    this._mountPreview();
    this.root.querySelector('[data-wz="open-full"]')?.focus();
  }

  // ---------------------------------------------------------------- draft (per-browser convenience)
  _save() { if (this.platform) return; try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ cfg: this.cfg, form: this.form })); } catch { /* storage unavailable */ } }
  _loadDraft() { try { const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); return d?.cfg?.v === 1 && d.form ? d : null; } catch { return null; } }
}
