# `terracotta` — شمس التراكوتا / Terracotta Sun

**Status: retained.** The text zone is the smallest of all faces (240 × 144), so long names are a risk (untested). There is no Arabic date and no greeting.

## Identity and references

| | |
|---|---|
| Stable ID | `terracotta` |
| Registry | `src/cards/index.js:33` (tone `light`; tags `light desert warm earthy`; swatch `#B4583A`) |
| Face markup | `src/cards/canon/generated.js:262-282` |
| Defs | shared `cf-sky` (`#E58A68 → #F4C49B .7 → #F7D8B4`). **Inline** `<clipPath id="cf-archclip">` inside the face, so several terracotta faces on one page duplicate the id (gallery: `desert-sun`, `henna-earth`, `terracotta-garden`) |
| Theme | paper `#EFE2D2` · ink `#4A2A1E` · muted `#6E4A3A` · accent `#B4583A` · aText `#9A4428` · env `#B4583A` · fAr Reem Kufi |
| Presets | `desert-sun` (templates.ts:66, × desert, primary family) · `henna-earth` (:73, × palace, primary henna) · `terracotta-garden` (:87, × garden) |

## Intended occasions

Family, iftar, opening, birthday and henna: warm, earthy gatherings.

## Emotional idea

A sunset seen through an arched window over layered dunes. Warmth, belonging, golden hour.

## Composition and proportions

- **Arch window:** an svg 192 × 212 at (54, 28). The arch spans face x 60–240, y ≈ 34–234: 60 % of the width and 48 % of the height. This is the hero.
- **Inside the arch:**
  - `cf-sky` gradient;
  - sun at face (150, 162): r 46 `#FBE6C4` at 35 % and r 32 solid;
  - dunes `#C9754F`, `#B4583A`, `#8E3F28`.
- **Arch strokes:** outline `#4A2A1E` 1 px; outer arch `#B4583A` 0.6 px, offset 6.
- **Text column:** x 30–270, y 250–394.

## Typography roles

| Role | Family | Size | Colour |
|---|---|---|---|
| Names `arA و arB` | Reem Kufi | 30 px, line-height 1.35 | ink |
| English names | Cormorant italic | 20 px | `#6E4A3A` |
| `dayEnU · dateNum` | Cormorant | 11 px, 0.24em | ink |
| `timeAr · venueAr` | Reem Kufi | 12.5 px | `#6E4A3A` |

## Hierarchy

Sunset arch (image first) → names → English names → divider (60 × 12, a half-sun) → English day and numeric date → Arabic time and venue. No greeting, no Arabic day or date words.

## Ornament and material

A flat illustrated landscape. The sun bobs (`fx-sun`, 9 s).

## Single and couple; short and long names

- Single: `arA` alone (`generated.js:276-277`).
- Long names: about 7 Kufi characters per line at 30 px across 240 px. With a 144 px tall zone, two wrapped couple names fill it. **Untested;** likely overflow at the bottom.

## Static and reduced motion

`fx-sun` stops; the sun sits at rest.

## Scenes

- **Recommended:** `desert`, `palace`, `garden`.
- **Avoid:** `starry` and `sea` (a sunset card on a night scene); `petals` and `clay` (palette clash).

## Crop and safe regions

Text safe area x 30–270, y 250–394. Never place text inside the arch (x 60–240, y 34–234).

## Editable blueprint

**Hybrid; the arch scene is a strong Canva candidate.** Export the landscape as SVG layers: sky, sun (separate, to keep `fx-sun`), and 3 dunes. Keep text code-native. Rename the inline clip id per instance, or move it to `CARD_DEFS`.

## Asset brief references

`signature.card.terracotta.landscape.v1` (layered: sky / sun / dunes) · `signature.card.terracotta.thumb.v1`.

## Preview

`previews/faces-canonical-couple.png` (tile `terracotta-palace`).

## Untested states

Single-person family content, long names, `desert-sun` and `terracotta-garden`, and duplicate-id behaviour in the gallery.
