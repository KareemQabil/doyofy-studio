import type { Event, EventType } from '../../domain/types';
import { eventTypeInfo } from '../../domain/event';

/** example people per occasion for posters (clearly sample content, never shown as the organizer's data) */
const SAMPLE: Record<EventType, { a: string; b?: string }> = {
  wedding: { a: 'نورة', b: 'فيصل' }, engagement: { a: 'ريم', b: 'خالد' }, katb_kitab: { a: 'هند', b: 'مازن' }, henna: { a: 'سارة', b: 'أحمد' },
  birthday: { a: 'ليان' }, graduation: { a: 'جود' }, newborn: { a: 'سلمى' }, family: { a: 'عائلة الراشد' }, iftar: { a: 'عائلة القحطاني' },
  conference: { a: 'ملتقى الرياض' }, opening: { a: 'مقهى الريحان' }, corporate: { a: 'لقاء فريق نجم' }, other: { a: 'حفلة الربيع' },
};
export function sampleEvent(type: EventType, now = new Date()): Event {
  const s = SAMPLE[type];
  return { id: `sample-${type}`, ownerId: 'example', slug: 'example', type, title: eventTypeInfo(type).label, names: { a: s.a, b: s.b }, date: `${now.getFullYear() + 1}-04-16`, time: '20:00', timeZone: 'Asia/Riyadh', durationHours: 3, venue: { name: 'قاعة الياسمين', city: 'الرياض' }, settings: { defaultPartySize: 2, revealTableToGuests: false, allowGeneralLink: true }, createdAt: '', updatedAt: '' };
}

