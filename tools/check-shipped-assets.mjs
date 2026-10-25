// Validate the deliverable rather than optional asset packs that are not shipped.
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist');const required=new Set();
// Theme and occasion artwork are chosen at runtime, so scan their canonical source paths too.
for(const file of fs.readdirSync('src', { recursive: true }).filter(f => /\.(?:tsx?|css|html)$/.test(f)).map(f => path.join('src', f))){
 if(!fs.existsSync(file))continue;
 for(const m of fs.readFileSync(file,'utf8').matchAll(/['"](assets\/[^'"]+\.(?:png|webp|svg|avif))['"]/g))required.add(m[1]);
}
for(const file of ['styles.css','ui.css','index.html']){
 const s=fs.readFileSync(path.join(root,file),'utf8');
 for(const m of s.matchAll(/(?:url\(["']?|(?:src|href)=["'])(assets\/[^"')\s>]+)/g))required.add(m[1]);
}
const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){
 const p=path.join(d,e.name);if(e.isDirectory()){walk(p);continue;}
 if(p.endsWith('.gltf.json')){const gltf=JSON.parse(fs.readFileSync(p,'utf8'));for(const ref of [...gltf.buffers??[],...gltf.images??[]])if(ref.uri&&!ref.uri.startsWith('data:'))required.add(path.relative(root,path.resolve(path.dirname(p),ref.uri)));}
}};walk(root);
const missing=[...required].filter(r=>!fs.existsSync(path.join(root,r)));if(missing.length)throw new Error(`Missing shipped assets: ${missing.join(', ')}`);
if(/fonts\.(googleapis|gstatic)/.test(fs.readFileSync(path.join(root,'index.html'),'utf8')))throw new Error('Remote font dependency remains');
console.log(`Shipped asset references: ${required.size}/${required.size} present; fonts self-hosted.`);
