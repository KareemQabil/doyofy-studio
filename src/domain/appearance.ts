/** Organizer appearance: light · dark · follow the device. Pure values, no DOM. */
export type Appearance = 'light' | 'dark' | 'system';
export const APPEARANCE_LABEL: Record<Appearance, string> = { light: 'فاتح', dark: 'داكن', system: 'حسب الجهاز' };
export const isAppearance = (v: unknown): v is Appearance => v === 'light' || v === 'dark' || v === 'system';
