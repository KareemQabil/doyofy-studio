# `emerald` — زمرّد آرت ديكو / Emerald Deco

**Status: retained.** The layout is clean, but names are fixed at 38 px Reem Kufi and long names were **not tested**. Assume the same overflow risk as `lace` and `wine` until they are.

## Identity and references

| | |
|---|---|
| Stable ID | `emerald` |
| Registry | `src/cards/index.js:27` (tone `dark`; tags `dark deco gold geometric night`; swatch `#12352D`) |
| Face markup | `src/cards/canon/generated.js:144-167` (no shared defs needed) |
| Theme | paper `#12352D` · ink `#F2E8D5` · muted `#CFC3A8` · accent `#D4B06A` · aText `#E2C27E` · env `#0B241E` · fAr Reem Kufi |
| Presets | `emerald-candle` (templates.ts:58, × candlelit **3D**, primary corporate) · `emerald-garden` (:62, × garden, primary opening) · `opening-palace` (:81, × palace, primary opening) · `corporate-candle` (:82, × candlelit 2D, primary corporate) |

## Intended occasions

Openings, corporate events and weddings. The geometric Kufi treatment works for both couple and institutional events.

## Emotional idea

An Art Deco cinema marquee in green and gold: radiating sunburst, stepped frame, fan arch. Confident, architectural, modern-classic.

## Composition and proportions

- **Background:** radial `80% 60% at 50% 42%`, `#1A4539 → #0F2C25`.
- **Sunburst:** 13 lines from (150, 215) to the top and side edges, stroke `#D4B06A` 0.6 px at 16 % opacity.
- **Stepped frame:**
  - outer polygon (28, 14)–(272, 406), notched at 14/26, 1.1 px;
  - inner polygon 34/21, 0.5 px;
  - 8 px corner diamonds.
- **Fan arch:** three concentric semicircles (r 24 / 16 / 8) on a baseline from x 110 to 190 at y 54.
- **Bottom:** three diamonds centred at (150, 368).
- **Text column:** x 40–260, y 70–350 (220 × 280), centred.

## Typography roles

| Role | Family | Size | Colour |
|---|---|---|---|
| Greeting AR | Reem Kufi (`.kufi`) | 13 px | `#E2C27E` |
| Greeting EN | Cormorant | 9.5 px, 0.4em | `#E2C27E` |
| Names AR | Reem Kufi 500 | 38 px, line-height 1.35 / 1.4 | ink |
| «و» | Reem Kufi | 18 px | `#D4B06A` |
| English names `enAU & enBU` | Cormorant | 12.5 px, 0.34em | `#E2C27E` |
| Numeric date `dateNum` | Cormorant 300 | 24 px, 0.14em | ink |
| Day and time AR | Amiri | 13 px | `#CFC3A8` |
| Venue `venueEnU` | Cormorant | 9.5 px, 0.26em | `#CFC3A8` |

## Hierarchy

Fan arch → greeting → Arabic names (stacked, with «و») → English names, tracked capitals → rule (110 px) → numeric date as the second hero → Arabic day and time → English venue.

**Arabic-first gap:** no Arabic date words and no Arabic venue.

## Ornament and material

Flat gold lines on a deep green gradient. No texture and no filters.

## Single and couple; short and long names

- Single: «و» and `arB` are omitted, and English B is gated (`generated.js:159-161`).
- Long names: fixed 38 px across 220 px gives roughly 8–9 Kufi characters per line. **Untested**; likely to wrap into the numeric date.

## Static and reduced motion

The face has no animation. Only stage motion applies.

## Scenes

- **Recommended:** `garden`, `palace`, `candlelit` (`candlelit` recommends `emerald` back).
- **Avoid:** `clay` and `petals` (tonal clash); `starry` (dark on dark, low separation).

## Crop and safe regions

Text safe area: x 40–260, y 70–350. Keep it clear of the fan arch (y < 70) and the bottom diamonds (y 360–376).

## Editable blueprint

**Code-native SVG.** The geometry is trivial in SVG, and the sunburst must converge on the text column. Canva can reproduce it, but there is no gain.

## Asset brief references

`signature.card.emerald.frame.v1` · `signature.card.emerald.sunburst.v1` · `signature.card.emerald.thumb.v1`.

## Preview

`previews/faces-canonical-couple.png` (tile `emerald-garden`). The gallery capture shows the 3D-preset photo thumbnail scrolled out of view.

## Untested states

Long names, single-person corporate content, `opening-palace`, `corporate-candle`, and the 3D `emerald-candle` live render.
