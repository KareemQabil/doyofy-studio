/**
 * Compatibility scoring — tag affinity + explicit constraints, never a static table.
 *
 * Each module has `tags` (what it is) and `compat` (what it wants next to it):
 *   prefer:  +3 per matching tag on the partner
 *   avoid:   −4 per matching tag on the partner
 *   require: partner must carry at least one of these tags (else invalid)
 *   exclude: partner must carry none of these tags (else invalid)
 * Plus shared "mood" tags between partners add +1 each.
 *
 * score(combo) → { score 0–100, verdict: 'great'|'good'|'weak'|'invalid', reasons[] }
 * rank(slot, combo) → candidates for one slot sorted by fit with the rest of the combo.
 */
const PAIRS = [
  ['card', 'scene', 1.6], ['card', 'audio', 1], ['scene', 'audio', 1.1], ['scene', 'fx', 1.3], ['card', 'reveal', 0.9],
  ['scene', 'reveal', 0.9], ['card', 'finale', 0.8], ['scene', 'camera', 0.7], ['reveal', 'motion', 0.6], ['card', 'transition', 0.6],
  ['scene', 'motion', 0.5], ['interaction', 'motion', 0.5], ['card', 'interaction', 0.4],
];

export class CompatibilityEngine {
  constructor(registries) { this.reg = registries; }

  resolve(combo) {
    const r = this.reg;
    const get = (reg, id) => (id && reg.has(id) ? reg.get(id) : null);
    return {
      card: get(r.card, combo.card), scene: get(r.scene, combo.scene), reveal: get(r.reveal, combo.reveal),
      motion: get(r.motion, combo.motion), interaction: get(r.interaction, combo.interaction), transition: get(r.transition, combo.transition),
      camera: get(r.camera, combo.camera), fx: get(r.fxpack, combo.fx), audio: get(r.audio, combo.audio), finale: get(r.finale, combo.finale),
    };
  }

  pair(a, b) {
    if (!a || !b) return { s: 0, invalid: null, notes: [] };
    let s = 0; const notes = []; let invalid = null;
    const dir = (x, y) => {
      const yt = new Set(y.tags);
      for (const t of x.compat.prefer) if (yt.has(t)) s += 3;
      for (const t of x.compat.avoid) if (yt.has(t)) { s -= 4; notes.push(`${x.meta.title} avoids "${t}" (${y.meta.title})`); }
      if (x.compat.require.length && !x.compat.require.some((t) => yt.has(t))) invalid = `${x.meta.title} needs ${x.compat.require.join(' / ')}`;
      for (const t of x.compat.exclude) if (yt.has(t)) invalid = `${x.meta.title} can’t be used with ${y.meta.title} (${t})`;
    };
    dir(a, b); dir(b, a);
    const shared = a.tags.filter((t) => b.tags.includes(t) && !['dom', 'svg', 'canvas'].includes(t)).length;
    s += Math.min(4, shared);
    return { s, invalid, notes };
  }

  score(combo, { quality } = {}) {
    const mods = this.resolve(combo);
    let total = 0, weight = 0; const reasons = []; let invalid = null;
    for (const [a, b, w] of PAIRS) {
      if (!mods[a] || !mods[b]) continue;
      const p = this.pair(mods[a], mods[b]);
      total += p.s * w; weight += w * 6;
      reasons.push(...p.notes);
      if (p.invalid) invalid = p.invalid;
    }
    if (quality?.level === 'low' && mods.scene && ['webgl', 'three'].includes(mods.scene.renderMode)) reasons.push('WebGL scene on a low-power device');
    const score = Math.round(Math.max(0, Math.min(100, 50 + (weight ? (total / weight) * 50 : 0))));
    const verdict = invalid ? 'invalid' : score >= 72 ? 'great' : score >= 56 ? 'good' : 'weak';
    if (invalid) reasons.unshift(invalid);
    return { score: invalid ? 0 : score, verdict, reasons: [...new Set(reasons)].slice(0, 4) };
  }

  /** Rank all options for one slot against the rest of the current combo. */
  rank(slot, combo) {
    const regKey = slot === 'fx' ? 'fxpack' : slot;
    return this.reg[regKey].list().map((mod) => ({ id: mod.id, mod, ...this.score({ ...combo, [slot]: mod.id }) }))
      .sort((a, b) => b.score - a.score);
  }

  /** Build a random but coherent combination: pick an anchor card, then best-fitting partners with some randomness. */
  randomCompatible(seedCombo = {}, rnd = Math.random) {
    const slots = ['scene', 'reveal', 'motion', 'interaction', 'transition', 'camera', 'fx', 'audio', 'finale'];
    const cards = this.reg.card.list();
    const combo = { ...seedCombo, card: cards[Math.floor(rnd() * cards.length)].id };
    for (const slot of slots) {
      const ranked = this.rank(slot, combo).filter((c) => c.verdict !== 'invalid');
      const top = ranked.slice(0, Math.max(1, Math.ceil(ranked.length / 3)));
      combo[slot] = top[Math.floor(rnd() * top.length)].id;
    }
    return combo;
  }
}
