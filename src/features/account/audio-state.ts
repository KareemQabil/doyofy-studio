import { useSyncExternalStore } from 'react';
import { audioLibrarySnapshot, parseAudioLibrary, subscribeAudioLibrary } from '../../domain/audio-library';
export function useAudioLibrary() {
  return parseAudioLibrary(useSyncExternalStore(subscribeAudioLibrary, audioLibrarySnapshot, () => null));
}
