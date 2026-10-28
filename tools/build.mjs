// npm run build  →  dist/
//   dist/index.html      full standalone document (local dev, tests, any static host)
//   dist/artifact.html   head+body fragment for hosts that provide their own skeleton
//   dist/app-[hash].js + chunks ESM bundle, code-split: three.js, GSAP and the WebGL scene load only when used
//                        (production entry names carry a content hash, so a new deploy is never served from a stale cache)
//   dist/assets/         public/assets minus the P0 library, plus ONLY the P0 files src references
// Flags: --watch (rebuild on change), --serve (also start the static server; works on Windows too)
import fs from 'node:fs';
import path from 'node:path';
import { need, ROOT, ensureDir, copyDir } from './lib.mjs';

const esbuild = need('esbuild');
const watch = process.argv.includes('--watch');
const serve = process.argv.includes('--serve');
const DIST = path.join(ROOT, 'dist');

/** public origin for absolute share-preview URLs (WhatsApp/iMessage need https://…): SITE_URL, else Vercel's own */
const SITE = (process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')).replace(/\/$/, '');
let entries = { 'app.js': 'app.js', 'styles.css': 'styles.css', 'ui.css': 'ui.css' };

function writePages() {
  let shell = fs.readFileSync(path.join(ROOT, 'src', 'index.html'), 'utf8');
  for (const [plain, hashed] of Object.entries(entries)) shell = shell.split(`"${plain}"`).join(`"${hashed}"`);
  if (SITE) shell = shell.replace('content="assets/brand/share-preview.png"', `content="${SITE}/assets/brand/share-preview.png"`).replace('<meta property="og:type"', `<meta property="og:url" content="${SITE}/">\n<meta property="og:type"`);
  const head = shell.match(/<!--HEAD-->([\s\S]*?)<!--\/HEAD-->/)[1].trim();
  const body = shell.match(/<!--BODY-->([\s\S]*?)<!--\/BODY-->/)[1].trim();
  // index.html: served by tools/serve.mjs (SPA fallback) → real paths (/app/events/…), so assets resolve from "/".
  // artifact.html: static hosts without fallback → hash routes (#/app/events/…), relative assets.
  const historyHead = `<base href="/">\n${head}`;
  fs.writeFileSync(path.join(DIST, 'index.html'), `<!doctype html>\n<html lang="ar" dir="rtl" data-router="history">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${historyHead}\n</head>\n<body>\n${body}\n</body>\n</html>\n`);
  fs.writeFileSync(path.join(DIST, 'artifact.html'), `${head}\n${body}\n`);
}

/** P0 files referenced from src/** (same scan as tools/check_assets.mjs) */
function referencedP0() {
  const refs = new Set();
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return walk(p);
    for (const m of fs.readFileSync(p, 'utf8').matchAll(/['"`]((?:p0|p0-derived)\/[A-Za-z0-9_\-./]+\.(?:glb|exr|hdr|jpg|png|webp|mp4|webm|mp3|json))['"`]/g)) refs.add(m[1]);
  });
  walk(path.join(ROOT, 'src'));
  return [...refs];
}

function copyAssets() {
  const pub = path.join(ROOT, 'public');
  for (const e of fs.readdirSync(pub, { withFileTypes: true })) {
    if (e.name === 'assets') continue;
    const a = path.join(pub, e.name), b = path.join(DIST, e.name);
    e.isDirectory() ? copyDir(a, b) : fs.copyFileSync(a, b);
  }
  const assets = path.join(pub, 'assets');
  for (const e of fs.readdirSync(assets, { withFileTypes: true })) {
    if (e.name === 'p0' || e.name === 'p0-derived') continue;
    const a = path.join(assets, e.name), b = path.join(DIST, 'assets', e.name);
    ensureDir(path.dirname(b));
    e.isDirectory() ? copyDir(a, b) : fs.copyFileSync(a, b);
  }
  const refs = referencedP0();
  let bytes = 0;
  for (const r of refs) {
    const src = path.join(assets, r);
    if (!fs.existsSync(src)) throw new Error(`[build] required asset missing: ${r}`);
    const files = r.endsWith('.gltf.json') ? fs.readdirSync(path.dirname(src)).map((f) => path.join(path.dirname(r), f)) : [r];
    for (const f of files) {
      const dst = path.join(DIST, 'assets', f);
      ensureDir(path.dirname(dst)); fs.copyFileSync(path.join(assets, f), dst); bytes += fs.statSync(path.join(assets, f)).size;
    }
  }
  console.log(`[build] P0 assets shipped: ${refs.length} files, ${(bytes / 1048576).toFixed(1)} MB`);
}

async function run() {
  fs.rmSync(DIST, { recursive: true, force: true });
  ensureDir(DIST);
  const opts = {
    entryPoints: { app: path.join(ROOT, 'src', 'app', 'main.tsx'), styles: path.join(ROOT, 'src', 'styles', 'index.css'), ui: path.join(ROOT, 'src', 'app', 'app.css') },
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': watch ? '"development"' : '"production"' },
    nodePaths: [path.join(ROOT, 'node_modules')],
    outdir: DIST, bundle: true, format: 'esm', splitting: true, chunkNames: 'chunks/[name]-[hash]', metafile: true,
    entryNames: watch ? '[name]' : '[name]-[hash]',
    target: ['es2020', 'chrome100', 'safari15', 'firefox100'],
    minify: !watch, sourcemap: watch ? 'inline' : false, legalComments: 'linked',
    external: ['assets/*'], logLevel: 'info',
    plugins: [{ name: 'pages', setup(b) { b.onEnd((result) => {
      try {
        // map each entry (app.js, styles.css, ui.css) to the file esbuild wrote, then write the pages that load them
        for (const [out, meta] of Object.entries(result.metafile?.outputs ?? {})) {
          if (!meta.entryPoint) continue;
          const name = path.basename(out), plain = name.replace(/-[A-Z0-9]{8}(?=\.(js|css)$)/, '');
          if (plain in entries) entries[plain] = name;
        }
        writePages();
      } catch (e) { console.error('[build] pages', e.message); }
    }); } }],
  };
  copyAssets();
  writePages();
  if (watch) { const ctx = await esbuild.context(opts); await ctx.watch(); console.log('[build] watching src/ …'); }
  else { await esbuild.build(opts); console.log('[build] dist/ ready'); }
  if (serve) {
    const { startServer } = await import('./serve.mjs');
    const server = await startServer(Number(process.env.PORT || 5173));
    console.log(`\n  Invitation Studio → http://localhost:${server.address().port}\n  (Ctrl+C to stop)\n`);
  }
}
run().catch((e) => { console.error(e); process.exit(1); });
