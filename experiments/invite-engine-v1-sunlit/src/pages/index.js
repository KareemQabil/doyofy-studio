/**
 * Storytelling pages. Each page reads only from content + interface strings and renders
 * bilingual pairs (primary language large, secondary language small). Styling comes from
 * the active card's palette tokens on the sheet (--paper, --ink, --accent …).
 */
import { PageRegistry } from '../engine/registries.js';
import { h, icons } from '../engine/dom.js';

const pair = (L, v, { tag = 'p', cls = '' } = {}) => {
  const a = L.p(v), b = L.s(v);
  return h('div', { class: `pg-pair ${cls}` },
    a && h(tag, { class: 'pg-pair__p', ...L.lang(L.primary) }, a),
    b && h('span', { class: 'pg-pair__s', ...L.lang(L.secondary) }, b));
};
const kicker = (L, key) => h('div', { class: 'pg-kicker' },
  h('span', { class: 'pg-kicker__p', ...L.lang(L.primary) }, L.t(key)),
  L.secondary && h('span', { class: 'pg-kicker__s', ...L.lang(L.secondary) }, L.ts(key)));
const rule = () => h('span', { class: 'pg-rule', 'aria-hidden': 'true' });
const btn = (L, key, icon, attrs = {}) => h(attrs.href ? 'a' : 'button', { class: `pg-btn ${attrs.primary ? 'pg-btn--primary' : ''}`, type: attrs.href ? null : 'button', target: attrs.href ? '_blank' : null, rel: attrs.href ? 'noopener' : null, ...attrs, primary: null },
  h('span', { class: 'pg-btn__icon', html: icons[icon] }), h('span', { ...L.lang(L.primary) }, L.t(key)), L.secondary && h('span', { class: 'pg-btn__s', ...L.lang(L.secondary) }, L.ts(key)));

