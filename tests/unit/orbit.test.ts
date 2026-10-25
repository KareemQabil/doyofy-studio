import test from 'node:test';
import assert from 'node:assert/strict';
import {safeView,zoomAt,placeNode,readPositions,ORBIT_POSITIONS} from '../../src/domain/orbit';

test('spatial view is bounded without losing its focal point on zoom',()=>{
 const v={x:30,y:-20,scale:1},f={x:100,y:80},z=zoomAt(v,1.5,f);
 assert.equal((f.x-v.x)/v.scale,(f.x-z.x)/z.scale);
 assert.equal((f.y-v.y)/v.scale,(f.y-z.y)/z.scale);
 assert.deepEqual(safeView({x:10000,y:-9000,scale:4}),{x:650,y:-480,scale:1.6});
 assert.equal(zoomAt(v,.1).scale,.7);
});
test('mission positions snap and remain in the actual world',()=>{
 assert.deepEqual(placeNode({x:205,y:129}),{x:208,y:128});
 assert.deepEqual(placeNode({x:-500,y:9000}),{x:90,y:650});
 assert.equal(ORBIT_POSITIONS.length,7);
 for(const p of ORBIT_POSITIONS)assert.ok(p.x>=90&&p.x<=910&&p.y>=75&&p.y<=650);
});
test('stored mission layouts reject malformed shapes and values and clamp old coordinates',()=>{
 for(const s of [null,'bad','null','[]','42'])assert.deepEqual(readPositions(s),{});
 const parsed=readPositions('{"guests":{"x":200,"y":120},"checkin":{"x":9999,"y":-80},"bad":{"x":"200","y":null},"__proto__":{"x":1,"y":2}}');
 assert.deepEqual(parsed,{guests:{x:200,y:120},checkin:{x:910,y:75}});
});
