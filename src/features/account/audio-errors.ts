import type { AudioIssue } from '../../domain/audio-library';
import type { CopyKey } from '../../domain/copy';
const KEYS: Record<AudioIssue, CopyKey> = { type: 'audioErrType', empty: 'audioErrEmpty', size: 'audioErrSize', full: 'audioErrFull', storage: 'audioErrStorage', decode: 'audioErrDecode', voiceLong: 'audioErrVoiceLong' };
/** the dictionary key for a library error code (the words live in domain/copy.ts) */
export const audioErrorKey = (code: AudioIssue): CopyKey => KEYS[code];
