# `sig-diploma` — توقيع التخرّج / Signature Diploma

**Status: new («توقيع» pass), approved in runtime.** It is the default graduation starter (`src/domain/occasion-starters.ts:38`, `sig-diploma-marble`).

## Identity and references

| | |
|---|---|
| Stable ID | `sig-diploma` |
| Registry | `src/cards/signature-cards.js` (`designs[0]`), registered with `renderMode svg`, `reducedMotion static`, `mobile true`. Tags `light graduation signature modern editorial gold`; swatch `#262626` |
| Shared layout | `STYLE` + `names()` from `src/cards/occasion-cards.js`; face-specific CSS in `SIG_STYLE` (`.sc-diploma`, `.sc-year`) |
| Theme | paper `#FFFDF8` · ink `#262626` · muted `#5F594F` · accent `#A8874C` · aText `#7A5E26` · env `#262626` · fAr Reem Kufi |
| Presets | `sig-diploma-marble` (featured) · `sig-diploma-palace` · `sig-diploma-silk` (`src/domain/templates.ts:40-42`), all primary graduation |
| Asset record | `signature.card.sig-diploma.face.v1` (`assets/asset-briefs.json`) |
| Recipe | `CANVA_RECIPES.md` → Signature §S1 |

## Intended occasions

- Graduation.
- The band glyph adapts to any single-person occasion through `typeOf(c)`, so it also renders correctly for opening and birthday when chosen from the full gallery.

## Emotional idea

A diploma cover: a dark academic band, a gold mark and the year of the achievement in a gold disc, like a seal pressed onto the edge of a certificate. Formal, proud, unmistakably Doyofy (same disc and double rule as the identity).

## Composition (300 × 420)

| Zone | Geometry | Content |
|---|---|---|
| Band | `rect 0,0 → 300,146` charcoal `#262626` | Phosphor **GraduationCap Thin**, 92 px, gold `#C7A661`, centred at (150, 76); for other occasions their own glyph at 76 px |
| Frame | outer `rect 12,12 276×396 rx3` 1 px gold; inner `rect 17,17 266×386 rx2` 0.6 px gold at 50 % | crosses the band (gold on charcoal) and the paper |
| Year disc | circle r 25 at (150, 146), gold; inner ring r 20.5, 1 px charcoal | `.sc-year` DOM text = **`c.year`** (event year), Cormorant 600 12 px charcoal |
| Text column | `.oc-inner` padding 170 / 26 / 16 (top / sides / bottom) | heading → names → meta → footer |
| Meta rule | `::before` 1 px `#C9A35A` from 30 % to 70 % | above date |
| Base rule | `path M40 400h220` 1 px gold | under the footer |

## Typography roles

| Role | Family | Size | Colour |
|---|---|---|---|
| Greeting (`greetingAr`, the event label for singles) | Reem Kufi | 16 px | `#7A5E26` |
| Label (`eventLabelEnU`) | Cormorant Garamond | 9 px, tracking 2.4 px | muted |
| Name(s) | Reem Kufi 400 | fitted by `names(c, −56)`: starts at 31 px (single) or 22 px (couple), min 8 px, no ellipsis | ink |
| «و» (couples only) | Reem Kufi | 12 px | accent |
| Latin names | Cormorant | 10 px (8 px when long) | ink |
| Date / time / venue / city | Reem Kufi | 12 / 11 / 11 / 10 px | ink / muted |
| Footer | Cormorant | 8 px, tracking 1.1 px | `#5F594F` |

## Hierarchy

Glyph → year disc → event label (Arabic, then English caps) → name → date → time → venue → city → footer.

## Single and couple; short and long

| Case | Behaviour |
|---|---|
| Single short («جود») | One name at 31 px; the Latin line is skipped when it repeats the Arabic name |
| Single long («عبدالرحمن بن سلطان بن عبدالعزيز الشهراني») | Wraps to two balanced lines at the fitted size |
| Couple | Works («نورة و فيصل») with the couple greeting «بكل الحب». The glyph switches to HeartStraight / Diamond, so a couple never sees a graduation cap |
| Long venue | The 60-character venue wraps; `metaReserve` in `names()` shrinks the names to keep everything inside |

Evidence: `previews/signature-faces.png`, row 1 (opening, birthday, couple long, couple, single long, single short).

## Scenes

- **Recommended:** marble, silk, palace (all light, calm; the charcoal band reads as a cover against them).
- **Avoid:** candlelit and starry. The dark band merges into dark scenes, and the frame and disc lose their edge.
- **Crop:** the face is shown whole in every layout; no crop. Safe text region: x 26–274, y 170–404.

## Motion

- Static face (`reducedMotion: static`).
- The engine supplies the shared storyboard (intro fly-in, bob, glint, flip to the card back, pages, pack/seal finale). No face-specific animation.

## Blueprint

- Code-native SVG + DOM text. It is the master: geometry is simple shapes and one Phosphor glyph.
- A Canva master is optional, for marketing only (recipe §S1).
- No raster art.
