import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { EVENT_TYPES } from '../../src/domain/event';
import { OCCASION_STARTERS } from '../../src/domain/occasion-starters';
import { defaultDesign, toInvitationData, CARD_NAMES } from '../../src/domain/invitation';
import { presetById, presetsFor, TEMPLATE_PRESETS } from '../../src/domain/templates';
import type { Event, EventType } from '../../src/domain/types';
import { deriveContent } from '../../src/data/derive.js';
import '../../src/cards/index.js';
import { COLLECTION } from '../../src/cards/collection.js';
import { CardRegistry } from '../../src/engine/registries.js';
import { KIT } from '../../src/cards/kit-art';

const event = (type: EventType, a: string, b?: string): Event => ({
  id: 't', ownerId: 't', slug: 't', type, title: '', names: { a, aEn: 'Joud <b>', ...(b ? { b, bEn: 'Omar' } : {}) },
  date: '2031-08-12', time: '20:00', timeZone: 'Asia/Riyadh', durationHours: 4,
  venue: { name: 'قاعة <الياسمين>', city: 'الرياض' },
  settings: { defaultPartySize: 2, revealTableToGuests: false, allowGeneralLink: true }, createdAt: '', updatedAt: '',
});
const render = (id: string, ev: Event) => CardRegistry.get(id).render(deriveContent(toInvitationData(ev, defaultDesign(ev))).c);
const TITLES: Record<string, string> = { wedding: 'حفل زفاف', katb_kitab: 'عقد قِران', graduation: 'حفل تخرّج', conference: 'دعوة حضور', corporate: 'دعوة خاصة' };

test('every occasion starts on its Designer Kit face and offers at least two faces of its own', () => {
  assert.ok(COLLECTION.length >= 26, `${COLLECTION.length} faces`);
  assert.deepEqual(new Set(COLLECTION.map((d) => d.type)), new Set(EVENT_TYPES.map((t) => t.id)));
  for (const t of EVENT_TYPES) {
    const own = COLLECTION.filter((d) => d.type === t.id);
    assert.ok(own.length >= 2, `${t.id}: ${own.length} faces`);
    const starter = presetById(OCCASION_STARTERS[t.id].presetId)!;
    assert.ok(starter.cardId.startsWith('kit-') && own.some((d) => d.id === starter.cardId), `${t.id}: kit face is the starter`);
    assert.equal(presetsFor(t.id).suited[0]!.cardId, starter.cardId, `${t.id}: shown first`);
  }
  for (const d of COLLECTION) {
    for (const scene of CardRegistry.get(d.id).compat.recommended) assert.ok(TEMPLATE_PRESETS.some((p) => p.cardId === d.id && p.sceneId === scene), `${d.id}/${scene}`);
    assert.ok(CARD_NAMES[d.id], `${d.id}: editor name`);
  }
  assert.deepEqual(new Set(CardRegistry.list().map((c: { id: string }) => c.id)), new Set(COLLECTION.map((d) => d.id)), 'only the family is registered');
});

