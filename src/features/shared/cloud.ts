/**
 * The backend's state for organizer screens (short links, the audio honesty line); re-renders when it changes.
 * Outside a ServicesProvider (a component rendered on its own) the backend counts as off.
 */
import { useSyncExternalStore } from 'react';
import { useOptionalServices } from '../../app/data';
import type { CloudService } from '../../services/contracts';
import { CLOUD_OFF } from '../../services/cloud/state';

export function useCloud(): CloudService {
  const cloud = useOptionalServices()?.cloud ?? CLOUD_OFF;
  useSyncExternalStore(cloud.subscribe, cloud.version, cloud.version);
  return cloud;
}
