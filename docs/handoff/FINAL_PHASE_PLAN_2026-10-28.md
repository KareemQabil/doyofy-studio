# Doyofy — Final phase plan (to a Vercel prototype)

**Date:** 2026-10-28.
**Built on:** `feat/card-collection` @ `cf27243`.
**Reads with:** `HANDOFF_2026-10-28.md` and `AUDIT_2026-10-28.md`. Where this file disagrees with them, this file is newer and was re-measured.
**Inputs:**
- the audit and the handoff;
- `Doyofy-Motion-GSAP.html`, six flat SVG invitations animated with a GSAP timeline;
- `قوالب pdf.pdf`, 15 Canva pages, used as a layout reference only;
- a fresh build with real Chromium runs, at 375×812 and 1366×768.

---

## 0. In one minute

The handoff's direction is right: one theme plus dark mode, one card family, fix the layout and the swipe direction, use the kit's assets as backgrounds.

Three things change the plan:

1. **The safety net is broken, not just "not run".** Playwright works on this machine (`/opt/pw-browsers`).
   - `tests/e2e.mjs` fails at step 1. It expects the heading «مناسباتي», which the Signature home doesn't have.
   - `tests/qa.mjs` times out on the legacy `?view=invite` route.
   - `tests/a11y.mjs` checks only `warm` and `sage` by default, two themes that are about to be deleted.

   Batch A deletes about a third of the UI code, so a working gate must exist first. → **new Batch 0.**
2. **A guest link doesn't work on the guest's phone.** Events live in the organizer's `localStorage`. A link created on the organizer's laptop opens on another phone with no event behind it. Only the seeded `noura-faisal` link works. On a public Vercel URL, this is the first thing anyone tries. If the RSVP then says «تم الرد», it breaks rule #1 (no fake success). → **decision Q1 + Batch V.**
3. **Motion is the missing "wow".** The GSAP reference proves that the existing card contract (SVG with live text) can carry a choreographed ~7.5s reveal. → **new Batch M**, after the cards are down to one family.

**Recommended order:**

> **0** gate → **A** one theme + dark → **D** swipe → **C** layout + nav → **B** one card family → **M** motion → **E** backgrounds → **F** RSVP inside the invite → **V** Vercel → **G/H** leftovers

**Rough size:** about 9–12 focused sessions.

---

## 1. What I re-measured, and where the audit is wrong

| Claim | Measured on `cf27243` | Effect on the plan |
| --- | --- | --- |
| «three.js 541KB loads even on the guest page» | **Wrong.** three.js + GLTFLoader are already a lazy chunk (`candlelit-hall-*.js`, 612KB), loaded only by the candlelit scene. `app.js` (1077KB raw, 258KB gzip) is react-dom (205KB) plus every screen. | Drop the three.js item from G. The real lever is **route-level code splitting** plus the deletions in A and B. |
| «Wizard 40KB inside the bundle» | True, but it sits in the **lazy engine chunk** (289KB), not in `app.js`. Guests download it; organizers on the dashboard don't. | Still delete it (G). Lower priority. |
| «Playwright isn't installed» | It is, and it runs here. | Batch 0 can be automated from day one. |
| a11y «104/104 clean» | Those were the **warm/sage** themes. With `node tests/a11y.mjs signature`: **24/52 clean**. Every flag is a contrast flag. Most look like detector false positives: white-on-white for active tab pills, and ivory text whose dark background is a pseudo-element or gradient. | Fix the detector so it resolves pseudo/gradient backgrounds, then treat what's left as real. |
| Guests page 447px on a 375px screen | **Confirmed:** 448px, 40 targets under 24px. | C (FX-06/07/17) |
| Phone bars 58 + 68 = 126px | **Confirmed** (`sig-appbar` 58, `sig-tabbar` 68). Desktop `sig-header` is 72px. | C |
| Deck cut off at `/app/events/new` | **Confirmed** at 1366×768. Cards are cropped at the bottom, the `focus-foot` (77px) covers the deck, and the deck sits left of centre because the active card is first and the rest trail to the left. | C. The deck should centre the active card on both sides. |
| Swipe inverted (FX-01..05) | **Confirmed.** `gestures.ts:28` uses `start - dx/step`, with next cards placed to the LEFT. Dragging left advances, so the content moves against the finger. | D, as the handoff says: right = next. |
| Not in the audit: share preview | `og:image` is the relative `assets/brand/share-preview.png`. WhatsApp and iMessage need an **absolute https URL**. For an invitation product, the WhatsApp preview *is* the product's first impression. | V |
| Not in the audit: cross-device links | See §0.2. | Q1, V |
| Not in the audit: `vercel.json` | Rewrites exist for `/app`, `/i`, `/check-in` and `/prototype`. Missing: cache headers for `assets/` and hashed chunks, `X-Robots-Tag: noindex` for a prototype, and a real 404. | V |

