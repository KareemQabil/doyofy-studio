// Lossless delivery encoding only: no resizing, cropping or visual edits.
// Originals are retained outside public/; generated WebP variants are committed, so builds need no encoder.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const manifest=JSON.parse(fs.readFileSync('docs/GENERATED_ASSETS.json','utf8'));
for(const asset of manifest.assets){
 const output=asset.path.replace(/\.png$/,'.webp');
 const original=asset.original_path??path.join('design-source/generated',path.basename(asset.path));
 fs.mkdirSync(path.dirname(original),{recursive:true});fs.mkdirSync(path.dirname(output),{recursive:true});
 if(!asset.original_path&&asset.path.endsWith('.png')&&fs.existsSync(asset.path))fs.renameSync(asset.path,original);
 const r=spawnSync('ffmpeg',['-v','error','-y','-i',original,'-c:v','libwebp','-lossless','1','-compression_level','6',output],{encoding:'utf8'});
 if(r.status!==0)throw new Error(r.stderr||'Lossless encoder failed');
 asset.original_path=original;asset.path=output;
 const contents=fs.readFileSync(output);asset.bytes=contents.length;asset.sha256=createHash('sha256').update(contents).digest('hex');
 asset.delivery_encoding='lossless WebP; unchanged dimensions and visible appearance';
 console.log(`${asset.id}: ${fs.statSync(original).size} → ${asset.bytes} bytes`);
}
fs.writeFileSync('docs/GENERATED_ASSETS.json',JSON.stringify(manifest,null,2)+'\n');
