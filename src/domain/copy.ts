/** The app's voice is a preference; it never rewrites names or authored invitation content. */
import { P, plural, type PluralForms } from './format';
import { partly, type Variants } from './copy/group';
import { HOME, HOME_MORE } from './copy/home';
import { CREATE, CREATE_MORE } from './copy/create';
import { GUESTS } from './copy/guests';
import { GUEST_TOOLS } from './copy/guest-tools';
export type Dialect = 'ar' | 'ar-EG' | 'ar-SA';
export const DIALECTS: Array<{ value: Dialect; label: string }> = [
  { value: 'ar', label: 'العربية المودرن' }, { value: 'ar-EG', label: 'المصري' }, { value: 'ar-SA', label: 'السعودي' },
];
export const parseDialect = (value: unknown): Dialect => value === 'ar-EG' || value === 'ar-SA' ? value : 'ar';
const coreModern = {
  account: 'حسابي', accountSubtitle: 'ملفك الشخصي، وأسلوب اللغة، والصوت والمظهر.', profile: 'الملف الشخصي', name: 'الاسم', email: 'البريد الإلكتروني', saveProfile: 'حفظ الملف', profileSaved: 'تم حفظ ملفك', nameRequired: 'اكتب اسمًا قبل الحفظ.',
  languageStyle: 'أسلوب اللغة', languageHint: 'اختر أسلوب الكتابة الذي يناسبك. أسماء ضيوفك ونصوص دعوتك تبقى كما كتبتها.', languageSaved: 'تم تحديث أسلوب اللغة',
  appearance: 'المظهر', appearanceHint: 'فاتح أو داكن أو حسب جهازك. تصميم دعوتك يبقى كما اخترته.', demoSession: 'جلسة التجربة', demoSessionHint: 'بياناتك محفوظة على هذا الجهاز. يمكنك تجربة المسارات كاملة قبل ربط الخدمات.', logout: 'تسجيل الخروج', login: 'تسجيل الدخول', help: 'دليل ضيوفي', accountOptions: 'خيارات الحساب', resetDemo: 'ابدأ التجربة من جديد',
  roleTitle: 'طريقة عرض الحساب', roleHint: 'جرّب الأدوات المناسبة لكل دور. المنسّق يدير الضيوف والطاولات والاستقبال، والحذف والتصدير والدفع والنشر لصاحب المناسبة. يظهر الطعام لمزوّد الضيافة فقط.', organizer: 'صاحب المناسبة', coordinator: 'المنسّق', caterer: 'مزوّد الضيافة', roleSaved: 'تم تغيير طريقة العرض',
  createEvent: 'إنشاء مناسبة', createTitle: 'مناسبة جديدة', createEssentials: 'اكتب الأسماء والموعد والمكان. يمكنك إكمال التفاصيل لاحقًا.', createContinue: 'متابعة إلى التفاصيل', prepareInvitation: 'جهّز دعوتي',
  back: 'رجوع', next: 'التالي', cancel: 'إلغاء', save: 'حفظ', close: 'إغلاق', retry: 'إعادة المحاولة', done: 'تم', undo: 'تراجع',
  // invitation editor and its guest preview
  editorPreview: 'معاينة كضيف', editorHideTools: 'إخفاء أدوات التعديل', editorZoomIn: 'تقريب', editorZoomOut: 'تصغير', editorBackToEdit: 'العودة للتعديل', previewRestart: 'من البداية',
  templatesTitle: 'تصاميم الدعوة', templateBrowse: 'استعراض التصاميم', templateSwipe: 'اسحب لأعلى للتصميم التالي', templateUse: 'استخدم التصميم', templateShare: 'مشاركة التصميم', previewInvitation: 'معاينة الدعوة',
  // the 3-step creation wizard and the design feed
  wizardOccasion: 'المناسبة', wizardDesign: 'التصميم', wizardDetails: 'التفاصيل', wizardToDesign: 'التالي: التصميم', chooseDesign: 'اختر هذا التصميم', templateFilter: 'الأسلوب', templateShareShort: 'مشاركة', templateWatch: 'شاهدها',
  shareInvitation: 'مشاركة الدعوة', copyLink: 'نسخ الرابط', linkCopied: 'تم نسخ الرابط', bulkSend: 'إرسال جماعي', sendWhatsapp: 'واتساب', sendSms: 'رسالة نصية', simulateSend: 'جرّب الإرسال', shareOptions: 'خيارات المشاركة', manualSent: 'أرسلت الرسالة', openMessage: 'افتح الرسالة الجاهزة',
  upgradeCapacity: 'زيادة سعة الضيوف', paymentDemo: 'تجربة الدفع', continueToPayment: 'متابعة للدفع', confirmDemoPayment: 'تأكيد الدفع التجريبي', cancelUpgrade: 'إلغاء الترقية', changePlan: 'تغيير الباقة', viewReceipt: 'عرض الإيصال', demoNoCharge: 'تجريبي — لا يتم خصم أي مبلغ', confirmReply: 'تأكيد الرد', replySaved: 'تم حفظ ردك في التجربة',
  invitationGreeting: 'السلام عليكم', invitationIntro: 'يسعدنا دعوتكم إلى', invitationOpen: 'افتحوا دعوتكم وأكدوا حضوركم من هنا:', reminderIntro: 'تذكير لطيف بدعوة', reminderReply: 'نتشرف بمعرفة ردكم من هنا:',
  addGuest: 'إضافة ضيف', guestList: 'قائمة الضيوف', tables: 'الطاولات', guests: 'الضيوف', guestsSearch: 'ابحث بالاسم أو رقم الجوال', noGuests: 'لم نجد ضيوفًا بهذه البيانات', pendingReply: 'بانتظار الرد', confirmedReply: 'أكد الحضور', declinedReply: 'اعتذر عن الحضور', moveGuest: 'نقل الضيف', moveGuests: 'نقل الضيوف', exportFile: 'تصدير ملف', exportSelected: 'تصدير المحدد', selectAll: 'تحديد الكل', selection: 'تحديد', tableGesture: 'اسحب الضيف إلى طاولته، أو اختر «نقل»', assignTable: 'اختيار طاولة', guestDetails: 'تفاصيل الضيف',
  // the guest's own pages (always plural; Google's button label is its official wording in every voice)
  guestFastTrack: 'الموعد وتأكيد الحضور', guestSendReply: 'إرسال الرد', guestDemo: 'نسخة تجريبية', guestAddToWallet: 'أضف إلى Google Wallet',
  guestOpen: 'افتحوا الدعوة', guestSealHint: 'اسحبوا الختم للأعلى', guestSealLabel: 'افتحوا الدعوة: اضغطوا على الختم أو اسحبوه للأعلى', guestSkipToDetails: 'الموعد وتأكيد الحضور مباشرة',
  guestAttendQuestion: 'هل ستحضرون؟', guestAccept: 'نعم، سنحضر', guestDecline: 'نعتذر عن الحضور', guestChooseReply: 'اختاروا الحضور أو الاعتذار', guestNameRequired: 'اكتبوا الاسم ليعرف صاحب المناسبة من ردّ.',
  guestConfirmed: 'حضوركم مؤكد', guestDeclined: 'سجّلنا اعتذاركم', guestReplyArrived: 'وصل ردكم', guestEditReply: 'تعديل الرد', guestShowCode: 'اعرضوا الرمز على فريق الاستقبال عند الوصول.',
  guestZoomCode: 'اضغطوا لتكبيره عند الباب', guestCodeTip: 'ارفعوا إضاءة الشاشة إن لزم، واسحبوا لأسفل للرجوع.', guestWatchAgain: 'شاهدوا الدعوة مرة أخرى', guestYourDetails: 'تفاصيل حضوركم',
  autoSeat: 'توزيع تلقائي', autoSeatTitle: 'اقتراح التوزيع', autoSeatHint: 'راجع الاقتراح قبل اعتماده: كل دعوة على طاولة واحدة، وكل جهة على طاولات متجاورة. لن يتغيّر شيء قبل الاعتماد.',
  autoSeatKeep: 'غير الموزعين فقط', autoSeatAll: 'إعادة توزيع الجميع', autoSeatApply: 'اعتمد التوزيع', autoSeatApplied: 'تم اعتماد التوزيع', autoSeatUndo: 'تراجع', autoSeatUndone: 'أعدنا التوزيع كما كان',
  autoSeatExclude: 'استبعد من التوزيع', autoSeatInclude: 'أعده للتوزيع', autoSeatMoveTo: 'انقل إلى طاولة', autoSeatAddTables: 'أضف الطاولات المقترحة', autoSeatNewTable: 'جديدة',
  autoSeatTooBig: 'أكبر من أي طاولة. زِد سعة طاولة لتتسع لهم.', autoSeatNoRoom: 'لا توجد مقاعد كافية.', autoSeatNothing: 'كل الضيوف المؤكدين لهم طاولات. اختر «إعادة توزيع الجميع» لترتيبهم من جديد.', autoSeatUnplaced: 'بلا مكان', autoSeatExcluded: 'مستبعدون من التوزيع', autoSeatNewOnApply: 'تُنشأ مع اعتماد التوزيع فقط.', autoSeatKept: 'موزعون من قبل', autoSeatSuggest: 'نقترح إضافة {tables} بسعة {seats} لكلٍّ منها.',
  // guest list: one primary action per guest, bulk sharing (r1-guests)
  publishFirst: 'انشر الدعوة', addPhone: 'أضف رقمًا', shareWhatsapp: 'شارك عبر واتساب', remindReply: 'ذكّر بالرد', recordArrival: 'سجّل الوصول', removeFromTable: 'إزالة من الطاولة', shareSelected: 'مشاركة المحدد', selectUnsent: 'حدّد من لم تصلهم الدعوة', selectVisible: 'تحديد الظاهر', sentOpenNext: 'أرسلتها، افتح التالي', copyTheirLinks: 'انسخ روابطها معًا', shareUnsent: 'أرسل لمن لم تصلهم الدعوة', remindSelected: 'ذكّر المحددين بالرد', remindSent: 'أرسلت التذكير',
};
const coreEgyptian: Variants<typeof coreModern> = {
  undo: 'رجّعه',
  account: 'حسابي', accountSubtitle: 'بياناتك، وطريقة الكلام، والصوت والشكل.', saveProfile: 'احفظ بياناتي', profileSaved: 'بياناتك اتحفظت', nameRequired: 'اكتب اسمك قبل الحفظ.', languageStyle: 'طريقة الكلام', languageHint: 'اختار الطريقة اللي تناسبك. أسماء الضيوف وكلام دعوتك هيفضلوا زي ما كتبتهم.', languageSaved: 'طريقة الكلام اتغيّرت',
  appearance: 'شكل المنصة', appearanceHint: 'فاتح أو غامق أو زي جهازك. تصميم دعوتك هيفضل زي ما اخترته.', demoSessionHint: 'بياناتك محفوظة على الجهاز ده. جرّب كل الخطوات قبل ربط الخدمات.', roleHint: 'جرّب الأدوات حسب كل دور. الأكل بيظهر لمزوّد الضيافة بس.', roleSaved: 'طريقة العرض اتغيّرت',
  editorPreview: 'شوفها كضيف', editorHideTools: 'اخفي أدوات التعديل', editorZoomIn: 'قرّب', editorZoomOut: 'بعّد', editorBackToEdit: 'ارجع للتعديل', previewRestart: 'من الأول',
  createEvent: 'اعمل مناسبة', createTitle: 'مناسبة جديدة', createEssentials: 'اكتب الأسماء والميعاد والمكان. تقدر تكمّل الباقي بعدين.', createContinue: 'كمّل التفاصيل', prepareInvitation: 'جهّز دعوتي', next: 'كمّل', cancel: 'إلغاء', save: 'احفظ', close: 'اقفل', retry: 'جرّب تاني',
  templatesTitle: 'تصاميم الدعوة', templateBrowse: 'اتفرّج على التصاميم', templateSwipe: 'اسحب لفوق للتصميم اللي بعده', templateUse: 'استخدم التصميم ده', templateShare: 'شارك التصميم', previewInvitation: 'شوف الدعوة', shareInvitation: 'شارك الدعوة', copyLink: 'انسخ اللينك', linkCopied: 'اللينك اتنسخ', bulkSend: 'ابعت للمحددين', simulateSend: 'جرّب الإرسال', shareOptions: 'طرق المشاركة', manualSent: 'بعتّ الرسالة', openMessage: 'افتح الرسالة الجاهزة', upgradeCapacity: 'زوّد عدد الضيوف', continueToPayment: 'كمّل للدفع', confirmDemoPayment: 'أكّد الدفع التجريبي', cancelUpgrade: 'الغي الترقية', changePlan: 'غيّر الباقة', viewReceipt: 'شوف الإيصال', demoNoCharge: 'تجريبي — مفيش أي فلوس هتتخصم', confirmReply: 'أكّد ردك', replySaved: 'ردك اتحفظ في التجربة',
  wizardToDesign: 'كمّل للتصميم', chooseDesign: 'اختار التصميم ده', templateShareShort: 'شارك', templateWatch: 'شوفها',
  invitationGreeting: 'أهلًا', invitationIntro: 'مستنيينك في', invitationOpen: 'افتح دعوتك وأكّد حضورك من هنا:', reminderIntro: 'بنفكّرك بدعوة', reminderReply: 'قول لنا ردك من هنا:',
  addGuest: 'ضيف جديد', guestsSearch: 'دوّر بالاسم أو رقم الموبايل', noGuests: 'مفيش ضيوف بالبيانات دي', pendingReply: 'لسه ما ردّش', confirmedReply: 'أكد حضوره', declinedReply: 'اعتذر عن الحضور', moveGuest: 'انقل الضيف', moveGuests: 'انقل الضيوف', exportFile: 'نزّل ملف', exportSelected: 'نزّل المحدد', selectAll: 'حدد الكل', selection: 'حدد', tableGesture: 'اسحب الضيف لترابيزته، أو اختار «نقل»', assignTable: 'اختار ترابيزة', guestDetails: 'تفاصيل الضيف', tables: 'الترابيزات',
  guestFastTrack: 'الميعاد وتأكيد الحضور', guestSendReply: 'ابعتوا الرد',
  guestSealHint: 'اسحبوا الختم لفوق', guestSealLabel: 'افتحوا الدعوة: دوسوا على الختم أو اسحبوه لفوق', guestSkipToDetails: 'الميعاد وتأكيد الحضور على طول',
  guestAttendQuestion: 'هتشرّفونا؟', guestAccept: 'هنيجي إن شاء الله', guestDecline: 'مش هنقدر نيجي', guestChooseReply: 'اختاروا هتيجوا ولا لأ', guestNameRequired: 'اكتبوا اسمكم عشان صاحب المناسبة يعرف مين اللي ردّ.',
  guestConfirmed: 'حضوركم اتأكد', guestDeclined: 'اعتذاركم وصلنا', guestReplyArrived: 'ردكم وصل', guestEditReply: 'عدّلوا ردكم', guestShowCode: 'ورّوا الكود لفريق الاستقبال أول ما توصلوا.',
  guestZoomCode: 'دوسوا عشان يكبر عند الباب', guestCodeTip: 'علّوا إضاءة الشاشة لو محتاجين، واسحبوا لتحت عشان ترجعوا.', guestWatchAgain: 'شوفوا الدعوة تاني',
  autoSeat: 'وزّع أوتوماتيك', autoSeatTitle: 'اقتراح توزيع الترابيزات', autoSeatHint: 'راجع الاقتراح قبل ما تعتمده: كل عيلة على ترابيزة واحدة، وكل جهة جنب بعض. مفيش حاجة هتتغيّر قبل الاعتماد.',
  autoSeatKeep: 'اللي لسه من غير ترابيزة', autoSeatAll: 'وزّع الكل من الأول', autoSeatApply: 'اعتمد التوزيع', autoSeatApplied: 'التوزيع اتعتمد', autoSeatUndo: 'رجّعه زي ما كان', autoSeatUndone: 'رجّعنا التوزيع زي ما كان',
  autoSeatExclude: 'شيله من التوزيع', autoSeatInclude: 'رجّعه للتوزيع', autoSeatMoveTo: 'انقله لترابيزة', autoSeatAddTables: 'زوّد الترابيزات المقترحة', autoSeatNewTable: 'جديدة',
  autoSeatTooBig: 'أكبر من أي ترابيزة. كبّر سعة ترابيزة عشان تساعهم.', autoSeatNoRoom: 'مفيش أماكن كفاية.', autoSeatNothing: 'كل الضيوف اللي أكدوا ليهم ترابيزات. اختار «وزّع الكل من الأول» لو عايز ترتبهم من جديد.', autoSeatUnplaced: 'من غير مكان', autoSeatExcluded: 'اللي شلتهم من التوزيع', autoSeatNewOnApply: 'هتتعمل لما تعتمد التوزيع بس.', autoSeatKept: 'متوزعين من قبل', autoSeatSuggest: 'نقترح تزوّد {tables}، كل واحدة {seats}.',
  addPhone: 'حطّ رقم', shareWhatsapp: 'ابعت على واتساب', remindReply: 'فكّرهم بالرد', removeFromTable: 'شيلهم من الترابيزة', shareSelected: 'ابعت للمحددين', selectUnsent: 'حدد اللي لسه موصلتلهمش الدعوة', selectVisible: 'حدد الظاهر', sentOpenNext: 'بعتّها، افتح اللي بعدها', copyTheirLinks: 'انسخ لينكاتهم مع بعض', shareUnsent: 'ابعت للي لسه موصلتلهمش', remindSelected: 'فكّر المحددين بالرد', remindSent: 'بعتّ التذكير',
};
const coreSaudi: Variants<typeof coreModern> = {
  accountSubtitle: 'بياناتك، وأسلوب الكلام، والصوت والمظهر.', saveProfile: 'احفظ بياناتي', profileSaved: 'تم حفظ بياناتك', nameRequired: 'اكتب اسمك قبل الحفظ.', languageStyle: 'أسلوب الكلام', languageHint: 'اختر الأسلوب اللي يناسبك. أسماء ضيوفك وكلام دعوتك تبقى مثل ما كتبتها.', appearanceHint: 'فاتح أو داكن أو حسب جهازك. تصميم دعوتك يبقى مثل ما اخترته.', demoSessionHint: 'بياناتك محفوظة على هالجهاز. جرّب كل الخطوات قبل ربط الخدمات.', roleHint: 'جرّب الأدوات حسب كل دور. الأكل يظهر لمزوّد الضيافة فقط.',
  editorPreview: 'شوفها كضيف', editorHideTools: 'أخفِ أدوات التعديل', editorZoomIn: 'قرّب', editorZoomOut: 'بعّد', editorBackToEdit: 'ارجع للتعديل',
  createEvent: 'أنشئ مناسبة', createEssentials: 'اكتب الأسماء والموعد والمكان. تقدر تكمّل الباقي بعدين.', createContinue: 'كمّل التفاصيل', prepareInvitation: 'جهّز دعوتي', next: 'كمّل', save: 'احفظ', retry: 'جرّب مرة ثانية',
  templateBrowse: 'تصفّح التصاميم', templateSwipe: 'اسحب لفوق للتصميم التالي', templateUse: 'استخدم هالتصميم', templateShare: 'شارك التصميم', previewInvitation: 'شوف الدعوة', shareInvitation: 'شارك الدعوة', copyLink: 'انسخ الرابط', bulkSend: 'أرسل للمحددين', shareOptions: 'طرق المشاركة', manualSent: 'أرسلت الرسالة', upgradeCapacity: 'زِد سعة الضيوف', continueToPayment: 'كمّل للدفع', confirmDemoPayment: 'أكّد الدفع التجريبي', cancelUpgrade: 'ألغِ الترقية', changePlan: 'غيّر الباقة', viewReceipt: 'شوف الإيصال', demoNoCharge: 'تجريبي — ما راح ينخصم أي مبلغ', confirmReply: 'أكّد ردّك', replySaved: 'حفظنا ردّك في التجربة',
  wizardToDesign: 'كمّل للتصميم', chooseDesign: 'اختر هالتصميم', templateShareShort: 'شارك', templateWatch: 'شوفها',
  invitationGreeting: 'يا هلا', invitationIntro: 'نتشرّف بحضورك في', invitationOpen: 'افتح دعوتك وأكّد حضورك من هنا:', reminderIntro: 'نذكّرك بدعوة', reminderReply: 'يسعدنا نعرف ردّك من هنا:',
  addGuest: 'أضف ضيف', guestsSearch: 'ابحث بالاسم أو رقم الجوال', noGuests: 'ما لقينا ضيوف بهالبيانات', pendingReply: 'بانتظار الرد', confirmedReply: 'أكد حضوره', moveGuest: 'انقل الضيف', moveGuests: 'انقل الضيوف', exportFile: 'نزّل ملف', exportSelected: 'نزّل المحدد', selectAll: 'حدّد الكل', tableGesture: 'اسحب الضيف لطاولته، أو اختر «نقل»', assignTable: 'اختر طاولة',
  guestSendReply: 'أرسلوا الرد',
  guestSealHint: 'اسحبوا الختم لفوق', guestSealLabel: 'افتحوا الدعوة: اضغطوا على الختم أو اسحبوه لفوق', guestSkipToDetails: 'الموعد وتأكيد الحضور على طول',
  guestAttendQuestion: 'بتشرّفونا؟', guestAccept: 'بنحضر بإذن الله', guestDecline: 'نعتذر ما نقدر نحضر', guestChooseReply: 'اختاروا بتحضرون أو لا', guestNameRequired: 'اكتبوا اسمكم عشان صاحب المناسبة يعرف مين ردّ.',
  guestConfirmed: 'تم تأكيد حضوركم', guestDeclined: 'وصلنا اعتذاركم', guestReplyArrived: 'وصلنا ردّكم', guestEditReply: 'عدّلوا ردّكم', guestShowCode: 'اعرضوا الرمز على فريق الاستقبال أول ما توصلون.',
  guestZoomCode: 'اضغطوا عشان يكبر عند الباب', guestCodeTip: 'ارفعوا إضاءة الشاشة إذا احتجتوا، واسحبوا لتحت عشان ترجعون.', guestWatchAgain: 'شوفوا الدعوة مرة ثانية',
  autoSeat: 'وزّع تلقائيًا', autoSeatTitle: 'اقتراح توزيع الطاولات', autoSeatHint: 'راجع الاقتراح قبل لا تعتمده: كل عائلة على طاولة وحدة، وكل جهة على طاولات جنب بعض. ما يتغيّر شي قبل الاعتماد.',
  autoSeatKeep: 'اللي ما لهم طاولة', autoSeatAll: 'وزّع الكل من جديد', autoSeatApply: 'اعتمد التوزيع', autoSeatApplied: 'تم اعتماد التوزيع', autoSeatUndo: 'تراجع', autoSeatUndone: 'رجّعنا التوزيع مثل ما كان',
  autoSeatExclude: 'استبعده من التوزيع', autoSeatInclude: 'رجّعه للتوزيع', autoSeatMoveTo: 'انقله لطاولة', autoSeatAddTables: 'أضف الطاولات المقترحة',
  autoSeatTooBig: 'أكبر من أي طاولة. زِد سعة طاولة عشان تكفيهم.', autoSeatNoRoom: 'ما فيه مقاعد كافية.', autoSeatNothing: 'كل الضيوف المؤكدين لهم طاولات. اختر «وزّع الكل من جديد» لو تبي ترتبهم من جديد.', autoSeatUnplaced: 'بدون مكان', autoSeatExcluded: 'المستبعدين من التوزيع', autoSeatNewOnApply: 'تنضاف مع اعتماد التوزيع فقط.', autoSeatSuggest: 'نقترح تضيف {tables}، كل وحدة {seats}.',
  addPhone: 'أضف رقم', shareWhatsapp: 'أرسل على واتساب', remindReply: 'ذكّرهم بالرد', removeFromTable: 'شيلهم من الطاولة', shareSelected: 'أرسل للمحددين', selectUnsent: 'حدّد اللي ما وصلتهم الدعوة', selectVisible: 'حدّد الظاهر', sentOpenNext: 'أرسلتها، افتح اللي بعدها', copyTheirLinks: 'انسخ روابطهم مع بعض', shareUnsent: 'أرسل للي ما وصلتهم', remindSelected: 'ذكّر المحددين بالرد', remindSent: 'أرسلت التذكير',
};
const CORE = partly(coreModern, coreEgyptian, coreSaudi);

