import assert from 'node:assert/strict';
import { saveDemoAccount, currentDemoAccount } from '../../src/features/account/session';
import { EditorWorkbench } from '../../src/features/editor/EditorWorkbench';
import { defaultDesign } from '../../src/domain/invitation';
import { App } from '../../src/app/App';
import { paths } from '../../src/app/paths';
import { act, StrictMode, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Dialog, ConfirmDialog } from '../../src/ui/primitives/Overlay';
import { CuratedChooser } from '../../src/features/occasions/CuratedChooser';
import { PartyDrawer } from '../../src/features/guests/PartyDrawer';
import { GateMode } from '../../src/features/check-in/GateMode';
import { RsvpPage } from '../../src/features/rsvp/RsvpPage';
import { AppError } from '../../src/services/errors';
import { Studio } from '../../src/studio/Studio.js';
import { ImportFlow } from '../../src/features/guests/import/ImportFlow';
import { SettingsPage } from '../../src/features/settings/SettingsPage';
import { GuestHub } from '../../src/features/guest/GuestHub';
import { ServicesProvider, useMutation } from '../../src/app/data';
import { RouterProvider, matchPath } from '../../src/app/router';
import { createServices } from '../../src/services';
import type { EventType } from '../../src/domain/types';
import { AppearanceSwitch } from '../../src/ui/primitives/AppearanceSwitch';
import { ThemeSync, applyReviewLink } from '../../src/app/review';
import { TemplatePreview } from '../../src/features/templates/TemplatePreview';
import { TEMPLATE_PRESETS } from '../../src/domain/templates';
import { presetOf } from '../../src/domain/templates';
import { Field, Input } from '../../src/ui/primitives/Form';
import { TactileDeck } from '../../src/ui/primitives/TactileDeck';
import { GuestsPage } from '../../src/features/guests/GuestsPage';
import { SeatingPage } from '../../src/features/seating/SeatingPage';
import { usePointerGesture } from '../../src/ui/hooks/usePointerGesture';
import { experienceOf, mealReport } from '../../src/domain/guest-experience';

