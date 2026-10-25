// Token contrast only; this does not replace rendered accessibility/device QA.
import fs from 'node:fs';
const source=['src/ui/styles/tokens.css','src/ui/styles/appearance.css','src/features/orbit/orbit.css','src/features/bahja/bahja.css','src/features/horizon/horizon.css','src/features/signature/signature.css'].map(p=>fs.readFileSync(p,'utf8')).join('\n').replace(/\/\*[\s\S]*?\*\//g,'');
const blocks=[...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
const luminance=hex=>{
 const c=hex.match(/^#([\da-f]{6})$/i);if(!c)throw new Error(`Expected opaque hex color: ${hex}`);
 const v=[0,2,4].map(i=>parseInt(c[1].slice(i,i+2),16)/255).map(s=>s<=.04045?s/12.92:((s+.055)/1.055)**2.4);
 return .2126*v[0]+.7152*v[1]+.0722*v[2];
};
const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
let checked=0;
for(const theme of ['warm','sage','rose','ink','night','orbit','bahja','horizon','signature']){
 const vars={};
 for(const [,selectors,body] of blocks){
  if(!selectors.split(',').some(s=>s.trim()===':root'||s.trim()===`:root[data-theme='${theme}']`))continue;
  for(const [,key,value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g))vars[key]=value.trim();
 }
 const resolve=k=>vars[k]?.startsWith('var(')?resolve(vars[k].slice(4,-1)):vars[k];
 const pairs=[];
 for(const text of ['--c-text','--c-text-2','--c-text-3','--c-primary-text','--c-accent-strong'])for(const bg of ['--c-canvas','--c-surface','--c-surface-elevated','--c-surface-subtle'])pairs.push([text,bg]);
 pairs.push(['--c-on-primary','--c-primary']);
 for(const kind of ['success','danger','warning','info','neutral'])pairs.push([`--c-${kind}`,`--c-${kind}-soft`]);
 for(const [text,bg] of pairs){const r=ratio(resolve(text),resolve(bg));if(r<4.5)throw new Error(`${theme}: ${text} on ${bg}: ${r.toFixed(2)} < 4.5`);checked++;}
 console.log(`✔ ${theme}: ${pairs.length} text/action/status token pairs ≥ 4.5:1`);
}
console.log(`Theme token contrast: ${checked}/${checked} passed. Not rendered accessibility QA.`);
