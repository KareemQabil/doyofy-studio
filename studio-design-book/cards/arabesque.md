# `arabesque` — أرابيسك / Arabesque

**Status: retained.** It is the only canonical face with adaptive Arabic name sizing. Long names were captured and stay inside the arch.

## Identity and references

| | |
|---|---|
| Stable ID | `arabesque` |
| Registry | `src/cards/index.js:31` (tone `light`; tags `light arabic geometric classic warm`; swatch `#E9D3A6`) |
| Face markup | `src/cards/canon/generated.js:220-244` |
| Shared defs used | `cf-star` (22 px eight-point star tile, `#B08A4A`) |
| Theme | paper `#F7F0E3` · ink `#3A2A1E` · muted `#5E4A3A` · accent `#B08A4A` · aText `#7E5E2A` · env `#1F4A55` · fAr Aref Ruqaa |
| Presets | `arabesque-palace` (templates.ts:60, × palace, featured, primary katb_kitab) · `iftar-lantern` (:78, × candlelit 2D, primary iftar) · `iftar-sunset` (:79, × desert, primary iftar) |

## Intended occasions

Katb_kitab, henna, iftar, family gatherings and weddings: the most culturally specific face.

## Emotional idea

A mihrab-like arch inside a geometric star border, with a lantern swaying at the apex. Heritage, hospitality, Ramadan evenings.

## Composition and proportions

- **Star-pattern border bands:** top (10, 10) 280 × 22, bottom (10, 388), left (10, 32) 22 × 356, right (268, 32).
- **Frames:** 10, 10, 280 × 400 and 32, 32, 236 × 356, 1 px `#B08A4A`.
- **Arch:** from (60, 372) up to the apex (150, 74), fill `rgba(176,138,74,.07)`; inner arch apex at y 84, 0.5 px.
- **Lantern:** hangs from (150, 84) on a line to y 104; a hexagon at x 142–158, y 104–136, fill `#E9D3A6`; flame dot (150, 121) r 3 `#F6C66A`.
- **Text column:** x 72–228, y 146–364 (156 × 218, 52 % × 52 %). Narrow, so it sits inside the arch.

## Typography roles

| Role | Family | Size | Colour |
|---|---|---|---|
| Greeting | Amiri | 12.5 px | `#7E5E2A` |
| Names | Aref Ruqaa | `arFontA` / `arFontB` = clamp(18, ⌊270 / length⌋, 36) px, `overflow-wrap: anywhere` | ink |
| «و» | Aref Ruqaa | 18 px | `#B08A4A` |
| English names | Cormorant italic | 16 px | `#5E4A3A` |
| Date AR | Amiri | 13.5 px | ink |
| `dayEn · timeEn` | Cormorant italic | 12.5 px | `#5E4A3A` |
| Venue AR | Amiri | 12 px | `#7E5E2A` |

## Hierarchy

Lantern → greeting → names → English names → star glyph (18 px) → Arabic date → English day and time → Arabic venue.

## Ornament and material

Gold-ink geometric pattern on cream, and a translucent arch wash. The lantern sways (`fx-sway`, origin (150, 84)) and the flame glows (`fx-glow`).

## Single and couple; short and long names

- Single: correct by code (`generated.js:236-237`). Not captured on this face.
- Long names (25 / 27 characters → about 18 px): they fit inside the arch. The English names wrap to 4 lines at 16 px, which still fits (`previews/long-arabesque-palace.png`). For names over ~40 characters the 18 px floor applies and they wrap more.

## Static and reduced motion

`fx-sway` and `fx-glow` stop. The lantern hangs still.

## Scenes

- **Recommended:** `palace`, `desert`, `candlelit` (`candlelit` recommends `arabesque` back).
- **Avoid:** `clay` and `petals` (heritage card on a toy-like stage).

## Crop and safe regions

Text safe area x 72–228, y 146–364. That is narrow: Latin lines and long venue names wrap early.

## Editable blueprint

**Code-native SVG.** The tiled star pattern and the swaying lantern group are native. The pattern tile could be authored in Canva but must be exported as a seamless SVG tile.

## Asset brief references

`signature.card.arabesque.pattern.v1` (seamless star tile) · `signature.card.arabesque.lantern.v1` · `signature.card.arabesque.thumb.v1`.

## Preview

`previews/faces-canonical-couple.png` (tile `arabesque-desert`), `previews/long-arabesque-palace.png`, `previews/gallery-wedding-horizon.png`.

## Untested states

Single-person iftar or family content (where the "name" is a family name), `iftar-lantern`, and the sway frames.
