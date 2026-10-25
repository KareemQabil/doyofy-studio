/**
 * Create, step 2 (Signature): the prepared invitation takes shape while the organizer types —
 * the real default design for this occasion, rendered with the live names/date/venue, on a small stage.
 * Missing fields show honest placeholders; nothing here is saved until «جهّز دعوتي».
 */
import type { Event, EventType } from '../../domain/types';
import { eventTypeInfo, isCoupleEvent } from '../../domain/event';
import { defaultDesign } from '../../domain/invitation';
import { CardThumb } from '../invitation/CardThumb';
import { Stage } from './SignatureArt';
import { useTilt } from './useTilt';

export function SignatureCreatePreview({ type, a, b, aEn, bEn, title, date, time, venue, city, timeZone, today }: {
  type: EventType; a: string; b: string; aEn: string; bEn: string; title: string; date: string; time: string; venue: string; city: string; timeZone: string; today: string;
}) {
  const info = eventTypeInfo(type);
  const couple = isCoupleEvent(type);
  const tilt = useTilt<HTMLDivElement>(7);
  const fallbackDate = (() => { const d = new Date(`${today}T12:00:00`); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); })();
  const ev: Event = {
    id: 'draft-preview', ownerId: 'draft', slug: 'draft', type, title: title || info.label,
    names: { a: a.trim() || info.nameLabel.replace(/^اسم\s*/, ''), b: couple ? (b.trim() || (info.nameLabelB ?? '').replace(/^اسم\s*/, '')) : undefined, aEn: aEn || undefined, bEn: couple ? bEn || undefined : undefined },
    date: date || fallbackDate, time: time || '20:00', timeZone, durationHours: 4,
    venue: { name: venue.trim() || 'المكان', city: city.trim() || 'المدينة' },
    settings: { defaultPartySize: 2, revealTableToGuests: false, allowGeneralLink: false }, createdAt: '', updatedAt: '',
  };
  return (
    <Stage size="md" tone="mesh" pattern="field" className="sig-create-preview" as="div" data-tilt-zone="">
      <picture className="sig-create-photo" aria-hidden="true"><source srcSet="assets/editorial/stationery-still-life.avif" type="image/avif" /><img src="assets/editorial/stationery-still-life.webp" alt="" width="1536" height="1024" loading="lazy" decoding="async" /></picture>
      <p className="sig-index"><span className="num">02</span>دعوتك تتجهّز الآن</p>
      <div ref={tilt} className="sig-create-card"><CardThumb event={ev} content={defaultDesign(ev)} width={230} label={`معاينة دعوة ${info.label}`} /></div>
      <p className="sig-create-note">{!date ? 'التاريخ في المعاينة مؤقت حتى تختاره. ' : ''}هذا التصميم مختار لـ«{info.label}». تقدر تغيّره بعد الإنشاء دون أن تضيع كتابتك.</p>
    </Stage>
  );
}