/**
 * Every group of strings, by feature. A group's keys are unique across the whole dictionary (a unit test checks);
 * `voiced` groups spell every key in every voice, `partly` groups fall back to modern Arabic (see copy/group.ts).
 */
export const COPY_GROUPS = {
  core: CORE, home: HOME, homeMore: HOME_MORE, create: CREATE, createMore: CREATE_MORE, guests: GUESTS, guestTools: GUEST_TOOLS,
} as const;

const modern = {
  ...CORE.modern, ...HOME.modern, ...HOME_MORE.modern, ...CREATE.modern, ...CREATE_MORE.modern, ...GUESTS.modern, ...GUEST_TOOLS.modern,
};
export type CopyKey = keyof typeof modern;
export type Copy = { readonly [K in CopyKey]: string };

const merged = (dialect: 'ar-EG' | 'ar-SA'): Copy => Object.assign({}, modern, ...Object.values(COPY_GROUPS).map((g) => g[dialect]));
const dictionaries: Record<Dialect, Copy> = { ar: modern, 'ar-EG': merged('ar-EG'), 'ar-SA': merged('ar-SA') };
export function copyFor(dialect: Dialect): Copy { return dictionaries[parseDialect(dialect)]; }

/** «نقترح إضافة {tables}» — fills named slots; an unknown slot stays visible so a missing value is caught in review */
export function fill(template: string, vars?: Readonly<Record<string, string | number>>): string {
  return vars ? template.replace(/\{(\w+)\}/g, (all, k: string) => (k in vars ? String(vars[k]) : all)) : template;
}

