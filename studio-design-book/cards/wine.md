# `wine` — نبيذي وذهبي / Wine & Gold

**Status: adapted.** This is the engine's default card (`Studio` constructor default `card = 'wine'`, `src/studio/Studio.js:49`; `PresetRegistry` `canonical-default`, `src/modules.js:247-250`). It needs adaptive name sizing and a clear zone between the bottom-right roses and the venue and footer lines.

## Identity and references

| | |
|---|---|
| Stable ID | `wine` |
| Registry | `src/cards/index.js:26` (tone `dark`; tags `dark luxury gold crest warm night`; swatch `#5B1523`) |
| Face markup | `src/cards/canon/generated.js:102-143` |
| Shared defs used | `cf-leafp`, `cf-grose` (gold-outlined rose) |
| Theme | paper `#5B1523` · ink `#F6E7D0` · muted `#E3C9B0` · accent `#D9B77A` · aText `#E8C98A` · env `#3E0F18` · fAr Aref Ruqaa |
| Presets | `candle-night` (templates.ts:57, × candlelit **3D**, featured, primary wedding) · `wine-palace` (:61, × palace, primary henna) · `wine-constellation` (:84, × starry, primary corporate) · `wedding-candlelight` (:85, × candlelit 2D) |

## Intended occasions

Wedding, engagement, katb_kitab and henna. The presets also push it to corporate (`wine-constellation`), which is a tonal mismatch (README §6 E1).

## Emotional idea

A heraldic evening card: burgundy velvet, a gold crest holding the couple's monograms, rose garlands. Formal luxury, "the hall at night".

## Composition and proportions

- **Background:** radial gradient `90% 70% at 50% 45%`, `#6E1D2C → #521220`.
- **Frame:**
  - two inset rules (12 px at `rgba(217,183,122,.85)`, 17 px at `.4`);
  - 24 px L-brackets at each corner (stroke `#D9B77A`);
  - 6 px gold diamonds at the four corners;
  - a cartouche top and bottom centre: a 28 × 8 `#5E1624` bar at (150, 12) and (150, 408), with a diamond and two dots.
- **Garlands:** top-left (vine from (20, 100) to (118, 16), 5 leaves, roses at (48, 48) × 1.15 and (96, 30) × 0.55), mirrored about (150, 210) to the bottom-right.
- **Crest:** a shield centred at (150, 96), spanning y ≈ 66–136 and 56 px wide, fill `#5E1624`, gold stroke, crown at y 52–66. The monograms are Ruqaa 20 px `#F3D9A0` at top 70 (`monoA`) and top 102 (`monoB`, couple only).
- **Text column:** x 30–270, y 150–386 (240 × 236), centred.

## Typography roles

| Role | Family | Size | Colour |
|---|---|---|---|
| Monograms | Aref Ruqaa | 20 px | `#F3D9A0` |
| Greeting AR | Amiri | 13 px | `#E3C58C` |
| Greeting EN `greetingEnU` | Cormorant Garamond | 9.5 px, tracking 0.3em | `#E3C58C` |
| Names `arA و arB` (one line) | Aref Ruqaa, gold foil (`.fx-foil`) | 40 px, line-height 1.45 | foil gradient `#A87E45→#F6E2AE→…` |
| English names | Cormorant | 25 px | `#F2DDD0`, «&» `#D9B77A` |
| Date EN `dayEnU · dateEnU` | Cormorant | 11 px, 0.2em | `#F2DDD0` |
| Day and time AR `dayAr · timeAr` | Amiri | 13 px | `#F2DDD0` |
| Venue `venueEnU · cityEnU` | Cormorant | 10 px, 0.2em | `#F2DDD0` |
| Footer `cardFooterEnU` | Cormorant | 9.5 px, 0.22em | `#E3C58C` |

## Hierarchy

Crest and monograms → greeting (AR/EN) → foil Arabic names → English names → divider (120 × 10, diamond) → English date → Arabic day and time → English venue → footer.

**Arabic-first gap:** there is no Arabic date (`dateAr`) and no Arabic venue (`venueAr`) on this face. The venue is English-only.

## Ornament and material

Gold foil (an animated gradient clip on the names), gold hairlines, and roses in `#6A1A2A` / `#7C2334` / `#8A2D3C` with gold outlines `#D9B77A` / `#E6C79A`. The velvet effect comes only from the radial gradient.

## Single and couple; short and long names

- Single: `monoB` is omitted, the names line is `arA` alone, and English B is gated (`generated.js:131, 135-136`). Greeting and footer become the event label (for example «مناسبة شركة», `TEAM GATHERING · RSVP`).
- Couple footer is always `DINNER · CELEBRATION · RSVP`, which is misleading for katb_kitab and henna (README §6 B1).
- **Long names: breaks.** At 40 px on one line, long names wrap to 3–4 lines, climb over the crest and monograms, and push the English names into the bottom-right roses (`previews/long-wine-candlelit.png`).
- Even the sample venue line «THE GRAND MARIGOLD HALL · CAIRO» touches the bottom-right rose (`faces-canonical-couple.png`). In the gallery, «LAYALI AL YASMIN HALL · RIYADH» is overlapped too (`gallery-wedding-horizon.png`).

## Static and reduced motion

`.fx-foil` (a 6 s gradient drift) is the only face animation. Under `.host.rm` it is stopped (`studio.css:258`) and the foil stays as a static gradient.

## Scenes

- **Recommended:** `candlelit` (and `candlelit` recommends `wine` back, score 4), `palace`, `starry`.
- **Avoid:** `clay` and `petals` (a playful pastel stage under a heraldic card); `garden` is acceptable.

## Crop and safe regions

Keep text inside x 30–270, y 150–386, and below the crest (the crest ends at y ≈ 136). A clear zone for the bottom-right garland is needed: x > 190, y > 330. Phone, desktop and thumbnail placement are the same as for every face (see `lace.md`). In 3D, the face is a DOM element above the WebGL canvas, and an invisible proxy casts its shadow (`candlelit-hall.js:324-329`).

## Editable blueprint

**Code-native SVG**, with an optional Canva ornament master. All shapes are plain vectors (no filters), so the rose garland and crest could be drawn in Canva and exported as SVG. The foil names, monograms and all text must stay in code.

## Asset brief references

`signature.card.wine.ornament.v1` (rose garland pair) · `signature.card.wine.crest.v1` · `signature.card.wine.frame.v1` · `signature.card.wine.thumb.v1`.

## Preview

`previews/faces-canonical-couple.png` (tile `wine-candlelit`), `previews/long-wine-candlelit.png`, `previews/desktop-wine-candlelit-3d-low.png` (3D low tier), `previews/gallery-wedding-horizon.png`.

## Untested states

`wine-palace` and `wine-constellation` were not rendered. Not tested: single-person corporate content on this face, the 3D high and balanced tiers, and the animated foil frames.
