// Account sounds and the editor's sound choice (r4-audio). jsdom has no Web Audio/MediaRecorder: those are stood in for.
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
const output = path.resolve('tests/.audio-dom-build.mjs');
const dom = new JSDOM('<!doctype html><html dir="rtl"><body><div id="root"></div></body></html>', { url: 'https://doyofy.test/app/account' });
for (const key of ['window', 'document', 'location', 'history', 'HTMLElement', 'HTMLDialogElement', 'HTMLInputElement', 'Event', 'MouseEvent', 'KeyboardEvent', 'MutationObserver', 'Storage', 'localStorage']) globalThis[key] = dom.window[key];
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
dom.window.scrollTo = () => {};
dom.window.HTMLCanvasElement.prototype.getContext = () => null;
for (const m of ['load', 'pause']) dom.window.HTMLMediaElement.prototype[m] = () => {};
dom.window.HTMLMediaElement.prototype.play = () => Promise.resolve();
globalThis.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
globalThis.ResizeObserver = class { observe() {} disconnect() {} };
globalThis.requestAnimationFrame = fn => setTimeout(fn, 16);
globalThis.cancelAnimationFrame = clearTimeout;
// the editor's upload/record sheets are native <dialog>s
dom.window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
dom.window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
try {
  await build({ entryPoints: ['tests/dom/audio.tsx'], outfile: output, bundle: true, platform: 'node', format: 'esm', jsx: 'automatic', packages: 'external', logLevel: 'warning' });
  const { run } = await import(pathToFileURL(output).href); await run();
} finally { fs.rmSync(output, { force: true }); dom.window.close(); }
