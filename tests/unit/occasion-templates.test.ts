import assert from 'node:assert/strict';
import test from 'node:test';
import { EVENT_TYPES } from '../../src/domain/event';
import { OCCASION_STARTERS } from '../../src/domain/occasion-starters';
import { defaultDesign, toInvitationData } from '../../src/domain/invitation';
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
    assert.equal(design.message.ar, starter.message.ar);
    assert.ok(design.program.length >= 2);
    if (type.id !== 'wedding') assert.ok(design.program.every(p => p.ar !== 'الزفّة'), type.id);
  }
});

test('new-event starter content is not shared between drafts; midnight and wraparound times work', () => {
  const a = defaultDesign(event('conference')), b = defaultDesign(event('conference'));
  a.message.ar = 'تعديل'; a.program[0]!.ar = 'تعديل'; a.experience.motion = 'static';
  assert.notEqual(a.message.ar, b.message.ar); assert.notEqual(a.program[0]!.ar, b.program[0]!.ar);
  assert.equal(b.experience.motion, 'animated');
  assert.equal(defaultDesign({ ...event('wedding'), time: '00:00' }).program[0]!.time, '00:00');
  assert.deepEqual(defaultDesign({ ...event('wedding'), time: '23:30' }).program.map(p => p.time), ['23:30', '00:30', '01:30']);
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

test('six original occasion faces keep dynamic year, long names, RTL text and safe markup',()=>{
 const ids=['grad-editorial','grad-campus','grad-constellation','birthday-confetti','newborn-moon','forum-grid'];
 for(const id of ids){
  const type=id.startsWith('grad')?'graduation':id.startsWith('birthday')?'birthday':id.startsWith('newborn')?'newborn':'conference';
  const ev={...event(type),date:'2031-08-12',names:{a:'عبد الرحمن بن عبد الله المحتفي بإنجازه العظيم',aEn:'Abdulrahman bin Abdullah <script>alert(1)</script>'},venue:{name:'قاعة الاحتفاء والتواصل والمعرفة',city:'الرياض'}};
  const derived=deriveContent(toInvitationData(ev,defaultDesign(ev))),card=CardRegistry.get(id),html=card.render(derived.c);
  assert.ok(html.includes(ev.names.a),id);assert.ok(html.includes(derived.c.dateAr!),id);assert.ok(!html.includes('<script>'),id);assert.ok(html.includes('&lt;script&gt;'),id);assert.ok(html.includes('<svg'),id);assert.equal((card as unknown as {reducedMotion:string}).reducedMotion,'static');
  for(const scene of card.compat.recommended)assert.ok(TEMPLATE_PRESETS.some(p=>p.cardId===id&&p.sceneId===scene),`${id}/${scene}`);
 }
});

test('all thirteen occasion starters have a distinct native face',()=>{
 const cards=EVENT_TYPES.map(t=>presetById(OCCASION_STARTERS[t.id].presetId)!.cardId);
 assert.equal(new Set(cards).size,13);
});

test('nine celebration faces escape long mixed-language content and use the actual year',()=>{
 const ids=['wedding-vow','engagement-rings','katb-seal','henna-lattice','family-table','iftar-arch','opening-door','corporate-edition','celebration-shapes'];
 const ev={...event('wedding'),date:'2031-08-12',names:{a:'عبد الرحمن بن عبد الله المحتفي بإنجازه العظيم',aEn:'Abdulrahman <script>alert(1)</script>',b:'جود المحتفية بهذه المناسبة الجميلة',bEn:'Joud & Friends'}};
 const derived=deriveContent(toInvitationData(ev,defaultDesign(ev)));
 for(const id of ids){const card=CardRegistry.get(id),html=card.render(derived.c);assert.ok(html.includes(ev.names.a),id);assert.ok(html.includes(ev.names.b!),id);assert.ok(!html.includes('<script>'),id);assert.ok(html.includes('&lt;script&gt;'),id);assert.ok(html.includes(derived.c.dateAr!),id);if(id==='corporate-edition')assert.ok(html.includes('2031'));}
});
