#!/usr/bin/env node
// npm run assets:index — records in asset-index.json which source files reference each P0 asset
// (usedBy), and lists derived variants. Run after changing which assets the scenes/audio use.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';

const idxPath = path.join(ROOT, 'asset-index.json');
const index = JSON.parse(fs.readFileSync(idxPath, 'utf8'));
const refs = new Map(); // asset path → [src files]
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
  const p = path.join(d, e.name);
  if (e.isDirectory()) return walk(p);
  for (const m of fs.readFileSync(p, 'utf8').matchAll(/['"`]((?:p0|p0-derived)\/[A-Za-z0-9_\-./]+\.[a-z0-9]+)['"`]/g)) {
    const rel = path.relative(ROOT, p).replace(/\\/g, '/');
    refs.set(m[1], [...new Set([...(refs.get(m[1]) || []), rel])]);
  }
});
walk(path.join(ROOT, 'src'));
const derived = fs.existsSync(path.join(ROOT, 'public/assets/p0-derived/derived-index.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'public/assets/p0-derived/derived-index.json'), 'utf8')).derived : [];
let used = 0;
for (const a of index.assets) {
  const files = a.files.map((f) => f.path.replace('public/assets/', ''));
  const direct = files.flatMap((f) => refs.get(f) || []);
  const viaDerived = derived.filter((d) => files.includes(d.source.replace('public/assets/', ''))).flatMap((d) => (refs.get(d.output.replace('public/assets/', '')) || []).map((r) => `${r} (via ${d.output.split('/').pop()})`));
  a.usedBy = [...new Set([...direct, ...viaDerived])];
  a.derived = derived.filter((d) => files.includes(d.source.replace('public/assets/', ''))).map((d) => d.output);
  if (a.usedBy.length) used++;
}
index.usedInProduction = used;
fs.writeFileSync(idxPath, JSON.stringify(index, null, 2));
console.log(`[assets:index] ${used}/${index.assets.length} logical P0 assets used by production source`);
for (const a of index.assets.filter((x) => x.usedBy.length)) console.log(`  ${a.kind.padEnd(6)} ${a.id.padEnd(30)} ← ${a.usedBy.join(', ')}`);
