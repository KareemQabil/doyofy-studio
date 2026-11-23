// node tools/dev-api.mjs [port] — dist/ plus the real backend handlers (api/router.ts) over IN-MEMORY storage, so the
// short-link and cross-device reply path runs locally without a Vercel Blob store (tests/backend-e2e.mjs uses it).
// Data lasts until the process stops. Audio upload answers 501 here (it needs Vercel Blob's client-upload handshake).
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { need, ROOT } from './lib.mjs';

const DIST = path.join(ROOT, 'dist');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.glb': 'model/gltf-binary', '.mp4': 'video/mp4', '.webm': 'video/webm' };

/** bundles api/router.ts (esbuild, @vercel/blob left external and never loaded) and returns its module */
export async function loadRouter() {
  const esbuild = need('esbuild');
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'doyofy-api-')), 'router.mjs');
  await esbuild.build({ entryPoints: [path.join(ROOT, 'api', 'router.ts')], outfile: out, bundle: true, platform: 'node', format: 'esm', external: ['@vercel/blob', '@vercel/blob/client'], logLevel: 'warning' });
  return import(pathToFileURL(out).href);
}

export async function startDevApi(port = Number(process.env.PORT || 4841)) {
  const { createApi, memoryStorage } = await loadRouter();
  const storage = memoryStorage();
  const api = createApi({ storage, secret: 'dev-only-secret' });
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = chunks.length ? Buffer.concat(chunks) : undefined;
      const headers = Object.fromEntries(Object.entries(req.headers).filter(([, v]) => typeof v === 'string'));
      const r = await api(new Request(url, { method: req.method, headers, body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body }));
      res.writeHead(r.status, Object.fromEntries(r.headers.entries()));
      res.end(Buffer.from(await r.arrayBuffer()));
      return;
    }
    const clean = decodeURIComponent(url.pathname);
    let file = path.join(DIST, clean === '/' ? 'index.html' : clean);
    if (file.startsWith(DIST) && !path.extname(clean) && (!fs.existsSync(file) || fs.statSync(file).isDirectory())) file = path.join(DIST, 'index.html');
    if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve, reject) => { server.on('error', reject); server.listen(port, resolve); });
  return { server, storage, port };
}

if (process.argv[1] && /dev-api\.mjs$/.test(process.argv[1])) {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) console.warn('[dev-api] dist/ is empty — run `npm run build` first.');
  const { port } = await startDevApi(Number(process.argv[2] || process.env.PORT || 4841));
  console.log(`[dev-api] http://localhost:${port}  (backend on, in-memory storage)`);
}
