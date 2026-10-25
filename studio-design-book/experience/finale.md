# Stages `pack` → `seal` → `fly` — envelope finale

**Module:** `FinaleRegistry envelope` (`src/modules.js:239-245`): pack 1750, seal 1750, fly 1450 ms, `sealImpactAt` 1250. **Code:** `Studio.js:199-207`. **Markup:** `markup.js:76-96`. **CSS:** `canon-motion.css:140-168`, theme colours `studio.css:230-235`.

## Purpose

Make the RSVP feel sent: the reply is sealed and leaves.

## Envelope system (pivots as the engine uses them)

| Part | Box (inside the 300 × 200 `.st-envbox` at stage (45, 430)) | Fill | Motion pivot |
|---|---|---|---|
| Drop shadow `.st-eshadow` | bottom −22, blurred ellipse | `rgba(0,0,0,.55)` | — |
| Back `.st-eback` | full 300 × 200, radius 6 | `--envdark` = mix(env, −0.4) | — |
| Mini card `.st-mcard` | left/right 14, top 10, height 178 | `--paper`, 1 px accent border | drops from −270 px (`stMIn` 1.35 s, delay 0.45 s) |
| Side pockets `.st-pk-l` / `-r` | clip `0 0, 52% 58%, 0 100%` (mirrored) | `--envmid` = mix(env, −0.12) | — |
| Bottom pocket `.st-pk-b` | clip `0 100%, 50% 46%, 100% 100%` | `--env` | — |
| Flap `.st-flap` | 300 × 116 | front: gradient `--envlight` (mix +0.14) → `--env`; back (lining): `--paper` | `transform-origin: 50% 0`; rotateX(180°) open → 0° closed over 0.75 s; z-index switches at 0.36 s |
| Seal `.st-seal` | 74 × 74 centred at (150, 116), the flap tip | wax gradient `#F6E2AE → #D2A763 → #8E6431` (fixed, not themed); ring `#8E6431`; monogram text Aref Ruqaa 18 px `#76501F` with highlight `#F6E2AE` | stamps from scale 2.6, rotated −10° (`stStamp`, 0.5 s at 0.8 s) |
| Flash ring `.st-flash` | 80 px at (150, 116) | 2 px `rgba(246,226,174,.9)` | scale 0.5 → 3.2 over 0.8 s at 1.25 s |

## Movement by stage

| Stage | What moves |
|---|---|
| `pack` (1.75 s) | the sheet shrinks away (`translateY(160px) scale(.4)`); the envelope rises from +560 px (1.05 s); the mini card drops in (from 0.45 s); dim drops to 35 % |
| `seal` (1.75 s) | the flap closes (0.75 s); the seal stamps (0.8–1.3 s); impact at 1.25 s gives a shake of 0.4 s (±3 px), a flash ring, and the thump sound |
| `fly` (1.45 s) | the envelope flies to `translate3d(0,−600px,0) scale(.22) rotate(−16°)` and fades (1.2 s, delayed 0.3 s); a gold streak rises from y 560 to 40; the letterbox bars return to 74 px; WebGL camera offset −0.05 |

`done` appears 4.95 s after submit.

## Controls

None; it is non-interactive. Replay still works from the top controls.

## Sound

- `pack`: music stops, ambience ducks to 30 %, paper slide (0.55).
- `seal`: a synthesised **thump** at 1.25 s (120 → 42 Hz sine plus a noise click). There is no recorded wax stamp in the packs (`src/audio/index.js:189-190`).
- `fly`: fast whoosh (0.42).

## Skip and fast access

Not skippable. `?start=done` jumps to the end state.

## Reduced motion

- The envelope only fades (no travel in or out).
- The mini card and seal fade (0.6 s / 0.4 s).
- No shake, flash or streak (`studio.css:265-270`).

## Accessibility

`.st-env` is `aria-hidden`, and nothing announces "sending". The done screen's `role="status"` announces the result afterwards.

## Known gaps

- **Mini card is couple-only:** `arA و arB` and `enA & enB` print unconditionally (`Studio.js:244-245`; README §6 A6).
- The seal monogram is `monoA monoB` (one letter for singles, which is fine).
- The wax colour ignores the card theme, so gold wax sits on every envelope colour (for example on `forum-grid`'s teal-ink envelope `#153C42`).
- The finale runs before the adapter result returns. A failed submission still shows success.
- Not captured in this pass.
