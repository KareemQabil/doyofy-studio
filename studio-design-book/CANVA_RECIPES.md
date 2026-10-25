# Canva recipes — one record per card face

*No Canva designs exist for these faces, and none were created for this book. Every recipe below is derived from the face's actual markup and CSS (`src/cards/canon/generated.js`, `src/cards/occasion-cards.js`). The only Canva item in the repository is the non-canonical Mediterranean sample `DAHWmDfAn6s` (`docs/ASSET_PROVENANCE.md`), which is not used by any face.*

## Conventions used by every recipe

**Canvas.** Portrait **1500 × 2100 px**, which is exactly 5 × the 300 × 420 face. A Canva custom size of 1500 × 2100 px exports 1:1 at 5×. Corner radius 10 → 50 px (the runtime clips it; do not bake the radius into exports).

**Named grid "G-300".** Every coordinate is given as face pixels `(x, y)` on the 300 × 420 grid, with proportions in brackets `[x %, y %]`. Multiply by 5 for Canva pixels. Font sizes are given as `px @300` and `% of H` (canvas height); multiply px by 5 for Canva points at 1500 × 2100.

**Fonts.** Use only the families shipped in `public/assets/fonts/`: Readex Pro, IBM Plex Sans Arabic, Amiri, Aref Ruqaa, Reem Kufi, Cormorant Garamond, Great Vibes. Three occasion faces currently use Arial for one label. Arial is not shipped, so each recipe substitutes Readex Pro 700, flagged as a change.

**Text is never baked into exports.** Every text zone is a *data zone* that the app fills from `deriveContent()` (`src/data/derive.js`). Canva text in a recipe is **SAMPLE COPY**, labelled as such, for layout only. Export ornament layers without text.

**Mixed direction.** Arabic runs are RTL in the face root (`dir="rtl"`). Latin runs are separate LTR lines (`dir="ltr"`). Never mix scripts on one line, except the Arabic «·»-joined date strings that the app composes itself. In Canva, put Latin lines in their own text boxes.

**Envelope system (shared by every face; the engine builds it, not Canva).** Envelope 300 × 200 at stage (45, 430). The colours come from the face theme:

- back = `mix(env, −0.4)`;
- side pockets = `mix(env, −0.12)`;
- bottom pocket = `env`;
- flap front = gradient `mix(env, +0.14) → env`; flap lining = `paper`;
- flap pivot = top edge (`transform-origin: 50% 0`), rotateX 180° → 0°;
- seal = 74 px gold wax disc at the flap tip (150, 116), fixed colours `#F6E2AE / #D2A763 / #8E6431`, with `monoA monoB` in Aref Ruqaa;
- mini card = 272 × 178 in `paper` with an accent border.

Card back = `env` background, an accent frame at inset 12 (radius 6), a 120 px accent ring, foil monograms at 48 px in `fAr`, and `dateNum`. All of this lives in `src/studio/Studio.js:227-246` and `src/studio/markup.js:76-96`. A recipe lists only the **theme values** that drive it. Canva may supply an optional **lining pattern** asset (`signature.card.<id>.envelope-lining.v1`), but the engine does not consume one today.

**Thumbnail.** The gallery renders the live face on the live scene (`TemplateThumb.tsx`). No static thumbnail is consumed today. A `…thumb.v1` export is for marketing and docs only: 600 × 840 PNG of the face on a neutral background.

**Shared motion storyboard (engine, all faces).**

- intro: fly-in 2.2–4.8 s;
- card: bob (7 s, −8 px), glint sweep every 7 s, pointer tilt ±16° / ±20°;
- opening: flip −180° (1 s) to the card back;
- pages: sheet entrance;
- finale: envelope.

Each recipe adds only the face's own animated layers. Reduced motion freezes every loop (`src/styles/studio.css:255-275`).

**Export.** Vector ornament → SVG (outline strokes off, no embedded text, no ids that collide with `cf-*`). Raster ornament → PNG-24 with transparency at 1500 × 2100 (5×) plus a 600 × 840 (2×) derivative. Name files by asset ID: `signature.card.<id>.<layer>.v1.(svg|png)`. The asset brief list is written separately; these IDs are the join keys.

**Status keys:** **retained** = recipe reproduces the face as is · **adapted** = recipe reproduces it with listed fixes · **redesigned** = recipe changes the composition.

---

## 1. `lace` — Ivory Lace · status: **adapted** · blueprint: **code-native SVG** (Canva only as composition sketch)

1. **Identity and idea.** Blind-embossed ivory stationery under a gold-lined Moorish arch. Code-native, because the emboss is two SVG filters (`cf-emb` / `cf-embF`) over reusable symbols, which Canva cannot reproduce crisply or with themable colour. The adaptation is adaptive name sizing.
2. **Canvas.** 1500 × 2100, G-300.
3. **Safe areas.** Text column (36, 74)–(264, 386) [12–88 %, 17.6–91.9 %]. No text in the top-left spray box (0, 0)–(140, 158) or the bottom-right box (160, 262)–(300, 420). Keep 8 px off the arch strokes.
4. **Background and material.** Flat `#F4EAE0`. Ornaments use paper gradient `#FDF8F2 → #EADACB` (diagonal). Emboss shadow `#76503F` at 40 %, offset (1.1, 1.4), blur 1; highlight white at 95 %, offset (−0.9, −1). The bottom-right spray has the light reversed.
5. **Typography** (SAMPLE COPY: «بكل الحب», «سارة», «أحمد», "Sara & Ahmed", «الخميس · ١٢ أغسطس ٢٠٢٧», "Thursday, 12 August 2027 · 7:00 PM", «قاعة المارغولد الكبرى — القاهرة»):

   | Zone | Font | px @300 | % H | Colour |
   |---|---|---|---|---|
   | greeting | Amiri 400 | 13 | 3.1 | `#7A5A2F` |
   | name A, name B | Aref Ruqaa 400 | 46 → **adaptive 22–46** | 11.0 | `#4A2E29` |
   | «و» | Aref Ruqaa | 22 | 5.2 | `#B8925A` |
   | Latin names | Cormorant Garamond italic | 19 | 4.5 | `#6E5048` («&» `#7A5A2F`) |
   | Arabic date | Amiri | 14 | 3.3 | `#4A2E29` |
   | Latin date · time | Cormorant italic | 13 | 3.1 | `#6E5048` |
   | venue — city | Amiri | 12.5 | 3.0 | `#7A5A2F` |

   **Long names:** step the Ruqaa size down 46 → 22 until both names fit inside a 228 × 150 box, or use `arFontA/B` (clamp 18–36).
6. **Layer table** (back to front):

   | # | Layer | Placement (G-300) | Rotation | Opacity | Colour / fill |
   |---|---|---|---|---|---|
   | 1 | paper | full 300 × 420 | 0 | 1 | `#F4EAE0` |
   | 2 | outer arch | path from (14, 408) up to apex (150, 16), down to (286, 408) | 0 | 1 | stroke `#B8925A` 1 |
   | 3 | inner arch | (22, 400) → apex (150, 32) → (278, 400) | 0 | 0.8 | stroke `#B8925A` 0.5 |
   | 4 | apex diamond | centre (150, 15), 10 × 14 | 0 | 1 | `#B8925A` |
   | 5 | top-left spray | box (0, 0) 140 × 158 (viewBox 230 × 260, scale 0.609): 2 vines (stroke `#F1E5D8` 3.2), 6 leaves, 6 berries `#F8EFE5` r 2–2.4, roses at (39, 39) × 0.76, (91, 19) × 0.44, (18, 104) × 0.47 | leaves −18° to 96° | 1 | paper gradient + emboss |
   | 6 | bottom-right spray | box (160, 262) 140 × 158, the same group rotated 180°: 2 vines, 4 leaves, 2 roses | 180° | 1 | paper gradient + reversed emboss |
   | 7 | text column | (36, 74)–(264, 386), centred | 0 | 1 | see typography |
   | 8 | rule | 90 × 1, centred, 12 px below the Latin names | 0 | 1 | `#B8925A` |

7. **Objects and ornament.** The 5-lobe rose (`cf-lobes` ×2 at 36° and 0.62 scale, plus a centre r 7.5 with a spiral), the leaf `cf-leafp` (34 × 18 lens), berries. All are tone-on-tone, so they read only through the emboss.
8. **Data zones.** `greetingAr`, `arA`, `arB`, `enA`, `enB`, `dayAr`, `dateAr`, `dayEn`, `dateEn`, `timeEn`, `venueAr`, `cityAr`, filled by the face template at render time.
9. **Couple and single.** Single: delete the «و» and B lines; the English is `enA` only. The column re-centres vertically on its own because it is a centred flex column.
10. **Occasion variants.** Couple ceremonies (wedding, engagement, katb_kitab, henna). For single use, the greeting becomes the event label (for example «تخرج»). No other change.
11. **Envelope.** env `#6B1E2C` (wine envelope under an ivory card), paper `#F4EAE0` lining, accent `#B8925A` mini-card border; card back `#6B1E2C`.
12. **Thumbnail.** Live: `ivory-morning` (marble), `wedding-silk`, `contract-ivory`. Static export: `signature.card.lace.thumb.v1`.
13. **Motion storyboard.** No face-level animation. Engine motion only.
14. **Export.** `signature.card.lace.ornament.v1.svg` (layers 5–6 as one SVG with the filters kept inline under new ids, or as two symbols), `signature.card.lace.frame.v1.svg` (layers 2–4), optional `signature.card.lace.paper.v1.png` (fibre texture at 4–6 %), `signature.card.lace.thumb.v1.png`.
15. **Acceptance checks.**
    - Names of 25 and 27 Arabic characters stay inside the arch, and the venue line stays above y 386 (compare `previews/long-lace-marble.png`, which fails today).
    - Single «ليان» shows no «و».
    - The emboss is visible at 1× DPR.
    - No text intrudes into the spray boxes.

