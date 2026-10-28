/**
 * RSVP adapters — the UI only calls adapter.submit(response) and never knows the backend.
 *   response: { name, attending: boolean, guests, invitationId? }
 *   → Promise<{ ok, id?, error? }>
 * LocalRSVPAdapter is the demo default; RestRSVPAdapter/SupabaseRSVPAdapter show the contract.
 */
export class LocalRSVPAdapter {
  constructor(key = 'invitation-studio:rsvp') { this.key = key; this.memory = []; }
  _read() { try { return JSON.parse(localStorage.getItem(this.key) || '[]'); } catch { return this.memory; } }
  _write(list) { try { localStorage.setItem(this.key, JSON.stringify(list)); } catch { this.memory = list; } }
  async submit(response) {
    const rec = { ...response, id: 'r' + Date.now().toString(36), at: new Date().toISOString() };
    this._write([...this._read(), rec]);
    return { ok: true, id: rec.id };
  }
  list() { return this._read(); }
}

/** self-contained links (no backend on this device): the reply is not sent anywhere, and the guest is told so */
export class DemoRSVPAdapter {
  async submit() { return { ok: true, id: 'demo-' + Date.now().toString(36), demo: true }; }
}

export class RestRSVPAdapter {
  constructor({ endpoint, headers = {} }) { this.endpoint = endpoint; this.headers = headers; }
  async submit(response) {
    const r = await fetch(this.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', ...this.headers }, body: JSON.stringify(response) });
    return r.ok ? { ok: true, ...(await r.json().catch(() => ({}))) } : { ok: false, error: `HTTP ${r.status}` };
  }
}

export class SupabaseRSVPAdapter {
  constructor({ url, anonKey, table = 'rsvps' }) { this.url = url; this.key = anonKey; this.table = table; }
  async submit(response) {
    const r = await fetch(`${this.url}/rest/v1/${this.table}`, {
      method: 'POST',
      headers: { apikey: this.key, Authorization: `Bearer ${this.key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(response),
    });
    return r.ok ? { ok: true } : { ok: false, error: `HTTP ${r.status}` };
  }
}
