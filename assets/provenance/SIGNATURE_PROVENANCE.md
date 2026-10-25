# «توقيع» provenance

| Item | Source | Licence | How it reaches runtime |
|---|---|---|---|
| Logo (mark + wordmark) | Owner identity pack, `design-source/brand/ASSETS/LOGO [PNG+SVG]` | Owner's own identity | Paths copied into `src/ui/brand.tsx` |
| Pattern (grid, bloom, knot, column) | Owner SVG, `design-source/brand/ASSETS/PATTERN [PNG+SVG]` | Owner's own identity | `tools/extract-brand-pattern.mjs` → `public/assets/brand/*.svg`, `brand-pattern.generated.ts` |
| Ping AR + LT 400/500/700, Shinko Sans 400 | Owner identity pack, `design-source/brand/fonts` | Commercial desktop licences (TPTQ Arabic; Jolicia Type) — **owner permission for the local prototype only** | WOFF in `public/assets/fonts/brand/` with README.txt. Web licence required before deployment |
| Phosphor Icons 2.1.1 | react-icons 5.7.0 `pi` set (global npm cache) | MIT, © 2020 Phosphor Icons | `tools/gen-phosphor-icons.mjs` → `src/ui/vendor-icons/phosphor.ts`; licence text in `src/ui/vendor-icons/PHOSPHOR-LICENSE.txt` |
| Card faces sig-diploma / sig-ribbon / sig-ticket | Original code, this pass | Project | `src/cards/signature-cards.js` |
| Card fonts Reem Kufi, Aref Ruqaa, Cormorant Garamond, IBM Plex Sans Arabic, Readex Pro | Already shipped | SIL OFL 1.1 (`public/assets/fonts/OFL-*`) | unchanged |
| Favicon, touch icon | Derived from the official mark | Owner identity | `tools/gen-favicon.mjs` |
| Share preview | Composed from brand assets + rendered faces | Owner identity + project | `tools/gen-share-preview.mjs` |
| Theme thumbnail | Brand geometry | Owner identity + project | `tools/gen-signature-world.mjs` |
| Direction captures d1–d3 | Our exploration board with rendered faces | Project | `tools/capture-directions.mjs` |

**Not used by «توقيع»:** the generated WebPs listed in `docs/GENERATED_ASSETS.json` (organizer art for other themes). Checked with `node tests/dev/signature-no-generated.mjs` on 17 signature routes at 1440 and 390: the only image outside the list is `assets/wizard/3d-candlelit.webp` (template thumbnails for 3D presets), whose provenance is **unverified** — see `legacy.wizard.3d-candlelit-thumb.v1`.
