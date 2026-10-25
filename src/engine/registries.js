import { Registry } from './Registry.js';

export const CardRegistry = new Registry('card');
export const SceneRegistry = new Registry('scene');
export const RevealRegistry = new Registry('reveal');
export const MotionRegistry = new Registry('motion');
export const InteractionRegistry = new Registry('interaction');
export const CameraRegistry = new Registry('camera');
export const FXRegistry = new Registry('fx');
export const AudioRegistry = new Registry('audio');
export const FinaleRegistry = new Registry('finale');
export const PageRegistry = new Registry('page');
export const PresetRegistry = new Registry('preset');

export const registries = {
  card: CardRegistry, scene: SceneRegistry, reveal: RevealRegistry, motion: MotionRegistry,
  interaction: InteractionRegistry, camera: CameraRegistry, fx: FXRegistry, audio: AudioRegistry,
  finale: FinaleRegistry, page: PageRegistry, preset: PresetRegistry,
};
