# Asset provenance

**UI update, 10 October 2026:** eleven original image-generation assets were added. Exact prompts, paths, original/delivery hashes and provenance are in `GENERATED_ASSETS.json`. Original PNGs are retained; the organizer UI serves lossless WebP. These decorate the organizer and do not replace canonical invitation engine scenes. Required shipped references are checked by `npm run assets:shipped:check`; historical pack completeness below is not a fresh claim.

Every production asset is local: nothing hotlinks Canva, Pexels, Mixkit, Pixabay or Poly Haven at runtime. The P0 packs were installed with `tools/install_p0_packs.py`, which verifies byte counts against each pack manifest and records a sha256 for every file.

The machine-readable versions of this document are:

- `asset-index.json`: per-asset provider, licence, source, files, hashes and `usedBy`;
- `license-index.json`: assets grouped by licence, plus rejected items.

**Status: present 63/63, required missing 0, READY** (`npm run assets:check`).

## Packs

| Pack | Manifest | Created | Contents |
|---|---|---|---|
| A1 | `P0_PACK_A1_MANIFEST.json` | 2026-09-30 | 17 GLB, 3 HDRI (EXR), 9 PBR sets × 6 maps |
| A2 | `P0_PACK_A2_MANIFEST.json` | 2026-09-30 | 12 WebP images, 12 MP3 cues, 1 Canva export |
| B | `P0_PACK_B_MANIFEST.json` | 2026-09-30 | 9 MP4 video plates |

## Licences

| Licence | Assets | Attribution | Notes |
|---|---|---|---|
| CC0 1.0 (Poly Haven) | 29 (17 GLB, 3 HDRI, 9 PBR) | not required | Courtesy credit to Poly Haven in the README |
| Pexels License | 19 (12 images, 7 videos) | not required | Can't sell unaltered copies; per-item pages not re-checked in this session |
| Mixkit Sound Effects Free License | 12 audio | not required | Category licence confirmed on mixkit.co; per-file pages couldn't be matched to the CDN ids, so they're marked "verified-category" |
| Mixkit Stock Video Free License | 1 video (clip 3977) | not required | **Source page checked 2026-10-02:** "View of a window with a curtain", @edgarfernandez, Free licence |
| Pixabay Content License | 1 video | not required | per-clip page not re-checked |
| Canva Content License | 1 card export | — | **Verification pending; non-canonical** (see below) |

## Provenance corrections recorded (not silently changed)

- **Three GLB filenames don't describe their content.** The P0 build replaced three planned Sketchfab slots with CC0 Poly Haven models but kept the slot filenames. The node names inside each GLB prove the real source:
  - `arabic-arch-street.glb` → Poly Haven **modular_fort_01**
  - `kasbah-ismailia-archway.glb` → Poly Haven **large_castle_door**
  - `mediterranean-themed-garden.glb` → Poly Haven **large_iron_gate**

  Filenames are kept for compatibility; the index records the true asset ids.
- **All 17 GLBs** carry the generator string `glTF-Transform v4.5.1`, so they were repacked before packing. No geometry edits were made in this project.
- **Canva:** the only Canva item is design **DAHWmDfAn6s**, the *later Mediterranean sample*. It is **not** the canonical original card (DAHWaLT4OLI). It is flagged `canonical: false` and never used as Wine & Gold or any CardFace. The exact original Canva export is **not present**, so the canonical SVG/CSS CardFace designs remain the production cards and nothing "exact" was fabricated.
- **Rejected items (must not be re-introduced):**
  - the Mixkit curtain clip under the *Restricted* licence (personal use only);
  - `canva-card-crop.png` (wrong, unrelated editorial card).

  Neither is in the supplied packs.

## Derived files (`public/assets/p0-derived/`)

Originals in `public/assets/p0/` are never modified. Each derived file inherits its source's licence. `derived-index.json` records source sha256, operation and output sha256. Recreate them with `npm run assets:derived`.

The derived files exist for two reasons:

- **Web-servable formats:** some static hosts, including the artifact host this prototype is published on, don't serve `.glb` or `.exr`. The production scene therefore loads:
  - each Poly Haven GLB repackaged **losslessly** as glTF JSON (geometry base64-embedded, textures extracted byte-identical);
  - the courtyard HDRI as an **RGBM16 PNG**: linear HDR up to 16×, clipped above that; only the brightest sky texels are affected, and the scene dims and tints this environment anyway.
- **Lighter variants** for the balanced tier.

