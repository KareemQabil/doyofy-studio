/**
 * Static Studio markup — a port of Studio.dc.html with the same element tree, class names and
 * z-order, so styles/canon-motion.css drives it unchanged. Dynamic parts (card face, back,
 * pages, envelope colours, done text, switcher) are filled in by Studio.js.
 */
import { STRINGS as T } from '../data/strings.js';

const ICON = {
  close: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>',
  up: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"></path></svg>',
  down: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg>',
  replay: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"></path><path d="M3 4v5h5"></path></svg>',
  palette: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5c0-4.1-4-7.4-9-7.4z"></path><circle cx="7.5" cy="11" r="1"></circle><circle cx="10" cy="7" r="1"></circle><circle cx="14.5" cy="7" r="1"></circle><circle cx="17" cy="11" r="1"></circle></svg>',
  soundOn: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l11-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="17" cy="16" r="3"></circle></svg>',
  soundOff: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l11-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="17" cy="16" r="3"></circle><path d="M3 3l18 18"></path></svg>',
  check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><path d="M9 12.5l2 2 4-4.5"></path></svg>',
};
export { ICON };

const SEAL_PATH = 'M32.0 -1.6 Q39.0 1.4 46.4 2.0 Q50.1 9.3 58.7 10.7 Q60.1 18.5 63.9 24.7 Q61.5 32.0 65.8 39.7 Q59.6 45.3 57.4 52.2 Q50.7 55.5 47.1 63.4 Q38.7 61.3 32.0 64.4 Q25.2 61.9 17.0 63.2 Q13.6 55.1 6.4 52.4 Q4.0 45.5 -1.4 39.6 Q2.9 32.0 -0.4 24.6 Q3.7 18.4 5.7 11.0 Q13.9 9.3 17.3 1.5 Q25.0 1.5 32.0 -1.6 Z';

