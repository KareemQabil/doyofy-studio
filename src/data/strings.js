import { currentDialect } from './copy-preference.js';
import { copyFor, fill } from '../domain/copy';

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
  accept: { ar: 'سنحضر بكل سرور', en: 'Joyfully accepts' },
  decline: { ar: 'نعتذر عن الحضور', en: 'Regretfully declines' },
  guests: { ar: 'إجمالي الحاضرين', en: 'Total attending' },
  guestsHint: 'يشملكم مع المرافقين',
  sound: 'موسيقى الدعوة',
  sealSend: { ar: 'إرسال الرد', en: 'Send reply' },
  need: { ar: 'اكتبوا الاسم واختاروا الرد', en: 'Add your name and a reply' },
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
  const ar = (pair, text) => ({ ...pair, ar: text });
  return {
    ...STRINGS,
    saveTheDate: ar(STRINGS.saveTheDate, k.engSaveTheDate), countingDown: ar(STRINGS.countingDown, k.engCountingDown), countingDownSingle: ar(STRINGS.countingDownSingle, k.engCountingDownSingle),
    addToCalendar: ar(STRINGS.addToCalendar, k.engAddToCalendar), theEvening: ar(STRINGS.theEvening, k.engProgramme), theVenue: ar(STRINGS.theVenue, k.engVenue),
    directions: ar(STRINGS.directions, k.engDirections), rsvpTitle: ar(STRINGS.rsvpTitle, k.engRsvpTitle), yourName: ar(STRINGS.yourName, k.engYourName),
    namePlaceholder: `${k.engNamePlaceholder} · Type your name`, guests: ar(STRINGS.guests, k.engGuests), guestsHint: k.engGuestsHint,
    accept: ar(STRINGS.accept, k.guestAccept), decline: ar(STRINGS.decline, k.guestDecline), sealSend: ar(STRINGS.sealSend, k.guestSendReply),
    need: ar(STRINGS.need, k.engNeed), tapToOpen: ar(STRINGS.tapToOpen, k.engTapToOpen), watchAgain: ar(STRINGS.watchAgain, k.engWatchAgain),
    voice: k.audioGuestVoice,
    needName: { ar: k.engNeedName, en: 'Add your name' }, needReply: { ar: k.engNeedReply, en: 'Choose a reply' },
    // the demo's honesty line and the controls' accessible names speak the same voice as the visible words
    demoOnly: k.demoOnly, openCard: k.engOpenCard, sheet: k.engSheet, backToCard: k.engBackToCard, pages: k.engPages, prevPage: k.engPrevPage, nextPage: k.engNextPage,
    page: (label) => fill(k.engPage, { page: label }), pageLabels: [k.engPageInvitation, k.engPageDate, k.engPageProgram, k.engPageVenue, k.engPageRsvp],
    replyGroup: k.engReplyGroup, fewer: k.engFewer, more: k.engMore, replayAll: k.engReplayAll,
    thanks: { yes: ar(STRINGS.thanks.yes, k.engThanksYes), no: ar(STRINGS.thanks.no, k.engThanksNo) },
  };
}

/** the engine's pages read their words when they render, so a page drawn for a guest link speaks that link's voice */
export const LIVE_STRINGS = new Proxy(STRINGS, { get: (_, key) => currentStrings()[key] });
