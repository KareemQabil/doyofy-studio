/**
 * Self-contained invitation links: everything a guest needs to open the invitation travels in the URL,
 *   ?i=<base64url(JSON)> with { v: 1, experience, card, scene, invitation }
 * so a link opens on any device without a backend (the RSVP on such a device is a demo — it says so).
 */
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
