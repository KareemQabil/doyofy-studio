/** The invitation editor's frame (tabs, save/publish state, stage). The audio controls belong to the audio library. */
import { partly } from './group';

export const EDITOR = partly({
  edContent: 'المحتوى', edDesign: 'التصميم', edMotion: 'التجربة', edEvent: 'المناسبة', edPageCard: 'البطاقة', edPageMessage: 'الكلمة', edPageProgram: 'البرنامج',
  edLeaveEvent: 'لم تُحفظ تعديلات تفاصيل المناسبة. هل تريد المغادرة دون حفظها؟', edLeave: 'آخر تعديلاتك على الدعوة لم تُحفظ بعد. هل تريد المغادرة؟',
  edSaveFailedLeave: 'تعذّر حفظ آخر التعديلات. أعد المحاولة قبل المغادرة.', edCheckFields: 'راجع الحقول الموضّحة، ثم انشر الدعوة.', edNotSavedNotPublished: 'لم نتمكن من حفظ التعديلات، لذلك لم تُنشر. أعد المحاولة.',
  edOwnerPublishes: 'النشر لصاحب المناسبة', edToGuests: 'إلى الضيوف', edPublishChanges: 'انشر التعديلات', edPublish: 'انشر الدعوة',
  edSaveFailed: 'تعذّر الحفظ', edSaved: 'تم الحفظ', edSaving: 'جارٍ الحفظ…', edPublished: 'منشورة', edChangedUnpublished: 'تعديلات غير منشورة', edDraft: 'مسودة لم تُنشر', edPublishedChanged: 'منشورة · تعديلات غير منشورة',
  edSkip: 'تخطَّ إلى أدوات الدعوة', edBrand: 'ضيوفي — حفظ والعودة إلى المناسبة', edCloseLabel: 'حفظ وإغلاق المحرر', edTitle: 'تصميم الدعوة', edJustPublished: 'نُشرت دعوتك', edToolsLabel: 'أدوات التصميم',
  edTabsLabel: 'أقسام المحرر', edNotPublished: 'لم تُنشر الدعوة', edReadyTitle: 'دعوتك جاهزة للتعديل.', edReadyText: 'راجع التفاصيل، ثم عاين وانشر.',
  edStageLabel: 'معاينة الدعوة', edFullKicker: 'التجربة الكاملة', edDeskKicker: 'على طاولة التصميم', edFullCaption: 'شاهد الدعوة كما تُفتح لضيوفك', edDeskCaption: 'دعوتك، بكل تفاصيلها',
  edModeLabel: 'عرض الاستوديو', edModeEdit: 'تعديل', edModePreview: 'معاينة', edGuestsReady: 'دعوتك جاهزة للضيوف.', edGuestsReadyText: 'تابع من «إلى الضيوف» بالأعلى: أضف قائمتك ثم شارك رابط كل دعوة.',
  edCanvasLabel: 'صفحة الدعوة المعروضة', edYourInvitation: 'دعوتك', edChangesAsYouType: 'تتغيّر مع كتابتك', edReplayCard: 'شغّل حركة البطاقة', edExpand: 'تكبير البطاقة', edReplay: 'أعد العرض',
  edSoundOff: 'أوقف الصوت في المعاينة', edSoundOn: 'شغّل الصوت في المعاينة',
}, {
  edContent: 'الكلام', edDesign: 'التصميم', edMotion: 'التجربة', edEvent: 'المناسبة', edPageCard: 'الكارت', edPageMessage: 'الكلمة', edPageProgram: 'البرنامج',
  edLeaveEvent: 'تعديلات تفاصيل المناسبة لسه ما اتحفظتش. عايز تخرج من غير ما تحفظها؟', edLeave: 'آخر تعديلاتك على الدعوة لسه ما اتحفظتش. عايز تخرج؟',
  edSaveFailedLeave: 'آخر التعديلات ما اتحفظتش. جرّب تاني قبل ما تخرج.', edCheckFields: 'راجع الخانات اللي متعلّم عليها، وبعدين انشر الدعوة.', edNotSavedNotPublished: 'ماقدرناش نحفظ التعديلات، فما اتنشرتش. جرّب تاني.',
  edOwnerPublishes: 'النشر لصاحب المناسبة', edToGuests: 'روح للضيوف', edPublishChanges: 'انشر التعديلات', edPublish: 'انشر الدعوة',
  edSaveFailed: 'الحفظ ما نفعش', edSaved: 'اتحفظ', edSaving: 'بنحفظ…', edPublished: 'منشورة', edChangedUnpublished: 'تعديلات لسه ما اتنشرتش', edDraft: 'مسودة لسه ما اتنشرتش', edPublishedChanged: 'منشورة · فيه تعديلات لسه ما اتنشرتش',
  edTitle: 'تصميم الدعوة', edJustPublished: 'دعوتك اتنشرت', edNotPublished: 'الدعوة ما اتنشرتش', edReadyTitle: 'دعوتك جاهزة تتعدّل.', edReadyText: 'راجع التفاصيل، وبعدين شوفها وانشرها.',
  edFullKicker: 'التجربة كاملة', edDeskKicker: 'على ترابيزة التصميم', edFullCaption: 'شوف الدعوة زي ما هتتفتح لضيوفك', edDeskCaption: 'دعوتك بكل تفاصيلها',
  edModeEdit: 'تعديل', edModePreview: 'معاينة', edGuestsReady: 'دعوتك جاهزة للضيوف.', edGuestsReadyText: 'كمّل من «روح للضيوف» فوق: ضيف قايمتك وابعت لينك كل دعوة.',
  edYourInvitation: 'دعوتك', edChangesAsYouType: 'بتتغيّر وإنت بتكتب', edReplayCard: 'شغّل حركة الكارت', edExpand: 'كبّر الكارت', edReplay: 'شغّلها تاني',
}, {
  edContent: 'المحتوى', edDesign: 'التصميم', edPageCard: 'البطاقة',
  edLeaveEvent: 'تعديلات تفاصيل المناسبة ما انحفظت. تبي تطلع بدون حفظ؟', edLeave: 'آخر تعديلاتك على الدعوة ما انحفظت للحين. تبي تطلع؟',
  edSaveFailedLeave: 'ما انحفظت آخر التعديلات. جرّب مرة ثانية قبل ما تطلع.', edCheckFields: 'راجع الخانات المحددة، وبعدها انشر الدعوة.', edNotSavedNotPublished: 'ما قدرنا نحفظ التعديلات، فما نشرناها. جرّب مرة ثانية.',
  edToGuests: 'روح للضيوف', edSaveFailed: 'ما انحفظ', edSaved: 'انحفظ', edSaving: 'نحفظ…', edChangedUnpublished: 'تعديلات مو منشورة', edDraft: 'مسودة مو منشورة', edPublishedChanged: 'منشورة · فيه تعديلات مو منشورة',
  edJustPublished: 'نشرنا دعوتك', edNotPublished: 'ما نشرنا الدعوة', edReadyTitle: 'دعوتك جاهزة للتعديل.', edReadyText: 'راجع التفاصيل، وبعدها عاينها وانشرها.',
  edFullKicker: 'التجربة كاملة', edFullCaption: 'شوف الدعوة مثل ما تنفتح لضيوفك', edGuestsReady: 'دعوتك جاهزة للضيوف.', edGuestsReadyText: 'كمّل من «روح للضيوف» فوق: أضف قائمتك وأرسل رابط كل دعوة.',
  edChangesAsYouType: 'تتغيّر وأنت تكتب', edReplay: 'شغّلها مرة ثانية',
});
