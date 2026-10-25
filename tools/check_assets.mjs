#!/usr/bin/env node
// npm run assets:check
// Verifies the installed P0 packs against asset-index.json (existence, size, sha256), counts logical
// assets per kind against the P0 expectation, and checks that every asset path referenced by the
// production source (src/**) exists on disk. Prints READY only when nothing required is missing.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT } from './lib.mjs';

const idxPath = path.join(ROOT, 'asset-index.json');
if (!fs.existsSync(idxPath)) {
  console.log('asset-index.json missing — run: npm run assets:p0:install -- <pack zips>');
  process.exit(1);
}
const index = JSON.parse(fs.readFileSync(idxPath, 'utf8'));
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const bad = [];
let present = 0;
const byKind = {};
for (const a of index.assets) {
  let ok = true;
  for (const f of a.files) {
    const p = path.join(ROOT, f.path);
    if (!fs.existsSync(p)) { bad.push(`missing   ${f.path}`); ok = false; continue; }
    if (fs.statSync(p).size !== f.bytes) { bad.push(`size      ${f.path}`); ok = false; continue; }
    if (process.argv.includes('--fast')) continue;
    if (sha(p) !== f.sha256) { bad.push(`sha256    ${f.path}`); ok = false; }
  }
  if (ok) { present++; byKind[a.kind] = (byKind[a.kind] || 0) + 1; }
}

// every "p0/…", "audio/…", etc. literal referenced from src must exist under public/assets
const refs = new Set();
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
  const p = path.join(d, e.name);
  if (e.isDirectory()) return walk(p);
  if (!/\.(js|css|json)$/.test(e.name)) return;
  for (const m of fs.readFileSync(p, 'utf8').matchAll(/['"`]((?:p0|p0-derived)\/[A-Za-z0-9_\-./]+\.(?:glb|exr|hdr|jpg|png|webp|mp4|webm|mp3|json))['"`]/g)) refs.add(m[1]);
});
walk(path.join(ROOT, 'src'));
const missingRefs = [...refs].filter((r) => !fs.existsSync(path.join(ROOT, 'public', 'assets', r)));

const expected = index.expectedLogicalAssets;
console.log(`present: ${present}/${expected}`);
for (const [k, n] of Object.entries(index.expectedByKind)) console.log(`  ${k.padEnd(7)} ${String(byKind[k] || 0).padStart(2)}/${n}`);
console.log(`referenced by src: ${refs.size} files, missing ${missingRefs.length}`);
missingRefs.forEach((r) => console.log('  missing ref', r));
bad.forEach((b) => console.log('  ' + b));
const requiredMissing = expected - present + missingRefs.length;
console.log(`required missing: ${requiredMissing}`);
console.log(requiredMissing === 0 && bad.length === 0 ? 'READY' : 'NOT READY');
process.exit(requiredMissing === 0 && bad.length === 0 ? 0 : 1);
