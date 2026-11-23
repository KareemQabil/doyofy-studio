/**
 * Lines built by domain code: the activity feed (domain/activity) and the event phase.
 * Domain functions take the dialect and stay pure.
 */
import { voiced } from './group';

export const ACTIVITY = voiced({
  acCreated: 'تم إنشاء المناسبة', acUpdated: 'تم تعديل بيانات المناسبة{what}', acSaved: 'تم حفظ تصميم الدعوة', acPublished: 'الدعوة جاهزة لضيوفك', acRepublished: 'تحدّثت الدعوة لضيوفك',
  acAdded: 'تمت إضافة {name}', acImported: 'تمت إضافة {guests} من ملف{skipped}', acImportSkipped: ' (تم تخطي {rows})', acPartyUpdated: 'تم تعديل بيانات {name}', acRemoved: 'تم حذف {name} من القائمة',
  acSharedMany: 'تمت مشاركة {invitations}{how}', acSharedOne: 'تمت مشاركة دعوة {name}{how}', acManual: ' يدويًا', acDemo: ' · تجريبي', acOpened: 'فُتحت دعوة {name}',
  acFailedMany: 'تعذّر إرسال {invitations} · تجريبي', acFailedOne: 'تعذّر إرسال دعوة {name} · تجريبي', acRemindedMany: 'ذكّرت {invitations} بالرد', acRemindedOne: 'ذكّرت {name} بالرد',
  acConfirmed: 'تأكيد حضور {name} — {people}', acDeclined: 'اعتذار {name} عن الحضور', acEdited: 'تعديل رد {name} — {people}', acEditedNo: 'تعديل رد {name} إلى الاعتذار',
  acUnmatched: 'رد من الرابط العام باسم «{name}» يحتاج مطابقة', acMatched: 'تمت مطابقة رد «{name}»',
  acTable: 'تمت إضافة {name} ({seats})', acSeated: 'تم توزيع {name} على {table}', acMoved: 'تم نقل {name} إلى {table}', acUnseated: 'تمت إزالة {name} من {table}',
  acAuto: 'تم اعتماد التوزيع التلقائي: {invitations}{tables}', acAutoTables: '، مع إضافة {tables}', acAutoUndone: 'تم التراجع عن التوزيع التلقائي ({invitations})',
  acIn: 'وصول {name} — {people}', acPartial: '{name}: وصل {n} من {of}', acException: 'دخول باستثناء: {name} — {reason}', acInUndone: 'تم التراجع عن تسجيل دخول {name}',
  acWalkIn: 'دخول من خارج القائمة: {name} — {people}{note}', acArchived: 'تمت أرشفة المناسبة', acByCoordinator: 'المنسق', acByCaterer: 'فريق الضيافة',
  // guests moved or copied between events (the source and the destination each get their own line)
  acTransferredOut: 'نُقلت دعوة {name} إلى «{event}»', acCopiedOut: 'نُسخت {invitations} إلى «{event}»', acTransferredIn: 'انتقلت {invitations} من «{event}»', acCopiedIn: 'نُسخت {invitations} من «{event}»',
  // the event's phase
  phUpcoming: 'قيد التجهيز', phFinalWeek: 'الأسبوع الأخير', phEventDay: 'يوم المناسبة', phCompleted: 'انتهت', phArchived: 'مؤرشفة',
}, {
  acCreated: 'المناسبة اتعملت', acUpdated: 'بيانات المناسبة اتعدّلت{what}', acSaved: 'تصميم الدعوة اتحفظ', acPublished: 'الدعوة جاهزة لضيوفك', acRepublished: 'الدعوة اتحدّثت لضيوفك',
  acAdded: '{name} اتضاف', acImported: '{guests} اتضافوا من ملف{skipped}', acImportSkipped: ' (من غير {rows})', acPartyUpdated: 'بيانات {name} اتعدّلت', acRemoved: '{name} اتمسح من القايمة',
  acSharedMany: '{invitations} اتبعتت{how}', acSharedOne: 'دعوة {name} اتبعتت{how}', acManual: ' بإيدك', acDemo: ' · تجريبي', acOpened: 'دعوة {name} اتفتحت',
  acFailedMany: 'ماقدرناش نبعت {invitations} · تجريبي', acFailedOne: 'ماقدرناش نبعت دعوة {name} · تجريبي', acRemindedMany: 'بعتّ تذكير لـ{invitations}', acRemindedOne: 'بعتّ تذكير لـ{name}',
  acConfirmed: '{name} أكدوا إنهم جايين — {people}', acDeclined: '{name} اعتذروا', acEdited: '{name} غيّروا ردّهم — {people}', acEditedNo: '{name} غيّروا ردّهم واعتذروا',
  acUnmatched: 'رد من اللينك العام باسم «{name}» محتاج مطابقة', acMatched: 'رد «{name}» اتطابق',
  acTable: '{name} اتضافت ({seats})', acSeated: 'وزّعنا {name} على {table}', acMoved: 'نقلنا {name} لـ{table}', acUnseated: 'شلنا {name} من {table}',
  acAuto: 'التوزيع الأوتوماتيك اتعتمد: {invitations}{tables}', acAutoTables: '، وزوّدنا {tables}', acAutoUndone: 'رجعنا في التوزيع الأوتوماتيك ({invitations})',
  acIn: '{name} وصلوا — {people}', acPartial: '{name}: وصلوا {n} من {of}', acException: 'دخول استثنائي: {name} — {reason}', acInUndone: 'لغينا دخول {name}',
  acWalkIn: 'دخول من برّه القايمة: {name} — {people}{note}', acArchived: 'المناسبة اتأرشفت', acByCoordinator: 'المنسّق', acByCaterer: 'فريق الضيافة',
  acTransferredOut: 'دعوة {name} اتنقلت لـ«{event}»', acCopiedOut: '{invitations} اتنسخت لـ«{event}»', acTransferredIn: '{invitations} اتنقلت من «{event}»', acCopiedIn: '{invitations} اتنسخت من «{event}»',
  phUpcoming: 'لسه بتتجهّز', phFinalWeek: 'آخر أسبوع', phEventDay: 'يوم المناسبة', phCompleted: 'خلصت', phArchived: 'متأرشفة',
}, {
  acCreated: 'تم إنشاء المناسبة', acUpdated: 'تعدّلت بيانات المناسبة{what}', acSaved: 'انحفظ تصميم الدعوة', acPublished: 'الدعوة جاهزة لضيوفك', acRepublished: 'تحدّثت الدعوة لضيوفك',
  acAdded: 'انضاف {name}', acImported: 'انضاف {guests} من ملف{skipped}', acImportSkipped: ' (مع تخطي {rows})', acPartyUpdated: 'تعدّلت بيانات {name}', acRemoved: 'انحذف {name} من القائمة',
  acSharedMany: 'انرسلت {invitations}{how}', acSharedOne: 'انرسلت دعوة {name}{how}', acManual: ' يدوي', acDemo: ' · تجريبي', acOpened: 'انفتحت دعوة {name}',
  acFailedMany: 'ما قدرنا نرسل {invitations} · تجريبي', acFailedOne: 'ما قدرنا نرسل دعوة {name} · تجريبي', acRemindedMany: 'ذكّرت {invitations} بالرد', acRemindedOne: 'ذكّرت {name} بالرد',
  acConfirmed: '{name} أكدوا الحضور — {people}', acDeclined: '{name} اعتذروا عن الحضور', acEdited: '{name} عدّلوا ردّهم — {people}', acEditedNo: '{name} عدّلوا ردّهم واعتذروا',
  acUnmatched: 'رد من الرابط العام باسم «{name}» يحتاج مطابقة', acMatched: 'تطابق رد «{name}»',
  acTable: 'انضافت {name} ({seats})', acSeated: 'تم توزيع {name} على {table}', acMoved: 'نقلنا {name} لـ{table}', acUnseated: 'شلنا {name} من {table}',
  acAuto: 'تم اعتماد التوزيع التلقائي: {invitations}{tables}', acAutoTables: '، مع إضافة {tables}', acAutoUndone: 'تراجعنا عن التوزيع التلقائي ({invitations})',
  acIn: '{name} وصلوا — {people}', acPartial: '{name}: وصلوا {n} من {of}', acException: 'دخول باستثناء: {name} — {reason}', acInUndone: 'تراجعنا عن تسجيل دخول {name}',
  acWalkIn: 'دخول من برّا القائمة: {name} — {people}{note}', acArchived: 'تمت أرشفة المناسبة', acByCoordinator: 'المنسّق', acByCaterer: 'فريق الضيافة',
  acTransferredOut: 'انتقلت دعوة {name} إلى «{event}»', acCopiedOut: 'انتسخت {invitations} إلى «{event}»', acTransferredIn: 'انتقلت {invitations} من «{event}»', acCopiedIn: 'انتسخت {invitations} من «{event}»',
  phUpcoming: 'قيد التجهيز', phFinalWeek: 'آخر أسبوع', phEventDay: 'يوم المناسبة', phCompleted: 'انتهت', phArchived: 'مؤرشفة',
});

/** t(PHASE_KEY[phase]) — the words for domain/event PHASE_LABEL (which keeps the tone) */
export const PHASE_KEY = { upcoming: 'phUpcoming', final_week: 'phFinalWeek', event_day: 'phEventDay', completed: 'phCompleted', archived: 'phArchived' } as const;
