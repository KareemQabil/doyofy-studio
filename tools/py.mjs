#!/usr/bin/env node
// Cross-platform Python launcher for npm scripts: tries python3, python, then py (Windows launcher).
//   node tools/py.mjs tools/install_p0_packs.py <args…>
import { spawnSync } from 'node:child_process';
const args = process.argv.slice(2);
for (const exe of ['python3', 'python', 'py']) {
  const r = spawnSync(exe, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.error?.code === 'ENOENT' || (process.platform === 'win32' && r.status === 9009)) continue;
  process.exit(r.status ?? 1);
}
console.error('Python 3 not found. Install it from https://www.python.org/ (stdlib only is enough for the P0 installer).');
process.exit(1);
