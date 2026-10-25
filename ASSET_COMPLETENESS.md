# Asset completeness — current site vs historical library

This archive contains every current source file, all current `public/` assets, all current `design-source/` originals and the complete production `dist/`. No runtime asset was omitted to reduce the export size. Hashes and paths are recorded in `DELIVERY_MANIFEST.json` and checked by `verify_delivery.py`.

The production build ships 25 referenced P0 files plus their glTF companions and the rest of the UI assets. All 25 source references exist. `assets:shipped:check` verifies 112 current references, including fonts, world/occasion art and glTF image/buffer companions. It passes for the delivered site. The fonts are local.

`asset-index.json`, `assets:check` and older documentation describe a much larger original P0 library (63 logical assets), with original model/material/image/video files that are not present in this project's current snapshot. The used models/HDRI/materials include derived runtime representations; these are included. The historical full-pack audit currently reports 9/63 original logical assets matching its old list and zero missing source references. That legacy-library result is not a missing-current-site-assets result.

The unused original upstream packs referenced by older documentation were not available in the current repository and are not invented or represented as included. Do not require them to run or build the current app. If a future feature needs one of those specific assets, obtain or create it, include its provenance/license and update the registry and checks deliberately.

The handoff asks Claude to add richer new artwork and original cards; it does not claim the present art direction is final or browser-verified.
