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
}, {
  engSaveTheDate: 'احجزوا الميعاد', engCountingDown: 'فاضل على الفرح', engCountingDownSingle: 'فاضل على الميعاد', engAddToCalendar: 'ضيفوه للتقويم',
  engProgramme: 'برنامج المناسبة', engVenue: 'مكان الحفلة', engDirections: 'افتحوا الخريطة', engRsvpTitle: 'أكدوا حضوركم', engYourName: 'اسمكم',
  engGuests: 'هتكونوا كام؟', engGuestsHint: 'إنتو واللي معاكم', engNeed: 'اكتبوا الاسم واختاروا ردكم', engTapToOpen: 'دوسوا على الكارت وافتحوا الدعوة',
  engThanksYes: 'مستنيينكم', engThanksNo: 'هنفتقدكم', engWatchAgain: 'شوفوها تاني', engNamePlaceholder: 'اكتبوا اسمكم',
}, {
  engSaveTheDate: 'احفظوا الموعد', engCountingDown: 'باقي على الفرح', engCountingDownSingle: 'باقي على الموعد', engAddToCalendar: 'أضيفوه للتقويم',
  engProgramme: 'برنامج المناسبة', engVenue: 'مكان الحفل', engDirections: 'افتحوا الخريطة', engRsvpTitle: 'أكّدوا حضوركم', engYourName: 'اسمكم',
  engGuests: 'كم بتكونون؟', engGuestsHint: 'أنتم والمرافقين', engNeed: 'اكتبوا الاسم واختاروا ردّكم', engTapToOpen: 'اضغطوا على البطاقة وافتحوا الدعوة',
  engThanksYes: 'حيّاكم الله، ننتظركم', engThanksNo: 'بنفتقدكم', engWatchAgain: 'شوفوها مرة ثانية', engNamePlaceholder: 'اكتبوا اسمكم',
});
