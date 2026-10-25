import '../../src/cards/index.js';
import { CardRegistry } from '../../src/engine/registries.js';
import { deriveContent } from '../../src/data/derive.js';
import { defaultDesign, toInvitationData } from '../../src/domain/invitation';
import type { Event, EventType } from '../../src/domain/types';
const ev = (type: EventType, a: string, b?: string, aEn?: string, bEn?: string, venue = 'قاعة الاحتفاء الكبرى', city = 'الرياض'): Event => ({ id: 't', ownerId: 't', slug: 't', type, title: '', names: { a, b, aEn, bEn }, date: '2027-06-20', time: '19:30', timeZone: 'Asia/Riyadh', durationHours: 3, venue: { name: venue, city }, settings: { defaultPartySize: 2, revealTableToGuests: false, allowGeneralLink: true }, createdAt: '', updatedAt: '' });
export function sheet(cards: string[]) {
  const samples: Array<[string, Event]> = [
    ['single short', ev('graduation', 'جود', undefined, 'Joud')],
    ['single long', ev('graduation', 'عبدالرحمن بن سلطان بن عبدالعزيز الشهراني', undefined, undefined, undefined, 'قاعة مركز الملك فهد الثقافي للمؤتمرات والاحتفالات', 'الرياض')],
    ['couple', ev('wedding', 'نورة', 'فيصل', 'Noura', 'Faisal')],
    ['couple long', ev('engagement', 'نورة عبدالله الدوسري', 'فيصل محمد القحطاني', 'Noura', 'Faisal')],
    ['birthday', ev('birthday', 'ليان', undefined, 'Layan')],
    ['opening', ev('opening', 'مقهى الريحان', undefined, 'Al Rayhan Cafe')],
  ];
  let html = '';
  for (const id of cards) {
    html += `<h2>${id}</h2><div class="row">`;
    for (const [label, e] of samples) {
      const inv = toInvitationData(e, defaultDesign(e));
      html += `<figure><div class="face">${CardRegistry.get(id).render(deriveContent(inv).c)}</div><figcaption>${label}</figcaption></figure>`;
    }
    html += '</div>';
  }
  return html;
}