---

## 2. `wine` — Wine & Gold · status: **adapted** · blueprint: **code-native SVG**, optional Canva ornament master

1. **Identity.** A heraldic burgundy card with a gold crest and rose garlands; the engine's default card. Adaptations: adaptive name size, a clear zone between the bottom-right garland and the venue/footer, and an Arabic date and venue line.
2. **Canvas.** 1500 × 2100.
3. **Safe areas.** Text (30, 150)–(270, 386). Crest zone (94, 52)–(206, 140): monograms only. Garland keep-out top-left (0, 0)–(130, 110) and bottom-right (170, 310)–(300, 420). **New:** move venue and footer to x 40–230, or shrink the bottom-right garland to scale 0.85.
4. **Background and material.** Radial gradient centred (150, 189), radii 90 % × 70 %: `#6E1D2C → #521220`. Gold `#D9B77A` hairlines. Foil gradient for the names: `#A87E45 0 %, #F6E2AE 22 %, #C9A15F 40 %, #FBEBC4 58 %, #B8925A 78 %, #F3D9A0 100 %` at 100°.
5. **Typography** (SAMPLE COPY as for `lace`, plus "WITH LOVE", "THE GRAND MARIGOLD HALL · CAIRO", "DINNER · CELEBRATION · RSVP"):

   | Zone | Font | px | % H | Colour |
   |---|---|---|---|---|
   | monoA / monoB | Aref Ruqaa | 20 | 4.8 | `#F3D9A0` at y 70 / 102 |
   | greeting AR | Amiri | 13 | 3.1 | `#E3C58C` |
   | greeting EN | Cormorant, tracking 0.3em | 9.5 | 2.3 | `#E3C58C` |
   | names `A و B` | Aref Ruqaa, foil | 40 → **adaptive 22–40** | 9.5 | foil |
   | Latin names | Cormorant | 25 | 6.0 | `#F2DDD0`, «&» `#D9B77A` |
   | `DAY · DATE` | Cormorant, 0.2em | 11 | 2.6 | `#F2DDD0` |
   | Arabic day · time (**+ dateAr**) | Amiri | 13 | 3.1 | `#F2DDD0` |
   | venue EN (**+ venueAr**) | Cormorant 0.2em / Amiri 12 | 10 | 2.4 | `#F2DDD0` |
   | footer | Cormorant 0.22em | 9.5 | 2.3 | `#E3C58C` |

6. **Layer table:**

   | # | Layer | Placement | Rot. | Opacity | Colour |
   |---|---|---|---|---|---|
   | 1 | velvet | full, radial | 0 | 1 | `#6E1D2C → #521220` |
   | 2 | rule 1 | inset 12 | 0 | 0.85 | `#D9B77A` 1 |
   | 3 | rule 2 | inset 17 | 0 | 0.4 | `#D9B77A` 1 |
   | 4 | corner brackets | L 24 px at (6, 6), (294, 6), (6, 414), (294, 414) | 0 | 1 | `#D9B77A` 1 |
   | 5 | corner diamonds | 6 × 6 at the four corners | 45° | 1 | `#D9B77A` |
   | 6 | cartouches | 28 × 8 `#5E1624` bar plus diamond plus 2 dots, centred (150, 12) and (150, 408) | 0 | 1 | gold |
   | 7 | top-left garland | vine from (20, 100) to (118, 16), curl at (40, 60); 5 leaves (scale 0.55–0.9, −80° to 160°); roses (48, 48) × 1.15 and (96, 30) × 0.55 | various | 1 | leaves `#6A1A2A` stroke gold 0.9; roses `#6A1A2A / #7C2334 / #8A2D3C`, strokes `#D9B77A / #E6C79A` |
   | 8 | bottom-right garland | layer 7 rotated 180° about (150, 210): roses at (252, 372) × 1.15 and (212, 350) × 0.55, 3 leaves | 180° | 1 | same |
   | 9 | crest | shield centred (150, 96), from (122, 66) to (178, 136), fill `#5E1624`, gold stroke 1; inner line 0.5; crown (150, 52–66); bar at y 98 | 0 | 1 | gold |
   | 10 | monograms | Ruqaa 20, centred at y 70 and 102 | 0 | 1 | `#F3D9A0` |
   | 11 | text column | (30, 150)–(270, 386) | 0 | 1 | — |
   | 12 | divider | 120 × 10: two 52 px lines with a diamond at the centre | 0 | 1 | `#D9B77A` 0.7 |

7. **Ornament.** The gold rose `cf-grose`, the leaf, the crest. All flat vectors, good for Canva drawing and SVG export.
8. **Data zones.** `monoA/B`, `greetingAr`, `greetingEnU`, `arA/arB`, `enA/enB`, `dayEnU`, `dateEnU`, `dayAr`, `timeAr`, `venueEnU`, `cityEnU`, `cardFooterEnU` (+ `dateAr`, `venueAr` proposed).
9. **Couple and single.** Single: no `monoB` (the crest then holds one letter at y 70; recentre it to y 86), the name line is `arA` alone, and the English is `enA` alone.
10. **Occasion variants.** Couple: footer `DINNER · CELEBRATION · RSVP`. Fix: derive the footer from the starter programme. For katb_kitab and henna it should not say DINNER. Corporate use (`wine-constellation`): consider dropping the garlands, keeping crest and frame.
11. **Envelope.** env `#3E0F18`, paper `#5B1523` (dark lining), accent `#D9B77A`.
12. **Thumbnail.** Live: `candle-night` (3D photo thumbnail with the live face overlaid), `wine-palace`, `wine-constellation`, `wedding-candlelight`. Static export: `signature.card.wine.thumb.v1`.
13. **Motion.** Names: foil gradient drift, 6 s ease-in-out infinite (`fxFoil`). Static: foil frozen at 0 %.
14. **Export.** `signature.card.wine.ornament.v1.svg` (layers 7–8), `signature.card.wine.crest.v1.svg` (layer 9, no letters), `signature.card.wine.frame.v1.svg` (layers 2–6), `signature.card.wine.thumb.v1.png`.
15. **Acceptance.**
    - The long-name capture (`previews/long-wine-candlelit.png`) no longer overlaps the crest or the garland.
    - The sample venue line does not touch the bottom-right rose.
    - Arabic date and venue are present.
    - Single shows one centred monogram.

---

## 3. `emerald` — Emerald Deco · status: **retained** · blueprint: **code-native SVG**

1. **Identity.** An Art Deco marquee in green and gold. Retained, with long names still to be verified.
2. **Canvas.** 1500 × 2100.
3. **Safe areas.** Text (40, 70)–(260, 350). Fan arch (110, 30)–(190, 54). Bottom diamonds (128, 360)–(172, 376).
4. **Background.** Radial centred (150, 176), radii 80 % × 60 %: `#1A4539 → #0F2C25`. Gold `#D4B06A`.
5. **Typography** (SAMPLE COPY: «بكل الحب», WITH LOVE, «سارة», «أحمد», SARA & AHMED, 12 · 08 · 2027, «الخميس · السابعة مساءً», THE GRAND MARIGOLD HALL):

   | Zone | Font | px | % H | Colour |
   |---|---|---|---|---|
   | greeting AR | Reem Kufi | 13 | 3.1 | `#E2C27E` |
   | greeting EN | Cormorant 0.4em | 9.5 | 2.3 | `#E2C27E` |
   | names | Reem Kufi 500 | 38 (fit to 220 px width) | 9.0 | `#F2E8D5` |
   | «و» | Reem Kufi | 18 | 4.3 | `#D4B06A` |
   | Latin names caps | Cormorant 0.34em | 12.5 | 3.0 | `#E2C27E` |
   | `dateNum` | Cormorant 300, 0.14em | 24 | 5.7 | `#F2E8D5` |
   | day · time AR | Amiri | 13 | 3.1 | `#CFC3A8` |
   | venue EN | Cormorant 0.26em | 9.5 | 2.3 | `#CFC3A8` |

6. **Layer table:**

   | # | Layer | Placement | Rot. | Opacity | Colour |
   |---|---|---|---|---|---|
   | 1 | ground | radial | 0 | 1 | as above |
   | 2 | sunburst | 13 lines from (150, 215) to (150, 35), (210, 45), (262, 80), (290, 150), (90, 45), (38, 80), (10, 150), (180, 38), (120, 38), (238, 60), (62, 60), (278, 112), (22, 112) | 0 | 0.16 | `#D4B06A` 0.6 |
   | 3 | outer stepped frame | polygon 28, 14 / 272, 14 / 272, 26 / 286, 26 / 286, 394 / 272, 394 / 272, 406 / 28, 406 / 28, 394 / 14, 394 / 14, 26 / 28, 26 | 0 | 1 | stroke 1.1 |
   | 4 | inner stepped frame | the same pattern at 34 / 21 / 266 / 279 / 33 / 387 / 399 | 0 | 1 | stroke 0.5 |
   | 5 | fan arch | semicircles r 24 / 16 / 8 centred (150, 54), baseline 110–190 | 0 | 1 | stroke 1 |
   | 6 | bottom diamonds | (150, 368) 12 × 16; (132, 372) and (168, 372) 8 × 8 | 0 | 1 / 0.7 / 0.7 | `#D4B06A` |
   | 7 | corner diamonds | 8 × 8 at (14, 14), (286, 14), (14, 406), (286, 406) | 45° | 1 | `#D4B06A` |
   | 8 | text column | (40, 70)–(260, 350) | 0 | 1 | — |
   | 9 | rule | 110 × 1 | 0 | 1 | `#D4B06A` |

