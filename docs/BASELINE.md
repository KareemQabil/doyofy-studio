# Baseline — the canonical Studio, as it actually runs

The **unmodified** `canonical/Studio.dc.html` (with `CardFace`, `Scene` and `motion.css`) was run on its own Design-canvas runtime in Chromium and driven through every state by `tests/baseline.mjs`. A MutationObserver logged each change of the root's state class.

- Screenshots: `qa/baseline/<viewport>-<state>.png` (64 frames).
- Timing log: `qa/baseline/baseline-report.json`.

## Viewports

| Id | Size | How the 390×844 artboard is presented |
|---|---|---|
| m390 | 390×844 | native, 1:1 |
| m393 | 393×852 | contain-scaled ×1.0077, centred |
| m412 | 412×915 | contain-scaled ×1.0564, centred |
| desk | 1440×900 | desktop portrait preview: contain-scaled ×1.0664, centred on #050303 |

The original is a fixed 390×844 component, so the larger viewports only centre and scale it, the same way the canvas Play view presents it. This is the reference the production host reproduces (`Studio._fit()`).

## States captured

`01-intro-credit` (0.9 s) · `02-intro-card-arrives` (3.0 s) · `03-card-settled` (6 s) · `04-opening` · `05-page-1-invitation` · `05-page-2-date` · `05-page-3-program` · `05-page-4-venue` · `05-page-5-rsvp` · `06-rsvp-validation` · `07-rsvp-filled` · `08-pack` · `09-seal` · `10-fly` · `11-done` · `12-switcher`

## Measured state timings (ms after intro start)

| Viewport | card | opening (tap) | pages | pack (submit) | seal | fly | done |
|---|---|---|---|---|---|---|---|
| m390 | 4705 | 6813 | 7758 (+945) | 18440 | +1752 | +3499 | +4953 |
| m393 | 4708 | 6804 | 7753 (+949) | 18448 | +1754 | +3515 | +4952 |
| m412 | 4708 | 6794 | 7741 (+947) | 18485 | +1752 | +3506 | +4954 |
| desk | 4710 | 6785 | 7737 (+952) | 17994 | +1750 | +3501 | +4952 |

These confirm the brief:

- intro → card at ~4.7 s;
- opening → pages at ~950 ms;
- submit → seal / fly / done at +1.75 / +3.5 / +4.95 s.

## Geometry (from canonical/motion.css, verified in the frames)

| Element | Value |
|---|---|
| Studio | 390×844, `perspective: 1100px`, `perspective-origin: 50% 42%` |
| Card rig | left 45, top 168, 300×420; intro from `translate3d(0,160px,-1400px) rotateX(58°) rotateY(-80°) rotateZ(-14°)` over 2.6 s, starting at 2.2 s |
| Sheet | left/right 18, top 58, height 728, radius 18 |
| Envelope | left 45, top 430, 300×200; flap 116 high; seal 74 px at the flap tip |
| Letterbox | 74 px bars during intro (until 3.8 s), fly and done |
| Intro credit | `top: 343px` (live canvas edit) |

## Observations kept as product behaviour

- Black opening (0–1.76 s fully black, then fades by 3.2 s), the credit, and the card arriving from depth while the bars lift.
- The card bobs (7 s) and tilts with the pointer (±16°/±20°) only in intro/card.
- The tap hint floats under the card from 4.8 s.
- Page changes leave in 340 ms, then the new page rises in a stagger.
- The envelope sequence: mini card drop → flap → stamp with shake and gold ring → launch with streak → thank-you, with the letterbox closing.

## Original quirks noted (not preserved as bugs)

- The validation hint is inserted below the submit button, so the RSVP form jumps up (`06-rsvp-validation`).
- Fonts: the QA sandbox cannot reach Google Fonts, so the baseline renders with system fallbacks (the `أ` of the monogram falls back to a different face). Production QA runs under the same condition, so the comparisons are like for like.

## Reproduce

```bash
# canonical/runtime/support.js = the Design canvas runtime (not redistributed; see tests/baseline.mjs header)
npm run baseline
```
