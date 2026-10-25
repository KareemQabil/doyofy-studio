// npm test  — functional + visual QA of the production Studio (expects a built dist/: npm run build)
//   node tests/qa.mjs            full matrix
//   node tests/qa.mjs --quick    flow on 390×844 (DOM renderer) + WebGL default + fallback
// Results: qa/qa-results.json, screenshots in qa/screenshots/qa/.
// Waits are state-based (host[data-state]) so slow software WebGL cannot cause false results.
import fs from 'node:fs';
import { need, chromiumPath, ROOT } from '../tools/lib.mjs';
import { startServer } from '../tools/serve.mjs';
import { VIEWPORTS } from './capture.mjs';

const { chromium } = need('playwright');
const QUICK = process.argv.includes('--quick');
const OUT = `${ROOT}/qa/screenshots/qa`;
fs.mkdirSync(OUT, { recursive: true });
const PORT = 5350;
const server = await startServer(PORT);
const browser = await chromium.launch({ executablePath: chromiumPath(), args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const results = [];
const ENV_BLOCKED = /fonts\.googleapis|fonts\.gstatic/; // Google Fonts are unreachable from the QA sandbox (environment, not app)

function record(name, ok, detail = '') { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); }

async function open(query, [w, h] = VIEWPORTS.m390, { noWebGL = false } = {}) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const log = { errors: [], requests: [], failed: [], blocked: 0 };
  if (noWebGL) await page.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/.test(t) ? null : g.call(this, t, ...a); }; });
  page.on('pageerror', (e) => log.errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|fonts\.g/.test(m.text())) log.errors.push(m.text()); });
  page.on('requestfailed', (r) => { if (ENV_BLOCKED.test(r.url())) log.blocked++; else log.failed.push(r.url()); });
  page.on('response', (r) => { const u = r.url(); if (u.includes(`localhost:${PORT}`)) log.requests.push([r.status(), u.split(`${PORT}/`)[1]]); });
  await page.goto(`http://localhost:${PORT}/?view=invite&${query}`, { waitUntil: 'commit' });
  await page.waitForFunction(() => window.__studio?.sm?.state);
  return { page, log };
}
const state = (page) => page.evaluate(() => window.__studio.sm.state);
const waitState = (page, s, timeout = 30000) => page.waitForFunction((x) => window.__studio.sm.state === x, s, { timeout });
const click = (page, sel) => page.click(sel, { force: true });
const rendererOf = (page) => page.evaluate(() => window.__studio.debug.sceneRenderer);
const waitRenderer = (page, prefix, timeout = 120000) => page.waitForFunction((p) => (window.__studio.debug.sceneRenderer || '').startsWith(p) && !document.querySelector('.host').dataset.loading, prefix, { timeout });

