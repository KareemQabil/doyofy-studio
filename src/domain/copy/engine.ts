/**
 * The cinematic invitation's own controls and headings (data/strings.js reads these as the Arabic half of each
 * pair). Guests are addressed in the plural. The organizer's authored texts on the card are never touched.
 */
import { voiced } from './group';

export const ENGINE = voiced({
  engSaveTheDate: 'احفظوا الموعد', engCountingDown: 'باقٍ على الفرح', engCountingDownSingle: 'باقٍ على الموعد', engAddToCalendar: 'أضيفوه إلى التقويم',
  engProgramme: 'برنامج المناسبة', engVenue: 'مكان الحفل', engDirections: 'الاتجاهات', engRsvpTitle: 'تأكيد الحضور', engYourName: 'الاسم',
  engGuests: 'إجمالي الحاضرين', engGuestsHint: 'يشملكم مع المرافقين', engNeed: 'اكتبوا الاسم واختاروا الرد', engTapToOpen: 'المسوا البطاقة لفتحها',
  engThanksYes: 'بانتظاركم', engThanksNo: 'سنفتقدكم', engWatchAgain: 'شاهدوا الدعوة مرة أخرى', engNamePlaceholder: 'اكتبوا الاسم',
  engNeedName: 'اكتبوا الاسم', engNeedReply: 'اختاروا الحضور أو الاعتذار',
  // what a screen reader hears on the invitation's own controls
  engOpenCard: 'افتحوا الدعوة', engSheet: 'الدعوة', engBackToCard: 'العودة إلى البطاقة', engPages: 'صفحات الدعوة', engPrevPage: 'الصفحة السابقة', engNextPage: 'الصفحة التالية',
  engPage: 'صفحة {page}', engPageInvitation: 'الدعوة', engPageDate: 'الموعد', engPageProgram: 'البرنامج', engPageVenue: 'المكان', engPageRsvp: 'تأكيد الحضور',
  engReplyGroup: 'رد الحضور', engFewer: 'إنقاص عدد الحاضرين', engMore: 'زيادة عدد الحاضرين', engReplayAll: 'إعادة العرض من البداية',
}, {
  engSaveTheDate: 'احجزوا الميعاد', engCountingDown: 'فاضل على الفرح', engCountingDownSingle: 'فاضل على الميعاد', engAddToCalendar: 'ضيفوه للتقويم',
  engProgramme: 'برنامج المناسبة', engVenue: 'مكان الحفلة', engDirections: 'افتحوا الخريطة', engRsvpTitle: 'أكدوا حضوركم', engYourName: 'اسمكم',
  engGuests: 'هتكونوا كام؟', engGuestsHint: 'إنتو واللي معاكم', engNeed: 'اكتبوا الاسم واختاروا ردكم', engTapToOpen: 'دوسوا على الكارت وافتحوا الدعوة',
  engThanksYes: 'مستنيينكم', engThanksNo: 'هنفتقدكم', engWatchAgain: 'شوفوها تاني', engNamePlaceholder: 'اكتبوا اسمكم',
  engNeedName: 'اكتبوا اسمكم', engNeedReply: 'اختاروا هتيجوا ولا لأ',
  engOpenCard: 'افتحوا الدعوة', engSheet: 'الدعوة', engBackToCard: 'ارجعوا للكارت', engPages: 'صفحات الدعوة', engPrevPage: 'الصفحة اللي قبلها', engNextPage: 'الصفحة اللي بعدها',
  engPage: 'صفحة {page}', engPageInvitation: 'الدعوة', engPageDate: 'الميعاد', engPageProgram: 'البرنامج', engPageVenue: 'المكان', engPageRsvp: 'أكدوا حضوركم',
  engReplyGroup: 'ردكم', engFewer: 'قلّلوا العدد', engMore: 'زوّدوا العدد', engReplayAll: 'شغّلوها من الأول',
}, {
  engSaveTheDate: 'احفظوا الموعد', engCountingDown: 'باقي على الفرح', engCountingDownSingle: 'باقي على الموعد', engAddToCalendar: 'أضيفوه للتقويم',
  engProgramme: 'برنامج المناسبة', engVenue: 'مكان الحفل', engDirections: 'افتحوا الخريطة', engRsvpTitle: 'أكّدوا حضوركم', engYourName: 'اسمكم',
  engGuests: 'كم بتكونون؟', engGuestsHint: 'أنتم والمرافقين', engNeed: 'اكتبوا الاسم واختاروا ردّكم', engTapToOpen: 'اضغطوا على البطاقة وافتحوا الدعوة',
  engThanksYes: 'حيّاكم الله، ننتظركم', engThanksNo: 'بنفتقدكم', engWatchAgain: 'شوفوها مرة ثانية', engNamePlaceholder: 'اكتبوا اسمكم',
  engNeedName: 'اكتبوا اسمكم', engNeedReply: 'اختاروا بتحضرون أو لا',
  engOpenCard: 'افتحوا الدعوة', engSheet: 'الدعوة', engBackToCard: 'ارجعوا للبطاقة', engPages: 'صفحات الدعوة', engPrevPage: 'الصفحة اللي قبل', engNextPage: 'الصفحة اللي بعد',
  engPage: 'صفحة {page}', engPageInvitation: 'الدعوة', engPageDate: 'الموعد', engPageProgram: 'البرنامج', engPageVenue: 'المكان', engPageRsvp: 'أكّدوا حضوركم',
  engReplyGroup: 'ردّكم', engFewer: 'نقّصوا العدد', engMore: 'زيدوا العدد', engReplayAll: 'شغّلوها من البداية',
});
