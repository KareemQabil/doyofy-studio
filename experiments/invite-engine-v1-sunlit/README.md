# Invitation Experience Engine

A modular engine for premium, interactive wedding invitations. Each experience is a **config object**. It chooses one module from each independent layer: card, scene, reveal, motion, interaction, camera, FX, audio, pages, finale. The engine assembles them, checks their compatibility, and runs the flow.

Flagship preset: **Sunlit Architectural Botanical**. Plaster wall, moving window light, a linen cloth peeling off the card, olive branches settling, a vellum-sleeve finale.

```bash
npm install
npm start              # build once + serve → http://localhost:5173  (#<preset-id> in the URL picks a preset)
npm run dev            # same, but rebuilds on every change in src/
npm run build          # bundle src/ → dist/ only (deploy dist/ to any static host)
npm test               # full e2e matrix (every preset × mobile/desktop), screenshots in tests/shots/e2e
node tests/e2e.mjs --quick
node tests/shoot.mjs   # ad-hoc screenshots at given seconds/viewports
```

Works the same on Windows (PowerShell / cmd), macOS and Linux. If port 5173 is busy, the server moves to the next free port and prints it. Open the page over `http://localhost`, not by double-clicking `dist/index.html`: ES modules, video and audio need a server. Before `npm test` or `npm run assets:thumbs` on a new machine, run `npx playwright install chromium` once. Regenerating audio (`npm run assets:audio`) calls `python3`; on Windows change it to `py` or `python` in package.json if needed. The shipped assets are already built, so this is only for regenerating.

No runtime dependencies. Dev tools: `esbuild`, `playwright`, `sharp` (plus `python3` with numpy/scipy/Pillow and `ffmpeg` for asset generation). `gsap` and `three` are **optional** (see *Render modes*).

---

## 1. Architecture

```
config ──► ExperienceEngine.load(config)
             │ normalizeConfig (preset ⊕ overrides)
             │ CompatibilityEngine.score  → warnings, never hard failures
             ▼
   Registries ──► resolve each layer (fallback when an id is missing)
             ▼
   Stage (depth layers + card rig) · Camera · FX · Audio · Pages · Flow
             ▼
   FlowEngine walks the states: intro → hero → opening → pages… → finale → thankYou
```

| Layer | Registry | Folder | Hook(s) the engine calls |
|---|---|---|---|
| Content | – (data) | `src/content/` | `deriveContent()` → dates, Hijri, countdown, calendar URL |
| Card template | `CardRegistry` | `src/cards/` + `public/assets/cards/<pack>/` | `render(m)` → faces, decor, palette, fonts |
| Environment / scene | `SceneRegistry` | `src/scenes/` | `setup`, `layout`, `enter`, `idle`, `destroy` |
| Reveal | `RevealRegistry` | `src/reveals/` | `enter(m, tl)` (labels `card`, `decor`, `readable`) |
| Idle motion | `MotionRegistry` | `src/motions/` | `idle(m)` → stop fn |
| Page transition | `TransitionRegistry` | `src/motions/` | `open`, `change(m, tl, {from,to,dir})`, `close` |
| Interaction | `InteractionRegistry` | `src/interactions/` | `interact(m)` → stop fn |
| Camera | `CameraRegistry` | `src/camera/` | `intro`, `idle`, `pages`, `rest`, `pullBack` presets |
| FX | `FXRegistry` / `FXPackRegistry` | `src/fx/` | canvas/DOM modules; packs are lists of modules |
| Audio | `AudioRegistry` | `src/audio/` + `public/assets/audio/<pack>/` | cue map; played only via `audio.emit(event)` |
| Pages | `PageRegistry` | `src/pages/` | `available(content)`, `render(m)` |
| Finale | `FinaleRegistry` | `src/finales/` | `enter(m, tl)` |
| Preset | `PresetRegistry` | `src/presets/` | pure data |

**Core modules** live in `src/engine/`:

| File | Role |
|---|---|
| `ExperienceEngine.js` | Load, teardown, run the flow, restart; hosts the module context |
| `Registry.js` / `registries.js` | `defineModule`, `Registry` (register / get with fallback / list) |
| `Stage.js`, `fit.js` | Depth layers, card rig, viewport-aware card fitting |
| `Camera.js` | Camera transforms around the card centre |
| `PageEngine.js`, `FlowEngine.js` | Page sheet (swipe/keys/dots, queued navigation); config-driven states |
| `AudioEngine.js` | Event-based audio, gesture unlock, synth fallback, ducking, mute |
| `FXEngine.js` | One shared canvas for particle FX |
| `CompatibilityEngine.js` | Tag scoring, ranking, random compatible combos |
| `AssetManager.js` | Responsive picks, preload with timeout, video (poster / lazy / pause when hidden) |
| `Quality.js` | Device tier, DPR cap, reduced motion, save-data |
| `Fonts.js` | Local-first font loading |
| `Content.js` | Localized derived content (ar / en, RTL / LTR, Hijri) |
| `motion/Timeline.js`, `motion/ease.js` | Built-in timeline (GSAP-compatible API) and eases |
| `render/webgl.js`, `render/three.js` | Shader layer; optional Three adapter |
| `rsvp/adapters.js` | Local / REST / Supabase adapters |

Each module is data plus lifecycle hooks (`setup / enter / idle / interact / exit / destroy`). The engine owns every timeline, listener, RAF loop and video the modules create. Modules create them through the context `m`:

```js
m.tl()              // timeline (built-in, or GSAP when configured)
m.set(el, props)    // transform-aware property set
m.loop(fn)          // RAF loop, auto-stopped on teardown
m.listen(el, ev, fn)
m.track(disposeFn)
m.stage, m.card, m.content, m.quality, m.assets, m.audio, m.params, m.state
```

Replay and preset switching therefore never leak anything. No layer branches on another layer's id; everything is driven by the config, tags and params.

### Stage depth layers

`far → background → mid → subject → card → foreground → lighting → fx → overlay` (+ UI).

- Parallax is CSS: `--px/--py × --d` per layer.
- The card rig nests `anchor › tilt › idle › reveal › flip › scale › faces`, so reveal, idle, interaction and camera never fight over one transform.
- Layout uses container units (`cqw/cqh`). `fitCard()` computes the card box from the viewport and safe areas on every resize, and scenes place their props relative to that box. The card is always fully visible and readable.

### Flow

`flow` is an ordered list of states, e.g. `['intro','hero','opening','invitation','date','program','venue','details','rsvp','finale','thankYou']`.

- Page states whose data is missing (e.g. `gallery` with no photos) are dropped automatically.
- Aliases: `seal` / `packing` → `finale`.
- A short preset can be `['hero','invitation','venue','finale','thankYou']`.
- The intro is 6–9 s; a tap on the scene fast-forwards it. The invitation is readable by ~6.5 s.

### Config schema (abridged)

```js
{
  preset: 'sunlit-architectural-botanical',   // optional base; every field below overrides it
  content: { couple: {…}, date: '2027-08-12T19:00:00', timeZone: 'Africa/Cairo', language: 'ar',
             venue: {…}, program: […], dressCode, photos: [], rsvp: { deadline, maxGuests, fields } },
  card:        { template: 'arabic_botanical_luxury', variant: 'ivory_olive', assetPack: 'arabic-botanical-01' },
  environment: { id: 'sunlit_architectural_studio', renderMode: 'hybrid', params: {} },
  reveal:      { id: 'fabric_peel_and_card_lift' },
  motion:      { idle: 'cinematic_breathing', interaction: 'soft_depth_parallax', pageTransition: 'editorial_slide', engine: 'builtin' | 'gsap' },
  camera:      { preset: 'cinematic_dolly' },
  fx:          { pack: 'soft_sun_dust', intensity: 0.55 },
  audio:       { pack: 'modern_romantic', enabled: true },
  finale:      { type: 'translucent_sleeve' },
  flow:        [ … ],
  quality:     { level: 'auto' | 'high' | 'medium' | 'low', reducedMotion: null | true | false },
  vendor:      { three: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/…/three.module.min.js' } // optional
}
```

Engine options: `new ExperienceEngine(host, { assetBase, rsvp: { type: 'local' | 'rest' | 'supabase', … }, remoteFonts, fontManifest })`.

---

## 2. Render modes

Every module declares `renderMode`:

| Mode | Used by |
|---|---|
| `dom` | Most scenes, cards, pages |
| `svg` | Botanicals, frames |
| `canvas` | FX particles |
| `video` | Sunlit window-light loop (mp4 / webm + poster) |
| `webgl` | `liquid_chrome` shader |
| `three` | `glass_objects_3d` |
| `hybrid` | Flagship: DOM + video + canvas |