7. **Ornament.** Geometric only.
8. **Data zones.** `greetingAr`, `greetingEnU`, `arA/B`, `enAU/BU`, `dateNum`, `dayAr`, `timeAr`, `venueEnU`.
9. **Couple and single.** Single: drop «و» and B.
10. **Occasion variants.** Opening and corporate: unchanged; the greeting becomes the event label.
11. **Envelope.** env `#0B241E`, paper `#12352D`, accent `#D4B06A`.
12. **Thumbnail.** Live: `emerald-candle` (3D photo), `emerald-garden`, `opening-palace`, `corporate-candle`.
13. **Motion.** None at face level.
14. **Export.** `signature.card.emerald.frame.v1.svg` (3–7), `signature.card.emerald.sunburst.v1.svg` (2), `signature.card.emerald.thumb.v1.png`.
15. **Acceptance.** A long couple name fits above the rule. Single centred. Sunburst rays converge behind the names.

---

## 4. `sage` — Sage Botanical · status: **adapted** · blueprint: **hybrid** (Canva for the branch, code for the rest)

1. **Identity.** Eucalyptus on sage paper with a script English line. Adaptation: shrink or move the top-right branch out of the name band.
2. **Canvas.** 1500 × 2100.
3. **Safe areas.** Text (34, 56)–(266, 370). **Name band (34, 130)–(266, 210) must be ornament-free.** Fix: scale the top-right branch to 0.8 (box (164, 0)–(300, 152)).
4. **Background.** Flat `#E6EADC`. Frame at inset 14, 1 px `rgba(111,127,92,.45)`, radius 4.
5. **Typography** (SAMPLE COPY: «بكل الحب», «سارة و أحمد», "Sara & Ahmed", THURSDAY · 12 AUGUST 2027, «الخميس · ١٢ أغسطس ٢٠٢٧ · السابعة مساءً», "The Grand Marigold Hall, Cairo"):

   | Zone | Font | px | % H | Colour |
   |---|---|---|---|---|
   | greeting | Amiri | 13 | 3.1 | `#4F5E3F` |
   | names (one line) | Aref Ruqaa | 42 → adaptive | 10.0 | `#2F3B2C` |
   | Latin names | Great Vibes | 36 → adaptive | 8.6 | `#4F5E3F` |
   | date EN | Cormorant 0.24em | 11 | 2.6 | `#2F3B2C` |
   | date AR | Amiri | 13.5 | 3.2 | `#2F3B2C` |
   | venue EN (+ venueAr proposed) | Cormorant italic | 14 | 3.3 | `#56624F` |

6. **Layer table:**

   | # | Layer | Placement | Rot. | Opacity | Colour |
   |---|---|---|---|---|---|
   | 1 | paper | full | 0 | 1 | `#E6EADC` |
   | 2 | top-right branch | box (130, 0) 170 × 190: main stem from (172, −4) curving to (88, 176), side stem (150, 34) → (118, 70), 15 leaves (rx 7–11, ry 5–8, −85° to 20°) | per leaf | 1 (one leaf 0.85) | stems `#6F7F5C` 1.4 / 1; leaves `#B9C6A7`, stroke `#7D8C69` 0.8 |
   | 3 | bottom-left branch | box (0, 252) 150 × 168, the same branch at scale 0.88, rotated 180° | 180° | 1 | same |
   | 4 | frame | inset 14 | 0 | 0.45 | `#6F7F5C` |
   | 5 | text column | (34, 56)–(266, 370) | 0 | 1 | — |
   | 6 | leaf divider | 90 × 14: lines 0–36 and 54–90, leaf ellipse 12 × 8 at the centre | 0 | 1 | `#6F7F5C` / `#B9C6A7` |

7. **Ornament.** The eucalyptus branch: an ideal Canva illustration. Keep stems and leaves as separate SVG groups so the stems can draw on.
8. **Data zones.** `greetingAr`, `arA/B`, `enA/B`, `dayEnU`, `dateEnU`, `dayAr`, `dateAr`, `timeAr`, `venueEn`, `cityEn`.
9. **Couple and single.** Single: `arA` and `enA` only.
10. **Occasion variants.** Newborn, family and birthday use it single. No art change.
11. **Envelope.** env `#5C6B4A`, paper `#E6EADC`, accent `#8A9A6E`.
12. **Thumbnail.** Live: `sage-morning`, `engagement-petals`, `family-garden`.
13. **Motion.** Stems draw on: stroke-dasharray 900, 3.2 s, `cubic-bezier(.6,0,.2,1)`, delay 0.3 s, once. Static: fully drawn.
14. **Export.** `signature.card.sage.ornament.v1.svg` (with groups `stems` and `leaves`), `signature.card.sage.thumb.v1.png`.
15. **Acceptance.** No leaf overlaps the name band (compare `previews/canon-sage-petals.png`, which fails today). Single renders. The draw-on completes.

---

## 5. `blush` — Blush Watercolor · status: **redesigned** · blueprint: **hybrid** (Canva raster wash + code text)

1. **Identity.** Watercolour peonies on blush paper. Redesign: an Arabic-first hierarchy (Ruqaa hero, script secondary), an Arabic venue, and a raster wash replacing the live SVG filters.
2. **Canvas.** 1500 × 2100.
3. **Safe areas.** Text (30, 70)–(270, 360). Keep the hero name off the peony centres (54, 58) and (248, 360) by at least 24 px.
4. **Background.** Paper `#FBF1ED`. Wash palette `#F3C6CB`, `#F7DAC6`, `#E3D3EE`, leaf `#BFD2C1`; peony radial `#FBE0E4 → #F2B3C0 → #E08C9F`.
5. **Typography (redesigned; SAMPLE COPY):**

   | Zone | Font | Current → redesigned px | % H | Colour |
   |---|---|---|---|---|
   | Arabic names | Aref Ruqaa | 28 → **44, adaptive 22–44**, stacked with «و» 20 px | 10.5 | `#9A5560` |
   | Latin names | Great Vibes | 54 → **28, adaptive 18–28**, one line `A & B` | 6.7 | `#5A3A3F` |
   | date EN | Cormorant italic | 16 | 3.8 | `#7A5A5F` |
   | date AR | Amiri | 13.5 | 3.2 | `#5A3A3F` |
   | venue | **Amiri 12.5 `venueAr — cityAr`** + Cormorant 9.5 0.26em `VENUE · CITY` | — | — | `#9A5560` |

6. **Layer table** (current geometry, kept):

   | # | Layer | Placement | Rot. | Opacity | Colour |
   |---|---|---|---|---|---|
   | 1 | paper | full | 0 | 1 | `#FBF1ED` |
   | 2 | top-left wash | circles (30, 40) r 66, (110, 6) r 44, (6, 140) r 40; leaf ellipse (94, 80) 52 × 20 | leaf 30° | 0.75 / 0.75 / 0.7 / 0.8 | `#F3C6CB` / `#F7DAC6` / `#E3D3EE` / `#BFD2C1` |
   | 3 | bottom-right wash | circles (272, 386) r 70, (196, 420) r 46, (300, 286) r 40; leaf (206, 344) | leaf 30° | 0.7 / 0.75 / 0.65 / 0.8 | same |
   | 4 | peony top-left | concentric r 30 / 21 / 12 at (54, 58) | 0 | 1 / 0.9 / 1 | peony radial |
   | 5 | peony bottom-right | r 28 / 19 / 10 at (248, 360) | 0 | same | peony radial |
   | 6 | text column | (30, 70)–(270, 360) | 0 | 1 | — |

   In Canva, paint layers 2–5 as one raster per corner (soft watercolour brush, bleeding edges). This replaces `cf-wc` (turbulence displacement 24, blur 2.5) and `cf-wc2` (displacement 7).
7. **Ornament.** Painted peonies and washes. Canva is a good fit here.
8. **Data zones.** `arA/B`, `enA/B`, `dayEn`, `dateEn`, `dayAr`, `dateAr`, `timeAr`, `venueAr`, `cityAr` (new), `venueEnU`, `cityEnU`.
9. **Couple and single.** Single: `arA` and `enA` only, with no «&».
10. **Occasion variants.** Newborn and birthday use it single.
11. **Envelope.** env `#B87880`, paper `#FBF1ED`, accent `#D9A0A6`.
12. **Thumbnail.** Live: `blush-petals`, `newborn-cloud`, `blush-silk`.
13. **Motion.** None.
14. **Export.** `signature.card.blush.wash.v1.png` (layers 2–3, transparent, 1500 × 2100 and 600 × 840), `signature.card.blush.peony.v1.png` (layers 4–5), `signature.card.blush.thumb.v1.png`.
15. **Acceptance.** Arabic is the largest text. A 30-character English name stays inside 240 px. No live SVG filter remains. The wash reads the same on a phone at 1× DPR.

---

## 6. `midnight` — Midnight Stars · status: **retained** · blueprint: **code-native** (seeded stars and a mask)

1. **Identity.** A night sky, gold crescent and constellations. Code-native: the star field is seeded (LCG, seed 7) and twinkles.
2. **Canvas.** 1500 × 2100.
3. **Safe areas.** Text (34, 112)–(266, 384). The moon zone (116, 32)–(184, 100) must stay clear.
4. **Background.** Linear 180° `#10172E → #1E2A4C`. Stars `#F6E7C1`. Gold `#E8C98A`.
5. **Typography** (SAMPLE COPY):

   | Zone | Font | px | % H | Colour |
   |---|---|---|---|---|
   | greeting | Amiri | 13 | 3.1 | `#E8C98A` |
   | names | Aref Ruqaa, foil | 44 (adaptive proposed) | 10.5 | foil |
   | «و» | Aref Ruqaa | 20 | 4.8 | `#E8C98A` |
   | Latin | Cormorant italic | 19 | 4.5 | `#F1E9D8` |
   | date EN | Cormorant 0.24em | 11 | 2.6 | `#F1E9D8` |
   | day · time · venue AR (+ dateAr proposed) | Amiri | 13 | 3.1 | `#C9C3B5` |

