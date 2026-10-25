// Production build: bundles src/ with esbuild, copies public/ and writes two entry pages:
//   dist/index.html     – full standalone document (local dev, tests, any static host)
//   dist/artifact.html  – body-only fragment for hosts that wrap the page in their own skeleton
import fs from 'node:fs';
import path from 'node:path';
import { need, ROOT, ensureDir, copyDir } from './lib.mjs';

const esbuild = need('esbuild');
const watch = process.argv.includes('--watch');
const serve = process.argv.includes('--serve');
const DIST = path.join(ROOT, 'dist');

function writePages() {
  const shell = fs.readFileSync(path.join(ROOT, 'src', 'index.html'), 'utf8');
  const head = shell.match(/<!--HEAD-->([\s\S]*?)<!--\/HEAD-->/)[1].trim();
  const body = shell.match(/<!--BODY-->([\s\S]*?)<!--\/BODY-->/)[1].trim();
  const full = `<!doctype html>\n<html lang="ar" dir="rtl">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${head}\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
  fs.writeFileSync(path.join(DIST, 'index.html'), full);
  fs.writeFileSync(path.join(DIST, 'artifact.html'), `${head}\n${body}\n`);
}

async function run() {
  ensureDir(DIST);
  const opts = {
    entryPoints: { app: path.join(ROOT, 'src', 'main.js'), styles: path.join(ROOT, 'src', 'styles', 'index.css') },
    outdir: DIST,
    bundle: true,
    format: 'esm',
    target: ['es2020', 'chrome100', 'safari15', 'firefox100'],
    minify: !watch,
    sourcemap: watch ? 'inline' : false,
    loader: { '.svg': 'text' },
    // true once `npm run fonts:localize` has run → the demo drops the Google Fonts CDN
    define: { __LOCAL_FONTS__: String(fs.existsSync(path.join(ROOT, 'public', 'assets', 'fonts', 'manifest.json'))) },
    legalComments: 'none',
    external: ['assets/*'],
    logLevel: 'info',
    // keep dist/index.html in sync with src/index.html on every (re)build
    plugins: [{ name: 'pages', setup(b) { b.onEnd(() => { try { writePages(); } catch (e) { console.error('[build] pages', e.message); } }); } }],
  };
  copyDir(path.join(ROOT, 'public'), DIST);
  writePages();
  if (watch) {
    const ctx = await esbuild.context(opts);
    await ctx.watch();
    console.log('[build] watching src/ …');
  } else {
    await esbuild.build(opts);
    console.log('[build] dist/ ready');
  }
  if (serve) {
    // same process as the build, so `npm run dev` / `npm start` work identically on Windows, macOS and Linux
    const { startServer } = await import('./serve.mjs');
    const server = await startServer(Number(process.env.PORT || 5173));
    console.log(`\n  Invitation Experience Engine → http://localhost:${server.address().port}\n  (Ctrl+C to stop)\n`);
  }
}
run().catch((e) => { console.error(e); process.exit(1); });
