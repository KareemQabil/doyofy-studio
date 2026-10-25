# ضيوفي · Doyofy Studio

Arabic-first RTL invitation studio and event guest management prototype.

## Current snapshot

Exported 25 October 2026 from Sites v9, source commit `a83069f2fb2c21a1957a78110c7d479b9eac39e7`. Includes 13 occasions, 28 native card faces, 86 template presets, nine organizer appearances, invitation editor, public/personal RSVP, guest lists, optional seating, reception and summary.

**Current runtime is a local demo:** accounts and event data are stored in this browser. Remote adapters exist but are not selected. Cross-device sharing, authenticated production accounts, real outbound messaging and live camera scanning are not enabled. Do not describe this snapshot as a complete production service.

## Run

```bash
npm ci
npm start
```

## Validate and build

```bash
npm run typecheck
npm run test:unit
npm run test:dom
npm run build
npm run assets:shipped:check
```

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

`npm run build` emits static `dist/`; `vercel.json` provides SPA routing. Do not commit credentials or local `.env` values. `.env.example` contains names only. `public/assets/fonts/brand/README.txt` documents font restrictions; retaining an asset does not grant additional redistribution rights.

The live site is unchanged by this export. See `GITHUB_EXPORT_NOTES.md` for export scope. Original README is preserved in `docs/LEGACY_README.md` as historical documentation.