6. **Layer table:**

   | # | Layer | Placement | Rot. | Opacity | Colour |
   |---|---|---|---|---|---|
   | 1 | sky | full gradient | 0 | 1 | as above |
   | 2 | stars | 34 dots, seeded, x 0–290, y 0–410, Ø 0.8–2.6 | 0 | twinkle 0.25 → 1 | `#F6E7C1` |
   | 3 | moon halo | circle (150, 66) r 34 | 0 | 0.12 | `#E8C98A` |
   | 4 | crescent | circle (150, 66) r 22 minus circle (160, 62) r 20 | 0 | 1 | `#E8C98A` |
   | 5 | constellations | (40, 52)–(68, 40)–(92, 62)–(80, 92); (220, 40)–(246, 58)–(272, 50); nodes r 1.4–1.9 | 0 | lines 0.45 | `#E8C98A` |
   | 6 | frame | rect (14, 14) 272 × 392, rx 8 | 0 | 0.5 | stroke `#E8C98A` 0.8 |
   | 7 | corner sparkles | 4-point star 16 px at the 4 frame corners | 0 | 1 | `#E8C98A` |
   | 8 | text column | (34, 112)–(266, 384) | 0 | 1 | — |
   | 9 | rule | 80 × 1 | 0 | 0.7 | `#E8C98A` |

7. **Ornament.** Moon, constellations, sparkles.
8. **Data zones.** `greetingAr`, `arA/B`, `enA/B`, `dayEnU`, `dateEnU`, `dayAr`, `timeAr`, `venueAr`.
9. **Couple and single.** Captured single «ليان»: correct.
10. **Occasion variants.** Graduation, iftar, other and corporate: the greeting becomes the event label.
11. **Envelope.** env `#0C1226`, paper `#141C35`, accent `#E8C98A`.
12. **Thumbnail.** Live: `midnight-stars`, `graduation-horizon`, `other-sunset`.
13. **Motion.** 34 stars twinkle (3.2 s base, per-star delay 0–4 s and duration 2–4.5 s); names foil drift 6 s. Static: frozen.
14. **Export.** `signature.card.midnight.sky.v1.png` (optional static star-field fallback), `signature.card.midnight.moon.v1.svg`, `signature.card.midnight.thumb.v1.png`.
15. **Acceptance.** Stars stay deterministic across reloads. The moon is clear of text. Single is correct.

---

## 7. `arabesque` — Arabesque · status: **retained** · blueprint: **code-native SVG**

1. **Identity.** A mihrab arch in a star border, with a swaying lantern. Code-native: a tiled pattern plus an animated group.
2. **Canvas.** 1500 × 2100.
3. **Safe areas.** Text (72, 146)–(228, 364), inside the arch. Lantern zone (140, 84)–(160, 138).
4. **Background.** `#F7F0E3`. Ink `#B08A4A`. Arch wash `rgba(176,138,74,.07)`.
5. **Typography** (SAMPLE COPY):

   | Zone | Font | px | % H | Colour |
   |---|---|---|---|---|
   | greeting | Amiri | 12.5 | 3.0 | `#7E5E2A` |
   | names | Aref Ruqaa | adaptive 18–36 (`arFontA/B`) | 4.3–8.6 | `#3A2A1E` |
   | «و» | Aref Ruqaa | 18 | 4.3 | `#B08A4A` |
   | Latin | Cormorant italic | 16 | 3.8 | `#5E4A3A` |
   | date AR | Amiri | 13.5 | 3.2 | `#3A2A1E` |
   | day · time EN | Cormorant italic | 12.5 | 3.0 | `#5E4A3A` |
   | venue AR | Amiri | 12 | 2.9 | `#7E5E2A` |

6. **Layer table:**

   | # | Layer | Placement | Rot. | Opacity | Colour |
   |---|---|---|---|---|---|
   | 1 | paper | full | 0 | 1 | `#F7F0E3` |
   | 2 | star bands | tile 22 px (two 11 px squares at 0° / 45° plus a dot r 1.5) filling (10, 10) 280 × 22, (10, 388) 280 × 22, (10, 32) 22 × 356, (268, 32) 22 × 356 | 0 | 1 | `#B08A4A` 0.8 |
   | 3 | outer frame | rect (10, 10) 280 × 400 | 0 | 1 | stroke 1 |
   | 4 | inner frame | rect (32, 32) 236 × 356 | 0 | 1 | stroke 1 |
   | 5 | arch | (60, 372) up to (60, 178), curving to apex (150, 74), mirrored | 0 | 1 | fill 7 % `#B08A4A`, stroke 1 |
   | 6 | inner arch | (68, 364) → apex (150, 84) | 0 | 1 | stroke 0.5 |
   | 7 | lantern | cord (150, 84)–(150, 104); hexagon (142–158, 104–136) `#E9D3A6`; flame r 3 at (150, 121) `#F6C66A` | sway ±3° about (150, 84) | 1 | stroke `#B08A4A` 0.8 |
   | 8 | text column | (72, 146)–(228, 364) | 0 | 1 | — |
   | 9 | star glyph | 18 × 18, centred under the Latin names | 0 | 1 | `#B08A4A` |

7. **Ornament.** The eight-point star tile and the lantern.
8. **Data zones.** `greetingAr`, `arA/B` with `arFontA/B`, `enA/B`, `dayAr`, `dateAr`, `dayEn`, `timeEn`, `venueAr`.
9. **Couple and single.** Single: drop «و» and B.
10. **Occasion variants.** Iftar and family: the "name" may be a family name; it fits through adaptive sizing.
11. **Envelope.** env `#1F4A55` (teal envelope), paper `#F7F0E3`, accent `#B08A4A`.
12. **Thumbnail.** Live: `arabesque-palace`, `iftar-lantern`, `iftar-sunset`.
13. **Motion.** Lantern sway 5 s ±3° and flame glow 3 s (0.75 ↔ 1). Static: still.
14. **Export.** `signature.card.arabesque.pattern.v1.svg` (seamless 22 px tile), `signature.card.arabesque.lantern.v1.svg` (pivot at the top of the cord), `signature.card.arabesque.thumb.v1.png`.
15. **Acceptance.** Long names (`previews/long-arabesque-palace.png`) stay inside the arch. The tile is seamless at every band join.

---

## 8. `minimal` — Modern Minimal · status: **retained** · blueprint: **code-native**

1. **Identity.** An editorial poster with giant pale initials. Pure typography.
2. **Canvas.** 1500 × 2100.
3. **Safe areas.** Bottom block (30, ~200)–(270, 390), aligned to the start (right) edge. Top-right block (210, 34)–(270, 60). The initials may bleed.
4. **Background.** `#FAFAF7`. Initials `#EFECE4`. Accent `#B89A5E`.
5. **Typography** (SAMPLE COPY: S / A, «بكل الحب», «سارة و أحمد», SARA — AHMED, 12.08.27, «الخميس · السابعة مساءً · قاعة المارغولد الكبرى», THE GRAND MARIGOLD HALL · CAIRO, WEDDING · 2027):

   | Zone | Font | px | % H | Colour |
   |---|---|---|---|---|
   | initA / initB | Cormorant 300 | 250 | 59.5 | `#EFECE4` |
   | vertical label | Cormorant 0.5em | 9 | 2.1 | `#7A6230` |
   | greeting | Reem Kufi | 12 | 2.9 | `#5A5A5A` |
   | names | Reem Kufi | 32 | 7.6 | `#1C1C1C` |
   | Latin caps | Cormorant 0.36em | 12 | 2.9 | `#5A5A5A` |
   | `dateShort` | Cormorant 300 | 50 | 11.9 | `#1C1C1C` |
   | day · time · venue AR | Reem Kufi | 12.5 | 3.0 | `#5A5A5A` |
   | venue · city EN | Cormorant 0.3em | 9.5 | 2.3 | `#5A5A5A` |

6. **Layer table:**

   | # | Layer | Placement | Rot. | Opacity | Colour |
   |---|---|---|---|---|---|
   | 1 | paper | full | 0 | 1 | `#FAFAF7` |
   | 2 | initA | top-left of the glyph box at (14, −34), LTR | 0 | 1 | `#EFECE4` |
   | 3 | initB (couple) | (118, 88) | 0 | 1 | `#EFECE4` |
   | 4 | vertical label | anchor (−38, 200) | −90° | 1 | `#7A6230` |
   | 5 | greeting + 28 px rule | top-right (right 30, top 34), gap 6 | 0 | 1 | `#5A5A5A` / `#B89A5E` |
   | 6 | bottom block | left 30, right 30, bottom 30, start-aligned | 0 | 1 | — |
   | 7 | 40 px rule | inside the block, margin 14 / 8 | 0 | 1 | `#B89A5E` |

7. **Ornament.** None.
8. **Data zones.** `initA/B`, `eventLabelEnU`, `year`, `greetingAr`, `arA/B`, `enAU/BU`, `dateShort`, `dayAr`, `timeAr`, `venueAr`, `venueEnU`, `cityEnU`.
9. **Couple and single.** Single: no initB, names `arA`, Latin `enAU`.
10. **Occasion variants.** Conference and corporate: initA comes from an organisation name (README §6 E2). Consider an option to hide the initials when the name is not a person.
11. **Envelope.** env `#1C1C1C`, paper `#FAFAF7`, accent `#B89A5E`.
12. **Thumbnail.** Live: `quiet-silk` (static), `moonlit-sea`, `conference-editorial`.
13. **Motion.** None.
14. **Export.** `signature.card.minimal.thumb.v1.png` only.
15. **Acceptance.** Two-line names push the block upward without touching the greeting block. Single shows one initial.

