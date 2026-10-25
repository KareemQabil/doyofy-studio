# Studio design book — card × scene × experience catalogue

*Written 10 October 2026 from the code in this repository. Every number below is counted from source, not from older docs. Where an older doc disagrees (for example `docs/STUDIO_OVERVIEW.md` still says "10 cards"), the code wins and the difference is noted.*

This book describes the invitation engine's visual catalogue as it exists: what each card face is, how it composes with a scene and an experience, where it breaks, and how to re-author it (Canva or code-native SVG). It does not change the engine. No Canva designs were created for this book; `CANVA_RECIPES.md` contains recipes only.

---

## 1. What the catalogue contains (counted from code)

| Layer | Count | Source of truth |
|---|---|---|
| Card faces | **16**: 10 canonical + 6 occasion faces | `src/cards/index.js:24-35` (10 canonical, markup generated into `src/cards/canon/generated.js` from `canonical/CardFace.dc.html`); `src/cards/occasion-cards.js:104-166` (6 occasion faces) |
| Scenes (settings) | **10**, one of which (`candlelit`) also has a Three.js/WebGL renderer | `src/scenes/index.js:41-62`; DOM markup `src/scenes/css/generated.js`; WebGL `src/scenes/three/candlelit-hall.js` |
| Experiences | **4**: `{3d, 2d} × {animated, static}` | `src/studio/Studio.js:39-58` |
| Engine states | **8**: intro → card → opening → pages → pack → seal → fly → done | `src/engine/StateMachine.js:210-221` |
| Content pages | **5**: invitation, date, program, venue, rsvp | `src/pages/index.js:286-287` |
| Template presets | **50** (48 unique card × scene pairs; two pairs appear twice, once 3D and once 2D) | `src/domain/templates.ts:38-89` |
| Occasion starters | **13** event types, each pointing to a default preset | `src/domain/occasion-starters.ts:121-188` |

**Experiences used by presets:** 2 presets are `3d/animated` (`candle-night`, `emerald-candle`, both on `candlelit`), 47 are `2d/animated`, 1 is `2d/static` (`quiet-silk`). `3d` only changes anything on `candlelit`: every other scene has only the DOM renderer, so choosing 3D there renders the same DOM scene (`Studio._mountScene`, `src/studio/Studio.js:278-316`).

**Recommended pairings:** every card lists exactly 3 recommended scenes (`compat.recommended`) → 48 recommended pairs. The 50 presets cover all 48, and no preset uses a non-recommended pair (checked by script against `src/cards/index.js` and `src/cards/occasion-cards.js`). Only one scene recommends cards back: `candlelit → wine, emerald, arabesque` (`src/scenes/index.js:44`).

**Raw combination space:** 16 cards × 10 scenes = 160 card/scene pairs in 2D; any of the 16 cards in the 3D Candlelit Hall. The legacy switcher comment still says "10 cards × 10 scenes = 100" (`src/studio/switcher.js:2`), and `docs/STUDIO_OVERVIEW.md` §4 lists 10 cards. Both predate the occasion faces.

---

## 2. How card × scene × experience compose

The Studio (`src/studio/Studio.js`) owns a fixed **390 × 844 virtual stage**, contain-fitted into any viewport (`_fit`, lines 129-139). Layers, back to front (`src/studio/markup.js:24-128` and `src/styles/canon-motion.css`):

