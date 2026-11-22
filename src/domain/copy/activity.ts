/**
 * Lines built by domain code: the activity feed (domain/activity), the event phase and the invitation's
 * publish state. Domain functions take the dialect and stay pure.
 */
import { voiced } from './group';

export const ACTIVITY = voiced({
  acCreated: 'تم إنشاء المناسبة', acUpdated: 'تم تعديل بيانات المناسبة{what}', acSaved: 'تم حفظ مسودة الدعوة', acPublished: 'تم نشر الدعوة', acRepublished: 'تم نشر تعديلات الدعوة',
  acAdded: 'تمت إضافة {name}', acImported: 'تمت إضافة {guests} من ملف{skipped}', acImportSkipped: ' (تم تخطي {rows})', acPartyUpdated: 'تم تعديل بيانات {name}', acRemoved: 'تم حذف {name} من القائمة',
  acSharedMany: 'تمت مشاركة {invitations}{how}', acSharedOne: 'تمت مشاركة دعوة {name}{how}', acManual: ' يدويًا', acDemo: ' · تجريبي', acOpened: '{name} فتح الدعوة',
  acFailedMany: 'تعذّر إرسال {invitations} · تجريبي', acFailedOne: 'تعذّر إرسال دعوة {name} · تجريبي', acRemindedMany: 'ذكّرت {invitations} بالرد', acRemindedOne: 'ذكّرت {name} بالرد',
  acConfirmed: '{name} أكد الحضور — {people}', acDeclined: '{name} اعتذر عن الحضور', acEdited: '{name} عدّل رده — {people}', acEditedNo: '{name} عدّل رده إلى الاعتذار',
  acUnmatched: 'رد من الرابط العام باسم «{name}» يحتاج مطابقة', acMatched: 'تمت مطابقة رد «{name}»',
  acTable: 'تمت إضافة {name} ({seats})', acSeated: 'تم توزيع {name} على {table}', acMoved: 'تم نقل {name} إلى {table}', acUnseated: 'تمت إزالة {name} من {table}',
  acAuto: 'تم اعتماد التوزيع التلقائي: {invitations}{tables}', acAutoTables: '، مع إضافة {tables}', acAutoUndone: 'تم التراجع عن التوزيع التلقائي ({invitations})',
  acIn: '{name} وصل — {people}', acPartial: '{name}: وصل {n} من {of}', acException: 'دخول باستثناء: {name} — {reason}', acInUndone: 'تم التراجع عن تسجيل دخول {name}',
  acWalkIn: 'دخول من خارج القائمة: {name} — {people}{note}', acArchived: 'تمت أرشفة المناسبة', acByCoordinator: 'المنسق', acByCaterer: 'فريق الضيافة',
  // the event's phase and the invitation's state
  phUpcoming: 'قيد التجهيز', phFinalWeek: 'الأسبوع الأخير', phEventDay: 'يوم المناسبة', phCompleted: 'انتهت', phArchived: 'مؤرشفة',
  psNone: 'لم تُصمم بعد', psDraft: 'مسودة — غير منشورة', psPublished: 'منشورة', psChanged: 'منشورة · تعديلات غير منشورة',
}, {
  acCreated: 'المناسبة اتعملت', acUpdated: 'بيانات المناسبة اتعدّلت{what}', acSaved: 'مسودة الدعوة اتحفظت', acPublished: 'الدعوة اتنشرت', acRepublished: 'تعديلات الدعوة اتنشرت',
  acAdded: '{name} اتضاف', acImported: '{guests} اتضافوا من ملف{skipped}', acImportSkipped: ' (من غير {rows})', acPartyUpdated: 'بيانات {name} اتعدّلت', acRemoved: '{name} اتمسح من القايمة',
  acSharedMany: '{invitations} اتبعتت{how}', acSharedOne: 'دعوة {name} اتبعتت{how}', acManual: ' بإيدك', acDemo: ' · تجريبي', acOpened: '{name} فتح الدعوة',
  acFailedMany: 'ماقدرناش نبعت {invitations} · تجريبي', acFailedOne: 'ماقدرناش نبعت دعوة {name} · تجريبي', acRemindedMany: 'فكّرت {invitations} بالرد', acRemindedOne: 'فكّرت {name} بالرد',
  acConfirmed: '{name} أكد إنه جاي — {people}', acDeclined: '{name} اعتذر', acEdited: '{name} غيّر ردّه — {people}', acEditedNo: '{name} غيّر ردّه واعتذر',
  acUnmatched: 'رد من اللينك العام باسم «{name}» محتاج مطابقة', acMatched: 'رد «{name}» اتطابق',
  acTable: '{name} اتضافت ({seats})', acSeated: '{name} اتوزّع على {table}', acMoved: '{name} اتنقل لـ{table}', acUnseated: '{name} اتشال من {table}',
  acAuto: 'التوزيع الأوتوماتيك اتعتمد: {invitations}{tables}', acAutoTables: '، وزوّدنا {tables}', acAutoUndone: 'رجعنا في التوزيع الأوتوماتيك ({invitations})',
  acIn: '{name} وصل — {people}', acPartial: '{name}: وصل {n} من {of}', acException: 'دخول استثنائي: {name} — {reason}', acInUndone: 'رجعنا في تسجيل دخول {name}',
  acWalkIn: 'دخول من برّه القايمة: {name} — {people}{note}', acArchived: 'المناسبة اتأرشفت', acByCoordinator: 'المنسّق', acByCaterer: 'فريق الضيافة',
  phUpcoming: 'بنجهّز', phFinalWeek: 'آخر أسبوع', phEventDay: 'يوم المناسبة', phCompleted: 'خلصت', phArchived: 'متأرشفة',
  psNone: 'لسه ما اتصممتش', psDraft: 'مسودة — لسه ما اتنشرتش', psPublished: 'منشورة', psChanged: 'منشورة · فيه تعديلات لسه ما اتنشرتش',
}, {
  acCreated: 'تم إنشاء المناسبة', acUpdated: 'تعدّلت بيانات المناسبة{what}', acSaved: 'انحفظت مسودة الدعوة', acPublished: 'تم نشر الدعوة', acRepublished: 'تم نشر تعديلات الدعوة',
  acAdded: 'انضاف {name}', acImported: 'انضاف {guests} من ملف{skipped}', acImportSkipped: ' (مع تخطي {rows})', acPartyUpdated: 'تعدّلت بيانات {name}', acRemoved: 'انحذف {name} من القائمة',
  acSharedMany: 'انرسلت {invitations}{how}', acSharedOne: 'انرسلت دعوة {name}{how}', acManual: ' يدوي', acDemo: ' · تجريبي', acOpened: '{name} فتح الدعوة',
  acFailedMany: 'ما قدرنا نرسل {invitations} · تجريبي', acFailedOne: 'ما قدرنا نرسل دعوة {name} · تجريبي', acRemindedMany: 'ذكّرت {invitations} بالرد', acRemindedOne: 'ذكّرت {name} بالرد',
  acConfirmed: '{name} أكد الحضور — {people}', acDeclined: '{name} اعتذر عن الحضور', acEdited: '{name} عدّل ردّه — {people}', acEditedNo: '{name} عدّل ردّه واعتذر',
  acUnmatched: 'رد من الرابط العام باسم «{name}» يحتاج مطابقة', acMatched: 'تطابق رد «{name}»',
  acTable: 'انضافت {name} ({seats})', acSeated: 'تم توزيع {name} على {table}', acMoved: 'انتقل {name} إلى {table}', acUnseated: 'انشال {name} من {table}',
  acAuto: 'تم اعتماد التوزيع التلقائي: {invitations}{tables}', acAutoTables: '، مع إضافة {tables}', acAutoUndone: 'تراجعنا عن التوزيع التلقائي ({invitations})',
  acIn: '{name} وصل — {people}', acPartial: '{name}: وصل {n} من {of}', acException: 'دخول باستثناء: {name} — {reason}', acInUndone: 'تراجعنا عن تسجيل دخول {name}',
  acWalkIn: 'دخول من برّا القائمة: {name} — {people}{note}', acArchived: 'تمت أرشفة المناسبة', acByCoordinator: 'المنسّق', acByCaterer: 'فريق الضيافة',
  phUpcoming: 'نجهّز لها', phFinalWeek: 'آخر أسبوع', phEventDay: 'يوم المناسبة', phCompleted: 'انتهت', phArchived: 'مؤرشفة',
  psNone: 'ما تصممت للحين', psDraft: 'مسودة — ما نُشرت للحين', psPublished: 'منشورة', psChanged: 'منشورة · فيه تعديلات ما نُشرت',
});

/** t(PHASE_KEY[phase]) — the words for domain/event PHASE_LABEL (which keeps the tone) */
export const PHASE_KEY = { upcoming: 'phUpcoming', final_week: 'phFinalWeek', event_day: 'phEventDay', completed: 'phCompleted', archived: 'phArchived' } as const;
/** t(PUBLISH_KEY[state]) — the words for domain/invitation PUBLISH_LABEL */
export const PUBLISH_KEY = { none: 'psNone', draft: 'psDraft', published: 'psPublished', changed: 'psChanged' } as const;
