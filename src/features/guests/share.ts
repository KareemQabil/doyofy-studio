/** Personal invitation messages (WhatsApp deep link). Real BSP sending is out of scope — see UX_DECISIONS D-008. */
import type { Event, InvitationParty } from '../../domain/types';
import { formatEventDate, formatTime } from '../../domain/format';
import { normalisePhone } from '../../domain/phone';
import { copyFor, type Dialect } from '../../domain/copy';
import { currentDialect } from '../../ui/copy';

export function inviteMessage(ev: Event, p: Pick<InvitationParty, 'primaryGuestName'>, link: string, dialect: Dialect = currentDialect()): string {
  const c = copyFor(dialect);
  return `${c.invitationGreeting} ${p.primaryGuestName}،\n${c.invitationIntro} ${ev.title}\n${formatEventDate(ev.date)} · ${formatTime(ev.time)}\n${ev.venue.name}، ${ev.venue.city}\n\n${c.invitationOpen}\n${link}`;
}

export function reminderMessage(ev: Event, p: Pick<InvitationParty, 'primaryGuestName'>, link: string, dialect: Dialect = currentDialect()): string {
  const c = copyFor(dialect);
  return `${c.invitationGreeting} ${p.primaryGuestName}،\n${c.reminderIntro} ${ev.title} يوم ${formatEventDate(ev.date, { year: false })}.\n${c.reminderReply}\n${link}`;
}

export function whatsappUrl(phone: string | undefined, text: string): string {
  const n = normalisePhone(phone);
  const digits = n.ok ? n.e164.slice(1) : '';
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/** SMS opens a composer for one recipient; the user decides whether to send it. */
export function smsUrl(phone: string | undefined, text: string, ios = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)): string | undefined {
  const n = normalisePhone(phone);
  return n.ok ? `sms:${n.e164}${ios ? '&' : '?'}body=${encodeURIComponent(text)}` : undefined;
}

export function selectedLinks(parties: readonly Pick<InvitationParty, 'primaryGuestName' | 'code'>[], linkFor: (p: Pick<InvitationParty, 'primaryGuestName' | 'code'>) => string): string {
  return parties.map(p => `${p.primaryGuestName}\n${linkFor(p)}`).join('\n\n');
}