// ------------------------------------------------------------------ 1. full canonical flow (DOM renderer, 390×844)
{
  const { page, log } = await open('renderer=dom');
  record('flow: starts in intro', (await state(page)) === 'intro');
  await waitState(page, 'card', 8000);
  const introMs = await page.evaluate(() => { const h = window.__studio.debug.states; return h.find((x) => x[0] === 'card')[1] - h.find((x) => x[0] === 'intro')[1]; });
  record('flow: intro → card after ~4.7 s', Math.abs(introMs - 4700) < 120, `${introMs} ms`);
  const card = await page.evaluate(() => { const r = document.querySelector('.st-front').getBoundingClientRect(); return { x: r.x, y: r.y, r: r.right, b: r.bottom, w: innerWidth, h: innerHeight }; });
  record('layout: card fully inside the viewport', card.x >= 0 && card.y >= 0 && card.r <= card.w && card.b <= card.h, JSON.stringify(card));
  await click(page, '.st-cardbtn');
  record('flow: card → opening', (await state(page)) === 'opening');
  await waitState(page, 'pages', 3000);
  const openMs = await page.evaluate(() => { const h = window.__studio.debug.states; return h.find((x) => x[0] === 'pages')[1] - h.find((x) => x[0] === 'opening')[1]; });
  record('flow: opening → pages after ~950 ms', Math.abs(openMs - 950) < 120, `${openMs} ms`);
  const pageId = () => page.evaluate(() => document.querySelector('.st-page').dataset.page);
  const settle = () => page.waitForTimeout(450);
  await click(page, '[data-act="next"]'); await settle();
  record('pages: next button', (await pageId()) === 'date');
  const cd1 = await page.textContent('[data-cd="s"]'); await page.waitForTimeout(1100); const cd2 = await page.textContent('[data-cd="s"]');
  record('pages: countdown ticks', cd1 !== cd2 && /^\d\d$/.test(cd2), `${cd1} → ${cd2}`);
  const cal = await page.getAttribute('.st-page a.st-cta', 'href');
  record('pages: add-to-calendar link', /calendar\.google\.com.*dates=20270812T160000Z/.test(cal));
  await click(page, '[data-act="prev"]'); await settle();
  record('pages: previous button', (await pageId()) === 'invitation');
  await click(page, '[data-go="3"]'); await settle();
  record('pages: dot navigation', (await pageId()) === 'venue');
  record('pages: directions link', /google\.com\/maps\/search/.test(await page.getAttribute('.st-page a.st-cta', 'href')));
  await page.keyboard.press('ArrowUp'); await settle();
  record('pages: keyboard (ArrowUp)', (await pageId()) === 'program');
  // wheel: one notch → next page; a second notch inside 900 ms is ignored (canonical debounce)
  const box = await page.locator('.st-sheet').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + 300);
  await page.mouse.wheel(0, 120); await page.mouse.wheel(0, 120); await settle();
  const afterWheel = await pageId();
  record('pages: wheel → next, second notch debounced', afterWheel === 'venue', `program → ${afterWheel}`);
  await page.waitForTimeout(700);
  // swipe: pointer down/up on the sheet with a 120 px upward drag
  await page.mouse.move(box.x + box.width / 2, box.y + 500); await page.mouse.down(); await page.mouse.move(box.x + box.width / 2, box.y + 380, { steps: 4 }); await page.mouse.up(); await settle();
  record('pages: swipe up → next', (await pageId()) === 'rsvp');
  await page.keyboard.press('Escape');
  record('pages: Escape closes to card', (await state(page)) === 'card');
  await click(page, '.st-cardbtn'); await waitState(page, 'pages', 3000);
  await click(page, '[data-go="4"]'); await settle();
  // RSVP
  await click(page, 'button[type=submit]');
  record('rsvp: empty submit is rejected', (await state(page)) === 'pages' && await page.$eval('.rsvp-need', (e) => e.classList.contains('is-on')));
  await page.fill('#st-name', 'Layla Hassan');
  await click(page, '[data-attend="no"]');
  record('rsvp: "declines" pressed', (await page.getAttribute('[data-attend="no"]', 'aria-pressed')) === 'true');
  await click(page, '[data-attend="yes"]');
  record('rsvp: "accepts" pressed, "declines" released', (await page.getAttribute('[data-attend="yes"]', 'aria-pressed')) === 'true' && (await page.getAttribute('[data-attend="no"]', 'aria-pressed')) === 'false');
  for (let i = 0; i < 10; i++) await click(page, '[data-guests="1"]');
  const maxG = await page.textContent('.rsvp-guests');
  for (let i = 0; i < 10; i++) await click(page, '[data-guests="-1"]');
  const minG = await page.textContent('.rsvp-guests');
  await click(page, '[data-guests="1"]'); await click(page, '[data-guests="1"]');
  record('rsvp: guests +/− clamp to 1…8', maxG === '8' && minG === '1' && (await page.textContent('.rsvp-guests')) === '3', `max ${maxG}, min ${minG}`);
  await page.screenshot({ path: `${OUT}/flow-rsvp-filled.png` });
  // double submit → the pack sequence must trigger once
  await page.evaluate(() => { document.querySelector('form.rsvp').requestSubmit(); document.querySelector('form.rsvp').requestSubmit(); });
  await waitState(page, 'done', 8000);
  const seq = await page.evaluate(() => window.__studio.debug.states.map((s) => s[0]).join(','));
  record('finale: pack → seal → fly → done, once', (seq.match(/pack/g) || []).length === 1 && /pack,seal,fly,done$/.test(seq), seq.split(',').slice(-4).join('→'));
  const fin = await page.evaluate(() => { const h = window.__studio.debug.states; const t = (n) => h.find((x) => x[0] === n)[1]; return [t('seal') - t('pack'), t('fly') - t('pack'), t('done') - t('pack')]; });
  record('finale: canonical timings +1.75 / +3.5 / +4.95 s', Math.abs(fin[0] - 1750) < 150 && Math.abs(fin[1] - 3500) < 200 && Math.abs(fin[2] - 4950) < 250, fin.join(' / ') + ' ms');
  record('finale: thank-you names the guest', /LAYLA HASSAN · 3 GUESTS/.test(await page.textContent('.done-who')));
  record('rsvp: stored by the adapter', await page.evaluate(() => JSON.parse(localStorage.getItem('invitation-studio:rsvp') || '[]').some((r) => r.name === 'Layla Hassan' && r.attending && r.guests === 3)));
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${OUT}/flow-done.png` });
  // sound
  await click(page, '[data-act="sound"]');
  record('sound: mute toggle', (await page.getAttribute('[data-act="sound"]', 'aria-pressed')) === 'false' && !(await page.evaluate(() => window.__studio.audio.enabled)));
  await click(page, '[data-act="sound"]');
  record('sound: unmute toggle', (await page.getAttribute('[data-act="sound"]', 'aria-pressed')) === 'true');
  const audio = await page.evaluate(() => { const a = window.__studio.audio; return { ctx: !!a.ac, played: a.stats.played, failed: [...a.buffers.entries()].filter(([, b]) => b === 'failed').map(([k]) => k), decoded: [...a.buffers.values()].filter((b) => b !== 'failed').length }; });
  record('audio: unlocked by gesture, cues decoded, none failed', audio.ctx && audio.decoded >= 8 && audio.failed.length === 0, `decoded ${audio.decoded}, played ${audio.played.join(',')}`);
  // replay
  await click(page, '.st-done [data-act="replay"]');
  await waitState(page, 'intro', 3000);
  const reset = await page.evaluate(() => ({ page: window.__studio.page, name: window.__studio.rsvp.name, sent: window.__studio.rsvp.sent, sheet: document.querySelector('.st-page').innerHTML.length, scenes: document.querySelectorAll('.st-layer .scene-dom').length }));
  record('replay: back to intro, RSVP + pages reset, one scene instance', reset.page === 0 && reset.name === '' && !reset.sent && reset.sheet === 0 && reset.scenes === 1, JSON.stringify(reset));
  await waitState(page, 'card', 8000);
  record('replay: intro completes again', true);
  // switcher: card change keeps the scene; scene change keeps the card
  await click(page, '[data-act="switcher"]');
  const sceneEl = await page.evaluateHandle(() => document.querySelector('.scene-dom'));
  await click(page, '[data-pick-card="emerald"]');
  await page.waitForFunction(() => window.__studio.cardId === 'emerald', null, { timeout: 5000 }).catch(() => {});
  const keptScene = await page.evaluate((el) => el.isConnected && window.__studio.cardId === 'emerald' && document.querySelector('.host').dataset.card === 'emerald', sceneEl);
  record('switcher: changing card keeps the scene instance', keptScene);
  const faceBefore = await page.evaluate(() => document.querySelector('.st-face-slot').innerHTML.length);
  await click(page, '[data-pick-scene="garden"]');
  await page.waitForFunction(() => window.__studio.debug.sceneRenderer === 'garden:dom');
  const faceAfter = await page.evaluate(() => document.querySelector('.st-face-slot').innerHTML.length);
  record('switcher: changing scene keeps the card', faceBefore === faceAfter && faceAfter > 1000);
  await page.screenshot({ path: `${OUT}/switcher-emerald-garden.png` });
  record('console: no runtime errors (flow)', log.errors.length === 0, log.errors.slice(0, 3).join(' | '));
  const bad = log.requests.filter(([s]) => s >= 400);
  record('network: every local request resolves', bad.length === 0 && log.failed.length === 0, bad.concat(log.failed).slice(0, 3).join(' | ') + (log.blocked ? ` (Google Fonts blocked by sandbox ×${log.blocked})` : ''));
  await page.close();
}

// ------------------------------------------------------------------ 2. all 100 combinations (DOM renderers)
{
  const { page, log } = await open('renderer=dom&start=card');
  const combos = await page.evaluate(async () => {
    const S = window.__studio, out = [];
    const cards = ['lace', 'wine', 'emerald', 'sage', 'blush', 'midnight', 'arabesque', 'minimal', 'terracotta', 'clay'];
    const scenes = ['candlelit', 'marble', 'garden', 'desert', 'starry', 'silk', 'petals', 'clay', 'sea', 'palace'];
    for (const sc of scenes) {
      S.setScene(sc);
      await new Promise((r) => { const t = setInterval(() => { if (S.debug.sceneRenderer === `${sc}:dom`) { clearInterval(t); r(); } }, 20); });
      for (const c of cards) {
        S.setCard(c);
        const face = document.querySelector('.st-face-slot').textContent;
        out.push({ c, sc, ok: face.includes('سارة') && face.includes('أحمد') && document.querySelector('.scene-dom').children.length > 0 });
      }
    }
    return out;
  });
  const bad = combos.filter((x) => !x.ok);
  record('combinations: 10 cards × 10 scenes render', combos.length === 100 && bad.length === 0, `${combos.length - bad.length}/100`);
  record('console: no errors across 100 combinations', log.errors.length === 0, log.errors.slice(0, 2).join(' | '));
  await page.close();
}

// ------------------------------------------------------------------ 3. reduced motion + WebGL fallback + reload default
{
  const { page } = await open('motion=reduced&renderer=dom');
  const rm = await page.evaluate(() => ({ rm: document.querySelector('.host').classList.contains('rm'), st: window.__studio.sm.state, bob: getComputedStyle(document.querySelector('.st-bob')).animationName }));
  record('reduced motion: starts settled on the card, idle motion off', rm.rm && rm.st === 'card' && rm.bob === 'none', JSON.stringify(rm));
  await click(page, '.st-cardbtn'); await waitState(page, 'pages', 3000);
  record('reduced motion: flow still works', true);
  await page.close();
}
{
  const { page, log } = await open('', VIEWPORTS.m390, { noWebGL: true });
  await page.waitForFunction(() => window.__studio.debug.sceneRenderer);
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => ({ r: window.__studio.debug.sceneRenderer, errs: window.__studio.debug.sceneErrors, canvases: document.querySelectorAll('canvas').length }));
  record('WebGL unavailable → canonical DOM renderer, no blank stage', r.r === 'candlelit:dom' && r.canvases === 0, JSON.stringify(r));
  record('console: no errors without WebGL', log.errors.length === 0, log.errors.slice(0, 2).join(' | '));
  await page.reload({ waitUntil: 'commit' });
  await page.waitForFunction(() => window.__studio?.sm?.state);
  const d = await page.evaluate(() => ({ card: window.__studio.cardId, scene: window.__studio.sceneId, st: window.__studio.sm.state }));
  record('reload: valid default state (wine · candlelit · intro)', d.card === 'wine' && d.scene === 'candlelit' && d.st === 'intro', JSON.stringify(d));
  await page.close();
}

// ------------------------------------------------------------------ 4. WebGL default pairing (real Three.js) + asset loading
{
  const { page, log } = await open('quality=balanced');
  await waitRenderer(page, 'candlelit:three');
  const loaded = log.requests.filter(([s]) => s === 200).map(([, u]) => u);
  // models: Poly Haven GLBs as lossless web glTF (.gltf.json + textures); HDRI: courtyard as RGBM16 PNG (tools/make_derived.py)
  const glb = loaded.filter((u) => /\.(glb|gltf\.json)$/.test(u)), jpg = loaded.filter((u) => /materials\/.*\.jpg$/.test(u)), exr = loaded.filter((u) => /hdri\/.*\.(exr|png)$/.test(u));
  record('three: Wine & Gold + Candlelit Hall renders with Three.js', (await rendererOf(page)) === 'candlelit:three');
  record('three: real GLB models load (web glTF packaging)', glb.length >= 4, glb.map((u) => u.split('/').pop()).join(', '));
  record('three: PBR textures load', jpg.length >= 9, `${jpg.length} maps`);
  record('three: HDRI loads', exr.length === 1, exr.join(''));
  await waitState(page, 'card', 20000).catch(() => {});
  await page.waitForTimeout(2500);
  const st = await page.evaluate(() => window.__studio.scene.stats());
  record('three: tone mapping exposure in target range (settled)', st.exposure >= 0.68 && st.exposure <= 0.74, `ACES exposure ${st.exposure}, ${st.drawCalls} draws, ${st.triangles} tris`);
  await page.screenshot({ path: `${OUT}/three-m390-card.png`, timeout: 180000 });
  await click(page, '.st-cardbtn'); await waitState(page, 'pages', 5000);
  await click(page, '[data-go="4"]'); await page.waitForTimeout(500);
  await page.fill('#st-name', 'Omar'); await click(page, '[data-attend="yes"]');
  await click(page, 'button[type=submit]'); await waitState(page, 'seal', 5000);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${OUT}/three-m390-seal.png`, timeout: 180000 });
  await waitState(page, 'done', 10000);
  record('three: full RSVP → envelope → done over the WebGL scene', true);
  // switching card does not rebuild the WebGL scene
  const canvas = await page.evaluateHandle(() => document.querySelector('canvas.candlelit-gl'));
  await page.evaluate(() => window.__studio.setCard('lace'));
  record('three: changing card keeps the WebGL scene', await page.evaluate((c) => c.isConnected && document.querySelectorAll('canvas').length === 1, canvas));
  await click(page, '.st-done [data-act="replay"]'); await waitState(page, 'intro', 3000);
  record('three: replay keeps one renderer', await page.evaluate(() => document.querySelectorAll('canvas').length === 1));
  record('console: no errors with WebGL', log.errors.length === 0, log.errors.slice(0, 3).join(' | '));
  const bad = log.requests.filter(([s]) => s >= 400);
  record('network: WebGL assets resolve', bad.length === 0 && log.failed.length === 0, bad.concat(log.failed).slice(0, 3).join(' | '));
  await page.close();
}

