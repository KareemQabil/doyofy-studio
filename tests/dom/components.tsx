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
import { ThemePicker } from '../../src/ui/primitives/ThemePicker';
import { ThemeSync, applyReviewLink } from '../../src/app/review';
import { THEMES } from '../../src/domain/themes';
import { TemplatePreview } from '../../src/features/templates/TemplatePreview';
import { TEMPLATE_PRESETS } from '../../src/domain/templates';
import { OrbitBoard } from '../../src/features/orbit/OrbitBoard';
import { OrbitOccasions } from '../../src/features/orbit/OrbitOccasions';
import { OrbitTemplateDesk } from '../../src/features/orbit/OrbitTemplateDesk';
import { BahjaHome } from '../../src/features/bahja/BahjaHome';
import { BahjaOccasions } from '../../src/features/bahja/BahjaOccasions';
import { BahjaTemplateSalon } from '../../src/features/bahja/BahjaTemplateSalon';
import { presetOf } from '../../src/domain/templates';
import { OrbitQuickOpen } from '../../src/features/orbit/OrbitShell';
import { Field, Input } from '../../src/ui/primitives/Form';
import { GuestsPage } from '../../src/features/guests/GuestsPage';
import { SeatingPage } from '../../src/features/seating/SeatingPage';
import { usePointerGesture } from '../../src/ui/hooks/usePointerGesture';

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
 const made=createServices();made.prototype.update({latencyMs:0,theme:'warm'});made.prototype.reset('before');
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
 await check('eight theme choices persist and leave the invitation unchanged',async()=>{
  const before=await made.services.invitations.get(event.id);
  await render(wrap(<><ThemeSync/><ThemePicker inline/></>));
  for(const theme of THEMES){await click(button(theme.label));assert.equal(made.prototype.settings().theme,theme.id);assert.equal(document.documentElement.dataset.theme,theme.id);}
  assert.deepEqual(await made.services.invitations.get(event.id),before);
  assert.equal(createServices().prototype.settings().theme,THEMES.at(-1)!.id);await act(async()=>{made.prototype.update({theme:'warm'});});
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
 await check('template browsing defers live playback and swipes respect scroll and cancellation',async()=>{
  const design=await made.services.invitations.get(event.id);let navigated='';
  await render(wrap(<TemplatePreview event={event} base={design.draft} presets={TEMPLATE_PRESETS} preset={TEMPLATE_PRESETS[1]!} isCurrent={false} pending={false} onNavigate={p=>{navigated=p.id;}} onClose={()=>{}} onUse={()=>{}}/>));
  assert.ok(document.querySelector('.tp-poster'));assert.equal(document.querySelector('.live-preview'),null);
  const stage=document.querySelector('.tp-stage')!;
  await pointer(stage,'pointerdown',100,100,0);await pointer(stage,'pointermove',80,200,100);await pointer(stage,'pointerup',80,200,200);assert.equal(navigated,'');
  await pointer(stage,'pointerdown',100,100,300);await pointer(stage,'pointermove',0,102,400);await pointer(stage,'pointercancel',0,102,500);assert.equal(navigated,'');
  await pointer(stage,'pointerdown',100,100,600);await pointer(stage,'pointermove',0,102,700);await pointer(stage,'pointerup',0,102,800);assert.equal(navigated,TEMPLATE_PRESETS[2]!.id);
  navigated='';await pointer(stage,'pointerdown',100,100,900);await pointer(stage,'pointermove',190,102,1000);await pointer(stage,'pointerup',190,102,1100);assert.equal(navigated,TEMPLATE_PRESETS[0]!.id);
  navigated='';await key(stage,'ArrowLeft');assert.equal(navigated,TEMPLATE_PRESETS[2]!.id);navigated='';await key(document.querySelector('.tp-rail-item')!,'ArrowLeft');assert.equal(navigated,'');await click(document.querySelector('[aria-label="القالب التالي"]')!);assert.equal(navigated,TEMPLATE_PRESETS[2]!.id);
  navigated='';await render(wrap(<TemplatePreview event={event} base={design.draft} presets={TEMPLATE_PRESETS} preset={TEMPLATE_PRESETS[1]!} isCurrent={false} pending onNavigate={p=>{navigated=p.id;}} onClose={()=>{}} onUse={()=>{}}/>));
  await pointer(stage,'pointerdown',100,100,1200);await pointer(stage,'pointermove',0,102,1300);await pointer(stage,'pointerup',0,102,1400);assert.equal(navigated,'');
 });
 await check('review URLs accept all themes and reject unknown theme values',async()=>{
  for(const theme of THEMES){history.replaceState(null,'',`/app/events?theme=${theme.id}`);applyReviewLink(made.prototype);assert.equal(document.documentElement.dataset.theme,theme.id);}
  history.replaceState(null,'','/app/events?theme=unknown');applyReviewLink(made.prototype);assert.equal(made.prototype.settings().theme,THEMES.at(-1)!.id);
  history.replaceState(null,'','/app/events');await act(async()=>{made.prototype.update({theme:'warm'});});
 });
 await check('phone editor snaps up/down and cancellation preserves the current panel',async()=>{
  history.replaceState(null,'','/app/events/evt_wedding/invitation/design');
  await render(<App mode="history"/>);for(let i=0;i<12;i++)await act(async()=>{await new Promise(r=>setTimeout(r,15));});
  const handle=document.querySelector('.ed-handle')!;assert.ok(handle);
  // jsdom has no layout: supply the panel geometry this position-based gesture actually measures.
  const panel=document.querySelector<HTMLElement>('.ed-panel')!;
  const measure=panel.getBoundingClientRect.bind(panel);
  panel.getBoundingClientRect=()=>{
   const rect=measure();const stop=handle.getAttribute('data-stop');
   const base=stop==='full'?window.innerHeight-136:window.innerHeight*(stop==='peek'?.22:.54);
   return Object.assign(rect,{height:base-(parseFloat(panel.style.getPropertyValue('--drag'))||0)});
  };
  await pointer(handle,'pointerdown',100,200,0);await pointer(handle,'pointermove',100,80,200);await pointer(handle,'pointerup',100,80,300);assert.ok(document.querySelector('.ed.sheet-full'));
  await pointer(handle,'pointerdown',100,80,400);await pointer(handle,'pointermove',100,200,600);await pointer(handle,'pointercancel',100,200,700);assert.ok(document.querySelector('.ed.sheet-full'));
  await pointer(handle,'pointerdown',100,80,800);await pointer(handle,'pointermove',100,200,1000);await pointer(handle,'pointerup',100,200,1100);assert.ok(document.querySelector('.ed.sheet-half'));
 });
 await check('Signature desktop studio edits a live card, saves, previews and publishes the same draft',async()=>{
  const originalMedia=globalThis.matchMedia;
  globalThis.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}} as unknown as MediaQueryList);
  try {
   history.replaceState(null,'','/app/events/evt_wedding/invitation/design?theme=signature');await render(<App mode="history"/>);await settle();
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
  history.replaceState(null,'','/app/events/evt_wedding/invitation/templates?theme=signature');await render(<App mode="history"/>);await settle();
  const api=(window as unknown as {__doyofy:typeof made}).__doyofy.services,before=(await api.invitations.get(event.id)).draft;
  assert.ok(document.querySelector('.tg-studio-prop'));assert.ok(document.querySelector('.sig-tpl-tableau .card-thumb-inner'));
  await click(document.querySelector('.sig-library-open')!);await settle();assert.ok(document.querySelector('.tp-stationery .ed-workbench .card-thumb-inner'));assert.equal(document.querySelector('.live-preview'),null);
  const railBefore=document.querySelector('.tp-rail [aria-pressed="true"]');assert.ok(railBefore);
  const stage=document.querySelector('.tp-stage')!;await key(stage,'ArrowLeft');await settle();assert.notEqual(document.querySelector('.tp-rail [aria-pressed="true"]'),railBefore);assert.deepEqual((await api.invitations.get(event.id)).draft,before);
  await click(document.querySelector('.tp .dialog-foot .btn-primary')!);await settle();assert.ok(location.pathname.endsWith('/invitation/design'));assert.ok(document.querySelector('.ed-workbench'));
  const after=(await api.invitations.get(event.id)).draft;assert.deepEqual(after.displayNames,before.displayNames);assert.deepEqual(after.message,before.message);assert.deepEqual(after.program,before.program);
  await api.invitations.saveDraft(event.id,before);
 });
 await act(async()=>{made.prototype.update({theme:'orbit'});});
 await check('Orbit canvas pans, pinches with two independent pointers, and restores cancelled motion',async()=>{
  await render(wrap(<OrbitBoard event={event}/>));await settle();const frame=document.querySelector<HTMLDivElement>('.orbit-canvas')!;assert.ok(frame);
  await pointer(frame,'pointerdown',100,100,0);await pointer(frame,'pointermove',175,120,100);await pointer(frame,'pointerup',175,120,200);
  assert.equal(frame.style.getPropertyValue('--pan-x'),'75px');assert.equal(frame.style.getPropertyValue('--pan-y'),'20px');
  await pointer(frame,'pointerdown',0,0,300);await pointer(frame,'pointermove',200,200,400);await pointer(frame,'pointercancel',200,200,500);
  assert.equal(frame.style.getPropertyValue('--pan-x'),'75px');assert.equal(frame.getAttribute('data-panning'),null);
  await click(document.querySelector('[aria-label="إعادة ترتيب المساحة"]')!);
  await pointer(frame,'pointerdown',0,0,600,1);await pointer(frame,'pointerdown',100,0,610,2);await pointer(frame,'pointermove',150,0,700,2);await pointer(frame,'pointerup',150,0,800,2);await pointer(frame,'pointerup',0,0,810,1);
  assert.equal(frame.style.getPropertyValue('--zoom'),'1.5');assert.equal(document.querySelector('output[aria-label="نسبة التقريب"]')!.textContent,'150%');
  await key(frame,'0');await key(frame,'+');assert.equal(frame.style.getPropertyValue('--zoom'),'1.1');await key(frame,'ArrowDown');assert.equal(frame.style.getPropertyValue('--pan-y'),'50px');
  const link=document.querySelector('.orbit-note-open')!;await pointer(link,'pointerdown',0,0,900);await pointer(frame,'pointermove',200,0,1000);await pointer(frame,'pointerup',200,0,1100);assert.equal(frame.style.getPropertyValue('--pan-x'),'0px');
  await click(button('مهام'));await click(button('مساحة'));const restored=document.querySelector<HTMLDivElement>('.orbit-canvas')!;assert.equal(restored.style.getPropertyValue('--zoom'),'1.1');assert.equal(restored.style.getPropertyValue('--pan-y'),'50px');
 });
 await check('Orbit mission placement persists per event, cancellation does not save, and tasks remain linked',async()=>{
  const storage='doyofy:orbit:v1:'+event.id;window.localStorage.removeItem(storage);const before=await made.services.events.get(event.id),design=await made.services.invitations.get(event.id);
  await render(wrap(<OrbitBoard event={event}/>));await settle();const grip=document.querySelector('.orbit-note-handle')!;
  const thread=document.querySelector('.orbit-threads path')!,path=thread.getAttribute('d');await pointer(grip,'pointerdown',100,100,0);await pointer(grip,'pointermove',180,120,100);assert.notEqual(thread.getAttribute('d'),path);await pointer(grip,'pointercancel',180,120,200);assert.equal(thread.getAttribute('d'),path);assert.equal(window.localStorage.getItem(storage),null);
  await pointer(grip,'pointerdown',100,100,300);await pointer(grip,'pointermove',180,120,400);await pointer(grip,'pointerup',180,120,500);
  const first=JSON.parse(window.localStorage.getItem(storage)!);assert.equal(Object.keys(first).length,1);const id=Object.keys(first)[0]!;assert.deepEqual(first[id],{x:280,y:152});
  await key(grip,'ArrowLeft');const second=JSON.parse(window.localStorage.getItem(storage)!);assert.equal(second[id].x,256);
  assert.deepEqual(await made.services.events.get(event.id),before);assert.deepEqual(await made.services.invitations.get(event.id),design);
  await render(wrap(<OrbitBoard key="remount" event={event}/>));await settle();assert.equal(document.querySelector<HTMLElement>('.orbit-note')!.style.left,'256px');
  await click(button('مهام'));assert.equal(document.querySelector('.orbit-canvas'),null);assert.equal(document.querySelectorAll('.orbit-task-strip.is-list a').length,7);
  await click(button('مساحة'));await settle();await click(document.querySelector('[aria-label="إعادة ترتيب المساحة"]')!);assert.equal(window.localStorage.getItem(storage),null);
 });
 await check('Orbit occasion catalogue exposes all thirteen choices, wraps in RTL, and preserves vertical scrolling',async()=>{
  let confirmed='';function Choice(){const[v,setV]=useState<EventType|null>(null);return <OrbitOccasions value={v} onChange={setV} onConfirm={t=>{confirmed=t;}}/>;}
  await render(wrap(<Choice/>));assert.equal(document.querySelectorAll('.orbit-occasion-index button').length,13);const stage=document.querySelector('.orbit-occasion-stage')!;
  const original=document.querySelector('.orbit-occasion-title h3')!.textContent;await key(stage,'ArrowLeft');assert.notEqual(document.querySelector('.orbit-occasion-title h3')!.textContent,original);
  const current=document.querySelector('.orbit-occasion-title h3')!.textContent;
  await pointer(stage,'pointerdown',100,100,0);await pointer(stage,'pointermove',80,200,100);await pointer(stage,'pointerup',80,200,200);assert.equal(document.querySelector('.orbit-occasion-title h3')!.textContent,current);
  await pointer(stage,'pointerdown',100,100,300);await pointer(stage,'pointermove',0,100,400);await pointer(stage,'pointercancel',0,100,500);assert.equal(document.querySelector('.orbit-occasion-title h3')!.textContent,current);
  await pointer(stage,'pointerdown',100,100,600);await pointer(stage,'pointermove',0,100,700);await pointer(stage,'pointerup',0,100,800);assert.notEqual(document.querySelector('.orbit-occasion-title h3')!.textContent,current);
  await fill(document.querySelector<HTMLInputElement>('input[type="search"]')!,'مناسبة أخرى');assert.equal(document.querySelectorAll('.orbit-occasion-index button').length,1);await click(button('هذه مناسبتي'));assert.equal(confirmed,'other');
 });
 await check('Orbit template desk traverses the full catalogue and blocks selection while saving',async()=>{
  const base=(await made.services.invitations.get(event.id)).draft;let used='',preview='';
  const desk=(pending=false)=><OrbitTemplateDesk event={event} base={base} presets={TEMPLATE_PRESETS} pending={pending} onPreview={p=>{preview=p.id;}} onUse={p=>{used=p.id;}}/>;
  await render(wrap(desk()));assert.equal(document.querySelectorAll('.orbit-template-index button').length,TEMPLATE_PRESETS.length);const stage=document.querySelector('.orbit-template-stage')!;
  await pointer(stage,'pointerdown',100,100,0);await pointer(stage,'pointermove',0,100,100);await pointer(stage,'pointerup',0,100,200);assert.ok(document.querySelector('.orbit-template-copy h3')!.textContent?.includes(TEMPLATE_PRESETS[1]!.name));
  await click(button('تأمّل الدعوة'));assert.equal(preview,TEMPLATE_PRESETS[1]!.id);
  await click(document.querySelectorAll('.orbit-template-index button')[TEMPLATE_PRESETS.length-1]!);await click(button('اعتمد هذا الشكل'));assert.equal(used,TEMPLATE_PRESETS.at(-1)!.id);
  used='';await render(wrap(desk(true)));await key(stage,'ArrowRight');await click(button('اعتمد هذا الشكل'));assert.equal(used,'');assert.equal(document.querySelector('.orbit-template-index [aria-pressed="true"]')!.textContent?.includes(TEMPLATE_PRESETS.at(-1)!.name),true);
 });
 await check('Orbit quick-open searches real destinations and never stacks over another modal',async()=>{
  history.replaceState(null,'','/app/events/evt_wedding/overview');await render(wrap(<OrbitQuickOpen/>));
  await act(async()=>{window.dispatchEvent(new KeyboardEvent('keydown',{key:'k',ctrlKey:true,bubbles:true,cancelable:true}));});assert.equal(document.querySelectorAll('dialog[open]').length,1);
  const input=document.querySelector<HTMLInputElement>('input[aria-label="ابحث عن مهمة"]')!;await fill(input,'الطاولات');await key(input,'Enter');assert.equal(location.pathname,'/app/events/evt_wedding/seating');assert.equal(document.querySelectorAll('dialog[open]').length,0);
  await render(wrap(<><OrbitQuickOpen/><Dialog open title="مهمة جارية" onClose={()=>{}}><p>جارٍ</p></Dialog></>));
  await act(async()=>{window.dispatchEvent(new KeyboardEvent('keydown',{key:'k',ctrlKey:true,bubbles:true,cancelable:true}));});assert.equal(document.querySelectorAll('dialog[open]').length,1);assert.ok(document.body.textContent?.includes('مهمة جارية'));
 });
 await check('Orbit creation validates each chapter and applies the selected template to the new event',async()=>{
  history.replaceState(null,'','/app/events/new?theme=orbit');await render(<App mode="history"/>);await settle();await click(button('هذه مناسبتي'));
  assert.equal(document.querySelectorAll('fieldset:not([hidden])').length,1);await click(button('التالي: الموعد'));assert.ok(document.querySelector('[aria-invalid="true"]'));assert.equal(document.querySelector('[aria-current="step"]')!.textContent,'01الأسماء');
  const names=document.querySelectorAll<HTMLInputElement>('fieldset:not([hidden]) input');await fill(names[0]!,'ليلى المدار');await fill(names[1]!,'كريم المدار');await click(button('التالي: الموعد'));
  assert.equal(document.querySelector('[aria-current="step"]')!.textContent,'02الموعد');await fill(document.querySelector<HTMLInputElement>('input[type="date"]')!,'2099-12-12');await click(button('التالي: المكان'));
  const venue=document.querySelectorAll<HTMLInputElement>('fieldset:not([hidden]) input');await fill(venue[0]!,'حديقة المدار');await fill(venue[1]!,'القاهرة');
  await act(async()=>{document.querySelector('#create-event')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});await settle();assert.ok(location.pathname.endsWith('/invitation/design'));assert.ok(document.querySelector('.ed-simple-intro'));assert.equal(document.querySelector('.orbit-template-desk'),null);
  const api=(window as unknown as {__doyofy:typeof made}).__doyofy.services,created=(await api.events.list()).find(e=>e.names.a==='ليلى المدار')!;assert.ok(created);assert.equal(created.venue.city,'القاهرة');assert.equal(created.names.b,'كريم المدار');
  await click(document.querySelector('#ed-tab-design')!);await click(button('تغيير القالب'));await settle();assert.ok(document.querySelector('.orbit-template-desk'));await click(document.querySelector('.orbit-template-copy .btn-primary')!);await settle();assert.equal(location.pathname,`/app/events/${created.id}/invitation/design`);assert.ok(document.querySelector('.orbit-editor-canvas'));assert.equal(document.querySelector('.live-preview'),null);assert.ok((await api.invitations.get(created.id)).draft.cardId);
 });
 await check('Orbit table atlas focuses real table details without changing assignments',async()=>{
  history.replaceState(null,'','/app/events/evt_wedding/seating?theme=orbit');await render(<App mode="history"/>);await settle();
  const api=(window as unknown as {__doyofy:typeof made}).__doyofy.services,before=await api.parties.list(event.id),tables=await api.seating.listTables(event.id);
  const choices=document.querySelectorAll('.orbit-table-ring button');assert.equal(choices.length,tables.length);assert.ok(choices.length>1);assert.equal(document.querySelectorAll('.table-card').length,1);
  await click(choices[choices.length-1]!);assert.equal(document.querySelector('.table-card .table-name')!.textContent,tables.at(-1)!.name);
  await click(button('كل الطاولات'));assert.equal(document.querySelectorAll('.table-card').length,tables.length);assert.deepEqual(await api.parties.list(event.id),before);
  await click(choices[0]!);assert.equal(document.querySelectorAll('.table-card').length,1);const query=document.querySelector<HTMLInputElement>('.seat-pool input[type=search]')!;await fill(query,before.find(p=>p.tableId)!.primaryGuestName);assert.equal(document.querySelectorAll('.table-card').length,tables.length);await fill(query,'');assert.equal(document.querySelectorAll('.table-card').length,1);
 });
 await check('Orbit reply lenses navigate to unresolved replies without automatically matching them',async()=>{
  history.replaceState(null,'','/app/events/evt_wedding/rsvp?theme=orbit');await render(<App mode="history"/>);await settle();const api=(window as unknown as {__doyofy:typeof made}).__doyofy.services,before=await api.rsvp.listResponses(event.id);
  assert.equal(document.querySelectorAll('.orbit-response-lenses button').length,3);await click(button('نصل الاسم بحكايته'));assert.ok(location.search.includes('tab=unmatched'));assert.equal(document.querySelector('.orbit-response-lenses [aria-pressed="true"] strong')!.textContent,'نصل الاسم بحكايته');assert.deepEqual(await api.rsvp.listResponses(event.id),before);
  await click(button('وصلت علامة فرح'));assert.ok(location.search.includes('tab=recent'));
 });
 await check('Bahja shows all occasions and a single suggested event; selecting a poster skips repeated selection',async()=>{
  await act(async()=>{made.prototype.update({theme:'bahja'});});history.replaceState(null,'','/app/events');await render(wrap(<BahjaHome/>));await settle();
  assert.equal(document.querySelectorAll('.bahja-occasion-ticket').length,13);assert.equal(document.querySelectorAll('.bahja-moment').length,1);assert.ok(document.querySelector('img[src="assets/directions/bahja-world.webp"]'));
  const birthday=document.querySelector<HTMLAnchorElement>('.bahja-occasion-ticket[href$="type=birthday"]')!;assert.ok(birthday);
  history.replaceState(null,'',birthday.getAttribute('href')+'&theme=bahja');
 });
 await check('Bahja direct creation defaults birthday content and makes design choices optional',async()=>{
  history.replaceState(null,'','/app/events/new?type=birthday&theme=bahja');await render(<App mode="history"/>);await settle();
  assert.equal(document.querySelector('.bahja-choice-grid'),null);assert.equal(document.querySelectorAll('fieldset:not([hidden])').length,3);
  await fill(document.querySelector<HTMLInputElement>('.create-form fieldset input')!,'عمر بهجة');await fill(document.querySelector<HTMLInputElement>('input[type=date]')!,'2099-11-11');
  const venue=document.querySelectorAll<HTMLInputElement>('.create-form fieldset')[2]!.querySelectorAll<HTMLInputElement>('input');await fill(venue[0]!,'حديقة بهجة');await fill(venue[1]!,'الرياض');
  await act(async()=>{document.querySelector('#create-event')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});await settle();
  assert.ok(location.pathname.endsWith('/invitation/design'));assert.ok(document.querySelector('.ed-simple-intro'));assert.equal(document.querySelector('.live-preview'),null);
  const api=(window as unknown as {__doyofy:typeof made}).__doyofy.services,created=(await api.events.list()).find(e=>e.names.a==='عمر بهجة')!;assert.ok(created);
  const design=await api.invitations.get(created.id);assert.ok(presetOf(design.draft)?.primaryOccasion==='birthday');assert.ok(design.draft.message.ar.includes('ميلاد'));assert.equal(document.querySelector('.ed-program-disclosure')!.hasAttribute('open'),false);
  await click(document.querySelector('#ed-tab-design')!);assert.equal(document.querySelector('.ed-advanced')!.hasAttribute('open'),false);
  await click(button('تغيير القالب'));await settle();assert.ok(document.querySelector('.bahja-salon'));assert.equal(document.querySelector('.live-preview'),null);
  await click(document.querySelector('.bahja-salon-copy .btn-primary')!);await settle();await click(button('انشر الدعوة'));await settle();assert.ok((await api.invitations.get(created.id)).published?.message.ar.includes('ميلاد'));await click(button('إلى الضيوف'));await settle();assert.equal(location.pathname,`/app/events/${created.id}/guests`);
 });
 await check('Bahja salon has RTL traversal, preserves vertical scroll, and blocks changes while saving',async()=>{
  const base=(await made.services.invitations.get(event.id)).draft;let preview='',used='';const salon=(pending=false)=><BahjaTemplateSalon event={event} base={base} presets={TEMPLATE_PRESETS} pending={pending} onUse={p=>{used=p.id;}} onPreview={p=>{preview=p.id;}}/>;
  await render(wrap(salon()));const stage=document.querySelector('.bahja-salon-stage')!;assert.equal(document.querySelectorAll('.bahja-salon-index button').length,TEMPLATE_PRESETS.length);
  await key(stage,'ArrowLeft');await click(button('شاهد الدعوة'));assert.equal(preview,TEMPLATE_PRESETS[1]!.id);
  await pointer(stage,'pointerdown',100,100,0);await pointer(stage,'pointermove',80,220,100);await pointer(stage,'pointerup',80,220,200);await click(button('شاهد الدعوة'));assert.equal(preview,TEMPLATE_PRESETS[1]!.id);
  await pointer(stage,'pointerdown',100,100,300);await pointer(stage,'pointermove',0,100,400);await pointer(stage,'pointercancel',0,100,500);await click(button('هذا يشبهني'));assert.equal(used,TEMPLATE_PRESETS[1]!.id);
  used='';await render(wrap(salon(true)));await key(stage,'ArrowLeft');await click(button('هذا يشبهني'));assert.equal(used,'');
 });
 await check('Bahja workspace keeps essential navigation separate and optional sections accessible',async()=>{
  history.replaceState(null,'','/app/events/evt_wedding/overview?theme=bahja');await render(<App mode="history"/>);await settle();
  assert.equal(document.querySelectorAll('.bahja-stepnav a').length,4);assert.equal(document.querySelectorAll('.journey li').length,3);assert.equal(document.querySelector('.bahja-optional'),null);
  await click(button('تفاصيل إضافية'));assert.ok(document.querySelector('.bahja-optional a[href$="/seating"]'));
 });
 await check('Horizon has a graduation hero, all occasions and four essential workspace steps',async()=>{
  history.replaceState(null,'','/app/events?theme=horizon');await render(<App mode="history"/>);await settle();
  assert.ok(document.querySelector('.horizon-hero h1')?.textContent?.includes('كل نهاية.'));assert.equal(document.querySelectorAll('.horizon-occasion-grid a').length,13);assert.ok(document.querySelector('.horizon-hero a[href$="type=graduation"]'));assert.equal(document.querySelectorAll('.horizon-occasion-grid').length,2);
  history.replaceState(null,'','/app/events/evt_wedding/overview?theme=horizon');await render(null);await render(<App mode="history"/>);await settle();assert.equal(document.querySelectorAll('.horizon-steps a').length,4);await click(button('تفاصيل إضافية'));assert.ok(document.querySelector('.horizon-optional a[href$="/seating"]'));
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
  history.replaceState(null,'','/app/events?theme=signature');await render(<App mode="history"/>);await settle();
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
  history.replaceState(null,'','/app/events/new?theme=signature');await render(<App mode="history"/>);await settle();
  await click(button('قائمة وبحث'));assert.ok(document.querySelector('.sig-create-sub')?.textContent?.includes('ابحث عن مناسبتك'));
  await click(button('بطاقات'));assert.ok(document.querySelector('.sig-create-sub')?.textContent?.includes('اسحب البطاقات'));
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
  assert.equal(document.querySelectorAll('.is-drop-target').length,1);assert.equal(transfer.dropEffect,'move');
  await drag(source,'dragend');assert.equal(document.querySelectorAll('.is-drop-target,.is-droppable').length,0);
 });
 await check('editor message and programme previews retain both names and actual content',async()=>{
  const design=defaultDesign(event);design.message.ar='كلمة مخصصة تظهر كاملة';design.program=[{time:'21:30',ar:'لحظة مخصصة',en:'A custom moment'}];
  await render(<EditorWorkbench event={event} content={design} page="message"/>);assert.ok(document.querySelector('.ed-copy-names')!.textContent?.includes(event.names.a));assert.ok(document.querySelector('.ed-copy-names')!.textContent?.includes(event.names.b!));assert.ok(document.querySelector('.ed-copy-message')!.textContent?.includes(design.message.ar));
  await render(<EditorWorkbench event={event} content={design} page="program"/>);assert.ok(document.querySelector('.ed-copy-program')!.textContent?.includes('لحظة مخصصة'));assert.ok(document.querySelector('.ed-copy-program')!.textContent?.includes('A custom moment'));
 });
 await check('logout gates editor and reception; signup preserves return and stored invitation',async()=>{
  history.replaceState(null,'','/app/events/evt_wedding/invitation/design?theme=signature');await render(<App mode="history"/>);await settle();
  const api=(window as unknown as {__doyofy:typeof made}).__doyofy.services,before=(await api.invitations.get(event.id)).draft;
  history.pushState(null,'','/app/logout');window.dispatchEvent(new Event('popstate'));await settle();assert.equal(currentDemoAccount().status,'signed-out');assert.ok(document.querySelector('.auth-copy')!.textContent?.includes('نراك في فرحة قادمة'));
  for(const path of ['/check-in/evt_wedding','/app/events/evt_wedding/invitation/design']){history.pushState(null,'',path);window.dispatchEvent(new Event('popstate'));await settle();assert.equal(location.pathname,'/app/login');assert.equal(new URLSearchParams(location.search).get('next'),path);}
  await click(document.querySelector('.auth-switch a')!);await settle();assert.equal(location.pathname,'/app/signup');assert.equal(new URLSearchParams(location.search).get('next'),'/app/events/evt_wedding/invitation/design');
  await fill(document.querySelector('input[autocomplete="name"]')!,'ريم');await fill(document.querySelector('input[type="email"]')!,'reem@example.com');await act(async()=>{document.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});await settle();assert.equal(location.pathname,'/app/events/evt_wedding/invitation/design');assert.equal(api.session.currentUser().name,'ريم');assert.equal(api.session.currentUser().id,'usr_owner');assert.deepEqual((await api.invitations.get(event.id)).draft,before);
  await act(async()=>saveDemoAccount({status:'signed-out'}));history.pushState(null,'',`/i/${event.slug}`);window.dispatchEvent(new Event('popstate'));await settle();assert.ok(location.pathname.startsWith('/i/'));assert.equal(document.querySelector('.auth-form'),null);
  await act(async()=>saveDemoAccount({status:'demo'}));
 });
 await check('all home themes expose account and logout',async()=>{
  for(const theme of ['signature','orbit','bahja','horizon']){history.pushState(null,'',`/app/events?theme=${theme}`);window.dispatchEvent(new Event('popstate'));await render(<App mode="history"/>);await settle();assert.ok(document.querySelector('.account-trigger'),theme);await click(document.querySelector('.account-trigger')!);assert.ok(document.querySelector('dialog a[href="/app/logout"]'),theme);await click(document.querySelector('dialog [aria-label="إغلاق"]')!);}
 });
 console.log(`DOM behavior: ${passed}/${passed} passed + malformed-route check.`);
 const routes=[
 ['/app/events','مناسباتي'],['/app/events/new','كل فرحة تبدأ من هنا.'],
 ['/app/events/evt_wedding/overview','زفاف نورة وفيصل'],['/app/events/evt_wedding/invitation','الدعوة'],
 ['/app/events/evt_wedding/more','المزيد'],['/app/events/evt_wedding/invitation/preview','معاينة'],['/app/events/evt_wedding/invitation/templates','لمسة جديدة لدعوتك.'],['/app/events/evt_wedding/invitation/design','تصميم الدعوة'],
 ['/app/events/evt_wedding/guests','الضيوف'],['/app/events/evt_wedding/guests/import','استيراد'],
 ['/app/events/evt_wedding/rsvp','الردود'],['/app/events/evt_wedding/seating','الطاولات'],
 ['/app/events/evt_wedding/check-in','الاستقبال'],['/check-in/evt_wedding','مسح رمز QR'],
 ['/app/events/evt_wedding/settings','تفاصيل المناسبة'],['/app/events/evt_katb/summary','ملخص المناسبة'],
 ['/prototype/screen-review','نراجعها، شاشة بشاشة.'],['/prototype/design-review','من أول فكرة'],['/prototype/design-directions','ثمانية عوالم مختلفة.'],['/app/events/missing/overview','لم نجد']
 ];
 for(const [path,text] of routes){
  history.replaceState(null,'',path!);setup();
  try{await render(<App mode="history"/>);for(let i=0;i<12;i++)await act(async()=>{await new Promise(r=>setTimeout(r,15));});assert.ok(document.getElementById('root')!.textContent?.includes(text!),`route ${path}: ${document.getElementById('root')!.textContent?.slice(-400)}`);console.log('✔ DOM route: '+path);}finally{await clear();}
 }
 console.log(`DOM route mounting: ${routes.length}/${routes.length} passed. No browser/rendering/WebGL/device QA.`);
 let orbitRoutes=0;
 for(const [path] of routes.filter(([p])=>!p!.includes('prototype')&&!p!.includes('missing'))){
  history.replaceState(null,'',path+'?theme=orbit');setup();try{await render(<App mode="history"/>);await settle();assert.equal(document.documentElement.dataset.theme,'orbit');assert.ok(document.getElementById('root')!.textContent!.length>40,`orbit route ${path}`);assert.equal(document.querySelector('.ws-side'),null);orbitRoutes++;console.log('✔ Orbit route: '+path);}finally{await clear();}
 }
 console.log(`Orbit route mounting: ${orbitRoutes}/${orbitRoutes} passed. No browser/rendering/WebGL/device QA.`);
 let bahjaRoutes=0;
 for(const [path] of routes.filter(([p])=>!p!.includes('prototype')&&!p!.includes('missing'))){history.replaceState(null,'',path+'?theme=bahja');setup();try{await render(<App mode="history"/>);await settle();assert.equal(document.documentElement.dataset.theme,'bahja');assert.ok(document.getElementById('root')!.textContent!.length>40,`bahja route ${path}`);assert.equal(document.querySelector('.ws-side'),null);bahjaRoutes++;console.log('✔ Bahja route: '+path);}finally{await clear();}}
 console.log(`Bahja route mounting: ${bahjaRoutes}/${bahjaRoutes} passed. No browser/rendering/WebGL/device QA.`);
 let horizonRoutes=0;
 for(const [path] of routes.filter(([p])=>!p!.includes('prototype')&&!p!.includes('missing'))){history.replaceState(null,'',path+'?theme=horizon');setup();try{await render(<App mode="history"/>);await settle();assert.equal(document.documentElement.dataset.theme,'horizon');assert.ok(document.getElementById('root')!.textContent!.length>40,`horizon route ${path}`);assert.equal(document.querySelector('.ws-side'),null);horizonRoutes++;console.log('✔ Horizon route: '+path);}finally{await clear();}}
 console.log(`Horizon route mounting: ${horizonRoutes}/${horizonRoutes} passed. No browser/rendering/WebGL/device QA.`);
 let signatureRoutes=0;
 for(const [path] of routes.filter(([p])=>!p!.includes('prototype')&&!p!.includes('missing'))){history.replaceState(null,'',path+'?theme=signature');setup();try{await render(<App mode="history"/>);await settle();assert.equal(document.documentElement.dataset.theme,'signature');assert.ok(document.getElementById('root')!.textContent!.length>40,`signature route ${path}`);signatureRoutes++;console.log('✔ Signature route: '+path);}finally{await clear();}}
 console.log(`Signature route mounting: ${signatureRoutes}/${signatureRoutes} passed. No browser/rendering/WebGL/device QA.`);
}
