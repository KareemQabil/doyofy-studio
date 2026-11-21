/** The app's voice is a preference; it never rewrites names or authored invitation content. */
export type Dialect = 'ar' | 'ar-EG' | 'ar-SA';
export const DIALECTS: Array<{ value: Dialect; label: string }> = [
  { value: 'ar', label: 'العربية المودرن' }, { value: 'ar-EG', label: 'المصري' }, { value: 'ar-SA', label: 'السعودي' },
];
export const parseDialect = (value: unknown): Dialect => value === 'ar-EG' || value === 'ar-SA' ? value : 'ar';
const modern = {
  account: 'حسابي', accountSubtitle: 'ملفك الشخصي، وأسلوب اللغة، والصوت والمظهر.', profile: 'الملف الشخصي', name: 'الاسم', email: 'البريد الإلكتروني', saveProfile: 'حفظ الملف', profileSaved: 'تم حفظ ملفك', nameRequired: 'اكتب اسمًا قبل الحفظ.',
  languageStyle: 'أسلوب اللغة', languageHint: 'اختر أسلوب الكتابة الذي يناسبك. أسماء ضيوفك ونصوص دعوتك تبقى كما كتبتها.', languageSaved: 'تم تحديث أسلوب اللغة',
  appearance: 'المظهر', appearanceHint: 'فاتح أو داكن أو حسب جهازك. تصميم دعوتك يبقى كما اخترته.', demoSession: 'جلسة التجربة', demoSessionHint: 'بياناتك محفوظة على هذا الجهاز. يمكنك تجربة المسارات كاملة قبل ربط الخدمات.', logout: 'تسجيل الخروج', login: 'تسجيل الدخول', help: 'دليل ضيوفي', accountOptions: 'خيارات الحساب', resetDemo: 'ابدأ التجربة من جديد',
  roleTitle: 'طريقة عرض الحساب', roleHint: 'جرّب الأدوات المناسبة لكل دور. يظهر الطعام لمزوّد الضيافة فقط.', organizer: 'صاحب المناسبة', coordinator: 'المنظّم', caterer: 'مزوّد الضيافة', roleSaved: 'تم تغيير طريقة العرض',
  createEvent: 'إنشاء مناسبة', createTitle: 'مناسبة جديدة', createEssentials: 'اكتب الأسماء والموعد والمكان. يمكنك إكمال التفاصيل لاحقًا.', createContinue: 'متابعة إلى التفاصيل', prepareInvitation: 'جهّز دعوتي',
  back: 'رجوع', next: 'التالي', cancel: 'إلغاء', save: 'حفظ', close: 'إغلاق', retry: 'إعادة المحاولة', done: 'تم',
  templatesTitle: 'تصاميم الدعوة', templateBrowse: 'استعراض التصاميم', templateSwipe: 'اسحب لأعلى للتصميم التالي', templateUse: 'استخدم التصميم', templateShare: 'مشاركة التصميم', previewInvitation: 'معاينة الدعوة',
  shareInvitation: 'مشاركة الدعوة', copyLink: 'نسخ الرابط', linkCopied: 'تم نسخ الرابط', bulkSend: 'إرسال جماعي', sendWhatsapp: 'واتساب', sendSms: 'رسالة نصية', simulateSend: 'جرّب الإرسال', shareOptions: 'خيارات المشاركة', manualSent: 'أرسلت الرسالة', openMessage: 'افتح الرسالة الجاهزة',
  upgradeCapacity: 'زيادة سعة الضيوف', paymentDemo: 'تجربة الدفع', confirmReply: 'تأكيد الرد', replySaved: 'تم حفظ ردك في التجربة',
  invitationGreeting: 'السلام عليكم', invitationIntro: 'يسعدنا دعوتكم إلى', invitationOpen: 'افتحوا دعوتكم وأكدوا حضوركم من هنا:', reminderIntro: 'تذكير لطيف بدعوة', reminderReply: 'نتشرف بمعرفة ردكم من هنا:',
  addGuest: 'إضافة ضيف', guestList: 'قائمة الضيوف', tables: 'الطاولات', guests: 'الضيوف', guestsSearch: 'ابحث بالاسم أو رقم الجوال', noGuests: 'لم نجد ضيوفًا بهذه البيانات', pendingReply: 'بانتظار الرد', confirmedReply: 'أكد الحضور', declinedReply: 'اعتذر عن الحضور', moveGuest: 'نقل الضيف', moveGuests: 'نقل الضيوف', exportFile: 'تصدير ملف', exportSelected: 'تصدير المحدد', selectAll: 'تحديد الكل', selection: 'تحديد', tableGesture: 'اسحب الضيف إلى طاولته، أو اختر «نقل»', assignTable: 'اختيار طاولة', guestDetails: 'تفاصيل الضيف',
} as const;
export type CopyKey = keyof typeof modern;
export type Copy = { readonly [K in CopyKey]: string };
const egyptian: Partial<Copy> = {
  account: 'حسابي', accountSubtitle: 'بياناتك، وطريقة الكلام، والصوت والشكل.', saveProfile: 'احفظ بياناتي', profileSaved: 'بياناتك اتحفظت', nameRequired: 'اكتب اسمك قبل الحفظ.', languageStyle: 'طريقة الكلام', languageHint: 'اختار الطريقة اللي تناسبك. أسماء الضيوف وكلام دعوتك هيفضلوا زي ما كتبتهم.', languageSaved: 'طريقة الكلام اتغيّرت',
  appearance: 'شكل المنصة', appearanceHint: 'فاتح أو غامق أو زي جهازك. تصميم دعوتك هيفضل زي ما اخترته.', demoSessionHint: 'بياناتك محفوظة على الجهاز ده. جرّب كل الخطوات قبل ربط الخدمات.', roleHint: 'جرّب الأدوات حسب كل دور. الأكل بيظهر لمزوّد الضيافة بس.', roleSaved: 'طريقة العرض اتغيّرت',
  createEvent: 'اعمل مناسبة', createTitle: 'مناسبة جديدة', createEssentials: 'اكتب الأسماء والميعاد والمكان. تقدر تكمّل الباقي بعدين.', createContinue: 'كمّل التفاصيل', prepareInvitation: 'جهّز دعوتي', next: 'كمّل', cancel: 'إلغاء', save: 'احفظ', close: 'اقفل', retry: 'جرّب تاني',
  templatesTitle: 'تصاميم الدعوة', templateBrowse: 'اتفرّج على التصاميم', templateSwipe: 'اسحب لفوق للتصميم اللي بعده', templateUse: 'استخدم التصميم ده', templateShare: 'شارك التصميم', previewInvitation: 'شوف الدعوة', shareInvitation: 'شارك الدعوة', copyLink: 'انسخ اللينك', linkCopied: 'اللينك اتنسخ', bulkSend: 'ابعت للمحددين', sendSms: 'رسالة SMS', simulateSend: 'جرّب الإرسال', shareOptions: 'طرق المشاركة', manualSent: 'بعتّ الرسالة', openMessage: 'افتح الرسالة الجاهزة', upgradeCapacity: 'زوّد عدد الضيوف', confirmReply: 'أكّد ردك', replySaved: 'ردك اتحفظ في التجربة',
  invitationGreeting: 'أهلًا', invitationIntro: 'مستنيينك في', invitationOpen: 'افتح دعوتك وأكّد حضورك من هنا:', reminderIntro: 'بنفكّرك بدعوة', reminderReply: 'قول لنا ردك من هنا:',
  addGuest: 'ضيف جديد', guestsSearch: 'دوّر بالاسم أو رقم الموبايل', noGuests: 'مفيش ضيوف بالبيانات دي', pendingReply: 'لسه مردّش', confirmedReply: 'أكد حضوره', declinedReply: 'اعتذر عن الحضور', moveGuest: 'انقل الضيف', moveGuests: 'انقل الضيوف', exportFile: 'نزّل ملف', exportSelected: 'نزّل المحدد', selectAll: 'حدد الكل', selection: 'حدد', tableGesture: 'اسحب الضيف لترابيزته، أو اختار «نقل»', assignTable: 'اختار ترابيزة', guestDetails: 'تفاصيل الضيف', tables: 'الترابيزات',
};
const saudi: Partial<Copy> = {
  accountSubtitle: 'بياناتك، وأسلوب الكلام، والصوت والمظهر.', saveProfile: 'احفظ بياناتي', profileSaved: 'تم حفظ بياناتك', nameRequired: 'اكتب اسمك قبل الحفظ.', languageStyle: 'أسلوب الكلام', languageHint: 'اختر الأسلوب اللي يناسبك. أسماء ضيوفك وكلام دعوتك تبقى مثل ما كتبتها.', appearanceHint: 'فاتح أو داكن أو حسب جهازك. تصميم دعوتك يبقى مثل ما اخترته.', demoSessionHint: 'بياناتك محفوظة على هالجهاز. جرّب كل الخطوات قبل ربط الخدمات.', roleHint: 'جرّب الأدوات حسب كل دور. الأكل يظهر لمزوّد الضيافة فقط.',
  createEvent: 'أنشئ مناسبة', createEssentials: 'اكتب الأسماء والموعد والمكان. تقدر تكمّل الباقي بعدين.', createContinue: 'كمّل التفاصيل', prepareInvitation: 'جهّز دعوتي', next: 'كمّل', save: 'احفظ', retry: 'جرّب مرة ثانية',
  templateBrowse: 'تصفّح التصاميم', templateSwipe: 'اسحب لفوق للتصميم التالي', templateUse: 'استخدم هالتصميم', templateShare: 'شارك التصميم', previewInvitation: 'شوف الدعوة', shareInvitation: 'شارك الدعوة', copyLink: 'انسخ الرابط', bulkSend: 'أرسل للمحددين', shareOptions: 'طرق المشاركة', manualSent: 'أرسلت الرسالة', upgradeCapacity: 'زِد سعة الضيوف', confirmReply: 'أكّد ردّك', replySaved: 'حفظنا ردّك في التجربة',
  invitationGreeting: 'يا هلا', invitationIntro: 'نتشرّف بحضورك في', invitationOpen: 'افتح دعوتك وأكّد حضورك من هنا:', reminderIntro: 'نذكّرك بدعوة', reminderReply: 'يسعدنا نعرف ردّك من هنا:',
  addGuest: 'أضف ضيف', guestsSearch: 'ابحث بالاسم أو رقم الجوال', noGuests: 'ما لقينا ضيوف بهالبيانات', pendingReply: 'بانتظار الرد', confirmedReply: 'أكد حضوره', moveGuest: 'انقل الضيف', moveGuests: 'انقل الضيوف', exportFile: 'نزّل ملف', exportSelected: 'نزّل المحدد', selectAll: 'حدّد الكل', tableGesture: 'اسحب الضيف لطاولته، أو اختر «نقل»', assignTable: 'اختر طاولة',
};
const dictionaries: Record<Dialect, Copy> = { ar: modern, 'ar-EG': { ...modern, ...egyptian }, 'ar-SA': { ...modern, ...saudi } };
export function copyFor(dialect: Dialect): Copy { return dictionaries[parseDialect(dialect)]; }