// ------------------------------------------------------------------ 4b. customer wizard
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|fonts\.g/.test(m.text())) errors.push(m.text()); });
  await page.goto(`http://localhost:${PORT}/?view=wizard`, { waitUntil: 'commit' });
  await page.evaluate(() => { try { localStorage.removeItem('invitation-studio:draft'); } catch {} });
  await page.reload({ waitUntil: 'commit' });
  await page.waitForFunction(() => window.__wizard && window.__studio);
  const W = (fn, ...a) => page.evaluate(fn, ...a);
  record('wizard: opens on the experience step with a live preview', await W(() => document.querySelector('.wz').dataset.step === 'experience' && !!document.querySelector('.wz-screen .host')));
  record('wizard: default experience is 3D · animated', await W(() => window.__studio.experience.dimension === '3d' && window.__studio.experience.motion === 'animated'));
  await click(page, '[data-dim="2d"]');
  await page.waitForFunction(() => (window.__studio.debug.sceneRenderer || '').endsWith(':dom'));
  record('wizard: choosing 2D rebuilds the preview with the illustrated renderer', await W(() => window.__studio.quality.renderer === 'dom'));
  await click(page, '[data-motion="static"]');
  await page.waitForFunction(() => window.__studio?.sm?.state);
  record('wizard: static starts settled on the card with motion off', await W(() => window.__studio.sm.state === 'card' && document.querySelector('.wz-screen .host').classList.contains('static') && getComputedStyle(document.querySelector('.wz-screen .st-bob')).animationName === 'none'));
  await click(page, '[data-motion="animated"]');
  await click(page, '[data-wz="next"]');
  record('wizard: card step lists 10 live card faces', await W(() => document.querySelectorAll('.wz-card').length === 10 && document.querySelector('.wz-card .wz-card-face').textContent.includes('سارة')));
  await click(page, '[data-card="emerald"]');
  record('wizard: picking a card updates the preview in place', await W(() => window.__studio.cardId === 'emerald'));
  await click(page, '[data-wz="next"]');
  record('wizard: 2D lists all 10 settings', await W(() => document.querySelectorAll('.wz-scene').length === 10));
  await click(page, '[data-scene="palace"]');
  record('wizard: picking a setting swaps the preview scene', await page.waitForFunction(() => window.__studio.debug.sceneRenderer === 'palace:dom').then(() => true, () => false));
  await click(page, '[data-wz="back"]'); await click(page, '[data-wz="back"]');
  await click(page, '[data-dim="3d"]');
  await click(page, '[data-wz="next"]'); await click(page, '[data-wz="next"]');
  record('wizard: 3D lists only 3D settings and falls back to Candlelit Hall', await W(() => document.querySelectorAll('.wz-scene').length === 1 && document.querySelector('.wz-scene').dataset.scene === 'candlelit' && window.__wizard.cfg.scene === 'candlelit'));
  await click(page, '[data-wz="next"]');
  await page.fill('input[name="aAr"]', '');
  await click(page, '[data-wz="next"]');
  record('wizard: details validation blocks sharing without names', await W(() => document.querySelector('.wz').dataset.step === 'details' && document.querySelector('input[name="aAr"]').getAttribute('aria-invalid') === 'true'));
  await page.fill('input[name="aAr"]', 'ليلى'); await page.fill('input[name="aEn"]', 'Layla');
  await page.fill('input[name="bAr"]', 'عمر'); await page.fill('input[name="bEn"]', 'Omar');
  await page.fill('input[name="date"]', '2027-03-18'); await page.fill('input[name="time"]', '20:30');
  await page.selectOption('select[name="tz"]', 'Asia/Riyadh');
  record('wizard: details update the live preview', await page.waitForFunction(() => window.__studio?.data?.c?.arA === 'ليلى' && window.__studio.data.c.dateNum === '18 · 03 · 2027' && /ليلى/.test(document.querySelector('.wz-screen .st-face-slot')?.textContent || ''), null, { timeout: 20000 }).then(() => true, () => false));
  await click(page, '[data-wz="next"]');
  const link = await page.inputValue('#wz-link');
  record('wizard: share step produces a guest link', /\?view=invite&i=[A-Za-z0-9_-]+$/.test(link), link.slice(0, 60) + '…');
  await click(page, '[data-wz="open-full"]');
  await page.waitForFunction(() => window.__studio && document.querySelector('.wz-full-host.host'));
  record('wizard: full-screen invitation opens (one Studio at a time)', await W(() => !document.querySelector('.wz-screen .host') && !!document.querySelector('.wz-full-host.host')));
  await click(page, '[data-wz="close-full"]');
  record('wizard: back to editing restores the preview', await W(() => !!document.querySelector('.wz-screen .host') && document.querySelector('.wz-full').hidden));
  await page.screenshot({ path: `${OUT}/wizard-share.png`, timeout: 180000 });
  // the guest link reproduces the design
  await page.goto(link.replace(/^https?:\/\/[^/]+/, `http://localhost:${PORT}`), { waitUntil: 'commit' });
  await page.waitForFunction(() => window.__studio?.sm?.state);
  const g = await W(() => ({ card: window.__studio.cardId, scene: window.__studio.sceneId, x: window.__studio.experience, a: window.__studio.data.c.arA, tz: window.__studio.data.c.timeEn, sw: !!document.querySelector('[data-act="switcher"]'), wizard: !!window.__wizard }));
  record('guest link: opens the same design (card, setting, experience, names, time)', g.card === 'emerald' && g.scene === 'candlelit' && g.x.dimension === '3d' && g.a === 'ليلى' && g.tz === '8:30 PM' && !g.sw && !g.wizard, JSON.stringify(g));
  record('console: no errors in the wizard', errors.length === 0, errors.slice(0, 3).join(' | '));
  await page.close();
  // phone: the preview is a sheet behind the Preview button
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto(`http://localhost:${PORT}/?view=wizard`, { waitUntil: 'commit' });
  await m.waitForFunction(() => window.__wizard);
  const hiddenBefore = await m.evaluate(() => getComputedStyle(document.querySelector('.wz-preview')).visibility);
  const renderingBefore = await m.evaluate(() => !!document.querySelector('.wz-screen .host'));
  await m.click('[data-wz="show-preview"]'); await m.waitForTimeout(600);
  const shown = await m.evaluate(() => getComputedStyle(document.querySelector('.wz-preview')).visibility);
  record('wizard (phone): preview sheet hidden until Preview is tapped', hiddenBefore === 'hidden' && shown === 'visible');
  const renderingOpen = await m.evaluate(() => !!document.querySelector('.wz-screen .host'));
  await m.click('[data-wz="hide-preview"]'); await m.waitForTimeout(300);
  const renderingAfter = await m.evaluate(() => !!document.querySelector('.wz-screen .host'));
  record('wizard (phone): live preview renders only while its sheet is open', !renderingBefore && renderingOpen && !renderingAfter, JSON.stringify({ renderingBefore, renderingOpen, renderingAfter }));
  await m.close();
}