**Still true from the audit:**
- 9 themes; 375 `[data-theme='…']` selectors;
- 8 files with `theme === 'signature'`;
- 41 faces and 129 templates;
- `ui.css` 382KB (71KB gzip);
- `dist` 39MB, mostly the P0 library.

**Checks that pass now:**
- `tsc`, both projects;
- `unit.mjs`: 84/84;
- `dom.mjs`;
- `check-theme-contrast`: 234/234 (tokens only);
- `check-shipped-assets`: 139/139.

Screenshots from this audit are in the session scratchpad (`shots/`). Batch 0 regenerates them in the repo.

---

## 2. What "ready to deploy" means

A stranger opens the Vercel URL on a phone and:

1. **lands** on one coherent brand, light or dark, with no horizontal scroll at 320, 375, 390 or 1366;
2. **creates** an event: picks the occasion from a deck that follows their finger, then picks 1 of 2–3 professional cards for that occasion;
3. **edits** names and date and watches the card **animate** in the editor preview;
4. **opens** the guest link and gets the envelope → card reveal → inner pages → RSVP flow, with food and gifts inside the RSVP card;
5. **is never told** something happened when it didn't (rule #1). If the RSVP is demo-only, the screen says so;
6. **shares** the link on WhatsApp and gets a proper preview image and title.

**Budgets:**

| | Target |
| --- | --- |
| First JS on `/` | ≤ 140KB gzip |
| Guest page | ≤ 200KB gzip before card art |
| LCP on a 4G phone | < 2.5s |
| Accessibility | Zero gate failures (§3, Batch 0) |

---

## 3. Batches

Every batch gets its own branch, a green gate before merge, and owner approval before any push or merge (handoff rule).

**Before anything:** open and merge the PR for `feat/card-collection` so that Batch 0 starts from `main`. Every later batch either deletes or builds on those 13 cards.

### Batch 0 — Release gate (≈ 0.5 session) · `chore/release-gate`

The gate replaces the stale suites.

**Delete or rewrite:**
- `tests/e2e.mjs` and `tests/qa.mjs` (pre-Signature copy, legacy routes)
- the `npm test` script that points at them

**Add `tests/gate.mjs`** (Playwright with `/opt/pw-browsers`, or a local `npx playwright install chromium`). For every route in `a11y.mjs`, at 320×640, 375×812, 390×844, 1366×768 and 1440×900, it checks:
- `scrollWidth ≤ innerWidth`;
- no visible interactive element under 24×24;
- primary actions at least 44px tall;
- total fixed or sticky bar height on phones;
- zero `pageerror` and `console.error`;
- no focused element hidden under a fixed bar: tab through the page and check each element's rect against the bar rects (WCAG 2.4.11).

**Also:**
- **Contrast check:** the a11y contrast pass for Signature only, with background resolution for `::before`/`::after` and gradients. It runs in light and, after A, in dark.
- **Screenshot baseline:** written to `qa/gate/<viewport>/<route>.png`, so each batch shows a before and after.
- **Journey test:** one short end-to-end run: home → new → pick occasion → essentials → templates → editor → preview as guest → RSVP. Its assertions use roles and stable `data-test` ids, not marketing copy.

**Accept when:**
- `npm run gate` runs in under 3 minutes;
- today it **fails** on the guests page and on the deck, which proves it catches them;
- `npm test` = `tsc` + `unit` + `dom` + `gate`.

### Batch A — One theme + dark (≈ 2 sessions) · `feat/single-theme`

As in handoff §6-A: delete orbit, bahja, horizon, the directions code, ThemePicker and the 5 colour themes, then promote `[data-theme='signature']` to `:root`.

**Additions:**
- **Order of work:**
  1. Promote Signature's tokens to `:root` first and run the gate.
  2. Then delete the features.
  3. Then the CSS blocks.

  Three commits, each green, keep the diff reviewable.
- **Dark tokens** from `01_DIRECTION_AND_RULES.md`: background `#171615`, surface `#201E1C`, raised `#2A2725`, text `#F2EAD9`, red text `#E58C8D`, borders `#7A736A`.
  - Brand art (the red hero and the occasion posters) needs a dark variant, not just token swaps. The red poster on `#171615` gets a 1px `--c-line` edge and a lower shadow.
