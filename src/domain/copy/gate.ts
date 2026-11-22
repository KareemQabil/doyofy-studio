/** The reception screen on the event day (gate mode). Short, calm lines for staff working fast. */
import { partly } from './group';

export const GATE = partly({
  gtExit: 'خروج من الاستقبال', gtSub: 'مساحة فريق الاستقبال', gtArrived: '/ {n} وصلوا', gtEnded: 'انتهت المناسبة.', gtWhen: 'المناسبة {when}.', gtCounts: 'أي تسجيل الآن يُحتسب، ويمكن التراجع عنه.',
  gtScan: 'مسح رمز QR', gtSearchLabel: 'أو ابحث بالاسم أو الجوال أو الرمز', gtSearchPh: 'مثال: الشهري أو 0551…', gtClear: 'مسح', gtNoGuest: 'لا يوجد ضيف بهذا الاسم',
  gtNoGuestHint: 'جرّب جزءًا من الاسم أو رقم الجوال. إن لم يكن في القائمة، تواصل مع المنظم قبل السماح بالدخول.', gtWalkIn: 'سجّل ضيفًا من خارج القائمة', gtResults: 'نتائج البحث',
  gtConfirmedN: 'أكدوا {people}', gtDeclined: 'اعتذروا عن الحضور', gtNoReply: 'لم يردوا على الدعوة', gtPillIn: 'وصلوا', gtPillPartial: 'وصل {n}', gtPillDeclined: 'اعتذروا', gtPillPending: 'بلا رد', gtPillNotYet: 'لم يصلوا',
  gtUndone: 'تم التراجع عن دخول {name} ({people}).', gtWalkedIn: 'سُجّل دخول {name} من خارج القائمة، ووصلت ملاحظتك للمنظم.',
  gtUnknownCode: 'لم نجد هذا الرمز', gtUnknownCodeText: 'الرمز غير صحيح أو أن الدعوة حُذفت. لا تسمح بالدخول قبل التأكد: ابحث باسم الضيف، أو تواصل مع المنظم.', gtSearchName: 'ابحث بالاسم', gtScanAgain: 'امسح مرة أخرى',
  gtVerifyFailed: 'تعذّر التحقق من الرمز', gtNothingRecorded: 'لم نسجّل وصولًا. احتفظ بالرمز وحاول مجددًا.', gtRetrySame: 'أعد المحاولة بالرمز نفسه',
  gtWelcome: 'أهلًا وسهلًا', gtEntered: 'دخل {people}', gtNextGuest: 'الضيف التالي', gtUndo: 'تراجع عن التسجيل', gtNoTable: 'لا توجد طاولة — وجّههم لمنسق القاعة.', gtBack: 'رجوع للبحث',
  gtScanTitle: 'مسح رمز QR', gtScanHint: 'الكاميرا تجريبية في هذا النموذج: أدخل الرمز أو اختر حالة تجريبية.', gtVerify: 'تحقق', gtDemoCases: 'حالات تجريبية', gtUnknown: 'رمز غير موجود',
}, {
  gtSub: 'مساحة فريق الاستقبال', gtArrived: '/ {n} وصلوا', gtEnded: 'المناسبة خلصت.', gtCounts: 'أي تسجيل دلوقتي بيتحسب، وتقدر ترجع فيه.',
  gtScan: 'امسح كود QR', gtSearchLabel: 'أو دوّر بالاسم أو الموبايل أو الكود', gtNoGuest: 'مفيش ضيف بالاسم ده', gtWalkIn: 'سجّل ضيف من برّه القايمة',
  gtUndone: 'رجعنا في دخول {name} ({people}).', gtUnknownCode: 'ملقيناش الكود ده', gtSearchName: 'دوّر بالاسم', gtScanAgain: 'امسح تاني', gtVerifyFailed: 'ماقدرناش نتأكد من الكود',
  gtWelcome: 'أهلًا وسهلًا', gtNextGuest: 'الضيف اللي بعده', gtUndo: 'ارجع في التسجيل', gtNoTable: 'مفيش ترابيزة — ودّيهم لمنسّق القاعة.', gtBack: 'ارجع للبحث', gtScanTitle: 'امسح كود QR', gtVerify: 'اتأكد',
}, {
  gtEnded: 'انتهت المناسبة.', gtCounts: 'أي تسجيل الحين ينحسب، وتقدر تتراجع عنه.', gtSearchLabel: 'أو دوّر بالاسم أو الجوال أو الرمز', gtNoGuest: 'ما فيه ضيف بهالاسم', gtWalkIn: 'سجّل ضيف من برّا القائمة',
  gtUnknownCode: 'ما لقينا هالرمز', gtSearchName: 'دوّر بالاسم', gtScanAgain: 'امسح مرة ثانية', gtVerifyFailed: 'ما قدرنا نتأكد من الرمز', gtWelcome: 'حيّاكم الله',
  gtNextGuest: 'الضيف اللي بعده', gtNoTable: 'ما فيه طاولة — وجّههم لمنسّق القاعة.', gtBack: 'ارجع للبحث', gtVerify: 'تأكّد',
});
