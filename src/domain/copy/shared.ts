/**
 * Smaller pieces across the app: the guest page's loading and error states, previews, the copy field, the
 * account menu, the caterer's home, the capacity upgrade's lines, the editor's paper preview and seating labels.
 */
import { voiced } from './group';

export const SHARED = voiced({
  // the guest's invitation page before it opens (guests are always addressed in the plural)
  shOpening: 'جارٍ فتح الدعوة', shLinkBroken: 'الرابط غير مكتمل', shAskAgain: 'اطلبوا رابط الدعوة مرة أخرى من صاحب المناسبة.', shNotYet: 'الدعوة غير متاحة بعد', shNotFound: 'لم نجد هذه الدعوة',
  shRetryGuests: 'أعيدوا المحاولة', shPlayFailed: 'تعذّر تشغيل الدعوة', shPrivateTo: 'دعوة خاصة إلى', shForYou: 'دعوة لكم',
  shZoomQr: 'تكبير رمز الدخول لـ{name}', shQrFor: 'رمز QR لدخول {name}', shQrBig: 'رمز الدخول بحجم كبير', shPassFor: 'بطاقة دخول {name}',
  // previews of the invitation
  shGuestName: 'اسم الضيف', shPreviewPublished: 'معاينة الدعوة المنشورة', shPreviewDraft: 'معاينة المسودة — هذه التعديلات ليست منشورة للضيوف', shNoReply: 'لن يُسجل أي رد',
  shPreviewShort: 'معاينة', shDraftShort: 'معاينة المسودة', shClosePreview: 'إغلاق المعاينة', shPreparing: 'جارٍ تجهيز المعاينة', shLiveLabel: 'معاينة حية للدعوة', shPreparingDots: 'تجهيز المعاينة…',
  shPreviewFailed: 'تعذّر فتح المعاينة.', shCardFailed: 'تعذّر عرض البطاقة. أعد تحميل الصفحة.', shOpenDesign: 'افتح لمعاينة التصميم', shJourney: 'من أول دعوة إلى آخر ضيف',
  shCardPreview: 'معاينة البطاقة: {name}', shMsgPreview: 'معاينة كلمة الدعوة', shProgPreview: 'معاينة البرنامج', shPaperMsg: 'يسعدنا حضوركم.', shPaperProg: 'لحظات ننتظركم فيها.',
  shWriteMsg: 'اكتب كلمة دعوتك، وستظهر هنا.', shBigCard: 'البطاقة بحجم أكبر', shZoomed: 'البطاقة مكبّرة. مرّر للتنقل داخلها', shBigPreview: 'معاينة البطاقة بحجم أكبر',
  shSheet: 'لوحة التعديل: {state}. اسحب أو استخدم الأسهم للأعلى والأسفل', shSheetFull: 'مكبّرة', shSheetPeek: 'مصغّرة', shSheetHalf: 'بالمنتصف',
  // copying a link
  shSelected: 'الرابط محدد — انسخه يدويًا', shCopiedShort: 'تم النسخ', shCopy: 'نسخ',
  // account menu and the caterer's home
  shAccountOf: 'حسابك: {name}', shDemoSession: '{name} · جلسة تجربة', shResetQ: 'البدء من جديد؟', shResetBody: 'تُحذف المناسبات والضيوف التي أضفتها على هذا الجهاز، وتعود البيانات التجريبية كما كانت.', shResetGo: 'ابدأ من جديد',
  shCatEvents: 'مناسبات الضيافة', shCatSub: 'تابع الوجبات والاحتياجات والطاولات لكل مناسبة.', shNoActive: 'لا مناسبات نشطة حاليًا.',
  // the capacity upgrade
  shUpNeed: 'هذه الإضافة تحتاج', shUpLimit: '، وحد مناسبتك الحالي', shUpIncl: '. السعة تشمل الضيوف ومرافقيهم.', shUpUsed: 'المستخدم الآن', shUpOf: 'من',
  shUpOwnerOnly: 'هذه الإضافة تحتاج {required} وحد المناسبة {limit}. زيادة السعة والدفع متاحان لصاحب المناسبة فقط؛ اطلب منه زيادتها ثم أعد المحاولة.',
  shUpDiffPrice: 'الفرق · سعر الباقة {price}', shUpCancelHint: 'إلغاء الترقية يعيدك دون أي إضافة، وما كتبته يبقى كما هو.', shUpOnce: 'السعر دفعة واحدة لهذه المناسبة فقط.', shUpDemoPrices: 'الأسعار للتجربة.',
  shUpResumeAfter: 'بعد التأكيد نكمل الإضافة المحفوظة تلقائيًا، مرة واحدة.', shUpOtherSession: 'زادت السعة من جلسة أخرى قبل التأكيد، فلم نسجّل دفعًا جديدًا.', shUpResuming: 'نكمل الإضافة المحفوظة…',
  shUpResumed: 'تمت إضافة {added}. المستخدم الآن {used} من {limit}.', shUpPartial: 'السعة زادت، لكن الإضافة لم تكتمل',
  // seating labels (hall map and the auto-seat sheet)
  shHallLabel: 'خريطة الطاولات وتصفية القائمة', shTableUse: '{name}: {used} من {cap}', shOverBy: '، زيادة {n}', shHasAllergy: '، عليها حساسية طعام', shOrder: '، الترتيب {n}',
  shPickTableFor: 'اختر طاولة لـ{name}', shCancelMove: 'إلغاء النقل', shCurrentTable: 'الطاولة الحالية', shBecomes: 'تصبح {after} من {cap}', shOverCap: '، فوق السعة',
  shEditParty: 'تعديل {name}', shScope: 'نطاق التوزيع', shSides: 'الجهات', shNoSide: 'بلا جهة', shOverCapB: 'فوق السعة', shSuggestedOf: '، منها {n} مقترحة', shOverByB: '، فوق السعة بـ{n}',
}, {
  shOpening: 'بنفتح الدعوة', shLinkBroken: 'اللينك ناقص', shAskAgain: 'اطلبوا لينك الدعوة تاني من صاحب المناسبة.', shNotYet: 'الدعوة لسه مش متاحة', shNotFound: 'ملقيناش الدعوة دي',
  shRetryGuests: 'جرّبوا تاني', shPlayFailed: 'الدعوة ما اشتغلتش', shPrivateTo: 'دعوة خاصة باسم', shForYou: 'دعوة ليكم',
  shZoomQr: 'كبّروا كود الدخول لـ{name}', shQrFor: 'كود QR لدخول {name}', shQrBig: 'كود الدخول كبير', shPassFor: 'كارت دخول {name}',
  shGuestName: 'اسم الضيف', shPreviewPublished: 'معاينة الدعوة المنشورة', shPreviewDraft: 'معاينة المسودة — التعديلات دي لسه ما اتنشرتش للضيوف', shNoReply: 'مفيش رد هيتسجل',
  shPreviewShort: 'معاينة', shDraftShort: 'معاينة المسودة', shClosePreview: 'اقفل المعاينة', shPreparing: 'بنجهّز المعاينة', shLiveLabel: 'معاينة مباشرة للدعوة', shPreparingDots: 'بنجهّز المعاينة…',
  shPreviewFailed: 'المعاينة ما اتفتحتش.', shCardFailed: 'الكارت ما ظهرش. اعمل ريفريش للصفحة.', shOpenDesign: 'افتح وشوف التصميم', shJourney: 'من أول دعوة لآخر ضيف',
  shCardPreview: 'معاينة الكارت: {name}', shMsgPreview: 'معاينة كلمة الدعوة', shProgPreview: 'معاينة البرنامج', shPaperMsg: 'يسعدنا وجودكم.', shPaperProg: 'لحظات مستنيينكم فيها.',
  shWriteMsg: 'اكتب كلمة دعوتك، وهتظهر هنا.', shBigCard: 'الكارت بحجم أكبر', shZoomed: 'الكارت متكبّر. حرّك عشان تتنقل جواه', shBigPreview: 'معاينة الكارت بحجم أكبر',
  shSheet: 'لوحة التعديل: {state}. اسحب أو استخدم الأسهم لفوق ولتحت', shSheetFull: 'كبيرة', shSheetPeek: 'صغيرة', shSheetHalf: 'في النص',
  shSelected: 'اللينك متحدد — انسخه بإيدك', shCopiedShort: 'اتنسخ', shCopy: 'انسخ',
  shAccountOf: 'حسابك: {name}', shDemoSession: '{name} · جلسة تجربة', shResetQ: 'تبدأ من الأول؟', shResetBody: 'المناسبات والضيوف اللي ضفتهم على الجهاز ده هيتمسحوا، والبيانات التجريبية هترجع زي ما كانت.', shResetGo: 'ابدأ من الأول',
  shCatEvents: 'مناسبات الضيافة', shCatSub: 'تابع الوجبات والاحتياجات والترابيزات لكل مناسبة.', shNoActive: 'مفيش مناسبات شغالة دلوقتي.',
  shUpNeed: 'الإضافة دي محتاجة', shUpLimit: '، وحد مناسبتك دلوقتي', shUpIncl: '. السعة بتشمل الضيوف واللي معاهم.', shUpUsed: 'المستخدم دلوقتي', shUpOf: 'من',
  shUpOwnerOnly: 'الإضافة دي محتاجة {required} وحد المناسبة {limit}. زيادة السعة والدفع لصاحب المناسبة بس؛ اطلب منه يزوّدها وبعدين جرّب تاني.',
  shUpDiffPrice: 'الفرق · سعر الباقة {price}', shUpCancelHint: 'لو لغيت الترقية هترجع من غير ما يتضاف حاجة، واللي كتبته هيفضل زي ما هو.', shUpOnce: 'السعر مرة واحدة للمناسبة دي بس.', shUpDemoPrices: 'الأسعار للتجربة.',
  shUpResumeAfter: 'بعد التأكيد هنكمّل الإضافة المحفوظة لوحدها، مرة واحدة.', shUpOtherSession: 'السعة زادت من جلسة تانية قبل التأكيد، فما سجّلناش دفع جديد.', shUpResuming: 'بنكمّل الإضافة المحفوظة…',
  shUpResumed: 'ضفنا {added}. المستخدم دلوقتي {used} من {limit}.', shUpPartial: 'السعة زادت، بس الإضافة ما كملتش',
  shHallLabel: 'خريطة الترابيزات وتصفية القايمة', shTableUse: '{name}: {used} من {cap}', shOverBy: '، زيادة {n}', shHasAllergy: '، عليها حساسية أكل', shOrder: '، الترتيب {n}',
  shPickTableFor: 'اختار ترابيزة لـ{name}', shCancelMove: 'الغي النقل', shCurrentTable: 'الترابيزة الحالية', shBecomes: 'هتبقى {after} من {cap}', shOverCap: '، فوق السعة',
  shEditParty: 'عدّل {name}', shScope: 'نطاق التوزيع', shSides: 'الجهات', shNoSide: 'من غير جهة', shOverCapB: 'فوق السعة', shSuggestedOf: '، منهم {n} مقترحين', shOverByB: '، فوق السعة بـ{n}',
}, {
  shOpening: 'نفتح الدعوة', shLinkBroken: 'الرابط ناقص', shAskAgain: 'اطلبوا رابط الدعوة مرة ثانية من صاحب المناسبة.', shNotYet: 'الدعوة مو متاحة للحين', shNotFound: 'ما لقينا هالدعوة',
  shRetryGuests: 'جرّبوا مرة ثانية', shPlayFailed: 'ما اشتغلت الدعوة', shPrivateTo: 'دعوة خاصة باسم', shForYou: 'دعوة لكم',
  shZoomQr: 'كبّروا رمز الدخول لـ{name}', shQrFor: 'رمز QR لدخول {name}', shQrBig: 'رمز الدخول بحجم كبير', shPassFor: 'بطاقة دخول {name}',
  shGuestName: 'اسم الضيف', shPreviewPublished: 'معاينة الدعوة المنشورة', shPreviewDraft: 'معاينة المسودة — هالتعديلات ما نُشرت للضيوف', shNoReply: 'ما راح يتسجّل أي رد',
  shPreviewShort: 'معاينة', shDraftShort: 'معاينة المسودة', shClosePreview: 'سكّر المعاينة', shPreparing: 'نجهّز المعاينة', shLiveLabel: 'معاينة مباشرة للدعوة', shPreparingDots: 'نجهّز المعاينة…',
  shPreviewFailed: 'ما انفتحت المعاينة.', shCardFailed: 'ما طلعت البطاقة. حدّث الصفحة.', shOpenDesign: 'افتح وشوف التصميم', shJourney: 'من أول دعوة لآخر ضيف',
  shCardPreview: 'معاينة البطاقة: {name}', shMsgPreview: 'معاينة كلمة الدعوة', shProgPreview: 'معاينة البرنامج', shPaperMsg: 'يسعدنا حضوركم.', shPaperProg: 'لحظات ننتظركم فيها.',
  shWriteMsg: 'اكتب كلمة دعوتك، وبتطلع هنا.', shBigCard: 'البطاقة بحجم أكبر', shZoomed: 'البطاقة مكبّرة. مرّر عشان تتنقل داخلها', shBigPreview: 'معاينة البطاقة بحجم أكبر',
  shSheet: 'لوحة التعديل: {state}. اسحب أو استخدم الأسهم لفوق وتحت', shSheetFull: 'مكبّرة', shSheetPeek: 'مصغّرة', shSheetHalf: 'بالنص',
  shSelected: 'الرابط محدد — انسخه يدوي', shCopiedShort: 'نسخناه', shCopy: 'انسخ',
  shAccountOf: 'حسابك: {name}', shDemoSession: '{name} · جلسة تجربة', shResetQ: 'تبدأ من جديد؟', shResetBody: 'بتنحذف المناسبات والضيوف اللي أضفتها على هالجهاز، وترجع البيانات التجريبية مثل ما كانت.', shResetGo: 'ابدأ من جديد',
  shCatEvents: 'مناسبات الضيافة', shCatSub: 'تابع الوجبات والاحتياجات والطاولات لكل مناسبة.', shNoActive: 'ما فيه مناسبات نشطة الحين.',
  shUpNeed: 'هالإضافة تحتاج', shUpLimit: '، وحد مناسبتك الحالي', shUpIncl: '. السعة تشمل الضيوف ومرافقيهم.', shUpUsed: 'المستخدم الحين', shUpOf: 'من',
  shUpOwnerOnly: 'هالإضافة تحتاج {required} وحد المناسبة {limit}. زيادة السعة والدفع لصاحب المناسبة بس؛ اطلب منه يزيدها وبعدها جرّب مرة ثانية.',
  shUpDiffPrice: 'الفرق · سعر الباقة {price}', shUpCancelHint: 'لو ألغيت الترقية ترجع بدون أي إضافة، واللي كتبته يبقى مثل ما هو.', shUpOnce: 'السعر دفعة وحدة لهالمناسبة بس.', shUpDemoPrices: 'الأسعار للتجربة.',
  shUpResumeAfter: 'بعد التأكيد نكمّل الإضافة المحفوظة تلقائيًا، مرة وحدة.', shUpOtherSession: 'زادت السعة من جلسة ثانية قبل التأكيد، فما سجّلنا دفع جديد.', shUpResuming: 'نكمّل الإضافة المحفوظة…',
  shUpResumed: 'أضفنا {added}. المستخدم الحين {used} من {limit}.', shUpPartial: 'زادت السعة، بس الإضافة ما اكتملت',
  shHallLabel: 'خريطة الطاولات وتصفية القائمة', shTableUse: '{name}: {used} من {cap}', shOverBy: '، زيادة {n}', shHasAllergy: '، عليها حساسية أكل', shOrder: '، الترتيب {n}',
  shPickTableFor: 'اختر طاولة لـ{name}', shCancelMove: 'ألغِ النقل', shCurrentTable: 'الطاولة الحالية', shBecomes: 'بتصير {after} من {cap}', shOverCap: '، فوق السعة',
  shEditParty: 'عدّل {name}', shScope: 'نطاق التوزيع', shSides: 'الجهات', shNoSide: 'بدون جهة', shOverCapB: 'فوق السعة', shSuggestedOf: '، منها {n} مقترحة', shOverByB: '، فوق السعة بـ{n}',
});
