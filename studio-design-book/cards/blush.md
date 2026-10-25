# `blush` — ألوان مائية وردية / Blush Watercolor

**Status: redesign-needed (hierarchy).** The watercolour material is good. The type hierarchy is English-first: Great Vibes names at 54 px, Arabic names at 28 px. That inverts the product's Arabic-first rule. English script names are also unfitted.

## Identity and references

| | |
|---|---|
| Stable ID | `blush` |
| Registry | `src/cards/index.js:29` (tone `light`; tags `light watercolor romantic pastel`; swatch `#F3C6CB`) |
| Face markup | `src/cards/canon/generated.js:182-196` |
| Shared defs used | `cf-wc` (turbulence displacement, scale 24, blur 2.5), `cf-wc2` (displacement scale 7), `cf-peony` (radial `#FBE0E4 → #F2B3C0 → #E08C9F`) |
| Theme | paper `#FBF1ED` · ink `#5A3A3F` · muted `#7A5A5F` · accent `#D9A0A6` · aText `#9A5560` · env `#B87880` · fAr Aref Ruqaa |
| Presets | `blush-petals` (templates.ts:64, × petals, primary birthday) · `newborn-cloud` (:76, × marble, primary newborn) · `blush-silk` (:86, × silk) |

## Intended occasions

Engagement, henna, newborn and birthday.

## Emotional idea

Loose watercolour peonies bleeding into paper: tender and romantic, soft-focus.

## Composition and proportions

- **Watercolour washes** (`cf-wc`), top-left and bottom-right diagonal:
  - top-left: (30, 40) r 66 `#F3C6CB` at 75 %; (110, 6) r 44 `#F7DAC6`; (6, 140) r 40 `#E3D3EE` at 70 %;
  - bottom-right: (272, 386) r 70 `#F3C6CB`; (196, 420) r 46 `#F7DAC6`; (300, 286) r 40 `#E3D3EE`;
  - leaf ellipses `#BFD2C1` at (94, 80) and (206, 344), rotated 30°.
- **Peonies** (`cf-wc2`): three concentric `cf-peony` circles at (54, 58) r 30 / 21 / 12 and at (248, 360) r 28 / 19 / 10.
- **Text column:** x 30–270, y 70–360 (240 × 290). No frame and no greeting.

## Typography roles

| Role | Family | Size | Colour |
|---|---|---|---|
| Arabic names `arA و arB` | Aref Ruqaa | 28 px, line-height 1.4 | `#9A5560` |
| English A / B | Great Vibes | **54 px** | ink `#5A3A3F` |
| «&» | Great Vibes | 30 px | `#D08F9A` |
| Date EN `dayEn, dateEn` | Cormorant italic | 16 px | `#7A5A5F` |
| Date AR `dayAr · dateAr · timeAr` | Amiri | 13.5 px | ink |
| Venue `venueEnU · cityEnU` | Cormorant | 9.5 px, 0.26em | `#9A5560` |

## Hierarchy (as coded)

Arabic names (small) → **English script names (hero)** → English date → Arabic date and time → English venue. For the redesign, swap the roles: Arabic Ruqaa as the hero (≈ 44–46 px, adaptive) and English script secondary (≈ 26–30 px). Add an Arabic venue.

## Ornament and material

The watercolour comes from live SVG filters (`feTurbulence` + `feDisplacementMap`). These are relatively expensive to rasterise, and many thumbnails on one page multiply the cost.

## Single and couple; short and long names

- Single: the «&» and `enB` are omitted (gated on `arB`, `generated.js:190-191`).
- A long English name at 54 px script overflows the 240 px width. **Untested.**
- Arabic at 28 px tolerates long names better.

## Static and reduced motion

The face has no animation.

## Scenes

- **Recommended:** `petals`, `silk`, `marble`.
- **Avoid:** dark scenes (`candlelit`, `starry`, `sea`, `garden`). The pale wash reads as a hole in the scene.

## Crop and safe regions

Text safe area x 30–270, y 70–360. Keep the hero name clear of the peony centres (54, 58) and (248, 360).

## Editable blueprint

**Hybrid; Canva is a good fit for the wash layer.** A hand-painted or Canva watercolour PNG (with transparency) would look better and render more cheaply than the live filters. Keep the text code-native. See `CANVA_RECIPES.md § blush`.

## Asset brief references

`signature.card.blush.wash.v1` (raster watercolour, transparent, 2×) · `signature.card.blush.peony.v1` · `signature.card.blush.thumb.v1`.

## Preview

`previews/faces-canonical-couple.png` (tile `blush-silk`).

## Untested states

Single-person newborn and birthday content, long English names, `blush-petals` and `newborn-cloud`, and filter performance on low-tier phones.
