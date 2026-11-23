import assert from 'node:assert/strict';
import test from 'node:test';
import { EVENT_TYPES } from '../../src/domain/event';
import { OCCASION_STARTERS } from '../../src/domain/occasion-starters';
import { defaultDesign, resolveDesign, toInvitationData } from '../../src/domain/invitation';
import { applyPreset, presetById, presetOf, presetsFor, TEMPLATE_PRESETS } from '../../src/domain/templates';
import type { Event, EventType } from '../../src/domain/types';
import { deriveContent } from '../../src/data/derive.js';
import '../../src/cards/index.js';
import { CardRegistry } from '../../src/engine/registries.js';

const event = (type: EventType): Event => ({
  id: 'test', ownerId: 'test', slug: 'test', type, title: `مناسبة ${type}`, names: { a: 'جود', aEn: 'Joud', ...(EVENT_TYPES.find(t => t.id === type)?.couple ? { b: 'عمر', bEn: 'Omar' } : {}) },
  date: '2027-08-12', time: '20:00', timeZone: 'Asia/Riyadh', durationHours: 5,
  venue: { name: 'قاعة اللقاء', city: 'الرياض', nameEn: 'Meeting hall', cityEn: 'Riyadh' },
  settings: { defaultPartySize: 2, revealTableToGuests: false, allowGeneralLink: true }, createdAt: '', updatedAt: '',
});

test('every occasion has two distinct dedicated looks and a relevant recommended starter', () => {
  for (const type of EVENT_TYPES) {
    const { suited } = presetsFor(type.id);
    const dedicated = suited.filter(p => p.primaryOccasion === type.id);
    assert.ok(dedicated.length >= 2, type.id);
    assert.equal(suited[0]?.primaryOccasion, type.id);
    assert.ok(new Set(dedicated.map(p => p.cardId)).size >= 2, `${type.id}: two native faces`);
    const starter = OCCASION_STARTERS[type.id];
    const preset = presetById(starter.presetId)!;
    assert.equal(preset.primaryOccasion, type.id);
    const design = defaultDesign(event(type.id));
    assert.equal(presetOf(design)?.id, preset.id);
    assert.equal(design.message.ar, starter.message);
    // nothing the organizer did not write reaches guests: no English line, no programme
    assert.equal(design.message.en, '', `${type.id}: no English line written for the organizer`);
    assert.deepEqual(design.program, [], `${type.id}: the programme starts empty`);
  }
});

test('new-event starter content is not shared between drafts', () => {
  const a = defaultDesign(event('conference')), b = defaultDesign(event('conference'));
  a.message.ar = 'تعديل'; a.program.push({ time: '20:00', ar: 'تعديل', en: '' }); a.experience.motion = 'static';
  assert.notEqual(a.message.ar, b.message.ar); assert.deepEqual(b.program, []);
  assert.equal(b.experience.motion, 'animated');
});

test('an invitation without English is Arabic only: no Latin names, date, label or engine words', async () => {
  const { currentStrings } = await import('../../src/data/strings.js');
  const plain: Event = { ...event('graduation'), names: { a: 'جود' }, venue: { name: 'قاعة اللقاء', city: 'الرياض' } };
  const inv = toInvitationData(plain, defaultDesign(plain));
  assert.equal(inv.locale.secondary, null);
  const { c, english, program, mapHref } = deriveContent(inv);
  assert.equal(english, false);
  for (const k of ['enA', 'dayEnU', 'dateEn', 'monthEnU', 'timeEn', 'venueEn', 'cityEnU', 'labelEnU'] as const) assert.equal(c[k], '', k);
  assert.equal(program.length, 0);
  assert.ok(mapHref, 'the map still finds the place from its Arabic name');
  for (const face of ['kit-cap-diamond', 'ty-vertical', 'kit-forum-stars']) assert.doesNotMatch(CardRegistry.get(face).render(deriveContent(inv, { digits: CardRegistry.get(face).digits }).c), /GRADUATION|lang="en"/, face);
  const ar = currentStrings('ar', false);
  assert.equal(ar.tapToOpen.en, ''); assert.equal(ar.sealSend.en, ''); assert.equal(ar.namePlaceholder.includes('Type'), false);
  // English written by the organizer turns the bilingual lines on
  const withEn = toInvitationData({ ...plain, names: { a: 'جود', aEn: 'Joud' } }, defaultDesign(plain));
  assert.equal(withEn.locale.secondary, 'en'); assert.equal(deriveContent(withEn).c.enA, 'Joud');
  assert.equal(currentStrings('ar', true).tapToOpen.en, 'Tap the card to open');
});