/**
 * Counted nouns in each voice. Modern Arabic keeps the classical forms (domain/format P); the dialects use the
 * spoken dual and the bare noun after numbers («ضيفين»، «15 ضيف»), and Egyptian says «ترابيزة» and «كرسي».
 */
export type Noun = 'guest' | 'person' | 'invitation' | 'seat' | 'table';
const SPOKEN: Record<'ar-EG' | 'ar-SA', Record<Noun, PluralForms>> = {
  'ar-EG': {
    guest: { zero: 'مفيش ضيوف', one: 'ضيف واحد', two: 'ضيفين', few: '# ضيوف', many: '# ضيف', other: '# ضيف' },
    person: { zero: 'مفيش حد', one: 'شخص واحد', two: 'شخصين', few: '# أشخاص', many: '# شخص', other: '# شخص' },
    invitation: { zero: 'مفيش دعوات', one: 'دعوة واحدة', two: 'دعوتين', few: '# دعوات', many: '# دعوة', other: '# دعوة' },
    seat: { zero: 'مفيش كراسي', one: 'كرسي واحد', two: 'كرسيين', few: '# كراسي', many: '# كرسي', other: '# كرسي' },
    table: { zero: 'مفيش ترابيزات', one: 'ترابيزة واحدة', two: 'ترابيزتين', few: '# ترابيزات', many: '# ترابيزة', other: '# ترابيزة' },
  },
  'ar-SA': {
    guest: { zero: 'ما فيه ضيوف', one: 'ضيف واحد', two: 'ضيفين', few: '# ضيوف', many: '# ضيف', other: '# ضيف' },
    person: { zero: 'ما فيه أحد', one: 'شخص واحد', two: 'شخصين', few: '# أشخاص', many: '# شخص', other: '# شخص' },
    invitation: { zero: 'ما فيه دعوات', one: 'دعوة وحدة', two: 'دعوتين', few: '# دعوات', many: '# دعوة', other: '# دعوة' },
    seat: { zero: 'ما فيه مقاعد', one: 'مقعد واحد', two: 'مقعدين', few: '# مقاعد', many: '# مقعد', other: '# مقعد' },
    table: { zero: 'ما فيه طاولات', one: 'طاولة وحدة', two: 'طاولتين', few: '# طاولات', many: '# طاولة', other: '# طاولة' },
  },
};
export const nounForms = (dialect: Dialect, noun: Noun): PluralForms => (dialect === 'ar' ? P[noun] : SPOKEN[dialect][noun]);
/** «3 ضيوف» in the voice; `oblique` gives the classical «ضيفين» after a preposition (the dialects always say it) */
export const countOf = (dialect: Dialect, n: number, noun: Noun, oblique = false): string => plural(n, nounForms(parseDialect(dialect), noun), { oblique });