PageRegistry.registerMany([
  {
    id: 'invitation', meta: { title: 'Invitation' }, tags: ['core'],
    available: () => true,
    render({ content: c, L }) {
      const A = c.couple.personA, B = c.couple.personB;
      return h('article', { class: 'pg pg--invitation' },
        c.families && pair(L, c.families, { cls: 'pg-families pg-anim' }),
        h('h2', { class: 'pg-names pg-anim', ...L.lang(L.primary) },
          h('span', { class: 'pg-names__a' }, L.p(A)), h('span', { class: 'pg-names__and' }, L.t('and')), h('span', { class: 'pg-names__b' }, L.p(B))),
        L.secondary && h('p', { class: 'pg-names-s pg-anim', ...L.lang(L.secondary) }, `${L.s(A)} ${L.secondary === 'en' ? '&' : 'و'} ${L.s(B)}`),
        h('div', { class: 'pg-anim' }, rule()),
        pair(L, c.message, { cls: 'pg-message pg-anim' }),
        c.quote && pair(L, c.quote, { cls: 'pg-quote pg-anim' }));
    },
  },
  {
    id: 'date', meta: { title: 'Date & countdown' }, tags: ['core'],
    available: () => true,
    render({ content: c, L }) {
      const d = c.derived;
      const unit = (key) => h('div', { class: 'pg-cd__unit' }, h('span', { class: 'pg-cd__num', 'data-cd': key }, '00'), h('span', { class: 'pg-cd__label', ...L.lang(L.primary) }, L.t(key)), L.secondary && h('span', { class: 'pg-cd__label-s', ...L.lang(L.secondary) }, L.ts(key)));
      return h('article', { class: 'pg pg--date' },
        kicker(L, 'saveTheDate'),
        h('div', { class: 'pg-date pg-anim' },
          h('div', { class: 'pg-date__side' }, h('span', L.lang(L.primary), L.p(d.weekday)), L.secondary && h('small', L.lang(L.secondary), L.s(d.weekday))),
          h('div', { class: 'pg-date__day', dir: 'ltr' }, d.day.en),
          h('div', { class: 'pg-date__side' }, h('span', L.lang(L.primary), `${L.p(d.month)} ${L.p(d.year)}`), L.secondary && h('small', L.lang(L.secondary), `${L.s(d.month)} ${L.s(d.year)}`))),
        h('div', { class: 'pg-time pg-anim' }, h('span', L.lang(L.primary), L.p(d.time)), L.secondary && h('small', L.lang(L.secondary), L.s(d.time))),
        d.hijri && h('div', { class: 'pg-hijri pg-anim', ...L.lang('ar') }, d.hijri.ar),
        h('div', { class: 'pg-anim' }, rule()),
        kicker(L, 'countdown'),
        h('div', { class: 'pg-cd pg-anim', dir: 'ltr', role: 'timer', 'aria-live': 'off' }, unit('days'), unit('hours'), unit('minutes'), unit('seconds')),
        h('div', { class: 'pg-anim pg-actions' }, btn(L, 'addToCalendar', 'calendar', { href: d.calendarUrl })));
    },
    mount({ content: c }, el) {
      const target = c.derived.start.getTime();
      const set = () => {
        const diff = Math.max(0, target - Date.now());
        const v = { days: Math.floor(diff / 864e5), hours: Math.floor(diff / 36e5) % 24, minutes: Math.floor(diff / 6e4) % 60, seconds: Math.floor(diff / 1e3) % 60 };
        for (const [k, n] of Object.entries(v)) { const e = el.querySelector(`[data-cd="${k}"]`); if (e) e.textContent = k === 'days' ? String(n) : String(n).padStart(2, '0'); }
      };
      set();
      const id = setInterval(set, 1000);
      return () => clearInterval(id);
    },
  },
  {
    id: 'program', meta: { title: 'Program' }, tags: ['core'],
    available: (c) => (c.program || []).length > 0,
    render({ content: c, L }) {
      return h('article', { class: 'pg pg--program' },
        kicker(L, 'program'),
        h('ol', { class: 'pg-program' }, c.program.map((p) => h('li', { class: 'pg-program__item pg-anim' },
          h('span', { class: 'pg-program__time', dir: 'ltr' }, p.label?.en || p.time),
          h('span', { class: 'pg-program__title', ...L.lang(L.primary) }, L.p(p.title)),
          L.secondary && h('span', { class: 'pg-program__title-s', ...L.lang(L.secondary) }, L.s(p.title))))));
    },
  },
  {
    id: 'venue', meta: { title: 'Venue & directions' }, tags: ['core'],
    available: () => true,
    render({ content: c, L }) {
      const map = h('div', { class: 'pg-map pg-anim', role: 'img', 'aria-label': `${L.p(c.venue.name)} — ${L.s(c.venue.name)}`, html: `
        <svg viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <rect width="320" height="220" fill="currentColor" opacity=".04"/>
          <path d="M-10 70 C60 90 90 150 70 240" fill="none" stroke="var(--accent)" stroke-width="26" opacity=".18"/>
          <g fill="none" stroke="currentColor" stroke-linecap="round" opacity=".16"><path d="M80 0 L200 230" stroke-width="7"/><path d="M0 150 L320 115" stroke-width="7"/><path d="M130 40 L320 80" stroke-width="3.5"/><path d="M90 230 L320 170" stroke-width="3.5"/><path d="M210 0 L260 230" stroke-width="2.5"/></g>
          <g fill="currentColor" opacity=".07"><rect x="210" y="92" width="34" height="22" rx="3"/><rect x="252" y="98" width="28" height="18" rx="3"/><rect x="110" y="170" width="30" height="16" rx="3"/><ellipse cx="250" cy="190" rx="36" ry="20"/></g>
          <circle class="pg-map__pulse" cx="162" cy="126" r="14" fill="var(--accent)" opacity=".25"/>
          <g transform="translate(162 126)"><path d="M0 0C-4-8-14-14-14-26A14 14 0 0 1 14-26C14-14 4-8 0 0Z" fill="var(--ink)"/><circle cy="-26" r="5" fill="var(--paper)"/></g>
        </svg>` });
      return h('article', { class: 'pg pg--venue' },
        kicker(L, 'venue'),
        map,
        pair(L, c.venue.name, { tag: 'h3', cls: 'pg-venue pg-anim' }),
        pair(L, { ar: `${c.venue.address?.ar || ''}${c.venue.city ? '، ' + c.venue.city.ar : ''}`, en: `${c.venue.address?.en || ''}${c.venue.city ? ', ' + c.venue.city.en : ''}` }, { cls: 'pg-address pg-anim' }),
        h('div', { class: 'pg-anim pg-actions' }, btn(L, 'directions', 'pin', { href: c.venue.mapUrl, primary: true })));
    },
  },
  {
    id: 'details', meta: { title: 'Details' }, tags: ['optional'],
    available: (c) => !!(c.dressCode?.ar || c.notes?.ar || c.contacts?.length || c.rsvp?.deadline),
    render({ content: c, L }) {
      const row = (key, v) => v && (L.p(v) || L.s(v)) && h('div', { class: 'pg-detail pg-anim' }, h('span', { class: 'pg-detail__k', ...L.lang(L.primary) }, L.t(key)), pair(L, v));
      return h('article', { class: 'pg pg--details' }, kicker(L, 'details'),
        row('dressCode', c.dressCode), row('notes', c.notes),
        c.derived.deadline && row('replyBy', c.derived.deadline),
        (c.contacts || []).map((ct) => h('div', { class: 'pg-detail pg-anim' }, h('span', { class: 'pg-detail__k' }, L.p(ct.name)), h('span', { dir: 'ltr', class: 'pg-detail__v' }, ct.phone))));
    },
  },
  {
    id: 'gallery', meta: { title: 'Gallery' }, tags: ['optional'],
    available: (c) => (c.photos || []).length > 0,
    render({ content: c, L, assets }) {
      return h('article', { class: 'pg pg--gallery' }, kicker(L, 'gallery'),
        h('div', { class: 'pg-gallery' }, c.photos.map((p) => h('figure', { class: 'pg-anim' }, h('img', { src: assets.url(p.src), alt: L.p(p.alt) || '', loading: 'lazy' })))));
    },
  },
  {
    id: 'rsvp', meta: { title: 'RSVP' }, tags: ['core'],
    available: (c) => c.rsvp?.enabled !== false,
    render({ content: c, L }) {
      const f = c.rsvp?.fields || {};
      const max = c.rsvp?.maxGuests || 6;
      const choice = (val, key) => h('button', { type: 'button', class: 'pg-choice', 'data-attending': val, 'aria-pressed': 'false' },
        h('span', L.lang(L.primary), L.t(key)), L.secondary && h('small', L.lang(L.secondary), L.ts(key)));
      const field = (id, key, input) => h('div', { class: 'pg-field' }, h('label', { for: id }, h('span', L.lang(L.primary), L.t(key)), L.secondary && h('small', L.lang(L.secondary), L.ts(key))), input);
      return h('form', { class: 'pg pg--rsvp', novalidate: true, 'aria-label': L.t('rsvp') },
        h('div', { class: 'pg-rsvp-title pg-anim' }, h('h2', L.lang(L.primary), L.t('rsvp')), L.secondary && h('span', L.lang(L.secondary), L.ts('rsvp'))),
        c.derived.deadline && h('p', { class: 'pg-deadline pg-anim' }, `${L.t('replyBy')} ${L.p(c.derived.deadline)}`),
        h('div', { class: 'pg-anim' }, field('rsvp-name', 'name', h('input', { id: 'rsvp-name', name: 'name', class: 'pg-input', autocomplete: 'name', placeholder: `${L.t('namePh')}${L.secondary ? ' · ' + L.ts('namePh') : ''}`, required: true }))),
        h('div', { class: 'pg-choices pg-anim', role: 'group', 'aria-label': L.t('rsvp') }, choice('yes', 'attending'), choice('no', 'declining')),
        h('div', { class: 'pg-guests pg-anim', 'data-hide-when-no': '' },
          h('span', { class: 'pg-guests__label' }, h('span', L.lang(L.primary), L.t('guests')), L.secondary && h('small', L.lang(L.secondary), L.ts('guests'))),
          h('div', { class: 'pg-stepper', dir: 'ltr' },
            h('button', { type: 'button', class: 'pg-step', 'data-step': '-1', 'aria-label': `${L.t('guests')} −`, html: icons.minus }),
            h('output', { class: 'pg-step__val', 'aria-live': 'polite', 'data-max': String(max) }, '1'),
            h('button', { type: 'button', class: 'pg-step', 'data-step': '1', 'aria-label': `${L.t('guests')} +`, html: icons.plus }))),
        f.phone && h('div', { class: 'pg-anim pg-optional' }, field('rsvp-phone', 'phone', h('input', { id: 'rsvp-phone', name: 'phone', class: 'pg-input', type: 'tel', inputmode: 'tel', autocomplete: 'tel', dir: 'ltr' }))),
        f.notes && h('div', { class: 'pg-anim pg-optional' }, field('rsvp-notes', 'note', h('textarea', { id: 'rsvp-notes', name: 'notes', class: 'pg-input pg-textarea', rows: '2' }))),
        h('p', { class: 'pg-error', role: 'alert', hidden: true }),
        h('div', { class: 'pg-anim pg-actions' }, h('button', { type: 'submit', class: 'pg-btn pg-btn--primary pg-submit' }, h('span', { class: 'pg-btn__icon', html: icons.check }), h('span', L.lang(L.primary), L.t('send')), L.secondary && h('span', { class: 'pg-btn__s', ...L.lang(L.secondary) }, L.ts('send')))));
    },
    mount(m, el) {
      const { L } = m;
      let attending = null, guests = 1;
      const out = el.querySelector('.pg-step__val');
      const max = Number(out.dataset.max);
      const err = el.querySelector('.pg-error');
      const setGuests = (n) => { guests = Math.max(1, Math.min(max, n)); out.textContent = String(guests); };
      el.querySelector('#rsvp-name').addEventListener('input', () => { err.hidden = true; });
      el.querySelectorAll('.pg-choice').forEach((b) => b.addEventListener('click', () => {
        err.hidden = true;
        attending = b.dataset.attending === 'yes';
        el.querySelectorAll('.pg-choice').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        el.classList.toggle('is-declining', !attending);
        m.audio.emit('click');
      }));
      el.querySelectorAll('.pg-step').forEach((b) => b.addEventListener('click', () => { setGuests(guests + Number(b.dataset.step)); m.audio.emit('click'); }));
      el.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = el.querySelector('#rsvp-name').value.trim();
        if (!name || attending === null) { err.textContent = `${L.t('needName')}${L.secondary ? ' · ' + L.ts('needName') : ''}`; err.hidden = false; return; }
        err.hidden = true;
        const submit = el.querySelector('.pg-submit');
        submit.disabled = true; submit.classList.add('is-busy');
        const response = { name, attending, guests: attending ? guests : 0, phone: el.querySelector('#rsvp-phone')?.value.trim() || undefined, notes: el.querySelector('#rsvp-notes')?.value.trim() || undefined, invitationId: m.config.id };
        const res = await m.engine.submitRSVP(response);
        if (!res.ok) { submit.disabled = false; submit.classList.remove('is-busy'); err.textContent = L.t('error'); err.hidden = false; }
      });
    },
  },
]);
