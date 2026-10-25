# QA report

**Full matrix run** (table below; summary in `qa/qa-run.log`): 2026-10-03 00:50 UTC · `npm test` (full matrix) · **56/56 PASS, 0 FAIL**

**Final-build re-run (the published build):** `npm run test:quick` after the last changes → **50/50 PASS** (`qa/qa-results-quick.json`). The changes were: candles lit on deep links, models repackaged as web glTF, HDRI as RGBM16 PNG. Renders were compared before and after the repackaging: identical draw calls and triangles, and visually the same.

## Environment (read before judging results)

- Headless Chromium 1.56 (Playwright) in a Linux sandbox.
- **WebGL is software-rendered (SwiftShader).** Every WebGL frame was really rendered with Three.js and inspected, but **frame rates measured here are not representative** of phones or GPUs. No performance claim is made from them.
- **Google Fonts are unreachable** from the sandbox, so the Arabic and Latin display faces fall back to system fonts in every screenshot. The baseline of the original was captured under the same condition, so comparisons are like for like.
- Waits are state-based (`studio.sm.state`), so slow software rendering can't cause false passes or failures.
- Tests run against the production build in `dist/`.

## Results

| Result | Check | Detail |
|---|---|---|
| PASS | flow: starts in intro |  |
| PASS | flow: intro → card after ~4.7 s | 4707 ms |
| PASS | layout: card fully inside the viewport | {"x":43.007164001464844,"y":159.6941375732422,"r":347.00008392333984,"b":583.1929779052734,"w":390,"h":844} |
| PASS | flow: card → opening |  |
| PASS | flow: opening → pages after ~950 ms | 951 ms |
| PASS | pages: next button |  |
| PASS | pages: countdown ticks | 58 → 57 |
| PASS | pages: add-to-calendar link |  |
| PASS | pages: previous button |  |
| PASS | pages: dot navigation |  |
| PASS | pages: directions link |  |
| PASS | pages: keyboard (ArrowUp) |  |
| PASS | pages: wheel → next, second notch debounced | program → venue |
| PASS | pages: swipe up → next |  |
| PASS | pages: Escape closes to card |  |
| PASS | rsvp: empty submit is rejected |  |
| PASS | rsvp: "declines" pressed |  |
| PASS | rsvp: "accepts" pressed, "declines" released |  |
| PASS | rsvp: guests +/− clamp to 1…8 | max 8, min 1 |
| PASS | finale: pack → seal → fly → done, once | pack→seal→fly→done |
| PASS | finale: canonical timings +1.75 / +3.5 / +4.95 s | 1751 / 3501 / 4952 ms |
| PASS | finale: thank-you names the guest |  |
| PASS | rsvp: stored by the adapter |  |
| PASS | sound: mute toggle |  |
| PASS | sound: unmute toggle |  |
| PASS | audio: unlocked by gesture, cues decoded, none failed | decoded 8, played open,page,page,page,page,page,page,open,page,choose,choose,click,click,click,click,click,click,click,click,click,click,click,click,c |
| PASS | replay: back to intro, RSVP + pages reset, one scene instance | {"page":0,"name":"","sent":false,"sheet":0,"scenes":1} |
| PASS | replay: intro completes again |  |
| PASS | switcher: changing card keeps the scene instance |  |
| PASS | switcher: changing scene keeps the card |  |
| PASS | console: no runtime errors (flow) |  |
| PASS | network: every local request resolves |  (Google Fonts blocked by sandbox ×1) |
| PASS | combinations: 10 cards × 10 scenes render | 100/100 |
| PASS | console: no errors across 100 combinations |  |
| PASS | reduced motion: starts settled on the card, idle motion off | {"rm":true,"st":"card","bob":"none"} |
| PASS | reduced motion: flow still works |  |
| PASS | WebGL unavailable → canonical DOM renderer, no blank stage | {"r":"candlelit:dom","errs":[],"canvases":0} |
| PASS | console: no errors without WebGL |  |
| PASS | reload: valid default state (wine · candlelit · intro) | {"card":"wine","scene":"candlelit","st":"intro"} |
| PASS | three: Wine & Gold + Candlelit Hall renders with Three.js |  |
| PASS | three: real GLB models load | lantern-chandelier-01.glb, brass-goblets.glb, brass-vase-02.glb, flower-empodium.glb, lantern-01.glb |
| PASS | three: PBR textures load | 9 maps |
| PASS | three: HDRI loads | assets/p0-derived/hdri/courtyard-1k.exr |
| PASS | three: tone mapping exposure in target range (settled) | ACES exposure 0.72, 72 draws, 88342 tris |
| PASS | three: full RSVP → envelope → done over the WebGL scene |  |
| PASS | three: changing card keeps the WebGL scene |  |
| PASS | three: replay keeps one renderer |  |
| PASS | console: no errors with WebGL |  |
| PASS | network: WebGL assets resolve |  |
| PASS | viewport m390 390×844: stage fits, card fully visible | stage 0,0,390,844 card 44,166,346,587 · candlelit:three |
| PASS | viewport m393 393×852: stage fits, card fully visible | stage 0,1,393,850 card 44,167,349,592 · candlelit:three |
| PASS | viewport m412 412×915: stage fits, card fully visible | stage 0,12,412,892 card 47,187,365,632 · candlelit:three |
| PASS | viewport tab 820×1180: stage fits, card fully visible | stage 137,0,545,1180 card 199,232,621,822 · candlelit:three |
| PASS | viewport desk 1440×900: stage fits, card fully visible | stage 512,0,416,900 card 559,178,881,627 · candlelit:three |
| PASS | viewport fhd 1920×1080: stage fits, card fully visible | stage 710,0,499,1080 card 767,212,1153,752 · candlelit:three |
| PASS | viewport ultra 2560×1080: stage fits, card fully visible | stage 1030,0,499,1080 card 1087,213,1473,752 · candlelit:three |

