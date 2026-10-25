/** Personal invitation messages (WhatsApp deep link). Real BSP sending is out of scope — see UX_DECISIONS D-008. */
import type { Event, InvitationParty } from '../../domain/types';
import { formatEventDate, formatTime } from '../../domain/format';

export function inviteMessage(ev: Event, p: Pick<InvitationParty, 'primaryGuestName'>, link: string): string {
  return `السلام عليكم ${p.primaryGuestName}،\nيسعدنا دعوتكم إلى ${ev.title}\n${formatEventDate(ev.date)} · ${formatTime(ev.time)}\n${ev.venue.name}، ${ev.venue.city}\n\nافتحوا دعوتكم وأكدوا حضوركم من هنا:\n${link}`;
}

export function reminderMessage(ev: Event, p: Pick<InvitationParty, 'primaryGuestName'>, link: string): string {
  return `السلام عليكم ${p.primaryGuestName}،\nتذكير لطيف بدعوة ${ev.title} يوم ${formatEventDate(ev.date, { year: false })}.\nنتشرف بمعرفة ردكم من هنا:\n${link}`;
}

export function whatsappUrl(phone: string | undefined, text: string): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
