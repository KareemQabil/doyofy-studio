import test from 'node:test';
import assert from 'node:assert/strict';
import { lockAxis, swipeStep, sheetSnap, shouldDismiss, startsAtScreenEdge } from '../../src/domain/gestures';
import { isAppearance } from '../../src/domain/appearance';

test('appearance values are recognized; unknown URLs cannot set one',()=>{
  for(const a of ['light','dark','system'])assert.ok(isAppearance(a));
  for(const t of ['unknown','DARK','signature',null,undefined,{}])assert.equal(isAppearance(t),false);
});
test('horizontal browsing gives vertical scrolling priority and ignores tap jitter',()=>{
  assert.equal(lockAxis(4,6,'x'),'pending');assert.equal(lockAxis(22,60,'x'),'rejected');
  assert.equal(lockAxis(30,28,'x'),'pending');assert.equal(lockAxis(35,5,'x'),'locked');
  assert.equal(swipeStep(-100,130,80),0);assert.equal(swipeStep(-6,0,10),0);
});
test('RTL: the page follows the finger — a swipe right is next, left is back; an intentional short flick counts',()=>{
  assert.equal(swipeStep(80,2,600),1);assert.equal(swipeStep(-80,2,600),-1);
  assert.equal(swipeStep(32,2,40),1);assert.equal(swipeStep(32,2,600),0);
});
test('touches starting in the 24px screen edges are left to the system back gesture (FX-09)',()=>{
  assert.equal(startsAtScreenEdge(10,390),true);assert.equal(startsAtScreenEdge(380,390),true);
  assert.equal(startsAtScreenEdge(24,390),false);assert.equal(startsAtScreenEdge(200,390),false);
});
test('editor panel snaps with deliberate motion and small adjustments retain its state',()=>{
  assert.equal(sheetSnap(-70,-.2,'half'),'full');assert.equal(sheetSnap(80,.2,'full'),'half');
  assert.equal(sheetSnap(-24,-.8,'half'),'full');assert.equal(sheetSnap(15,.9,'full'),'full');
});
test('drawer dismisses only with deliberate downward drag or flick',()=>{
  assert.equal(shouldDismiss(120,.1),true);assert.equal(shouldDismiss(40,.8),true);
  assert.equal(shouldDismiss(-180,-1),false);assert.equal(shouldDismiss(20,1),false);
  assert.equal(shouldDismiss(70,.2),false);
});

import { deckDragPosition, deckRelease, deckPose, sheetSnapPoint, sheetSnapHeight, sealOpens } from '../../src/domain/gestures';
test('deck: the card follows the finger — dragging right pulls the next card in (RTL), with resistance past the ends', () => {
  assert.equal(deckDragPosition(2, 100, 100, 13), 3);
  assert.equal(deckDragPosition(2, -100, 100, 13), 1);
  assert.ok(deckDragPosition(0, -200, 100, 13) > -1 && deckDragPosition(0, -200, 100, 13) < 0, 'first card rubber-bands');
  assert.ok(deckDragPosition(12, 200, 100, 13) < 13, 'last card rubber-bands');
  // the next card sits on the left (negative x); after a right drag of one step it reaches the centre
  const start = 2, step = 100, next = 3;
  assert.ok(Math.abs(deckPose(next - deckDragPosition(start, step, step, 13), 200).x) < 1e-9);
  // and every card moves the same way the finger does
  assert.ok(deckPose(next - deckDragPosition(start, 30, step, 13), 200).x > deckPose(next - start, 200).x);
});
test('deck: release snaps; a normal swipe moves one card, only a fast fling moves two (FX-05)', () => {
  assert.equal(deckRelease(3.1, 0, 100, 13, 3).target, 3, 'tiny drift settles back');
  assert.equal(deckRelease(3.3, 0, 100, 13, 3).target, 4, '30% of a card is a step');
  assert.equal(deckRelease(2.7, 0, 100, 13, 3).target, 2);
  assert.equal(deckRelease(3.4, 1, 100, 13, 3).target, 4, 'a medium swipe is exactly one card');
  assert.equal(deckRelease(3.2, 3, 100, 13, 3).target, 5, 'a fast rightward fling is capped at 2 cards');
  assert.equal(deckRelease(2.8, -3, 100, 13, 3).target, 1, 'and leftward too');
  assert.equal(deckRelease(0.1, -2, 100, 13, 0).target, 0, 'never before the first card');
  assert.equal(deckRelease(12.2, 2, 100, 13, 12).target, 12, 'never after the last card');
});
test('deck: poses put next cards on the left and fade far ones', () => {
  assert.ok(deckPose(1, 200).x < 0 && deckPose(-1, 200).x > 0);
  assert.equal(deckPose(0, 200).scale, 1);
  assert.equal(deckPose(3, 200).opacity, 0);
  assert.ok(deckPose(0, 200).z > deckPose(1, 200).z);
});
test('sheet: snaps to the nearest stop, flings move one stop', () => {
  assert.equal(sheetSnapPoint(0.5, 0, 'half'), 'half');
  assert.equal(sheetSnapPoint(0.85, 0, 'half'), 'full');
  assert.equal(sheetSnapPoint(0.3, 0, 'half'), 'peek');
  assert.equal(sheetSnapPoint(0.5, -1, 'half'), 'full');
  assert.equal(sheetSnapPoint(0.5, 1, 'peek'), 'peek');
});
test('editor sheet snaps against rendered pixel stops when the keyboard shrinks the viewport', () => {
  const stops = { peek: 88, half: 216, full: 264 };
  assert.equal(sheetSnapHeight(224, 0, 'peek', stops), 'half');
  assert.equal(sheetSnapHeight(256, 0, 'half', stops), 'full');
  assert.equal(sheetSnapHeight(224, 0.8, 'full', stops), 'half');
});
test('seal: opens on a long lift or a quick flick, not on a nudge or a downward pull', () => {
  assert.ok(sealOpens(-80, 0, 120));
  assert.ok(sealOpens(-30, -0.9, 120));
  assert.ok(!sealOpens(-20, -0.2, 120));
  assert.ok(!sealOpens(60, 0.9, 120));
});