export async function run(){
 let root:Root;
 const setup=()=>{root=createRoot(document.getElementById('root')!);};
 const render=async(node:React.ReactNode)=>{await act(async()=>{root.render(node);});};
 const clear=async()=>{await act(async()=>root.unmount());};
 const click=async(el:Element)=>{await act(async()=>{el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));});};
 const pointer=async(el:Element,type:string,x:number,y:number,t:number,id=1)=>{await act(async()=>{
  const e=new Event(type,{bubbles:true,cancelable:true});
  Object.defineProperties(e,{pointerId:{value:id},isPrimary:{value:id===1},button:{value:0},clientX:{value:x},clientY:{value:y},timeStamp:{value:t}});el.dispatchEvent(e);
 });};
 const settle=async()=>{for(let i=0;i<12;i++)await act(async()=>{await new Promise(r=>setTimeout(r,15));});};
 const key=async(el:Element,value:string)=>{await act(async()=>{el.dispatchEvent(new KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true}));});};
 const fill=async(el:HTMLInputElement,value:string)=>{await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));});};
 const button=(text:string)=>{const el=Array.from(document.querySelectorAll('button')).find(e=>e.textContent?.includes(text));assert.ok(el,`button: ${text}`);return el;};
 let passed=0;
 const check=async(name:string,fn:()=>Promise<void>)=>{setup();try{await fn();passed++;console.log('✔ DOM: '+name);}finally{await clear();}};
 await check('dialog unmount clears scroll lock and returns focus',async()=>{
  const trigger=document.getElementById('trigger')!;trigger.focus();await render(<Dialog open title="Title" onClose={()=>{}}><input/></Dialog>);
  assert.equal(document.querySelectorAll('dialog[open]').length,1);assert.ok(document.documentElement.classList.contains('has-dialog'));
  await render(null);assert.equal(document.documentElement.classList.contains('has-dialog'),false);assert.equal(document.activeElement,trigger);
 });
 await check('destructive confirmation starts on the safe choice',async()=>{
  await render(<ConfirmDialog open tone="danger" title="حذف؟" confirmLabel="حذف" onConfirm={()=>{}} onCancel={()=>{}}/>);assert.equal(document.activeElement?.textContent,'تراجع');
 });
 await check('RTL occasion keyboard selection wraps and exposes checked state',async()=>{
  function Chooser(){const [v,setV]=useState<EventType|null>(null);return <CuratedChooser value={v} onChange={setV}/>;}
  await render(<ServicesProvider {...createServices()}><Chooser/></ServicesProvider>);const radios=Array.from(document.querySelectorAll<HTMLButtonElement>('[role="radio"]'));assert.equal(radios.length,13);radios[0]!.focus();
  await act(async()=>{radios[0]!.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));});
  assert.equal(document.activeElement,radios[1]);assert.equal(radios[1]!.getAttribute('aria-checked'),'true');assert.equal(radios[1]!.tabIndex,0);
  await act(async()=>{radios[1]!.dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true}));});assert.equal(document.activeElement,radios[12]);await key(radios[12]!,'ArrowDown');assert.equal(document.activeElement,radios[12]);await key(radios[12]!,'Home');await key(radios[0]!,'ArrowUp');assert.equal(document.activeElement,radios[0]);
 });
 const made=createServices();made.prototype.update({latencyMs:0,appearance:'light'});made.prototype.reset('before');
 const wrap=(node:React.ReactNode)=><ServicesProvider {...made}><RouterProvider mode="history">{node}</RouterProvider></ServicesProvider>;
 const event=await made.services.events.get('evt_wedding');
 await check('opening WhatsApp never marks delivery; explicit confirmation does',async()=>{
  const p=await made.services.parties.create(event.id,{primaryGuestName:'اختبار',phone:'0559876543',maxPartySize:2});
  await render(wrap(<PartyDrawer event={event} party={p} all={[p]} tables={[]} publish="published" onClose={()=>{}}/>));
  const link=document.querySelector('a[href^="https://wa.me"]')!;assert.ok(link);link.addEventListener('click',e=>e.preventDefault());await click(link);
  assert.equal((await made.services.parties.get(p.id)).delivery.status,'not_shared');await click(button('نعم، أرسلته'));assert.equal((await made.services.parties.get(p.id)).delivery.status,'shared');
 });
 await check('guest row places WhatsApp beside the name without assuming the message was sent',async()=>{
  const p=await made.services.parties.create(event.id,{primaryGuestName:'ضيف مشاركة مباشرة',phone:'0559876544',maxPartySize:2});
  await render(wrap(<GuestsPage event={event}/>));await settle();
  const row=Array.from(document.querySelectorAll('.g2-row')).find(el=>el.textContent?.includes('ضيف مشاركة مباشرة'))!;
  const link=row.querySelector<HTMLAnchorElement>('.g2-share-line .g2-wa[href^="https://wa.me/"]')!;assert.ok(link);
  link.addEventListener('click',e=>e.preventDefault());await click(link);
  assert.equal((await made.services.parties.get(p.id)).delivery.status,'not_shared');
  assert.ok(document.body.textContent?.includes('فتح واتساب يجهّز الرسالة فقط'));
  await click(button('نعم، أرسلتها يدويًا'));
  assert.equal((await made.services.parties.get(p.id)).delivery.status,'shared');
 });
 await check('guest editing replaces parent dialog instead of stacking modals',async()=>{
  const p=await made.services.parties.create(event.id,{primaryGuestName:'ضيف الحوار',maxPartySize:2});
  await render(wrap(<PartyDrawer event={event} party={p} all={[p]} tables={[]} publish="published" onClose={()=>{}}/>));await click(button('سجّل الرد يدويًا'));
  assert.equal(document.querySelectorAll('dialog[open]').length,1);assert.ok(document.documentElement.classList.contains('has-dialog'));
 });
 await check('general guest reply reaches the matching queue without cinematic playback',async()=>{
  const view=await made.services.guest.open(event.slug,null);let saved=false;
  await render(wrap(<GuestHub view={view} code={null} submission={null} onView={()=>{saved=true;}} onReplay={()=>{}}/>));
  const input=document.querySelector<HTMLInputElement>('input[autocomplete="name"]')!;assert.ok(input);
  await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,'ضيف الاختبار');input.dispatchEvent(new Event('input',{bubbles:true}));});
  await click(document.querySelector('input[type=radio][value=yes]')!);
  await act(async()=>{document.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
  assert.equal(saved,true);assert.ok((await made.services.rsvp.listResponses(event.id)).some(r=>r.name==='ضيف الاختبار'&&!r.partyId));
 });
 await check('general replies remain actionable with no invitation parties',async()=>{
  const created=await made.services.events.create({type:'graduation',names:{a:'رد بلا قائمة'},date:event.date,time:'19:00',venue:{name:'قاعة',city:'الرياض'}});
  const ev=await made.services.events.update(created.id,{settings:{...created.settings,allowGeneralLink:true}});
  await made.services.invitations.publish(ev.id);
  await made.services.guest.submitRsvp(ev.slug,null,{name:'ضيف من الرابط العام',attending:true,count:1});
  history.replaceState(null,'',paths.rsvp(ev.id));
  await render(wrap(<RsvpPage event={ev}/>));await settle();
  assert.ok(document.body.textContent?.includes('ضيف من الرابط العام'));
  assert.ok(button('أضفه كضيف جديد'));
 });
 await check('Studio waits for RSVP receipt and permits retry after a rejected save',async()=>{
  let resolve!:(value:{ok:boolean;id?:string;error?:string})=>void;
  let submissions=0,success=0;
  const fake={sm:{state:'pages',send:(event:string)=>{if(event==='submit')success++;}},
    rsvp:{name:'ريم',attending:'yes',guests:2,sent:false,submitting:false,error:''},
    rsvpAdapter:{submit:()=>{submissions++;return new Promise<{ok:boolean;id?:string;error?:string}>(r=>{resolve=r;});}},
    _syncRsvp:()=>{}};
  const submit=()=>((Studio.prototype as unknown as {submit:()=>Promise<void>}).submit.call(fake));
  const first=submit();assert.equal(fake.rsvp.submitting,true);assert.equal(success,0);
  resolve({ok:false,error:'تعذر الحفظ'});await first;assert.equal(fake.rsvp.sent,false);assert.equal(fake.rsvp.submitting,false);assert.equal(fake.rsvp.error,'تعذر الحفظ');assert.equal(success,0);
  const retry=submit();assert.equal(submissions,2);resolve({ok:true,id:'receipt'});await retry;assert.equal(success,1);assert.equal(fake.rsvp.sent,true);
 });
 await check('StrictMode mutations retain error feedback after mount cleanup',async()=>{
  function Fail(){const m=useMutation(async()=>{throw new Error('خطأ اختبار');});return <><button onClick={()=>void m.run()}>جرّب</button>{m.error?<p>تعذر الحفظ</p>:null}</>;}
  await render(wrap(<StrictMode><Fail/></StrictMode>));await click(button('جرّب'));assert.ok(document.body.textContent?.includes('تعذر الحفظ'));
 });
 await check('appearance switch persists light/dark/system and leaves the invitation unchanged',async()=>{
  const before=await made.services.invitations.get(event.id);
  await render(wrap(<><ThemeSync/><AppearanceSwitch/></>));
  for(const [label,id,resolved] of [['داكن','dark','dark'],['فاتح','light','light']] as const){await click(button(label));assert.equal(made.prototype.settings().appearance,id);assert.equal(document.documentElement.dataset.appearance,resolved);assert.equal(document.documentElement.dataset.theme,'signature');}
  assert.deepEqual(await made.services.invitations.get(event.id),before);
  assert.equal(createServices().prototype.settings().appearance,'light');
 });
 await check('drawer swipe cancel resets drag; downward drag closes; busy blocks it',async()=>{
  let closed=0;const show=(busy=false)=><Dialog open title="لوحة" variant="drawer" dismissible={!busy} onClose={()=>closed++}><p>محتوى</p></Dialog>;
  await render(show());const grip=document.querySelector('.sheet-grip')!;
  await pointer(grip,'pointerdown',0,0,0);await pointer(grip,'pointermove',0,130,400);await pointer(grip,'pointercancel',0,130,500);
  assert.equal(closed,0);assert.equal(document.querySelector('.dialog-panel')!.getAttribute('data-dragging'),null);
  await pointer(grip,'pointerdown',0,0,1000);await pointer(grip,'pointermove',0,130,1400);await pointer(grip,'pointerup',0,130,1500);assert.equal(closed,1);
  await render(show(true));await pointer(grip,'pointerdown',0,0,2000);await pointer(grip,'pointermove',0,160,2200);await pointer(grip,'pointerup',0,160,2400);assert.equal(closed,1);
 });
 await check('child capture transfer and second pointer do not cancel the active deck gesture',async()=>{
  const ends:Array<{cancelled:boolean;moved:boolean}>=[];
  function Surface(){const gesture=usePointerGesture({axis:'x',onEnd:g=>ends.push(g)});return <div id="surface" {...gesture}><button data-gesture-surface id="child">بطاقة</button></div>;}
  await render(<Surface/>);
  const surface=document.getElementById('surface')!,child=document.getElementById('child')!;
  await pointer(child,'pointerdown',100,0,0);
  await pointer(child,'lostpointercapture',100,0,10);
  await pointer(surface,'pointermove',50,0,100);
  await pointer(surface,'pointerdown',40,0,120,2);
  await pointer(surface,'pointerup',40,0,130,2);
  await pointer(surface,'pointerup',50,0,200);
  assert.equal(ends.length,1);assert.equal(ends[0]!.cancelled,false);assert.equal(ends[0]!.moved,true);
 });
 await check('deck cards follow the finger in RTL: a right drag moves them right and brings the next card (FX-01, FX-02)',async()=>{
  try{localStorage.setItem('doyofy:deck-hint','1');}catch{}
  let at=0;function Deck(){const[i,setI]=useState(2);at=i;return <TactileDeck items={['a','b','c','d','e']} index={i} onIndexChange={setI} getKey={x=>x} renderCard={x=><span>{x}</span>} itemLabel={x=>x} label="deck"/>;}
  await render(<Deck/>);
  const card=(n:number)=>document.querySelectorAll<HTMLElement>('.deck-card')[n]!;const x=(el:HTMLElement)=>Number(/translate3d\((-?[\d.]+)px/.exec(el.style.transform)?.[1]??NaN);
  const surface=document.querySelector('.deck-stage')!;const before=x(card(2)),nextBefore=x(card(3));assert.ok(nextBefore<before,'the next card waits on the left');
  await pointer(surface,'pointerdown',200,100,1000);await pointer(surface,'pointermove',260,102,1060);
  assert.ok(x(card(2))>before,'the active card moved right with the finger');assert.ok(x(card(3))>nextBefore,'the next card moved right too');
  await pointer(surface,'pointermove',300,102,1400);await pointer(surface,'pointerup',300,102,1600);await settle();
  assert.equal(at,3,'a right swipe lands on the next card');
 });
 await check('a pointer that leaves the surface before locking still completes, and a lost release never blocks the next gesture',async()=>{
  const ends:Array<{cancelled:boolean;moved:boolean;dy:number}>=[];
  function Surface(){const gesture=usePointerGesture({axis:'y',onEnd:g=>ends.push(g)});return <div><div id="surface" {...gesture}>ختم</div><div id="elsewhere">خارج</div></div>;}
  await render(<Surface/>);
  const surface=document.getElementById('surface')!,elsewhere=document.getElementById('elsewhere')!;
  // a fast mouse: the first move already lands outside the surface; the window listener carries it
  await pointer(surface,'pointerdown',10,200,0);
  await pointer(elsewhere,'pointermove',10,90,20);
  await pointer(elsewhere,'pointerup',10,60,40);
  assert.equal(ends.length,1);assert.equal(ends[0]!.cancelled,false);assert.equal(ends[0]!.moved,true);assert.equal(ends[0]!.dy,-140);
  // a press whose release was never delivered: the next press cancels it and starts fresh
  await pointer(surface,'pointerdown',10,200,100);
  await pointer(surface,'pointerdown',10,200,300);
  assert.equal(ends.length,2);assert.equal(ends[1]!.cancelled,true);
  await pointer(surface,'pointermove',10,120,320);
  await pointer(surface,'pointerup',10,100,340);
  assert.equal(ends.length,3);assert.equal(ends[2]!.cancelled,false);assert.equal(ends[2]!.moved,true);
 });
 await check('vertical template browsing supports scroll and keyboard without applying a design',async()=>{
  const design=await made.services.invitations.get(event.id);let navigated='',used=0;
  const rail=TEMPLATE_PRESETS.filter((p,i)=>TEMPLATE_PRESETS.findIndex(x=>x.cardId===p.cardId)===i);const mid=rail[1]!,NEXT=rail[2]!.id,PREV=rail[0]!.id;
  const show=(pending=false)=>wrap(<TemplatePreview event={event} base={design.draft} presets={TEMPLATE_PRESETS} preset={mid} isCurrent={false} pending={pending} onNavigate={p=>{navigated=p.id;}} onClose={()=>{}} onUse={()=>{used++;}}/>);
  await render(show());assert.equal(document.querySelector('.live-preview'),null);
  const stage=document.querySelector<HTMLElement>('.template-feed-scroll')!;assert.ok(stage);
  await key(stage,'ArrowDown');assert.equal(navigated,NEXT);await key(stage,'ArrowUp');assert.equal(navigated,PREV);
  navigated='';await key(document.querySelector('.template-feed-nav button')!,'ArrowDown');assert.equal(navigated,'','arrows in a button must not bubble into feed navigation');
  Object.defineProperty(stage,'clientHeight',{value:400,configurable:true});stage.scrollTop=0;
  await act(async()=>{stage.dispatchEvent(new Event('scroll',{bubbles:true}));await new Promise(r=>setTimeout(r,130));});
  assert.equal(navigated,PREV);assert.equal(used,0,'browsing never applies a template');
  await click(document.querySelector('.tp .dialog-foot .btn-primary')!);assert.equal(used,1);
  navigated='';await render(show(true));await key(stage,'ArrowDown');assert.equal(navigated,'','busy feed cannot change the design');
 });
 await check('review URLs set the appearance and ignore unknown values (and the retired ?theme=)',async()=>{
  history.replaceState(null,'','/app/events?appearance=dark');applyReviewLink(made.prototype);assert.equal(document.documentElement.dataset.appearance,'dark');
  history.replaceState(null,'','/app/events?appearance=neon&theme=orbit');applyReviewLink(made.prototype);assert.equal(made.prototype.settings().appearance,'dark');assert.equal(document.documentElement.dataset.theme,'signature');
  history.replaceState(null,'','/app/events');await act(async()=>{made.prototype.update({appearance:'light'});});
 });
 await check('phone editor snaps up/down and cancellation preserves the current panel',async()=>{
  history.replaceState(null,'','/app/events/evt_wedding/invitation/design');
  await render(<App mode="history"/>);for(let i=0;i<12;i++)await act(async()=>{await new Promise(r=>setTimeout(r,15));});
  const handle=document.querySelector('.ed-handle')!;assert.ok(handle);
  assert.ok(document.querySelector('.ed.at-peek'),'editing starts with a large card');await key(handle,'ArrowUp');
  // jsdom has no layout: supply the panel geometry this position-based gesture actually measures.
  const panel=document.querySelector<HTMLElement>('.ed-panel')!;
  const measure=panel.getBoundingClientRect.bind(panel);
  panel.getBoundingClientRect=()=>{
   const rect=measure();const stop=handle.getAttribute('data-stop');
   const base=stop==='full'?window.innerHeight-Math.max(128,Math.min(240,window.innerHeight*.3)):stop==='peek'?96:window.innerHeight*.5;
   return Object.assign(rect,{height:base-(parseFloat(panel.style.getPropertyValue('--drag'))||0)});
  };
  await pointer(handle,'pointerdown',100,200,0);await pointer(handle,'pointermove',100,80,200);await pointer(handle,'pointerup',100,80,300);assert.ok(document.querySelector('.ed.at-full'));
  await pointer(handle,'pointerdown',100,80,400);await pointer(handle,'pointermove',100,200,600);await pointer(handle,'pointercancel',100,200,700);assert.ok(document.querySelector('.ed.at-full'));
  await pointer(handle,'pointerdown',100,80,800);await pointer(handle,'pointermove',100,200,1000);await pointer(handle,'pointerup',100,200,1100);assert.ok(document.querySelector('.ed.at-half'));
 });
 await check('phone editor: the tab row opens and hides the tools, typing keeps a live mini card, publishing and «بحجم أكبر» return to the card',async()=>{
  history.replaceState(null,'','/app/events/evt_wedding/invitation/design');await render(<App mode="history"/>);await settle();
  const api=(window as unknown as {__doyofy:typeof made}).__doyofy.services,original=(await api.invitations.get(event.id)).draft;
  const ed=()=>document.querySelector('.ed')!.className,tab=()=>document.querySelector('#ed-tab-content')!;
  try {
   assert.ok(/at-peek/.test(ed()),'the card leads');assert.equal(document.querySelectorAll('.ed-dock').length,0,'no second action bar');
   assert.equal(document.querySelectorAll('.ed-publish').length,1,'one primary action, in the header');
   await click(tab());assert.ok(/at-half/.test(ed()),'a section opens the tools');
   await click(tab());assert.ok(/at-peek/.test(ed()),'the open section hides them again');
   await click(tab());
   const name=document.querySelector<HTMLInputElement>('.ed-content-names input')!;
   await act(async()=>{name.focus();});
   assert.ok(/at-full/.test(ed())&&/is-typing/.test(ed()),'typing: the sheet takes the room the keyboard leaves');
   await fill(name,'نورة المصغّرة');assert.ok(document.querySelector('.ed-stage .ed-workbench .card-thumb-inner')!.textContent?.includes('نورة المصغّرة'),'the mini card updates live while typing');
   await act(async()=>{name.blur();await new Promise(r=>setTimeout(r,220));});
   assert.ok(/at-half/.test(ed())&&!/is-typing/.test(ed()),'leaving the field restores the sheet');
   await act(async()=>{await new Promise(r=>setTimeout(r,750));});await settle();
   assert.ok(document.querySelector('.ed-actions .ed-publish')!.textContent?.includes('انشر التعديلات'));
   await click(document.querySelector('.ed-actions .ed-publish')!);await settle();
   assert.ok(/at-peek/.test(ed()),'publishing returns to the full card');assert.ok(document.querySelector('.ed-published'));
   assert.ok(document.querySelector('.ed-actions .ed-publish')!.textContent?.includes('إلى الضيوف'));
   await click(document.querySelector('.ed-workbench-expand')!);await settle();
   const dialog=document.querySelector('.ed-expanded-dialog')!;assert.ok(dialog?.hasAttribute('open'));assert.ok(dialog.querySelector('.card-thumb'));
   const zoom=Array.from(dialog.querySelectorAll<HTMLButtonElement>('button[aria-pressed]'))[0]!;await click(zoom);
   assert.equal(dialog.querySelector('.ed-expanded-scroll')!.getAttribute('data-zoom'),'2');assert.equal(zoom.getAttribute('aria-pressed'),'true');
  } finally { await api.invitations.saveDraft(event.id,original);await api.invitations.publish(event.id); }
 });
 await check('Signature desktop studio edits a live card, saves, previews and publishes the same draft',async()=>{
  const originalMedia=globalThis.matchMedia;
  globalThis.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}} as unknown as MediaQueryList);
  try {
   history.replaceState(null,'','/app/events/evt_wedding/invitation/design');await render(<App mode="history"/>);await settle();
   const api=(window as unknown as {__doyofy:typeof made}).__doyofy.services;
   const before=await api.events.get(event.id),original=(await api.invitations.get(event.id)).draft;
   assert.ok(document.querySelector('.ed-brand .logo'));assert.ok(document.querySelector('.ed-workbench .card-thumb-inner'));assert.equal(document.querySelector('.live-preview'),null);
   assert.equal(document.querySelectorAll('.ed-tabs [role="tab"]').length,4);
   const name=document.querySelector<HTMLInputElement>('.ed-group input')!;await fill(name,'نورة الاستوديو');await settle();
   assert.ok(document.querySelector('.ed-workbench .card-thumb-inner')!.textContent?.includes('نورة الاستوديو'));
   await act(async()=>{await new Promise(r=>setTimeout(r,750));});await settle();
   assert.equal((await api.invitations.get(event.id)).draft.displayNames.a,'نورة الاستوديو');
   assert.deepEqual(await api.events.get(event.id),before);
   const stageButton=(label:string)=>Array.from(document.querySelectorAll<HTMLButtonElement>('.ed-stage-heading button')).find(x=>x.textContent===label)!;
   await click(stageButton('معاينة'));await settle();assert.ok(document.querySelector('.live-preview'));assert.equal(document.querySelector('.ed-workbench'),null);
   await click(stageButton('تعديل'));await settle();assert.ok(document.querySelector('.ed-workbench .card-thumb-inner')!.textContent?.includes('نورة الاستوديو'));
   await click(document.querySelector('#ed-tab-design')!);assert.ok(document.querySelector('.ed-cards'));await click(document.querySelector('#ed-tab-motion')!);assert.ok(document.querySelector('.ed-options'));await click(document.querySelector('#ed-tab-event')!);assert.ok(document.querySelector('input[type="date"]'));
   await click(document.querySelector('.ed-actions .ed-publish')!);await settle();const published=await api.invitations.get(event.id);assert.deepEqual(published.published,published.draft);assert.equal(published.published!.displayNames.a,'نورة الاستوديو');
   await api.invitations.saveDraft(event.id,original);await api.invitations.publish(event.id);
  } finally {globalThis.matchMedia=originalMedia;}
 });
 await check('Signature template surfaces show real names and browsing keeps the draft until explicit use',async()=>{
  history.replaceState(null,'','/app/events/evt_wedding/invitation/templates');await render(<App mode="history"/>);await settle();
  const api=(window as unknown as {__doyofy:typeof made}).__doyofy.services,before=(await api.invitations.get(event.id)).draft;
  await click(button('المجموعة'));await settle();
  assert.ok(document.querySelector('.tg-studio-prop'));assert.ok(document.querySelector('.sig-tpl-tableau .card-thumb-inner'));
  await click(document.querySelector('.sig-library-open')!);await settle();assert.ok(document.querySelector('.template-feed-slide.is-active .ed-workbench .card-thumb-inner'));assert.equal(document.querySelector('.live-preview'),null);
  const titleBefore=document.querySelector('.tp .template-feed-title')!.textContent;
  const stage=document.querySelector('.tp .template-feed-scroll')!;await key(stage,'ArrowDown');await settle();assert.notEqual(document.querySelector('.tp .template-feed-title')!.textContent,titleBefore);assert.deepEqual((await api.invitations.get(event.id)).draft,before);
  await click(document.querySelector('.tp .dialog-foot .btn-primary')!);await settle();assert.ok(location.pathname.endsWith('/invitation/design'));assert.ok(document.querySelector('.ed-workbench'));
  const after=(await api.invitations.get(event.id)).draft;assert.deepEqual(after.displayNames,before.displayNames);assert.deepEqual(after.message,before.message);assert.deepEqual(after.program,before.program);
  await api.invitations.saveDraft(event.id,before);
 });
 await check('an applied template reaches the editor, survives typing and offers publishing the change (P0)',async()=>{
  // real latency: the gallery's write invalidates the design while its refetch is still in flight on arrival
  const until=async(ok:()=>boolean,what:string)=>{for(let i=0;i<80&&!ok();i++)await act(async()=>{await new Promise(r=>setTimeout(r,25));});assert.ok(ok(),what);};
  const cardLabel=()=>document.querySelector('.ed-workbench .card-thumb')?.getAttribute('aria-label')??'';
  const publishText=()=>document.querySelector('.ed-actions .ed-publish')?.textContent??'';
  history.replaceState(null,'','/app/events/evt_wedding/invitation/design');await render(<App mode="history"/>);await settle();
  const first=(window as unknown as {__doyofy:typeof made}).__doyofy.services;
  const original=(await first.invitations.get(event.id)).draft;
  await act(async()=>{await first.invitations.publish(event.id);});await settle();
  assert.notEqual(original.cardId,'pf-gazebo');assert.ok(publishText().includes('إلى الضيوف'));
  // 1) the gallery: open the design from its link and use it (a new App instance: re-read its services)
  await render(null);history.replaceState(null,'','/app/events/evt_wedding/invitation/templates?template=pf-gazebo-garden');await render(<App mode="history"/>);
  const handle=(window as unknown as {__doyofy:typeof made}).__doyofy,api=handle.services;
  handle.prototype.update({latencyMs:60});
  try {
   await until(()=>!!document.querySelector('.tp .dialog-foot .btn-primary'),'gallery preview opens');
   await click(document.querySelector('.tp .dialog-foot .btn-primary')!);
   await until(()=>location.pathname.endsWith('/invitation/design')&&!!document.querySelector('.ed-workbench .card-thumb'),'editor opens');
   assert.ok(cardLabel().includes('شرفة الحديقة'),`editor shows the applied design, got «${cardLabel()}»`);
   assert.ok(publishText().includes('انشر التعديلات'),`publish offers the change, got «${publishText()}»`);
   const name=document.querySelector<HTMLInputElement>('.ed-group input')!;await fill(name,'نورة بعد القالب');
   await until(()=>document.querySelector('.save-state.is-saved')!==null,'autosave settles');
   const saved=(await api.invitations.get(event.id)).draft;
   assert.equal(saved.cardId,'pf-gazebo','typing must not write the previous design back');assert.equal(saved.displayNames.a,'نورة بعد القالب');
   assert.ok(cardLabel().includes('شرفة الحديقة'));assert.ok(publishText().includes('انشر التعديلات'));
   // 2) the editor's own card picker
   await click(document.querySelector('#ed-tab-design')!);
   const pick=Array.from(document.querySelectorAll<HTMLButtonElement>('.ed-cards [role="radio"]')).find(b=>b.getAttribute('aria-checked')==='false')!;
   const pickedName=pick.querySelector('.ed-pick-name')!.textContent!;await click(pick);
   await click(document.querySelector('#ed-tab-content')!);await fill(document.querySelector<HTMLInputElement>('.ed-group input')!,'نورة بعد البطاقة');
   await until(()=>document.querySelector('.save-state.is-saved')!==null&&(document.querySelector<HTMLInputElement>('.ed-group input')!.value==='نورة بعد البطاقة'),'second autosave settles');
   await act(async()=>{await new Promise(r=>setTimeout(r,800));});
   assert.ok(cardLabel().includes(pickedName));assert.notEqual((await api.invitations.get(event.id)).draft.cardId,'pf-gazebo');
   assert.ok(publishText().includes('انشر التعديلات'));
  } finally {
   handle.prototype.update({latencyMs:0});
   await api.invitations.saveDraft(event.id,original);await api.invitations.publish(event.id);
  }
 });
 await check('invitation without a draft starts directly in the editor and never claims single-name cards are missing',async()=>{
  const ev=await made.services.events.create({type:'graduation',names:{a:'اختبار التخرج'},date:event.date,time:'19:00',venue:{name:'قاعة',city:'الرياض'}});
  history.replaceState(null,'',`/app/events/${ev.id}/invitation?theme=horizon`);await render(<App mode="history"/>);await settle();
  assert.ok(document.querySelector(`a[href="/app/events/${ev.id}/invitation/design"]`));assert.ok(!document.getElementById('root')!.textContent?.includes('مصممة لاسمين'));
 });
 await check('review index exposes every journey surface using actual event and guest data',async()=>{
  history.replaceState(null,'','/prototype/screen-review?theme=horizon');await render(<App mode="history"/>);await settle();assert.equal(document.querySelectorAll('.screen-review-group').length,6);assert.ok(document.querySelector('.screen-review-group a[href$="/invitation/preview"]'));assert.ok(document.querySelector('.screen-review-group a[href^="/i/"]'));assert.ok(document.querySelector('.screen-review-group a[href$="/more"]'));
 });
 await check('personal guest can reach the details, RSVP and QR without cinematic playback',async()=>{
  const p=await made.services.parties.create(event.id,{primaryGuestName:'ضيف آخر شاشة',maxPartySize:2});await made.services.guest.submitRsvp(event.slug,p.code,{attending:true,count:2});
  history.replaceState(null,'',`/i/${event.slug}/${p.code}?theme=horizon`);await render(<App mode="history"/>);await settle();assert.ok(document.getElementById('root')!.textContent?.includes('ضيف آخر شاشة'));assert.ok(document.getElementById('root')!.textContent?.includes('برنامج المناسبة'));assert.ok(document.querySelector('svg[aria-label]')||document.getElementById('root')!.textContent?.includes('بطاقة الدخول'));
 });
 await check('unknown guest link shows a recoverable human error screen',async()=>{
  history.replaceState(null,'','/i/missing-occasion?theme=horizon');await render(<App mode="history"/>);await settle();assert.ok(document.getElementById('root')!.textContent?.includes('لم نجد هذه الدعوة'));assert.equal(document.querySelector('.guest-studio'),null);
 });
 await check('reception without seating registers partial arrivals, avoids table warnings and can undo',async()=>{
  const ev=await made.services.events.create({type:'graduation',names:{a:'تجربة الاستقبال'},date:event.date,time:'19:00',venue:{name:'قاعة',city:'الرياض'}}),p=await made.services.parties.create(ev.id,{primaryGuestName:'عائلة الوصول التجريبي',maxPartySize:3});await made.services.rsvp.setByOrganizer(p.id,{attending:true,count:3});
  await render(wrap(<GateMode eventId={ev.id}/>));await settle();await fill(document.querySelector<HTMLInputElement>('#gate-q')!,'عائلة الوصول');await click(button('عائلة الوصول'));assert.ok(!document.getElementById('root')!.textContent?.includes('بلا طاولة'));
  await click(document.querySelector('[aria-label="إنقاص كم شخصًا يدخل الآن؟"]')!);await click(button('دخول جزئي'));await settle();assert.equal((await made.services.parties.get(p.id)).checkedInCount,2);assert.ok(!document.getElementById('root')!.textContent?.includes('وجّههم'));
  await click(button('تراجع عن التسجيل'));await settle();assert.equal((await made.services.parties.get(p.id)).checkedInCount,0);
 });
 await check('Signature table overview filters the detailed list and updates from a real transfer',async()=>{
  const ev=await made.services.events.create({type:'graduation',names:{a:'خريطة الطاولات'},date:event.date,time:'19:00',venue:{name:'قاعة',city:'الرياض'}});
  const p=await made.services.parties.create(ev.id,{primaryGuestName:'عائلة الخريطة',maxPartySize:2});
  await made.services.rsvp.setByOrganizer(p.id,{attending:true,count:2});
  const tables=await made.services.seating.createTables(ev.id,[{name:'طاولة الورد',capacity:10},{name:'طاولة النور',capacity:8}]);
  await made.services.seating.assign(p.id,tables[0]!.id);
  await act(async()=>made.prototype.update({theme:'signature'}));
  await render(wrap(<SeatingPage event={ev}/>));await settle();
  assert.equal(document.querySelectorAll('.seat-overview-table').length,2);
  assert.ok(document.querySelector('.seat-overview-table')?.textContent?.includes('2/10'));
  await click(document.querySelectorAll('.seat-overview-table')[1]!);
  assert.equal(document.querySelectorAll('.table-card').length,1);
  assert.ok(document.querySelector('.table-card')?.textContent?.includes('طاولة النور'));
  await made.services.seating.assign(p.id,tables[1]!.id);await settle();
  assert.ok(document.querySelectorAll('.seat-overview-table')[1]!.textContent?.includes('2/8'));
  await click(button('كل الطاولات'));assert.equal(document.querySelectorAll('.table-card').length,2);
  await act(async()=>made.prototype.update({theme:'warm'}));
 });
 await check('reception separates lookup failure from invalid code and keeps the retry input',async()=>{
  const party=await made.services.parties.create(event.id,{primaryGuestName:'ضيف اختبار الشبكة',maxPartySize:1});
  const original=made.services.checkIn.findByCode;
  made.services.checkIn.findByCode=async()=>{throw new AppError('network','تعذر الاتصال أثناء التحقق');};
  try {
    await render(wrap(<GateMode eventId={event.id}/>));await settle();
    await click(button('مسح رمز QR'));
    await fill(document.querySelector<HTMLInputElement>('input[aria-label="الرمز أو الرابط"]')!,party.code);
    await click(button('تحقق'));await settle();
    assert.ok(document.body.textContent?.includes('تعذر التحقق من الرمز'));
    assert.ok(!document.body.textContent?.includes('الرمز غير صحيح أو أن الدعوة حُذفت'));
    made.services.checkIn.findByCode=original;
    await click(button('أعد المحاولة بنفس الرمز'));await settle();
    assert.ok(document.body.textContent?.includes('ضيف اختبار الشبكة'));
  } finally {made.services.checkIn.findByCode=original;}
 });
 await check('Signature hero supports RTL keyboard browsing and keeps the graduation banner a direct start',async()=>{
  history.replaceState(null,'','/app/events');await render(<App mode="history"/>);await settle();
  const fan=document.querySelector('.sig-fan')!;assert.ok(fan);
  const shown=()=>document.querySelector('.sig-fan-card.is-front')?.getAttribute('aria-label');
  const first=shown();await key(fan,'ArrowLeft');assert.notEqual(shown(),first);
  assert.equal(document.activeElement,document.querySelector('.sig-fan-card.is-front'),'keyboard browsing moves focus with the visible card');
  await key(fan,'ArrowRight');assert.equal(shown(),first);
  await pointer(fan,'pointerdown',100,100,0);await pointer(fan,'pointermove',0,100,150);assert.ok(fan.hasAttribute('data-dragging'));
  await pointer(fan,'pointercancel',0,100,200);assert.equal(shown(),first);assert.equal(fan.hasAttribute('data-dragging'),false);
  await pointer(fan,'pointerdown',100,100,300);await pointer(fan,'pointermove',20,100,450);await pointer(fan,'pointerup',20,100,500);
  const afterSwipe=shown();assert.notEqual(afterSwipe,first);await click(document.querySelector('.sig-fan-card.is-front')!);assert.equal(shown(),afterSwipe,'a release click must not cycle a second time');
  assert.ok(document.querySelector('.sig-celebration-banner a[href$="type=graduation"]'));
  assert.ok(document.querySelector('.sig-banner-caption')?.textContent?.includes('نموذج دعوة'));
 });
 await check('Signature list mode gives search instructions instead of a swipe hint',async()=>{
  history.replaceState(null,'','/app/events/new');await render(<App mode="history"/>);await settle();
  await click(button('قائمة وبحث'));assert.ok(document.querySelector('.sig-create-sub')?.textContent?.includes('ابحث عن مناسبتك'));
  await click(button('بطاقات'));assert.ok(document.querySelector('.sig-create-sub')?.textContent?.includes('اسحب البطاقات'));
 });
 await check('food after «نعم»: meals are split per person and saved once with the reply (F047, F051, T28)',async()=>{
  const p=await made.services.parties.create(event.id,{primaryGuestName:'عائلة الوجبات',maxPartySize:4});
  const view=await made.services.guest.open(event.slug,p.code);let latest=view;
  await render(wrap(<GuestHub view={view} code={p.code} submission={null} onView={(v)=>{latest=v;}} onReplay={()=>{}}/>));
  assert.equal(document.querySelector('.gx'),null,'no food questions before attending');
  await click(document.querySelector('input[type=radio][value=yes]')!);
  await click(document.querySelector('[aria-label="زيادة عدد الحضور"]')!);
  const plus=(label:string)=>document.querySelector<HTMLButtonElement>(`[aria-label="زيادة ${label}"]`)!;
  await click(plus('كبسة لحم'));await click(plus('كبسة لحم'));await click(plus('سمك هامور'));
  assert.equal(document.querySelectorAll('.gx-plate:not(.is-empty)').length,3);
  assert.ok(plus('طبق نباتي').disabled,'no more plates than people');
  await click(button('لا شيء، شكرًا'));
  const before=(await made.services.rsvp.listResponses(event.id)).length;
  await click(button('إرسال الرد'));await settle();
  const saved=await made.services.parties.get(p.id);
  assert.deepEqual(saved.meals,[{optionId:'meal_meat',count:2},{optionId:'meal_fish',count:1}]);
  assert.equal(saved.dietary?.answered,true);assert.deepEqual(saved.dietary?.needs,[]);
  assert.equal((await made.services.rsvp.listResponses(event.id)).length,before+1,'one reply, not two');
  assert.equal(latest.party?.rsvpStatus,'confirmed');
 });
 await check('required meals keep the reply local until every person has a plate (T29)',async()=>{
  const cur=(await made.services.events.get(event.id)).guestExperience!;const {revision,...draft}=cur;
  await made.services.events.updateExperience(event.id,{...draft,meals:{...draft.meals,required:true}},revision);
  try{
   const p=await made.services.parties.create(event.id,{primaryGuestName:'عائلة الإلزام',maxPartySize:2});
   await render(wrap(<GuestHub view={await made.services.guest.open(event.slug,p.code)} code={p.code} submission={null} onView={()=>{}} onReplay={()=>{}}/>));
   await click(document.querySelector('input[type=radio][value=yes]')!);
   await click(document.querySelector('[aria-label="زيادة دجاج مشوي"]')!);
   await click(button('إرسال الرد'));await settle();
   assert.ok(document.getElementById('root')!.textContent!.includes('اختاروا وجبة لكل'));
   assert.equal((await made.services.parties.get(p.id)).rsvpStatus,'pending');
  }finally{
   const now=(await made.services.events.get(event.id)).guestExperience!;const {revision:r2,...d2}=now;
   await made.services.events.updateExperience(event.id,{...d2,meals:{...d2.meals,required:false}},r2);
  }
 });
 await check('a decline is accepted first, then wishes are offered as plain external links (F066–F068, T37, T38)',async()=>{
  const p=await made.services.parties.create(event.id,{primaryGuestName:'ضيف معتذر',maxPartySize:2});
  await made.services.guest.submitRsvp(event.slug,p.code,{attending:false,count:0});
  await render(wrap(<GuestHub view={await made.services.guest.open(event.slug,p.code)} code={p.code} submission={{ok:true}} onView={()=>{}} onReplay={()=>{}}/>));
  const text=document.getElementById('root')!.textContent!;
  assert.ok(text.includes('سجّلنا اعتذاركم')&&text.includes('مشاركتكم من بعيد'));
  assert.ok(text.indexOf('سجّلنا اعتذاركم')<text.indexOf('مشاركتكم من بعيد'),'the decline is confirmed before any wish');
  const links=Array.from(document.querySelectorAll<HTMLAnchorElement>('.gx-wish a'));
  assert.ok(links.length>=2);
  for(const a of links){assert.ok(a.href.startsWith('https://'));assert.equal(a.target,'_blank');assert.ok(a.rel.includes('noopener'));}
  assert.equal(document.querySelector('.gx-wish')!.className.includes('is-flowers'),true,'flowers lead after a decline');
  links[0]!.addEventListener('click',e=>e.preventDefault());await click(links[0]!);
  const after=await made.services.parties.get(p.id);assert.equal(after.rsvpStatus,'declined');assert.equal(JSON.stringify(after).includes('paid'),false);
 });
 await check('food lens totals come from the same parties as the list; allergies stand out (F053, F054)',async()=>{
  made.prototype.update({role:'caterer'});
  history.replaceState(null,'',paths.guests(event.id)+'?view=food');
  const ev=await made.services.events.get(event.id);
  await render(wrap(<GuestsPage event={ev}/>));await settle();
  const r=mealReport(experienceOf(ev),await made.services.parties.list(event.id),await made.services.rsvp.listResponses(event.id));
  const bars=Array.from(document.querySelectorAll('.food-bar:not(.is-none) .food-bar-n')).map(e=>Number(e.textContent));
  assert.deepEqual(bars,r.rows.map(x=>x.people));
  assert.equal(Number(document.querySelector('.food-bar.is-none .food-bar-n')!.textContent),r.unspecified);
  assert.ok(document.querySelector('.food-need.is-allergy'));
  assert.ok(!document.getElementById('root')!.textContent!.includes('+966'),'no phone numbers in the food report');
  assert.equal(document.querySelector('.g2-row'),null,'caterer report has no editable guest rows');
  assert.equal(document.querySelector('[href*="wa.me"]'),null,'caterer cannot open private messaging');
  made.prototype.update({role:'organizer'});
  history.replaceState(null,'','/');
 });
 await check('guest experience settings: unsafe wish links block saving; answered meals are hidden, not deleted (T33, T39)',async()=>{
  made.prototype.update({role:'caterer'});
  const ev=await made.services.events.get(event.id);const rev=ev.guestExperience!.revision;
  await render(wrap(<SettingsPage event={ev}/>));await settle();
  const url=document.querySelector<HTMLInputElement>('.gxs-item input[type=url]')!;assert.ok(url);
  await fill(url,'javascript:alert(1)');assert.ok((button('حفظ ونشر للضيوف') as HTMLButtonElement).disabled);
  await fill(url,'https://shop.example.com/watch');assert.ok(!(button('حفظ ونشر للضيوف') as HTMLButtonElement).disabled);
  await click(document.querySelector('[aria-label="إخفاء كبسة لحم (اختاره ضيوف)"]')!);
  await click(button('حفظ ونشر للضيوف'));await settle();
  const x=(await made.services.events.get(event.id)).guestExperience!;
  assert.equal(x.revision,rev+1);
  assert.equal(x.meals.options.find(o=>o.id==='meal_meat')?.archived,true);
  assert.equal(x.gifts.items[0]!.url,'https://shop.example.com/watch');
  const view=await made.services.guest.open(event.slug,(await made.services.parties.list(event.id)).find(p=>p.rsvpStatus==='pending')!.code);
  assert.ok(!view.experience!.meals.options.some(o=>o.id==='meal_meat'),'hidden from guests');
  made.prototype.update({role:'organizer'});
 });
 await check('organizer guest list and settings hide food while preserving wishlist controls',async()=>{
  made.prototype.update({role:'organizer'});
  history.replaceState(null,'',paths.guests(event.id)+'?view=food');
  const ev=await made.services.events.get(event.id);
  await render(wrap(<GuestsPage event={ev}/>));await settle();
  assert.equal(document.querySelector('.food'),null);assert.equal(document.querySelector('.g2-food'),null);
  await render(wrap(<SettingsPage event={ev}/>));await settle();
  assert.equal(document.getElementById('gxs-meals'),null);assert.equal(document.getElementById('gxs-diet'),null);
  assert.ok(document.getElementById('gxs-gifts'));
 });
 await check('import reviews and blocks ambiguous sample rows before explicit batch approval',async()=>{
  const before=(await made.services.parties.list(event.id)).length;await render(wrap(<ImportFlow eventId={event.id}/>));await settle();await click(button('استخدم الملف النموذجي'));await settle();assert.ok(document.getElementById('root')!.textContent?.includes('راجع قبل الإضافة'));assert.equal((await made.services.parties.list(event.id)).length,before);const add=Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(b=>b.textContent?.startsWith('أضف ')&&!b.textContent.includes('على أي حال'));assert.ok(add?.disabled);
 });
 await check('invalid map link blocks settings save and archive cancellation keeps the event',async()=>{
  await render(wrap(<SettingsPage event={event}/>));await fill(document.querySelector<HTMLInputElement>('input[type=url]')!,'javascript:alert(1)');assert.ok((button('حفظ التغييرات') as HTMLButtonElement).disabled);await fill(document.querySelector<HTMLInputElement>('input[type=url]')!,'https://maps.example.test/location');assert.ok(!(button('حفظ التغييرات') as HTMLButtonElement).disabled);await click(button('أرشفة'));assert.ok(document.querySelector('dialog[open]'));await click(button('تراجع'));assert.equal((await made.services.events.get(event.id)).archivedAt,undefined);
 });
 await act(async()=>{made.prototype.update({theme:'warm'});});
 assert.equal(matchPath('/i/:slug','/i/%ZZ'),null);
 await check('form errors only describe rendered feedback and restore the hint after correction',async()=>{
  await render(<Field label="الاسم" hint="اكتب اسمك" error="الاسم مطلوب"><Input /></Field>);
  let input=document.querySelector('input')!;
  assert.equal(input.getAttribute('aria-invalid'),'true');
  for(const id of input.getAttribute('aria-describedby')!.split(' '))assert.ok(document.getElementById(id));
  assert.equal(document.querySelector('.field-hint'),null);
  await render(<Field label="الاسم" hint="اكتب اسمك"><Input /></Field>);
  input=document.querySelector('input')!;assert.equal(input.getAttribute('aria-invalid'),null);
  assert.equal(document.getElementById(input.getAttribute('aria-describedby')!)?.textContent,'اكتب اسمك');
 });
 await check('guest checkbox label selects a party without opening its drawer',async()=>{
  history.replaceState(null,'',`/app/events/${event.id}/guests`);
  await render(wrap(<GuestsPage event={event}/>));await settle();
  const label=document.querySelector('.g2-row .gt-check-hit')!;assert.ok(label);
  await click(label);assert.ok(document.querySelector('.g2-row.is-selected'));
  assert.ok(document.querySelector('.bulk-bar'));assert.equal(document.querySelector('dialog[open]'),null);
  assert.equal(new URLSearchParams(location.search).has('party'),false);
 });
 await check('seating drag highlights only the hovered table and resets on cancel',async()=>{
  await render(wrap(<SeatingPage event={event}/>));await settle();
  const source=document.querySelector('[draggable="true"]')!,table=document.querySelector('.table-card')!;assert.ok(source);assert.ok(table);
  const transfer={setData(){},getData(){return '';},dropEffect:''};
  const drag=async(el:Element,type:string)=>{await act(async()=>{const e=new Event(type,{bubbles:true,cancelable:true});Object.defineProperty(e,'dataTransfer',{value:transfer});el.dispatchEvent(e);});};
  await drag(source,'dragstart');await drag(table,'dragover');
  assert.equal(document.querySelectorAll('.table-card.is-drop-target').length,1);assert.ok(document.querySelectorAll('.is-drop-target').length<=2,'one table: its card and its hall-map seat');assert.equal(transfer.dropEffect,'move');
  await drag(source,'dragend');assert.equal(document.querySelectorAll('.is-drop-target,.is-droppable').length,0);
 });
 await check('editor message and programme previews retain both names and actual content',async()=>{
  const design=defaultDesign(event);design.message.ar='كلمة مخصصة تظهر كاملة';design.program=[{time:'21:30',ar:'لحظة مخصصة',en:'A custom moment'}];
  await render(<EditorWorkbench event={event} content={design} page="message"/>);assert.ok(document.querySelector('.ed-copy-names')!.textContent?.includes(event.names.a));assert.ok(document.querySelector('.ed-copy-names')!.textContent?.includes(event.names.b!));assert.ok(document.querySelector('.ed-copy-message')!.textContent?.includes(design.message.ar));
  await render(<EditorWorkbench event={event} content={design} page="program"/>);assert.ok(document.querySelector('.ed-copy-program')!.textContent?.includes('لحظة مخصصة'));assert.ok(document.querySelector('.ed-copy-program')!.textContent?.includes('A custom moment'));
 });
 await check('logout gates editor and reception; signup preserves return and stored invitation',async()=>{
  history.replaceState(null,'','/app/events/evt_wedding/invitation/design');await render(<App mode="history"/>);await settle();
  const api=(window as unknown as {__doyofy:typeof made}).__doyofy.services,before=(await api.invitations.get(event.id)).draft;
  history.pushState(null,'','/app/logout');window.dispatchEvent(new Event('popstate'));await settle();assert.equal(currentDemoAccount().status,'signed-out');assert.ok(document.querySelector('.auth-copy')!.textContent?.includes('نراك في فرحة قادمة'));
  for(const path of ['/check-in/evt_wedding','/app/events/evt_wedding/invitation/design']){history.pushState(null,'',path);window.dispatchEvent(new Event('popstate'));await settle();assert.equal(location.pathname,'/app/login');assert.equal(new URLSearchParams(location.search).get('next'),path);}
  await click(document.querySelector('.auth-switch a')!);await settle();assert.equal(location.pathname,'/app/signup');assert.equal(new URLSearchParams(location.search).get('next'),'/app/events/evt_wedding/invitation/design');
  await fill(document.querySelector('input[autocomplete="name"]')!,'ريم');await fill(document.querySelector('input[type="email"]')!,'reem@example.com');await act(async()=>{document.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});await settle();assert.equal(location.pathname,'/app/events/evt_wedding/invitation/design');assert.equal(api.session.currentUser().name,'ريم');assert.equal(api.session.currentUser().id,'usr_owner');assert.deepEqual((await api.invitations.get(event.id)).draft,before);
  await act(async()=>saveDemoAccount({status:'signed-out'}));history.pushState(null,'',`/i/${event.slug}`);window.dispatchEvent(new Event('popstate'));await settle();assert.ok(location.pathname.startsWith('/i/'));assert.equal(document.querySelector('.auth-form'),null);
  await act(async()=>saveDemoAccount({status:'demo'}));
 });
 await check('the home exposes account and logout',async()=>{
  history.pushState(null,'','/app/events');window.dispatchEvent(new Event('popstate'));await render(<App mode="history"/>);await settle();assert.ok(document.querySelector('.account-trigger'),'account menu');
 });
 await check('creation resumes saved essentials and shared catalogue links preserve the selected design',async()=>{
  window.localStorage.removeItem('doyofy:create-draft:v1:usr_owner');
  const selected=TEMPLATE_PRESETS.find(p=>p.primaryOccasion==='graduation'&&p.cardId==='mo-sky')!;
  history.replaceState(null,'',`${paths.newEvent}?type=graduation&template=${selected.id}&preview=1`);
  await render(<App mode="history"/>);await settle();
  assert.ok(document.querySelector('.tp-feed-dialog[open]'),'a catalogue link opens without an existing event ID');
  await click(document.querySelector('.tp .dialog-foot .btn-primary')!);await settle();
  await fill(document.querySelector<HTMLInputElement>('#create-event input')!,'خريجة المسودة');
  const saved=JSON.parse(window.localStorage.getItem('doyofy:create-draft:v1:usr_owner')!);assert.equal(saved.draft.a,'خريجة المسودة');assert.equal(saved.templateId,selected.id);
  await render(null);history.replaceState(null,'',paths.newEvent);await render(<App mode="history"/>);await settle();
  assert.ok(document.body.textContent?.includes('استعدنا ما كتبته'));assert.equal(document.querySelector<HTMLInputElement>('#create-event input')!.value,'خريجة المسودة');
  const form=document.querySelector<HTMLFormElement>('#create-event')!;
  await fill(form.querySelector<HTMLInputElement>('input[type=date]')!,event.date);
  const textInputs=Array.from(form.querySelectorAll<HTMLInputElement>('input')).filter(x=>!['date','time'].includes(x.type));
  await fill(textInputs[textInputs.length-2]!,'قاعة المسودة');await fill(textInputs[textInputs.length-1]!,'الرياض');
  await act(async()=>{form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});await settle();
  assert.ok(location.pathname.endsWith('/invitation/design'));
  const api=(window as unknown as {__doyofy:typeof made}).__doyofy.services;const id=location.pathname.split('/')[3]!;
  assert.equal((await api.invitations.get(id)).draft.cardId,selected.cardId);assert.equal(window.localStorage.getItem('doyofy:create-draft:v1:usr_owner'),null);
  // typing in the editor keeps the design chosen from the link
  await fill(document.querySelector<HTMLInputElement>('.ed-group input')!,'خريجة الرابط');await act(async()=>{await new Promise(r=>setTimeout(r,800));});await settle();
  const typed=(await api.invitations.get(id)).draft;assert.equal(typed.cardId,selected.cardId);assert.equal(typed.displayNames.a,'خريجة الرابط');
  assert.ok(document.querySelector('.ed-workbench .card-thumb')!.getAttribute('aria-label')!.includes('نحو السماء'));
 });
 await check('one publish saves event-only changes and focuses invalid details before publishing',async()=>{
  history.replaceState(null,'',paths.design(event.id));await render(<App mode="history"/>);await settle();
  const api=(window as unknown as {__doyofy:typeof made}).__doyofy.services;
  await act(async()=>{await api.invitations.publish(event.id);});await settle();
  await click(document.querySelector('#ed-tab-event')!);
  const venue=document.querySelector<HTMLInputElement>('[data-event-field="venue"]')!;await fill(venue,'قاعة النشر بخطوة واحدة');
  const publish=document.querySelector<HTMLButtonElement>('.ed-actions .ed-publish')!;assert.ok(publish.textContent?.includes('انشر التعديلات'));
  await click(publish);await settle();assert.equal((await api.events.get(event.id)).venue.name,'قاعة النشر بخطوة واحدة');
  assert.ok(document.querySelector('.ed-actions .ed-publish')!.textContent?.includes('إلى الضيوف'));
  const map=document.querySelector<HTMLInputElement>('[data-event-field="mapUrl"]')!;await fill(map,'javascript:alert(1)');
  await click(document.querySelector('.ed-actions .ed-publish')!);await settle();
  assert.equal(document.activeElement,map);assert.equal(map.getAttribute('aria-invalid'),'true');assert.ok(!String((await api.events.get(event.id)).venue.mapUrl).startsWith('javascript:'));
 });
 console.log(`DOM behavior: ${passed}/${passed} passed + malformed-route check.`);
 const routes=[
 '/app/events','/app/events/new','/app/events/evt_wedding/overview','/app/events/evt_wedding/invitation','/app/events/evt_wedding/more',
 '/app/events/evt_wedding/invitation/preview','/app/events/evt_wedding/invitation/templates','/app/events/evt_wedding/invitation/design',
 '/app/events/evt_wedding/guests','/app/events/evt_wedding/guests/import','/app/events/evt_wedding/rsvp','/app/events/evt_wedding/seating',
 '/app/events/evt_wedding/check-in','/check-in/evt_wedding','/app/events/evt_wedding/settings','/app/events/evt_katb/summary','/prototype/screen-review',
 ];
 let mounted=0;
 for(const appearance of ['light','dark'] as const) for(const path of routes){
  history.replaceState(null,'',`${path}?appearance=${appearance}`);setup();
  try{await render(<App mode="history"/>);await settle();assert.equal(document.documentElement.dataset.appearance,appearance);assert.equal(document.documentElement.dataset.theme,'signature');assert.ok(document.getElementById('root')!.textContent!.length>40,`${appearance} route ${path}`);mounted++;}finally{await clear();}
 }
 history.replaceState(null,'','/app/events/missing/overview?appearance=light');setup();
 try{await render(<App mode="history"/>);await settle();assert.ok(document.getElementById('root')!.textContent?.includes('لم نجد'),'missing event route');}finally{await clear();}
 console.log(`DOM route mounting: ${mounted}/${routes.length*2} (light + dark) + missing route passed. No browser/rendering/WebGL/device QA.`);
}
