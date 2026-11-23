/**
 * The editor's «النص» and «الشكل» tabs (the «الصوت» tab belongs to the audio library). Names, date and place are the
 * EVENT's own details, edited here once for everywhere; English is optional and disclosed on demand.
 */
import { voiced } from './group';

export const EDITOR_SECTIONS = voiced({
  esNames: 'الأسماء', esNamesHint: 'تظهر على البطاقة وفي كل صفحات مناسبتك.', esName: 'الاسم', esSecondName: 'الاسم الثاني', esNameError: 'اكتب {label}',
  esWhen: 'الموعد', esDate: 'التاريخ', esTime: 'الوقت', esWhere: 'المكان', esVenue: 'اسم القاعة أو المكان', esCity: 'المدينة', esMap: 'رابط الخريطة', esMapHint: 'يفتح للضيف زر «الاتجاهات».',
  esDateError: 'اختر تاريخًا صحيحًا', esFutureError: 'اختر تاريخًا قادمًا', esTimeError: 'اختر وقتًا صحيحًا', esMapHttps: 'أضف رابط خريطة يبدأ بـ https://', esMapBad: 'أضف رابط خريطة صحيحًا',
  esMessage: 'كلمة الدعوة', esEnStale: 'السطر الإنجليزي على البطاقة لم يتغيّر:', esEditIt: 'عدّله', esDeleteIt: 'احذفه',
  esEnglish: 'إضافة نص إنجليزي', esEnglishHint: 'يظهر تحت النص العربي على البطاقة وصفحات الدعوة.', esNameEn: '{label} بالإنجليزية', esMessageEn: 'كلمة الدعوة بالإنجليزية',
  esProgramme: 'برنامج المناسبة', esProgrammeMeta: 'اختياري · {n} جاهزة', esProgrammeHint: 'أضف فقرات المناسبة لتظهر لضيوفك في صفحة البرنامج. بلا فقرات، لا تظهر الصفحة.', esItemTime: 'وقت الفقرة {n}', esItem: 'الفقرة {n}', esItemEn: 'الفقرة {n} بالإنجليزية', esItemPlaceholder: 'الفقرة', esDeleteItem: 'احذف الفقرة {n}', esAddItem: 'أضف فقرة',
  esDesign: 'التصميم', esCustom: 'تصميم مخصّص', esChangeDesign: 'غيّر التصميم', esForYou: 'مختارة لمناسبتك', esForYouHint: 'يتغيّر شكل البطاقة فقط، والنص والأسماء تبقى كما كتبتها.', esCardsLabel: 'بطاقات مختارة',
  esScene: 'الخلفية', esSceneHint: 'لون الخلفية ونقشها خلف البطاقة. يراها الضيف عند فتح الدعوة.', esScenesLabel: 'خلفيات مختارة', esAll: 'كل البطاقات والخلفيات', esOptional: 'اختياري', esCard: 'البطاقة',
  esMore: 'المزيد من التصاميم', esUploadMusic: 'ارفع موسيقى', esUploadMore: 'إدارة موسيقاي', esRecordVoice: 'سجّل ترحيبًا بصوتك', esRecordAgain: 'سجّل رسالة أخرى',
  esMotion: 'الحركة', esAnimatedD: 'افتتاحية سينمائية، وظرف يُختم ويطير بعد الرد.', esStaticD: 'تفتح مباشرة على صفحات الدعوة، بلا حركة.',
}, {
  esNames: 'الأسامي', esNamesHint: 'بتظهر على الكارت وفي كل صفحات مناسبتك.', esName: 'الاسم', esSecondName: 'الاسم التاني', esNameError: 'اكتب {label}',
  esWhen: 'الميعاد', esDate: 'التاريخ', esTime: 'الساعة', esWhere: 'المكان', esVenue: 'اسم القاعة أو المكان', esCity: 'المدينة', esMap: 'لينك الخريطة', esMapHint: 'بيفتح للضيف زرار «الاتجاهات».',
  esDateError: 'اختار تاريخ صح', esFutureError: 'اختار تاريخ جاي', esTimeError: 'اختار ساعة صح', esMapHttps: 'حط لينك خريطة بيبدأ بـ https://', esMapBad: 'حط لينك خريطة صح',
  esMessage: 'كلمة الدعوة', esEnStale: 'السطر الإنجليزي على الكارت ما اتغيّرش:', esEditIt: 'عدّله', esDeleteIt: 'امسحه',
  esEnglish: 'إضافة كلام إنجليزي', esEnglishHint: 'بيظهر تحت الكلام العربي على الكارت وصفحات الدعوة.', esNameEn: '{label} بالإنجليزي', esMessageEn: 'كلمة الدعوة بالإنجليزي',
  esProgramme: 'برنامج المناسبة', esProgrammeMeta: 'اختياري · {n} جاهزة', esProgrammeHint: 'زوّد فقرات المناسبة عشان تظهر لضيوفك في صفحة البرنامج. من غير فقرات، الصفحة مش بتظهر.', esItemTime: 'ساعة الفقرة {n}', esItem: 'الفقرة {n}', esItemEn: 'الفقرة {n} بالإنجليزي', esItemPlaceholder: 'الفقرة', esDeleteItem: 'امسح الفقرة {n}', esAddItem: 'زوّد فقرة',
  esDesign: 'التصميم', esCustom: 'تصميم مخصوص', esChangeDesign: 'غيّر التصميم', esForYou: 'مختارة لمناسبتك', esForYouHint: 'شكل الكارت بس اللي بيتغيّر، والكلام والأسامي بيفضلوا زي ما كتبتهم.', esCardsLabel: 'كروت مختارة',
  esScene: 'الخلفية', esSceneHint: 'لون الخلفية ونقشتها ورا الكارت. الضيف بيشوفها لما يفتح الدعوة.', esScenesLabel: 'خلفيات مختارة', esAll: 'كل الكروت والخلفيات', esOptional: 'اختياري', esCard: 'الكارت',
  esMore: 'تصاميم أكتر', esUploadMusic: 'ارفع مزيكا', esUploadMore: 'المزيكا بتاعتي', esRecordVoice: 'سجّل ترحيب بصوتك', esRecordAgain: 'سجّل رسالة تانية',
  esMotion: 'الحركة', esAnimatedD: 'افتتاحية سينمائية، وظرف بيتختم ويطير بعد الرد.', esStaticD: 'بتفتح على صفحات الدعوة على طول، من غير حركة.',
}, {
  esNames: 'الأسماء', esNamesHint: 'تطلع على البطاقة وفي كل صفحات مناسبتك.', esName: 'الاسم', esSecondName: 'الاسم الثاني', esNameError: 'اكتب {label}',
  esWhen: 'الموعد', esDate: 'التاريخ', esTime: 'الوقت', esWhere: 'المكان', esVenue: 'اسم القاعة أو المكان', esCity: 'المدينة', esMap: 'رابط الخريطة', esMapHint: 'يفتح للضيف زر «الاتجاهات».',
  esDateError: 'اختر تاريخ صحيح', esFutureError: 'اختر تاريخ جاي', esTimeError: 'اختر وقت صحيح', esMapHttps: 'أضف رابط خريطة يبدأ بـ https://', esMapBad: 'أضف رابط خريطة صحيح',
  esMessage: 'كلمة الدعوة', esEnStale: 'السطر الإنجليزي على البطاقة ما تغيّر:', esEditIt: 'عدّله', esDeleteIt: 'احذفه',
  esEnglish: 'إضافة نص إنجليزي', esEnglishHint: 'يطلع تحت النص العربي على البطاقة وصفحات الدعوة.', esNameEn: '{label} بالإنجليزي', esMessageEn: 'كلمة الدعوة بالإنجليزي',
  esProgramme: 'برنامج المناسبة', esProgrammeMeta: 'اختياري · {n} جاهزة', esProgrammeHint: 'أضف فقرات المناسبة عشان تطلع لضيوفك في صفحة البرنامج. بدون فقرات، ما تطلع الصفحة.', esItemTime: 'وقت الفقرة {n}', esItem: 'الفقرة {n}', esItemEn: 'الفقرة {n} بالإنجليزي', esItemPlaceholder: 'الفقرة', esDeleteItem: 'احذف الفقرة {n}', esAddItem: 'أضف فقرة',
  esDesign: 'التصميم', esCustom: 'تصميم مخصّص', esChangeDesign: 'غيّر التصميم', esForYou: 'مختارة لمناسبتك', esForYouHint: 'يتغيّر شكل البطاقة بس، والكلام والأسماء تبقى مثل ما كتبتها.', esCardsLabel: 'بطاقات مختارة',
  esScene: 'الخلفية', esSceneHint: 'لون الخلفية ونقشتها ورا البطاقة. يشوفها الضيف لما يفتح الدعوة.', esScenesLabel: 'خلفيات مختارة', esAll: 'كل البطاقات والخلفيات', esOptional: 'اختياري', esCard: 'البطاقة',
  esMore: 'تصاميم أكثر', esUploadMusic: 'ارفع موسيقى', esUploadMore: 'إدارة موسيقاي', esRecordVoice: 'سجّل ترحيب بصوتك', esRecordAgain: 'سجّل رسالة ثانية',
  esMotion: 'الحركة', esAnimatedD: 'افتتاحية سينمائية، وظرف ينختم ويطير بعد الرد.', esStaticD: 'تفتح على صفحات الدعوة على طول، بدون حركة.',
});
