import test from 'node:test';
import assert from 'node:assert/strict';
// The invitation runtime is native JavaScript; this test exercises the actual module.
// @ts-expect-error AudioEngine has no TypeScript declaration.
import { AudioEngine } from '../../src/engine/AudioEngine.js';
test('failed audio preloads are handled and the next cue uses its synth fallback',async(t)=>{
 t.mock.method(globalThis,'fetch',async()=>{throw new Error('offline');});
 const audio=new AudioEngine();audio.usePack({cues:{open:{file:'missing.mp3',synth:'open'}}});
 await new Promise(r=>setTimeout(r,10)); // node:test also fails on any unhandled preload rejection.
 assert.equal(audio.buffers.get('missing.mp3'),'failed');
 let synthesized='';audio.ac={currentTime:0};audio._synth=(name:string)=>{synthesized=name;};
 await audio.emit('open');assert.equal(synthesized,'open');assert.deepEqual(audio.stats.fallbacks,['missing.mp3']);
});
test('without-sound preference suppresses cues, music and ambience', async () => {
 const audio=new AudioEngine();audio.usePack({cues:{open:{synth:'open'}},music:true});
 audio.ac={currentTime:0};let synthesized=false;audio._synth=()=>{synthesized=true;};
 audio.setPreference({mode:'off'});await audio.emit('open');audio.startMusic();await audio.setAmbience({file:'anything.mp3'});
 assert.equal(synthesized,false);assert.equal(audio.music,null);assert.equal(audio.amb,null);
});
test('missing uploaded tracks fall back to built-in music without exposing file bytes', () => {
 const audio=new AudioEngine();audio.setPreference({mode:'library',trackId:'missing'});
 assert.equal(audio.missingUpload,true);assert.equal(audio.customTrack,null);
});
test('uploaded soundtrack loops through the master gain and mute stops it', async () => {
 const audio=new AudioEngine();let started=0,stopped=0;const connected:unknown[]=[];
 const source={buffer:null,loop:false,connect:(to:unknown)=>connected.push(to),start:()=>started++,stop:()=>stopped++};
 const gain={gain:{value:0},connect:(to:unknown)=>connected.push(to)};
 audio.ac={createBufferSource:()=>source,createGain:()=>gain,currentTime:0};audio.master={gain:{setTargetAtTime:()=>{}}};
 audio.customTrack={dataUrl:'data:audio/mpeg;base64,YWJj'};audio._buffer=async()=>({decoded:true});
 audio.startMusic();await new Promise(r=>setImmediate(r));
 assert.equal(started,1);assert.equal(source.loop,true);assert.equal(connected[1],audio.master);
 audio.setEnabled(false);assert.equal(stopped,1);assert.equal(audio.customMusic,null);
});
test('muting while an upload decodes prevents a late soundtrack from starting', async () => {
 const audio=new AudioEngine();let resolve:(v:unknown)=>void=()=>{};let started=0;
 audio.ac={createBufferSource:()=>({connect:()=>{},start:()=>started++}),createGain:()=>({gain:{value:0},connect:()=>{}}),currentTime:0};
 audio.master={gain:{setTargetAtTime:()=>{}}};audio.customTrack={dataUrl:'data:audio/mpeg;base64,YWJj'};
 audio._buffer=()=>new Promise(r=>{resolve=r;});audio.startMusic();audio.setEnabled(false);resolve({decoded:true});
 await new Promise(r=>setImmediate(r));assert.equal(started,0);
});