- **Timeline.** Built in. Set `motion.engine: 'gsap'` *and* load `window.gsap` to hand the timelines to GSAP; the API matches (`to / from / fromTo / set / call / add / addLabel`, position strings).
- **WebGL.** `createShaderLayer` caps DPR and scales down on mobile. It redraws on resize, pauses the loop for reduced motion, and calls `loseContext()` on teardown.
- **Three.js.** Loaded **only** when a scene declares `renderMode: 'three'` and `config.vendor.three` is set. Otherwise that scene falls back to its shader version. The whole app is never forced into Three.

---

## 3. Adding things

### A card: layered asset pack (the Canva pipeline)

1. Export from Canva as transparent PNG/SVG layers, named by role: `front.png`, `frame.svg`, `ornament-01.png`, `decor-01.png`, optionally `back.png`, `inside-01.png`, `overlay.png`.
2. Import the pack:
   ```bash
   npm run import:canva -- ~/Downloads/my-export my-card-01 --title "My Card" --tags arabic,light,botanical
   ```
   This writes `public/assets/cards/my-card-01/` with responsive WebP (`-600/-1200`, `-400/-800`), `thumbnail.webp` and a `meta.json` scaffold. It also adds the pack to `cards/index.json`.
3. Edit `meta.json` (no code needed):
   - layer `box: [x%, y%, w%, h%|null]`;
   - `enter` / `finale` animation;
   - `colorPalette` and `variants`;
   - `text` layout (`botanical-editorial`, `monogram-back`, or `null` when text is baked in);
   - `compat` tags.
4. Rebuild. `loadCardManifest()` registers the pack at runtime, and it appears in the Studio.

Production never references live Canva URLs; every asset is copied into the project. `arabic-botanical-01/meta.json` is the reference example (flagship; three colour variants).

### A card: HTML/SVG template

Register it in `src/cards/templates.js`. `render(m)` returns `{ design:{w,h}, palette, fonts, fontFaces, front, back, decor, layers }`. Use `cardText(m)` for localized text, so every template works in Arabic and English. Then run `npm run assets:thumbs` to regenerate thumbnails, `meta.json` and recommendations. Recommendations come from the compatibility engine, not a hand-written table.

### A scene

```js
SceneRegistry.register({
  id: 'rose_courtyard', meta: { title: 'Rose courtyard' },
  tags: ['garden', 'warm', 'romantic'], compat: { prefer: ['botanical'], avoid: ['chrome'] },
  renderMode: 'dom', backdrop: '#2a1a14',
  assets: [{ id: 'wall', type: 'image', src: { base: 'scenes/rose/wall', widths: [1000, 2000] }, preload: true }],
  setup(m)  { m.state.wall = put(m, 'background', '<div class="…"></div>'); },
  layout(m) { const f = m.stage.fit; place(m.state.wall, { x: 0, y: f.y + f.h, w: f.vw, h: f.vh }); },
  enter(m, tl) { tl.fromTo(m.state.wall, { opacity: 0 }, { opacity: 1, duration: 1.2 }, 0); },
  idle(m)   { return m.loop((dt, t) => { /* gentle motion */ }); },
});
```

- Put assets in `public/assets/scenes/<id>/`.
- Place props relative to `m.stage.fit`, never at fixed pixels.
- Use the shared `shadow()` light model (`src/scenes/helpers.js`) so the card's contact shadow matches the scene's light.

### Motion, interaction, camera, FX, finale

The pattern is the same everywhere: `XRegistry.register({ id, tags, compat, …hook })` in that layer's `index.js`.

- **Idle motion** returns a stop function from `idle(m)` and must return `null` when `m.quality.reducedMotion`.
- **Interaction** uses `inputSource(m)`, which covers mouse, touch drag and device orientation. Touch is first-class.
- **Camera presets** are pure functions of the fit box, so they work at any aspect ratio.
- **FX modules** declare `density / speed / opacity` and scale with `fx.intensity × quality.fxScale`. An FX pack is `{ id, modules: [...] }`.

### Audio

Add `public/assets/audio/<pack>/<cue>.mp3` and register `{ id, tags, cues: filePack('<pack>') }`.

- Cues: `ambient, reveal, transition, page, click, seal, finale, success, decline`.
- Components never play files directly; they call `m.audio.emit('reveal' | 'page-change' | 'seal' | 'rsvp-success' | …)`.
- A cue with no file falls back to a generated synth sound.

### A preset

Add an entry to `src/presets/index.js`. It is pure data (see the flagship). You can also build a combination in the Studio and use **Copy JSON** / **Save JSON**. The copied JSON is a valid `engine.load()` config.

### RSVP backends

