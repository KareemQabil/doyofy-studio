/** The creation wizard (occasion · design · details) and the design feed. */
import { partly, voiced } from './group';

export const CREATE = voiced({
  wzWhat: 'ما المناسبة؟', wzSearchHint: 'اكتب اسم مناسبتك واخترها.', wzBrowseFine: 'تصفّح البطاقات بالأسهم، واضغط على مناسبتك.', wzBrowseTouch: 'اسحب البطاقات، واضغط على مناسبتك.',
  wzSearchPlaceholder: 'مثال: تخرّج، عقيقة، إفطار', wzSearchLabel: 'ابحث عن مناسبتك', wzNoMatch: 'لم نجد «{q}». اختر «مناسبة أخرى» واكتب اسمها في الخطوة الأخيرة.', wzOther: 'مناسبة أخرى',
  wzBackToCards: 'العودة إلى البطاقات', wzSearchByName: 'لا تجد مناسبتك؟ ابحث بالاسم', wzDeckHintFine: 'تصفّح البطاقات بالأسهم', wzDeckHintTouch: 'اسحب البطاقات لتتصفّح', wzDeckActivate: 'اضغط للمتابعة',
  wzPicked: 'اخترت:', wzPickType: 'اختر نوع المناسبة', wzResumed: 'استعدنا ما كتبته سابقًا.', wzStartOver: 'ابدأ من جديد',
  wzSentToYou: 'التصميم المُرسَل لك', wzYourChoice: 'اختيارك', wzCurrentDesign: 'التصميم الحالي',
  wzEssentials: '{type}: البيانات الأساسية', wzNotCreated: 'لم تُنشأ المناسبة', wzCouple: 'العروسان', wzHost: 'صاحب المناسبة', wzName: 'الاسم', wzSecondName: 'الاسم الثاني',
  wzEventName: 'اسم المناسبة', wzEventNameHint: 'مثال: حفل افتتاح، عزيمة رمضان', wzWhen: 'الموعد', wzDate: 'التاريخ', wzTime: 'الوقت', wzPickDate: 'اختر التاريخ', wzPickTime: 'اختر الوقت',
  wzTimeZone: 'التوقيت: {zone}', wzChange: 'تغيير', wzZone: 'المنطقة الزمنية', wzWhere: 'المكان', wzVenue: 'اسم القاعة أو المكان', wzVenueExample: 'مثال: قاعة الياسمين', wzCity: 'المدينة', wzCityExample: 'مثال: الرياض',
  wzTimeChip: '{time} · غيّر', wzAddPlace: 'أضف المكان (اختياري)', wzPlaceLater: 'يمكنك إضافة المكان أو تعديله لاحقًا من الإعدادات.',
  wzLeave: 'لم تُنشأ المناسبة بعد. هل تريد المغادرة وترك ما كتبته؟',
  wzLive: 'دعوتك تتجهّز الآن', wzChangeDesign: 'غيّر التصميم', wzDateLater: ' · التاريخ مؤقت حتى تختاره', wzDesignOf: 'تصميم {type}',
  // the design feed
  tfNoStyle: 'لا تصاميم بهذا الأسلوب بعد.', tfShowAll: 'اعرض كل التصاميم', tfFilterHint: 'اختر ما يناسب ذوقك. يبقى التصميم الحالي حتى تختار غيره.', tfReplay: 'إعادة من البداية',
  tfForYou: 'مختارة لمناسبتك', tfAll: 'كل التصاميم',
  tgLater: 'لاحقًا', tgBack: 'رجوع للتصميم', tgChooseLater: 'سأختار لاحقًا', tgCreated: 'أُنشئت «{title}». اختر شكلها.', tgOnlyLook: 'يتغيّر الشكل فقط، ونصوصك تبقى.', tgKeep: 'متابعة بالتصميم الحالي', tgFailed: 'لم يُطبَّق التصميم',
  tfKeys: 'تنقّل بين التصاميم بالسهمين لأعلى ولأسفل',
}, {
  wzWhat: 'مناسبتك إيه؟', wzSearchHint: 'اكتب اسم مناسبتك واختارها.', wzBrowseFine: 'قلّب الكروت بالأسهم، ودوس على مناسبتك.', wzBrowseTouch: 'اسحب الكروت، ودوس على مناسبتك.',
  wzSearchPlaceholder: 'مثال: تخرّج، سبوع، فطار', wzSearchLabel: 'دوّر على مناسبتك', wzNoMatch: 'ملقيناش «{q}». اختار «مناسبة تانية» واكتب اسمها في آخر خطوة.', wzOther: 'مناسبة تانية',
  wzBackToCards: 'ارجع للكروت', wzSearchByName: 'مش لاقي مناسبتك؟ دوّر بالاسم', wzDeckHintFine: 'قلّب الكروت بالأسهم', wzDeckHintTouch: 'اسحب الكروت عشان تتصفّح', wzDeckActivate: 'دوس عشان تكمّل',
  wzPicked: 'اخترت:', wzPickType: 'اختار نوع المناسبة', wzResumed: 'رجّعنالك اللي كنت كاتبه.', wzStartOver: 'ابدأ من الأول',
  wzSentToYou: 'التصميم اللي اتبعتلك', wzYourChoice: 'اختيارك', wzCurrentDesign: 'التصميم الحالي',
  wzEssentials: '{type}: البيانات الأساسية', wzNotCreated: 'المناسبة متعملتش', wzCouple: 'العريس والعروسة', wzHost: 'صاحب المناسبة', wzName: 'الاسم', wzSecondName: 'الاسم التاني',
  wzEventName: 'اسم المناسبة', wzEventNameHint: 'مثال: حفلة افتتاح، عزومة رمضان', wzWhen: 'الميعاد', wzDate: 'التاريخ', wzTime: 'الساعة', wzPickDate: 'اختار التاريخ', wzPickTime: 'اختار الساعة',
  wzTimeZone: 'التوقيت: {zone}', wzChange: 'غيّر', wzZone: 'المنطقة الزمنية', wzWhere: 'المكان', wzVenue: 'اسم القاعة أو المكان', wzVenueExample: 'مثال: قاعة الياسمين', wzCity: 'المدينة', wzCityExample: 'مثال: القاهرة',
  wzTimeChip: '{time} · غيّر', wzAddPlace: 'ضيف المكان (اختياري)', wzPlaceLater: 'تقدر تضيف المكان أو تغيّره بعدين من الإعدادات.',
  wzLeave: 'المناسبة لسه متعملتش. عايز تخرج وتسيب اللي كتبته؟',
  wzLive: 'دعوتك بتتجهّز دلوقتي', wzChangeDesign: 'غيّر التصميم', wzDateLater: ' · التاريخ مؤقت لحد ما تختاره', wzDesignOf: 'تصميم {type}',
  tfNoStyle: 'لسه مفيش تصاميم بالستايل ده.', tfShowAll: 'وريني كل التصاميم', tfFilterHint: 'اختار اللي على ذوقك. التصميم الحالي هيفضل لحد ما تختار غيره.', tfReplay: 'شغّلها من الأول',
  tfForYou: 'مختارة لمناسبتك', tfAll: 'كل التصاميم',
  tgLater: 'بعدين', tgBack: 'ارجع للتصميم', tgChooseLater: 'هختار بعدين', tgCreated: '«{title}» اتعملت. اختار شكلها.', tgOnlyLook: 'الشكل بس اللي هيتغيّر، وكلامك هيفضل زي ما هو.', tgKeep: 'كمّل بالتصميم الحالي', tgFailed: 'التصميم متطبّقش',
  tfKeys: 'اتنقّل بين التصاميم بالسهمين لفوق وتحت',
}, {
  wzWhat: 'وش المناسبة؟', wzSearchHint: 'اكتب اسم مناسبتك واخترها.', wzBrowseFine: 'تصفّح البطاقات بالأسهم، واضغط على مناسبتك.', wzBrowseTouch: 'اسحب البطاقات، واضغط على مناسبتك.',
  wzSearchPlaceholder: 'مثال: تخرّج، عقيقة، فطور', wzSearchLabel: 'دوّر على مناسبتك', wzNoMatch: 'ما لقينا «{q}». اختر «مناسبة ثانية» واكتب اسمها في آخر خطوة.', wzOther: 'مناسبة ثانية',
  wzBackToCards: 'ارجع للبطاقات', wzSearchByName: 'ما لقيت مناسبتك؟ دوّر بالاسم', wzDeckHintFine: 'تصفّح البطاقات بالأسهم', wzDeckHintTouch: 'اسحب البطاقات عشان تتصفّح', wzDeckActivate: 'اضغط عشان تكمّل',
  wzPicked: 'اخترت:', wzPickType: 'اختر نوع المناسبة', wzResumed: 'رجّعنا لك اللي كتبته قبل.', wzStartOver: 'ابدأ من جديد',
  wzSentToYou: 'التصميم اللي انرسل لك', wzYourChoice: 'اختيارك', wzCurrentDesign: 'التصميم الحالي',
  wzEssentials: '{type}: البيانات الأساسية', wzNotCreated: 'ما انضافت المناسبة', wzCouple: 'المعرس والعروس', wzHost: 'صاحب المناسبة', wzName: 'الاسم', wzSecondName: 'الاسم الثاني',
  wzEventName: 'اسم المناسبة', wzEventNameHint: 'مثال: حفل افتتاح، عزيمة رمضان', wzWhen: 'الموعد', wzDate: 'التاريخ', wzTime: 'الوقت', wzPickDate: 'اختر التاريخ', wzPickTime: 'اختر الوقت',
  wzTimeZone: 'التوقيت: {zone}', wzChange: 'غيّر', wzZone: 'المنطقة الزمنية', wzWhere: 'المكان', wzVenue: 'اسم القاعة أو المكان', wzVenueExample: 'مثال: قاعة الياسمين', wzCity: 'المدينة', wzCityExample: 'مثال: الرياض',
  wzTimeChip: '{time} · غيّر', wzAddPlace: 'أضف المكان (اختياري)', wzPlaceLater: 'تقدر تضيف المكان أو تعدّله بعدين من الإعدادات.',
  wzLeave: 'المناسبة ما انضافت للحين. تبي تطلع وتترك اللي كتبته؟',
  wzLive: 'دعوتك تتجهّز الحين', wzChangeDesign: 'غيّر التصميم', wzDateLater: ' · التاريخ مؤقت لين تختاره', wzDesignOf: 'تصميم {type}',
  tfNoStyle: 'ما فيه تصاميم بهالأسلوب للحين.', tfShowAll: 'اعرض كل التصاميم', tfFilterHint: 'اختر اللي يناسب ذوقك. التصميم الحالي يبقى لين تختار غيره.', tfReplay: 'شغّلها من البداية',
  tfForYou: 'مختارة لمناسبتك', tfAll: 'كل التصاميم',
  tgLater: 'بعدين', tgBack: 'ارجع للتصميم', tgChooseLater: 'بختار بعدين', tgCreated: 'انضافت «{title}». اختر شكلها.', tgOnlyLook: 'يتغيّر الشكل بس، وكلامك يبقى مثل ما هو.', tgKeep: 'كمّل بالتصميم الحالي', tgFailed: 'ما انطبّق التصميم',
  tfKeys: 'تنقّل بين التصاميم بالأسهم لفوق وتحت',
});

