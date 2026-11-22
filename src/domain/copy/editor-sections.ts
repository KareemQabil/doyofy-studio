/** The editor's content, design and event sections (the motion and audio section belongs to the audio library). */
import { partly } from './group';

export const EDITOR_SECTIONS = partly({
  esNames: 'الأسماء على البطاقة', esNamesHint: 'الأسماء من بيانات المناسبة. عدّلها هنا فقط إن أردت أن تظهر بشكل مختلف.', esName: 'الاسم', esSecondName: 'الاسم الثاني', esEnglish: 'بالإنجليزية', esArabic: 'بالعربية',
  esMessage: 'كلمة الدعوة', esEnStale: 'السطر الإنجليزي على البطاقة لم يتغيّر:', esEditIt: 'عدّله', esDeleteIt: 'احذفه', esHideEnglish: 'إخفاء النصوص الإنجليزية', esShowEnglish: 'النصوص الإنجليزية',
  esProgramme: 'برنامج المناسبة', esProgrammeMeta: 'اختياري · {n} جاهزة', esProgrammeHint: 'يظهر في صفحات الدعوة. يمكنك تعديل الفقرات أو حذفها.', esItemTime: 'وقت الفقرة {n}', esItem: 'الفقرة {n}', esItemPlaceholder: 'الفقرة', esDeleteItem: 'احذف الفقرة {n}', esAddItem: 'أضف فقرة',
  esDesign: 'التصميم', esCustom: 'تصميم مخصّص', esChangeDesign: 'غيّر التصميم', esForYou: 'مختارة لمناسبتك', esForYouHint: 'يتغيّر شكل البطاقة فقط، والنص والأسماء تبقى كما كتبتها.', esCardsLabel: 'بطاقات مختارة',
  esScene: 'الخلفية', esSceneHint: 'لون الخلفية ونقشها خلف البطاقة. يراها الضيف عند فتح الدعوة.', esScenesLabel: 'خلفيات مختارة', esAll: 'كل البطاقات والخلفيات', esOptional: 'اختياري', esCard: 'البطاقة',
  esDateError: 'اختر تاريخًا صحيحًا', esFutureError: 'اختر تاريخًا قادمًا', esTimeError: 'اختر وقتًا صحيحًا', esVenueError: 'اكتب اسم المكان', esCityError: 'اكتب المدينة', esMapHttps: 'أضف رابط خريطة يبدأ بـ https://', esMapBad: 'أضف رابط خريطة صحيحًا', esSizeError: 'عدد الأشخاص من 1 إلى 20',
  esUnified: 'بيانات موحّدة للمناسبة', esUnifiedText: 'تظهر تعديلاتك في المعاينة فورًا. احفظها هنا، أو انشر الدعوة ليُحفظ كل شيء معًا.', esWhen: 'الموعد', esDate: 'التاريخ', esTime: 'الوقت', esWhere: 'المكان', esVenue: 'اسم القاعة أو المكان', esCity: 'المدينة',
  esMap: 'رابط الخريطة', esMapHint: 'يفتح للضيف زر «الاتجاهات».', esGuests: 'الضيوف', esPerInvitation: 'عدد الأشخاص لكل دعوة', esPerInvitationHint: 'الحد الافتراضي للضيوف الجدد، ويمكن تغييره لكل ضيف من قائمة الضيوف.', esSave: 'احفظ بيانات المناسبة', esSaved: 'تم الحفظ',
  esMotion: 'الحركة', esAnimatedD: 'افتتاحية سينمائية، وظرف يُختم ويطير بعد الرد.', esStaticD: 'تفتح مباشرة على البطاقة، بلا حركة.',
}, {
  esNames: 'الأسامي على الكارت', esNamesHint: 'الأسامي من بيانات المناسبة. عدّلها هنا بس لو عايزها تظهر بشكل مختلف.', esSecondName: 'الاسم التاني', esEnglish: 'بالإنجليزي', esArabic: 'بالعربي',
  esEnStale: 'السطر الإنجليزي على الكارت ما اتغيّرش:', esHideEnglish: 'اخفي الكلام الإنجليزي', esShowEnglish: 'الكلام الإنجليزي',
  esProgrammeHint: 'بيظهر في صفحات الدعوة. تقدر تعدّل الفقرات أو تمسحها.', esDeleteItem: 'امسح الفقرة {n}', esAddItem: 'زوّد فقرة',
  esForYouHint: 'شكل الكارت بس اللي بيتغيّر، والكلام والأسامي بيفضلوا زي ما كتبتهم.', esSceneHint: 'لون الخلفية ونقشتها ورا الكارت. الضيف بيشوفها لما يفتح الدعوة.', esAll: 'كل الكروت والخلفيات', esCard: 'الكارت',
  esDateError: 'اختار تاريخ صح', esFutureError: 'اختار تاريخ جاي', esTimeError: 'اختار ساعة صح', esMapHttps: 'حط لينك خريطة بيبدأ بـ https://', esMapBad: 'حط لينك خريطة صح',
  esUnifiedText: 'تعديلاتك بتظهر في المعاينة على طول. احفظها هنا، أو انشر الدعوة وكل حاجة هتتحفظ مع بعض.', esWhen: 'الميعاد', esTime: 'الساعة', esMap: 'لينك الخريطة', esMapHint: 'بيفتح للضيف زرار «الاتجاهات».',
  esPerInvitationHint: 'الحد الافتراضي للضيوف الجداد، وتقدر تغيّره لكل ضيف من قايمة الضيوف.', esSaved: 'اتحفظ',
  esMotion: 'الحركة', esAnimatedD: 'افتتاحية سينمائية، وظرف بيتختم ويطير بعد الرد.', esStaticD: 'بتفتح على الكارت على طول، من غير حركة.',
}, {
  esNamesHint: 'الأسماء من بيانات المناسبة. عدّلها هنا بس إذا تبيها تطلع بشكل مختلف.', esEnStale: 'السطر الإنجليزي على البطاقة ما تغيّر:', esHideEnglish: 'أخفِ النصوص الإنجليزية',
  esProgrammeHint: 'يطلع في صفحات الدعوة. تقدر تعدّل الفقرات أو تحذفها.', esForYouHint: 'يتغيّر شكل البطاقة بس، والكلام والأسماء تبقى مثل ما كتبتها.', esSceneHint: 'لون الخلفية ونقشتها ورا البطاقة. يشوفها الضيف لما يفتح الدعوة.',
  esDateError: 'اختر تاريخ صحيح', esFutureError: 'اختر تاريخ جاي', esTimeError: 'اختر وقت صحيح', esMapBad: 'أضف رابط خريطة صحيح',
  esUnifiedText: 'تعديلاتك تطلع في المعاينة على طول. احفظها هنا، أو انشر الدعوة وينحفظ كل شي مع بعض.', esPerInvitationHint: 'الحد الافتراضي للضيوف الجدد، وتقدر تغيّره لكل ضيف من قائمة الضيوف.', esSaved: 'انحفظ',
  esMotion: 'الحركة', esAnimatedD: 'افتتاحية سينمائية، وظرف ينختم ويطير بعد الرد.', esStaticD: 'تفتح على البطاقة على طول، بدون حركة.',
});
