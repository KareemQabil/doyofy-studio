/**
 * The five canonical content pages (Studio.dc.html "INVITATION SHEET").
 * Each page renders from v = { t: card theme, c: derived content, program, calHref, mapHref, rsvp, cd }
 * with the original markup, classes (fx-rise / fx-d*) and type sizes. Live values (countdown,
 * RSVP choices, guest count) are updated in place by the Studio so entrance animations never replay.
 */
import { PageRegistry } from '../engine/registries.js';
import { STRINGS as T } from '../data/strings.js';

const e = (v) => String(v ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const kicker = (t, s) => `<span class="ar fx-rise fx-d1" style="font-size: 16px; color: ${t.aText}">${s.ar}</span>
  <span class="fx-rise fx-d1" dir="ltr" style="font-size: 10.5px; letter-spacing: 0.38em; color: ${t.aText}; margin-top: 2px">${s.en}</span>`;
const col = (inner) => `<div style="display: flex; flex-direction: column; align-items: center; width: 100%">${inner}</div>`;

/** display size for a name on the invitation page: complete names, no ellipsis */
const nameSize = (name) => Math.min(70, Math.max(30, Math.round(470 / Math.max(1, [...String(name ?? '')].length))));

const invitation = {
  id: 'invitation', name: 'Invitation',
  render: ({ t, c, copy }) => {
    const couple = !!c.arB;
    const head = couple ? T.withLove : { ar: c.greetingAr, en: c.eventLabelEnU };
    const names = couple
      ? `<span class="fx-rise fx-d2" style="font-family: ${t.fAr}; font-size: ${nameSize(c.arA)}px; line-height: 1.3; margin-top: 12px">${e(c.arA)}</span>
    <span class="fx-rise fx-d3" style="font-family: ${t.fAr}; font-size: 30px; line-height: 0.9; color: ${t.accent}">و</span>
    <span class="fx-rise fx-d3" style="font-family: ${t.fAr}; font-size: ${nameSize(c.arB)}px; line-height: 1.35">${e(c.arB)}</span>`
      : `<span class="fx-rise fx-d2" style="font-family: ${t.fAr}; font-size: ${nameSize(c.arA)}px; line-height: 1.35; margin-top: 12px; text-align: center; text-wrap: balance">${e(c.arA)}</span>`;
    const latin = couple ? [c.enA, c.enB].filter(Boolean).map(e).join(' &amp; ') : e(c.enA);
    return col(`
    ${kicker(t, head)}
    <h2 class="pg-h" style="display: contents">${names}</h2>
    ${latin ? `<span class="fx-rise fx-d4" dir="ltr" style="font-size: 25px; font-style: italic; color: ${t.muted}">${latin}</span>` : ''}
    <span class="fx-rise fx-d5" style="display: block; width: 130px; height: 1px; background: ${t.accent}; margin: 20px 0 16px"></span>
    <p class="ar fx-rise fx-d5" style="margin: 0; font-size: 16px; line-height: 1.85; max-width: 270px">${e(copy.invitation.ar)}</p>
    <p class="fx-rise fx-d6" dir="ltr" style="margin: 8px 0 0; font-size: 15.5px; font-style: italic; line-height: 1.45; color: ${t.muted}; max-width: 260px">${e(copy.invitation.en)}</p>`);
  },
};

const cdCell = (t, k, accent) => `<div style="display: flex; flex-direction: column; align-items: center; padding: 8px 0; border: 1px solid ${t.accent}; border-radius: 12px"><span data-cd="${k}" style="font-size: 30px; line-height: 1${accent ? `; color: ${t.aText}` : ''}"></span><span class="ar" style="font-size: 12px; color: ${t.muted}; margin-top: 4px">${T.units[k][0]}</span><span style="font-size: 9px; letter-spacing: 0.2em; color: ${t.muted}">${T.units[k][1]}</span></div>`;

const date = {
  id: 'date', name: 'Date',
  render: ({ t, c, calHref }) => col(`
    ${kicker(t, T.saveTheDate)}
    <div class="fx-rise fx-d2" style="display: flex; align-items: center; gap: 16px; margin-top: 18px">
      <div style="display: flex; flex-direction: column; align-items: center"><span class="ar" style="font-size: 16px; color: ${t.muted}">${e(c.dayAr)}</span><span dir="ltr" style="font-size: 12px; letter-spacing: 0.2em; color: ${t.muted}">${e(c.dayEnU)}</span></div>
      <span style="display: block; width: 1px; height: 60px; background: ${t.accent}"></span>
      <span dir="ltr" style="font-size: 96px; font-weight: 300; line-height: 1">${e(c.dayNum)}</span>
      <span style="display: block; width: 1px; height: 60px; background: ${t.accent}"></span>
      <div style="display: flex; flex-direction: column; align-items: center"><span class="ar" style="font-size: 16px; color: ${t.muted}">${e(c.monthAr)}</span><span dir="ltr" style="font-size: 12px; letter-spacing: 0.2em; color: ${t.muted}">${e(c.monthEnU)} ${e(c.year)}</span></div>
    </div>
    <div class="fx-rise fx-d3" style="display: flex; gap: 8px; align-items: baseline; margin-top: 10px"><span class="ar" style="font-size: 16px">${e(c.timeAr)}</span><span dir="ltr" style="font-size: 14px; font-style: italic; color: ${t.muted}">${e(c.timeEn)}</span></div>
    <span class="fx-rise fx-d3" style="display: block; width: 130px; height: 1px; background: ${t.accent}; margin: 22px 0 18px"></span>
    <div class="fx-rise fx-d4" style="display: flex; gap: 8px; align-items: baseline"><span class="ar" style="font-size: 14px; color: ${t.aText}">${(c.arB ? T.countingDown : T.countingDownSingle).ar}</span><span dir="ltr" style="font-size: 10px; letter-spacing: 0.3em; color: ${t.aText}">${T.countingDown.en}</span></div>
    <div class="fx-rise fx-d4" dir="ltr" role="timer" aria-label="الوقت المتبقي حتى المناسبة" style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; width: 280px; margin-top: 10px">
      ${cdCell(t, 'days')}${cdCell(t, 'h')}${cdCell(t, 'm')}${cdCell(t, 's', true)}
    </div>
    <a class="st-cta fx-rise fx-d5" href="${e(calHref)}" target="_blank" rel="noopener" style="margin-top: 22px; border-color: ${t.accent}; color: ${t.ink}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M3 10h18M8 3v4M16 3v4"></path></svg>
      <span class="ar" style="font-size: 15px">${T.addToCalendar.ar}</span><span dir="ltr" style="font-size: 14px; font-style: italic">${T.addToCalendar.en}</span>
    </a>`),
};

const program = {
  id: 'program', name: 'Program',
  render: ({ t, program: rows }) => col(`
    ${kicker(t, T.theEvening)}
    <ol style="list-style: none; margin: 26px 0 0; padding: 0; display: flex; flex-direction: column; align-items: center; gap: 14px">
      ${rows.map((it) => `<li class="fx-rise" style="display: flex; flex-direction: column; align-items: center; animation-delay: ${it.delay}s">
        <span dir="ltr" style="font-size: 11.5px; letter-spacing: 0.3em; color: ${t.aText}">${e(it.time)}</span>
        <span style="font-family: ${t.fAr}; font-size: 25px; line-height: 1.45">${e(it.ar)}</span>
        <span dir="ltr" style="font-size: 15px; font-style: italic; color: ${t.muted}">${e(it.en)}</span>
        <svg width="10" height="26" viewBox="0 0 10 26" style="margin-top: 10px; opacity: ${it.tailOpacity}" aria-hidden="true"><line x1="5" y1="0" x2="5" y2="16" stroke="${t.accent}" stroke-width="1"></line><path d="M5 16 L9 21 L5 26 L1 21Z" fill="${t.accent}"></path></svg>
      </li>`).join('')}
    </ol>`),
};

const venue = {
  id: 'venue', name: 'Venue',
  render: ({ t, c, mapHref }) => col(`
    ${kicker(t, T.theVenue)}
    <svg class="fx-rise fx-d2" width="250" height="240" viewBox="0 0 250 240" style="margin-top: 20px" role="img" aria-label="Illustrated map showing the venue location">
      <defs><clipPath id="st-mapclip"><path d="M2 238 V92 C2 56 28 40 62 38 C96 36 110 22 125 4 C140 22 154 36 188 38 C222 40 248 56 248 92 V238 Z"></path></clipPath></defs>
      <g clip-path="url(#st-mapclip)">
        <rect width="250" height="240" fill="${t.ink}" opacity=".05"></rect>
        <path d="M-10 60 C40 90 60 150 40 260" fill="none" stroke="${t.accent}" stroke-width="30" opacity=".22"></path>
        <g fill="none" stroke="${t.ink}" stroke-linecap="round" opacity=".16"><path d="M60 0 L150 250" stroke-width="8"></path><path d="M0 150 L250 120" stroke-width="8"></path><path d="M100 40 L250 70" stroke-width="4"></path><path d="M70 250 L250 170" stroke-width="4"></path><path d="M150 0 L200 250" stroke-width="3"></path></g>
        <g fill="${t.ink}" opacity=".08"><rect x="160" y="84" width="30" height="22" rx="3"></rect><rect x="196" y="92" width="26" height="18" rx="3"></rect><rect x="84" y="170" width="26" height="16" rx="3"></rect><ellipse cx="190" cy="200" rx="36" ry="22"></ellipse></g>
      </g>
      <path d="M2 238 V92 C2 56 28 40 62 38 C96 36 110 22 125 4 C140 22 154 36 188 38 C222 40 248 56 248 92 V238 Z" fill="none" stroke="${t.accent}" stroke-width="1.2"></path>
      <circle class="fx-pulse" cx="126" cy="132" r="12" fill="${t.env}" opacity=".35"></circle>
      <g transform="translate(126 132)"><path d="M0 0 C-4 -8 -14 -14 -14 -26 A14 14 0 0 1 14 -26 C14 -14 4 -8 0 0Z" fill="${t.env}" stroke="${t.accent}" stroke-width="1"></path><circle cx="0" cy="-26" r="5" fill="${t.paper}"></circle></g>
    </svg>
    <span class="fx-rise fx-d3" style="font-family: ${t.fAr}; font-size: 26px; line-height: 1.5; margin-top: 14px">${e(c.venueAr)}</span>
    <span class="fx-rise fx-d3" dir="ltr" style="font-size: 17px; font-style: italic; color: ${t.muted}">${e(c.venueEn)} · ${e(c.cityEn)}</span>
    <a class="st-cta fx-rise fx-d4" href="${e(mapHref)}" target="_blank" rel="noopener" style="margin-top: 18px; background: ${t.ink}; color: ${t.paper}; border-color: ${t.ink}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l18-8-8 18-2-8-8-2z"></path></svg>
      <span class="ar" style="font-size: 15px">${T.directions.ar}</span><span dir="ltr" style="font-size: 14px; font-style: italic">${T.directions.en}</span>
    </a>`),
};

const rsvp = {
  id: 'rsvp', name: 'RSVP',
  render: ({ t, rsvp: r }) => `
  <form class="rsvp" novalidate style="display: flex; flex-direction: column; align-items: stretch; gap: 18px; width: 290px">
    <div class="fx-rise fx-d1" style="display: flex; flex-direction: column; align-items: center">
      <span style="font-family: ${t.fAr}; font-size: 38px; line-height: 1.35">${T.rsvpTitle.ar}</span>
      <span dir="ltr" style="font-size: 10.5px; letter-spacing: 0.38em; color: ${t.aText}">${T.rsvpTitle.en}</span>
    </div>
    <div class="fx-rise fx-d2" style="display: flex; flex-direction: column">
      <label for="st-name" style="display: flex; justify-content: center; gap: 8px; align-items: baseline"><span class="ar" style="font-size: 15px">${T.yourName.ar}</span><span dir="ltr" style="font-size: 13px; font-style: italic; color: ${t.muted}">${T.yourName.en}</span></label>
      <input id="st-name" name="name" class="st-field" type="text" autocomplete="name" value="${e(r.name)}" placeholder="${T.namePlaceholder}" style="border-bottom-color: ${t.accent}${r.locked ? '; border-bottom-style: dotted; opacity: .92' : ''}" aria-describedby="st-need"${r.locked ? ' readonly aria-readonly="true"' : ''}>
    </div>
    <div class="fx-rise fx-d3" role="group" aria-label="Attendance" style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px">
      <button type="button" class="st-pill" data-attend="yes" aria-pressed="false" style="border-color: ${t.accent}">
        <span class="ar" style="font-size: 15px; line-height: 1.4">${T.accept.ar}</span><span dir="ltr" style="font-size: 13px; font-style: italic">${T.accept.en}</span>
      </button>
      <button type="button" class="st-pill" data-attend="no" aria-pressed="false" style="border-color: ${t.accent}">
        <span class="ar" style="font-size: 15px; line-height: 1.4">${T.decline.ar}</span><span dir="ltr" style="font-size: 13px; font-style: italic">${T.decline.en}</span>
      </button>
    </div>
    <div class="fx-rise fx-d4" style="display: flex; align-items: center; justify-content: space-between; padding: 4px 0; border-top: 1px solid ${t.accent}; border-bottom: 1px solid ${t.accent}">
      <div style="display: flex; flex-direction: column; align-items: flex-start"><span class="ar" id="st-guests-l" style="font-size: 15px">${T.guests.ar}</span><span dir="ltr" style="font-size: 13px; font-style: italic; color: ${t.muted}">${T.guests.en}</span></div>
      <div dir="ltr" style="display: flex; align-items: center; gap: 4px" role="group" aria-labelledby="st-guests-l">
        <button type="button" class="st-round" data-guests="-1" aria-label="Fewer guests"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"></path></svg></button>
        <output class="rsvp-guests" aria-live="polite" style="font-size: 28px; width: 32px; text-align: center">${r.guests}</output>
        <button type="button" class="st-round" data-guests="1" aria-label="More guests"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg></button>
      </div>
    </div>
    <button type="submit" class="st-cta fx-rise fx-d5 rsvp-submit" style="align-self: center; min-width: 220px; background: ${t.ink}; color: ${t.paper}; border-color: ${t.ink}">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><path d="M9 12.5l2 2 4-4.5"></path></svg>
      <span class="ar" style="font-size: 16px">${T.sealSend.ar}</span><span dir="ltr" style="font-size: 14px; font-style: italic">${T.sealSend.en}</span>
    </button>
    <p id="st-need" class="rsvp-need" aria-live="assertive" style="margin: -6px 0 0; font-size: 13.5px; text-align: center; color: ${t.aText}"><span class="ar">${T.need.ar}</span> · <span dir="ltr">${T.need.en}</span></p>
    <p class="rsvp-save-error" role="alert" hidden style="margin: -6px 0 0; font-size: 13.5px; text-align: center; color: #9b2729"></p>
  </form>`,
};

PageRegistry.registerMany([invitation, date, program, venue, rsvp]);
export const PAGE_ORDER = ['invitation', 'date', 'program', 'venue', 'rsvp'];