/** accessible names in the wizard and the feed */
export const CREATE_MORE = partly({
  wzStepsLabel: 'خطوات إنشاء المناسبة', wzStepOf: 'الخطوة {n} من 2: ', wzStepCurrent: ' (الخطوة الحالية)', wzStepBack: 'الخطوة {n} من 2: {label} — رجوع إليها',
  wzDeckLabel: 'اختر نوع المناسبة — اسحب يمينًا للتالي', wzResults: 'نتائج البحث', wzFeedTitle: 'اختر تصميم دعوة {type}', wzChangeZone: 'تغيير المنطقة الزمنية', wzPreviewAside: 'معاينة الدعوة', wzLivePreview: 'معاينة حية لدعوة {type}',
  tfRole: 'معرض عمودي', tfOf: '{name} — {i} من {n}', tfToolbar: 'خيارات التصميم', tfPrev: 'التصميم السابق', tfNext: 'التصميم التالي', tfCountWord: 'التصميم ', tfCountOf: ' من ', tfCopyLabel: 'رابط التصميم — انسخه للمشاركة',
}, {
  wzDeckLabel: 'اختار نوع المناسبة — اسحب يمين للي بعدها', tfCopyLabel: 'لينك التصميم — انسخه وابعته',
}, {
  wzDeckLabel: 'اختر نوع المناسبة — اسحب يمين للي بعدها',
});
