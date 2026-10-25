# Stage `opening` — the card turns into the sheet

**State:** `opening`, auto → `pages` after 950 ms (`CANONICAL_TIMING.opening`). **Code:** `Studio.js:187-190`. **CSS:** `canon-motion.css:75, 84, 118-119`, `studio.css:203-205`.

## Purpose

Bridge the object (card) and the reading surface (sheet) without a hard cut.

## Hierarchy and movement

- **Flip:** `.st-flip` rotateY(−180°) over 1 s, `cubic-bezier(.6,0,.25,1)`. It reveals the **card back**:
  - background `theme.env`;
  - inset 12 accent frame;
  - a 120 px accent circle holding the foil monograms `monoA monoB` at 48 px in `fAr`;
  - `dateNum` in 12 px tracked `#F3D9A0` (`Studio.js:232-239`).
- **Rig:** moves to `translate3d(0,−10px,240px)` and fades out (0.5 s, delayed 0.45 s).
- **Dim:** the stage and host dim to `rgba(8,4,5,.62)` over 0.8 s.
- **Sheet:** enters after the state switches to `pages` (opacity 0.6 s; transform from `translateY(30px) scale(.86)`).
- **WebGL:** renders at one third of the frame rate; camera offset +0.05 (`candlelit-hall.js:386, 394-396`).

## Controls

None. The card button is disabled and the switcher closes.

## Sound

The `open` cue (fired from the card stage). Music starts when `pages` is entered.

## Skip and fast access

Not skippable; it is only 0.95 s.

## Reduced motion

The flip duration is 0.01 s (`studio.css:263`). The rig does not travel (`.host.rm.s-opening .st-rig { transform: none }`); it only fades.

## Accessibility

Focus moves to the sheet on `pages` (`Studio.js:197`).

## Known gaps

- The card back shows `monoA monoB` with a trailing space for singles. That is harmless, but the back has no event label.
- The back is visible for under a second and cannot be inspected.
