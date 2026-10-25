// Writes INTEGRITY_MANIFEST.json (sha256 + bytes for every delivered file) and verifies an extracted copy.
//   node tools/integrity-manifest.mjs            → write manifest for this tree
//   node tools/integrity-manifest.mjs verify DIR → verify DIR against its manifest
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const SKIP = new Set(['node_modules', '.git', 'INTEGRITY_MANIFEST.json']);
const walk = (root, rel = '') => fs.readdirSync(path.join(root, rel), { withFileTypes: true }).flatMap((d) => SKIP.has(d.name) ? [] : d.isDirectory() ? walk(root, path.join(rel, d.name)) : [path.join(rel, d.name)]);
const hash = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const [mode, dir] = process.argv.slice(2);
if (mode === 'verify') {
  const m = JSON.parse(fs.readFileSync(path.join(dir, 'INTEGRITY_MANIFEST.json'), 'utf8'));
  const bad = Object.entries(m.files).filter(([f, v]) => !fs.existsSync(path.join(dir, f)) || hash(path.join(dir, f)) !== v.sha256);
  console.log(bad.length ? `MISMATCH ${bad.length}:\n${bad.slice(0, 20).map(([f]) => f).join('\n')}` : `verified ${Object.keys(m.files).length} files`);
  process.exit(bad.length ? 1 : 0);
}
const root = process.cwd();
const files = Object.fromEntries(walk(root).sort().map((f) => [f, { bytes: fs.statSync(f).size, sha256: hash(f) }]));
fs.writeFileSync('INTEGRITY_MANIFEST.json', JSON.stringify({ generated: new Date().toISOString(), count: Object.keys(files).length, files }, null, 1));
console.log('manifest', Object.keys(files).length, 'files');
