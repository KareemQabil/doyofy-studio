/**
 * RSVPAdapter interface — the UI only ever calls `submit(response)`.
 *
 *   interface RSVPAdapter {
 *     id: string
 *     submit(response: { name, attending: boolean, guests, phone?, notes?, invitationId }) : Promise<{ ok: boolean, id?: string, error?: string }>
 *     list?(): Promise<Response[]>
 *   }
 *
 * The demo uses LocalRSVPAdapter. Swap in REST or Supabase via config.rsvp.adapter without
 * touching any UI code.
 */

export class LocalRSVPAdapter {
  constructor({ key = 'invite-engine:rsvp', latency = 650 } = {}) { this.id = 'local'; this.key = key; this.latency = latency; this.memory = []; }
  _read() { try { return JSON.parse(localStorage.getItem(this.key) || '[]'); } catch { return this.memory; } }
  _write(list) { try { localStorage.setItem(this.key, JSON.stringify(list)); } catch { this.memory = list; } }
  async submit(response) {
    await new Promise((r) => setTimeout(r, this.latency));
    const entry = { ...response, id: `rsvp_${Date.now().toString(36)}`, at: new Date().toISOString() };
    const list = this._read(); list.push(entry); this._write(list);
    return { ok: true, id: entry.id };
  }
  async list() { return this._read(); }
}

export class RestRSVPAdapter {
  constructor({ endpoint, headers = {} }) { this.id = 'rest'; this.endpoint = endpoint; this.headers = headers; }
  async submit(response) {
    try {
      const r = await fetch(this.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', ...this.headers }, body: JSON.stringify(response) });
      if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
      const data = await r.json().catch(() => ({}));
      return { ok: true, id: data.id };
    } catch (e) { return { ok: false, error: e.message }; }
  }
}

/** Talks to Supabase's REST (PostgREST) endpoint directly — no client library required. */
export class SupabaseRSVPAdapter {
  constructor({ url, anonKey, table = 'rsvps' }) { this.id = 'supabase'; this.url = url; this.key = anonKey; this.table = table; }
  async submit(response) {
    try {
      const r = await fetch(`${this.url}/rest/v1/${this.table}`, {
        method: 'POST',
        headers: { apikey: this.key, Authorization: `Bearer ${this.key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify({ name: response.name, attending: response.attending, guests: response.guests, phone: response.phone || null, notes: response.notes || null, invitation_id: response.invitationId }),
      });
      if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
      const [row] = await r.json();
      return { ok: true, id: row?.id };
    } catch (e) { return { ok: false, error: e.message }; }
  }
}

export function createRSVPAdapter(cfg = {}) {
  switch (cfg.type) {
    case 'rest': return new RestRSVPAdapter(cfg);
    case 'supabase': return new SupabaseRSVPAdapter(cfg);
    default: return new LocalRSVPAdapter(cfg);
  }
}