test('collection faces keep every word live, escaped, and true to the event', () => {
  for (const d of COLLECTION) {
    const type = d.type as EventType;
    const couple = EVENT_TYPES.find((t) => t.id === type)!.couple;
    const ev = event(type, 'عبد الرحمن بن عبد الله', couple ? 'جود المحتفية' : undefined);
    const html = render(d.id, ev);
    assert.ok(html.includes('عبد الرحمن بن عبد الله'), d.id);
    if (couple) assert.ok(html.includes('جود المحتفية') && html.includes('Omar'), d.id);
    assert.ok(html.includes('2031') || html.includes('٢٠٣١'), `${d.id}: the real year`);
    assert.ok(!html.includes('Joud <b>') && html.includes('Joud &lt;b&gt;'), `${d.id}: escaped`);
    assert.ok(!html.includes('<الياسمين>'), `${d.id}: venue escaped`);
    assert.ok(!/\sid="/.test(html), `${d.id}: no SVG ids`);
    if (TITLES[type]) assert.ok(html.includes(TITLES[type]!), `${d.id}: occasion title`);
    const visible = html.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    if (!couple) assert.ok(!visible.includes(' و ') && !visible.includes('WEDDING'), `${d.id}: single`);
  }
  // a face reused for another occasion names that occasion, never its own
  assert.ok(render('kit-rose-garden', event('graduation', 'جود')).includes('حفل تخرّج'));
  assert.ok(!render('kit-rose-garden', event('graduation', 'جود')).includes('حفل زفاف'));
});

test('collection artwork is light: clean inlined motifs and small shipped layers', () => {
  for (const [key, m] of Object.entries(KIT)) {
    assert.ok(!/\bid=|url\(#|<metadata|<script/.test(m.svg), key);
    assert.match(m.vb, /^\d+ \d+ \d+ \d+$/, key);
  }
  const src = fs.readFileSync('src/cards/collection.js', 'utf8');
  const files = [...new Set([...src.matchAll(/img\('([a-z-]+\.webp)'/g)].map((m) => m[1]!))];
  assert.ok(files.length >= 5);
  for (const f of files) { const p = `public/assets/cards/kit/${f}`; assert.ok(fs.existsSync(p), p); assert.ok(fs.statSync(p).size < 90 * 1024, `${f} under 90KB`); }
  // a face loads only its own layers: none may need more than ~180KB of raster art
  for (const block of src.split(/\n  \{\n/).slice(1)) {
    const own = [...new Set([...block.matchAll(/img\('([a-z-]+\.webp)'/g)].map((m) => m[1]!))];
    const bytes = own.reduce((n, f) => n + fs.statSync(`public/assets/cards/kit/${f}`).size, 0);
    assert.ok(bytes < 180 * 1024, `${/id: '([^']+)'/.exec(block)?.[1]}: ${bytes} bytes of layers`);
  }
});

test('each face declares its number system and the invitation, its pages and the guest hub follow it', async () => {
  const { faceDigits } = await import('../../src/domain/templates');
  const { formatEventDate, formatTime } = await import('../../src/domain/format');
  const { PageRegistry } = await import('../../src/engine/registries.js') as unknown as { PageRegistry: { get(id: string): unknown } };
  await import('../../src/pages/index.js');
  const ARABIC = /[٠-٩]/, LATIN = /[0-9]/;
  const used = new Set<string>();
  for (const d of COLLECTION) {
    const card = CardRegistry.get(d.id);
    assert.ok(card.digits === 'arab' || card.digits === 'latn', `${d.id}: declares digits`);
    assert.equal(faceDigits(d.id), card.digits, `${d.id}: the platform mirror matches the face`);
    used.add(card.digits!);
  }
  assert.deepEqual(used, new Set(['arab', 'latn']), 'both systems are in use');
  const ev = event('wedding', 'نورة', 'فيصل');
  for (const [cardId, digits] of [['kit-rose-garden', 'arab'], ['ty-blue', 'latn']] as const) {
    const inv = toInvitationData(ev, { ...defaultDesign(ev), cardId });
    assert.equal(inv.display.digits, digits, `${cardId}: carried by the invitation data`);
    const { c, program } = deriveContent(inv);
    const own = digits === 'arab' ? ARABIC : LATIN, other = digits === 'arab' ? LATIN : ARABIC;
    for (const k of ['dateAr', 'timeAr', 'dayNum', 'yearAr', 'dateNum'] as const) assert.ok(own.test(c[k]!) && !other.test(c[k]!), `${cardId} ${k}: «${c[k]}»`);
    assert.equal(c.year, '2031', 'English lines keep Latin digits');
    assert.ok(own.test(program[0]!.time) && !other.test(program[0]!.time), `${cardId}: programme times`);
    const html = CardRegistry.get(cardId).render(c);
    assert.ok(html.includes(c.dateAr!) || html.includes(c.dayNum!), `${cardId}: the face shows its date`);
    const page = (PageRegistry.get('date') as unknown as { render(v: unknown): string }).render({ t: CardRegistry.get(cardId).theme, c, calHref: '#', program, rsvp: {} });
    assert.ok(page.includes(`>${c.dayNum}<`) && page.includes(c.timeAr!), `${cardId}: date page in the same digits`);
    // guest hub
    const hub = `${formatEventDate(ev.date, { digits })} · ${formatTime(ev.time, digits)}`;
    assert.ok(own.test(hub) && !other.test(hub), `${cardId}: guest hub «${hub}»`);
  }
  // the face decides when drawn with another face's invitation data (thumbnails, the switcher)
  const roseData = toInvitationData(ev, { ...defaultDesign(ev), cardId: 'kit-rose-garden' });
  assert.ok(LATIN.test(deriveContent(roseData, { digits: CardRegistry.get('ty-blue').digits }).c.dateAr!));
  // the platform's own dates stay Western
  assert.ok(!ARABIC.test(formatEventDate(ev.date)) && !ARABIC.test(formatTime(ev.time)));
});
