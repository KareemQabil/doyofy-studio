/**
 * The invitation editor's frame: one surface — the card, three tabs (النص · الشكل · الصوت), a calm save status and the
 * one forward action «أرسل للضيوف». There is no publish step: what is saved is what guests get. The audio controls
 * belong to the audio library.
 */
import { voiced } from './group';

export const EDITOR = voiced({
  edContent: 'النص', edDesign: 'الشكل', edMotion: 'الصوت', edTabsLabel: 'أقسام المحرر',
  edPageCard: 'البطاقة', edPageMessage: 'الكلمة', edPageProgram: 'البرنامج', edPagesLabel: 'صفحات الدعوة', edPageOf: '{name}، الصفحة {n} من {total}',
  edLeaveEvent: 'بعض تفاصيل المناسبة لم تُحفظ بعد. هل تريد المغادرة دون حفظها؟', edLeave: 'آخر تعديلاتك على الدعوة لم تُحفظ بعد. هل تريد المغادرة؟',
  edSaveFailedLeave: 'تعذّر حفظ آخر التعديلات. أعد المحاولة قبل المغادرة.', edCheckFields: 'راجع الحقل الموضّح، ثم تابع.', edFixField: 'راجع الحقل الموضّح لنحفظه',
  edSaveFailed: 'تعذّر الحفظ', edSaved: 'تم الحفظ', edSaving: 'جارٍ الحفظ…', edLive: 'التعديلات تصل لضيوفك تلقائيًا', edSend: 'أرسل للضيوف',
  edSkip: 'تخطَّ إلى أدوات الدعوة', edCloseLabel: 'حفظ والعودة إلى الدعوة', edTitle: 'تصميم الدعوة', edToolsLabel: 'أدوات التصميم',
  edReadyTitle: 'دعوتك جاهزة.', edReadyText: 'اضغط أي نص على البطاقة لتعديله، ثم أرسلها لضيوفك.',
  edStageLabel: 'دعوتك: اضغط أي نص لتعديله', edYourInvitation: 'دعوتك', edReplayCard: 'شغّل حركة البطاقة', edExpand: 'تكبير البطاقة',
  edEditNames: 'عدّل الأسماء', edEditDate: 'عدّل الموعد', edEditVenue: 'عدّل المكان', edEditMessage: 'عدّل كلمة الدعوة', edEditProgram: 'عدّل البرنامج',
}, {
  edContent: 'الكلام', edDesign: 'الشكل', edMotion: 'الصوت', edTabsLabel: 'أقسام المحرر',
  edPageCard: 'الكارت', edPageMessage: 'الكلمة', edPageProgram: 'البرنامج', edPagesLabel: 'صفحات الدعوة', edPageOf: '{name}، الصفحة {n} من {total}',
  edLeaveEvent: 'شوية تفاصيل في المناسبة لسه ما اتحفظتش. عايز تخرج من غير ما تحفظها؟', edLeave: 'آخر تعديلاتك على الدعوة لسه ما اتحفظتش. عايز تخرج؟',
  edSaveFailedLeave: 'آخر التعديلات ما اتحفظتش. جرّب تاني قبل ما تخرج.', edCheckFields: 'راجع الخانة اللي متعلّم عليها، وبعدين كمّل.', edFixField: 'راجع الخانة المتعلّم عليها عشان نحفظها',
  edSaveFailed: 'الحفظ ما نفعش', edSaved: 'اتحفظ', edSaving: 'بنحفظ…', edLive: 'التعديلات بتوصل لضيوفك على طول', edSend: 'ابعت للضيوف',
  edSkip: 'روح لأدوات الدعوة', edCloseLabel: 'احفظ وارجع للدعوة', edTitle: 'تصميم الدعوة', edToolsLabel: 'أدوات التصميم',
  edReadyTitle: 'دعوتك جاهزة.', edReadyText: 'دوس على أي كلام في الكارت عشان تعدّله، وبعدين ابعتها لضيوفك.',
  edStageLabel: 'دعوتك: دوس على أي كلام عشان تعدّله', edYourInvitation: 'دعوتك', edReplayCard: 'شغّل حركة الكارت', edExpand: 'كبّر الكارت',
  edEditNames: 'عدّل الأسامي', edEditDate: 'عدّل الميعاد', edEditVenue: 'عدّل المكان', edEditMessage: 'عدّل كلمة الدعوة', edEditProgram: 'عدّل البرنامج',
}, {
  edContent: 'النص', edDesign: 'الشكل', edMotion: 'الصوت', edTabsLabel: 'أقسام المحرر',
  edPageCard: 'البطاقة', edPageMessage: 'الكلمة', edPageProgram: 'البرنامج', edPagesLabel: 'صفحات الدعوة', edPageOf: '{name}، الصفحة {n} من {total}',
  edLeaveEvent: 'بعض تفاصيل المناسبة ما انحفظت للحين. تبي تطلع بدون حفظ؟', edLeave: 'آخر تعديلاتك على الدعوة ما انحفظت للحين. تبي تطلع؟',
  edSaveFailedLeave: 'ما انحفظت آخر التعديلات. جرّب مرة ثانية قبل ما تطلع.', edCheckFields: 'راجع الخانة المحددة، وبعدها كمّل.', edFixField: 'راجع الخانة المحددة عشان نحفظها',
  edSaveFailed: 'ما انحفظ', edSaved: 'انحفظ', edSaving: 'نحفظ…', edLive: 'التعديلات توصل لضيوفك تلقائيًا', edSend: 'أرسل للضيوف',
  edSkip: 'روح لأدوات الدعوة', edCloseLabel: 'احفظ وارجع للدعوة', edTitle: 'تصميم الدعوة', edToolsLabel: 'أدوات التصميم',
  edReadyTitle: 'دعوتك جاهزة.', edReadyText: 'اضغط على أي نص في البطاقة عشان تعدّله، وبعدها أرسلها لضيوفك.',
  edStageLabel: 'دعوتك: اضغط على أي نص عشان تعدّله', edYourInvitation: 'دعوتك', edReplayCard: 'شغّل حركة البطاقة', edExpand: 'كبّر البطاقة',
  edEditNames: 'عدّل الأسماء', edEditDate: 'عدّل الموعد', edEditVenue: 'عدّل المكان', edEditMessage: 'عدّل كلمة الدعوة', edEditProgram: 'عدّل البرنامج',
});
