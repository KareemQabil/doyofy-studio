import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { audioLibrarySnapshot, loadAudioTrackBlob, migrateLegacyAudioLibrary, parseAudioLibrary, subscribeAudioLibrary } from '../../domain/audio-library';

/** The account's sound library (metadata). Mounting it also moves any v1 inline tracks into the AudioStore, once. */
export function useAudioLibrary() {
  const raw = useSyncExternalStore(subscribeAudioLibrary, audioLibrarySnapshot, () => null);
  useEffect(() => { void migrateLegacyAudioLibrary(); }, []);
  return useMemo(() => parseAudioLibrary(raw), [raw]);
}

/** An object URL for a track's bytes on this device: '' while loading, null when they are not here. */
export function useTrackUrl(id: string | undefined): string | null {
  const [url, setUrl] = useState<string | null>('');
  useEffect(() => {
    if (!id) { setUrl(null); return; }
    let alive = true, made = '';
    setUrl('');
    void loadAudioTrackBlob(id).then(blob => {
      if (!alive) return;
      if (blob) { made = URL.createObjectURL(blob); setUrl(made); } else setUrl(null);
    });
    return () => { alive = false; if (made) URL.revokeObjectURL(made); };
  }, [id]);
  return url;
}