- **Appearance switch:** light / dark / system, in the account menu, saved to settings, applied before first paint by a 3-line inline script in `src/index.html`, so dark mode never flashes white.
- **`theme-color`** follows the appearance (two `<meta>` tags with `media`).
- The invitation (engine and cards) keeps its own palette in both modes. The editor's stage stays light paper in dark mode, framed by the dark platform.
- **Tests:** delete the warm/sage defaults from `a11y.mjs`; `dom.mjs` route mounting runs once per appearance instead of per theme.

**Accept when:**
- `ui.css` is ≤ 270KB;
- the gate is green in light and dark;
- `grep "data-theme='"` returns only the compatibility shim.

### Batch D — Swipe (≈ 0.5 session) · `fix/rtl-gestures`

Exactly handoff §6-D:
- `deckDragPosition`: use `+dx`;
- `deckRelease`: use `+v`, max jump 2, and a second card only above 1.2px/ms;
- `swipeStep`: `dx > 0 → +1`;
- trackpad: `deltaX > 0 → −1`;
- ignore gestures that start within 24px of either screen edge.

Also **centre the active card** so cards show on both sides. Today the first card hugs the right and the deck trails off to the left.

**Gate:** a DOM test that drags 100px right and asserts that the active card's `translateX` moved +100 ±2 during the drag, then settled on index+1.

### Batch C — Layout and navigation (≈ 1.5 sessions) · `fix/layout-nav`

Use the table in handoff §6-C as written: FX-06, FX-07, FX-17, the deck, the navbar, FX-10, FX-12, FX-16 and FX-14.

**Concrete choices:**
- **Phone bars:**
  - appbar 48px, hidden on scroll-down and shown on scroll-up (`transform`, no layout shift);
  - tabbar 56px with 48px targets and labels always visible;
  - `env(safe-area-inset-bottom)` added to the tabbar, not taken from it.
- **Desktop bars:**
  - header 56px;
  - **remove the 272px rail.** Five links fit in the header as tabs.
  - Event context (name, date, status) becomes a slim line under the header, which gives back 272px to every desktop screen.
- **Deck at `/app/events/new`:**
  - the card sits fully inside the poster, at a 5/7 ratio;
  - the stage height is `min(520px, 100dvh − 64 − 77 − 160)`;
  - remove the `-26px` margin, the `translateY(-12px)` and the hover rotation;
  - the footer reserves its height through `padding-bottom` on the scroller plus `scroll-padding-bottom`.
- **Guests on phones:**
  - counters become one 40px scrollable chip row (count + label), with detail on tap;
  - the toolbar wraps;
  - "filters" and "select" become 44px icon buttons with `aria-label`.

**Accept when:** the gate is green at all five viewports, and the first guest row is visible without scrolling at 390×844.

### Batch B — One card family (≈ 2 sessions) · `feat/one-card-family`

As in handoff §6-B: delete the 28 legacy faces and their templates, move `e`, `names`, `STYLE`, `typeOf` and `initial` to `kit-helpers.js`, add `resolveCardId()` for saved invitations, and update the seed and the tests.

**Reaching 2–3 cards per occasion:**

| Source | Count | Status |
| --- | --- | --- |
| Current kit faces (`collection.js`) | 13 | Ready |
| GSAP reference designs, ported to the 300×420 contract (wedding, engagement, birthday, graduation, iftar, newborn) | 6 | Original vector code, no licence issue. Each comes with its own motion (Batch M). Palettes become the card's `variants`. |
| Rebuilt from `templates/<occ>/<nn>/doc.json` in the Designer Kit, as code | 6–10 | Rebuild for the occasions still at 1: katb, henna, family, conference, opening, corporate, other |

**PDF reference — composition patterns only, no artwork:**
- calligraphic occasion title over a botanical crown;
- arch frame with a monogram;
- three-icon date/venue/time row with dividers;
- big day numeral between rules;
- corner ornaments;
- graduation cap in a diamond;
- balloon flank.

These are already named in `collection.js`; the new faces reuse them with kit art.

**Templates:** one format (a typed array in `templates.ts`). One template = card + default copy + palette. Target about 40–50 templates in total, not 129.

**Accept when:**
- `CardRegistry.list()` contains only the family;
- every occasion offers at least 2 cards;
- old seeded invitations open on their occasion's card;
- the engine chunk shrinks by ≥ 60KB.

### Batch M — Motion: invitations that move (≈ 1.5 sessions) · `feat/card-motion`