1. **Scene** — `.st-layer` inside the stage (DOM renderer) or `.host-scene` behind the stage (WebGL, full-bleed). Outside the stage on wide screens, DOM scenes are echoed as a blurred, darkened, cover-scaled clone (`_mountAmbient`, lines 346-353; `.scene-ambient` in `src/styles/studio.css:215-217`).
2. **Dim** (`.st-dim`, z 8) — darkens the scene for opening/pages/done.
3. **Card rig** (`.st-rig`, z 6) at stage `left 45, top 168`, **300 × 420**: tilt → bob → intro fly-in → flip, with four 6 px edges, the **front face** (the card's `render(c)` output) and the **back** (built in `_applyCard`, lines 232-239).
4. **Invitation sheet** (`.st-sheet`, z 10) at `left 18, top 58`, 354 × 728 — the five pages, coloured by the card's theme.
5. **Envelope** (`.st-env`, z 12) at `left 45, top 430`, 300 × 200 — pockets, flap, mini card, wax seal.
6. **Credit / done / black / grain / letterbox / controls** (z 17-30).

**What each layer reads from the other:**

- The **card** provides `theme = { paper, ink, muted, accent, aText, env, fAr }`. The Studio writes it into CSS variables (`--paper --ink --muted --accent --atext --env --far --envmid --envdark --envlight`, line 242) so the sheet, card back, edges and envelope all wear the chosen card's colours. Changing the card re-renders card surfaces only (`setCard`, lines 264-270).
- The **scene** provides only the environment and ambience sound (`SCENE_AMBIENCE`, `src/audio/index.js:197-199`; only `marble` has one). It never reads card content. Changing the scene swaps the renderer only (`setScene`, lines 355-360).
- The **experience** decides the renderer (`2d` forces `renderer = 'dom'`, line 55) and motion (`static` forces reduced motion: no intro, no loops, frozen WebGL frame, lines 56-58). The OS reduced-motion setting or `?motion=reduced` has the same effect as `static`.
- **Compatibility** is advisory only: `compatScore` (`src/studio/switcher.js:136-143`) adds +2 when the card recommends the scene, +2 when the scene recommends the card, −4 for an `incompatible` entry (none exist today), −0.5 for light card on light scene. Nothing is hidden; every pair stays reachable.

**Content** comes only from `deriveContent(invitation)` (`src/data/derive.js`). In the platform, `toInvitationData` (`src/domain/invitation.ts:270-287`) builds that invitation from the Event plus the design, and empties partner B for single-person occasions.

---

## 3. The 300 × 420 face contract

Every face is a function `render(c) → HTML string` producing a **300 × 420 px, border-radius 10, overflow hidden, `dir="rtl"`** element.

### Inputs (`c`, from `src/data/derive.js:29-50`)

| Group | Fields |
|---|---|
| Names | `arA arB enA enB` · uppercase `enAU enBU` · monograms `monoA monoB` (first character) · initials `initA initB` · adaptive Ruqaa sizes `arFontA arFontB` = clamp(18, floor(270 / length), 36) |
| Occasion copy | `greetingAr` / `greetingEnU`: «بكل الحب» / WITH LOVE for couples; the event label (for example «تخرج» / GRADUATION) for single-person events · `eventLabelEnU` · `cardFooterEnU`: `DINNER · CELEBRATION · RSVP` for couples, `<LABEL> · RSVP` for single |
| Date / time | `dayAr dayEn dayEnU dateAr dateEn dateEnU dayNum monthAr monthEn monthEnU year dateNum (DD · MM · YYYY) dateShort (DD.MM.YY) timeAr timeEn` |
| Place | `venueAr venueEn venueEnU cityAr cityEn cityEnU` |

### Escaping

- Canonical faces use `e()` in `src/cards/canon/generated.js:5`, which escapes `& < > "` but **not `'`**. That is safe today because every interpolation sits in element text or a double-quoted attribute. Never move an interpolation into a single-quoted attribute.
- Occasion faces use their own `e()` (`src/cards/occasion-cards.js:55`), which also escapes `'`.
- Studio surfaces use the 4-character escape too (`src/studio/Studio.js:25`, `src/pages/index.js:169`).

### Single vs couple

- Canonical faces branch on `c.arB` truthiness: the «و» separator and B's name are omitted when `arB` is empty (for example `lace` lines 93-94, `blush` 190-191). English B is gated on `c.enB` / `c.enBU`.
- Occasion faces render a single name block, or A · «و» · B when `arB` is present (`names()`, `src/cards/occasion-cards.js:78-96`).
- `toInvitationData` sets `b = ''` for every non-couple event type. Couple types are `wedding, engagement, katb_kitab, henna` (`src/domain/event.ts:33-45`).
- **The faces handle singles correctly. Several Studio surfaces around the face do not** (see §6).

### Name length

- **Adaptive:** `arabesque` (Ruqaa size from `arFontA/B`) and all six occasion faces (the `names()` fitting loop, which also budgets for wrapping venue, date and greeting rows: no ellipsis, the size steps down until the text fits).
- **Fixed size:** `lace` (46 px), `wine` (40 px), `emerald` (38 px), `sage` (42 px), `blush` (28 px Arabic, 54 px English script), `midnight` (44 px), `minimal` (32 px), `terracotta` (30 px), `clay` (44 px). Long names wrap and push other content out of the face (captured for `lace` and `wine`, §6).

### Dynamic dates

Dates are formatted with `Intl.DateTimeFormat` in the **event's own time zone** (`ar-EG` gives Arabic-Indic digits, `en-GB` gives Latin). `invitation.display.*` overrides win (the demo uses «السابعة مساءً»). The platform passes `display: {}`, so Arabic times render as `٧:٣٠ م`. `dateNum` and `dateShort` always use Latin digits. Changing `event.start` re-derives every face, page and countdown; nothing is baked in.

### Theme

Each face also carries a `theme`, which colours everything outside the face: sheet, back, edges and envelope (§2). For occasion faces the theme is also the face's own CSS variables (`--oc-paper/ink/muted/accent/line`, `src/cards/occasion-cards.js:101`).

### Shared SVG `<defs>`

Canonical faces reference ids `cf-*` (emboss filters, watercolour filters, peony/clay gradients, the star pattern, the moon mask, rose/leaf/eucalyptus symbols) from `CARD_DEFS`. These are mounted once per Studio (`src/studio/markup.js:38`) and once for thumbnails (`ensureCardDefs`, `src/features/invitation/engine-impl.ts:27-49`). Without them, `lace`, `wine`, `sage`, `blush`, `midnight`, `arabesque` and `clay` lose their ornament. `terracotta` declares its own `cf-archclip` inline, so several terracotta thumbnails on one page produce duplicate ids. Occasion faces use no ids.

---

## 4. Index of sheets

### Cards (`cards/`, 19)

| ID | Working name (AR / EN) | Status | Sheet |
|---|---|---|---|
| `lace` | دانتيل عاجي / Ivory Lace | adapted (fixed-size names overflow) | [cards/lace.md](cards/lace.md) |
| `wine` | نبيذي وذهبي / Wine & Gold | adapted (overflow, rose collides with venue) | [cards/wine.md](cards/wine.md) |
| `emerald` | زمرّد آرت ديكو / Emerald Deco | retained (long names untested) | [cards/emerald.md](cards/emerald.md) |
| `sage` | أغصان المريمية / Sage Botanical | adapted (sprig over names) | [cards/sage.md](cards/sage.md) |
| `blush` | ألوان مائية وردية / Blush Watercolor | redesign-needed (English-first hierarchy) | [cards/blush.md](cards/blush.md) |
| `midnight` | نجوم منتصف الليل / Midnight Stars | retained | [cards/midnight.md](cards/midnight.md) |
| `arabesque` | أرابيسك / Arabesque | retained | [cards/arabesque.md](cards/arabesque.md) |
| `minimal` | بسيط عصري / Modern Minimal | retained | [cards/minimal.md](cards/minimal.md) |
| `terracotta` | شمس التراكوتا / Terracotta Sun | retained | [cards/terracotta.md](cards/terracotta.md) |
| `clay` | صلصال باستيل / Pastel Clay | retained | [cards/clay.md](cards/clay.md) |
| `grad-editorial` | تخرج بأفق جديد / Graduation Editorial | adapted (footer struck by rule) | [cards/grad-editorial.md](cards/grad-editorial.md) |
| `grad-campus` | ختم الإنجاز / Campus Laureate | retained | [cards/grad-campus.md](cards/grad-campus.md) |
| `grad-constellation` | نجمة التخرج / Constellation Graduate | retained | [cards/grad-constellation.md](cards/grad-constellation.md) |
| `birthday-confetti` | عيد من الألوان / Confetti Birthday | retained | [cards/birthday-confetti.md](cards/birthday-confetti.md) |
| `newborn-moon` | أهلًا بالقمر / Moonlit Welcome | adapted (footer on cloud band) | [cards/newborn-moon.md](cards/newborn-moon.md) |
| `forum-grid` | ملتقى الأفكار / Forum Grid | retained | [cards/forum-grid.md](cards/forum-grid.md) |
| `sig-diploma` | توقيع التخرّج / Signature Diploma | **new** («توقيع») | [cards/sig-diploma.md](cards/sig-diploma.md) |
| `sig-ribbon` | حروف الفرح / Monogram Letter | **redesigned** («توقيع») | [cards/sig-ribbon.md](cards/sig-ribbon.md) |
| `sig-ticket` | تذكرة الفرح / Celebration Ticket | **redesigned** («توقيع») | [cards/sig-ticket.md](cards/sig-ticket.md) |
| `sig-crescent`, `sig-agenda` | هلال / أجندة | planned (brief-ready) | `CANVA_RECIPES.md` §S4–S5, `assets/request-batches/` |

Arabic working names come from `CARD_NAMES` (`src/domain/invitation.ts:207-211`); English names come from the registries.

### Scenes (`scenes/`, 10)

[candlelit](scenes/candlelit.md) · [marble](scenes/marble.md) · [garden](scenes/garden.md) · [desert](scenes/desert.md) · [starry](scenes/starry.md) · [silk](scenes/silk.md) · [petals](scenes/petals.md) · [clay](scenes/clay.md) · [sea](scenes/sea.md) · [palace](scenes/palace.md)

### Experience (`experience/`, 7)

[intro](experience/intro.md) · [card](experience/card.md) · [opening](experience/opening.md) · [pages (invitation, date, program, venue, RSVP)](experience/pages.md) · [finale: pack, seal, fly](experience/finale.md) · [done](experience/done.md) · [controls, switcher, sound](experience/controls.md)

### Recipes

[CANVA_RECIPES.md](CANVA_RECIPES.md): a 15-part recipe for every face, including the «توقيع» faces S1–S3 and the planned S4–S5.

### Previews (`previews/`, 13 PNGs)

`signature-faces.png`: sig-diploma, sig-ribbon and sig-ticket at six data cases each (opening, birthday, couple long, couple, single long, single short). It was rendered from the real registry by `node tests/dev/faces.mjs`. Live Studio captures of signature presets are `review/screenshots-or-captures/journey/*-05-editor.png` (sig-diploma on marble) and `*-29-couple-opened.png`.

Earlier previews, captured in the first audit:

| File | What it shows | Route captured |
|---|---|---|
| `faces-canonical-couple.png` | the 10 canonical faces, each on a recommended scene, sample couple (سارة / أحمد) | `/?view=invite&card=<id>&scene=<id>&motion=reduced&renderer=dom&start=card` at 390×844 |
| `faces-single-person.png` | the 6 occasion faces plus `midnight`, `lace` and `minimal` with single-person content | `/?view=invite&renderer=dom[&card=&scene=]&i=<encoded single-person config>` at 390×844 |
| `long-lace-marble.png`, `long-wine-candlelit.png`, `long-arabesque-palace.png`, `long-grad-editorial.png` | long four-part couple names (25 and 27 Arabic characters) | `i=<long couple config>` |
| `canon-sage-petals.png` | sage eucalyptus sprig crossing the names | canonical route |
| `single-grad-page-invitation.png`, `single-grad-page-date.png`, `single-grad-done.png` | Studio surfaces with single-person (graduation) content | `start=pages`, ArrowDown, `start=done` |
| `gallery-wedding-horizon.png` | template gallery for the seeded wedding (live thumbnails) | `/app/events/evt_wedding/invitation/templates?theme=horizon` at 1440×900 |
| `desktop-wine-candlelit-3d-low.png` | 3D Candlelit Hall, low tier, software WebGL, reduced motion | `/?view=invite&card=wine&scene=candlelit&motion=reduced&start=card&quality=low` at 1440×900 |

Captures were made with a scratch copy of `tests/vshot.mjs` that navigates to whichever port the server actually bound. Port 5392 was taken during the session, and `tests/vshot.mjs` hard-codes it. All captures show the **settled card state** (reduced or static motion). No animated frames, intro, envelope or 3D at high tier were captured.

---

## 5. Pairing coverage (all 59 presets)

Couple occasions: `wedding engagement katb_kitab henna`. All others are single-person.

**R** = rendered in this pass as a live Studio (card state, reduced or static motion). **G** = seen as a live gallery thumbnail only (`gallery-wedding-horizon`). Blank = not rendered. "Line" = line in `src/domain/templates.ts`.

| Line | Preset | Card | Scene | Experience | Occasion tags (primary in bold) | Rendered |
|---|---|---|---|---|---|---|
| 39 | grad-editorial-marble ★ | grad-editorial | marble | 2d/animated | **graduation** | R (single) |
| 40 | grad-editorial-silk | grad-editorial | silk | 2d/animated | **graduation** | |
| 41 | grad-editorial-sea | grad-editorial | sea | 2d/animated | **graduation** | |
| 42 | grad-campus-garden ★ | grad-campus | garden | 2d/animated | **graduation** | R (single) |
| 43 | grad-campus-marble | grad-campus | marble | 2d/animated | **graduation** | |
| 44 | grad-campus-palace | grad-campus | palace | 2d/animated | **graduation** | |
| 45 | grad-constellation-starry ★ | grad-constellation | starry | 2d/animated | **graduation** | R (single) |
| 46 | grad-constellation-sea | grad-constellation | sea | 2d/animated | **graduation** | |
| 47 | grad-constellation-candlelit | grad-constellation | candlelit | 2d/animated | **graduation** | |
| 48 | birthday-confetti-clay ★ | birthday-confetti | clay | 2d/animated | **birthday** | R (single) |
| 49 | birthday-confetti-petals | birthday-confetti | petals | 2d/animated | **birthday** | |
| 50 | birthday-confetti-silk | birthday-confetti | silk | 2d/animated | **birthday** | |
| 51 | newborn-moon-silk ★ | newborn-moon | silk | 2d/animated | **newborn** | R (single) |
| 52 | newborn-moon-petals | newborn-moon | petals | 2d/animated | **newborn** | |
| 53 | newborn-moon-marble | newborn-moon | marble | 2d/animated | **newborn** | |
| 54 | forum-grid-marble ★ | forum-grid | marble | 2d/animated | **conference**, corporate, opening | R (single) |
| 55 | forum-grid-sea | forum-grid | sea | 2d/animated | conference, **corporate**, opening | |
| 56 | forum-grid-palace | forum-grid | palace | 2d/animated | conference, **corporate**, opening | |
| 57 | candle-night ★ | wine | candlelit | **3d**/animated | **wedding**, engagement, katb_kitab | R (3D low tier, couple) · G (photo thumbnail) |
| 58 | emerald-candle | emerald | candlelit | **3d**/animated | wedding, engagement, **corporate** | G (photo thumbnail) |
| 59 | ivory-morning ★ | lace | marble | 2d/animated | wedding, **engagement**, katb_kitab, henna | R (couple, single, long) · G |
| 60 | arabesque-palace ★ | arabesque | palace | 2d/animated | **katb_kitab**, henna, iftar, family, wedding | R (long couple) · G |
| 61 | wine-palace | wine | palace | 2d/animated | wedding, katb_kitab, **henna** | |
| 62 | emerald-garden | emerald | garden | 2d/animated | wedding, henna, engagement, **opening** | R (couple) |
| 63 | sage-morning ★ | sage | marble | 2d/animated | engagement, **newborn**, family, birthday | |
| 64 | blush-petals | blush | petals | 2d/animated | engagement, henna, newborn, **birthday** | |
| 65 | midnight-stars ★ | midnight | starry | 2d/animated | **graduation**, iftar, wedding, corporate | R (couple, single) · G |
| 66 | desert-sun | terracotta | desert | 2d/animated | **family**, iftar, opening, birthday | |
| 67 | quiet-silk ★ | minimal | silk | 2d/**static** | **conference**, corporate, opening, graduation, other | R (single, static) |
| 68 | moonlit-sea | minimal | sea | 2d/animated | graduation, conference, corporate, **other** | R (couple) |
| 69 | clay-party | clay | clay | 2d/animated | **birthday**, newborn | R (couple) |
| 70 | wedding-silk | lace | silk | 2d/animated | **wedding**, engagement | G |
| 71 | engagement-petals | sage | petals | 2d/animated | **engagement**, newborn | R (couple) |
| 72 | contract-ivory | lace | palace | 2d/animated | **katb_kitab**, wedding | |
| 73 | henna-earth | terracotta | palace | 2d/animated | **henna**, family | R (couple) |
| 74 | birthday-bloom | clay | petals | 2d/animated | **birthday**, newborn | |
| 75 | graduation-horizon | midnight | sea | 2d/animated | **graduation**, other | |
| 76 | newborn-cloud | blush | marble | 2d/animated | **newborn**, birthday | |
| 77 | family-garden | sage | garden | 2d/animated | **family**, engagement | |
| 78 | iftar-lantern | arabesque | candlelit | 2d/animated | **iftar**, family | |
| 79 | iftar-sunset | arabesque | desert | 2d/animated | **iftar**, family | R (couple) |
| 80 | conference-editorial | minimal | marble | 2d/animated | **conference**, corporate | |
| 81 | opening-palace | emerald | palace | 2d/animated | **opening**, corporate | |
| 82 | corporate-candle | emerald | candlelit | 2d/animated | **corporate**, conference | |
| 83 | other-sunset | midnight | desert | 2d/animated | **other**, graduation | |
| 84 | wine-constellation | wine | starry | 2d/animated | wedding, engagement, **corporate** | |
| 85 | wedding-candlelight | wine | candlelit | 2d/animated | wedding, katb_kitab, henna | R (couple, long) |
| 86 | blush-silk | blush | silk | 2d/animated | engagement, henna | R (couple) |
| 87 | terracotta-garden | terracotta | garden | 2d/animated | opening, family, birthday | |
| 88 | clay-silk | clay | silk | 2d/animated | birthday, newborn | |
| 40 | sig-diploma-marble ★ | sig-diploma | marble | 2d/animated | **graduation** | R (single, journey editor) · F |
| — | sig-diploma-palace | sig-diploma | palace | 2d/animated | **graduation** | F |
| — | sig-diploma-silk | sig-diploma | silk | 2d/animated | **graduation** | F |
| — | sig-ribbon-candlelit ★ | sig-ribbon | candlelit | 2d/animated | **wedding**, engagement, katb_kitab | G (signature template deck) · F |
| — | sig-ribbon-palace | sig-ribbon | palace | 2d/animated | **katb_kitab**, wedding, henna | F |
| — | sig-ribbon-silk | sig-ribbon | silk | 2d/animated | **engagement**, henna, wedding | F |
| — | sig-ticket-clay ★ | sig-ticket | clay | 2d/animated | **birthday**, other | F |
| — | sig-ticket-petals | sig-ticket | petals | 2d/animated | **family**, birthday, other | F |
| — | sig-ticket-marble | sig-ticket | marble | 2d/animated | **opening**, corporate, other | F |

*«توقيع» rows (added in the signature pass; lines 40–48 of `templates.ts`, which shifts the line numbers of the rows above by 9). **F** = the face was rendered from the registry at six data cases (`previews/signature-faces.png`), not inside a live scene. The scene pairings marked with only F are unverified as live Studio renders.*

★ = `featured`. In total: 19 presets rendered live, 2 more seen only as gallery thumbnails, 29 not rendered. Each sheet's "untested states" section lists its own gaps.

---

## 6. Misleading or invalid pairings and states (with evidence)

> **Update after the «توقيع» pass.** Items in **A** are fixed in the engine for every theme: the single-name invitation page and countdown, «برنامج المناسبة», the card footer `${label} · CELEBRATION · RSVP`, the Studio credit, monogram, mini card and done line, and the Latin line no longer echoing the Arabic name. File-level details are in `review/JOURNEY_DECISIONS.md` (single-person table). The browser journey checks graduation surfaces for couple wording. Items B–E below are the original audit and remain as written unless noted.

None of the 50 presets violates the engine's own compatibility metadata. The problems are **content/occasion mismatches**: Studio surfaces written for a wedding couple that every preset inherits, plus face-level defects that some presets expose.

### A. Couple-only Studio surfaces shown on single-person occasions — **invalid**

Affects every preset tagged with a single-person occasion: 43 of 50 presets carry at least one single-person tag, including all 18 occasion-face presets. Only 7 are couple-only: candle-night, ivory-morning, wine-palace, wedding-silk, contract-ivory, wedding-candlelight and blush-silk. The face itself is correct; the frame around it is not.

| # | Surface | Code | What a graduate sees (captured) |
|---|---|---|---|
| A1 | Invitation page | `src/pages/index.js:177-181`: kicker is always `T.withLove`; «و» and `c.arB` render unconditionally; English is always `enA & enB` | «بكل الحب / WITH LOVE», «ليان», an orphan «و», «Layan &» — `previews/single-grad-page-invitation.png` |
| A2 | Sheet monogram | `src/studio/Studio.js:243`: `${monoA} · ${monoB}` | «ل ·» at the top of every page — same capture and `single-grad-page-date.png` |
| A3 | Date page kicker and countdown label | `src/data/strings.js:124` «باقٍ على الفرح» (literally "left until the wedding/joy"); `src/pages/index.js:203` `aria-label="Time until the wedding"` | shown on graduation — `single-grad-page-date.png` |
| A4 | Done screen fallback line | `src/studio/Studio.js:437`: `${enAU} & ${enBU} · ${dateShort}` when the guest name is empty | «LAYAN & · 18.06.27» — `single-grad-done.png` |
| A5 | Intro credit | `src/studio/Studio.js:165-167`: `${arA} و ${arB}`, `${enAU} & ${enBU}`, then «REQUEST THE HONOUR OF YOUR PRESENCE» (`strings.js:139`) | code evidence only (the credit plays 0.3–2.8 s and was not captured) |
| A6 | Envelope mini card | `src/studio/Studio.js:244-245`: `${arA} و ${arB}`, `${enA} & ${enB}` | code evidence only (transitional state) |
| A7 | Program page kicker | `src/data/strings.js:127` «برنامج الأمسية / THE EVENING» | misleading for a morning conference or a daytime graduation; code evidence |

### B. Couple copy that misdescribes the couple occasion — **misleading**

- **B1.** For every couple event `cardFooterEnU` is `DINNER · CELEBRATION · RSVP` (`src/data/derive.js:32`). The `katb_kitab` starter programme is Welcome → Marriage ceremony → Congratulations and refreshments, and `henna` is Welcome → Henna gathering → Refreshments (`src/domain/occasion-starters.ts:132-141`): neither has a dinner. Faces that print the footer: `wine` (`generated.js:141`) and all six occasion faces (`occasion-cards.js:98`). Presets: `candle-night`, `wine-palace`, `wedding-candlelight` (all tagged `katb_kitab` and/or `henna`).

### C. Occasion faces reachable from couple events — **misleading (not preset-driven)**

- **C1.** The editor offers every card for every event. A wedding that picks `grad-editorial` prints «بكل الحب» + WEDDING + `DINNER · CELEBRATION · RSVP` under a mortarboard and diploma — `previews/long-grad-editorial.png`. The same holds for `birthday-confetti` (cake), `newborn-moon` (moon and clouds) and `forum-grid` (conference grid). There is no `compat.incompatible` or occasion gate. Recommendation: tag occasion faces with their occasion and filter or warn in the gallery and editor.

### D. Face defects exposed by presets — **invalid layout**

| # | Face | Evidence | Presets affected |
|---|---|---|---|
| D1 | `lace`: fixed 46 px Ruqaa names. Long names push the greeting above the arch and the date/venue out of the bottom of the face | `previews/long-lace-marble.png`; `generated.js:92-94` | ivory-morning, wedding-silk, contract-ivory |
| D2 | `wine`: fixed 40 px names overlap the crest and monograms; the English names collide with the bottom-right roses; the venue line touches the roses even for the sample couple | `previews/long-wine-candlelit.png`, `faces-canonical-couple.png`, `gallery-wedding-horizon.png`; `generated.js:113-141` | candle-night, wine-palace, wine-constellation, wedding-candlelight |
| D3 | `sage`: top-right eucalyptus (`<svg width=170 height=190>` at right 0, top 0) crosses the name line | `previews/canon-sage-petals.png`; `generated.js:169, 172-175` | sage-morning, engagement-petals, family-garden |
| D4 | `grad-editorial`: the 1 px rule at y = 397 (`occasion-cards.js:111`) runs through the footer text | `faces-single-person.png` | grad-editorial-marble, -silk, -sea |
| D5 | `newborn-moon`: the cloud band (y 397–420, `occasion-cards.js:152`) sits under the footer and lowers its contrast | `faces-single-person.png` | newborn-moon-silk, -petals, -marble |
| D6 | `blush`: English script names are the 54 px hero and Arabic is 28 px — inverted for an Arabic-first product; long English names are unfitted | `faces-canonical-couple.png`; `generated.js:188-191` | blush-petals, newborn-cloud, blush-silk |
| D7 | Arabic-first gaps in canonical faces: no Arabic venue on `wine`, `emerald`, `sage`, `blush` (each prints `venueEn`/`venueEnU` only); no Arabic date (`dateAr`) on `wine`, `emerald`, `midnight`, `terracotta` | `generated.js:138-140, 163-165, 179, 194, 216-217, 279-280` | all presets on those cards |

### E. Tonal mismatches (judgement, not defects)

- **E1.** `wine-constellation` and `emerald-candle` have `primaryOccasion: 'corporate'`. Wine's romantic rose garlands and monogram crest (with a team-event name as the "monogram") read as a wedding for a team gathering.
- **E2.** Single-person events whose "name" is a family, venue or conference name (`nameLabel`, `src/domain/event.ts:40-45`) still feed monograms and initials. `minimal` prints a giant initial «R» from "Riyadh Innovation Forum" (captured in `faces-single-person.png`); `wine` would put «م» in the crest.
