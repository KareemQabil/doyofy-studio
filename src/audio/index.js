/**
 * Audio packs. Event → cue layers. `file` = localized P0 asset (public/assets/…), `synth` = canonical
 * Web Audio voice used when the file fails — or as the cue itself when no recorded asset exists.
 */
import { AudioRegistry } from '../engine/registries.js';


AudioRegistry.register({
  id: 'studio',
  name: 'Studio (P0 Mixkit cues + canonical music)',
  tags: ['canonical', 'paper', 'chime'],
  
  music: 'canonical-bells',
  cues: {
    open: [{ file: 'p0/audio/sfx_cinematic_whoosh.mp3', gain: 0.32, synth: 'open' }, { file: 'p0/audio/sfx_relaxing_chime.mp3', gain: 0.42, at: 0.45 }],
    page: { file: 'p0/audio/sfx_page_turn_single.mp3', gain: 0.5, synth: 'page' },
    click: { file: 'p0/audio/sfx_interface_click.mp3', gain: 0.3, synth: 'click' },
    choose: { file: 'p0/audio/sfx_select_click.mp3', gain: 0.35, synth: 'click' },
    pack: { file: 'p0/audio/sfx_paper_slide.mp3', gain: 0.55, synth: 'pack' },
    // No wax-stamp recording exists in the P0 packs: the canonical synthesized thump IS the seal cue.
    seal: { synth: 'thump' },
    fly: { file: 'p0/audio/sfx_fast_whoosh.mp3', gain: 0.42, synth: 'fly' },
    done: { file: 'p0/audio/sfx_crystal_chime.mp3', gain: 0.45, synth: 'done' },
  },
});

/** optional per-scene ambience (looped quietly under the card and pages) */
export const SCENE_AMBIENCE = {
  marble: { file: 'p0/audio/sfx_morning_birds.mp3', gain: 0.07 },
};
