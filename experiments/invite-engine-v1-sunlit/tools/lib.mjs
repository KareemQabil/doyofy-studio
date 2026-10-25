// Shared helpers for build + asset tools.
// Resolves dev dependencies from the project first, then from known global locations,
// so the tools run both in a normal `npm install` checkout and in locked-down sandboxes.
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const FALLBACKS = {
  esbuild: ['/home/claude/.npm-global/lib/node_modules/tsx/node_modules/esbuild'],
  sharp: ['/home/claude/.npm-global/lib/node_modules/sharp'],
  playwright: ['/home/claude/.npm-global/lib/node_modules/playwright'],
};

export function need(name) {
  try { return require(require.resolve(name, { paths: [ROOT] })); } catch (e) { /* try fallbacks */ }
  for (const p of FALLBACKS[name] || []) {
    if (fs.existsSync(p)) return require(p);
  }
  throw new Error(`Missing dependency "${name}". Run \`npm install\` in ${ROOT}.`);
}

export function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); return p; }
export const pub = (...p) => path.join(ROOT, 'public', 'assets', ...p);

export function chromiumPath() {
  const guess = '/opt/pw-browsers/chromium';
  return fs.existsSync(guess) ? guess : undefined;
}

export function copyDir(src, dst) {
  ensureDir(dst);
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const a = path.join(src, e.name), b = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(a, b); else fs.copyFileSync(a, b);
  }
}
