/** Event settings (details, date, venue, replies, archive). */
import { partly } from './group';

export const SETTINGS = partly({
  setLeave: 'لم تحفظ تغييرات المناسبة. هل تريد المغادرة دون حفظها؟', setSaved: 'تم حفظ تفاصيل المناسبة', setArchived: 'أرشفنا المناسبة، ورابط الدعوة لم يعد يعمل.', setRestored: 'أعدنا المناسبة',
  setTitle: 'تفاصيل المناسبة', setSub: 'بيانات المناسبة تظهر في الدعوة تلقائيًا.', setNotSaved: 'لم تُحفظ التفاصيل', setBasics: 'أساسيات المناسبة', setType: 'نوع المناسبة', setEventTitle: 'عنوان المناسبة', setEventTitleHint: 'يظهر في رأس الصفحات والرسائل',
  setFirstName: 'الاسم الأول', setHost: 'صاحب المناسبة', setRequired: 'مطلوب', setSecondName: 'الاسم الثاني', setEnglish: 'بالإنجليزية', setWhen: 'الموعد', setDate: 'التاريخ', setTime: 'الوقت', setZone: 'المنطقة الزمنية', setDuration: 'المدة (ساعات)',
  setWhere: 'المكان', setVenue: 'القاعة أو المكان', setCity: 'المدينة', setVenueEn: 'اسم المكان بالإنجليزية', setCityEn: 'المدينة بالإنجليزية', setMap: 'رابط الموقع على الخريطة', setMapHttps: 'يجب أن يبدأ الرابط بـ https://',
  setMapHint: 'انسخه من خرائط Google: «مشاركة» ← «نسخ الرابط». بدونه نبحث عن اسم القاعة.', setReplies: 'الردود والضيوف', setDefaultSize: 'العدد المسموح الافتراضي لكل دعوة جديدة', setDefaultSizeHint: 'يمكنك تغيير العدد لكل ضيف على حدة، ولا يستطيع الضيف الرد بعدد أكبر من المسموح.',
  setShowTable: 'إظهار الطاولة للضيف', setShowTableHint: 'يرى الضيف رقم طاولته في صفحة دعوته بعد التأكيد', setGeneral: 'رابط عام بلا اسم', setGeneralHint: 'رابط واحد للمجموعات، والردود منه تحتاج مطابقتك مع القائمة',
  setSaveRegion: 'حفظ التغييرات', setUnsaved: 'لديك تغييرات غير محفوظة', setDiscard: 'تجاهل', setSaveChanges: 'حفظ التغييرات', setInvitation: 'الدعوة', setManageInvitation: 'إدارة الدعوة',
  setArchivedTitle: 'مؤرشفة', setArchive: 'أرشفة المناسبة', setArchivedText: 'المناسبة مؤرشفة: لا تظهر في القائمة الرئيسية ورابط الدعوة لا يعمل.', setArchiveText: 'بعد انتهاء المناسبة: تُخفى من القائمة ويتوقف رابط الدعوة، ويمكنك إعادتها لاحقًا.',
  setRestore: 'إعادة المناسبة', setArchiveShort: 'أرشفة', setOwnerOnly: 'الأرشفة متاحة لصاحب المناسبة فقط.', setStateFailed: 'لم تتغيّر حالة المناسبة', setRestoreQ: 'إعادة المناسبة؟', setArchiveQ: 'أرشفة المناسبة؟',
  setRestoreBody: 'ستظهر في القائمة ويعمل رابط الدعوة من جديد.', setArchiveBody: 'سيتوقف رابط الدعوة عن العمل للضيوف، والبيانات تبقى محفوظة.', setRestoreShort: 'إعادة', setCapacity: 'سعة الضيوف والمدفوعات',
}, {
  setLeave: 'تغييرات المناسبة لسه ما اتحفظتش. عايز تخرج من غير حفظ؟', setSaved: 'تفاصيل المناسبة اتحفظت', setArchived: 'أرشفنا المناسبة، ولينك الدعوة مبقاش شغال.', setRestored: 'رجّعنا المناسبة',
  setSub: 'بيانات المناسبة بتظهر في الدعوة لوحدها.', setNotSaved: 'التفاصيل ما اتحفظتش', setRequired: 'لازم', setEnglish: 'بالإنجليزي', setWhen: 'الميعاد', setTime: 'الساعة',
  setShowTable: 'وريّ الضيف ترابيزته', setShowTableHint: 'الضيف هيشوف رقم ترابيزته في صفحة دعوته بعد ما يأكد', setGeneral: 'لينك عام من غير اسم', setGeneralHint: 'لينك واحد للمجموعات، والردود منه محتاجة تطابقها مع القايمة',
  setUnsaved: 'عندك تغييرات لسه ما اتحفظتش', setDiscard: 'سيبك منها', setSaveChanges: 'احفظ التغييرات', setManageInvitation: 'روح للدعوة', setRestore: 'رجّع المناسبة', setArchiveShort: 'أرشفة',
  setOwnerOnly: 'الأرشفة لصاحب المناسبة بس.', setRestoreQ: 'ترجّع المناسبة؟', setArchiveQ: 'تأرشف المناسبة؟', setRestoreShort: 'رجّعها',
}, {
  setLeave: 'تغييرات المناسبة ما انحفظت. تبي تطلع بدون حفظ؟', setSaved: 'حفظنا تفاصيل المناسبة', setArchived: 'أرشفنا المناسبة، ورابط الدعوة ما عاد يشتغل.', setRestored: 'رجّعنا المناسبة',
  setSub: 'بيانات المناسبة تطلع في الدعوة تلقائيًا.', setNotSaved: 'ما انحفظت التفاصيل',
  setShowTable: 'اعرض الطاولة للضيف', setShowTableHint: 'يشوف الضيف رقم طاولته في صفحة دعوته بعد ما يأكد', setGeneral: 'رابط عام بدون اسم', setGeneralHint: 'رابط واحد للمجموعات، والردود منه تحتاج تطابقها مع القائمة',
  setUnsaved: 'عندك تغييرات ما انحفظت', setDiscard: 'تجاهل', setSaveChanges: 'احفظ التغييرات', setManageInvitation: 'روح للدعوة', setRestore: 'رجّع المناسبة',
  setOwnerOnly: 'الأرشفة لصاحب المناسبة بس.', setRestoreQ: 'ترجّع المناسبة؟', setArchiveQ: 'تأرشف المناسبة؟', setRestoreShort: 'رجّعها',
});
