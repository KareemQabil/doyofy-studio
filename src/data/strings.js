import { currentDialect } from './copy-preference.js';
import { copyFor } from '../domain/copy';

/** Bilingual UI copy of the canonical Studio (Arabic first, English second). */
export const STRINGS = {
  withLove: { ar: 'بكل الحب', en: 'WITH LOVE' },
  saveTheDate: { ar: 'احفظوا الموعد', en: 'SAVE THE DATE' },
  countingDown: { ar: 'باقٍ على الفرح', en: 'COUNTING DOWN' },
  countingDownSingle: { ar: 'باقٍ على الموعد', en: 'COUNTING DOWN' },
  units: { days: ['يوم', 'DAYS'], h: ['ساعة', 'HOURS'], m: ['دقيقة', 'MINS'], s: ['ثانية', 'SECS'] },
  addToCalendar: { ar: 'أضف إلى التقويم', en: 'Add to calendar' },
  theEvening: { ar: 'برنامج المناسبة', en: 'THE PROGRAM' },
  theVenue: { ar: 'مكان الحفل', en: 'THE VENUE' },
  directions: { ar: 'الاتجاهات', en: 'Directions' },
  rsvpTitle: { ar: 'تأكيد الحضور', en: 'KINDLY REPLY' },
  yourName: { ar: 'الاسم', en: 'Your name' },
  namePlaceholder: 'اكتبوا الاسم · Type your name',
  accept: { ar: 'نعم، سنحضر', en: 'Joyfully accepts' },
  decline: { ar: 'نعتذر عن الحضور', en: 'Regretfully declines' },
  guests: { ar: 'إجمالي الحاضرين', en: 'Total attending' },
  guestsHint: 'يشملكم مع المرافقين',
  sound: 'موسيقى الدعوة',
  sealSend: { ar: 'إرسال الرد', en: 'Send reply' },
  need: { ar: 'نرجو كتابة الاسم واختيار الرد', en: 'Add your name and a reply' },
  tapToOpen: { ar: 'المسوا البطاقة لفتحها', en: 'Tap the card to open' },
  honour: 'REQUEST THE HONOUR OF YOUR PRESENCE',
  honourSingle: 'YOU ARE WARMLY INVITED',
  thanks: {
    yes: { ar: 'بانتظاركم', en: 'Your reply has been recorded. We can’t wait to celebrate with you.' },
    no: { ar: 'سنفتقدكم', en: 'You will be missed — thank you for letting us know.' },
  },
  watchAgain: { ar: 'شاهدوا مرة أخرى', en: 'Watch again' },
  pageLabels: ['الدعوة', 'الموعد', 'البرنامج', 'المكان', 'تأكيد الحضور'],
};

/** the voice the invitation engine speaks: set by a guest page to the organizer's (carried with the invitation) */
let voice = null;
export function setStringsVoice(dialect) { voice = dialect === 'ar-EG' || dialect === 'ar-SA' || dialect === 'ar' ? dialect : null; }

/**
 * Guest controls speak the organizer's voice on a guest link (setStringsVoice), otherwise this device's preference.
 * Authored invitation copy is never changed. The reply words are the platform dictionary's (domain/copy.ts), so the
 * cinematic invitation and the direct form say the same thing in every voice.
 */
export function currentStrings(dialect = voice ?? currentDialect()) {
  const k = copyFor(dialect);
  const base = { ...STRINGS, accept: { ...STRINGS.accept, ar: k.guestAccept }, decline: { ...STRINGS.decline, ar: k.guestDecline }, sealSend: { ...STRINGS.sealSend, ar: k.guestSendReply }, voice: k.audioGuestVoice };
  if (dialect === 'ar-EG') return { ...base, tapToOpen: { ...STRINGS.tapToOpen, ar: 'دوسوا على الكارت وافتحوا الدعوة' }, watchAgain: { ...STRINGS.watchAgain, ar: 'شوفوها تاني' }, thanks: { yes: { ...STRINGS.thanks.yes, ar: 'مستنيينكم' }, no: { ...STRINGS.thanks.no, ar: 'هنفتقدكم' } }, need: { ...STRINGS.need, ar: 'اكتبوا الاسم واختاروا ردكم' } };
  if (dialect === 'ar-SA') return { ...base, tapToOpen: { ...STRINGS.tapToOpen, ar: 'اضغطوا على البطاقة وافتحوا الدعوة' }, watchAgain: { ...STRINGS.watchAgain, ar: 'شوفوها مرة ثانية' }, thanks: { yes: { ...STRINGS.thanks.yes, ar: 'بانتظاركم' }, no: { ...STRINGS.thanks.no, ar: 'بنفتقدكم' } }, need: { ...STRINGS.need, ar: 'اكتبوا الاسم واختاروا ردّكم' } };
  return base;
}
