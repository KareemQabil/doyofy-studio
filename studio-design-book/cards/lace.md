# `lace` — دانتيل عاجي / Ivory Lace

**Status: adapted.** Keep the design. Replace the fixed 46 px name size with the adaptive sizing that `arabesque` already uses, because long names overflow the face (captured).

## Identity and references

| | |
|---|---|
| Stable ID | `lace` |
| Registry | `src/cards/index.js:25` (canonical table row; tone `light`; tags `light classic embossed romantic warm`; swatch `#F4EAE0`) |
| Face markup | `src/cards/canon/generated.js:71-101` (generated from `canonical/CardFace.dc.html`; do not edit by hand) |
| Shared defs used | `cf-emb`, `cf-embF` (emboss filters), `cf-pg` (paper gradient), `cf-leafp`, `cf-rose`, `cf-roseF` — `generated.js:10-39` |
| Theme | paper `#F4EAE0` · ink `#4A2E29` · muted `#6E5048` · accent `#B8925A` · aText `#7A5A2F` · env `#6B1E2C` · fAr Aref Ruqaa |
| Presets | `ivory-morning` (templates.ts:59, lace × marble, featured, primary engagement) · `wedding-silk` (:70, × silk, primary wedding) · `contract-ivory` (:72, × palace, primary katb_kitab) |

## Intended occasions

The presets tag it wedding, engagement, katb_kitab and henna. It is a ceremonial couple card. It renders correctly for one person (see below), but it reads as bridal.

## Emotional idea

Blind-embossed ivory stationery: tone-on-tone roses that you notice by their shadow, under a gold-lined Moorish arch. The feeling is quiet formality and touchable paper.

## Composition and proportions

- **Frame:** a double arch outline. The outer arch apex is at (150, 16), its sides run down x = 14 and x = 286 to y = 408, stroke `#B8925A` 1 px. The inner arch has its apex at (150, 32), sides at x = 22 and x = 278, 0.5 px at 80 % opacity. A gold diamond sits at the apex (150, 8–22).
- **Ornament masses** sit on the diagonal, top-left and bottom-right. Each is a 140 × 158 spray (≈ 47 % × 38 % of the face) in the corner box.
- **Text column:** x 36–264, y 74–386 (228 × 312, 76 % × 74 %), centred vertically and horizontally.
- Visual centre of gravity ≈ y 200 (48 %). The names sit just above the optical centre.

## Typography roles (actual families)

| Role | Family | Size / style | Colour |
|---|---|---|---|
| Greeting `greetingAr` | Amiri (`.ar`) | 13 px | `#7A5A2F` |
| Names `arA`, `arB` | Aref Ruqaa (`.ruqaa`) | 46 px, line-height 1.2 / 1.25 | `#4A2E29` |
| Separator «و» | Aref Ruqaa | 22 px, line-height 0.9 | `#B8925A` |
| English names `enA & enB` | Cormorant Garamond italic (root font) | 19 px | `#6E5048`, «&» `#7A5A2F` |
| Arabic date `dayAr · dateAr` | Amiri | 14 px | ink |
| English date/time `dayEn, dateEn · timeEn` | Cormorant italic | 13 px | `#6E5048` |
| Venue `venueAr — cityAr` | Amiri | 12.5 px | `#7A5A2F` |

## Hierarchy: names, date, venue

1. Arabic names (46 px Ruqaa). 2. English names. 3. Gold rule (90 × 1, margin 12/10). 4. Arabic date. 5. English date + time. 6. Arabic venue and city. There is no English venue and no `greetingEn` on this face.

## Ornament and material

- **Material:** blind emboss. Leaves and roses are filled with `cf-pg` (`#FDF8F2 → #EADACB`), and `cf-emb` adds a `#76503F` shadow at 40 % offset (1.1, 1.4) plus a white highlight offset (−0.9, −1). The bottom-right spray uses `cf-embF` (light reversed), so it reads as debossed.
- **Vines:** stroke `#F1E5D8` 3.2 px, embossed.
- **Roses:** 5-lobe symbol, 3 top-left (scales 1.25 / 0.72 / 0.78) and 2 bottom-right.
- **Gold** appears only as hairlines and the apex diamond.

## Single and couple; short and long names

- Single person: «و» and `arB` are omitted (`generated.js:93-94`), and English B is gated on `enB`. Captured with «ليان» — correct (`previews/faces-single-person.png`, tile `grad-lace-marble`).
- **Long names: breaks.** At a fixed 46 px, a four-part name wraps to 2–3 lines each. The greeting is pushed above the arch, and the date and venue are pushed out of the bottom edge (`previews/long-lace-marble.png`, 25 + 27 Arabic characters). Fix: size names from `c.arFontA/B` (clamp 18–36, `src/data/derive.js:46-47`), or a fitting loop like the one in `occasion-cards.js:78-96`.
- Long English names wrap inside the 228 px column and also add height.

## Static and reduced-motion variant

The face itself has no animated classes. Stage motion applies (bob, glint sweep, tilt) and is removed by `.host.rm` (`src/styles/studio.css:255-275`). The static variant is identical to the animated face.

## Scenes

- **Recommended (code):** `marble`, `silk`, `palace`.
- **Avoid (judgement; none declared in code):**
  - `petals` and `clay`: light card on a pale pastel scene, and `compatScore` gives −0.5 for light on light. The emboss disappears against bright pastel.
  - `starry` and `sea`: works for contrast, but the bridal emboss fights the night-sky narrative.
  - `candlelit` 3D: fine for contrast. Note that the emboss filters are DOM/SVG and the WebGL light does not affect them.

## Crop and safe regions

- **Face safe area for text:** x 36–264, y 74–386. Keep everything clear of the arch shoulders (y < 74) and the corner sprays (0–140 × 0–158 and 160–300 × 262–420).
- **Phone (390 × 844 stage):** the face sits at (45, 168). The hint pill at y 622 and the controls at y 14–58 never overlap it.
- **Desktop 1440 × 900:** the stage scales to ≈ 1.066 and the face to ≈ 320 × 448 css px (captured, `desktop-lace-marble-dom` scratch capture). The face is never cropped; only the scene is echoed outside the stage.
- **Gallery thumbnail:** the stage is cropped to y 62–781 (`.tpl-thumb` aspect 360/664 with `translateY(-62px)`, `src/features/templates/templates.css:31-35`), so the face stays whole.

## Editable blueprint

**Code-native SVG (recommended).** The look depends on two SVG filters (`cf-emb` / `cf-embF`) applied to reusable symbols. Canva can only fake that emboss with a raster texture, which loses crispness at 2× and cannot keep the paper colour themable. Canva is useful only as a composition sketch. See `CANVA_RECIPES.md § lace`.

## Asset brief references

`signature.card.lace.ornament.v1` (corner spray, vector) · `signature.card.lace.frame.v1` (double arch) · `signature.card.lace.paper.v1` (optional fibre texture) · `signature.card.lace.thumb.v1`.

## Preview

`previews/faces-canonical-couple.png` (tile `lace-marble`), `previews/faces-single-person.png` (tile `grad-lace-marble`), `previews/long-lace-marble.png`, `previews/gallery-wedding-horizon.png`.

## Untested states

Palace and silk scenes (`contract-ivory`, `wedding-silk`) were not rendered live (silk was seen only as a gallery thumbnail). Not tested: long English-only names, an Arabic name with diacritics (tashkeel), Latin-only names, animated experience frames, and the 3D candlelit pairing.
