# Stage `intro` — cinematic depth arrival

**Module:** `RevealRegistry depth-arrival` (`src/modules.js:209-215`). **Timing:** 4700 ms, then auto → `card` (`src/engine/StateMachine.js:210-213`). **Visuals:** `src/styles/canon-motion.css:66-115`. **WebGL sync:** `candlelit-hall.js:365, 391-393`.

## Purpose

Turn opening a link into an arrival. Black, the names in gold, then the card flies in from depth.

## Hierarchy

1. Black field (`.st-black`, z 18).
2. Credit (`.st-credit`, z 19, top 340): foil names at 58 px in the card's `fAr` font, English names in tracked capitals (12 px, 0.42em, `#E3C58C`), then «REQUEST THE HONOUR OF YOUR PRESENCE» (11 px, `rgba(243,217,160,.7)`) (`Studio._renderCredit`, `src/studio/Studio.js:164-168`).
3. Letterbox bars, 74 px top and bottom, carrying `dateNum` and `cityEnU` in 11 px gold tracked capitals (`markup.js:114-115`).
4. The card (rig) arriving.

## Movement (ms from entering `intro`)

| Element | Animation |
|---|---|
| black | opacity 1 until 55 % of 3.2 s (≈ 1760), then fades to 0 at 3200 (`stFromBlack`) |
| credit | 300 → 2800: blur 10 → 0, scale 1.08 → 1, held 30–72 %, then blurs out (`stCredit`) |
| card | starts at 2200, lasts 2600: from `translate3d(0,160px,-1400px) rotateX(58°) rotateY(−80°) rotateZ(−14°)` through an overshoot at 70 % to rest (`stCardIn`, ending ≈ 4800) |
| bars | 74 px until 80 % of 4.8 s (≈ 3840), then to 0 at 4800 (`stBars`); host bars extend the same outside the stage (`studio.css:210-212`) |
| contact shadow | fades in from 3800 over 1.2 s |
| controls | fade in from 4600 |
| hint | fades in from 4800 |
| WebGL (candlelit) | exposure 25 % → 100 % over 600–3200; candles ignite from 1400 + 120 per candle; dolly-in eases to rest at 4700 |

## Controls

None are active. The card button is disabled in `intro` (default branch, `Studio.js:213-215`). Pointer tilt and parallax **are** active during intro (`Studio.js:451-453`).

## Sound

Silent until the first user gesture unlocks audio (`AudioEngine.unlock`). Scene ambience starts on unlock (`marble` only).

## Skip and fast access

- There is **no skip control**. The intro always runs 4.7 s.
- Ways around it:
  - deep link `?start=card|pages|rsvp|done` (`Studio.js:160`);
  - the `static` experience;
  - OS reduced motion or `?motion=reduced`, which all set `no-intro` (`Studio.js:151-153`).
- Replay restarts at intro (`Studio.replay`).

## Reduced motion

The intro is skipped entirely and the state machine starts at `card` (`noIntro`). The WebGL scene sets `skipIntro`: lit candles, no dolly.

## Accessibility

- The credit is `aria-hidden="true"` (`markup.js:98`), so screen readers get nothing during the 4.7 s. Focus is not moved.
- Contrast: gold foil on near-black is fine.

## Known gaps

- **Couple-only credit:** `arA و arB` and `enAU & enBU` print unconditionally. For single-person events this gives «ليان و» and «LAYAN &» (README §6 A5). «REQUEST THE HONOUR OF YOUR PRESENCE» is wedding language for every occasion.
- No skip affordance for repeat viewers. No Arabic version of the honour line.
- Not captured in this pass (timing-dependent).
