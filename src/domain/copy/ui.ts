/**
 * Words inside the shared UI primitives (form fields, loaders, dialogs, the card deck, the appearance switch) and the
 * generic error line, so every screen built from them speaks the chosen voice.
 */
import { voiced } from './group';

export const UI = voiced({
  uiOptional: '(اختياري)', uiIncrease: 'زيادة {label}', uiDecrease: 'إنقاص {label}', uiSearch: 'بحث', uiSearchPh: 'ابحث بالاسم أو الجوال', uiClearSearch: 'مسح البحث',
  uiDeckHint: 'اسحب البطاقات لتتصفّح', uiDeckRole: 'معرض بطاقات', uiDeckPrev: 'البطاقة السابقة', uiDeckNext: 'البطاقة التالية', uiOf: '{n} من {count}',
  uiAppearance: 'مظهر المنصة', uiToDark: 'المظهر الداكن', uiToLight: 'المظهر الفاتح', uiThemeLight: 'فاتح', uiThemeDark: 'داكن', uiThemeSystem: 'حسب الجهاز',
  uiLoading: 'جارٍ التحميل', uiLoadError: 'تعذر تحميل البيانات', uiUnexpected: 'حدث خطأ غير متوقع.', uiRetry: 'أعد المحاولة', uiCloseSheet: 'إغلاق اللوحة', uiClose: 'إغلاق', uiBack: 'تراجع',
  uiGenericError: 'تعذر إكمال العملية. تحقق من الاتصال ثم أعد المحاولة.',
}, {
  uiOptional: '(لو حابب)', uiIncrease: 'زوّد {label}', uiDecrease: 'قلّل {label}', uiSearch: 'دوّر', uiSearchPh: 'دوّر بالاسم أو الموبايل', uiClearSearch: 'امسح البحث',
  uiDeckHint: 'اسحب الكروت عشان تتصفّح', uiDeckRole: 'معرض كروت', uiDeckPrev: 'الكارت اللي قبله', uiDeckNext: 'الكارت اللي بعده', uiOf: '{n} من {count}',
  uiAppearance: 'شكل المنصة', uiToDark: 'الشكل الغامق', uiToLight: 'الشكل الفاتح', uiThemeLight: 'فاتح', uiThemeDark: 'غامق', uiThemeSystem: 'زي جهازك',
  uiLoading: 'بنحمّل', uiLoadError: 'ماقدرناش نحمّل البيانات', uiUnexpected: 'حصلت مشكلة مش متوقعة.', uiRetry: 'جرّب تاني', uiCloseSheet: 'اقفل اللوحة', uiClose: 'اقفل', uiBack: 'رجوع',
  uiGenericError: 'ماقدرناش نكمّل. اتأكد من النت وجرّب تاني.',
}, {
  uiOptional: '(إذا حاب)', uiIncrease: 'زِد {label}', uiDecrease: 'نقّص {label}', uiSearch: 'بحث', uiSearchPh: 'دوّر بالاسم أو الجوال', uiClearSearch: 'امسح البحث',
  uiDeckHint: 'اسحب البطاقات عشان تتصفّح', uiDeckRole: 'معرض بطاقات', uiDeckPrev: 'البطاقة اللي قبل', uiDeckNext: 'البطاقة اللي بعد', uiOf: '{n} من {count}',
  uiAppearance: 'شكل المنصة', uiToDark: 'الوضع الداكن', uiToLight: 'الوضع الفاتح', uiThemeLight: 'فاتح', uiThemeDark: 'داكن', uiThemeSystem: 'حسب جهازك',
  uiLoading: 'نحمّل', uiLoadError: 'ما قدرنا نحمّل البيانات', uiUnexpected: 'صار خطأ ما توقعناه.', uiRetry: 'جرّب مرة ثانية', uiCloseSheet: 'سكّر اللوحة', uiClose: 'سكّر', uiBack: 'تراجع',
  uiGenericError: 'ما قدرنا نكمّل. تأكد من الاتصال وجرّب مرة ثانية.',
});