```js
new ExperienceEngine(el, { rsvp: { type: 'rest', endpoint: '/api/rsvp' } })
new ExperienceEngine(el, { rsvp: { type: 'supabase', url, anonKey, table: 'rsvps' } })
```

The UI only calls `engine.submitRSVP(data)`. Adapters implement `submit(data) → { ok, id }`, so adding Firebase or anything else is one class in `src/engine/rsvp/adapters.js`.

---

## 4. Compatibility

Every module has `tags` (what it *is*) and `compat` (`prefer` +3, `avoid` −4, `require`, `exclude`). `CompatibilityEngine.score(combo)` weighs each pair of layers (card↔scene counts most) and returns:

- `score`;
- `verdict`: `great / good / weak / invalid`;
- human-readable `reasons`.

The Studio uses it to:

- badge every option (● great, ○ good, △ weak, ✕ invalid — invalid options are disabled);
- hide weak options on request;
- generate **Random compatible** combinations.

---

## 5. Studio

The **Studio** pill (top-right) opens the panel:

- preset selector and compatibility meter;
- one selector per layer: card (+ colour variant), world, reveal, idle motion, interaction, transition, camera, FX (+ intensity), audio, finale;
- mobile/desktop preview, mute, reduced motion;
- Restart, Random compatible, Copy JSON, Save JSON.

The panel minimizes back to the pill.

---

## 6. Assets

Everything is generated locally and reproducible (`npm run assets`):

| Script | Output |
|---|---|
| `tools/make-textures.py` → `tools/build-assets.mjs` | Plaster, sandstone, linen, cotton paper, gallery wall, grain → responsive WebP |
| `tools/botanicals.mjs` | Procedural olive branches, palm fronds, pampas vase, laurel ornaments, arched frames (SVG → WebP) |
| `tools/make-video.mjs` | Seamless 12 s window-light + palm-shadow loop (mp4 + webm + poster), rendered with Playwright + ffmpeg |
| `tools/make-audio.py` | Three synthesized music packs (modern romantic, Arabic oud / maqam Hijaz, cinematic luxury) × 9 cues |
| `tools/make-thumbnails.mjs` | Card thumbnails through the real engine, `meta.json`, recommendations, `cards/index.json` |
| `tools/import-canva-pack.mjs` | Canva export → card pack (see §3) |
| `tools/localize-fonts.mjs` | Downloads the Google Fonts families into `assets/fonts/`; the next build drops the CDN automatically |

Fonts: an Arabic face (Noto Sans Arabic, `Invite Arabic`) is bundled and is the last fallback in every stack, so Arabic always renders. Display families (Aref Ruqaa, Amiri, Reem Kufi, Cormorant, Bodoni Moda…) load from Google Fonts until `npm run fonts:localize` is run.

---

## 7. Performance and QA rules

- **Loading:** assets are preloaded in parallel with a timeout; the engine never waits forever for a slow file. Images are responsive (`pickPath` by CSS width × DPR). Video is lazy, has a poster, uses a lower-quality file on mobile, and pauses when the tab is hidden.
- **Quality tiers:** DPR is capped by tier (2 / 1.75 / 1.25). The mobile tier lowers FX density and WebGL render scale.
- **Cleanup:** every timeline, listener, RAF loop, video, audio node and GL context is disposed on restart or preset switch.
- **Reduced motion** (OS setting or Studio toggle) replaces movement with fades and stops idle loops, particle drift and shader animation.
- **Visual rules** (checked by `tests/e2e.mjs`):
  - the card is inside the viewport at rest;
  - the fit is computed from real bounds;
  - Arabic text is right-to-left and shapes correctly;
  - the invitation is readable in under 7 s;
  - no console errors;
  - it works at 360×740, 390×844, 1366×640, 1440×900 and 2560×1080.
- **The e2e walk** covers:
  - hero, open, every page (swipe/keys/dots), back to card, reopen;
  - RSVP validation and submission (stored by the adapter);
  - finale, thank-you, sound toggle, replay.

---

## 8. Known limits

- GSAP and Three.js adapters are implemented against their public APIs but weren't exercised with the real libraries in this environment (package registries and CDNs were blocked). The built-in timeline and the shader fallback are what ships and what's tested.
- Canva exports couldn't be downloaded from the build environment, so the flagship pack's artwork is procedurally generated. The importer is ready for real Canva layers.
- Music cues are synthesized placeholders of decent quality. Drop licensed recordings into `public/assets/audio/<pack>/` with the same cue names and no code changes are needed.
