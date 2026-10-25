// Captures the three explored «توقيع» directions (A احتفال · B مساء · C تحرير) from the static board
// (design-source/directions/direction-board.html, staged with real card-face PNGs in dist/_board/) into
// public/assets/directions/signature-d{1,2,3}.png for the reviewer page /prototype/signature-directions.
import fs from 'node:fs';
import { need, chromiumPath, ROOT } from './lib.mjs';
import { startServer } from './serve.mjs';
const { chromium } = need('playwright');
const server = await startServer(5396);
const browser = await chromium.launch({ executablePath: chromiumPath() });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5396/_board/index.html'); await page.waitForTimeout(1200);
fs.mkdirSync(`${ROOT}/public/assets/directions`, { recursive: true });
for (const id of ['d1', 'd2', 'd3']) await page.locator(`#${id}`).screenshot({ path: `${ROOT}/review/screenshots-or-captures/directions/${id}.png` });
await browser.close(); server.close(); console.log('ok');
