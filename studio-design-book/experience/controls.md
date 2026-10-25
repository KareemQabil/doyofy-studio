# Controls, switcher and sound (all stages)

**Markup:** `src/studio/markup.js:117-126`. **Switcher:** `src/studio/switcher.js`. **Audio:** `src/engine/AudioEngine.js`, `src/audio/index.js`. **Quality and experience:** `src/engine/Quality.js`, `Studio.js:49-58`.

## Top controls (`.st-ctrls`, z 24, top/left/right 14 px, LTR)

| Control | Shown | Behaviour |
|---|---|---|
| Palette (switcher) | only when `showSwitcher`: the legacy `/?view=invite` default, or `&author` with `i=` (`src/main.js:25`); off for guests and inside the wizard (`Wizard.js:528, 537`) | toggles the card/scene bottom sheet; `aria-expanded` |
| Replay | always | tears down timers and listeners, hides the stage for 40 ms, re-inserts the stage subtree so every CSS animation restarts, then runs from `intro` (`Studio.replay`, :542-565) |
| Sound | always | toggles master gain (0.05 s ramp); `aria-pressed`; icon swaps; label "Mute music" / "Play music" |

The controls appear at 4.6 s (or 0 s with no intro). They are 44 px circles (`.st-icon`, `#F3D9A0` on `rgba(15,8,9,.5)` with backdrop blur).

## Switcher (author tool)

- A bottom sheet (`.st-switch`, z 30) with two horizontally scrolling chip rows: **CARD DESIGN** (16 chips, swatch plus English name) and **3D SCENE** (10 chips).
- A ✦ marks a recommended pairing (`compatScore ≥ 2`). Nothing is hidden.
- `?author` adds a debug line with the active renderer and any fallbacks.
- Picking a card re-renders card surfaces only; picking a scene remounts the scene renderer only.
- Escape closes it, as does the X button.
- Sound: `choose` on a pick, `click` on open and close.
- **Gaps:**
  - Labels are English only ("CARD DESIGN", "3D SCENE"), although 9 of 10 scenes are 2D only.
  - Chips show English names, not `CARD_NAMES` / `SCENE_NAMES`.

## Sound system

- **Unlock:** nothing is audible before the first `pointerdown` or `keydown` on the host (`Studio.js:445-448`).
- **Default:** enabled (`AudioEngine.enabled = true`), except muted at start in the wizard preview (`muted: true`).
- **Cues** (Mixkit MP3 under `public/assets/p0/audio/`; synth fallback on failure):

| Event | File (gain) | Synth fallback |
|---|---|---|
| `open` | `sfx_cinematic_whoosh.mp3` (0.32) + `sfx_relaxing_chime.mp3` (0.42, +0.45 s) | `open` |
| `page` | `sfx_page_turn_single.mp3` (0.5) | `page` |
| `click` | `sfx_interface_click.mp3` (0.3) | `click` |
| `choose` | `sfx_select_click.mp3` (0.35) | `click` |
| `pack` | `sfx_paper_slide.mp3` (0.55) | `pack` |
| `seal` | — | `thump` (always synth) |
| `fly` | `sfx_fast_whoosh.mp3` (0.42) | `fly` |
| `done` | `sfx_crystal_chime.mp3` (0.45) | `done` |

- **Music:** synthesised bells, only while `pages` is open.
- **Ambience:** only `marble` (`sfx_morning_birds.mp3`, 0.07, looped, 1.2 s fade-in, ducked to 30 % in the finale).

## Quality tiers and experiences

| Input | Effect |
|---|---|
| `detectQuality` (`Quality.js:273-290`) | `high` by default; `balanced` if coarse pointer, small screen or ≤ 4 GB; `low` if save-data, ≤ 2 GB or ≤ 2 cores; `?quality=` forces a tier |
| WebGL check | `?renderer=dom` disables WebGL |
| `experience.dimension = '2d'` | `renderer = 'dom'` |
| `experience.motion = 'static'` | reduced motion, plus a frozen WebGL frame |
| OS `prefers-reduced-motion` or `?motion=reduced` | the same as static (`?motion=full` overrides the OS setting) |
| Host data attributes | `data-experience`, `data-tier`, `data-renderer`, `data-scene`, `data-card`, `data-state`, `data-loading` (useful for QA) |

## Accessibility summary

Every interactive element has a 44 px target and a visible focus ring (`#E3C58C` / `#F3D9A0`). Keyboard: Tab, Enter and Space on the card; arrows, Page keys and Escape on the sheet. **Gap:** almost all aria-labels are English only ("Open the invitation", "Replay from the beginning", "Previous page", "Go to Date", …) in an Arabic-first, `dir="rtl"` product. Arabic spans in canonical faces have no `lang="ar"`.

## Known gaps

- No skip-intro or skip-finale control.
- No captions or transcript for audio. That is acceptable because the audio is not informational.
- The switcher is not available to organisers in the platform editor; there, card and scene are chosen in the wizard steps and the template gallery.