| Output | Source | Operation | Size |
|---|---|---|---|
| `hdri/courtyard-1k.exr` | `p0/hdri/courtyard-2k.exr` | resize 2048x1024 -> 1024x512 (INTER_AREA), RGB float, EXR | 1.75 MB |
| `hdri/courtyard-2k-rgbm16.png` | `p0/hdri/courtyard-2k.exr` | RGBM16 encode (linear, maxRange 16, clip >16), 2048x1024 PNG | 4.66 MB |
| `hdri/courtyard-1k-rgbm16.png` | `p0/hdri/courtyard-2k.exr` | resize to 1024x512 (INTER_AREA) + RGBM16 encode (linear, maxRange 16), PNG | 1.21 MB |
| `models/lantern-chandelier-01/lantern-chandelier-01.gltf.json` | `p0/models/lantern-chandelier-01.glb` | lossless GLB → glTF JSON (geometry base64-embedded, textures extracted byte-identical) | 1.49 MB |
| `models/brass-goblets/brass-goblets.gltf.json` | `p0/models/brass-goblets.glb` | lossless GLB → glTF JSON (geometry base64-embedded, textures extracted byte-identical) | 4.64 MB |
| `models/brass-vase-02/brass-vase-02.gltf.json` | `p0/models/brass-vase-02.glb` | lossless GLB → glTF JSON (geometry base64-embedded, textures extracted byte-identical) | 1.80 MB |
| `models/flower-empodium/flower-empodium.gltf.json` | `p0/models/flower-empodium.glb` | lossless GLB → glTF JSON (geometry base64-embedded, textures extracted byte-identical) | 0.89 MB |
| `models/lantern-01/lantern-01.gltf.json` | `p0/models/lantern-01.glb` | lossless GLB → glTF JSON (geometry base64-embedded, textures extracted byte-identical) | 1.76 MB |

## How assets are used

- **Candlelit Hall (Three.js):**
  - chandelier (`lantern_chandelier_01`), `brass_goblets`, `brass_vase_02` with one bloom of `flower_empodium`, and `Lantern_01`;
  - PBR: `rough_linen` (wine tablecloth with sheen), `plastered_wall_03` (hall, arches, columns), `marble_01` (floor);
  - HDRI: `courtyard` (as RGBM16 PNG), tinted to candle temperature and dimmed. It is processed through PMREM for **reflections only**; the P0 HDRIs are all daylight, so none is shown as a background.
- **Audio:** 9 Mixkit cues mapped to Studio events. Morning birds run as ambience under Marble Morning only.
- **Unused (installed, indexed, documented):**
  - the 9 Mediterranean video plates and 12 Mediterranean photos;
  - 12 GLBs (vases, plants, architecture pieces, diya lantern);
  - 6 PBR sets;
  - 2 HDRIs (studio garden, quadrangle);
  - the Mediterranean Canva card.

  They don't belong to the canonical scenes. They're ready for future scene renderers.

## Fonts

No font binaries are bundled. The Studio requests the same Google Fonts as the original (Amiri, Aref Ruqaa, Cormorant Garamond, Great Vibes, Reem Kufi). Without network the browser falls back to system serif and Arabic faces. Before bundling fonts locally, verify and ship each font's OFL licence text.

## Third-party code

| Package | Version | Licence | Notes |
|---|---|---|---|
| three.js | r170 (0.170.0) | MIT | Bundled into a lazily loaded chunk; licence notice emitted by esbuild (`*.LEGAL.txt`) |

## Full asset table

