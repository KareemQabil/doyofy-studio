import assert from 'node:assert/strict';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ServicesProvider } from '../../src/app/data';
import { RouterProvider } from '../../src/app/router';
import { createServices } from '../../src/services';
import { OrganizerSessionGate } from '../../src/features/account/AccountPages';
import { SeatingPage } from '../../src/features/seating/SeatingPage';
import { GuestsPage } from '../../src/features/guests/GuestsPage';
import { EventWorkspace } from '../../src/features/workspace/EventWorkspace';
import { SettingsPage } from '../../src/features/settings/SettingsPage';

export async function run() {
  let root: Root;
  const made = createServices(); made.prototype.update({ latencyMs: 0, role: 'caterer' });
  const wrap = (node: ReactNode) => <ServicesProvider {...made}><RouterProvider mode="history"><OrganizerSessionGate>{node}</OrganizerSessionGate></RouterProvider></ServicesProvider>;
  const render = async (node: ReactNode) => { await act(async () => { root.render(node); }); };
  const settle = async () => { await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); }); };
  const check = async (name: string, fn: () => Promise<void>) => {
    root = createRoot(document.querySelector('#root')!);
    try { await fn(); console.log(`✔ role DOM: ${name}`); }
    finally { await act(async () => root.unmount()); }
  };
  await check('all direct organizer mutation routes block caterer and preserve an account recovery link', async () => {
    for (const route of ['/app/events/new', '/app/events/evt_wedding/guests/import', '/app/events/evt_wedding/invitation/design', '/app/events/evt_wedding/invitation/templates', '/app/events/evt_wedding/invitation/preview', '/check-in/evt_wedding', '/prototype/screen-review']) {
      history.replaceState(null, '', route);
      await render(wrap(<button data-mutation-sentinel>mutable screen</button>));
      assert.equal(!!document.querySelector('[data-mutation-sentinel]'), false, route);
      assert.ok(document.querySelector('a[href="/app/account"]'), `account recovery: ${route}`);
    }
  });
  await check('catering event list offers only food/table navigation, with no creation CTA', async () => {
    history.replaceState(null, '', '/app/events');
    await render(wrap(<button data-mutation-sentinel>mutable home</button>)); await settle();
    assert.equal(!!document.querySelector('[data-mutation-sentinel]'), false);
    assert.ok(!document.querySelector('a[href="/app/events/new"]'), 'no creation link');
    assert.ok(document.querySelector('a[href$="?view=food"]'));
  });
  await check('caterer guest and seating routes remain read-only and public guest/account routes remain open', async () => {
    const event = await made.services.events.get('evt_wedding');
    history.replaceState(null, '', '/app/events/evt_wedding/guests');
    await render(wrap(<GuestsPage event={event} />)); await settle();
    assert.equal(!!document.querySelector('.g2-row'), false);
    assert.equal(!!document.querySelector('a[href^="https://wa.me"]'), false);
    assert.equal(!!document.querySelector('.food-actions a'), false);
    history.replaceState(null, '', '/app/events/evt_wedding/seating');
    await render(wrap(<SeatingPage event={event} />)); await settle();
    assert.equal(!!document.querySelector('[draggable="true"]'), false);
    assert.ok(!Array.from(document.querySelectorAll('button')).some((b) => b.textContent === 'أضف طاولة'));
    history.replaceState(null, '', '/app/events/evt_wedding/settings');
    await render(wrap(<EventWorkspace eventId={event.id} section="settings">{() => <span data-general-settings>general event management</span>}</EventWorkspace>)); await settle();
    assert.ok(document.getElementById('gxs-meals'), 'caterer can configure meals');
    assert.ok(document.getElementById('gxs-diet'), 'caterer can configure dietary question');
    assert.ok(!document.getElementById('gxs-gifts'), 'food-only settings exclude wishlist');
    assert.ok(!document.querySelector('[data-general-settings]'), 'general event settings never mount for caterer');
    const fresh = await made.services.events.create({ type: 'birthday', names: { a: 'قائمة جديدة' }, date: event.date, time: '20:00', venue: { name: 'قاعة', city: 'الرياض' } });
    history.replaceState(null, '', `/app/events/${fresh.id}/settings`);
    await render(wrap(<EventWorkspace key={fresh.id} eventId={fresh.id} section="settings">{() => <span data-general-settings>general settings</span>}</EventWorkspace>)); await settle();
    await act(async () => { document.querySelector<HTMLButtonElement>('[aria-labelledby="gxs-meals"] [role="switch"]')!.click(); });
    const saveMenu = [...document.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent === 'حفظ ونشر للضيوف');
    assert.ok(saveMenu && !saveMenu.disabled, 'fresh menu can be saved');
    await act(async () => { saveMenu.click(); }); await settle();
    const saved = await made.services.events.get(fresh.id);
    assert.equal(saved.guestExperience?.meals.enabled, true);
    assert.equal(saved.guestExperience?.meals.options.length, 2, 'new event menu is persisted');
    await act(async () => made.prototype.update({ role: 'organizer' }));
    await render(wrap(<SettingsPage event={event} />)); await settle();
    assert.ok(!document.getElementById('gxs-meals'), 'owner has no menu controls');
    assert.ok(document.getElementById('gxs-gifts'), 'owner keeps wishlist controls');
    await act(async () => made.prototype.update({ role: 'caterer' }));
    for (const route of ['/app/account', '/i/noura-faisal/ABCDE']) {
      history.replaceState(null, '', route); await render(wrap(<span data-allowed-sentinel>allowed</span>));
      assert.ok(document.querySelector('[data-allowed-sentinel]'), route);
    }
  });
  await check('changing role while a forbidden route is open updates presentation immediately', async () => {
    history.replaceState(null, '', '/app/events/new');
    await render(wrap(<span data-mutation-sentinel>organizer creation</span>));
    assert.equal(!!document.querySelector('[data-mutation-sentinel]'), false);
    await act(async () => made.prototype.update({ role: 'organizer' }));
    assert.ok(document.querySelector('[data-mutation-sentinel]'));
    await act(async () => made.prototype.update({ role: 'caterer' }));
    assert.equal(!!document.querySelector('[data-mutation-sentinel]'), false);
  });
  await check('catering closes an open table editor and cannot act on declined-party warnings', async () => {
    const event = await made.services.events.get('evt_wedding');
    const party = await made.services.parties.create(event.id, { primaryGuestName: 'تحقق عرض الضيافة', maxPartySize: 1 });
    await made.services.rsvp.setByOrganizer(party.id, { attending: true, count: 1 });
    const [table] = await made.services.seating.listTables(event.id);
    await made.services.seating.assign(party.id, table!.id);
    await made.services.rsvp.setByOrganizer(party.id, { attending: false, count: 0 });
    await act(async () => made.prototype.update({ role: 'organizer' }));
    history.replaceState(null, '', '/app/events/evt_wedding/seating');
    await render(wrap(<SeatingPage event={event} />)); await settle();
    const addTable = [...document.querySelectorAll('button')].find(button => button.textContent === 'أضف طاولة')!;
    await act(async () => addTable.click()); assert.ok(document.querySelector('dialog[open]'));
    await act(async () => made.prototype.update({ role: 'caterer' })); await settle();
    assert.ok(!document.querySelector('dialog[open]'), 'a role change closes the management dialog');
    assert.ok(![...document.querySelectorAll('button')].some(button => button.textContent?.includes('أزله من الطاولة')), 'warning cannot mutate assignments');
    assert.ok(!document.querySelector('[aria-label^="خيارات "]'), 'unavailable management menus are hidden');
    assert.equal((await made.services.parties.get(party.id)).tableId, table!.id);
  });
  console.log('5/5 role DOM tests passed');
}
