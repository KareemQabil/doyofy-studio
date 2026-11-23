/** The app's voice is a preference; it never rewrites names or authored invitation content. */
import { P, plural, type PluralForms } from './format';
import { partly, type Variants } from './copy/group';
import { HOME, HOME_MORE } from './copy/home';
import { CREATE, CREATE_MORE } from './copy/create';
import { GUESTS } from './copy/guests';
import { GUEST_TOOLS } from './copy/guest-tools';
import { SEATING } from './copy/seating';
import { GUEST } from './copy/guest';
import { ENGINE } from './copy/engine';
import { EDITOR } from './copy/editor';
import { EDITOR_SECTIONS } from './copy/editor-sections';
import { SETTINGS } from './copy/settings';
import { REPLIES } from './copy/replies';
import { BILLING } from './copy/billing';
import { GATE } from './copy/gate';
import { IMPORT } from './copy/import';
import { EXPERIENCE_SETTINGS } from './copy/experience-settings';
import { AUTH } from './copy/auth';
import { TIME } from './copy/time';
import { ACTIVITY } from './copy/activity';
import { OVERVIEW } from './copy/overview';
import { EVENT_PAGES } from './copy/event-pages';
import { FOOD } from './copy/food';
import { SHARED } from './copy/shared';
import { ERRORS, UI } from './copy/ui';
export type Dialect = 'ar' | 'ar-EG' | 'ar-SA';
export const DIALECTS: Array<{ value: Dialect; label: string }> = [
  { value: 'ar', label: 'العربية المودرن' }, { value: 'ar-EG', label: 'المصري' }, { value: 'ar-SA', label: 'السعودي' },
];
export const parseDialect = (value: unknown): Dialect => value === 'ar-EG' || value === 'ar-SA' ? value : 'ar';
const coreModern = {
  account: 'حسابي', accountSubtitle: 'ملفك الشخصي، وأسلوب اللغة، والصوت والمظهر.', profile: 'الملف الشخصي', name: 'الاسم', email: 'البريد الإلكتروني', saveProfile: 'حفظ الملف', profileSaved: 'تم حفظ ملفك', nameRequired: 'اكتب اسمًا قبل الحفظ.',
  languageStyle: 'أسلوب اللغة', languageHint: 'اختر أسلوب الكتابة الذي يناسبك. أسماء ضيوفك ونصوص دعوتك تبقى كما كتبتها.', languageSaved: 'تم تحديث أسلوب اللغة',
  appearance: 'المظهر', appearanceHint: 'فاتح أو داكن أو حسب جهازك. تصميم دعوتك يبقى كما اخترته.', demoSession: 'جلسة التجربة', demoSessionHint: 'بياناتك محفوظة على هذا الجهاز. يمكنك تجربة المسارات كاملة قبل ربط الخدمات.', logout: 'تسجيل الخروج', login: 'تسجيل الدخول', help: 'دليل ضيوفي', accountOptions: 'خيارات الحساب', resetDemo: 'ابدأ التجربة من جديد',
  roleTitle: 'طريقة عرض الحساب', roleHint: 'جرّب الأدوات المناسبة لكل دور. المنسّق يدير الضيوف والطاولات والاستقبال، والحذف والتصدير والدفع لصاحب المناسبة. يظهر الطعام لمزوّد الضيافة فقط.', organizer: 'صاحب المناسبة', coordinator: 'المنسّق', caterer: 'مزوّد الضيافة', roleSaved: 'تم تغيير طريقة العرض',
  createEvent: 'إنشاء مناسبة', createTitle: 'مناسبة جديدة', createEssentials: 'يكفي الأسماء والتاريخ. الوقت والمكان تعدّلهما متى شئت.', createContinue: 'متابعة إلى التفاصيل', prepareInvitation: 'جهّز دعوتي',
  back: 'رجوع', next: 'التالي', cancel: 'إلغاء', save: 'حفظ', close: 'إغلاق', retry: 'إعادة المحاولة', done: 'تم', undo: 'تراجع',
  // invitation editor and its guest preview
  editorPreview: 'معاينة كضيف', editorHideTools: 'إخفاء أدوات التعديل', editorZoomIn: 'تقريب', editorZoomOut: 'تصغير', editorBackToEdit: 'العودة للتعديل', previewRestart: 'من البداية',
  templatesTitle: 'تصاميم الدعوة', templateBrowse: 'استعراض التصاميم', templateSwipe: 'اسحب لأعلى للتصميم التالي', templateUse: 'استخدم التصميم', templateShare: 'مشاركة التصميم', previewInvitation: 'معاينة الدعوة',
  // the 3-step creation wizard and the design feed
  wizardOccasion: 'المناسبة', wizardDesign: 'التصميم', wizardDetails: 'التفاصيل', wizardToDesign: 'التالي: التصميم', chooseDesign: 'اختر هذا التصميم', templateFilter: 'الأسلوب', templateShareShort: 'مشاركة', templateWatch: 'شاهدها',
  shareInvitation: 'مشاركة الدعوة', copyLink: 'نسخ الرابط', linkCopied: 'تم نسخ الرابط', bulkSend: 'إرسال جماعي', sendWhatsapp: 'واتساب', sendSms: 'رسالة نصية', simulateSend: 'جرّب الإرسال', shareOptions: 'خيارات المشاركة', manualSent: 'أرسلت الرسالة', openMessage: 'افتح الرسالة الجاهزة',
  upgradeCapacity: 'زيادة سعة الضيوف', paymentDemo: 'تجربة الدفع', continueToPayment: 'متابعة للدفع', confirmDemoPayment: 'تأكيد الدفع التجريبي', cancelUpgrade: 'إلغاء الترقية', changePlan: 'تغيير الباقة', viewReceipt: 'عرض الإيصال', demoNoCharge: 'تجريبي — لا يتم خصم أي مبلغ', confirmReply: 'تأكيد الرد', replySaved: 'تم حفظ ردك في التجربة',
 
  addGuest: 'إضافة ضيف', guestList: 'قائمة الضيوف', tables: 'الطاولات', guests: 'الضيوف', guestsSearch: 'ابحث بالاسم أو رقم الجوال', noGuests: 'لم نجد ضيوفًا بهذه البيانات', pendingReply: 'بانتظار الرد', confirmedReply: 'أكد الحضور', declinedReply: 'اعتذر عن الحضور', moveGuest: 'نقل الضيف', moveGuests: 'نقل الضيوف', exportFile: 'تصدير ملف', exportSelected: 'تصدير المحدد', selectAll: 'تحديد الكل', selection: 'تحديد', tableGesture: 'اسحب الضيف إلى طاولته، أو اختر «نقل»', assignTable: 'اختيار طاولة', guestDetails: 'تفاصيل الضيف',
  // the guest's own pages (always plural; Google's button label is its official wording in every voice)
  guestFastTrack: 'الموعد وتأكيد الحضور', guestSendReply: 'إرسال الرد', guestDemo: 'نسخة تجريبية', guestAddToWallet: 'أضف إلى Google Wallet',
  guestOpen: 'افتحوا الدعوة', guestSealHint: 'اسحبوا الختم للأعلى', guestSealLabel: 'افتحوا الدعوة: اضغطوا على الختم أو اسحبوه للأعلى', guestSkipToDetails: 'الموعد وتأكيد الحضور مباشرة',
  guestAttendQuestion: 'هل ستحضرون؟', guestAccept: 'سنحضر بكل سرور', guestDecline: 'نعتذر عن الحضور', guestChooseReply: 'اختاروا الحضور أو الاعتذار', guestNameRequired: 'اكتبوا الاسم ليعرف صاحب المناسبة من ردّ.',
  guestConfirmed: 'حضوركم مؤكد', guestDeclined: 'سجّلنا اعتذاركم', guestReplyArrived: 'وصل ردكم', guestEditReply: 'تعديل الرد', guestShowCode: 'اعرضوا الرمز على فريق الاستقبال عند الوصول.',
  guestZoomCode: 'اضغطوا لتكبيره عند الباب', guestCodeTip: 'ارفعوا إضاءة الشاشة إن لزم، واسحبوا لأسفل للرجوع.', guestWatchAgain: 'شاهدوا الدعوة مرة أخرى', guestYourDetails: 'تفاصيل حضوركم',
  autoSeat: 'توزيع تلقائي', autoSeatTitle: 'اقتراح التوزيع', autoSeatHint: 'راجع الاقتراح قبل اعتماده: كل دعوة على طاولة واحدة، وكل جهة على طاولات متجاورة. لن يتغيّر شيء قبل الاعتماد.',
  autoSeatKeep: 'غير الموزعين فقط', autoSeatAll: 'إعادة توزيع الجميع', autoSeatApply: 'اعتمد التوزيع', autoSeatApplied: 'تم اعتماد التوزيع', autoSeatUndo: 'تراجع', autoSeatUndone: 'أعدنا التوزيع كما كان',
  autoSeatExclude: 'استبعد من التوزيع', autoSeatInclude: 'أعده للتوزيع', autoSeatMoveTo: 'انقل إلى طاولة', autoSeatAddTables: 'أضف الطاولات المقترحة', autoSeatNewTable: 'جديدة',
  autoSeatTooBig: 'أكبر من أي طاولة. زِد سعة طاولة لتتسع لهم.', autoSeatNoRoom: 'لا توجد مقاعد كافية.', autoSeatNothing: 'كل الضيوف المؤكدين لهم طاولات. اختر «إعادة توزيع الجميع» لترتيبهم من جديد.', autoSeatUnplaced: 'بلا مكان', autoSeatExcluded: 'مستبعدون من التوزيع', autoSeatNewOnApply: 'تُنشأ مع اعتماد التوزيع فقط.', autoSeatKept: 'موزعون من قبل', autoSeatSuggest: 'نقترح إضافة {tables} بسعة {seats} لكلٍّ منها.',
  // guest list: one primary action per guest, bulk sharing (r1-guests)
  addPhone: 'أضف رقمًا', shareWhatsapp: 'شارك عبر واتساب', remindReply: 'ذكّر بالرد', recordArrival: 'سجّل الوصول', removeFromTable: 'إزالة من الطاولة', shareSelected: 'مشاركة المحدد', selectUnsent: 'حدّد من لم تصلهم الدعوة', selectVisible: 'تحديد الظاهر', sentOpenNext: 'أرسلتها، افتح التالي', copyTheirLinks: 'انسخ روابطها معًا', shareUnsent: 'أرسل لمن لم تصلهم الدعوة', remindSelected: 'ذكّر المحددين بالرد', remindSent: 'أرسلت التذكير',
  // ---- r4-audio: account sounds (upload + start point, voice welcome), the editor's sound choice. Keep this block together.
  audioTitle: 'مكتبتي الصوتية', audioIntro: 'أضف موسيقى من جهازك أو سجّل رسالة ترحيب بصوتك، ثم اخترها من «التجربة» في محرر الدعوة.', audioLimits: 'حتى 5 مقاطع، بحد 8 ميجابايت للمقطع. رسالة الترحيب حتى دقيقة.',
  audioDeviceOnly: 'الموسيقى والرسائل التي تضيفها تعمل على هذا الجهاز فقط حتى نربط الخادم؛ ضيوفك على أجهزة أخرى يسمعون الصوت الأساسي.',
  audioTrackName: 'اسم المقطع', audioTrackNamePh: 'مثلًا: موسيقى حفلنا', audioUpload: 'ارفع موسيقى', audioUploadLabel: 'رفع ملف صوتي', audioReading: 'نقرأ الملف…',
  audioTrimTitle: 'من أين تبدأ الموسيقى؟', audioTrimHint: 'اسحب المؤشر لاختيار البداية. الزمن يسير من اليسار إلى اليمين، والجزء المظلَّل هو أول 30 ثانية يسمعها ضيوفك.', audioTimeline: 'الزمن →', audioStartLabel: 'بداية الموسيقى', audioStartAt: 'تبدأ عند {time}',
  audioFadeIn: 'ظهور تدريجي', audioFadeInHint: 'يرتفع الصوت بهدوء في أول ثانية ونصف.', audioPreviewPlay: 'اسمع من البداية المختارة', audioPreviewStop: 'أوقف', audioSaveTrack: 'احفظ المقطع', audioSaveStart: 'احفظ البداية',
  audioSaved: 'حُفظ المقطع. اختره من «التجربة» في محرر الدعوة.', audioStartSaved: 'حُفظت نقطة البداية.', audioEditStart: 'غيّر البداية', audioMakeDefault: 'اجعله الافتراضي', audioIsDefault: 'الافتراضي للدعوات', audioDefaultSaved: 'أصبح هذا المقطع هو الصوت الافتراضي.',
  audioDelete: 'احذف المقطع', audioDeleted: 'حُذف المقطع. الدعوات التي استخدمته تعود إلى الصوت الأساسي.', audioUseBuiltinDefault: 'اجعل الصوت الأساسي هو الافتراضي', audioBuiltinDefaultSaved: 'أصبح الصوت الأساسي هو الافتراضي.',
  audioPreviewOf: 'معاينة {name}', audioKindVoice: 'رسالة ترحيب', audioKindMusic: 'موسيقى',
  audioVoiceTitle: 'رسالة ترحيب بصوتك', audioVoiceHint: 'سجّل ترحيبًا قصيرًا حتى دقيقة. يسمعه ضيوفك مرة واحدة عند فتح الدعوة، ويمكنهم إعادته أو إيقافه.', audioMicAsk: 'سيطلب المتصفح إذنًا باستخدام الميكروفون.',
  audioRecord: 'ابدأ التسجيل', audioRecordStop: 'أوقف التسجيل', audioRerecord: 'سجّل من جديد', audioSaveVoice: 'احفظ الرسالة', audioRecording: 'جارٍ التسجيل', audioRecordLevel: 'مستوى الصوت', audioRecordOf: '{time} من 1:00',
  audioVoiceSaved: 'حُفظت رسالتك. فعّلها من «التجربة» في محرر الدعوة.', audioVoiceDefaultName: 'رسالة ترحيب',
  audioErrNoRecorder: 'هذا المتصفح لا يدعم تسجيل الصوت. جرّب أحدث Chrome أو Safari، أو ارفع رسالتك كملف صوتي.', audioErrMicDenied: 'لم يُسمح باستخدام الميكروفون. اسمح به من إعدادات الموقع في المتصفح ثم حاول مرة أخرى.', audioErrNoMic: 'لم نجد ميكروفونًا على هذا الجهاز.', audioErrRecord: 'تعذّر التسجيل. حاول مرة أخرى.',
  audioErrType: 'اختر ملف MP3 أو WAV أو OGG أو M4A أو WebM صوتيًا.', audioErrEmpty: 'الملف فارغ. اختر ملفًا صوتيًا آخر.', audioErrSize: 'حجم المقطع أكبر من 8 ميجابايت. اختر مقطعًا أقصر أو مضغوطًا مثل MP3.', audioErrFull: 'المكتبة ممتلئة (5 مقاطع). احذف مقطعًا قبل إضافة آخر.',
  audioErrStorage: 'تعذّر الحفظ على هذا الجهاز. احذف مقطعًا قديمًا أو أفرغ بعض مساحة المتصفح.', audioErrDecode: 'هذا الملف غير قابل للتشغيل. اختر ملفًا صوتيًا صالحًا.', audioErrVoiceLong: 'الرسالة أطول من دقيقة. سجّل رسالة أقصر.', audioErrBytes: 'ملف هذا المقطع غير موجود على هذا الجهاز.',
  audioSoundTitle: 'الصوت', audioSoundHint: 'يبدأ بعد أول لمسة، ويستطيع ضيوفك كتمه.', audioChoiceLabel: 'صوت الدعوة', audioChoiceNone: 'بدون صوت', audioChoiceNoneD: 'لا موسيقى ولا مؤثرات.', audioChoiceBuiltin: 'الصوت الأساسي', audioChoiceBuiltinD: 'موسيقى هادئة ومؤثرات التصميم.',
  audioChoiceMine: 'موسيقاي', audioChoiceMineD: 'مقطع من مكتبتك الصوتية.', audioChoiceMineEmpty: 'لا موسيقى في مكتبتك بعد.', audioPickTrack: 'المقطع', audioTrackMissing: 'المقطع غير متاح على هذا الجهاز · سيعمل الصوت الأساسي',
  audioVoiceToggle: 'رسالة ترحيب صوتية', audioVoiceToggleHint: 'تُسمع مرة واحدة عند فتح الدعوة، وتخفت الموسيقى أثناءها.', audioVoicePick: 'الرسالة', audioVoiceMissing: 'الرسالة غير متاحة على هذا الجهاز', audioRecordInAccount: 'سجّل رسالة من حسابك',
  audioManage: 'إدارة مكتبتي الصوتية', audioPreviewSound: 'شغّل الصوت في المعاينة', audioPreviewSoundHint: 'هنا فقط، لتسمعه كما سيسمعه ضيوفك. لا يغيّر الدعوة.', audioGuestVoice: 'رسالة ترحيب صوتية',
  // ---- end r4-audio
  audioUploadInAccount: 'ارفع موسيقى من حسابك',
  audioBackToDesign: 'ارجع إلى التصميم',
  audioBackHint: 'بعد الحفظ ارجع إلى محرر الدعوة واختر المقطع من «التجربة».',
};
const coreEgyptian: Variants<typeof coreModern> = {
  undo: 'رجّعه',
  account: 'حسابي', accountSubtitle: 'بياناتك، وطريقة الكلام، والصوت والشكل.', saveProfile: 'احفظ بياناتي', profileSaved: 'بياناتك اتحفظت', nameRequired: 'اكتب اسمك قبل الحفظ.', languageStyle: 'طريقة الكلام', languageHint: 'اختار الطريقة اللي تناسبك. أسماء الضيوف وكلام دعوتك هيفضلوا زي ما كتبتهم.', languageSaved: 'طريقة الكلام اتغيّرت',
  appearance: 'شكل المنصة', appearanceHint: 'فاتح أو غامق أو زي جهازك. تصميم دعوتك هيفضل زي ما اخترته.', demoSessionHint: 'بياناتك محفوظة على الجهاز ده. جرّب كل الخطوات قبل ربط الخدمات.', roleHint: 'جرّب الأدوات حسب كل دور. الأكل بيظهر لمزوّد الضيافة بس.', roleSaved: 'طريقة العرض اتغيّرت',
  editorPreview: 'شوفها كضيف', editorHideTools: 'اخفي أدوات التعديل', editorZoomIn: 'قرّب', editorZoomOut: 'بعّد', editorBackToEdit: 'ارجع للتعديل', previewRestart: 'من الأول',
  createEvent: 'اعمل مناسبة', createTitle: 'مناسبة جديدة', createEssentials: 'كفاية الأسامي والتاريخ. الساعة والمكان تظبطهم بعدين براحتك.', createContinue: 'كمّل التفاصيل', prepareInvitation: 'جهّز دعوتي', next: 'كمّل', cancel: 'إلغاء', save: 'احفظ', close: 'اقفل', retry: 'جرّب تاني',
  templatesTitle: 'تصاميم الدعوة', templateBrowse: 'اتفرّج على التصاميم', templateSwipe: 'اسحب لفوق للتصميم اللي بعده', templateUse: 'استخدم التصميم ده', templateShare: 'شارك التصميم', previewInvitation: 'شوف الدعوة', shareInvitation: 'شارك الدعوة', copyLink: 'انسخ اللينك', linkCopied: 'اللينك اتنسخ', bulkSend: 'ابعت للمحددين', simulateSend: 'جرّب الإرسال', shareOptions: 'طرق المشاركة', manualSent: 'بعتّ الرسالة', openMessage: 'افتح الرسالة الجاهزة', upgradeCapacity: 'زوّد عدد الضيوف', continueToPayment: 'كمّل للدفع', confirmDemoPayment: 'أكّد الدفع التجريبي', cancelUpgrade: 'الغي الترقية', changePlan: 'غيّر الباقة', viewReceipt: 'شوف الإيصال', demoNoCharge: 'تجريبي — مفيش أي فلوس هتتخصم', confirmReply: 'أكّد ردك', replySaved: 'ردك اتحفظ في التجربة',
  wizardToDesign: 'كمّل للتصميم', chooseDesign: 'اختار التصميم ده', templateShareShort: 'شارك', templateWatch: 'شوفها',
 
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
  // ---- r4-audio (short action labels and the honesty line)
  audioIntro: 'ضيف مزيكا من جهازك أو سجّل رسالة ترحيب بصوتك، وبعدين اختارها من «التجربة» في محرر الدعوة.', audioDeviceOnly: 'المزيكا والرسايل اللي بتضيفها بتشتغل على الجهاز ده بس لحد ما نربط السيرفر؛ ضيوفك على أجهزة تانية هيسمعوا الصوت الأساسي.',
  audioUpload: 'ارفع مزيكا', audioTrimTitle: 'المزيكا تبدأ منين؟', audioPreviewPlay: 'اسمع من البداية اللي اخترتها', audioPreviewStop: 'وقّف', audioEditStart: 'غيّر البداية', audioMakeDefault: 'خليه الافتراضي', audioDelete: 'امسح المقطع',
  audioRecord: 'سجّل دلوقتي', audioRecordStop: 'وقّف التسجيل', audioRerecord: 'سجّل تاني', audioSaveVoice: 'احفظ الرسالة', audioChoiceNone: 'من غير صوت', audioChoiceMine: 'المزيكا بتاعتي', audioRecordInAccount: 'سجّل رسالة من حسابك',
  // r4-copy2: the rest of the sound library and the editor's sound choice
  audioTitle: 'المزيكا والأصوات بتاعتي', audioLimits: 'لحد 5 مقاطع، كل مقطع لحد 8 ميجا. رسالة الترحيب لحد دقيقة.', audioTrackName: 'اسم المقطع', audioTrackNamePh: 'مثلًا: مزيكا فرحنا', audioUploadLabel: 'ارفع ملف صوت', audioReading: 'بنقرا الملف…',
  audioTrimHint: 'اسحب المؤشر عشان تختار البداية. الوقت ماشي من الشمال لليمين، والجزء المظلّل هو أول 30 ثانية ضيوفك هيسمعوها.', audioTimeline: 'الوقت →', audioStartLabel: 'بداية الموسيقى', audioStartAt: 'تبدأ عند {time}',
  audioFadeIn: 'دخول هادي', audioFadeInHint: 'الصوت بيعلى بهدوء في أول ثانية ونص.', audioSaveTrack: 'احفظ المقطع', audioSaveStart: 'احفظ البداية',
  audioSaved: 'المقطع اتحفظ. اختاره من «التجربة» في محرر الدعوة.', audioStartSaved: 'البداية اتحفظت.', audioIsDefault: 'الافتراضي للدعوات', audioDefaultSaved: 'المقطع ده بقى الصوت الافتراضي.',
  audioDeleted: 'المقطع اتمسح. الدعوات اللي كانت مستخدماه هترجع للصوت الأساسي.', audioUseBuiltinDefault: 'خلّي الصوت الأساسي هو الافتراضي', audioBuiltinDefaultSaved: 'الصوت الأساسي بقى هو الافتراضي.',
  audioPreviewOf: 'اسمع {name}', audioKindVoice: 'رسالة ترحيب', audioKindMusic: 'مزيكا',
  audioVoiceTitle: 'ترحيب بصوتك إنت', audioVoiceHint: 'سجّل ترحيب قصير لحد دقيقة. ضيوفك هيسمعوه مرة واحدة لما يفتحوا الدعوة، ويقدروا يعيدوه أو يوقّفوه.', audioMicAsk: 'المتصفح هيطلب إذن الميكروفون.',
  audioRecording: 'بنسجّل', audioRecordLevel: 'مستوى الصوت', audioRecordOf: '{time} من 1:00', audioVoiceSaved: 'رسالتك اتحفظت. شغّلها من «التجربة» في محرر الدعوة.', audioVoiceDefaultName: 'رسالة ترحيب',
  audioErrNoRecorder: 'المتصفح ده مش بيسجّل صوت. جرّب أحدث Chrome أو Safari، أو ارفع رسالتك كملف صوت.', audioErrMicDenied: 'الميكروفون مش مسموح. اسمح بيه من إعدادات الموقع في المتصفح وجرّب تاني.', audioErrNoMic: 'ملقيناش ميكروفون على الجهاز ده.', audioErrRecord: 'التسجيل ما نفعش. جرّب تاني.',
  audioErrType: 'اختار ملف صوت MP3 أو WAV أو OGG أو M4A أو WebM.', audioErrEmpty: 'الملف فاضي. اختار ملف صوت تاني.', audioErrSize: 'المقطع أكبر من 8 ميجا. اختار مقطع أقصر أو مضغوط زي MP3.', audioErrFull: 'المكتبة مليانة (5 مقاطع). امسح مقطع الأول.',
  audioErrStorage: 'ماقدرناش نحفظ على الجهاز ده. امسح مقطع قديم أو فضّي شوية مساحة في المتصفح.', audioErrDecode: 'الملف ده مش بيشتغل. اختار ملف صوت سليم.', audioErrVoiceLong: 'الرسالة أطول من دقيقة. سجّل رسالة أقصر.', audioErrBytes: 'ملف المقطع ده مش موجود على الجهاز ده.',
  audioSoundTitle: 'الصوت', audioSoundHint: 'بيبدأ بعد أول لمسة، وضيوفك يقدروا يكتموه.', audioChoiceLabel: 'صوت الدعوة', audioChoiceNoneD: 'لا مزيكا ولا مؤثرات.', audioChoiceBuiltin: 'الصوت الأساسي', audioChoiceBuiltinD: 'مزيكا هادية ومؤثرات التصميم.',
  audioChoiceMineD: 'مقطع من مكتبتك.', audioChoiceMineEmpty: 'لسه مفيش مزيكا في مكتبتك.', audioPickTrack: 'المقطع', audioTrackMissing: 'المقطع مش موجود على الجهاز ده · هيشتغل الصوت الأساسي',
  audioVoiceToggle: 'رسالة ترحيب بالصوت', audioVoiceToggleHint: 'بتتسمع مرة واحدة لما الدعوة تتفتح، والمزيكا بتوطى وقتها.', audioVoicePick: 'الرسالة', audioVoiceMissing: 'الرسالة مش موجودة على الجهاز ده',
  audioManage: 'المزيكا والأصوات بتاعتي', audioPreviewSound: 'خلّي الصوت شغال في المعاينة', audioPreviewSoundHint: 'هنا بس، عشان تسمعه زي ضيوفك. مش بيغيّر الدعوة.', audioGuestVoice: 'رسالة ترحيب بالصوت',
  // ---- end r4-audio
  email: 'الإيميل',
  roleTitle: 'تشوف الحساب بدور مين',
  profile: 'بياناتك',
  logout: 'اخرج من الحساب',
  demoSession: 'التجربة دي',
  audioUploadInAccount: 'ارفع مزيكا من حسابك',
  audioBackToDesign: 'ارجع للتصميم',
  audioBackHint: 'بعد ما تحفظ ارجع لمحرر الدعوة واختار المقطع من «التجربة».',
};
const coreSaudi: Variants<typeof coreModern> = {
  accountSubtitle: 'بياناتك، وأسلوب الكلام، والصوت والمظهر.', saveProfile: 'احفظ بياناتي', profileSaved: 'تم حفظ بياناتك', nameRequired: 'اكتب اسمك قبل الحفظ.', languageStyle: 'أسلوب الكلام', languageHint: 'اختر الأسلوب اللي يناسبك. أسماء ضيوفك وكلام دعوتك تبقى مثل ما كتبتها.', appearanceHint: 'فاتح أو داكن أو حسب جهازك. تصميم دعوتك يبقى مثل ما اخترته.', demoSessionHint: 'بياناتك محفوظة على هالجهاز. جرّب كل الخطوات قبل ربط الخدمات.', roleHint: 'جرّب الأدوات حسب كل دور. الأكل يظهر لمزوّد الضيافة فقط.',
  editorPreview: 'شوفها كضيف', editorHideTools: 'أخفِ أدوات التعديل', editorZoomIn: 'قرّب', editorZoomOut: 'بعّد', editorBackToEdit: 'ارجع للتعديل',
  createEvent: 'أنشئ مناسبة', createEssentials: 'يكفي الأسماء والتاريخ. الوقت والمكان تعدّلها بعدين على راحتك.', createContinue: 'كمّل التفاصيل', prepareInvitation: 'جهّز دعوتي', next: 'كمّل', save: 'احفظ', retry: 'جرّب مرة ثانية',
  templateBrowse: 'تصفّح التصاميم', templateSwipe: 'اسحب لفوق للتصميم التالي', templateUse: 'استخدم هالتصميم', templateShare: 'شارك التصميم', previewInvitation: 'شوف الدعوة', shareInvitation: 'شارك الدعوة', copyLink: 'انسخ الرابط', bulkSend: 'أرسل للمحددين', shareOptions: 'طرق المشاركة', manualSent: 'أرسلت الرسالة', upgradeCapacity: 'زِد سعة الضيوف', continueToPayment: 'كمّل للدفع', confirmDemoPayment: 'أكّد الدفع التجريبي', cancelUpgrade: 'ألغِ الترقية', changePlan: 'غيّر الباقة', viewReceipt: 'شوف الإيصال', demoNoCharge: 'تجريبي — ما راح ينخصم أي مبلغ', confirmReply: 'أكّد ردّك', replySaved: 'حفظنا ردّك في التجربة',
  wizardToDesign: 'كمّل للتصميم', chooseDesign: 'اختر هالتصميم', templateShareShort: 'شارك', templateWatch: 'شوفها',
 
  addGuest: 'أضف ضيف', guestsSearch: 'ابحث بالاسم أو رقم الجوال', noGuests: 'ما لقينا ضيوف بهالبيانات', pendingReply: 'بانتظار الرد', confirmedReply: 'أكد حضوره', moveGuest: 'انقل الضيف', moveGuests: 'انقل الضيوف', exportFile: 'نزّل ملف', exportSelected: 'نزّل المحدد', selectAll: 'حدّد الكل', tableGesture: 'اسحب الضيف لطاولته، أو اختر «نقل»', assignTable: 'اختر طاولة',
  guestSendReply: 'أرسلوا الرد',
  guestSealHint: 'اسحبوا الختم لفوق', guestSealLabel: 'افتحوا الدعوة: اضغطوا على الختم أو اسحبوه لفوق', guestSkipToDetails: 'الموعد وتأكيد الحضور مباشرة',
  guestAttendQuestion: 'بتشرّفونا؟', guestAccept: 'بنحضر بإذن الله', guestDecline: 'نعتذر ما نقدر نحضر', guestChooseReply: 'اختاروا بتحضرون أو لا', guestNameRequired: 'اكتبوا اسمكم عشان صاحب المناسبة يعرف مين ردّ.',
  guestConfirmed: 'تم تأكيد حضوركم', guestDeclined: 'وصلنا اعتذاركم', guestReplyArrived: 'وصلنا ردّكم', guestEditReply: 'عدّلوا ردّكم', guestShowCode: 'اعرضوا الرمز على فريق الاستقبال أول ما توصلون.',
  guestZoomCode: 'اضغطوا عشان يكبر عند الباب', guestCodeTip: 'ارفعوا إضاءة الشاشة إذا احتجتوا، واسحبوا لتحت عشان ترجعون.', guestWatchAgain: 'شوفوا الدعوة مرة ثانية',
  autoSeat: 'وزّع تلقائيًا', autoSeatTitle: 'اقتراح توزيع الطاولات', autoSeatHint: 'راجع الاقتراح قبل لا تعتمده: كل عائلة على طاولة وحدة، وكل جهة على طاولات جنب بعض. ما يتغيّر شي قبل الاعتماد.',
  autoSeatKeep: 'اللي ما لهم طاولة', autoSeatKept: 'موزّعين من قبل', autoSeatAll: 'وزّع الكل من جديد', autoSeatApply: 'اعتمد التوزيع', autoSeatApplied: 'تم اعتماد التوزيع', autoSeatUndo: 'تراجع', autoSeatUndone: 'رجّعنا التوزيع مثل ما كان',
  autoSeatExclude: 'استبعده من التوزيع', autoSeatInclude: 'رجّعه للتوزيع', autoSeatMoveTo: 'انقله لطاولة', autoSeatAddTables: 'أضف الطاولات المقترحة',
  autoSeatTooBig: 'أكبر من أي طاولة. زِد سعة طاولة عشان تكفيهم.', autoSeatNoRoom: 'ما فيه مقاعد كافية.', autoSeatNothing: 'كل الضيوف المؤكدين لهم طاولات. اختر «وزّع الكل من جديد» لو تبي ترتبهم من جديد.', autoSeatUnplaced: 'بدون مكان', autoSeatExcluded: 'المستبعدين من التوزيع', autoSeatNewOnApply: 'تنضاف مع اعتماد التوزيع فقط.', autoSeatSuggest: 'نقترح تضيف {tables}، كل وحدة {seats}.',
  addPhone: 'أضف رقم', shareWhatsapp: 'أرسل على واتساب', remindReply: 'ذكّرهم بالرد', removeFromTable: 'شيلهم من الطاولة', shareSelected: 'أرسل للمحددين', selectUnsent: 'حدّد اللي ما وصلتهم الدعوة', selectVisible: 'حدّد الظاهر', sentOpenNext: 'أرسلتها، افتح اللي بعدها', copyTheirLinks: 'انسخ روابطهم مع بعض', shareUnsent: 'أرسل للي ما وصلتهم', remindSelected: 'ذكّر المحددين بالرد', remindSent: 'أرسلت التذكير',
  // ---- r4-audio (short action labels and the honesty line)
  audioIntro: 'أضف موسيقى من جهازك أو سجّل رسالة ترحيب بصوتك، وبعدها اخترها من «التجربة» في محرر الدعوة.', audioDeviceOnly: 'الموسيقى والرسايل اللي تضيفها تشتغل على هالجهاز بس لين نربط الخادم؛ ضيوفك على أجهزة ثانية يسمعون الصوت الأساسي.',
  audioUpload: 'ارفع موسيقى', audioTrimTitle: 'من وين تبدأ الموسيقى؟', audioPreviewPlay: 'اسمع من البداية اللي اخترتها', audioPreviewStop: 'وقّف', audioEditStart: 'غيّر البداية', audioMakeDefault: 'خلّه الافتراضي', audioDelete: 'احذف المقطع',
  audioRecord: 'ابدأ التسجيل', audioRecordStop: 'وقّف التسجيل', audioRerecord: 'سجّل مرة ثانية', audioSaveVoice: 'احفظ الرسالة', audioChoiceNone: 'بدون صوت', audioChoiceMine: 'موسيقاي', audioRecordInAccount: 'سجّل رسالة من حسابك',
  // r4-copy2: the rest of the sound library and the editor's sound choice
  audioTitle: 'مكتبتي الصوتية', audioLimits: 'لين 5 مقاطع، كل مقطع لين 8 ميجا. رسالة الترحيب لين دقيقة.', audioTrackName: 'اسم المقطع', audioTrackNamePh: 'مثلًا: موسيقى حفلنا', audioUploadLabel: 'ارفع ملف صوتي', audioReading: 'نقرأ الملف…',
  audioTrimHint: 'اسحب المؤشر عشان تختار البداية. الوقت يمشي من اليسار لليمين، والجزء المظلّل هو أول 30 ثانية يسمعها ضيوفك.', audioTimeline: 'الوقت →', audioStartLabel: 'بداية الموسيقى', audioStartAt: 'تبدأ عند {time}',
  audioFadeIn: 'دخول هادي', audioFadeInHint: 'يرتفع الصوت بهدوء في أول ثانية ونص.', audioSaveTrack: 'احفظ المقطع', audioSaveStart: 'احفظ البداية',
  audioSaved: 'حفظنا المقطع. اختره من «التجربة» في محرر الدعوة.', audioStartSaved: 'حفظنا البداية.', audioIsDefault: 'الافتراضي للدعوات', audioDefaultSaved: 'صار هالمقطع هو الصوت الافتراضي.',
  audioDeleted: 'انحذف المقطع. الدعوات اللي كانت تستخدمه ترجع للصوت الأساسي.', audioUseBuiltinDefault: 'خلّ الصوت الأساسي هو الافتراضي', audioBuiltinDefaultSaved: 'صار الصوت الأساسي هو الافتراضي.',
  audioPreviewOf: 'اسمع {name}', audioKindVoice: 'رسالة ترحيب', audioKindMusic: 'موسيقى',
  audioVoiceTitle: 'ترحيبة بصوتك', audioVoiceHint: 'سجّل ترحيب قصير لين دقيقة. يسمعه ضيوفك مرة وحدة لما يفتحون الدعوة، ويقدرون يعيدونه أو يوقفونه.', audioMicAsk: 'بيطلب المتصفح إذن الميكروفون.',
  audioRecording: 'نسجّل', audioRecordLevel: 'مستوى الصوت', audioRecordOf: '{time} من 1:00', audioVoiceSaved: 'حفظنا رسالتك. شغّلها من «التجربة» في محرر الدعوة.', audioVoiceDefaultName: 'رسالة ترحيب',
  audioErrNoRecorder: 'هالمتصفح ما يسجّل صوت. جرّب آخر إصدار من Chrome أو Safari، أو ارفع رسالتك كملف صوتي.', audioErrMicDenied: 'الميكروفون مو مسموح. اسمح فيه من إعدادات الموقع في المتصفح وجرّب مرة ثانية.', audioErrNoMic: 'ما لقينا ميكروفون على هالجهاز.', audioErrRecord: 'ما زبط التسجيل. جرّب مرة ثانية.',
  audioErrType: 'اختر ملف صوتي MP3 أو WAV أو OGG أو M4A أو WebM.', audioErrEmpty: 'الملف فاضي. اختر ملف صوتي ثاني.', audioErrSize: 'المقطع أكبر من 8 ميجا. اختر مقطع أقصر أو مضغوط مثل MP3.', audioErrFull: 'المكتبة مليانة (5 مقاطع). احذف مقطع أول.',
  audioErrStorage: 'ما قدرنا نحفظ على هالجهاز. احذف مقطع قديم أو فضّ شوي مساحة في المتصفح.', audioErrDecode: 'هالملف ما يشتغل. اختر ملف صوتي سليم.', audioErrVoiceLong: 'الرسالة أطول من دقيقة. سجّل رسالة أقصر.', audioErrBytes: 'ملف هالمقطع مو موجود على هالجهاز.',
  audioSoundTitle: 'الصوت', audioSoundHint: 'يبدأ بعد أول لمسة، ويقدر ضيوفك يكتمونه.', audioChoiceLabel: 'صوت الدعوة', audioChoiceNoneD: 'لا موسيقى ولا مؤثرات.', audioChoiceBuiltin: 'الصوت الأساسي', audioChoiceBuiltinD: 'موسيقى هادية ومؤثرات التصميم.',
  audioChoiceMineD: 'مقطع من مكتبتك الصوتية.', audioChoiceMineEmpty: 'ما فيه موسيقى في مكتبتك للحين.', audioPickTrack: 'المقطع', audioTrackMissing: 'المقطع مو موجود على هالجهاز · بيشتغل الصوت الأساسي',
  audioVoiceToggle: 'رسالة ترحيب صوتية', audioVoiceToggleHint: 'تنسمع مرة وحدة لما تنفتح الدعوة، وتوطى الموسيقى وقتها.', audioVoicePick: 'الرسالة', audioVoiceMissing: 'الرسالة مو موجودة على هالجهاز',
  audioManage: 'إدارة مكتبتي الصوتية', audioPreviewSound: 'شغّل الصوت وأنت تعاين', audioPreviewSoundHint: 'هنا بس، عشان تسمعه مثل ضيوفك. ما يغيّر الدعوة.', audioGuestVoice: 'رسالة ترحيب صوتية',
  // ---- end r4-audio
  email: 'الإيميل',
  roleTitle: 'تشوف الحساب بأي دور',
  profile: 'بياناتك',
  logout: 'اطلع من الحساب',
  demoSession: 'جلسة التجربة',
  audioUploadInAccount: 'ارفع موسيقى من حسابك',
  audioBackToDesign: 'ارجع للتصميم',
  audioBackHint: 'بعد ما تحفظ ارجع لمحرر الدعوة واختر المقطع من «التجربة».',
};
const CORE = partly(coreModern, coreEgyptian, coreSaudi);