---

## 9. `terracotta` — Terracotta Sun · status: **retained** · blueprint: **hybrid** (Canva landscape layers + code text)

1. **Identity.** A sunset through an arched window over dunes.
2. **Canvas.** 1500 × 2100.
3. **Safe areas.** Text (30, 250)–(270, 394). Never put text inside the arch (60, 34)–(240, 234).
4. **Background.** `#EFE2D2`. Sky `#E58A68 → #F4C49B (70 %) → #F7D8B4`. Sun `#FBE6C4`. Dunes `#C9754F`, `#B4583A`, `#8E3F28`. Outline `#4A2A1E`; outer arch `#B4583A`.
5. **Typography** (SAMPLE COPY):

   | Zone | Font | px | % H | Colour |
   |---|---|---|---|---|
   | names | Reem Kufi | 30 (adaptive proposed, min 18) | 7.1 | `#4A2A1E` |
   | Latin | Cormorant italic | 20 | 4.8 | `#6E4A3A` |
   | `DAY · dateNum` | Cormorant 0.24em | 11 | 2.6 | `#4A2A1E` |
   | time · venue AR | Reem Kufi | 12.5 | 3.0 | `#6E4A3A` |

6. **Layer table:**

   | # | Layer | Placement | Rot. | Opacity | Colour |
   |---|---|---|---|---|---|
   | 1 | paper | full | 0 | 1 | `#EFE2D2` |
   | 2 | sky (clipped to arch) | arch x 60–240, y 34–234 (semicircle r 90 centred (150, 124), straight sides to y 234) | 0 | 1 | sky gradient |
   | 3 | sun halo | (150, 162) r 46 | 0 | 0.35 | `#FBE6C4` |
   | 4 | sun | (150, 162) r 32 | 0 | 1 | `#FBE6C4` |
   | 5 | dune 1 | crest y ≈ 162–188 across the arch | 0 | 1 | `#C9754F` |
   | 6 | dune 2 | crest y ≈ 182–204 | 0 | 1 | `#B4583A` |
   | 7 | dune 3 | crest y ≈ 210–222 | 0 | 1 | `#8E3F28` |
   | 8 | arch outline | the arch | 0 | 1 | stroke `#4A2A1E` 1 |
   | 9 | outer arch | offset 6 px | 0 | 1 | stroke `#B4583A` 0.6 |
   | 10 | text column | (30, 250)–(270, 394) | 0 | 1 | — |
   | 11 | divider | 60 × 12: lines plus a half-sun r 6 | 0 | 1 | `#B4583A` |

7. **Ornament.** The landscape. Draw it in Canva and export the sun separately.
8. **Data zones.** `arA/B`, `enA/B`, `dayEnU`, `dateNum`, `timeAr`, `venueAr` (proposed: `greetingAr`, `dateAr`).
9. **Couple and single.** Single: `arA` and `enA`.
10. **Occasion variants.** Family, iftar, opening, birthday and henna: no art change.
11. **Envelope.** env `#B4583A` (= accent), paper `#EFE2D2`.
12. **Thumbnail.** Live: `desert-sun`, `henna-earth`, `terracotta-garden`.
13. **Motion.** Sun bob ±4 px over 9 s (`fxSun`). Static: at rest.
14. **Export.** `signature.card.terracotta.landscape.v1.svg` with groups `sky`, `sun`, `dune-1..3`; `signature.card.terracotta.thumb.v1.png`. Rename the inline `cf-archclip` per instance or move it to shared defs.
15. **Acceptance.** A two-line couple name fits above y 394. No duplicate ids when three terracotta thumbnails share a page.

---

## 10. `clay` — Pastel Clay · status: **retained** · blueprint: **hybrid** (Canva clay props as PNG + code)

1. **Identity.** Puffy clay props on a padded pillow.
2. **Canvas.** 1500 × 2100.
3. **Safe areas.** Text (34, 74)–(266, 360). Props stay in the corners.
4. **Background.** Linear 180° `#FFD6E4 → #FFE6D2`. Pillow `#FFF6EE` at inset 14, radius 24, with an inset highlight `0 10 14 rgba(255,255,255,.85)`, an inset shade `0 −12 18 rgba(190,140,120,.2)` and a drop shadow `0 8 18 rgba(165,106,133,.18)`.
5. **Typography** (SAMPLE COPY):

   | Zone | Font | px | % H | Colour |
   |---|---|---|---|---|
   | greeting | Amiri | 13 | 3.1 | `#A0506C` |
   | names | Aref Ruqaa | 44 (adaptive proposed) | 10.5 | `#7A4F5E` |
   | «و» | Aref Ruqaa | 22 | 5.2 | `#E58FAE` |
   | Latin | Cormorant italic | 18 | 4.3 | `#8D6879` |
   | date pill | Amiri 13 on `#FFE3EC`, radius 16, padding 5 / 12 | 13 | 3.1 | `#7A4F5E` |
   | time pill | Cormorant 13 on `#E3F1FF` (proposed: `timeAr`) | 13 | 3.1 | `#7A4F5E` |
   | venue | Amiri | 12.5 | 3.0 | `#8D6879` |

6. **Layer table:**

   | # | Layer | Placement | Rot. | Opacity | Colour |
   |---|---|---|---|---|---|
   | 1 | ground | full gradient | 0 | 1 | as above |
   | 2 | pillow | inset 14 | 0 | 1 | `#FFF6EE` |
   | 3 | cloud top-left | ellipses (62, 52) 68 × 36, (46, 46) 36 × 32, (74, 40) 40 × 36 | 0 | 1 | `#FFFFFF → #F4E4EE` |
   | 4 | cloud bottom-right | (246, 372) 64 × 32, (232, 364), (258, 360) | 0 | 1 | same |
   | 5 | heart top-right | (252, 60) × 1.05 | 0 | 1 | `#FFD6E3 → #FF9EBE → #E27A9E` + highlight |
   | 6 | heart bottom-left | (44, 360) × 0.8 | −12° | 1 | same |
   | 7 | flower top-right | (222, 40) × 0.9, 5 petals r 8, centre r 6 | spin | 1 | `#FFF0F5 → #FFB9CE`, centre `#FFF4C4 → #FFCF5A` |
   | 8 | flower bottom-left | (78, 384) × 0.8 | spin | 1 | `#F0F8FF → #B9DDFB` |
   | 9 | dots | (36, 120) r 4, (268, 150) r 3.5, (262, 300) r 4, (40, 270) r 3 | 0 | 1 | `#FFC9D8` |
   | 10 | text column | (34, 74)–(266, 360) | 0 | 1 | — |

7. **Ornament.** Clay props. Canva 3D-style elements would raise quality; export each prop separately so it can float.
8. **Data zones.** `greetingAr`, `arA/B`, `enA/B`, `dayAr`, `dateAr`, `timeEn`, `venueAr`, `cityAr`.
9. **Couple and single.** Single: drop «و» and B.
10. **Occasion variants.** Birthday and newborn.
11. **Envelope.** env `#E98AAA`, paper `#FFF4F0`, accent `#F2A7BF`.
12. **Thumbnail.** Live: `clay-party`, `birthday-bloom`, `clay-silk`.
13. **Motion.** Clouds and heart float (6 s, −8 px); the other heart and the bottom-right cloud float2 (7.5 s, 6 / −10 px, 4°); flowers spin (24 s). Static: still.
14. **Export.** `signature.card.clay.props.v1` as separate transparent PNGs (`cloud-a`, `cloud-b`, `heart-a`, `heart-b`, `flower-pink`, `flower-blue`, 2×), plus `signature.card.clay.thumb.v1.png`.
15. **Acceptance.** Props never cross the text column. The pills fit `dayAr · dateAr` for the longest Arabic month names.

---

## Occasion faces (shared layout, `src/cards/occasion-cards.js`)

All six faces share one flex template (`STYLE`, :59-71):

- `.oc-inner`: a column with per-variant padding and gap, centred, and these rows:
  - **art band** (fixed height);
  - **heading** (greeting + Latin label);
  - **names** (`flex: 1`, auto-fitted by `names()`, :78-96: single starts at 31 px, couple at 22 px, min 8, with budget for wrapping meta rows; no ellipsis);
  - **meta** (top border `accent` at 33 % alpha (`55` hex): date 12 px, time 11 px, venue 11 px, city 10 px);
  - **footer** (Cormorant 8 px, tracking 1.1).
- The background vector layer is `z-index: −1`, full 300 × 420.
- The fitting loop is why these faces should stay **code-native**. Canva supplies only the art band and background vectors, and never text.

---

## 11. `grad-editorial` — Graduation Editorial · status: **adapted** · blueprint: **code-native SVG**