**Take from the reference:**
- **One timeline per card, ~7.5s:** backplate (0.35s fade) → frame or arch drawn with stroke-dash (from 0.25s) → motifs grow from their stems or anchors (from 1.0s) → sparks (1.4s) → title (1.9s) → names (2.6s, larger rise) → message (3.1s) → date/place (3.5s) → footer (4.0s) → one idle "breath" (lanterns sway, cap bobs, clouds drift), then rest.
- **Live text the whole time.** `fitNames()` shrinks names to a measured width after `document.fonts.ready`; we already do this in `names()`.
- **Palette** through CSS custom properties on the `<svg>`, so recolouring needs no re-render.
- **Reduced motion:** `prefers-reduced-motion`, or the engine's `static` experience, jumps to `progress(1)`, the final frame.
- **Pause** when the tab is hidden; `gsap.context().revert()` on unmount.

**Don't take:**
- its green UI palette or its own font (Readex is embedded as base64, about 900KB);
- guest-facing speed, loop or scrub controls;
- an editor where users build their own animations. That's the one risky case under the GSAP licence (§5, Q2).

**Architecture:**
- **Card contract:** an optional `motion(tl, q)` hook next to `render(c)`. `q` is scoped to the card root, and timings come from a shared `beats` table, so every card shares the same rhythm.
- **Loading:** `gsap` core only (about 27KB gzip). Import it inside the **engine chunk** (already lazy), never in `app.js`.
- **Engine:** the envelope opens → the card plays its timeline → the inner pages use small shared transitions (a page enters with an 18px rise + fade, stagger 60ms).
- **Editor:** the preview plays once on load and replays on a "▶ replay" button. Typing updates text in place without restarting (`applyFields`, as in the reference).
- **Platform UI:** keep the existing spring helper and View Transitions. No GSAP on dashboard screens.

**Accept when:**
- all ported reference cards plus all 13 kit cards have a timeline;
- 60fps on a mid-range Android under CPU throttle ×4: no layout properties animated, only `transform` and `opacity` (stroke-dashoffset only on paths under 2k length);
- reduced motion shows the final frame with zero tweens;
- GSAP is not in `app.js` (metafile check added to the gate).

### Batch E — Assets as real backgrounds (≈ 1.5 sessions) · `feat/kit-backgrounds`

**Scope for the deploy:**

| Area | Assets used | Rules |
| --- | --- | --- |
| **Engine scenes** | Replace the 6 CSS scenes with kit `elements/scenes` layers (silk, palace, desert, night sky, candlelit corner, night garden), plus DYG palace and silk. | AVIF + WebP, ≤ 120KB at 1080w, loaded when chosen. The three.js candlelit scene stays as an opt-in "3D" experience. |
| **Envelope** | Paper + liner from `elements/envelopes`, replacing the flat `theme.env` colour. | One per card family; the liner tinted per palette. |
| **Platform** | Textures behind the home hero, the create screen and the thank-you screen, in light and dark. | ≤ 40KB each, `image-set()`. |
| **Inner pages** | Only for the 13 kit cards, from `page-02`/`page-03`. | The other cards keep the ivory paper with their own ornament colour. |

Extend `tools/import-card-kit.mjs`: strip ids, flatten gradients, convert to WebP/AVIF, and record every file in `PROVENANCE.json`.

**Decision:** this depends on Q3 (AI images).

### Batch F — RSVP inside the invitation (≈ 1 session) · `feat/rsvp-in-invite`

Handoff §6-F, all of it:
- **FX-13:** the guest counter collapses on «أعتذر».
- **J-01:** food, dietary needs and gifts become steps of the RSVP card in the engine, not a separate sheet afterwards.
- **J-02:** the apology flow (accept → optional message → only after saving, «مشاركتكم من بعيد» with an equal-weight «لا، شكرًا»).

What "saved" means on the deployed prototype follows **Q1**.

### Batch V — Vercel deploy (≈ 0.5 session) · `chore/vercel`

1. **`vercel.json`:**
   - `headers`: `Cache-Control: public, max-age=31536000, immutable` on `/chunks/*` and on fingerprinted assets; `no-cache` on `index.html`;
   - `X-Robots-Tag: noindex` while it's a prototype;
   - a basic CSP (`default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'`);
   - keep the rewrites, and remove `/prototype/*` once A deletes those routes.
2. **Hashed entry files:** `app.js`, `ui.css` and `styles.css` are not hashed today. Either hash them in `build.mjs` (`entryNames: '[name]-[hash]'`, then rewrite `index.html`), or give them `max-age=0, must-revalidate`. Without one of the two, returning visitors get a stale app after a deploy.
3. **Share preview:**
   - absolute `og:image`/`og:url` built from `VERCEL_PROJECT_PRODUCTION_URL` at build time, plus `twitter:card`;
   - the guest link `/i/:slug` should preview the **couple's names** — that needs a tiny edge function or a pre-rendered page per seeded event; acceptable to postpone and use one generic preview first.