export const studioMarkup = () => `
<div class="host-scene" aria-hidden="true"></div>
<div class="host-ov host-dim" aria-hidden="true"></div>
<div class="host-ov host-black" aria-hidden="true"></div>
<div class="host-ov host-bar top" aria-hidden="true"></div>
<div class="host-ov host-bar bot" aria-hidden="true"></div>
<div class="st-frame">
<div class="st" dir="rtl">
  <svg width="0" height="0" style="position: absolute" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id="st-wax" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#F6E2AE"></stop><stop offset=".45" stop-color="#D2A763"></stop><stop offset="1" stop-color="#8E6431"></stop></radialGradient>
      <filter id="st-grain"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"></feTurbulence><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 .9  0 0 0 0 .8  0 0 0 .06 0"></feColorMatrix></filter>
    </defs>
  </svg>

  <div class="st-layer" aria-hidden="true"></div>
  <div class="st-dim"></div>
  <div class="st-shadow"></div>

  <div class="st-rig">
    <div class="st-tilt">
      <div class="st-bob">
        <div class="st-intro">
          <div class="st-flip">
            <div class="st-edge st-el"></div><div class="st-edge st-er"></div><div class="st-edge st-et"></div><div class="st-edge st-eb"></div>
            <div class="st-face st-front"><div class="st-face-slot"></div><div class="st-glint"></div></div>
            <div class="st-face st-back"></div>
            <button type="button" class="st-cardbtn" aria-label="Open the invitation"></button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="st-hint"><div class="st-hint-inner" style="display: flex; gap: 8px; align-items: baseline; padding: 8px 16px; border-radius: 20px; background: rgba(15,8,9,.58); color: #F4EAE0; backdrop-filter: blur(6px)">
    <span class="ar" style="font-size: 14px">${T.tapToOpen.ar}</span><span dir="ltr" style="font-size: 12px; font-style: italic">${T.tapToOpen.en}</span>
  </div></div>

  <section class="st-sheet" aria-label="Invitation" tabindex="-1">
    <div class="st-sheet-frame" style="position: absolute; inset: 10px; border: 1px solid; border-radius: 12px; opacity: 0.55; pointer-events: none"></div>
    <div class="st-close"><button type="button" class="st-round" data-act="close" aria-label="Back to the card">${ICON.close}</button></div>
    <div style="position: absolute; top: 24px; left: 0; right: 0; text-align: center; pointer-events: none"><span class="st-sheet-mono" style="font-size: 18px"></span></div>
    <div class="st-page" aria-live="polite"></div>
    <nav class="st-nav" dir="ltr" aria-label="Invitation pages">
      <button type="button" class="st-round" data-act="prev" aria-label="Previous page">${ICON.up}</button>
      <div class="st-dots" style="display: flex; align-items: center"></div>
      <button type="button" class="st-round" data-act="next" aria-label="Next page">${ICON.down}</button>
    </nav>
  </section>

  <div class="st-streak"></div>
  <div class="st-env" aria-hidden="true">
    <div class="st-shake">
      <div class="st-envbox">
        <div class="st-eshadow"></div>
        <div class="st-eback"></div>
        <div class="st-mcard"></div>
        <div class="st-pk st-pk-l" style="clip-path: polygon(0 0, 52% 58%, 0 100%)"></div>
        <div class="st-pk st-pk-r" style="clip-path: polygon(100% 0, 48% 58%, 100% 100%)"></div>
        <div class="st-pk st-pk-b" style="clip-path: polygon(0 100%, 50% 46%, 100% 100%)"></div>
        <div class="st-flap"><div class="st-ff st-ff-front"></div><div class="st-ff st-ff-back"></div></div>
        <div class="st-flash"></div>
        <svg class="st-seal" viewBox="-3 -3 70 70" aria-hidden="true">
          <path d="${SEAL_PATH}" fill="url(#st-wax)"></path>
          <circle cx="32" cy="32" r="22" fill="none" stroke="#8E6431" stroke-width="1.2" opacity=".7"></circle>
          <text class="seal-mono" x="32.6" y="38.6" text-anchor="middle" font-family="Aref Ruqaa, Amiri, serif" font-size="18" fill="#F6E2AE" opacity=".8"></text>
          <text class="seal-mono" x="32" y="38" text-anchor="middle" font-family="Aref Ruqaa, Amiri, serif" font-size="18" fill="#76501F"></text>
        </svg>
      </div>
    </div>
  </div>

  <div class="st-credit" style="position: absolute; top: 343px" aria-hidden="true"></div>

  <div class="st-done" role="status">
    <svg class="st-dl st-e1" width="64" height="64" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="none" stroke="#C9A15F" stroke-width="1"></circle><path d="M21 33 L29 41 L44 24" fill="none" stroke="#F6E2AE" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>
    <span class="fx-foil st-dl st-e2 done-ar" style="font-size: 60px; line-height: 1.5; margin-top: 10px"></span>
    <span class="st-dl st-e3 done-en" dir="ltr" style="font-size: 20px; font-style: italic; max-width: 290px; line-height: 1.35"></span>
    <span class="st-dl st-e4 done-demo" hidden style="font: 500 13px/1.6 'IBM Plex Sans Arabic', sans-serif; color: #F2EAD9; background: rgba(0,0,0,.35); padding: 6px 12px; border-radius: 999px; margin-top: 14px; max-width: 300px">هذه نسخة تجريبية — لم يُرسل ردّك للمنظّم.</span>
    <span class="st-dl st-e4 done-who" dir="ltr" style="font-size: 12.5px; letter-spacing: 0.3em; color: #E3C58C; margin-top: 18px"></span>
    <button type="button" class="st-cta st-dl st-e5" data-act="replay" style="margin-top: 32px; border-color: rgba(227,197,140,.6); color: #F4EAE0; background: transparent">
      ${ICON.replay.replace('width="19" height="19"', 'width="16" height="16"')}
      <span class="ar" style="font-size: 15px">${T.watchAgain.ar}</span><span dir="ltr" style="font-size: 14px; font-style: italic">${T.watchAgain.en}</span>
    </button>
  </div>

  <div class="st-black"></div>
  <svg class="st-grain" width="390" height="844" style="position: absolute; left: 0; top: 0; pointer-events: none; z-index: 17; mix-blend-mode: screen" aria-hidden="true" focusable="false"><rect width="390" height="844" filter="url(#st-grain)"></rect></svg>

  <div class="st-bar top"><span class="bar-date" dir="ltr" style="font-size: 11px; letter-spacing: 0.5em; color: #C9A15F"></span></div>
  <div class="st-bar bot"><span class="bar-city" dir="ltr" style="font-size: 11px; letter-spacing: 0.5em; color: #C9A15F"></span></div>

  <div class="st-ctrls" dir="ltr">
    <div style="display: flex; gap: 8px">
      <button type="button" class="st-icon" data-act="switcher" aria-label="Choose card design and scene" aria-expanded="false">${ICON.palette}</button>
    </div>
    <div style="display: flex; gap: 8px">
      <button type="button" class="st-icon" data-act="replay" aria-label="Replay from the beginning">${ICON.replay}</button>
      <button type="button" class="st-icon" data-act="sound" aria-label="Mute music" aria-pressed="true">${ICON.soundOn}</button>
    </div>
  </div>
  <div class="st-switch-slot"></div>
</div>
</div>`;
