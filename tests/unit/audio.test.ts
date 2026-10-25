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
