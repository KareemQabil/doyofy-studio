# `sage` — أغصان المريمية / Sage Botanical

**Status: adapted.** The top-right eucalyptus sprig crosses the name line (captured). It needs a clear zone or a smaller sprig. Names are fixed at 42 px.

## Identity and references

| | |
|---|---|
| Stable ID | `sage` |
| Registry | `src/cards/index.js:28` (tone `light`; tags `light botanical natural calm`; swatch `#C9D2B8`) |
| Face markup | `src/cards/canon/generated.js:168-181` |
| Shared defs used | `cf-euc` (eucalyptus branch: two `fx-draw` stems and 15 leaves) |
| Theme | paper `#E6EADC` · ink `#2F3B2C` · muted `#56624F` · accent `#8A9A6E` · aText `#4F5E3F` · env `#5C6B4A` · fAr Aref Ruqaa |
| Presets | `sage-morning` (templates.ts:63, × marble, featured, primary newborn) · `engagement-petals` (:71, × petals, primary engagement) · `family-garden` (:77, × garden, primary family) |

## Intended occasions

Engagement, newborn, family and birthday: soft, natural events for couples or single people.

## Emotional idea

A fresh botanical note: eucalyptus branches drawing themselves onto pale sage paper, with handwritten English under Arabic calligraphy.

## Composition and proportions

- **Branch top-right:** an svg 170 × 190 at right 0, top 0 (x 130–300, y 0–190). Stems `#6F7F5C` 1.4 / 1 px; leaves `#B9C6A7`, stroke `#7D8C69`.
- **Branch bottom-left:** 150 × 168 at left 0, bottom 0 (x 0–150, y 252–420), rotated 180°.
- **Frame:** inset 14, 1 px `rgba(111,127,92,.45)`, radius 4.
- **Text column:** x 34–266, y 56–370 (232 × 314).

## Typography roles

| Role | Family | Size | Colour |
|---|---|---|---|
| Greeting | Amiri | 13 px | `#4F5E3F` |
| Names `arA و arB` (one line) | Aref Ruqaa | 42 px, line-height 1.35 | ink |
| English names | Great Vibes (`.script`) | 36 px, line-height 1.2 | `#4F5E3F` |
| Date EN | Cormorant | 11 px, 0.24em | ink |
| Date AR `dayAr · dateAr · timeAr` | Amiri | 13.5 px | ink |
| Venue `venueEn, cityEn` | Cormorant italic | 14 px | `#56624F` |

## Hierarchy

Greeting → Arabic names → English script names → leaf divider (90 × 14, centre ellipse `#B9C6A7`) → English date → Arabic date and time → English venue.

**Arabic-first gap:** the venue is English only.

## Ornament and material

Flat illustrated leaves. The stems animate in once with `.fx-draw` (stroke-dash 900, 3.2 s, delay 0.3 s).

## Single and couple; short and long names

- Single: `arA` alone and `enA` alone (`generated.js:174-175`).
- The sprig overlaps the names even for the sample couple (`previews/canon-sage-petals.png`). Leaves at x ≈ 200–300, y ≈ 90–180 sit over the 42 px name line around y 150–200.
- Long names: fixed 42 px on one line wraps. **Untested**; Great Vibes 36 px English would also wrap.

## Static and reduced motion

`.host.rm .fx-draw { animation: none; stroke-dashoffset: 0 }` (`studio.css:260`): the stems appear fully drawn.

## Scenes

- **Recommended:** `garden`, `marble`, `petals`.
- **Avoid:** `clay` (pastel pink plus sage reads muddy) and `silk` (light on light, −0.5).

## Crop and safe regions

Text safe area x 34–266, y 56–370, **minus** the top-right sprig box (x > 180, y < 190). The real name-safe width at y 140–200 is therefore x 34–200.

## Editable blueprint

**Hybrid.** The eucalyptus branch is a good Canva illustration target (export as SVG, keeping stems as separate paths if the draw-on animation is kept). Text, frame and divider stay code-native.

## Asset brief references

`signature.card.sage.ornament.v1` (branch, vector, stems separated) · `signature.card.sage.thumb.v1`.

## Preview

`previews/faces-canonical-couple.png` (tile `sage-petals`), `previews/canon-sage-petals.png`.

## Untested states

Single-person content, long names, `sage-morning` and `family-garden`, and the draw-on animation frames.
