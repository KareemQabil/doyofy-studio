import { currentDialect } from './copy-preference.js';

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
  namePlaceholder: 'اكتب اسمك · Type your name',
  accept: { ar: 'سأحضر بكل سرور', en: 'Joyfully accepts' },
  decline: { ar: 'أعتذر عن الحضور', en: 'Regretfully declines' },
  guests: { ar: 'إجمالي الحاضرين', en: 'Total attending' },
  sealSend: { ar: 'تأكيد الرد', en: 'Confirm reply' },
  need: { ar: 'نرجو كتابة الاسم واختيار الرد', en: 'Add your name and a reply' },
  tapToOpen: { ar: 'المس البطاقة لفتحها', en: 'Tap the card to open' },
  honour: 'REQUEST THE HONOUR OF YOUR PRESENCE',
  honourSingle: 'YOU ARE WARMLY INVITED',
  thanks: {
    yes: { ar: 'بانتظاركم', en: 'Your reply has been recorded. We can’t wait to celebrate with you.' },
    no: { ar: 'سنفتقدكم', en: 'You will be missed — thank you for letting us know.' },
  },
  watchAgain: { ar: 'شاهد مرة أخرى', en: 'Watch again' },
  pageLabels: ['الدعوة', 'الموعد', 'البرنامج', 'المكان', 'تأكيد الحضور'],
};

/** Guest controls follow this device's voice preference; authored invitation copy is never changed. */
export function currentStrings() {
  const dialect = currentDialect();
  if (dialect === 'ar-EG') return { ...STRINGS, sealSend: { ...STRINGS.sealSend, ar: 'أكّد ردك' }, tapToOpen: { ...STRINGS.tapToOpen, ar: 'اضغط على الكارت وافتح الدعوة' }, watchAgain: { ...STRINGS.watchAgain, ar: 'شوفها تاني' }, accept: { ...STRINGS.accept, ar: 'هحضر بكل سرور' }, decline: { ...STRINGS.decline, ar: 'مش هقدر أحضر' }, namePlaceholder: 'اكتب اسمك · Type your name' };
  if (dialect === 'ar-SA') return { ...STRINGS, sealSend: { ...STRINGS.sealSend, ar: 'أكّد ردّك' }, tapToOpen: { ...STRINGS.tapToOpen, ar: 'اضغط على البطاقة وافتح الدعوة' }, watchAgain: { ...STRINGS.watchAgain, ar: 'شوفها مرة ثانية' }, accept: { ...STRINGS.accept, ar: 'بإذن الله حاضر' }, decline: { ...STRINGS.decline, ar: 'أعتذر ما أقدر أحضر' } };
  return STRINGS;
}
