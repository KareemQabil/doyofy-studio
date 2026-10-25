import { Registry } from './Registry.js';

// One registry per layer. Modules register themselves from their own folders (see src/*/index.js).
export const CardRegistry = new Registry('card');
export const SceneRegistry = new Registry('scene');
export const RevealRegistry = new Registry('reveal');
export const MotionRegistry = new Registry('motion');            // idle motion
export const InteractionRegistry = new Registry('interaction');
export const TransitionRegistry = new Registry('transition');    // page transitions
export const CameraRegistry = new Registry('camera');
export const FXRegistry = new Registry('fx');                    // composable fx modules
export const FXPackRegistry = new Registry('fxpack');            // named fx compositions
export const AudioRegistry = new Registry('audio');
export const FinaleRegistry = new Registry('finale');
export const PageRegistry = new Registry('page');                // storytelling pages
export const PresetRegistry = new Registry('preset');

export const registries = {
  card: CardRegistry, scene: SceneRegistry, reveal: RevealRegistry, motion: MotionRegistry,
  interaction: InteractionRegistry, transition: TransitionRegistry, camera: CameraRegistry,
  fx: FXRegistry, fxpack: FXPackRegistry, audio: AudioRegistry, finale: FinaleRegistry,
  page: PageRegistry, preset: PresetRegistry,
};
