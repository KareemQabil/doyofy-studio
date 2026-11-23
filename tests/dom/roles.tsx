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
import { GeneralLinkCard } from '../../src/features/shared/GeneralLinkCard';
import { GateMode } from '../../src/features/check-in/GateMode';
import { CreateEvent } from '../../src/features/events/CreateEvent';
import { SignatureShell } from '../../src/features/signature/SignatureShell';

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
    // only the owner creates events (the service refuses a team member): set one up as the owner, then back to catering
    await assert.rejects(made.services.events.create({ type: 'birthday', names: { a: 'قائمة جديدة' }, date: event.date, time: '20:00', venue: { name: 'قاعة', city: 'الرياض' } }), /صاحب المناسبة/);
    await act(async () => made.prototype.update({ role: 'organizer' }));
    const fresh = await made.services.events.create({ type: 'birthday', names: { a: 'قائمة جديدة' }, date: event.date, time: '20:00', venue: { name: 'قاعة', city: 'الرياض' } });
    await act(async () => made.prototype.update({ role: 'caterer' }));
    history.replaceState(null, '', `/app/events/${fresh.id}/settings`);
    await render(wrap(<EventWorkspace key={fresh.id} eventId={fresh.id} section="settings">{() => <span data-general-settings>general settings</span>}</EventWorkspace>)); await settle();
    await act(async () => { document.querySelector<HTMLButtonElement>('[aria-labelledby="gxs-meals"] [role="switch"]')!.click(); });
    const saveMenu = [...document.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent === 'احفظ التغييرات');
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
    await act(async () => made.prototype.update({ role: 'organizer' })); // the caterer could not prepare this data (services refuse)
    const party = await made.services.parties.create(event.id, { primaryGuestName: 'تحقق عرض الضيافة', maxPartySize: 1 });
    await made.services.rsvp.setByOrganizer(party.id, { attending: true, count: 1 });
    const [table] = await made.services.seating.listTables(event.id);
    await made.services.seating.assign(party.id, table!.id);
    await made.services.rsvp.setByOrganizer(party.id, { attending: false, count: 0 });
    history.replaceState(null, '', '/app/events/evt_wedding/seating');
    await render(wrap(<SeatingPage event={event} />)); await settle();
    await act(async () => document.querySelector<HTMLButtonElement>('.seat-head-actions .menu-trigger')!.click());
    const addTable = [...document.querySelectorAll('[role="menuitem"]')].find(item => item.textContent === 'أضف طاولة') as HTMLButtonElement;
    await act(async () => addTable.click()); assert.ok(document.querySelector('dialog[open]'));
    await act(async () => made.prototype.update({ role: 'caterer' })); await settle();
    assert.ok(!document.querySelector('dialog[open]'), 'a role change closes the management dialog');
    assert.ok(![...document.querySelectorAll('button')].some(button => button.textContent?.includes('أزله من الطاولة')), 'warning cannot mutate assignments');
    assert.ok(!document.querySelector('[aria-label^="خيارات "]'), 'unavailable management menus are hidden');
    assert.equal((await made.services.parties.get(party.id)).tableId, table!.id);
  });
  // ------------------------------------------------------------------ coordinator (owner decision, domain/roles)
  const items = () => [...document.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')];
  const openMenu = async (trigger: Element | null | undefined) => { assert.ok(trigger, 'menu trigger'); await act(async () => (trigger as HTMLButtonElement).click()); };
  await check('coordinator works the guest list but cannot delete, transfer or export', async () => {
    await act(async () => made.prototype.update({ role: 'coordinator' }));
    const event = await made.services.events.get('evt_wedding');
    const [first] = await made.services.parties.list(event.id);
    history.replaceState(null, '', `/app/events/evt_wedding/guests?party=${first!.id}`);
    await render(wrap(<GuestsPage event={event} />)); await settle();
    const header = document.querySelector('.g2-head, .page-head')!;
    assert.ok([...header.querySelectorAll('button')].some((b) => b.textContent?.includes('إضافة ضيف') && !b.disabled), 'can add');
    const exportBtn = [...header.querySelectorAll('button')].find((b) => b.textContent?.includes('تصدير ملف'));
    assert.ok(exportBtn?.disabled, 'export is visible but disabled');
    assert.match(exportBtn!.closest('.owner-only')?.textContent ?? '', /متاح لصاحب المناسبة/, 'and says why');
    // the guest drawer: edit yes, delete no
    await openMenu(document.querySelector('dialog[open] .menu-trigger'));
    assert.ok(items().some((i) => i.textContent === 'تعديل البيانات'));
    assert.ok(!items().some((i) => i.textContent?.includes('حذف')), 'no delete for the coordinator');
    // bulk actions: export explained, moving between events not offered, sharing kept
    history.replaceState(null, '', '/app/events/evt_wedding/guests');
    await render(wrap(<GuestsPage key="bulk" event={event} />)); await settle();
    await act(async () => [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('تحديد'))!.click());
    await act(async () => document.querySelector<HTMLButtonElement>('.g2-bulk-pick')!.click());
    await openMenu(document.querySelector('.g2-bulk .menu-trigger'));
    const exp = items().find((i) => i.textContent?.includes('تصدير المحدد'))!;
    assert.equal(exp.getAttribute('aria-disabled'), 'true');
    assert.match(exp.textContent ?? '', /متاح لصاحب المناسبة/);
    await act(async () => exp.click());
    assert.ok(!document.querySelector('dialog[open]'), 'the export dialog never opens');
    assert.ok(!items().some((i) => i.textContent?.includes('نقل')), 'no transfer between events');
    assert.ok(items().some((i) => /تذكير|ذكّر/.test(i.textContent ?? '')), 'reminders stay');
  });
  await check('coordinator can switch and copy the general link (no publish step); seating keeps auto-seat and order, export explained', async () => {
    await act(async () => made.prototype.update({ role: 'organizer' }));
    const fresh = await made.services.events.create({ type: 'birthday', names: { a: 'دعوة المنسق' }, date: '2027-06-20', time: '20:00', venue: { name: 'قاعة', city: 'الرياض' } });
    const wedding = await made.services.invitations.get('evt_wedding');
    await made.services.invitations.saveDraft(fresh.id, wedding!.draft);
    await act(async () => made.prototype.update({ role: 'coordinator' }));
    history.replaceState(null, '', `/app/events/${fresh.id}/guests`);
    await render(wrap(<GeneralLinkCard event={fresh} />)); await settle();
    assert.doesNotMatch(document.body.textContent ?? '', /نشر|منشور|مسودة/, 'no publish words');
    const sw = document.querySelector<HTMLButtonElement>('.general-link [role="switch"]')!;
    assert.equal(sw.disabled, false, 'the team shares invitations');
    await act(async () => sw.click()); await settle();
    const now = await made.services.events.get(fresh.id);
    assert.equal(now.settings.allowGeneralLink, !fresh.settings.allowGeneralLink, 'the switch changes the event');
    await render(wrap(<GeneralLinkCard event={{ ...now, settings: { ...now.settings, allowGeneralLink: true } }} />)); await settle();
    assert.ok((document.querySelector<HTMLInputElement>('.general-link input.copy-input')?.value ?? '').includes(`/i/`), 'the link to copy');

    const event = await made.services.events.get('evt_wedding');
    history.replaceState(null, '', '/app/events/evt_wedding/seating');
    await render(wrap(<SeatingPage event={event} />)); await settle();
    assert.ok(document.querySelector('.as-entry'), 'auto-seat is the primary action');
    await openMenu(document.querySelector('.seat-head-actions .menu-trigger'));
    assert.ok(items().some((i) => i.textContent === 'ترتيب الطاولات' && i.getAttribute('aria-disabled') !== 'true'), 'table order allowed');
    const exp = items().find((i) => i.textContent?.includes('تصدير ملف'))!;
    assert.equal(exp.getAttribute('aria-disabled'), 'true');
    assert.match(exp.textContent ?? '', /متاح لصاحب المناسبة/);
    await openMenu(document.querySelector('.table-card .table-head .menu-trigger'));
    const tableMenu = document.querySelector('.table-card .menu-list')!;
    assert.ok(tableMenu.textContent?.includes('تعديل الاسم والسعة'));
    assert.ok(!tableMenu.textContent?.includes('تصدير'), 'per-table export is not offered');
    await act(async () => made.prototype.update({ role: 'organizer' }));
  });
  await check('the owner keeps delete, transfer and export', async () => {
    await act(async () => made.prototype.update({ role: 'organizer' }));
    const event = await made.services.events.get('evt_wedding');
    history.replaceState(null, '', '/app/events/evt_wedding/guests');
    await render(wrap(<GuestsPage event={event} />)); await settle();
    const exportBtn = [...document.querySelectorAll('.g2-head button, .page-head button')].find((b) => b.textContent?.includes('تصدير ملف')) as HTMLButtonElement;
    assert.ok(exportBtn && !exportBtn.disabled && !exportBtn.closest('.owner-only'));
  });
  await check('coordinator at the gate: a declined guest never reads as expected, an undo names the family, a walk-in is logged', async () => {
    await act(async () => made.prototype.update({ role: 'coordinator' }));
    const all = await made.services.parties.list('evt_wedding');
    const declined = all.find((p) => p.rsvpStatus === 'declined' && p.checkedInCount === 0)!;
    const confirmed = all.find((p) => p.rsvpStatus === 'confirmed' && p.checkedInCount === 0)!;
    history.replaceState(null, '', '/check-in/evt_wedding');
    await render(wrap(<GateMode eventId="evt_wedding" />)); await settle();
    const type = async (text: string) => {
      const input = document.querySelector<HTMLInputElement>('#gate-q')!;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      await act(async () => { setter.call(input, text); input.dispatchEvent(new Event('input', { bubbles: true })); }); await settle();
    };
    await type(declined.primaryGuestName);
    const row = [...document.querySelectorAll('.gate-result')].find((b) => b.textContent?.includes(declined.primaryGuestName))!;
    assert.equal(row.querySelector('.gate-pill')?.textContent, 'اعتذروا');
    assert.ok(row.querySelector('.gate-pill.is-declined'));
    await act(async () => (row as HTMLButtonElement).click()); await settle();
    const facts = document.querySelector('.gate-facts')!.textContent ?? '';
    assert.ok(facts.includes('الرد') && facts.includes('اعتذروا') && !facts.includes('أكدوا'), 'no «أكدوا: اعتذروا»');
    await act(async () => document.querySelector<HTMLButtonElement>('.gate-back')!.click()); await settle();

    await type(confirmed.primaryGuestName);
    await act(async () => [...document.querySelectorAll<HTMLButtonElement>('.gate-result')].find((b) => b.textContent?.includes(confirmed.primaryGuestName))!.click()); await settle();
    await act(async () => document.querySelector<HTMLButtonElement>('.gate-actions.is-dock .btn-primary')!.click()); await settle();
    assert.ok(document.querySelector('.gate-done'));
    // undo is a quiet second step: the first tap only asks, with the family's name
    await act(async () => [...document.querySelectorAll<HTMLButtonElement>('.gate-done button')].find((b) => b.textContent?.includes('تراجع'))!.click()); await settle();
    assert.ok(document.querySelector('.gate-done'), 'still on the done card');
    assert.match(document.querySelector('.gate-undo-ask')?.textContent ?? '', new RegExp(`إلغاء تسجيل دخول ${confirmed.primaryGuestName}؟`));
    assert.equal(document.activeElement?.textContent, 'نعم، ألغِ الدخول', 'the question takes the focus');
    assert.ok((await made.services.parties.get(confirmed.id)).checkedInCount > 0, 'nothing undone yet');
    await act(async () => [...document.querySelectorAll<HTMLButtonElement>('.gate-undo-ask button')].find((b) => b.textContent === 'نعم، ألغِ الدخول')!.click()); await settle();
    assert.match(document.querySelector('.gate-notice')?.textContent ?? '', new RegExp(`تم التراجع عن دخول ${confirmed.primaryGuestName}`));
    assert.equal((await made.services.parties.get(confirmed.id)).checkedInCount, 0);

    const counted = () => Number(document.querySelector('.gate-counter .num')?.textContent);
    const before = counted();
    await type('شخص غير مدعو');
    await act(async () => [...document.querySelectorAll<HTMLButtonElement>('.gate-empty button')].find((b) => b.textContent?.includes('من خارج القائمة'))!.click()); await settle();
    const save = document.querySelector<HTMLButtonElement>('.gate-actions.is-dock button')!;
    assert.ok(save.disabled, 'needs the staff confirmation first');
    await act(async () => document.querySelector<HTMLInputElement>('.gate-decision input[type="checkbox"]')!.click()); await settle();
    await act(async () => document.querySelector<HTMLButtonElement>('.gate-actions.is-dock button')!.click()); await settle();
    assert.match(document.querySelector('.gate-notice')?.textContent ?? '', /شخص غير مدعو/);
    const [last] = await made.services.activity.list('evt_wedding', 1);
    assert.equal(last!.kind, 'check_in_walk_in');
    // a walk-in counts as an arrival, like a let-in declined guest, and the counter says how many came in by exception
    assert.equal(counted(), before + 1);
    assert.match(document.querySelector('.gate-counter-special')?.textContent ?? '', /منهم .* بإذن خاص/);
    await act(async () => made.prototype.update({ role: 'organizer' }));
  });
  await check('coordinator cannot create an event: no «مناسبة جديدة», the route explains, the service refuses', async () => {
    await act(async () => made.prototype.update({ role: 'coordinator' }));
    history.replaceState(null, '', '/app/events/new');
    await render(wrap(<><SignatureShell><span /></SignatureShell><CreateEvent /></>)); await settle();
    assert.ok(!document.querySelector('.sig-header-new'), 'no create link in the header');
    assert.match(document.body.textContent ?? '', /إنشاء المناسبات لصاحب المناسبة/);
    assert.ok(!document.querySelector('form#create-event'), 'no wizard to fill in');
    await assert.rejects(made.services.events.create({ type: 'birthday', names: { a: 'منسق' }, date: '2027-06-20', time: '20:00', venue: { name: 'قاعة', city: 'الرياض' } }), /صاحب المناسبة/);
    await act(async () => made.prototype.update({ role: 'organizer' })); await settle();
    assert.ok(document.querySelector('.sig-header-new'), 'the owner keeps it');
  });
  console.log('10/10 role DOM tests passed');
}
