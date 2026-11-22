// Types for the existing JS Invitation Studio (see Studio.js). Only what the platform uses.
export interface StudioRsvpAdapter { submit(r: { name: string; attending: boolean; guests: number }): Promise<{ ok: boolean; id?: string; error?: string; demo?: boolean; notice?: boolean }> }
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
  /** an extra button on the thank-you screen; with autoAfter (ms) the screen moves on by itself */
  doneAction?: { ar: string; en?: string; onClick: () => void; autoAfter?: number } | null;
  /** organizer-only hints on controls (never on guest pages) */
  authorNotes?: boolean;
  /** the organizer's voice carried with a guest link: the engine's own words follow it, not this device's preference */
  voice?: 'ar' | 'ar-EG' | 'ar-SA' | null;
}
export declare class Studio {
  constructor(host: HTMLElement, opts: StudioOptions);
  sm: { state: string };
  debug: { sceneRenderer: string | null; sceneErrors: unknown[]; states: Array<[string, number]> };
  setCard(id: string): void;
  setScene(id: string): void;
  setContent(invitation: unknown): void;
  replay(): void;
  /** fast-forward the intro to the card at rest; false when the intro is not playing */
  skipIntro(): boolean;
  openCard(): void;
  destroy(): void;
}