4. **Size:** don't ship P0 files that nothing loads after E. Target `dist` ≤ 12MB. Audio: re-encode `sfx_morning_birds.mp3` (6.5MB) as Opus around 48kbps, or drop it.
5. **Demo honesty:**
   - a slim, dismissible «نسخة تجريبية — البيانات على جهازك فقط» bar on organizer screens;
   - a "reset demo" item in the account menu (`prototype.reset('before')` already exists).
6. **Errors:** a top-level error boundary with a calm Arabic message and a "back home" link; a real 404 route.
7. **Access:** public with `noindex` (Q4). `robots.txt` set to `Disallow: /`.
8. **Cross-device links (Q1):** the payload links described in §5. Their test is part of the gate: open a payload link in a fresh browser context with empty storage → the card renders → the RSVP ends on the demo message.
9. **Analytics (optional):** Vercel Web Analytics, no cookies, to see which screens reviewers reach.

### Batch G/H — Leftovers (after the deploy is acceptable)

- **G:** delete the wizard; route-level `lazy()` for heavy screens (seating, import, check-in gate, settings); fonts trimmed to what A and B use (probably Great Vibes and one of Amiri or Aref Ruqaa can go); merge `craft.css`, `v2-craft.css`, `signature-polish.css` and `mobile-complete.css`; one z-index scale; `!important` under 10. The cleanup of the 405 hard-coded colours waits until after the deploy, apart from what A touches.
- **H:** move 31 old docs to `docs/archive/`.

---

## 4. What I'd cut or postpone for the deploy

| Item | Why |
| --- | --- |
| Inner pages for every non-kit card (E) | Ivory paper plus an ornament colour reads fine |
| Rebuilding all 52 Designer Kit templates | 2–3 per occasion is the goal, not 52 |
| Full CSS colour-token sweep (G) | High churn, low visible gain before launch |
| Supabase, payments, integrations | Out of scope per handoff, unless Q1 = "real RSVP" |
| Edge-rendered per-guest share images | Nice; a generic preview first |

---

## 5. Owner decisions (answered 2026-10-28)

| # | Decision | What it changes |
| --- | --- | --- |
| Q1 | **The link carries the invitation.** | **Batch V:** `/i/:slug/:code?d=<compressed payload>`, with the invitation, card, palette and the guest's name. The payload is deflate + base64url and must stay under 2KB, so the link fits in WhatsApp (the engine already has `encodeConfig` in `wizard/config.js`; move it out before G deletes the wizard). `GuestInvite` reads local storage first and the payload second. The RSVP on a device that doesn't own the event ends on «هذه نسخة تجريبية — لم يُرسل ردّك للمنظّم», never «تم الرد». The share sheet in the organizer screens builds these links. |
| Q2 | **GSAP, preset timelines only.** | Batch M as written. No animation editor and no keyframe UI, ever. Only replay in the editor. |
| Q3 | **No permission for the Canva PDF.** The owner's Canva account is **Canva for Education**: its content is licensed for educational, non-commercial use only. Even a paid Pro account doesn't allow taking elements out of Canva templates and redistributing them inside a product that offers templates to users. And the PDF pages are Canva marketplace templates (placeholders like «123 Anywhere St.»), not the owner's own designs. | The PDF stays **a layout reference only** (as the handoff said). Its look is rebuilt as original art: Designer Kit vectors + the 5 AI images (FX-08 closed: allowed). For more watercolour-style art: commission an illustrator, or generate new images and record each in `PROVENANCE.json`. Do not use the Education account to make the product's assets. |
| Q4 | **Public, not indexed.** | **Batch V:** no Deployment Protection; `X-Robots-Tag: noindex, nofollow` and `robots.txt` set to disallow; the demo bar becomes mandatory; the share preview matters (absolute `og:*`); and since strangers can open it, a "reset demo" item and an error boundary are required, not optional. |
| — | Still open from the handoff: market (Egypt / KSA), baby shower, apology copy (F066). | Defaults: KSA copy, no baby shower. |

---

## 6. What you do now (owner)

1. Open and merge the PR for `feat/card-collection`: https://github.com/KareemQabil/doyofy-studio/compare/main...feat/card-collection
2. Nothing to send for Canva (Q3): the PDF stays reference-only.
3. Copy the Designer Kit ZIP and the two ZIPs from the earlier session somewhere permanent. Batches B and E need `templates/` and `elements/` in this session; upload the Designer Kit ZIP or a trimmed `elements/` + `templates/` folder.
4. Approve Batch 0, then A. Each batch comes back with before/after screenshots from the gate.
