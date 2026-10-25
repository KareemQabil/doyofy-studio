// node tests/unit.mjs — domain + service-layer unit tests (TypeScript, bundled with esbuild, run with node:test)
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { need, ROOT } from '../tools/lib.mjs';
const esbuild = need('esbuild');
const dir = path.join(ROOT, 'tests', 'unit');
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'doyofy-unit-'));
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.test.ts'));
await esbuild.build({ entryPoints: files.map((f) => path.join(dir, f)), outdir: out, bundle: true, platform: 'node', format: 'esm', outExtension: { '.js': '.mjs' }, logLevel: 'warning' });
const r = spawnSync(process.execPath, ['--test', ...files.map((f) => path.join(out, f.replace(/\.ts$/, '.mjs')))], { stdio: 'inherit' });
fs.rmSync(out, { recursive: true, force: true });
process.exit(r.status ?? 1);
