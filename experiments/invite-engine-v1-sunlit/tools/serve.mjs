// Tiny static server with Range support (needed for <video> seeking) for dist/.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';

const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT || 5173);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
  '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream',
};

export function startServer(port = PORT) {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    let file = path.join(DIST, url === '/' ? 'index.html' : url);
    if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end('not found'); return;
    }
    const stat = fs.statSync(file);
    const type = TYPES[path.extname(file)] || 'application/octet-stream';
    const range = req.headers.range;
    if (range) {
      const [s, e] = range.replace('bytes=', '').split('-');
      const start = Number(s), end = e ? Number(e) : stat.size - 1;
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
      fs.createReadStream(file, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': stat.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' });
      fs.createReadStream(file).pipe(res);
    }
  });
  // If the port is taken (another dev server, a previous run still open), try the next ones.
  return new Promise((resolve, reject) => {
    let p = port;
    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE' && p < port + 10) { console.warn(`[serve] port ${p} in use, trying ${p + 1}`); server.listen(++p); }
      else reject(e);
    });
    server.on('listening', () => resolve(server));
    server.listen(p);
  });
}

if (process.argv[1] && /serve\.mjs$/.test(process.argv[1])) {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) console.warn('[serve] dist/ is empty — run `npm run build` first (or use `npm start`).');
  startServer().then((s) => console.log(`[serve] http://localhost:${s.address().port}`));
}
