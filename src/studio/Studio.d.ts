// Types for the existing JS Invitation Studio (see Studio.js). Only what the platform uses.
export interface StudioRsvpAdapter { submit(r: { name: string; attending: boolean; guests: number }): Promise<{ ok: boolean; id?: string; error?: string }> }
export interface StudioGuest {
  /** shown instead of the name field when the party is known from the link */
  name?: string;
  nameLocked?: boolean;
  maxGuests?: number;
  attending?: 'yes' | 'no' | null;
  guests?: number;
}
export interface StudioOptions {
  invitation: unknown;
  card?: string;
  scene?: string;
  start?: 'intro' | 'card' | 'pages' | 'rsvp' | 'done';
  assetBase?: string;
  rsvp?: StudioRsvpAdapter;
  experience?: { dimension: '3d' | '2d'; motion: 'animated' | 'static' } | null;
  embedded?: boolean;
  showSwitcher?: boolean;
  muted?: boolean;
  params?: URLSearchParams;
  guest?: StudioGuest | null;
  /** an extra button on the thank-you screen */
  doneAction?: { ar: string; en?: string; onClick: () => void } | null;
}
export declare class Studio {
  constructor(host: HTMLElement, opts: StudioOptions);
  sm: { state: string };
  debug: { sceneRenderer: string | null; sceneErrors: unknown[]; states: Array<[string, number]> };
  setCard(id: string): void;
  setScene(id: string): void;
  setContent(invitation: unknown): void;
  replay(): void;
  destroy(): void;
}