test('catalogue uses unique engine recommendations, without fake card/scene combinations', () => {
  const combinations = new Set<string>();
  for (const preset of TEMPLATE_PRESETS) {
    assert.ok(CardRegistry.get(preset.cardId).compat.recommended.includes(preset.sceneId), preset.id);
    const key = `${preset.cardId}/${preset.sceneId}/${preset.experience.dimension}/${preset.experience.motion}`;
    assert.ok(!combinations.has(key), `${preset.id}: distinct experience`);
    combinations.add(key);
  }
});

test('all card designs omit partner separators and wedding copy for a single-name occasion', () => {
  const ev = event('conference');
  const base = defaultDesign(ev);
  // A stale partner override from another occasion must not make a conference into a couple card.
  base.displayNames.b = 'اسم قديم'; base.displayNames.bEn = 'Old name';
  for (const preset of TEMPLATE_PRESETS) {
    const invitation = toInvitationData(ev, applyPreset(base, preset));
    const derived = deriveContent(invitation);
    assert.equal(derived.c.arB, ''); assert.equal(derived.c.enB, '');
    const html = CardRegistry.get(preset.cardId).render(derived.c);
    const visible = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    assert.ok(!visible.includes('&amp;'), preset.id);
    assert.ok(!visible.includes(' و '), preset.id);
    assert.ok(!visible.includes('WEDDING'), preset.id);
    assert.ok(!visible.includes('DINNER'), preset.id);
    const calendarTitle = new URL(derived.calHref).searchParams.get('text');
    assert.equal(calendarTitle, ev.title);
  }
});

test('couple cards retain both names; calendar fallback uses the actual occasion label', () => {
  const ev = event('engagement');
  const invitation = toInvitationData({ ...ev, title: undefined }, defaultDesign(ev));
  const derived = deriveContent(invitation);
  for (const card of CardRegistry.list()) {
    const html = card.render(derived.c);
    assert.ok(html.includes('عمر'), card.id);
    assert.ok(html.includes('Omar') || html.includes('OMAR'), card.id);
  }
  assert.equal(new URL(derived.calHref).searchParams.get('text'), 'Joud & Omar — Engagement');
});

test('every face keeps long mixed-language names live and escaped, with the real year and date',()=>{
 for(const card of CardRegistry.list()){
  const type=(card.tags.find((t:string)=>EVENT_TYPES.some(e=>e.id===t)) ?? 'wedding') as EventType;
  const couple=!!EVENT_TYPES.find(e=>e.id===type)?.couple;
  const ev={...event(type),date:'2031-08-12',names:{a:'عبد الرحمن بن عبد الله المحتفي بإنجازه العظيم',aEn:'Abdulrahman <script>alert(1)</script>',...(couple?{b:'جود العبدالله',bEn:'Joud'}:{})}};
  const derived=deriveContent(toInvitationData(ev,defaultDesign(ev))),html=card.render(derived.c);
  assert.ok(html.includes(ev.names.a),card.id);if(couple)assert.ok(html.includes('جود العبدالله'),card.id);
  assert.ok(!html.includes('<script>'),card.id);assert.ok(!/\sid="/.test(html),`${card.id}: no ids`);
  assert.ok(html.includes(derived.c.dateAr!)||html.includes(derived.c.dayNum!),`${card.id}: date`);
 }
});

test('all thirteen occasion starters have a distinct native face',()=>{
 const cards=EVENT_TYPES.map(t=>presetById(OCCASION_STARTERS[t.id].presetId)!.cardId);
 assert.equal(new Set(cards).size,13);
});

test('a design saved with a retired face opens on its occasion\'s face',()=>{
 for(const t of EVENT_TYPES){const d=resolveDesign({...defaultDesign(event(t.id)),cardId:'wine',sceneId:'candlelit'},t.id);assert.equal(d.cardId,presetById(OCCASION_STARTERS[t.id].presetId)!.cardId);}
 const kept=defaultDesign(event('wedding'));assert.equal(resolveDesign(kept,'wedding'),kept);
});
