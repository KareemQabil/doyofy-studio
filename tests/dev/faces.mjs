// dev helper: render card faces with data variants → PNG. node tests/dev/faces.mjs out.png id1,id2
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { need, chromiumPath, ROOT } from '../../tools/lib.mjs';
import { startServer } from '../../tools/serve.mjs';
const esbuild = need('esbuild'); const { chromium } = need('playwright');
const [out, ids] = process.argv.slice(2);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'faces-'));
await esbuild.build({ entryPoints: [path.join(ROOT, 'tests/dev/faces-entry.ts')], bundle: true, format: 'esm', platform: 'node', outfile: path.join(tmp, 'f.mjs'), logLevel: 'error' });
const { sheet } = await import(path.join(tmp, 'f.mjs'));
const body = sheet(ids.split(','));
fs.writeFileSync(path.join(ROOT, 'dist', '_faces.html'), `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><link rel="stylesheet" href="/styles.css"><style>body{background:#e9e3d8;font-family:sans-serif;margin:16px} .row{display:flex;gap:14px;flex-wrap:wrap} figure{margin:0} .face{width:300px;height:420px;box-shadow:0 6px 20px rgba(0,0,0,.2)} h2{font:600 14px sans-serif;margin:14px 0 6px} figcaption{font-size:11px;text-align:center}</style></head><body>${body}</body></html>`);
const server = await startServer(5393);
const browser = await chromium.launch({ executablePath: chromiumPath() });
const page = await browser.newPage({ viewport: { width: 1960, height: 600 } });
await page.goto('http://localhost:5393/_faces.html'); await page.waitForTimeout(1200);
await page.screenshot({ path: out, fullPage: true });
await browser.close(); server.close(); fs.rmSync(path.join(ROOT, 'dist', '_faces.html'));
console.log('ok', out);
