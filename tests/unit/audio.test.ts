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
/** a minimal Web Audio stand-in that records what the engine asks of it */
function fakeContext() {
 const log={sources:[] as any[],gains:[] as any[]};
 const param=()=>({value:1,calls:[] as unknown[][],setValueAtTime(...a:unknown[]){this.calls.push(['set',...a]);},linearRampToValueAtTime(...a:unknown[]){this.calls.push(['ramp',...a]);},setTargetAtTime(...a:unknown[]){this.calls.push(['target',...a]);this.value=a[0] as number;}});
 const ac={currentTime:5,
  createBufferSource:()=>{const s:any={buffer:null,loop:false,loopStart:0,loopEnd:0,connected:[] as unknown[],started:[] as unknown[],stopped:0,onended:null,connect(to:unknown){s.connected.push(to);},start(...a:unknown[]){s.started.push(a);},stop(){s.stopped++;}};log.sources.push(s);return s;},
  createGain:()=>{const g:any={gain:param(),connected:[] as unknown[],connect(to:unknown){g.connected.push(to);}};log.gains.push(g);return g;}};
 return {ac,log,master:{gain:param()}};
}
test('uploaded soundtrack starts at its chosen point, fades in, loops back to it through the music bus, and mute stops it', async () => {
 const audio=new AudioEngine();const {ac,log,master}=fakeContext();audio.ac=ac;audio.master=master;
 audio.customTrack={id:'a1',kind:'music',startSec:42,fadeInSec:1.5};audio._uploadBuffer=async()=>({duration:180});
 audio.startMusic();await new Promise(r=>setImmediate(r));
 const src=log.sources[0];assert.deepEqual(src.started,[[5,42]]);assert.equal(src.loop,true);assert.equal(src.loopStart,42);assert.equal(src.loopEnd,180);
 const gain=log.gains.find((g:any)=>src.connected.includes(g));assert.deepEqual(gain.gain.calls,[['set',0.0001,5],['ramp',0.2,6.5]]);
 assert.equal(gain.connected[0],audio.musicBus);assert.equal(audio.musicBus.connected[0],master);
 audio.setEnabled(false);assert.equal(src.stopped,1);assert.equal(audio.customMusic,null);
});
test('muting while an upload decodes prevents a late soundtrack from starting', async () => {
 const audio=new AudioEngine();let resolve:(v:unknown)=>void=()=>{};const {ac,log,master}=fakeContext();audio.ac=ac;audio.master=master;
 audio.customTrack={id:'a1',kind:'music',startSec:0,fadeInSec:0};
 audio._uploadBuffer=()=>new Promise(r=>{resolve=r;});audio.startMusic();audio.setEnabled(false);resolve({duration:30});
 await new Promise(r=>setImmediate(r));assert.equal(log.sources.length,0);
});
test('an upload whose bytes are not on this device falls back to the built-in music', async () => {
 const audio=new AudioEngine();const {ac,master}=fakeContext();audio.ac=ac;audio.master=master;audio.pack={music:true,cues:{}};
 audio.customTrack={id:'gone',kind:'music',startSec:0,fadeInSec:0};audio._uploadBuffer=async()=>'failed';let changed=0;audio.onChange=()=>changed++;
 audio.startMusic();await new Promise(r=>setImmediate(r));
 assert.equal(audio.customTrack,null);assert.equal(audio.missingUpload,true);assert.ok(audio.music,'built-in arpeggio runs');assert.equal(changed,1);
 audio.stopMusic();
});
test('voice welcome plays once from the start, ducks the music bus and restores it when it ends', async () => {
 const audio=new AudioEngine();const {ac,log,master}=fakeContext();audio.ac=ac;audio.master=master;
 audio.voiceTrack={id:'v1',kind:'voice',startSec:0,fadeInSec:0};audio._uploadBuffer=async()=>({duration:12});
 audio._bus();
 assert.equal(await audio.playVoice(),true);
 const src=log.sources[0];assert.equal(src.loop,false);assert.equal(src.started.length,1);assert.equal(audio.voicePlaying,true);assert.equal(audio.voicePlayed,true);
 assert.equal(audio.musicBus.gain.value,0.25,'music ducks under the voice');
 src.onended();assert.equal(audio.voicePlaying,false);assert.equal(audio.musicBus.gain.value,1,'music returns after the welcome');
});
test('muting stops the voice; without a voice track or before a gesture nothing plays', async () => {
 const audio=new AudioEngine();const {ac,log,master}=fakeContext();
 assert.equal(await audio.playVoice(),false,'no track');
 audio.voiceTrack={id:'v1',kind:'voice',startSec:0,fadeInSec:0};assert.equal(await audio.playVoice(),false,'no AudioContext before a gesture');
 audio.ac=ac;audio.master=master;audio._uploadBuffer=async()=>({duration:12});
 await audio.playVoice();audio.setEnabled(false);assert.equal(log.sources[0].stopped,1);assert.equal(audio.voicePlaying,false);
});
test('a voice welcome whose bytes are elsewhere stays hidden and silent (guest on another device)', async () => {
 const audio=new AudioEngine();let changed=0;audio.onChange=()=>changed++;
 audio.setPreference({mode:'builtin',voiceId:'v-elsewhere'});
 await new Promise(r=>setTimeout(r,5));
 assert.equal(audio.voiceTrack,null);assert.equal(audio.voiceReady,false);assert.ok(changed>=1);
});
