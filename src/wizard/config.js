/**
 * Invitation config = everything a guest link needs:
 *   { v: 1, experience: { dimension: '3d'|'2d', motion: 'animated'|'static' }, card, scene, invitation }
 * Encoded into the URL as ?i=<base64url(JSON)> so a guest link is self-contained (no backend needed to view).
 */
import { sampleInvitation } from '../data/invitation.js';

export const DEFAULT_CONFIG = {
  v: 1,
  experience: { dimension: '3d', motion: 'animated' },
  card: 'wine',
  scene: 'candlelit',
  invitation: sampleInvitation,
};

const toB64Url = (str) => btoa(String.fromCharCode(...new TextEncoder().encode(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64Url = (b) => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/-/g, '+').replace(/_/g, '/')), (ch) => ch.charCodeAt(0)));

export function encodeConfig(cfg) { return toB64Url(JSON.stringify({ ...cfg, v: 1 })); }

export function decodeConfig(s) {
  try {
    const c = JSON.parse(fromB64Url(s));
    if (!c || c.v !== 1 || !c.invitation?.couple) return null;
    return c;
  } catch { return null; }
}

export function guestLink(cfg, base = location.href.split('?')[0].split('#')[0]) {
  return `${base}?view=invite&i=${encodeConfig(cfg)}`;
}

/** time zones offered in the details step (value = IANA id) */
export const TIME_ZONES = [
  ['Africa/Cairo', 'القاهرة', 'Cairo'],
  ['Asia/Riyadh', 'الرياض', 'Riyadh'],
  ['Asia/Dubai', 'دبي', 'Dubai'],
  ['Asia/Kuwait', 'الكويت', 'Kuwait'],
  ['Asia/Qatar', 'الدوحة', 'Doha'],
  ['Asia/Bahrain', 'المنامة', 'Manama'],
  ['Asia/Muscat', 'مسقط', 'Muscat'],
  ['Asia/Amman', 'عمّان', 'Amman'],
  ['Asia/Beirut', 'بيروت', 'Beirut'],
  ['Asia/Baghdad', 'بغداد', 'Baghdad'],
  ['Africa/Casablanca', 'الدار البيضاء', 'Casablanca'],
  ['Africa/Tunis', 'تونس', 'Tunis'],
  ['Europe/London', 'لندن', 'London'],
];

/** UTC offset string (+03:00) of a time zone at a given local wall-clock date/time */
export function offsetFor(timeZone, dateStr, timeStr) {
  const guess = new Date(`${dateStr}T${timeStr}:00Z`);
  const f = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' });
  const name = f.formatToParts(guess).find((p) => p.type === 'timeZoneName')?.value || 'GMT';
  const m = name.match(/GMT([+-]\d{2}):?(\d{2})?/);
  return m ? `${m[1]}:${m[2] || '00'}` : '+00:00';
}

/** split an ISO start with offset back into date / time fields for the form */
export function splitStart(iso) {
  const m = String(iso).match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return m ? { date: m[1], time: m[2] } : { date: '', time: '19:00' };
}
