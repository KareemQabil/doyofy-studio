# ضيوفي · Doyofy Studio

Arabic-first RTL invitation studio and event guest management prototype.

## Start here

- [Workflow upgrade audit and plan — 21 November 2026](docs/audit/README.md) — requirement coverage, independent findings, implementation and verification.
- [V2 final status and deploy guide](docs/handoff/V2_FINAL_STATUS_2026-10-28.md) — what ships, how to put it on Vercel, what is left.
- [Final-phase plan](docs/handoff/FINAL_PHASE_PLAN_2026-10-28.md) — the batches, the owner's decisions (Q1–Q4) and the acceptance numbers.
- Older round documents live in `docs/archive/` and are superseded by the two above.

## Current snapshot (workflow upgrade, 22 November 2026)

One identity («توقيع») with light, dark and follow-the-device appearance; 30 animated invitation faces across 13 occasions.
Creation stays two steps, restores unfinished drafts and supports shared template links. Mobile cards are larger and templates
have vertical browsing. Event changes save during publication. Guest tools include scoped CSV exports, copy/move between events,
state-aware actions and table drag/reordering. Catering has a focused report and food-only menu setup. Account preferences provide
modern Arabic, Egyptian and Saudi writing, plus a local audio library. Capacity upgrades demonstrate checkout and resume the pending operation.

**This is a local demo:** accounts and event data are stored in this browser. Remote adapters exist but are not selected.
Shared guest links carry the invitation itself, so they open on any phone — a reply made from such a link is clearly marked
as a demo and is not sent to the organizer. Confirmed personal guests reach QR and a clearly labelled Google Wallet preview.
WhatsApp and SMS open a prepared message for manual sending. There is no live payment, automated delivery, Wallet issuance or
live camera scanning. Uploaded audio stays on this browser; sharing the file itself needs a storage service.

## Run

```bash
npm ci
npm start
```

## Validate and build

```bash
npm test            # typecheck · unit · DOM · release gate · Signature journey · upgrade acceptance
npm run build       # dist/ — content-hashed entries, lazy chunks for the engine, GSAP and the Lottie player
npm run validate    # unit/DOM, build, token contrast and shipped-asset checks, including on a clean checkout
npm run test:upgrade # focused mobile, template, audio, table-order and checkout browser journeys
```

The browser checks use `CHROMIUM_EXECUTABLE_PATH`, a supported system Chromium, or Playwright's browser. Run
`npx playwright install chromium` once.

Browser/device tests require a supported browser test environment. DOM tests are not evidence of real touch or visual QA.

## Project layout

- `src/domain` — entities, validation and journey rules.
- `src/services` — mock runtime and remote contracts/adapters.
- `src/features` — organizer, editor, guest and reception screens.
- `src/studio`, `src/engine`, `src/cards`, `src/scenes` — invitation engine.
- `public/assets` — all shipped artwork, fonts, audio and scene resources.
- `design-source`, `studio-design-book`, `assets` — design source and provenance.
- `backend` — inactive production backend work and setup notes.
- `docs` — product and audit documentation; older files retain their original dates and counts.

## Deployment

`npm run build` emits static `dist/`. `vercel.json` provides SPA routing, `noindex`, a Content-Security-Policy (no inline
scripts), immutable caching for hashed entries and chunks, and a week for `assets/`. Set `SITE_URL` (or rely on Vercel's
`VERCEL_PROJECT_PRODUCTION_URL`) so share previews use absolute URLs. Step-by-step: [deploy guide](docs/handoff/V2_FINAL_STATUS_2026-10-28.md#deploy-to-vercel).

Do not commit credentials or local `.env` values. `.env.example` contains names only. `public/assets/fonts/brand/README.txt`
documents font restrictions; retaining an asset does not grant additional redistribution rights. The original README is
preserved in `docs/archive/LEGACY_README.md`.
