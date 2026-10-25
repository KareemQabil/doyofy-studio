# `minimal` — بسيط عصري / Modern Minimal

**Status: retained.** Single-person conference content was captured with a long Arabic name, and it wraps cleanly. The giant initial comes from the first Latin letter of A, which is odd when the "name" is an organisation (README §6 E2).

## Identity and references

| | |
|---|---|
| Stable ID | `minimal` |
| Registry | `src/cards/index.js:32` (tone `light`; tags `light modern minimal editorial`; swatch `#FAFAF7`) |
| Face markup | `src/cards/canon/generated.js:245-261` (no defs) |
| Theme | paper `#FAFAF7` · ink `#1C1C1C` · muted `#5A5A5A` · accent `#B89A5E` · aText `#7A6230` · env `#1C1C1C` · fAr Reem Kufi |
| Presets | `quiet-silk` (templates.ts:67, × silk, **2d/static**, featured, primary conference) · `moonlit-sea` (:68, × sea, primary other) · `conference-editorial` (:80, × marble, primary conference) |

## Intended occasions

Conference, corporate, opening, graduation and "other" — the default for "other" (`occasion-starters.ts:184`).

## Emotional idea

An editorial poster: oversized pale initials, generous white space, one gold rule. Calm and contemporary.

## Composition and proportions

- **Giant initials:** `initA` in Cormorant 250 px weight 300, `#EFECE4`, at left 14, top −34 (bleeds off the top). `initB` at left 118, top 88 (couple only).
- **Vertical label:** rotated −90° at left −38, top 200: `eventLabelEnU · year`, 9 px, tracking 0.5em, `#7A6230`.
- **Top-right block** (right 30, top 34): greeting plus a 28 px gold rule.
- **Bottom block** (left 30, right 30, bottom 30): aligned to the start edge, which is the right side in RTL.

## Typography roles

| Role | Family | Size | Colour |
|---|---|---|---|
| Initials | Cormorant Garamond 300 | 250 px | `#EFECE4` |
| Vertical label | Cormorant | 9 px, 0.5em | `#7A6230` |
| Greeting | Reem Kufi | 12 px | `#5A5A5A` |
| Names `arA و arB` | Reem Kufi | 32 px, line-height 1.35 | ink |
| English names `enAU — enBU` | Cormorant | 12 px, 0.36em | `#5A5A5A` |
| Date `dateShort` (DD.MM.YY) | Cormorant 300 | 50 px | ink |
| `dayAr · timeAr · venueAr` | Reem Kufi | 12.5 px | `#5A5A5A` |
| `venueEnU · cityEnU` | Cormorant | 9.5 px, 0.3em | `#5A5A5A` |

## Hierarchy

Initials (texture, not read) → names → English names → rule (40 px) → big numeric date → Arabic day, time and venue → English venue.

## Ornament and material

None: type and paper only.

## Single and couple; short and long names

- Single: `initB` is omitted, the names line is `arA`, and English B is gated (`generated.js:247, 254-255`).
- Long names: «ملتقى الرياض للابتكار» wraps to 2 lines. The long Arabic and English venue lines also wrap and push the block upward, and it still fits (`previews/faces-single-person.png`, tile `conf-minimal-silk`). Because the block is bottom-anchored, very long names grow upward into the initials, which is acceptable.

## Static and reduced motion

No face animation. `quiet-silk` is itself the static experience.

## Scenes

- **Recommended:** `marble`, `silk`, `sea`.
- **Avoid:** `petals` and `clay` (light on light, and too playful). `palace` is acceptable.

## Crop and safe regions

The bottom block needs x 30–270, y ≈ 200–390. The top-right greeting block sits at y 34–60. The initials may bleed (they are decorative).

## Editable blueprint

**Code-native.** The design is pure typography driven by data (initials, date). Canva adds nothing.

## Asset brief references

`signature.card.minimal.thumb.v1` (no ornament assets needed).

## Preview

`previews/faces-canonical-couple.png` (tile `minimal-sea`), `previews/faces-single-person.png` (tile `conf-minimal-silk`).

## Untested states

`conference-editorial` (marble), Arabic-only names (with `enA` empty, `initA` is empty), and couple names longer than one line.
