# Doyofy V2 final — status and deploy guide

**Date:** 2026-10-28.
**Branch:** `v2/final`, one commit per batch.
**Reads with:** `FINAL_PHASE_PLAN_2026-10-28.md`, which has the plan, the owner's decisions Q1–Q4 and the acceptance numbers.

---

## What shipped

| Batch | Result |
| --- | --- |
| **0 · Release gate** | `tests/gate.mjs` replaces the stale e2e/qa suites. |
| **A · One identity + dark** | Orbit, Bahja, Horizon, the five colour themes, ThemePicker and the direction pages are deleted. Appearance is light, dark or follow the device, applied before first paint and set from the account menu. FX-12: field borders get their own token. |
| **D · Swipe** | The card under the finger moves with it, and swiping right shows the next card (FX-01–05). One card per normal swipe, two only for a fast fling. Touches within 24px of either screen edge are left to the system (FX-09). |
| **C · Density and layout** | One scale (`src/ui/styles/density.css`):<br>• header 56px, rail 232px<br>• phone app bar 48px + tab bar 56px; the app bar hides on scroll down<br>• page titles 24–32px, display text 40–72px<br>• controls 40px with a mouse, 44px on touch<br>Also fixed: the guests page on phones (FX-06, FX-07, FX-17), the occasion deck fitting its poster, focus never hidden under a bar (FX-10), the radius scale (FX-16) and one reception prep panel (FX-14). |
| **B · One card family** | «الطقم» has 30 faces, at least two per occasion:<br>• 13 Designer Kit faces<br>• 6 flat motion faces after the GSAP reference<br>• 9 built from the owner's PDF layers<br>• 2 typographic faces<br>The 28 legacy faces and the dead wizard are deleted. Templates come from one catalogue. Saved designs that use a retired face open on their occasion's face. |
| **M · Motion** | Preset GSAP timelines for every face, played when the card is revealed and in the editor (with «شغّل حركة البطاقة»). GSAP loads on demand: 68KB, about 27KB gzipped. Reduced motion shows the face at rest. |
| **E/F · Guest invitation** | The desktop backdrop is centred (it was pinned right in RTL). A decline folds the guest counter away (FX-13). |
| **V · Deploy** | • Self-contained guest links (`?d=`, Q1) that open on any phone; their reply screen says it is a demo and nothing was sent.<br>• Content-hashed entry files.<br>• Strict CSP with no inline scripts (verified against the 3D scene, the editor and the guest view).<br>• `noindex`, `robots.txt` and absolute share previews.<br>• Cache headers.<br>• Demo notice bar, "reset demo" option and crash screen.<br>• Birdsong ambience re-encoded from 6.3MB to 0.5MB. |
| **H · Docs** | Old round documents are moved to `docs/archive/`. |

### Numbers on the final build

| | Before (audit) | Now |
| --- | --- | --- |
| `app.js` | 1.1MB · 258KB gzip | 884KB · 224KB gzip |
| `ui.css` | 382KB · 71KB gzip | 284KB · 54KB gzip |
| `dist/` | 39MB | 32MB (the 3D library loads only when that scene is chosen) |
| Faces / templates | 41 / 129 | 30 / 90 (each face × 3 settings) |
| Fixed chrome on a phone | 126px | 104px |
| Release gate | — | 231/231 screens clean (5 viewports × light/dark, plus the Q1 link check) |
| Unit / DOM / journey | 84 / 54 / — | 82 / 42 + 35 route mounts / 25 of 25 |

**Why some test counts went down:** the theme-specific tests were deleted along with the themes. The journey test now passes fully; it failed 2 of 25 before.

---

## Deploy to Vercel

The repository is ready for a static deploy. No server or database is needed.

1. Go to **vercel.com → Add New… → Project**, import `KareemQabil/doyofy-studio`, and choose the `v2/final` branch, or `main` after merging.
2. **Framework preset:** Other. The build command and output directory come from `vercel.json` (`npm run build` → `dist`).
3. **Optional:** set the environment variable `SITE_URL` to your final domain, e.g. `https://doyofy.vercel.app`. Without it, Vercel's own production URL is used for the share-preview image.
4. Deploy. Then open:
   - `/app/events` — the organizer home
   - `/app/events/new` — the occasion deck
   - a guest link copied from a guest's drawer, opened on another phone

**Notes:**
- **Indexing:** the site sends `X-Robots-Tag: noindex` and `robots.txt` disallows everything. Remove both when it should be indexed.
- **Content-Security-Policy:** it is in `vercel.json`. If you add an analytics script, add its host to `script-src` and `connect-src`.

---

## Check on real devices (not possible from this machine)

- **iOS Safari and Android Chrome:**
  - the deck follows the finger;
  - one medium swipe moves exactly one card;
  - a swipe starting at the very edge goes "back" instead of moving the deck.
- **WhatsApp:**
  - the shared link shows the preview image;
  - a 1.7KB guest link opens fully.
- **Screen readers:** VoiceOver and TalkBack on the guest invitation and the editor.
- **3D candlelit scene:** test on a mid-range Android.

---

## Left for after the deploy

| Item | Why it waits |
| --- | --- |
| J-01 food and gifts as steps inside the engine's RSVP card | Today they are an honest sheet over the invitation («لم يُرسل الرد بعد»). Moving them into the vanilla engine is a larger rewrite. |
| Kit scenes and envelopes from `Doyofy_Claude_Designer_Kit` (`elements/scenes`, `elements/envelopes`) | The kit is in the owner's Downloads, not in this repository. Upload `elements/` and `templates/` to use them. |
| Real backend (Supabase) for cross-device RSVP | Out of scope (Q1 chose self-contained demo links). The adapters exist in `src/services/remote`. |
| CSS consolidation: merge `craft.css`, `v2-craft.css`, `signature-polish.css` and `mobile-complete.css`; a z-index scale; the remaining hard-coded colours | No visible change. `density.css` and `dark.css` now carry the shipped values. |
| Trimming unused fonts | Decide once the faces settle. Great Vibes is used by the cornflower face. |
| Rights review of the PDF layers before any commercial launch | Recorded in `public/assets/cards/kit/PROVENANCE.json`. |
| Market (KSA or Egypt), baby shower, apology copy (F066) | Still open with the owner. |

The repository is public. To make it private: **GitHub → Settings → General → Danger Zone → Change visibility**. Vercel deploys private repositories too.