/**
 * Service-layer messages (mock services, the remote client's local checks, the spreadsheet reader). Services raise
 * them in modern Arabic (copyError); errorMessage() reads them back in the organizer's voice. Lines a guest sees
 * (invitation links, reply windows) stay with the guest pages and are not listed here.
 */
export const ERRORS = voiced({
  erNameRequired: 'اكتب اسم الضيف أو العائلة.', erBadPhone: 'رقم الجوال غير صحيح. مثال: 0551234567 أو ‎+966551234567', erPartySize: 'العدد المسموح بين 1 و20.',
  erSettingsConflict: 'عُدّلت هذه الإعدادات من نافذة أخرى. حمّلنا آخر نسخة — راجعها ثم احفظ.',
  erPickDistinct: 'اختر ضيوفًا مختلفين أولًا.', erPickActive: 'اختر مناسبة نشطة لاستقبال الضيوف.', erOneSource: 'اختر ضيوفًا من مناسبة واحدة ومناسبة وجهة مختلفة.',
  erMoveArrived: 'لا يمكن نقل ضيف سُجّل وصوله. يمكنك نسخ بياناته للمناسبة الجديدة.', erTransferDupes: 'موجودون بالفعل أو مكررون ضمن التحديد: {names}. لم يُنقل أي ضيف.',
  erReplyNotFound: 'لم نجد هذا الرد.', erReplyOver: 'الرد لـ{count} أشخاص، والدعوة تسمح بـ{max}. عدّل العدد المسموح أولًا.',
  erTableNotFound: 'لم نجد هذه الطاولة.', erTablesChanged: 'تغيّرت قائمة الطاولات. أعد المحاولة من آخر ترتيب.', erSameEventTable: 'اختر طاولة من المناسبة نفسها.', erSeatConfirmedOnly: 'يمكن توزيع الدعوات المؤكدة فقط.',
  erPlanTables: 'تغيّرت الطاولات منذ عرض الاقتراح. راجع الاقتراح من جديد.', erPlanDup: 'الاقتراح يكرر دعوة أكثر من مرة.', erPlanSeating: 'تغيّر توزيع بعض الضيوف منذ عرض الاقتراح. راجع الاقتراح من جديد.',
  erPlanReplies: 'تغيّرت ردود بعض الضيوف منذ عرض الاقتراح. راجع الاقتراح من جديد.', erPlanOver: '{table} ستتجاوز السعة بهذا الاقتراح. راجع الاقتراح من جديد.',
  erUndoStale: 'تغيّر التوزيع بعد اعتماده، فلم نتراجع حتى لا نلغي تعديلاتك.', erPickCount: 'اختر عدد القادمين الآن.', erAlreadyUndone: 'تم التراجع عن هذا التسجيل من قبل.',
  erWalkInName: 'اكتب اسم الضيف كما قاله.', erCount20: 'العدد بين 1 و20.',
  erEventNotFound: 'لم نجد هذه المناسبة. ربما حُذفت أو أن الرابط غير صحيح.', erGuestNotFound: 'لم نجد هذا الضيف في القائمة. ربما حُذف.',
  erOffline: 'لا يوجد اتصال الآن. لم يتم حفظ أي تغيير — أعد المحاولة بعد عودة الاتصال.',
  erFileEmpty: 'الملف فارغ. تأكد من حفظ القائمة ثم ارفعها مرة أخرى.', erFileBig: 'الملف كبير جدًا (أكثر من 5 ميجابايت). قسّم القائمة إلى ملفات أصغر.',
  erFileXls: 'صيغة Excel القديمة (.xls) غير مدعومة. احفظ الملف بصيغة .xlsx أو CSV ثم ارفعه.', erFileType: 'نوع الملف غير مدعوم. ارفع ملف Excel ‏(.xlsx) أو CSV.',
  erFileRead: 'تعذر قراءة ملف Excel. افتحه واحفظه من جديد، أو صدّره بصيغة CSV.', erFileBrowser: 'متصفحك لا يستطيع فتح ملفات Excel. صدّر القائمة بصيغة CSV ثم ارفعها.', erFileNoSheet: 'لم نجد ورقة بيانات في الملف.',
}, {
  erNameRequired: 'اكتب اسم الضيف أو العيلة.', erBadPhone: 'رقم الموبايل مش مظبوط. مثال: 01012345678 أو ‎+201012345678', erPartySize: 'العدد المسموح من 1 لـ20.',
  erSettingsConflict: 'الإعدادات دي اتعدّلت من نافذة تانية. حمّلنا آخر نسخة — راجعها وبعدين احفظ.',
  erPickDistinct: 'اختار ضيوف مختلفين الأول.', erPickActive: 'اختار مناسبة لسه شغالة عشان تستقبل الضيوف.', erOneSource: 'اختار ضيوف من مناسبة واحدة، ومناسبة تانية تنقلهم ليها.',
  erMoveArrived: 'مينفعش تنقل ضيف اتسجّل وصوله. تقدر تنسخ بياناته للمناسبة الجديدة.', erTransferDupes: 'موجودين أصلًا أو متكررين في اللي اخترته: {names}. ما اتنقلش أي ضيف.',
  erReplyNotFound: 'ملقيناش الرد ده.', erReplyOver: 'الرد لـ{count} أشخاص، والدعوة لحد {max}. عدّل العدد المسموح الأول.',
  erTableNotFound: 'ملقيناش الترابيزة دي.', erTablesChanged: 'قايمة الترابيزات اتغيّرت. جرّب تاني من آخر ترتيب.', erSameEventTable: 'اختار ترابيزة من نفس المناسبة.', erSeatConfirmedOnly: 'تقدر توزّع الدعوات المتأكدة بس.',
  erPlanTables: 'الترابيزات اتغيّرت من ساعة ما عرضنا الاقتراح. راجعه تاني.', erPlanDup: 'الاقتراح فيه دعوة متكررة.', erPlanSeating: 'توزيع شوية ضيوف اتغيّر من ساعة ما عرضنا الاقتراح. راجعه تاني.',
  erPlanReplies: 'ردود شوية ضيوف اتغيّرت من ساعة ما عرضنا الاقتراح. راجعه تاني.', erPlanOver: '{table} هتعدّي السعة بالاقتراح ده. راجعه تاني.',
  erUndoStale: 'التوزيع اتغيّر بعد ما اعتمدته، فما رجعناش فيه عشان ما نلغيش تعديلاتك.', erPickCount: 'اختار عدد اللي جايين دلوقتي.', erAlreadyUndone: 'التسجيل ده اترجع فيه قبل كده.',
  erWalkInName: 'اكتب اسم الضيف زي ما قاله.', erCount20: 'العدد من 1 لـ20.',
  erEventNotFound: 'ملقيناش المناسبة دي. يمكن اتمسحت أو اللينك غلط.', erGuestNotFound: 'ملقيناش الضيف ده في القايمة. يمكن اتمسح.',
  erOffline: 'مفيش نت دلوقتي. مفيش أي تغيير اتحفظ — جرّب تاني لما النت يرجع.',
  erFileEmpty: 'الملف فاضي. اتأكد إنك حفظت القايمة وارفعها تاني.', erFileBig: 'الملف كبير أوي (أكتر من 5 ميجا). قسّم القايمة على ملفات أصغر.',
  erFileXls: 'صيغة Excel القديمة (.xls) مش مدعومة. احفظ الملف بصيغة .xlsx أو CSV وارفعه.', erFileType: 'نوع الملف مش مدعوم. ارفع ملف Excel ‏(.xlsx) أو CSV.',
  erFileRead: 'ماقدرناش نقرا ملف Excel. افتحه واحفظه تاني، أو نزّله بصيغة CSV.', erFileBrowser: 'المتصفح بتاعك مش بيفتح ملفات Excel. نزّل القايمة بصيغة CSV وارفعها.', erFileNoSheet: 'ملقيناش ورقة بيانات في الملف.',
}, {
  erNameRequired: 'اكتب اسم الضيف أو العائلة.', erBadPhone: 'رقم الجوال غلط. مثال: 0551234567 أو ‎+966551234567', erPartySize: 'العدد المسموح من 1 إلى 20.',
  erSettingsConflict: 'تعدّلت الإعدادات من نافذة ثانية. حمّلنا آخر نسخة — راجعها بعدين احفظ.',
  erPickDistinct: 'اختر ضيوف مختلفين أول.', erPickActive: 'اختر مناسبة شغّالة تستقبل الضيوف.', erOneSource: 'اختر ضيوف من مناسبة وحدة، ومناسبة ثانية تنقلهم لها.',
  erMoveArrived: 'ما يصير تنقل ضيف تسجّل وصوله. تقدر تنسخ بياناته للمناسبة الجديدة.', erTransferDupes: 'موجودين من قبل أو مكررين في اللي اخترته: {names}. ما انتقل أي ضيف.',
  erReplyNotFound: 'ما لقينا الرد.', erReplyOver: 'الرد لـ{count} أشخاص، والدعوة لين {max}. عدّل العدد المسموح أول.',
  erTableNotFound: 'ما لقينا الطاولة.', erTablesChanged: 'تغيّرت قائمة الطاولات. جرّب مرة ثانية من آخر ترتيب.', erSameEventTable: 'اختر طاولة من نفس المناسبة.', erSeatConfirmedOnly: 'تقدر توزّع الدعوات المؤكدة بس.',
  erPlanTables: 'تغيّرت الطاولات من بعد ما عرضنا الاقتراح. راجعه من جديد.', erPlanDup: 'الاقتراح فيه دعوة مكررة.', erPlanSeating: 'تغيّر توزيع بعض الضيوف من بعد ما عرضنا الاقتراح. راجعه من جديد.',
  erPlanReplies: 'تغيّرت ردود بعض الضيوف من بعد ما عرضنا الاقتراح. راجعه من جديد.', erPlanOver: '{table} بتتعدى السعة بالاقتراح. راجعه من جديد.',
  erUndoStale: 'تغيّر التوزيع بعد ما اعتمدته، فما تراجعنا عشان ما نلغي تعديلاتك.', erPickCount: 'اختر عدد اللي وصلوا الحين.', erAlreadyUndone: 'تراجعنا عن التسجيل من قبل.',
  erWalkInName: 'اكتب اسم الضيف مثل ما قاله.', erCount20: 'العدد من 1 إلى 20.',
  erEventNotFound: 'ما لقينا المناسبة. يمكن انحذفت أو الرابط غلط.', erGuestNotFound: 'ما لقينا الضيف في القائمة. يمكن انحذف.',
  erOffline: 'ما فيه اتصال الحين. ما انحفظ أي تغيير — جرّب مرة ثانية لما يرجع الاتصال.',
  erFileEmpty: 'الملف فاضي. تأكد إنك حفظت القائمة وارفعها مرة ثانية.', erFileBig: 'الملف كبير مرّة (أكثر من 5 ميجا). قسّم القائمة على ملفات أصغر.',
  erFileXls: 'صيغة Excel القديمة (.xls) ما تنفع. احفظ الملف بصيغة .xlsx أو CSV وارفعه.', erFileType: 'نوع الملف ما ينفع. ارفع ملف Excel ‏(.xlsx) أو CSV.',
  erFileRead: 'ما قدرنا نقرأ ملف Excel. افتحه واحفظه من جديد، أو صدّره بصيغة CSV.', erFileBrowser: 'متصفحك ما يفتح ملفات Excel. صدّر القائمة بصيغة CSV وارفعها.', erFileNoSheet: 'ما لقينا ورقة بيانات في الملف.',
});