### Wizard (added with the customer wizard)

17 checks in `tests/qa.mjs` (section *wizard*), all passing:

- the wizard loads at `/` with no errors, and an embedded preview mounts;
- choosing 2D switches the preview to the DOM renderer, and choosing static sets reduced motion;
- card and setting picks update the preview in place;
- the 3D setting list contains only scenes with a Three renderer;
- required-field validation blocks Share;
- typed names reach the preview card and seal;
- the guest link decodes to the same config, and opening it reproduces card, setting, experience, names and time zone;
- copy button, full screen and back, start over;
- on phones the preview sheet opens and closes, and is not focusable while closed.

Screenshots of every step are in `qa/screenshots/wizard/` (`node tests/wizard-look.mjs`).

## Coverage against the brief

| Brief requirement | Covered by |
|---|---|
| build succeeds | `npm run build` before the run (esbuild, code-split) |
| no runtime console errors | console checks in the flow, 100 combinations, no-WebGL and WebGL runs |
| network requests resolve | flow and WebGL network checks (every local request 2xx) |
| real GLBs / textures / HDRI / audio load | `three:` checks, `audio:` check |
| card not cropped / scene fits mobile | layout check and the 7-viewport matrix |
| page navigation, swipe, wheel | `pages:` checks (buttons, dots, ArrowUp, swipe 120 px, wheel with debounce) |
| RSVP validation, yes/no, guests +/− | `rsvp:` checks |
| pack sequence triggers once | double `requestSubmit` → a single `pack` |
| replay resets cleanly | `replay:` checks (DOM and WebGL) |
| mute works | `sound:` checks |
| switcher; card change keeps scene; scene change keeps card | `switcher:` checks and `three: changing card keeps the WebGL scene` |
| reduced motion | `reduced motion:` checks |
| WebGL fallback | WebGL-unavailable check (getContext patched to fail) |
| reload preserves a valid default | reload check |
| 390×844, 393×852, 412×915, 820×1180, 1440×900, 1920×1080, ultrawide | viewport matrix (`qa/screenshots/qa/viewport-*.png`) |

## Visual comparison with the baseline

| Comparison | Method | Result |
|---|---|---|
| DOM port vs original (390×844, 16 states) | `qa/baseline/m390-*` vs `qa/screenshots/dom/m390-*`, same clock | Matches state for state: layout, card, sheet, pages, envelope, seal, thank-you and switcher |
| WebGL default vs original card state | `qa/screenshots/qa/three-m390-card-vs-baseline.png` vs `qa/baseline/m390-03-card-settled.png` | Same composition (card position and size, candle pairs at the canonical stage positions, table line, dark warm hall, warm glow above). It adds real depth: lit arches and columns, chandelier, brass goblet and vase framing the card edges, wine linen table, wax subsurface glow, bokeh |
| Wide screens | `viewport-desk/fhd/ultra/tab.png` | Card centred and fully visible; computed framing reveals more of the hall; no stretching or dead bands |

## Fixes made during visual QA

| Issue found | Fix |
|---|---|
| Tablecloth read tan/beige (grazing-angle Fresnel and candle lights 14 cm above the cloth) | Physical material with a wine sheen and low specular; candle lights lowered in intensity and raised |
| Candles half black | Emissive wax gradient (fake subsurface near the flame) |
| Long table edge cut across mid-frame | Table depth reduced so its back edge hides behind the card |
| Flower GLB showed stray stems | The GLB holds three blooms laid side by side; only one is used |
| Hanging brass diya lantern stood on the table | Removed from this scene (kept in the library) |
| WebGL room loading after the intro replayed the fade from black | Scene follows the Studio intro clock; late loads appear settled |
| Switcher scrolled the host and shifted the stage | Chip rows centred by `scrollLeft` instead of `scrollIntoView` |
| Reopening the card resumed the last page | Opening resets to the Invitation page (as in the canonical code) |
| RSVP hint made the form jump | Hint line reserved (`visibility`) |

## Remaining work

- **Performance (not measured):** profile on real devices; consider KTX2/Draco compression (goblets GLB 4.8 MB).
- **Visual:** reflections come from a tinted daylight HDRI (no night HDRI in P0). Flames are sprite-based; a subtle bloom pass could be tried on the `high` tier only.
- **Functional:** RSVP isn't connected to a backend (local adapter).
- **Fonts:** offline rendering uses system fallbacks; bundle OFL fonts after licence verification.
