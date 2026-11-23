// Types for the invitation engine's bilingual strings (see strings.js). Only what the platform and tests use.
import type { Dialect } from '../domain/copy';
type Pair = { ar: string; en: string };
export interface EngineStrings {
  accept: Pair; decline: Pair; sealSend: Pair; tapToOpen: Pair; watchAgain: Pair; need: Pair;
  thanks: { yes: Pair; no: Pair };
  sound: string; guestsHint: string; namePlaceholder: string; pageLabels: string[];
  [key: string]: unknown;
}
export declare const STRINGS: EngineStrings;
export declare const LIVE_STRINGS: EngineStrings;
export declare function setStringsVoice(dialect: Dialect | null | undefined): void;
export declare function currentStrings(dialect?: Dialect): EngineStrings;
