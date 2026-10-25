/** Identifiers. Party codes avoid look-alike characters so they can be read aloud at a gate. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export type Rng = () => number;

export function makeId(prefix: string, rng: Rng = Math.random): string {
  let s = '';
  for (let i = 0; i < 10; i++) s += 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(rng() * 36)];
  return `${prefix}_${s}`;
}

export function makeCode(taken: ReadonlySet<string>, rng: Rng = Math.random, length = 5): string {
  for (let attempt = 0; attempt < 1000; attempt++) {
    let s = '';
    for (let i = 0; i < length; i++) s += ALPHABET[Math.floor(rng() * ALPHABET.length)];
    if (!taken.has(s)) return s;
  }
  return makeCode(taken, rng, length + 1);
}

export function normaliseCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
}

/** a slug from latin names when available, otherwise a short code. Always unique in `taken`. */
export function makeSlug(parts: Array<string | undefined>, taken: ReadonlySet<string>, rng: Rng = Math.random): string {
  const latin = parts
    .map((p) => (p || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
    .filter(Boolean)
    .join('-')
    .slice(0, 32);
  let base = latin || `e-${makeCode(new Set(), rng, 6).toLowerCase()}`;
  if (!taken.has(base)) return base;
  for (let n = 2; n < 500; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
  base = `${base}-${makeCode(new Set(), rng, 4).toLowerCase()}`;
  return base;
}

/** deterministic PRNG for seed data (mulberry32) */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