1. **Identity.** A cobalt editorial announcement with a cap and diploma. Adaptation: footer and rule collision.
2. **Canvas.** 1500 × 2100.
3. **Safe areas.** Inner box (23, 18)–(277, 403). **Fix:** footer ≤ y 392, or move the rule to y 404.
4. **Background.** Paper `#FFF9EF`. Band `#2E49BF`. Cap `#FFF8E7` with detail `#F2D374`. Diploma `#FFF8E7` / `#E9D9BA`, stroke `#A98544`, ribbon `#B45C42`. Brackets `#A7BAF6`.
5. **Typography** (SAMPLE COPY: «تخرج», GRADUATION, «ليان», "Layan", «الجمعة · ١٨ يونيو ٢٠٢٧», «٧:٣٠ م», «قاعة الريم», «الرياض», GRADUATION · RSVP):

   | Zone | Font | px | % H | Colour |
   |---|---|---|---|---|
   | greeting | Reem Kufi | 17 | 4.0 | `#2E49BF` |
   | label | Arial → **Readex Pro 700** (change) | 9, tracking 2 px | 2.1 | `#4E5C79` |
   | name | Reem Kufi | fitted 8–31 | ≤ 7.4 | `#172B67` |
   | Latin | Cormorant | 10 / 8 | 2.4 | `#172B67` |
   | date / time / venue / city | Reem Kufi | 12 / 11 / 11 / 10 | — | ink / muted / ink / muted |
   | footer | Cormorant 1.1 px | 8 | 1.9 | `#4E5C79` |

6. **Layer table:**

   | # | Layer | Placement | Rot. | Opacity | Colour |
   |---|---|---|---|---|---|
   | 1 | paper | full | 0 | 1 | `#FFF9EF` |
   | 2 | bottom rule | y 397, full width, 1 px | 0 | 1 | `#2E49BF` |
   | 3 | bottom bar | (0, 407) 300 × 13 | 0 | 1 | `#2E49BF` |
   | 4 | art band block | viewBox 250 × 80 fitted to ≈ 231 × 74, centred at the top of `.oc-inner` (y 18–92); rect 250 × 78, rx 3 | 0 | 1 | `#2E49BF` |
   | 5 | brackets | (12, 14)→(40, 14) and (12, 14)→(12, 42); (238, 64)→(210, 64) and (238, 64)→(238, 36) (art coordinates) | 0 | 1 | `#A7BAF6` |
   | 6 | mortarboard | art (125, 32), scale 0.82 | 0 | 1 | `#FFF8E7` / `#F2D374` |
   | 7 | diploma | art (179, 56) | −17° | 1 | see 4. |
   | 8 | heading / names / meta / footer | flex rows | 0 | 1 | — |

7. **Ornament.** Cap and diploma. They could be drawn in Canva as SVG.
8. **Data zones.** `greetingAr`, `eventLabelEnU`, `arA/B`, `enA/B`, `dayAr`, `dateAr`, `timeAr`, `venueAr`, `cityAr`, `cardFooterEnU`.
9. **Couple and single.** Single: as designed. Couple: «بكل الحب» / WEDDING copy under graduation art (README §6 C1). Gate it.
10. **Occasion variants.** Graduation only.
11. **Envelope.** env `#2E49BF`, paper `#FFF9EF`, accent `#2E49BF`.
12. **Thumbnail.** Live: `grad-editorial-marble` / `-silk` / `-sea`.
13. **Motion.** None.
14. **Export.** `signature.card.grad-editorial.art.v1.svg` (layers 4–7), `signature.card.grad-editorial.thumb.v1.png`.
15. **Acceptance.** The footer is not struck through. The label renders in a shipped font. Long names still fit.

## 12. `grad-campus` — Campus Laureate · status: **retained** · blueprint: **code-native SVG**

1. **Identity.** A certificate-style laurel crest.
2. **Canvas.** 1500 × 2100.
3. **Safe areas.** (29, 25)–(271, 398), inside the inner frame (19, 19)–(281, 401).
4. **Background.** Paper `#F5F1E4`. Frames `#788468` / `#C9CAB4`. Brackets `#9DA785`.
5. **Typography.**

   | Zone | Font | px | % H | Colour |
   |---|---|---|---|---|
   | greeting | Amiri | 18 | 4.3 | `#294839` |
   | label | Cormorant, tracking 2 px | 9 | 2.1 | `#526355` |
   | name | Amiri, line-height 1.35 | fitted | — | `#294839` |
   | rest | shared grid | | | |

6. **Layer table:**

   | # | Layer | Placement | Rot. | Opacity | Colour |
   |---|---|---|---|---|---|
   | 1 | paper | full | 0 | 1 | `#F5F1E4` |
   | 2 | outer frame | rect (14, 14) 272 × 392, rx 2 | 0 | 1 | `#788468` 1 |
   | 3 | inner frame | rect (19, 19) 262 × 382, rx 2 | 0 | 1 | `#C9CAB4` 0.7 |
   | 4 | corner brackets | 21 px L at (7, 7), (293, 7), (7, 413), (293, 413) | 0 | 1 | `#9DA785` |
   | 5 | crest ellipse | art (125, 40), 98 × 72 | 0 | 1 | `#B5B99A` |
   | 6 | laurel arcs | art (82, 15)→(109, 75) and (168, 15)→(141, 75) | 0 | 1 | `#748461` 1.3 |
   | 7 | leaves | 6 pairs, 8 × 16, left x 76 → 61 at −40° → −55°, right mirrored | ±40–55° | 1 | `#83916A` |
   | 8 | mortarboard | art (125, 30), scale 0.62 | 0 | 1 | `#365344` / `#B49A5B` |
   | 9 | star | art (125, 73), size 4 | 0 | 1 | `#AD9357` |

7. **Ornament.** Laurel and cap.
8. **Data zones.** As `grad-editorial`.
9. **Couple and single.** As `grad-editorial`.
10. **Occasion variants.** Graduation.
11. **Envelope.** env `#486557`, paper `#F5F1E4`, accent `#61734D`.
12. **Thumbnail.** Live: `grad-campus-garden` / `-marble` / `-palace`.
13. **Motion.** None.
14. **Export.** `signature.card.grad-campus.crest.v1.svg` (5–9), `signature.card.grad-campus.frame.v1.svg` (2–4), `signature.card.grad-campus.thumb.v1.png`.
15. **Acceptance.** Content stays inside the inner frame. Single and long names are fitted.

## 13. `grad-constellation` — Constellation Graduate · status: **retained** · blueprint: **code-native SVG**

1. **Identity.** A gold cap among stars on navy.
2. **Canvas.** 1500 × 2100.
3. **Safe areas.** (26, 22)–(274, 401). Constellation keep-outs (10, 6)–(74, 74) and (232, 332)–(290, 398).
4. **Background.** Paper `#152139`. Gold `#E3BE73`. Line gold `#B79A62`. Ring `#6F644F`.
5. **Typography.** Greeting Amiri 19 px (4.5 % H) in `#E3BE73`. Name Amiri, fitted, `#FFF3D9`. The rest follows the shared grid with muted `#D5C9AF`.
6. **Layer table:**

   | # | Layer | Placement | Rot. | Opacity | Colour |
   |---|---|---|---|---|---|
   | 1 | paper | full | 0 | 1 | `#152139` |
   | 2 | frame | rect (11, 11) 278 × 398, rx 8 | 0 | 0.5 | `#B79A62` 0.7 |
   | 3 | constellation top-left | (15, 29)–(43, 11)–(69, 38)–(28, 69)–(15, 29), nodes r 2 | 0 | lines 0.5 | `#B79A62` 0.6 / `#E3BE73` |
   | 4 | constellation bottom-right | (269, 337)–(237, 362)–(255, 393)–(284, 375)–(269, 337) | 0 | 0.5 | same |
   | 5 | stars | (274, 42) size 5; (21, 352) size 4 | 0 | 1 | `#E3BE73` |
   | 6 | art ring | art (125, 35) r 34 | 0 | 1 | `#6F644F` |
   | 7 | dotted ring | r 38, dash 1 / 8 | 0 | 1 | `#E3BE73` |
   | 8 | cap | art (125, 30), scale 0.7 | 0 | 1 | `#E3BE73` / `#FFF3D9` |
   | 9 | art stars | (55, 38) size 5; (198, 16) size 6 | 0 | 1 | `#E3BE73` |

7. **Ornament.** Ring, cap, constellations.
8. **Data zones.** Shared.
9. **Couple and single.** Shared.
10. **Occasion variants.** Graduation (evening).
11. **Envelope.** env `#0F192B`, paper `#152139`, accent `#E3BE73`.
12. **Thumbnail.** Live: `grad-constellation-starry` / `-sea` / `-candlelit`.
13. **Motion.** None.
14. **Export.** `signature.card.grad-constellation.art.v1.svg` (layers 2–9), `signature.card.grad-constellation.thumb.v1.png`.
15. **Acceptance.** Contrast of `#D5C9AF` on `#152139` ≥ 4.5:1 for the meta text. Nothing overlaps the constellations.

## 14. `birthday-confetti` — Confetti Birthday · status: **retained** · blueprint: **code-native SVG**

1. **Identity.** Cake, confetti, a sticker label.
2. **Canvas.** 1500 × 2100.
3. **Safe areas.** (25, 22)–(275, 402). Bottom band at y 410.
4. **Background.** Paper `#FFF7EF`. Ink `#24345E`. Coral `#EC7157`. Pink `#F3B2C4` / `#F4B4C5` / `#EE9CAF`. Cobalt `#3D62BD`. Yellow `#F9E15F` / `#F1BF49` / `#D5BE60`. Cream `#FFF0B5`.
5. **Typography.**

   | Zone | Font | px | % H | Colour |
   |---|---|---|---|---|
   | greeting pill | Reem Kufi on `#F9E15F` | 15 | 3.6 | `#24345E` |
   | label | Arial → **Readex Pro 700** | 8 | 1.9 | `#606482` |
   | name | Reem Kufi 500 | fitted | — | ink |
   | rest | shared | | | |

   The meta top border is 2 px dashed.
