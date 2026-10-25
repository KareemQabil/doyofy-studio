# Handoff for the next agent

> **Doyofy prototype (October 2026):** the repo is now the Doyofy UX prototype built around the Invitation Studio.
> Read `DOYOFY_UX_PROTOTYPE_MASTER_SPEC.md`, then `docs/PROTOTYPE_STATUS.md`.
>
> Rules:
> - Feature code talks to `services/contracts.ts` only.
> - Raw colours live only in `src/ui/styles/tokens.css`.
> - The engine changes are opt-in (`Studio` `guest`/`doneAction`, `Wizard` `platform`), and the legacy QA must stay green (74/74 now).
>
> `useMutation` always calls the latest closure, and in-app navigation updates the router's last location. Both were real bugs, caught by `tests/e2e.mjs`. Keep that suite green on desktop and phone.
>
> The sections below describe the Invitation Studio itself.


Start here, then read `docs/AUDIT.md` (what exists and where each original feature now lives) and `docs/PRODUCTION_STATUS.md`.

## The product contract (don't break it)

- The canonical **Invitation Studio** is the product:
  - a 390×844 virtual stage;
  - states intro → card → opening → pages → pack → seal → fly → done;
  - five pages and the envelope finale;
  - a 10 × 10 card/scene switcher;
  - default **Wine & Gold + Candlelit Hall**.
- The source of truth is `canonical/*.dc.html` + `canonical/motion.css`. Cards and scenes are **generated** from it (`npm run port:canon`); don't hand-edit `src/cards/canon/generated.js` or `src/scenes/css/generated.js`.
- Never replace the default with Mediterranean or Sunlit material. Those are isolated experiments: `experiments/`, the unused P0 media, and the Canva sample DAHWmDfAn6s (non-canonical).

## Complete

- Parity port of the whole Studio on a modular engine: registries, a data-driven state machine and InvitationData. Measured timings match the original (`qa/QA_REPORT.md`).
- Candlelit Hall in real Three.js r170:
  - PBR, GLB props, HDRI → PMREM, ACES, shadows;
  - computed framing locked to the DOM stage;
  - 3 quality tiers plus adaptive DPR;
  - DOM-first progressive mount with crossfade and automatic fallback.
- P0 assets installed and verified (63/63) with a full provenance trace: `asset-index.json`, `license-index.json`, `docs/ASSET_PROVENANCE.md`.
- Audio: P0 recordings mapped to events, canonical synth as per-cue fallback, gesture unlock, mute.
- RSVP with validation, submit-once, and a local adapter (REST/Supabase adapters written).
- Accessibility (focus management, keyboard, aria, inert sheet) and reduced motion.
- QA: `npm test` (functional + 7-viewport visual matrix) and the baseline of the unmodified original.

- **Customer wizard** (`src/wizard/`): 5 steps (experience 3D/2D × animated/static → card → setting → details → share), live embedded Studio preview, guest link `?view=invite&i=<base64url config>`, draft autosave, mobile preview sheet. `docs/STUDIO_OVERVIEW.md` is the plain-language description for the owner. Wizard actions use `data-wz`; never reuse `data-act` there (it collides with the Studio's own buttons).

## Partially complete

- **Performance** is designed for (tiers, lazy chunk, ⅓-rate rendering under the sheet, adaptive DPR, disposal) but **not profiled on real phones**. The sandbox only has software WebGL.
- **RSVP backend:** adapters exist, but nothing is wired to a server.
- **Fonts:** remote Google Fonts only; the licences for local bundling weren't verified in this handoff.

## Untouched

- The other 9 scenes are still the canonical CSS/SVG renderers. That's correct as fallbacks, but they are not upgraded.
- The P0 video plates and photos (Mediterranean) aren't used.
- Gallery / Main / RSVP3D from the canvas aren't ported (library and drafts only).

## Known limitations

- The exact original Canva card (DAHWaLT4OLI) is not available; do not fabricate it.
- The HDRIs are daylight only, so the candlelit room uses the courtyard HDRI tinted and dimmed for reflections.
- There's no wax-stamp recording; the seal uses the canonical synth thump.
- The handoff bundle's p0-v3 engine, START_HERE notes and original install tool were not supplied. Everything here was rebuilt from the canonical canvas and the three P0 packs.

## Next highest-value work

1. **Profile Candlelit on real devices** (mid-range Android, iPhone, low-end laptop). Tune tier detection and asset weight; the GLB goblets are 4.8 MB, so consider KTX2/Draco via glTF-Transform.
2. **A night/interior HDRI** (Poly Haven CC0) to replace the tinted daylight courtyard for reflections.
3. **Migrate a second scene to WebGL**, e.g. Palace Arches with the CC0 architecture GLBs or Marble Morning with marble PBR. Add the renderer in front of the DOM one in `src/scenes/index.js`.
4. **Wire the RSVP adapter** to the real backend, and show a retry notice if `receipt.ok` is false.
5. **Bundle fonts locally** after verifying the OFL texts (Amiri, Aref Ruqaa, Reem Kufi, Cormorant Garamond, Great Vibes).

## Commands

```bash
npm install && npm start                  # http://localhost:5173
npm run assets:p0:install -- A1.zip A2.zip B.zip && npm run assets:check
npm run assets:derived && npm run assets:index
npm run port:canon                        # regenerate cards/scenes/motion from canonical/
npm test                                  # QA matrix → qa/qa-results.json, qa/screenshots/qa/
npm run baseline                          # needs canonical/runtime/support.js (see tests/baseline.mjs)
```