// ------------------------------------------------------------------ 5. viewport matrix (WebGL default pairing, card state)
const vps = QUICK ? ['desk'] : ['m390', 'm393', 'm412', 'tab', 'desk', 'fhd', 'ultra'];
for (const vp of vps) {
  const { page, log } = await open('start=card&quality=balanced', VIEWPORTS[vp]);
  await waitRenderer(page, 'candlelit:');
  await page.waitForTimeout(2500);
  const m = await page.evaluate(() => {
    const r = (s) => document.querySelector(s).getBoundingClientRect();
    const st = r('.st-frame .st'), card = r('.st-front'), ctrl = r('.st-ctrls');
    return { vw: innerWidth, vh: innerHeight, stage: [Math.round(st.x), Math.round(st.y), Math.round(st.width), Math.round(st.height)], card: [Math.round(card.x), Math.round(card.y), Math.round(card.right), Math.round(card.bottom)], ctrlTop: Math.round(ctrl.top), renderer: window.__studio.debug.sceneRenderer };
  });
  const inside = m.card[0] >= 0 && m.card[1] >= 0 && m.card[2] <= m.vw && m.card[3] <= m.vh;
  const fits = m.stage[2] <= m.vw + 1 && m.stage[3] <= m.vh + 1;
  record(`viewport ${vp} ${m.vw}×${m.vh}: stage fits, card fully visible`, inside && fits, `stage ${m.stage.join(',')} card ${m.card.join(',')} · ${m.renderer}`);
  await page.screenshot({ path: `${OUT}/viewport-${vp}.png`, timeout: 180000 });
  if (log.errors.length) record(`console ${vp}`, false, log.errors.slice(0, 2).join(' | '));
  await page.close();
}

fs.writeFileSync(`${ROOT}/qa/qa-results${QUICK ? '-quick' : ''}.json`, JSON.stringify({ at: new Date().toISOString(), quick: QUICK, pass: results.filter((r) => r.ok).length, fail: results.filter((r) => !r.ok).length, results }, null, 2));
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed`);
await browser.close(); server.close();
process.exit(results.every((r) => r.ok) ? 0 : 1);
