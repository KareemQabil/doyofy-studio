/**
 * Audio packs. A pack is data: cue → file (+ volume). Missing cues fall back to synth.
 * Files live in assets/audio/<pack>/<cue>.mp3 (see tools/make-audio.py).
 */
import { AudioRegistry } from '../engine/registries.js';
import { claySynth } from './synth.js';

const CUES = ['ambient', 'reveal', 'transition', 'page', 'click', 'seal', 'finale', 'success', 'decline'];
const filePack = (id, vol = {}) => Object.fromEntries(CUES.map((c) => [c, { src: `audio/${id}/${c}.mp3`, volume: vol[c] ?? (c === 'ambient' ? 0.75 : 0.9) }]));

AudioRegistry.registerMany([
  {
    id: 'modern_romantic', meta: { title: 'Modern romantic', description: 'Warm pads, sparse piano, bells.' },
    tags: ['romantic', 'modern', 'soft', 'light', 'editorial', 'calm'],
    cues: filePack('modern_romantic', { click: 0.6, page: 0.7 }),
  },
  {
    id: 'arabic_oud', meta: { title: 'Arabic oud', description: 'Maqam Hijaz oud phrases over a low drone.' },
    tags: ['arabic', 'warm', 'classic', 'desert', 'luxury', 'romantic'],
    cues: filePack('arabic_oud'),
  },
  {
    id: 'cinematic_luxury', meta: { title: 'Cinematic luxury', description: 'Low strings, deep swells, a resolving chord.' },
    tags: ['cinematic', 'luxury', 'night', 'dramatic', 'moody'],
    cues: filePack('cinematic_luxury', { ambient: 0.7 }),
  },
  {
    id: 'playful_clay', meta: { title: 'Playful clay', description: 'Bouncy generated sounds (no files).' },
    tags: ['playful', 'pastel', 'festive', 'clay'],
    cues: {}, synth: claySynth,
  },
  { id: 'silent', meta: { title: 'Silent', description: 'No sound.' }, tags: ['minimal'], silent: true, cues: {} },
]);
