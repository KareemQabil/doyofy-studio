// Social/share preview (1200×630) for «توقيع», composed from brand geometry and real rendered card faces only.
// Text uses IBM Plex Sans Arabic (OFL) — the brand display font is licensed for the local prototype only.
//   node tests/dev/face-pngs.mjs design-source/signature/faces sig-diploma:graduation:جود sig-ribbon:wedding:نورة:فيصل sig-ticket:birthday:ليان
//   node tools/gen-share-preview.mjs → public/assets/brand/share-preview.png (+ design-source/signature/share-preview.html)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, need, chromiumPath } from './lib.mjs';
import { startServer } from './serve.mjs';
const brand = fs.readFileSync(path.join(ROOT, 'src/ui/brand.tsx'), 'utf8');
const arr = (name) => JSON.parse(brand.match(new RegExp(`const ${name} = (\\[.*?\\]);`, 's'))[1].replace(/'/g, '"'));
const logoSvg = `<svg class="l" viewBox="548.54 404.82 732.93 260.37" style="width:${(40 * 732.93 / 260.37).toFixed(1)}px">${[...arr('MARK'), ...arr('WORD')].map((d) => `<path d="${d}"/>`).join('')}</svg>`;
const faces = ['sig-ribbon', 'sig-diploma', 'sig-ticket'].map((id) => `data:image/png;base64,${fs.readFileSync(path.join(ROOT, `design-source/signature/faces/${id}.png`)).toString('base64')}`);
const html = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><style>
@font-face{font-family:Plex;src:url('/assets/fonts/ibm-plex-sans-arabic-Bold.woff') format('woff');font-weight:700}
@font-face{font-family:Plex;src:url('/assets/fonts/ibm-plex-sans-arabic-Regular.woff') format('woff');font-weight:400}
*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;overflow:hidden;font-family:Plex}
.s{position:relative;width:1200px;height:630px;color:#fff;background:radial-gradient(55% 65% at 88% 8%,#D46A66 0%,transparent 62%),radial-gradient(45% 55% at 18% 22%,rgba(199,166,97,.38),transparent 68%),radial-gradient(60% 60% at 26% 100%,#8F3034 0%,transparent 72%),#BC4749;isolation:isolate}
.p{position:absolute;inset:0;background:url('/assets/brand/pattern-grid-ivory.svg') 0 0/230px auto;opacity:.08;z-index:-1}
.c{position:absolute;top:96px;right:72px;width:560px}
.k{font-size:24px;opacity:.9;display:flex;gap:14px;align-items:center}.k i{display:block;width:40px;height:2px;background:#fff}
h1{font-size:84px;line-height:1.18;margin-top:22px;letter-spacing:-.01em}
.u{margin-top:26px;font-size:24px;opacity:.92}
.f img{position:absolute;width:216px;height:302px;border-radius:6px;box-shadow:0 34px 44px -26px rgba(0,0,0,.6),0 2px 6px rgba(0,0,0,.18)}
.f img:nth-child(1){left:70px;top:190px;transform:rotate(-12deg)}.f img:nth-child(2){left:230px;top:120px;transform:rotate(2deg);z-index:2}.f img:nth-child(3){left:392px;top:210px;transform:rotate(13deg)}
.l{position:absolute;right:72px;bottom:58px;height:40px;fill:#fff}
</style></head><body><div class="s"><div class="p"></div><div class="c"><p class="k"><i></i>دعوات رقمية لكل فرحة</p><h1>كل فرحة<br>تستاهل دعوة.</h1></div>
<div class="f">${faces.map((f) => `<img src="${f}" alt="">`).join('')}</div>${logoSvg}</div></body></html>`;
fs.writeFileSync(path.join(ROOT, 'design-source/signature/share-preview.html'), html);
fs.writeFileSync(path.join(ROOT, 'dist/_share.html'), html);
const server = await startServer(5397);
const { chromium } = need('playwright');
const b = await chromium.launch({ executablePath: chromiumPath() });
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto('http://localhost:5397/_share.html'); await p.waitForTimeout(900);
await p.screenshot({ path: path.join(ROOT, 'public/assets/brand/share-preview.png') });
fs.rmSync(path.join(ROOT, 'dist/_share.html')); await b.close(); server.close(); console.log('ok');
