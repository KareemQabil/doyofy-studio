import assert from 'node:assert/strict';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ServicesProvider } from '../../src/app/data';
import { RouterProvider } from '../../src/app/router';
import { createServices } from '../../src/services';
import { ToastProvider } from '../../src/ui/primitives/Feedback';
import { SeatingPage } from '../../src/features/seating/SeatingPage';

export async function run() {
  const made = createServices(); made.prototype.update({ latencyMs: 0, role: 'organizer' }); made.prototype.reset('before');
  const s = made.services;
  const event = await s.events.get('evt_wedding');
  history.replaceState(null, '', `/app/events/${event.id}/seating`);
  let root: Root;
  const wrap = (node: ReactNode) => <ServicesProvider {...made}><RouterProvider mode="history"><ToastProvider>{node}</ToastProvider></RouterProvider></ServicesProvider>;
  const settle = async () => { for (let i = 0; i < 6; i++) await act(async () => { await new Promise((r) => setTimeout(r, 10)); }); };
  const click = async (el: Element | undefined | null) => { assert.ok(el, 'element exists'); await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); }); await settle(); };
  const button = (text: string, scope: ParentNode = document) => [...scope.querySelectorAll('button')].find((b) => b.textContent?.trim() === text || b.textContent?.includes(text));
  const sheet = () => document.querySelector('dialog.as-sheet[open]');
  const seating = async () => new Map((await s.parties.list(event.id)).map((p) => [p.id, p.tableId ?? null]));
  const check = async (name: string, fn: () => Promise<void>) => {
    root = createRoot(document.querySelector('#root')!);
    try { await act(async () => { root.render(wrap(<SeatingPage event={event} />)); }); await settle(); await fn(); console.log(`✔ seating DOM: ${name}`); }
    finally { await act(async () => root.unmount()); }
  };

  await check('the entry point is primary while confirmed guests wait; cancel closes the preview with nothing changed', async () => {
    const before = await seating();
    const entry = document.querySelector<HTMLButtonElement>('.as-entry');
    assert.ok(entry, 'auto-seat entry point near the top');
    assert.ok(entry.classList.contains('btn-primary'), 'primary while there are unseated confirmed guests');
    await click(entry);
    assert.ok(sheet(), 'preview opens');
    const chips = sheet()!.querySelectorAll('.as-chip');
    assert.equal(chips.length, 4, 'the four unseated confirmed parties are proposed');
    assert.ok(sheet()!.querySelector('.as-bar'), 'tables show a fill bar');
    assert.deepEqual(await seating(), before, 'previewing writes nothing');
    await click(button('إلغاء', sheet()!));
    assert.equal(sheet(), null);
    assert.deepEqual(await seating(), before, 'cancel = no change');
  });

  await check('preview → move a party → exclude another → apply atomically → undo restores everything', async () => {
    const before = await seating();
    await click(document.querySelector('.as-entry'));
    // move: pick the first chip and send it to a different table that fits
    const first = sheet()!.querySelector<HTMLButtonElement>('.as-chip')!;
    const name = first.querySelector('.as-chip-name')!.textContent!;
    await click(first);
    assert.equal(first.getAttribute('aria-pressed'), 'true');
    const select = sheet()!.querySelector<HTMLSelectElement>('.as-adjust select')!;
    const target = [...select.options].find((o) => !o.disabled && o.value !== select.value);
    assert.ok(target, 'another table fits');
    const setValue = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(select), 'value')!.set!;
    await act(async () => { setValue.call(select, target.value); select.dispatchEvent(new Event('change', { bubbles: true })); });
    await settle();
    const tableName = target.textContent!.split(' · ')[0]!;
    const card = [...sheet()!.querySelectorAll('.as-table')].find((c) => c.querySelector('.as-table-name')?.textContent?.startsWith(tableName))!;
    assert.ok([...card.querySelectorAll('.as-chip-name')].some((c) => c.textContent === name), 'the chip moved to the chosen table');
    await click(button('تم', sheet()!.querySelector('.as-adjust')!));
    // exclude: a different chip leaves the suggestion
    const other = [...sheet()!.querySelectorAll<HTMLButtonElement>('.as-chip')].find((c) => c.querySelector('.as-chip-name')!.textContent !== name)!;
    const otherName = other.querySelector('.as-chip-name')!.textContent!;
    await click(other);
    await click(button('استبعد من التوزيع', sheet()!));
    assert.ok(sheet()!.querySelector('#as-excluded'), 'excluded section lists it');
    assert.ok(sheet()!.textContent!.includes(otherName));
    assert.equal(sheet()!.querySelectorAll('.as-chip').length, 3);
    assert.deepEqual(await seating(), before, 'adjusting writes nothing');
    await click(button('اعتمد التوزيع', sheet()!));
    assert.equal(sheet(), null, 'sheet closes after applying');
    const after = await seating();
    const parties = await s.parties.list(event.id);
    const byName = (n: string) => parties.find((p) => p.primaryGuestName === n)!;
    const targetId = (await s.seating.listTables(event.id)).find((t) => t.name === tableName)!.id;
    assert.equal(after.get(byName(name).id), targetId, 'the moved party sits where the organizer put it');
    assert.equal(after.get(byName(otherName).id), null, 'the excluded party stays unseated');
    assert.equal(parties.filter((p) => p.rsvpStatus === 'confirmed' && !p.tableId).length, 1, 'everyone else is seated');
    for (const [id, table] of before) if (table) assert.equal(after.get(id), table, 'seated parties were kept');
    const toast = [...document.querySelectorAll('.toast')].find((t) => t.textContent?.includes('تم اعتماد التوزيع'));
    assert.ok(toast, 'success toast');
    await click(toast!.querySelector('.toast-action'));
    assert.deepEqual(await seating(), before, 'undo restores the previous seating');
    assert.ok(document.body.textContent!.includes('أعدنا التوزيع كما كان'));
  });

  await check('a stale preview is refused with a visible message and no partial write; the preview then follows live data', async () => {
    await click(document.querySelector('.as-entry'));
    const before = await seating();
    const p = (await s.parties.list(event.id)).find((x) => x.rsvpStatus === 'confirmed' && !x.tableId)!;
    const last = (await s.seating.listTables(event.id)).at(-1)!;
    // another tab seats one of the proposed parties just before «اعتمد التوزيع» is pressed
    const applyButton = button('اعتمد التوزيع', sheet()!)!;
    await act(async () => {
      const elsewhere = s.seating.assign(p.id, last.id); // with no latency the store changes synchronously, before React re-renders
      applyButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      await elsewhere;
    });
    await settle();
    assert.ok(sheet(), 'the preview stays open');
    assert.match(sheet()!.querySelector('.banner')?.textContent ?? '', /تغيّر/, 'the conflict is explained');
    assert.deepEqual(await seating(), new Map([...before, [p.id, last.id]]), 'nothing else was written');
    assert.ok(![...sheet()!.querySelectorAll('.as-chip-name')].some((c) => c.textContent === p.primaryGuestName), 'the preview follows live data');
    await act(async () => { await s.seating.assign(p.id, null); });
    await settle();
    await click(button('إلغاء', sheet()!));
  });

  await check('coordinator can auto-seat; caterer sees read-only seating without it', async () => {
    await act(async () => { made.prototype.update({ role: 'coordinator' }); });
    await act(async () => { root.render(wrap(<SeatingPage key="coord" event={event} />)); }); await settle();
    assert.ok(document.querySelector('.as-entry'), 'coordinator has the entry point');
    await act(async () => { made.prototype.update({ role: 'caterer' }); });
    await act(async () => { root.render(wrap(<SeatingPage key="cat" event={event} />)); }); await settle();
    assert.equal(document.querySelector('.as-entry'), null, 'no auto-seat for the caterer');
    assert.equal(sheet(), null);
    await act(async () => { made.prototype.update({ role: 'organizer' }); });
  });

  await check('a seat from the dock can be undone from its toast: the family goes back to the waiting list', async () => {
    const waiting = (await s.parties.list(event.id)).find((p) => p.rsvpStatus === 'confirmed' && !p.tableId)!;
    const row = [...document.querySelectorAll('.pool-item')].find((li) => li.textContent?.includes(waiting.primaryGuestName))!;
    await click(button('اختيار طاولة', row));
    const dock = document.querySelector('.seat-dock')!;
    await click([...dock.querySelectorAll<HTMLButtonElement>('.seat-dock-table')].find((b) => !b.disabled && !b.classList.contains('is-tight')));
    const seatedAt = (await s.parties.get(waiting.id)).tableId;
    assert.ok(seatedAt, 'seated');
    const toast = [...document.querySelectorAll('.toast')].find((t) => t.textContent?.includes(waiting.primaryGuestName))!;
    await click(toast.querySelector('.toast-action'));
    assert.equal((await s.parties.get(waiting.id)).tableId, undefined, 'undo put the family back');
    assert.ok([...document.querySelectorAll('.toast')].some((t) => t.textContent?.includes('قائمة الانتظار')), 'and said so');
  });

  await check('auto-seat keep mode flags a table that is already over capacity', async () => {
    const [t] = await s.seating.listTables(event.id);
    await act(async () => { await s.seating.updateTable(t!.id, { capacity: 1 }); });
    await settle();
    await click(document.querySelector('.as-entry'));
    const card = [...document.querySelectorAll('.as-table')].find((li) => li.querySelector('.as-table-name')?.textContent?.includes(t!.name))!;
    assert.ok(card.classList.contains('is-over'), 'over-capacity card is marked');
    assert.match(card.textContent ?? '', /فوق السعة/);
    await click(button('إلغاء', sheet()!));
    await act(async () => { await s.seating.updateTable(t!.id, { capacity: t!.capacity }); });
  });
}
