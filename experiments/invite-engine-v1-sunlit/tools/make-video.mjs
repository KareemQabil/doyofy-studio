// Renders the "sunlit shadows" light map as a seamless loop (MP4 + WebM + poster).
// The frame is a multiply-ready light map: lit areas are white, shade is a warm tone,
// so the scene can blend it over any wall texture with `mix-blend-mode: multiply`.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { need, pub, ensureDir, chromiumPath } from './lib.mjs';
import { palmFrondPath } from './botanicals.mjs';

const { chromium } = need('playwright');
const sharp = need('sharp');

const SIZE = 960, FPS = 24, SECONDS = 12, FRAMES = FPS * SECONDS;
const palmA = palmFrondPath({ seed: 5, len: 620, leaflets: 36, spread: 170 });
const palmB = palmFrondPath({ seed: 9, len: 520, leaflets: 30, spread: 140 });

const html = `<!doctype html><html><body style="margin:0;background:#D9C8B3">
<svg id="s" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
 <defs>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="11"/></filter>
  <filter id="softer" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur id="leafBlur" stdDeviation="5"/></filter>
  <linearGradient id="falloff" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#F6EEE3"/></linearGradient>
  <clipPath id="patchClip"><use href="#patch"/></clipPath>
 </defs>
 <rect width="${SIZE}" height="${SIZE}" fill="#D9C8B3"/>
 <g id="light" filter="url(#soft)">
  <g id="patchG">
   <path id="patch" d="M0 900 V300 A220 220 0 0 1 440 300 V900 Z" fill="url(#falloff)"/>
   <!-- mullions -->
   <g fill="#D9C8B3">
    <rect x="212" y="60" width="16" height="860"/>
    <rect x="0" y="420" width="440" height="16"/>
    <rect x="0" y="640" width="440" height="16"/>
   </g>
  </g>
 </g>
 <g id="leaves" filter="url(#softer)" fill="#D9C8B3" opacity=".9">
  <g id="palmA"><path d="${palmA.leaflets}"/><path d="${palmA.rachis}" fill="none" stroke="#D9C8B3" stroke-width="6"/></g>
  <g id="palmB"><path d="${palmB.leaflets}"/><path d="${palmB.rachis}" fill="none" stroke="#D9C8B3" stroke-width="5"/></g>
 </g>
</svg>
<script>
 const TAU = Math.PI*2, T = ${SECONDS};
 window.setTime = (t) => {
  const p = t / T;
  const dx = Math.sin(TAU*p)*14, dy = Math.cos(TAU*p)*6;
  document.getElementById('patchG').setAttribute('transform', 'translate(' + (330+dx) + ' ' + (-40+dy) + ') skewX(-16) scale(1.02 1)');
  const a1 = 148 + Math.sin(TAU*p*2)*3.2 + Math.sin(TAU*p*3+1)*1.4;
  const a2 = -146 + Math.sin(TAU*p*2+2)*2.6 + Math.sin(TAU*p*4)*1.1;
  document.getElementById('palmA').setAttribute('transform', 'translate(1080 -60) rotate(' + a1 + ') scale(1.55)');
  document.getElementById('palmB').setAttribute('transform', 'translate(1090 1010) rotate(' + a2 + ') scale(1.45)');
  document.getElementById('leafBlur').setAttribute('stdDeviation', (3.6 + Math.sin(TAU*p)*1.2).toFixed(2));
  const breathe = 0.93 + 0.07*(0.5+0.5*Math.sin(TAU*p + 0.6));
  document.getElementById('light').setAttribute('opacity', breathe.toFixed(3));
 };
 setTime(0);
</script></body></html>`;

async function main() {
  const out = ensureDir(pub('video'));
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 1 });
  await page.setContent(html);
  const mp4 = path.join(out, 'sunlit-shadows.mp4');
  const webm = path.join(out, 'sunlit-shadows.webm');
  const frames = [];
  for (let i = 0; i < FRAMES; i++) {
    await page.evaluate((t) => window.setTime(t), (i / FPS));
    frames.push(await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: SIZE, height: SIZE } }));
    if (i % 48 === 0) process.stdout.write(`  frame ${i}/${FRAMES}\r`);
  }
  await browser.close();
  await sharp(frames[0]).webp({ quality: 80 }).toFile(path.join(out, 'sunlit-shadows-poster.webp'));

  const encode = (args, file) => new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', ...args, file]);
    ff.on('close', (c) => (c === 0 ? resolve() : reject(new Error('ffmpeg ' + c))));
    for (const f of frames) ff.stdin.write(f);
    ff.stdin.end();
  });
  await encode(['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '26', '-preset', 'slow', '-movflags', '+faststart', '-an'], mp4);
  await encode(['-c:v', 'libvpx-vp9', '-crf', '38', '-b:v', '0', '-row-mt', '1', '-an'], webm);
  for (const f of [mp4, webm]) console.log('  →', path.basename(f), Math.round(fs.statSync(f).size / 1024) + 'KB');
}
main().catch((e) => { console.error(e); process.exit(1); });
