# `midnight` — نجوم منتصف الليل / Midnight Stars

**Status: retained.** Single-person rendering was captured and is correct. Names are fixed at 44 px (long names untested). There is no Arabic date on the face.

## Identity and references

| | |
|---|---|
| Stable ID | `midnight` |
| Registry | `src/cards/index.js:30` (tone `dark`; tags `dark celestial night gold`; swatch `#1E2A4C`) |
| Face markup | `src/cards/canon/generated.js:197-219` |
| Shared defs / data | `cf-moon` (mask), `cf-sparkle`. Stars: `STARS` in `src/cards/index.js:16-22` — 34 stars, seeded LCG (seed 7), x 0–290, y 0–410, size 0.8–2.6 px |
| Theme | paper `#141C35` · ink `#F1E9D8` · muted `#C9C3B5` · accent `#E8C98A` · aText `#E8C98A` · env `#0C1226` · fAr Aref Ruqaa |
| Presets | `midnight-stars` (templates.ts:65, × starry, featured, primary graduation) · `graduation-horizon` (:75, × sea) · `other-sunset` (:83, × desert, primary other) |

## Intended occasions

Graduation, iftar, "other", weddings and corporate events. A versatile night card.

## Emotional idea

A clear night sky with a gold crescent and constellations: wonder, aspiration, an evening event.

## Composition and proportions

- **Background:** vertical gradient `#10172E → #1E2A4C`.
- **Stars:** 34 twinkling dots `#F6E7C1`.
- **Moon at (150, 66):** a halo r 34 `#E8C98A` at 12 %, and a crescent r 22 cut by the `cf-moon` mask (circle at (160, 62) r 20).
- **Constellations:** polylines (40, 52)–(68, 40)–(92, 62)–(80, 92) and (220, 40)–(246, 58)–(272, 50), stroke `rgba(232,201,138,.45)` 0.6 px, with node dots.
- **Frame:** a rect at 14, 14, 272 × 392, rx 8, stroke `rgba(232,201,138,.5)`, with 4 corner sparkles.
- **Text column:** x 34–266, y 112–384 (232 × 272).

## Typography roles

| Role | Family | Size | Colour |
|---|---|---|---|
| Greeting | Amiri | 13 px | `#E8C98A` |
| Names | Aref Ruqaa, foil | 44 px, line-height 1.3 / 1.35 | foil |
| «و» | Aref Ruqaa | 20 px | `#E8C98A` |
| English names | Cormorant italic | 19 px | ink |
| Date EN | Cormorant | 11 px, 0.24em | ink |
| `dayAr · timeAr · venueAr` | Amiri | 13 px | `#C9C3B5` |

## Hierarchy

Moon → greeting → foil names → English names → rule (80 px) → English date → Arabic day, time and venue. There is **no Arabic date** (`dateAr`) on this face.

## Ornament and material

Twinkling points of light, gold foil names, hairline constellations. Night-sky material with no texture.

## Single and couple; short and long names

- Single: correct (`previews/faces-single-person.png`, tile `grad-midnight-starry`: «تخرج», «ليان», «Layan»).
- Long names: fixed 44 px. **Untested.**

## Static and reduced motion

`.fx-twinkle` (34 stars) and `.fx-foil` stop under `.host.rm`, and the stars freeze at their base opacity.

## Scenes

- **Recommended:** `starry`, `sea`, `desert`.
- **Avoid:** `clay` and `petals` (night card on a daytime pastel stage).

## Crop and safe regions

Text safe area x 34–266, y 112–384. Keep it below the moon halo (y < 100).

## Editable blueprint

**Code-native.** The star field is seeded data and animated; the moon is a mask. A Canva version would freeze the twinkle and lose determinism.

## Asset brief references

`signature.card.midnight.sky.v1` (optional static star-field fallback) · `signature.card.midnight.moon.v1` · `signature.card.midnight.thumb.v1`.

## Preview

`previews/faces-canonical-couple.png` (tile `midnight-starry`), `previews/faces-single-person.png` (tile `grad-midnight-starry`), `previews/gallery-wedding-horizon.png`.

## Untested states

Long names, `graduation-horizon` (sea) and `other-sunset` (desert), and the twinkle animation frames.
