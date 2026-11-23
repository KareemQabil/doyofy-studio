import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DraftQueue } from '../../src/domain/draft-queue';
import { journeyStage, overviewFacts, rankAttention } from '../../src/domain/experience';
import { nextAction, needsAttention, type OverviewInput } from '../../src/domain/overview';
import type { Event, InvitationParty } from '../../src/domain/types';

const event: Event = { id:'e', ownerId:'o', slug:'test', type:'wedding', title:'زفاف', names:{a:'سارة',b:'أحمد'}, date:'2026-10-20', time:'20:00', timeZone:'Asia/Riyadh', durationHours:5, venue:{name:'قاعة',city:'الرياض'}, settings:{defaultPartySize:4,revealTableToGuests:false,allowGeneralLink:false},createdAt:'',updatedAt:'' };
const party = (patch: Partial<InvitationParty>={}): InvitationParty => ({id:'p',eventId:'e',code:'ABCDE',primaryGuestName:'عائلة',maxPartySize:4,delivery:{status:'shared'},rsvpStatus:'confirmed',confirmedPartySize:4,checkInStatus:'partial',checkedInCount:1,source:'manual',createdAt:'',updatedAt:'',...patch});
const input=(patch:Partial<OverviewInput>={}):OverviewInput=>({event,designed:true,parties:[party()],tables:[],responses:[],checkIns:[],now:new Date('2026-10-20T12:00:00Z'),...patch});

test('autosave serializes slow writes and coalesces rapid edits to the newest snapshot', async()=>{
  const written:number[]=[];let release:()=>void=()=>{};
  const q=new DraftQueue({value:0},async snapshot=>{written.push(snapshot.value);if(written.length===1)await new Promise<void>(r=>{release=r;});return snapshot.value;});
  q.update({value:1});const first=q.flush();q.update({value:2});q.update({value:3});const second=q.flush();
  assert.equal(first,second);assert.deepEqual(written,[1]);assert.equal(q.dirty,true);
  release();assert.equal(await first,3);assert.deepEqual(written,[1,3]);assert.equal(q.dirty,false);
});
test('failed save stays dirty and retries the latest edit, never reporting saved',async()=>{
  let fail=true;const values:string[]=[];const q=new DraftQueue('first',async v=>{if(fail)throw new Error('offline');values.push(v);return v;},true);
  await assert.rejects(q.flush(),/offline/);assert.equal(q.dirty,true);q.update('latest');fail=false;
  assert.equal(await q.flush(),'latest');assert.deepEqual(values,['latest']);assert.equal(q.dirty,false);
});
test('save uses immutable snapshots while edits are made during an in-flight write',async()=>{
  let release:()=>void=()=>{};const values:number[]=[];const initial={nested:{value:1}};
  const q=new DraftQueue(initial,async v=>{if(!values.length)await new Promise<void>(r=>{release=r;});values.push(v.nested.value);return v;},true);
  const saved=q.flush();initial.nested.value=2;q.update(initial);release();await saved;assert.deepEqual(values,[1,2]);
});
test('event-day and completed facts count remaining people inside partially arrived families',()=>{
  const i=input({parties:[party(),party({id:'p2',confirmedPartySize:2,checkedInCount:2,checkInStatus:'checked_in'}),party({id:'p3',rsvpStatus:'pending',checkedInCount:1})]});
  assert.deepEqual(overviewFacts(i).map(x=>x.value),[4,6,3]);
  assert.equal(overviewFacts({...i,now:new Date('2026-10-22T12:00:00Z')})[2]?.value,3);
});
test('journey follows date and reply state instead of a persisted UI flag (no publish step)',()=>{
  const before=new Date('2026-10-01T12:00:00Z');
  assert.equal(journeyStage(event,[],before),'prepare');
  assert.equal(journeyStage(event,[party({rsvpStatus:'pending'})],before),'invite');
  assert.equal(journeyStage(event,[party()],before),'arrange');
  assert.equal(journeyStage(event,[],new Date('2026-10-20T12:00:00Z')),'welcome');
  assert.equal(journeyStage(event,[],new Date('2026-10-22T12:00:00Z')),'remember');
});
test('late attention prioritizes table capacity; completed events suppress obsolete preparation tasks',()=>{
  const i=input({tables:[{id:'t',eventId:'e',name:'1',capacity:1,order:1}],parties:[party({tableId:'t',phone:undefined,rsvpStatus:'pending'}),party({id:'p2',tableId:'t'})]});
  const late=rankAttention(needsAttention(i),i);assert.equal(late[0]?.id,'over_capacity');
  assert.deepEqual(rankAttention(needsAttention(i),{...i,now:new Date('2026-10-22T12:00:00Z')}),[]);
});

test('ONE next action at a time: design → add guests → send → follow replies → reception; tables never block',()=>{
  const now=new Date('2026-10-01T12:00:00Z');
  const fresh=input({designed:false,parties:[],now});
  assert.equal(nextAction(fresh).target.to,'design');
  // design is a suggestion, never a gate: a saved design (or any guest) moves on to the guests
  assert.equal(nextAction({...fresh,designed:true}).target.to,'guests');
  const unsent=[party({rsvpStatus:'pending',delivery:{status:'not_shared'},checkedInCount:0,checkInStatus:'not_arrived'})];
  assert.deepEqual(nextAction({...fresh,parties:unsent}).target,{to:'guests',filter:'not_shared',share:'unsent'});
  assert.equal(nextAction({...fresh,parties:unsent}).label,'أرسل للضيوف');
  assert.equal(nextAction({...fresh,parties:[party({rsvpStatus:'pending',checkedInCount:0,checkInStatus:'not_arrived'})]}).target.to,'rsvp');
  // nothing about publishing is ever asked for
  for (const i of [fresh,{...fresh,parties:unsent}]) assert.ok(!needsAttention(i).some(x=>/publish/.test(x.id)));
});

test('the reception closes the journey; tables never block an event that has not opted into seating',()=>{
  const now=new Date('2026-10-18T12:00:00Z');
  const ready=input({now,parties:[party({checkedInCount:0,checkInStatus:'not_arrived'})]});
  assert.equal(nextAction(ready).target.to,'checkin');
  assert.equal(needsAttention(ready).some(x=>x.id==='unassigned'),false);
  const seated={...ready,tables:[{id:'t',eventId:'e',name:'طاولة',capacity:10,order:1}]};
  assert.equal(nextAction(seated).target.to,'seating');
});
