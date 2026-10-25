# Stage `card` — the card at rest

**State:** `card` (`TRANSITIONS.card = { open, replay }`). **Code:** `Studio._onState` case `card` (`src/studio/Studio.js:182-186`), `openCard` (:525-530), pointer (:451-461, 517-523). **CSS:** `.st-rig … .st-hint` (`canon-motion.css:74-105`).

## Purpose

Let the guest look at the invitation as an object, then invite one action: open it.

## Hierarchy

1. The card face (300 × 420 at stage (45, 168)), with four 6 px edges in accent gradients (`mix(accent, ±0.35)`, `Studio.js:227-231`).
2. Contact shadow under the card (`.st-shadow`, y 600).
3. Hint pill at y 622: «المس البطاقة لفتحها · Tap the card to open» (`markup.js:60-62`).
4. Controls at the top (`controls.md`).

## Movement

- **Bob:** translateY 0 → −8 px and rotateZ 0.5° over 7 s (`stBob`).
- **Glint:** a soft-light sweep across the face every 7 s, starting at 5 s (1 s with no intro) (`stGlint`).
- **Pointer tilt** (fine pointers only, not touch): `rotateX(−ny × 16°) rotateY(nx × 20°)` with a 0.55 s transition. The scene parallax moves at the same time (`--pf/--pm/--pn` 8/6, 20/14, 40/26 px). Pointer leave resets to 0.
- **Hint:** floats (2.6 s).
- **WebGL:** the invisible card proxy follows bob and tilt so the shadow moves (`candlelit-hall.js:404-411`).

## Controls

- The whole face is a `<button class="st-cardbtn" aria-label="Open the invitation">` (`markup.js:53`), focus ring `#F3D9A0`. Click, Enter or Space → `open`.
- Top controls: replay and sound; the switcher in author mode only.

## Sound

The `open` cue plays on activation: a cinematic whoosh at 0.32, then a relaxing chime at 0.42 after 0.45 s (`src/audio/index.js:184`). Scene ambience loops (marble).

## Skip and fast access

The card is one tap from the pages. `?start=pages` skips it.

## Reduced motion

`.host.rm` stops bob, glint and hint float. Tilt is disabled: no pointer handling (`Studio.js:453`) and no transition.

## Accessibility

- The button label is **English only** ("Open the invitation"). The visual hint is bilingual.
- The face content is not hidden from assistive technology, so screen readers may read the face text and then the button.
- Canonical faces have no `lang` attributes on Arabic or English spans. Occasion faces mark English as `lang="en"`.

## Known gaps

- On touch devices there is no tilt or gyroscope response, so the card feels static on phones apart from the bob.
- The hint is the only instruction and has no Arabic-first aria equivalent.