| Kind | Id | Local path | Size | Provider | Licence | Verification | Source | Used by production | Notes |
|---|---|---|---|---|---|---|---|---|---|
| audio | `sfx_cinematic_whoosh` | `p0/audio/sfx_cinematic_whoosh.mp3` | 0.04 MB | Mixkit | Mixkit Sound Effects Free License | verified-category | [source](https://assets.mixkit.co/active_storage/sfx/1492/1492-preview.mp3) | ✔ audio/index.js | |
| audio | `sfx_confirmation_tone` | `p0/audio/sfx_confirmation_tone.mp3` | 0.04 MB | Mixkit | Mixkit Sound Effects Free License | verified-category | [source](https://assets.mixkit.co/active_storage/sfx/2867/2867-preview.mp3) | — | |
| audio | `sfx_crystal_chime` | `p0/audio/sfx_crystal_chime.mp3` | 0.05 MB | Mixkit | Mixkit Sound Effects Free License | verified-category | [source](https://assets.mixkit.co/active_storage/sfx/3108/3108-preview.mp3) | ✔ audio/index.js | |
| audio | `sfx_fast_whoosh` | `p0/audio/sfx_fast_whoosh.mp3` | 0.05 MB | Mixkit | Mixkit Sound Effects Free License | verified-category | [source](https://assets.mixkit.co/active_storage/sfx/1490/1490-preview.mp3) | ✔ audio/index.js | |
| audio | `sfx_forest_birds` | `p0/audio/sfx_forest_birds.mp3` | 4.50 MB | Mixkit | Mixkit Sound Effects Free License | verified-category | [source](https://assets.mixkit.co/active_storage/sfx/1210/1210-preview.mp3) | — | |
| audio | `sfx_interface_click` | `p0/audio/sfx_interface_click.mp3` | 0.01 MB | Mixkit | Mixkit Sound Effects Free License | verified-category | [source](https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3) | ✔ audio/index.js | |
| audio | `sfx_morning_birds` | `p0/audio/sfx_morning_birds.mp3` | 6.24 MB | Mixkit | Mixkit Sound Effects Free License | verified-category | [source](https://assets.mixkit.co/active_storage/sfx/2472/2472-preview.mp3) | ✔ audio/index.js | |
| audio | `sfx_page_turn_single` | `p0/audio/sfx_page_turn_single.mp3` | 0.02 MB | Mixkit | Mixkit Sound Effects Free License | verified-category | [source](https://assets.mixkit.co/active_storage/sfx/1104/1104-preview.mp3) | ✔ audio/index.js | |
| audio | `sfx_paper_slide` | `p0/audio/sfx_paper_slide.mp3` | 0.04 MB | Mixkit | Mixkit Sound Effects Free License | verified-category | [source](https://assets.mixkit.co/active_storage/sfx/1530/1530-preview.mp3) | ✔ audio/index.js | |
| audio | `sfx_relaxing_chime` | `p0/audio/sfx_relaxing_chime.mp3` | 0.04 MB | Mixkit | Mixkit Sound Effects Free License | verified-category | [source](https://assets.mixkit.co/active_storage/sfx/3109/3109-preview.mp3) | ✔ audio/index.js | |
| audio | `sfx_select_click` | `p0/audio/sfx_select_click.mp3` | 0.03 MB | Mixkit | Mixkit Sound Effects Free License | verified-category | [source](https://assets.mixkit.co/active_storage/sfx/1109/1109-preview.mp3) | ✔ audio/index.js | |
| audio | `sfx_single_book_paging` | `p0/audio/sfx_single_book_paging.mp3` | 0.08 MB | Mixkit | Mixkit Sound Effects Free License | verified-category | [source](https://assets.mixkit.co/active_storage/sfx/1101/1101-preview.mp3) | — | |
| canva | `canva_mediterranean_invitation_01` | `p0/cards/mediterranean-canva-01/front.webp` | 0.07 MB | Canva | Canva Content License (export of a user design) | pending | Canva DAHWmDfAn6s page PBPgZxQwpChS27qm | — | Canva design DAHWmDfAn6s = the LATER Mediterranean sample. It is NOT the canonical original card (DAHWaLT4OLI). Kept isolated; never used as Wine & Gold or any canonical CardFace. |
| hdri | `courtyard` | `p0/hdri/courtyard-2k.exr` | 6.20 MB | Poly Haven | CC0 1.0 | verified-source-url | [source](https://dl.polyhaven.org/file/ph-assets/HDRIs/exr/2k/courtyard_2k.exr) | ✔ scenes/index.js, scenes/three/candlelit-hall.js | |
| hdri | `quadrangle_sunny` | `p0/hdri/quadrangle-sunny-1k.exr` | 5.68 MB | Poly Haven | CC0 1.0 | verified-source-url | [source](https://dl.polyhaven.org/file/ph-assets/HDRIs/exr/1k/quadrangle_sunny_1k.exr) | — | |
| hdri | `studio_garden` | `p0/hdri/studio-garden-1k.exr` | 1.85 MB | Poly Haven | CC0 1.0 | verified-source-url | [source](https://dl.polyhaven.org/file/ph-assets/HDRIs/exr/1k/studio_garden_1k.exr) | — | |
| image | `bougainvillea_close_18365171` | `p0/images/bougainvillea_close_18365171.webp` | 0.12 MB | Pexels | Pexels License | verified-source-url | [source](https://images.pexels.com/photos/18365171/pexels-photo-18365171.jpeg?cs=srgb&fm=jpg) | — | |
| image | `bougainvillea_sky_30643289` | `p0/images/bougainvillea_sky_30643289.webp` | 0.18 MB | Pexels | Pexels License | verified-source-url | [source](https://images.pexels.com/photos/30643289/pexels-photo-30643289.jpeg?cs=srgb&fm=jpg) | — | |
| image | `bougainvillea_sunlit_36840411` | `p0/images/bougainvillea_sunlit_36840411.webp` | 0.15 MB | Pexels | Pexels License | verified-source-url | [source](https://images.pexels.com/photos/36840411/pexels-photo-36840411.jpeg?cs=srgb&fm=jpg) | — | |
| image | `olive_close_16841981` | `p0/images/olive_close_16841981.webp` | 0.06 MB | Pexels | Pexels License | verified-source-url | [source](https://images.pexels.com/photos/16841981/pexels-photo-16841981.jpeg?cs=srgb&fm=jpg) | — | |
| image | `olive_close_37442090` | `p0/images/olive_close_37442090.webp` | 0.10 MB | Pexels | Pexels License | verified-source-url | [source](https://images.pexels.com/photos/37442090/pexels-photo-37442090.jpeg?cs=srgb&fm=jpg) | — | |
| image | `olive_close_37714385` | `p0/images/olive_close_37714385.webp` | 0.10 MB | Pexels | Pexels License | verified-source-url | [source](https://images.pexels.com/photos/37714385/pexels-photo-37714385.jpeg?cs=srgb&fm=jpg) | — | |
| image | `olive_close_7562475` | `p0/images/olive_close_7562475.webp` | 0.13 MB | Pexels | Pexels License | verified-source-url | [source](https://images.pexels.com/photos/7562475/pexels-photo-7562475.jpeg?cs=srgb&fm=jpg) | — | |
| image | `olive_minimal_white` | `p0/images/olive_minimal_white.webp` | 0.13 MB | Pexels | Pexels License | verified-source-url | [source](https://images.pexels.com/photos/6594387/pexels-photo-6594387.jpeg?cs=srgb&fm=jpg) | — | |
| image | `white_blossoms_12115127` | `p0/images/white_blossoms_12115127.webp` | 0.03 MB | Pexels | Pexels License | verified-source-url | [source](https://images.pexels.com/photos/12115127/pexels-photo-12115127.jpeg?cs=srgb&fm=jpg) | — | |
| image | `white_flowers_15591789` | `p0/images/white_flowers_15591789.webp` | 0.32 MB | Pexels | Pexels License | verified-source-url | [source](https://images.pexels.com/photos/15591789/pexels-photo-15591789.jpeg?cs=srgb&fm=jpg) | — | |
| image | `white_flowers_20500913` | `p0/images/white_flowers_20500913.webp` | 0.09 MB | Pexels | Pexels License | verified-source-url | [source](https://images.pexels.com/photos/20500913/pexels-photo-20500913.jpeg?cs=srgb&fm=jpg) | — | |
| image | `white_flowers_24245177` | `p0/images/white_flowers_24245177.webp` | 0.24 MB | Pexels | Pexels License | verified-source-url | [source](https://images.pexels.com/photos/24245177/pexels-photo-24245177.jpeg?cs=srgb&fm=jpg) | — | |
| model | `Lantern_01` | `p0/models/lantern-01.glb` | 1.49 MB | Poly Haven | CC0 1.0 | verified-file-metadata | [source](https://polyhaven.com/a/Lantern_01) | ✔ scenes/index.js, scenes/three/candlelit-hall.js | |
| model | `antique_ceramic_vase_01` | `p0/models/antique-ceramic-vase-01.glb` | 0.50 MB | Poly Haven | CC0 1.0 | verified-file-metadata | [source](https://polyhaven.com/a/antique_ceramic_vase_01) | — | |
| model | `brass_diya_lantern` | `p0/models/brass-diya-lantern.glb` | 2.39 MB | Poly Haven | CC0 1.0 | verified-file-metadata | [source](https://polyhaven.com/a/brass_diya_lantern) | — | |
| model | `brass_goblets` | `p0/models/brass-goblets.glb` | 4.55 MB | Poly Haven | CC0 1.0 | verified-file-metadata | [source](https://polyhaven.com/a/brass_goblets) | ✔ scenes/index.js, scenes/three/candlelit-hall.js | |
| model | `brass_vase_02` | `p0/models/brass-vase-02.glb` | 1.75 MB | Poly Haven | CC0 1.0 | verified-file-metadata | [source](https://polyhaven.com/a/brass_vase_02) | ✔ scenes/index.js, scenes/three/candlelit-hall.js | |
| model | `brass_vase_03` | `p0/models/brass-vase-03.glb` | 1.51 MB | Poly Haven | CC0 1.0 | verified-file-metadata | [source](https://polyhaven.com/a/brass_vase_03) | — | |
| model | `ceramic_vase_01` | `p0/models/ceramic-vase-01.glb` | 0.40 MB | Poly Haven | CC0 1.0 | verified-file-metadata | [source](https://polyhaven.com/a/ceramic_vase_01) | — | |
| model | `ceramic_vase_04` | `p0/models/ceramic-vase-04.glb` | 0.57 MB | Poly Haven | CC0 1.0 | verified-file-metadata | [source](https://polyhaven.com/a/ceramic_vase_04) | — | |
| model | `coffee_table_round_01` | `p0/models/coffee-table-round-01.glb` | 1.49 MB | Poly Haven | CC0 1.0 | verified-file-metadata | [source](https://polyhaven.com/a/coffee_table_round_01) | — | |
| model | `flower_empodium` | `p0/models/flower-empodium.glb` | 0.85 MB | Poly Haven | CC0 1.0 | verified-file-metadata | [source](https://polyhaven.com/a/flower_empodium) | ✔ scenes/three/candlelit-hall.js | |
| model | `flower_heliophila` | `p0/models/flower-heliophila.glb` | 3.67 MB | Poly Haven | CC0 1.0 | verified-file-metadata | [source](https://polyhaven.com/a/flower_heliophila) | — | |
| model | `lantern_chandelier_01` | `p0/models/lantern-chandelier-01.glb` | 1.41 MB | Poly Haven | CC0 1.0 | verified-file-metadata | [source](https://polyhaven.com/a/lantern_chandelier_01) | ✔ scenes/index.js, scenes/three/candlelit-hall.js | |
| model | `large_castle_door` | `p0/models/kasbah-ismailia-archway.glb` | 3.12 MB | Poly Haven | CC0 1.0 | verified-file-metadata | [source](https://polyhaven.com/a/large_castle_door) | — | File is named kasbah-ismailia-archway.glb (planned Sketchfab slot) but contains Poly Haven 'large_castle_door'. CC0 replacement, filename kept. |
| model | `large_iron_gate` | `p0/models/mediterranean-themed-garden.glb` | 2.98 MB | Poly Haven | CC0 1.0 | verified-file-metadata | [source](https://polyhaven.com/a/large_iron_gate) | — | File is named mediterranean-themed-garden.glb (planned Sketchfab slot) but contains Poly Haven 'large_iron_gate'. CC0 replacement, filename kept. |
| model | `modular_fort_01` | `p0/models/arabic-arch-street.glb` | 10.11 MB | Poly Haven | CC0 1.0 | verified-file-metadata | [source](https://polyhaven.com/a/modular_fort_01) | — | File is named arabic-arch-street.glb (the planned Sketchfab slot) but contains Poly Haven 'modular_fort_01' (node names modular_fort_01_*). Sketchfab slot was replaced by a CC0 Poly Haven fallback in the P0 build — filename kept, provenance corrected here. |
| model | `periwinkle_plant` | `p0/models/periwinkle-plant.glb` | 2.78 MB | Poly Haven | CC0 1.0 | verified-file-metadata | [source](https://polyhaven.com/a/periwinkle_plant) | — | |
| model | `potted_plant_04` | `p0/models/potted-plant-04.glb` | 2.02 MB | Poly Haven | CC0 1.0 | verified-file-metadata | [source](https://polyhaven.com/a/potted_plant_04) | — | |
| pbr | `beige_wall_001` | `p0/materials/beige-wall-001/ (6 maps)` | 0.66 MB | Poly Haven | CC0 1.0 | verified-source-url | [source](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/beige_wall_001/beige_wall_001_diff_1k.jpg) | — | |
| pbr | `interior_tiles` | `p0/materials/interior-tiles/ (6 maps)` | 2.59 MB | Poly Haven | CC0 1.0 | verified-source-url | [source](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/interior_tiles/interior_tiles_diff_1k.jpg) | — | |
| pbr | `marble_01` | `p0/materials/marble-01/ (6 maps)` | 0.80 MB | Poly Haven | CC0 1.0 | verified-source-url | [source](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/marble_01/marble_01_diff_1k.jpg) | ✔ scenes/three/candlelit-hall.js | |
| pbr | `patio_tiles` | `p0/materials/patio-tiles/ (6 maps)` | 2.49 MB | Poly Haven | CC0 1.0 | verified-source-url | [source](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/patio_tiles/patio_tiles_diff_1k.jpg) | — | |
| pbr | `plastered_wall_03` | `p0/materials/plastered-wall-03/ (6 maps)` | 1.70 MB | Poly Haven | CC0 1.0 | verified-source-url | [source](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/plastered_wall_03/plastered_wall_03_diff_1k.jpg) | ✔ scenes/three/candlelit-hall.js | |
| pbr | `rough_linen` | `p0/materials/rough-linen/ (6 maps)` | 5.69 MB | Poly Haven | CC0 1.0 | verified-source-url | [source](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rough_linen/rough_linen_diff_1k.jpg) | ✔ scenes/three/candlelit-hall.js | |
| pbr | `sandstone_blocks_08` | `p0/materials/sandstone-blocks-08/ (6 maps)` | 0.80 MB | Poly Haven | CC0 1.0 | verified-source-url | [source](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/sandstone_blocks_08/sandstone_blocks_08_diff_1k.jpg) | — | |
| pbr | `white_plaster_02` | `p0/materials/white-plaster-02/ (6 maps)` | 2.36 MB | Poly Haven | CC0 1.0 | verified-source-url | [source](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/white_plaster_02/white_plaster_02_diff_1k.jpg) | — | |
| pbr | `white_sandstone_bricks_03` | `p0/materials/white-sandstone-bricks-03/ (6 maps)` | 2.02 MB | Poly Haven | CC0 1.0 | verified-source-url | [source](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/white_sandstone_bricks_03/white_sandstone_bricks_03_diff_1k.jpg) | — | |
| video | `video_cloister_36902355` | `p0/video/cloister-courtyard.mp4` | 1.92 MB | Pexels | Pexels License | verified-source-url | [source](https://videos.pexels.com/video-files/36902355/15631979_1280_720_30fps.mp4) | — | |
| video | `video_curtain_cozy_31035935` | `p0/video/curtain-cozy-light.mp4` | 1.30 MB | Pexels | Pexels License | verified-source-url | [source](https://videos.pexels.com/video-files/31035935/13265112_720_1280_25fps.mp4) | — | |
| video | `video_light_pattern_5482661` | `p0/video/window-light-pattern.mp4` | 14.67 MB | Pexels | Pexels License | verified-source-url | [source](https://videos.pexels.com/video-files/5482661/5482661-hd_1280_720_60fps.mp4) | — | |
| video | `video_mediterranean_courtyard_34987005` | `p0/video/mediterranean-courtyard-flowers.mp4` | 4.33 MB | Pexels | Pexels License | verified-source-url | [source](https://videos.pexels.com/video-files/34987005/14821991_720_1280_24fps.mp4) | — | |
| video | `video_mixkit_window_curtain` | `p0/video/mixkit-window-curtain.mp4` | 3.11 MB | Mixkit | Mixkit Stock Video Free License | verified-source-page | [source](https://assets.mixkit.co/videos/3977/3977-720.mp4) | — | This is clip 3977 'View of a window with a curtain' — Free licence. It is NOT the previously rejected restricted-licence Mixkit curtain clip. |
| video | `video_pixabay_curtain_breeze` | `p0/video/pixabay-curtain-breeze.mp4` | 21.84 MB | Pixabay | Pixabay Content License | verified-source-url | [source](https://cdn.pixabay.com/video/2024/12/18/247535_large.mp4) | — | |
| video | `video_sheer_flow_36622181` | `p0/video/sheer-curtain-soft-02.mp4` | 35.30 MB | Pexels | Pexels License | verified-source-url | [source](https://videos.pexels.com/video-files/36622181/15526801_720_1280_30fps.mp4) | — | |
| video | `video_sheer_sunlight_35434114` | `p0/video/sheer-sunlight-01.mp4` | 1.31 MB | Pexels | Pexels License | verified-source-url | [source](https://videos.pexels.com/video-files/35434114/15012592_720_1280_30fps.mp4) | — | |
| video | `video_sunlit_curtains_30286553` | `p0/video/sunlit-curtains-serene.mp4` | 5.96 MB | Pexels | Pexels License | verified-source-url | [source](https://videos.pexels.com/video-files/30286553/12982801_1280_720_30fps.mp4) | — | |
