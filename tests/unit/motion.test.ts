import test from 'node:test';
import assert from 'node:assert/strict';
import { SPRING, revealRelease, rubberBand, springDuration, springSettled, springStep } from '../../src/domain/motion';

test('snap spring settles within the planned 240–420ms window and never overshoots wildly',()=>{
  const ms=springDuration(0,100,0,SPRING.snap);
  assert.ok(ms>=200&&ms<=420,`settled in ${ms}ms`);
  let s={x:0,v:0},peak=0;for(let i=0;i<240;i++){s=springStep(s,100,1/120,SPRING.snap);peak=Math.max(peak,s.x);}
  assert.ok(peak<106,`peak ${peak}`);assert.ok(springSettled(s,100));
});
test('release velocity carries into the settle: a thrown card arrives sooner than a placed one',()=>{
  assert.ok(springDuration(0,300,2400,SPRING.snap)<springDuration(0,300,0,SPRING.snap));
});
test('rubber band resists more the further you pull and never exceeds the dimension',()=>{
  const a=rubberBand(40,100),b=rubberBand(400,100);
  assert.ok(a>0&&a<40);assert.ok(b<100&&b>a);assert.equal(rubberBand(-40,100),-a);assert.equal(rubberBand(0,100),0);
});
test('swipe rows: short drags close, half a tray opens, a long swipe commits that side only',()=>{
  const sides={start:true,end:true};
  assert.deepEqual(revealRelease(-20,0,92,360,sides),{open:null,commit:null});
  assert.deepEqual(revealRelease(-60,0,92,360,sides),{open:'start',commit:null});
  assert.deepEqual(revealRelease(60,0,92,360,sides),{open:'end',commit:null});
  assert.deepEqual(revealRelease(-240,0,92,360,sides),{open:null,commit:'start'});
  // a quick flick opens even a short drag, but only in the direction of travel
  assert.deepEqual(revealRelease(-30,-0.8,92,360,sides),{open:'start',commit:null});
  assert.deepEqual(revealRelease(-30,0.8,92,360,sides),{open:null,commit:null});
  // a side without actions never opens
  assert.deepEqual(revealRelease(240,0,92,360,{start:true,end:false}),{open:null,commit:null});
});