6. **Layer table:**

   | # | Layer | Placement | Rot. | Opacity | Colour |
   |---|---|---|---|---|---|
   | 1 | paper | full | 0 | 1 | `#FFF7EF` |
   | 2 | confetti strokes | from (11, 62)→(23, 66); (285, 80)→(276, 89); (17, 198)→(27, 192); (287, 229)→(279, 219); (16, 342)→(26, 351); (274, 369)→(287, 363); width 4, round caps | various | 1 | `#EC7157` |
   | 3 | dots | (282, 150) r 4; (16, 267) r 4; (280, 319) r 3 | 0 | 1 | `#3D62BD` / `#D5BE60` / `#EE9CAF` |
   | 4 | bottom band | (0, 410) 300 × 10 | 0 | 1 | `#F4B4C5` |
   | 5 | cake | art: body (87, 49) 76 × 26 `#F3B2C4`; frosting scallops `#FFF0B5`; plate (79→171, 75) `#24345E` 3 | 0 | 1 | — |
   | 6 | candles and flames | x 110 / 125 / 140, `#3D62BD` 4 px, flames `#EC7157` | 0 | 1 | — |
   | 7 | art stars, dot, sprinkles | (66, 28) 9 `#3D62BD`; (185, 38) 8 `#F1BF49`; (188, 16) r 4 `#F3B2C4` | 0 | 1 | — |

7. **Ornament.** Cake and confetti. A good Canva candidate (SVG).
8. **Data zones.** Shared.
9. **Couple and single.** Shared.
10. **Occasion variants.** Birthday.
11. **Envelope.** env `#EE9CAF`, paper `#FFF7EF`, accent `#EC7157`.
12. **Thumbnail.** Live: `birthday-confetti-clay` / `-petals` / `-silk`.
13. **Motion.** None (candidate for a flame flicker that stays static under reduced motion).
14. **Export.** `signature.card.birthday-confetti.art.v1.svg` (5–7), `signature.card.birthday-confetti.confetti.v1.svg` (2–4), `signature.card.birthday-confetti.thumb.v1.png`.
15. **Acceptance.** The label uses a shipped font. Confetti never crosses the meta rows.

## 15. `newborn-moon` — Moonlit Welcome · status: **adapted** · blueprint: **code-native SVG**

1. **Identity.** A moon-and-cloud crib mobile. Adaptation: footer clear of the cloud band.
2. **Canvas.** 1500 × 2100.
3. **Safe areas.** (28, 22)–(272, 392) (footer raised from 400).
4. **Background.** Paper `#F9F7EF`. Moon `#DFC586` / `#B79752`. Clouds `#DCE6EB` / `#CADAE4`. Stars `#AD9158` / `#BEA46E`. Threads `#B8CBD8`. Top band `#D9E3E9`.
5. **Typography.** Greeting Amiri 19 px (4.5 %). Label Cormorant 9 px, tracking 1.2. Name Amiri, fitted, ink `#354D64`. Muted `#586E80`.
6. **Layer table:**

   | # | Layer | Placement | Rot. | Opacity | Colour |
   |---|---|---|---|---|---|
   | 1 | paper | full | 0 | 1 | `#F9F7EF` |
   | 2 | top band | (0, 0) 300 × 10 | 0 | 1 | `#D9E3E9` |
   | 3 | cloud band | silhouette from y ≈ 397 (scallops peaking at y 397–405) to 420 | 0 | 1 | `#DCE6EB` |
   | 4 | side stars | (19, 129) size 4; (280, 210) size 4 | 0 | 1 | `#BEA46E` |
   | 5 | crescent | art: circle-cut crescent around (137–171, 5–75) | 0 | 1 | `#DFC586`, stroke `#B79752` |
   | 6 | clouds | art (66–148, 46–68) `#DCE6EB`; (143–204, 54–73) `#CADAE4` | 0 | 1 | — |
   | 7 | stars and threads | stars (66, 19) 5, (179, 13) 6, (193, 43) 4; threads x 81, 171, 197 | 0 | 1 | `#AD9158` / `#B8CBD8` |

7. **Ornament.** Moon mobile. A good Canva candidate (SVG).
8. **Data zones.** Shared.
9. **Couple and single.** Shared (single baby name).
10. **Occasion variants.** Newborn.
11. **Envelope.** env `#8EA5B4`, paper `#F9F7EF`, accent `#AD9158`.
12. **Thumbnail.** Live: `newborn-moon-silk` / `-petals` / `-marble`.
13. **Motion.** None (candidate for a gentle mobile sway).
14. **Export.** `signature.card.newborn-moon.art.v1.svg` (5–7), `signature.card.newborn-moon.clouds.v1.svg` (2–4), `signature.card.newborn-moon.thumb.v1.png`.
15. **Acceptance.** The footer has full contrast on paper, not on the cloud band.

## 16. `forum-grid` — Forum Grid · status: **retained** · blueprint: **code-native SVG**

1. **Identity.** A systematic conference identity.
2. **Canvas.** 1500 × 2100.
3. **Safe areas.** (27, 24)–(273, 399). Keep left of x 285 (the rule is at x 291).
4. **Background.** Paper `#F2F6F5`. Ink teal `#153C42`. Aqua `#52C8CE`. Highlight `#60D5D7`. Grid `#8AACAD`. Accent `#16818C`.
5. **Typography.**

   | Zone | Font | px | % H | Colour |
   |---|---|---|---|---|
   | greeting (right-aligned) | Reem Kufi | 17 | 4.0 | `#153C42` |
   | label (left-aligned) | Arial → **Readex Pro 700** | 8, tracking 1.5 px | 1.9 | `#48686B` |
   | name (right-aligned, `text-wrap: pretty`) | Reem Kufi | fitted | — | `#153C42` |
   | Latin and footer | Cormorant, left-aligned | 10 / 8 | — | — |

6. **Layer table:**

   | # | Layer | Placement | Rot. | Opacity | Colour |
   |---|---|---|---|---|---|
   | 1 | paper | full | 0 | 1 | `#F2F6F5` |
   | 2 | top band | (0, 0) 300 × 8 | 0 | 1 | `#153C42` |
   | 3 | bottom band | (0, 408) 300 × 12 | 0 | 1 | `#52C8CE` |
   | 4 | vertical rule | x 291, y 20–396, 2 px | 0 | 1 | `#52C8CE` |
   | 5 | tile 1 | art (0, 1) 59 × 59 with a cross (11–48) | 0 | 1 | `#153C42` / `#60D5D7` 2 |
   | 6 | tile 2 | art (70, 1) 59 × 59 with a circle r 18 | 0 | 1 | `#52C8CE` / `#153C42` 2 |
   | 7 | grid | art (141–248) × (2–58), 5 × 5 lines | 0 | 1 | `#8AACAD` 0.8 |

7. **Ornament.** Tiles and grid.
8. **Data zones.** Shared.
9. **Couple and single.** Single only is meaningful. A couple would print «و» between two names; gate it.
10. **Occasion variants.** Conference, corporate and opening.
11. **Envelope.** env `#153C42`, paper `#F2F6F5`, accent `#16818C`. The gold wax seal on teal is fixed by the engine.
12. **Thumbnail.** Live: `forum-grid-marble` / `-sea` / `-palace`.
13. **Motion.** None.
14. **Export.** `signature.card.forum-grid.art.v1.svg` (2–7), `signature.card.forum-grid.thumb.v1.png`.
15. **Acceptance.** Long Arabic event names and two-line venues fit (as captured). The label uses a shipped font.

---

## Signature faces («توقيع») — recipes S1–S5

**Owner rule for every recipe in this section.**

- No AI generation: no Canva Magic Media, Dream Lab, Magic Design or Magic Edit, and no AI upscaling.
- No hand-drawn icons.
- Build with native Canva shapes, the official Doyofy logo and pattern files (`design-source/brand/ASSETS`), Phosphor icons downloaded as SVG from phosphoricons.com (MIT; the Thin weight is used on faces), and the fonts listed in the conventions above.

**Code is the master for S1–S3.** Each face is rendered from `src/cards/signature-cards.js`, so the Canva masters are optional: marketing boards and print proofs only. Simple primitives plus one glyph are clearer and lighter as code than as a raster export, and text must stay live data.

**Canvas.** Every coordinate below is on the G-300 grid; multiply by 5 for the 1500 × 2100 Canva canvas.

**Palette.** gold `#C7A661` · ivory `#F2EAD9` · beige `#E4D5B4` · red `#BC4749` · turquoise `#2EB7B7` · charcoal `#262626` · paper `#FFFDF8` · muted `#5F594F` · aText gold-dark `#7A5E26` / red-dark `#A23B3D`.

---

### S1. `sig-diploma` — توقيع التخرّج · status: **new** · blueprint: **code-native** (Canva optional)

1. **Identity and idea.**
   - Signature, graduation (the glyph adapts to other single-person occasions).
   - A diploma cover: academic charcoal band, gold cap, the event year pressed in a gold disc.
2. **Canvas.** 1500 × 2100 (5 × 300 × 420); export at 1:1 and 600 × 840; no crop; corner radius is applied by the app.
3. **Safe areas.**
   - Outer frame at 12 px.
   - Text-safe region x 26–274, y 170–404.
   - Decoration region y 0–171 (band + disc).
   - Nothing decorative inside the text region except the 1 px meta rule.
4. **Background and material.** Paper `#FFFDF8` flat; band charcoal; no texture (the scene supplies material).
5. **Typography.**
   - Reem Kufi for heading, names and meta; Cormorant Garamond for the label, year and footer.
   - Sizes: greeting 16 px (3.8 % H); label 9 px tracking 2.4; name 31 px single / 22 px couple, fitted down to 8 px with no ellipsis; date 12, time 11, venue 11, city 10; footer 8 px tracking 1.1.
   - Alignment: centred.
