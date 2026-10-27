// Component behavior only: jsdom is not browser, rendering or device QA.
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
const output=path.resolve('tests/.dom-build.mjs');
const dom=new JSDOM('<!doctype html><html dir="rtl"><body><button id="trigger">open</button><div id="root"></div></body></html>',{url:'https://doyofy.test/app/events'});
for(const key of ['window','document','location','history','HTMLElement','HTMLDialogElement','HTMLInputElement','Event','MouseEvent','KeyboardEvent','MutationObserver','getComputedStyle'])globalThis[key]=key==='getComputedStyle'?dom.window.getComputedStyle.bind(dom.window):dom.window[key];
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
dom.window.scrollTo=()=>{};
dom.window.HTMLCanvasElement.prototype.getContext=()=>null;
globalThis.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});
globalThis.ResizeObserver=class {observe(){} disconnect(){}};
globalThis.IntersectionObserver=class {observe(){} disconnect(){}};
globalThis.requestAnimationFrame=fn=>setTimeout(fn,0);
globalThis.cancelAnimationFrame=clearTimeout;
dom.window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
dom.window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
try {
  await build({entryPoints:['tests/dom/components.tsx'],outfile:output,bundle:true,platform:'node',format:'esm',jsx:'automatic',packages:'external',logLevel:'warning'});
  const { run }=await import(pathToFileURL(output).href);await run();
} finally { fs.rmSync(output,{force:true});dom.window.close(); }
