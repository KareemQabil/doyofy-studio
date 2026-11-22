/**
 * Creation wizard, step 3: the chosen invitation takes shape while the organizer types — the real design,
 * rendered with the live names/date/venue. Desktop: a large card beside the form. Phones: a compact live card
 * pinned above the fields, so it stays visible while typing. Missing fields show honest placeholders;
 * nothing here is saved until «جهّز دعوتي». No decorative photography: the card is the subject.
 */
import type { Event, EventType } from '../../domain/types';
import { eventTypeInfo, isCoupleEvent } from '../../domain/event';
import { defaultDesign } from '../../domain/invitation';
import { applyPreset, type TemplatePreset } from '../../domain/templates';
import { CardThumb } from '../invitation/CardThumb';
import { useTilt } from './useTilt';

export type DraftFields = { type: EventType; a: string; b: string; aEn: string; bEn: string; title: string; date: string; time: string; venue: string; city: string; timeZone: string };

/** the event as the organizer has typed it so far, with labelled placeholders for what is still empty */
export function draftPreviewEvent(f: DraftFields, today: string): Event {
  const info = eventTypeInfo(f.type);
  const couple = isCoupleEvent(f.type);
  const fallbackDate = (() => { const d = new Date(`${today}T12:00:00`); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); })();
  return {
    id: 'draft-preview', ownerId: 'draft', slug: 'draft', type: f.type, title: f.title || info.label,
    names: { a: f.a.trim() || info.nameLabel.replace(/^اسم\s*/, ''), b: couple ? (f.b.trim() || (info.nameLabelB ?? '').replace(/^اسم\s*/, '')) : undefined, aEn: f.aEn || undefined, bEn: couple ? f.bEn || undefined : undefined },
    date: f.date || fallbackDate, time: f.time || '20:00', timeZone: f.timeZone, durationHours: 4,
    venue: { name: f.venue.trim() || 'المكان', city: f.city.trim() || 'المدينة' },
    settings: { defaultPartySize: 2, revealTableToGuests: false, allowGeneralLink: false }, createdAt: '', updatedAt: '',
  };
}

export function SignatureCreatePreview({ fields, today, template, compact = false, onChangeDesign }: {
  fields: DraftFields; today: string; template?: TemplatePreset; compact?: boolean; onChangeDesign?: () => void;
}) {
  const info = eventTypeInfo(fields.type);
  const tilt = useTilt<HTMLDivElement>(compact ? 0 : 6);
  const ev = draftPreviewEvent(fields, today);
  const content = template ? applyPreset(defaultDesign(ev), template) : defaultDesign(ev);
  const name = template?.name ?? `تصميم ${info.label}`;
  const card = <CardThumb event={ev} content={content} width={compact ? 84 : 300} label={`معاينة حية لدعوة ${info.label}`} />;
  if (compact) return (
    <div className="wz-live" aria-live="off">
      <div className="wz-live-card">{card}</div>
      <div className="wz-live-copy">
        <p className="wz-live-kicker"><span className="wz-live-dot" aria-hidden="true" />دعوتك تتجهّز الآن</p>
        <p className="wz-live-name">{name}</p>
        {onChangeDesign && <button type="button" className="wz-text-btn" onClick={onChangeDesign}>غيّر التصميم</button>}
      </div>
    </div>
  );
  return (
    <div className="wz-preview">
      <p className="wz-live-kicker"><span className="wz-live-dot" aria-hidden="true" />دعوتك تتجهّز الآن</p>
      <div ref={tilt} className="wz-preview-card" data-tilt-zone="">{card}</div>
      <p className="wz-preview-note">{name}{!fields.date ? ' · التاريخ مؤقت حتى تختاره' : ''}</p>
      {onChangeDesign && <button type="button" className="wz-text-btn" onClick={onChangeDesign}>غيّر التصميم</button>}
    </div>
  );
}