6. **Layer table** (back → front):

| # | Layer | Kind | Placement (G-300) | Treatment | Live/editable |
|---|---|---|---|---|---|
| 01 | paper | rect | 0,0 300×420 | `#FFFDF8` | code |
| 02 | band | rect | 0,0 300×146 | charcoal | code / Canva shape |
| 03 | frame-outer | rect outline | 12,12 276×396 r3 | 1 px gold | shape |
| 04 | frame-inner | rect outline | 17,17 266×386 r2 | 0.6 px gold 50 % | shape |
| 05 | occasion-glyph | Phosphor Thin | centre 150,76, 92 px (cap) / 76 px (others) | gold | SVG icon |
| 06 | year-disc | circle + ring | centre 150,146 r25; ring r20.5 1 px charcoal | gold | shape |
| 07 | year | text | centre of disc | Cormorant 600 12 px charcoal, `c.year` | **live** |
| 08 | heading | text | from y 170 | greeting 16 px `#7A5E26` + label 9 px | **live** |
| 09 | names | text | flexible | fitted Kufi | **live** |
| 10 | meta-rule | line | 30 %–70 % width above the date | 1 px `#C9A35A` | shape |
| 11 | meta | text | below the names | date/time/venue/city | **live** |
| 12 | footer + base rule | text + line | y ≈ 392 / rule 40→260 at y 400 | Cormorant 8 px; 1 px gold | **live** + shape |

7. **Objects and ornament.** One Phosphor glyph and two circles; no laurel, no crest, no seal artwork.
8. **Data zones.**
   - `greetingAr`, `eventLabelEnU`, `arA`, optional `arB`, `enA` / `enB` (skipped when equal to the Arabic name), `dayAr · dateAr`, `timeAr`, `venueAr`, `cityAr`, `cardFooterEnU`, `year`.
   - Filled by `deriveContent()`.
9. **Couple / single.**
   - Single: one name row, no «و».
   - Couple: two rows with «و»; the glyph becomes HeartStraight or Diamond.
10. **Occasion variants.**
    - Graduation: cap 92 px.
    - Other occasions: their Phosphor glyph at 76 px.
    - The year disc always shows the real event year.
11. **Envelope system.** Engine-built from theme `env #262626` / paper; no Canva lining used.
12. **Thumbnail.** Live face on the live scene (TemplateThumb); marketing export 600 × 840.
13. **Motion storyboard.** Shared engine storyboard; static face; reduced motion freezes the loops.
14. **Export.** If a Canva master is made:
    - hide the SAMPLE text group;
    - export `signature.card.sig-diploma.ornament.v1.svg`, a 1500 × 2100 PNG and a 600 × 840 PNG.
15. **Acceptance.**
    - Year equals the event year.
    - Long single name on two lines.
    - Couple long fits.
    - No «و» for a single name.
    - Charcoal text ≥ 12:1 on paper.
    - Checked with `node tests/dev/faces.mjs`.

**Sample copy** (layout only): «تخرّج» / GRADUATION / «جود» / Joud / «الأحد ٢٠ يونيو ٢٠٢٧» / «٨:٠٠ م» / «قاعة الياسمين» / «الرياض».

---

### S2. `sig-ribbon` — حروف الفرح · status: **redesigned** (from the plum satin draft) · blueprint: **code-native**

1. **Identity and idea.**
   - Signature, for wedding, engagement, katb kitab and henna.
   - A letter sealed with the couple's initials: red header, ivory monogram disc, Ruqaa names.
2. **Canvas.** As S1.
3. **Safe areas.**
   - Text region x 30–266, y 136–402.
   - Decoration y 0–131.
4. **Background and material.** Paper flat; red band 0–100.
5. **Typography.**
   - Aref Ruqaa for greeting (18 px, `#A23B3D`), names (700, fitted from 22 / 31 px), «و» (20 px red) and monogram (700 19 px red).
   - Cormorant label 10 px.
   - Reem Kufi for meta.
6. **Layer table:**

| # | Layer | Kind | Placement | Treatment | Live |
|---|---|---|---|---|---|
| 01 | paper | rect | full | `#FFFDF8` | code |
| 02 | band | rect | 0,0 300×100 | red | shape |
| 03 | frame-outer / inner | outlines | as S1 | gold | shape |
| 04 | occasion-glyph | Phosphor Thin | centre 150,46, 40 px | ivory `#F2EAD9` | icon |
| 05 | monogram-disc | circle | centre 150,100 r31 | ivory | shape |
| 06 | rings | 2 circle outlines | r26 1.2 px gold; r23 0.6 px gold 50 % | — | shape |
| 07 | monogram | text | disc centre | initials of A and B (rules in `initial()`) | **live** |
| 08 | heading / names / meta / footer | text | from y 136 | as above; meta top border gold | **live** |

7. **Ornament.** No flowers, no ribbon artwork; the red band is the "ribbon".
8. **Data zones.** As S1, plus the monogram derived from `arA` / `arB`.
9. **Couple / single.**
   - Couple: two initials separated by a space, «و» between the names.
   - Single: one initial, no «و».
10. **Occasion variants.** Glyph only: HeartStraight (wedding), Diamond (engagement), PenNib (katb kitab), HandPalm (henna).
11. **Envelope.** Engine, `env #BC4749`.
12. **Thumbnail.** Live.
13. **Motion.** Engine.
14. **Export.** As S1, `signature.card.sig-ribbon.*`.
15. **Acceptance.**
    - Initials skip «عائلة / آل / ال».
    - Four-part couple names fit.
    - The disc never overlaps the greeting.

---

### S3. `sig-ticket` — تذكرة الفرح · status: **redesigned** (from cobalt hand-drawn shapes) · blueprint: **code-native**

1. **Identity and idea.**
   - Signature, for birthday, family, opening and other.
   - An admission ticket: identity shapes as the headline, a perforated stub with the date.
2. **Canvas.** As S1.
3. **Safe areas.**
   - Upper text x 24–276, y 90–296.
   - Stub x 22–278, y 312–406.
   - Shapes row y 20–82.
4. **Background and material.** Paper upper; ivory stub 300–420; beige notches.
5. **Typography.**
   - Reem Kufi: greeting 15 px 500; names fitted, starting at 31 px single.
   - Cormorant label 8.5 px.
   - Stub: day Cormorant 600 30 px gold, month Kufi 11 px gold, year Cormorant 10 px gold on a charcoal tile; when-column 12 px bold / 10.5 px.
6. **Layer table:**

| # | Layer | Kind | Placement | Treatment | Live |
|---|---|---|---|---|---|
| 01 | paper | rect | full | `#FFFDF8` | code |
| 02 | stub-field | rect | 0,300 300×120 | ivory | shape |
| 03 | perforation | dashed line | y 308, x 14→286 | 1.2 px charcoal 35 %, dash 5/5 | shape |
| 04 | notches | circles | r13 at (0, 308) and (300, 308) | beige | shape |
| 05 | outline | rect outline | 8,8 284×404 r8 | charcoal 12 % | shape |
| 06 | shapes-row | 5 primitives | in a 250 × 62 box centred at y 51 | pill charcoal, quarter red, disc gold, triangle turquoise, dot red | shapes |
| 07 | heading / names | text | 90–296 | Kufi | **live** |
| 08 | day-tile | rounded rect r12 | stub start (inline-end in RTL), 86 px wide | charcoal | shape |
| 09 | day / month / year | text | in the tile | gold | **live** |
| 10 | when | text | beside the tile | day · date, time, venue, city | **live** |

7. **Ornament.** Primitives only; no confetti, no cake drawing (the occasion is named in the heading).
8. **Data zones.** `dayNum`, `monthAr`, `year`, `dayAr`, `dateAr`, `timeAr`, `venueAr`, `cityAr`, names, greeting, label.
9. **Couple / single.** Single by default; a couple works with «و».
10. **Occasion variants.** Copy changes per occasion. Shape colours stay fixed (they are the identity).
11. **Envelope.** Engine, `env #2EB7B7`.
12. **Thumbnail.** Live.
13. **Motion.** Engine.
14. **Export.** As S1.
15. **Acceptance.**
    - A 60-character venue stays inside the stub.
    - The day tile reads at the 140 px thumbnail.

---

### S4. `sig-crescent` (planned) — هلال · newborn, iftar · status: **brief-ready**

- **Full build request:** `assets/request-batches/signature-stationery-planned-v1.json` (`signature.card.sig-crescent.face.v1`).
- **Composition:**
  - charcoal band 0–132 with a gold Phosphor MoonStars (iftar) or Baby (newborn) Thin glyph at 84 px;
  - an ivory disc r22 at (150, 132) carrying the day number (not the year: distinct from S1);
  - a turquoise 1 px frame instead of gold;
  - names y 170–300; meta 300–392.
- **Rule:** no prayer or sunset time is ever printed as art; iftar time comes only from the organizer's own event time.
- **Code steps:** add the entry in `signature-cards.js`, presets in `templates.ts` (starry, sea, silk), the name in `CARD_NAMES`, and switch the starters in `occasion-starters.ts` for newborn and iftar after review.

### S5. `sig-agenda` (planned) — أجندة · conference, corporate · status: **brief-ready**

- **Full build request:** same batch (`signature.card.sig-agenda.face.v1`).
- **Composition:**
  - white face with a turquoise inline-start column 0–78 holding the charcoal day tile;
  - a right-aligned title block from x 96 to 276;
  - a 3 × 2 grid of 0.4 px gold rules as the only ornament.
- **Rules:**
  - prints the real event title (organisation events use `arA` as the title);
  - no sponsor marks, no fake agenda lines;
  - must read professional, not festive.
