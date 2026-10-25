# Stage `done` — thank-you

**State:** `done` (`replay` only). **Code:** `Studio._renderDone` (`src/studio/Studio.js:430-438`), focus at :211. **Markup:** `markup.js:100-109`. **CSS:** `canon-motion.css:170-175`.

## Purpose

Close the loop personally and offer replay. On the platform, an optional extra action (`doneAction`, for example "open my guest page", `Studio.js:112-120`).

## Hierarchy (centred between the 74 px letterbox bars, `#F4EAE0` text over the dimmed scene)

1. A check mark in a 64 px gold circle.
2. Foil heading at 60 px in `fAr`: «بانتظاركم» (accepted) or «سنفتقدكم» (declined).
3. English line in 20 px italic, max 290 px: "Your reply is sealed and on its way. We can't wait to celebrate with you." or "You will be missed — thank you for letting us know." (`src/data/strings.js:140-143`).
4. "Who" line in 12.5 px tracked capitals `#E3C58C`:
   - `NAME · N GUESTS` (accepted);
   - `NAME` (declined);
   - **fallback** `ENA & ENB · DD.MM.YY` when there is no name.
5. Optional platform CTA (paper-coloured).
6. «شاهد مرة أخرى / Watch again» (outlined).

## Movement

Staggered `fxRise`: 0.2, 0.6, 1.0, 1.4 and 1.9 s. The bars stay closed. WebGL camera offset −0.05.

## Controls

Replay (also in the top controls), and the optional `done-action`. Focus moves to replay at 1.95 s.

## Sound

Crystal chime (0.45). Its synth fallback is a 5-note bell rise.

## Skip and fast access

`?start=done` (or `thank-you`) renders it directly. With no RSVP in that run, the fallback "who" line shows (captured).

## Reduced motion

Items fade (0.5 s) instead of rising.

## Accessibility

`role="status"`, so the text is announced. The replay button has a bilingual visible label.

## Known gaps

- **Fallback line is couple-only:** a single-person event shows «LAYAN & · 18.06.27» (captured `previews/single-grad-done.png`; README §6 A4).
- English plural handling only (`GUEST` / `GUESTS`); there is no Arabic "who" line.
- "celebrate with you" is fine for most occasions, but «بانتظاركم» assumes a future event and is not adjusted after the date has passed.