/**
 * Every group of strings, by feature. A group's keys are unique across the whole dictionary (a unit test checks);
 * `voiced` groups spell every key in every voice, `partly` groups fall back to modern Arabic (see copy/group.ts).
 */
export const COPY_GROUPS = {
  core: CORE, home: HOME, homeMore: HOME_MORE, create: CREATE, createMore: CREATE_MORE, guests: GUESTS, guestTools: GUEST_TOOLS, seating: SEATING, guest: GUEST, engine: ENGINE, editor: EDITOR, editorSections: EDITOR_SECTIONS, settings: SETTINGS, replies: REPLIES, billing: BILLING, gate: GATE,
  import: IMPORT, experienceSettings: EXPERIENCE_SETTINGS, auth: AUTH, time: TIME, activity: ACTIVITY, overview: OVERVIEW, eventPages: EVENT_PAGES, food: FOOD, shared: SHARED,
  ui: UI, errors: ERRORS,
} as const;

const modern = {
  ...CORE.modern, ...HOME.modern, ...HOME_MORE.modern, ...CREATE.modern, ...CREATE_MORE.modern, ...GUESTS.modern, ...GUEST_TOOLS.modern, ...SEATING.modern, ...GUEST.modern, ...ENGINE.modern, ...EDITOR.modern, ...EDITOR_SECTIONS.modern, ...SETTINGS.modern, ...REPLIES.modern, ...BILLING.modern, ...GATE.modern,
  ...IMPORT.modern, ...EXPERIENCE_SETTINGS.modern, ...AUTH.modern, ...TIME.modern, ...ACTIVITY.modern, ...OVERVIEW.modern, ...EVENT_PAGES.modern, ...FOOD.modern, ...SHARED.modern,
  ...UI.modern, ...ERRORS.modern,
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
export type Noun = 'guest' | 'person' | 'invitation' | 'seat' | 'table' | 'row';
const SPOKEN: Record<'ar-EG' | 'ar-SA', Record<Noun, PluralForms>> = {
  'ar-EG': {
    guest: { zero: 'مفيش ضيوف', one: 'ضيف واحد', two: 'ضيفين', few: '# ضيوف', many: '# ضيف', other: '# ضيف' },
    person: { zero: 'مفيش حد', one: 'شخص واحد', two: 'شخصين', few: '# أشخاص', many: '# شخص', other: '# شخص' },
    invitation: { zero: 'مفيش دعوات', one: 'دعوة واحدة', two: 'دعوتين', few: '# دعوات', many: '# دعوة', other: '# دعوة' },
    seat: { zero: 'مفيش كراسي', one: 'كرسي واحد', two: 'كرسيين', few: '# كراسي', many: '# كرسي', other: '# كرسي' },
    table: { zero: 'مفيش ترابيزات', one: 'ترابيزة واحدة', two: 'ترابيزتين', few: '# ترابيزات', many: '# ترابيزة', other: '# ترابيزة' },
    row: { zero: 'مفيش صفوف', one: 'صف واحد', two: 'صفين', few: '# صفوف', many: '# صف', other: '# صف' },
  },
  'ar-SA': {
    guest: { zero: 'ما فيه ضيوف', one: 'ضيف واحد', two: 'ضيفين', few: '# ضيوف', many: '# ضيف', other: '# ضيف' },
    person: { zero: 'ما فيه أحد', one: 'شخص واحد', two: 'شخصين', few: '# أشخاص', many: '# شخص', other: '# شخص' },
    invitation: { zero: 'ما فيه دعوات', one: 'دعوة وحدة', two: 'دعوتين', few: '# دعوات', many: '# دعوة', other: '# دعوة' },
    seat: { zero: 'ما فيه مقاعد', one: 'مقعد واحد', two: 'مقعدين', few: '# مقاعد', many: '# مقعد', other: '# مقعد' },
    table: { zero: 'ما فيه طاولات', one: 'طاولة وحدة', two: 'طاولتين', few: '# طاولات', many: '# طاولة', other: '# طاولة' },
    row: { zero: 'ما فيه صفوف', one: 'صف واحد', two: 'صفين', few: '# صفوف', many: '# صف', other: '# صف' },
  },
};
export const nounForms = (dialect: Dialect, noun: Noun): PluralForms => (dialect === 'ar' ? P[noun] : SPOKEN[dialect][noun]);
/** «3 ضيوف» in the voice; `oblique` gives the classical «ضيفين» after a preposition (the dialects always say it) */
export const countOf = (dialect: Dialect, n: number, noun: Noun, oblique = false): string => plural(n, nounForms(parseDialect(dialect), noun), { oblique });
