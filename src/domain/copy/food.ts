/**
 * The food report, and the dietary and wishlist words domain/guest-experience builds for organizers and guests
 * (guests read them in the organizer's voice, like the rest of their pages).
 */
import { voiced } from './group';

export const FOOD = voiced({
  dtNuts: 'مكسرات', dtDairy: 'حليب ومشتقاته', dtGluten: 'قمح / جلوتين', dtEggs: 'بيض', dtSeafood: 'مأكولات بحرية', dtHalal: 'حلال فقط', dtVeg: 'نباتي', dtVegan: 'نباتي صرف', dtOther: 'شيء آخر',
  dtAllergy: 'حساسية {list}', dtOtherNeed: 'احتياج آخر', dtRemovedOption: 'خيار محذوف',
  gkGift: 'هدية', gkGiftHint: 'شيء يتمنونه بعينه', gkGiftLink: 'عرض الهدية', gkContribution: 'مساهمة', gkContributionHint: 'مشاركة في هدية أكبر أو نقوط', gkContributionLink: 'المساهمة',
  gkFlowers: 'ورد', gkFlowersHint: 'باقة تصل في يومهم', gkFlowersLink: 'إرسال ورد',
  // features/guests/FoodReport
  fdEmptyTitle: 'لا أسئلة طعام بعد', fdSetup: 'جهّز قائمة الطعام', fdEmptyText: 'فعّل اختيار الوجبة أو سؤال الحساسية، وسيظهر هنا عدد كل وجبة ومن لديه ما نراعيه.',
  fdMeals: 'الوجبات', fdChoseOf: 'من {people} اختاروا', fdHidden: ' · مخفي عن الضيوف', fdNone: 'بلا اختيار', fdAllowed: ' (مسموح)',
  fdReviewPre: 'تغيّر عدد الحضور بعد اختيار الوجبات — راجع:', fdReviewPost: '. لا نحسبها حتى تُراجع.', fdProvisional: 'من الرابط العام بانتظار المطابقة: {people}', fdNotCounted: '. غير محسوبة أعلاه.',
  fdDiet: 'ما نراعيه', fdDietTotals: '{invitations} لديها احتياج · {none} «لا شيء» · {unanswered} لم تُجب', fdNeedsSummary: 'ملخص الاحتياجات', fdNoNeeds: 'لا احتياجات مسجلة بعد.',
  fdFine: 'ما كتبه الضيف كما هو، لتوصله لمن يحضّر الطعام. «نباتي» لا يعني خلوًا من الحساسية.', fdPerTable: 'لكل طاولة', fdForServers: 'لمن يقدّم الطعام', fdNoChoices: 'لا اختيارات',
  fdExport: 'تصدير للمطبخ (CSV)', fdEditQuestions: 'تعديل الأسئلة', fdFooter: 'بدون أرقام هواتف · الإصدار {n}', fdAffects: ' · تخص {people}', fdNoTable: 'بلا طاولة',
  // the guest's follow-up questions (features/guest/GuestExtras): errors and button names, addressed in the plural
  geUnknown: 'أحد خيارات الطعام لم يعد متاحًا. راجعوا الوجبات.', geDuplicate: 'الخيار نفسه مكرر.', geNotWhole: 'الأعداد يجب أن تكون صحيحة وغير سالبة.',
  geSumMismatch: 'وزّعوا الوجبات على عدد الحضور كاملًا.', geSumOver: 'عدد الوجبات أكبر من عدد الحضور.', geAffected: 'عدد من تخصهم الحاجة بين واحد وعدد الحضور.',
  geOtherNote: 'اكتبوا الحاجة الأخرى بكلمات قليلة.', geNeedsNoAnswer: 'اختاروا «لا شيء» أو حددوا الحاجة.',
  geMore: 'زيادة {name}', geLess: 'إنقاص {name}', geAffectedQ: 'تخص كم شخصًا', geAffectsN: 'تخص {people}', geOptional: '(اختياري)', geCompanionN: 'اسم المرافق {n}',
}, {
  dtNuts: 'مكسرات', dtDairy: 'لبن ومنتجاته', dtGluten: 'قمح / جلوتين', dtEggs: 'بيض', dtSeafood: 'أكل بحري', dtHalal: 'حلال بس', dtVeg: 'نباتي', dtVegan: 'نباتي تمامًا', dtOther: 'حاجة تانية',
  dtAllergy: 'حساسية {list}', dtOtherNeed: 'احتياج تاني', dtRemovedOption: 'اختيار اتمسح',
  gkGift: 'هدية', gkGiftHint: 'حاجة معيّنة نفسهم فيها', gkGiftLink: 'شوفوا الهدية', gkContribution: 'مساهمة', gkContributionHint: 'مشاركة في هدية أكبر أو نقطة', gkContributionLink: 'ساهموا',
  gkFlowers: 'ورد', gkFlowersHint: 'بوكيه يوصل في يومهم', gkFlowersLink: 'ابعتوا ورد',
  fdEmptyTitle: 'لسه مفيش أسئلة عن الأكل', fdSetup: 'جهّز قايمة الأكل', fdEmptyText: 'فعّل اختيار الوجبة أو سؤال الحساسية، وهيظهر هنا عدد كل وجبة ومين عنده حاجة نراعيها.',
  fdMeals: 'الوجبات', fdChoseOf: 'من {people} اختاروا', fdHidden: ' · مستخبي عن الضيوف', fdNone: 'من غير اختيار', fdAllowed: ' (مسموح)',
  fdReviewPre: 'عدد الحضور اتغيّر بعد ما اختاروا الأكل — راجع:', fdReviewPost: '. مش هنحسبها غير لما تتراجع.', fdProvisional: 'من اللينك العام مستنية مطابقة: {people}', fdNotCounted: '. مش محسوبة فوق.',
  fdDiet: 'اللي نراعيه', fdDietTotals: '{invitations} عندها احتياج · {none} «مفيش» · {unanswered} ما ردّتش', fdNeedsSummary: 'ملخص الاحتياجات', fdNoNeeds: 'لسه مفيش احتياجات متسجلة.',
  fdFine: 'اللي كتبه الضيف زي ما هو، عشان توصّله للي بيحضّر الأكل. «نباتي» مش معناه إنه مفيش حساسية.', fdPerTable: 'لكل ترابيزة', fdForServers: 'للي بيقدّم الأكل', fdNoChoices: 'مفيش اختيارات',
  fdExport: 'نزّل للمطبخ (CSV)', fdEditQuestions: 'عدّل الأسئلة', fdFooter: 'من غير أرقام موبايلات · نسخة {n}', fdAffects: ' · لـ{people}', fdNoTable: 'من غير ترابيزة',
  geUnknown: 'فيه اختيار أكل مبقاش موجود. راجعوا الوجبات.', geDuplicate: 'نفس الاختيار متكرر.', geNotWhole: 'الأعداد لازم تكون أرقام صحيحة ومش بالسالب.',
  geSumMismatch: 'وزّعوا الوجبات على كل اللي جايين.', geSumOver: 'الوجبات أكتر من عدد اللي جايين.', geAffected: 'عدد اللي تخصهم الحاجة لازم يكون من واحد لعدد الحضور.',
  geOtherNote: 'اكتبوا الحاجة التانية في كلمتين.', geNeedsNoAnswer: 'اختاروا «لأ، شكرًا» أو قولوا الحاجة إيه.',
  geMore: 'زوّدوا {name}', geLess: 'قلّلوا {name}', geAffectedQ: 'تخص كام واحد', geAffectsN: 'تخص {people}', geOptional: '(اختياري)', geCompanionN: 'اسم اللي معاكم {n}',
}, {
  dtNuts: 'مكسرات', dtDairy: 'حليب ومشتقاته', dtGluten: 'قمح / جلوتين', dtEggs: 'بيض', dtSeafood: 'مأكولات بحرية', dtHalal: 'حلال بس', dtVeg: 'نباتي', dtVegan: 'نباتي بالكامل', dtOther: 'شي ثاني',
  dtAllergy: 'حساسية {list}', dtOtherNeed: 'احتياج ثاني', dtRemovedOption: 'خيار محذوف',
  gkGift: 'هدية', gkGiftHint: 'شي معيّن يتمنونه', gkGiftLink: 'شوفوا الهدية', gkContribution: 'مساهمة', gkContributionHint: 'مشاركة في هدية أكبر أو نقوط', gkContributionLink: 'ساهموا',
  gkFlowers: 'ورد', gkFlowersHint: 'باقة توصل في يومهم', gkFlowersLink: 'أرسلوا ورد',
  fdEmptyTitle: 'ما فيه أسئلة عن الأكل للحين', fdSetup: 'جهّز قائمة الأكل', fdEmptyText: 'فعّل اختيار الوجبة أو سؤال الحساسية، وبيطلع هنا عدد كل وجبة ومين عنده شي نراعيه.',
  fdMeals: 'الوجبات', fdChoseOf: 'من {people} اختاروا', fdHidden: ' · مخفي عن الضيوف', fdNone: 'بدون اختيار', fdAllowed: ' (مسموح)',
  fdReviewPre: 'تغيّر عدد الحضور بعد اختيار الوجبات — راجع:', fdReviewPost: '. ما نحسبها لين تتراجع.', fdProvisional: 'من الرابط العام تنتظر المطابقة: {people}', fdNotCounted: '. مو محسوبة فوق.',
  fdDiet: 'اللي نراعيه', fdDietTotals: '{invitations} عندها احتياج · {none} «ما فيه» · {unanswered} ما ردّت', fdNeedsSummary: 'ملخص الاحتياجات', fdNoNeeds: 'ما فيه احتياجات مسجلة للحين.',
  fdFine: 'اللي كتبه الضيف مثل ما هو، عشان توصله للي يجهّز الأكل. «نباتي» ما يعني إنه ما عنده حساسية.', fdPerTable: 'لكل طاولة', fdForServers: 'للي يقدّم الأكل', fdNoChoices: 'ما فيه اختيارات',
  fdExport: 'نزّل للمطبخ (CSV)', fdEditQuestions: 'عدّل الأسئلة', fdFooter: 'بدون أرقام جوالات · النسخة {n}', fdAffects: ' · تخص {people}', fdNoTable: 'بدون طاولة',
  geUnknown: 'فيه خيار أكل ما عاد متاح. راجعوا الوجبات.', geDuplicate: 'نفس الخيار مكرر.', geNotWhole: 'الأعداد لازم تكون صحيحة ومو بالسالب.',
  geSumMismatch: 'وزّعوا الوجبات على كل الحضور.', geSumOver: 'الوجبات أكثر من عدد الحضور.', geAffected: 'عدد اللي تخصهم الحاجة لازم يكون بين واحد وعدد الحضور.',
  geOtherNote: 'اكتبوا الحاجة الثانية بكلمتين.', geNeedsNoAnswer: 'اختاروا «لا، شكرًا» أو حددوا الحاجة.',
  geMore: 'زيدوا {name}', geLess: 'نقّصوا {name}', geAffectedQ: 'تخص كم شخص', geAffectsN: 'تخص {people}', geOptional: '(اختياري)', geCompanionN: 'اسم المرافق {n}',
});

/** the guest-facing words for domain/guest-experience MEAL_ERROR_TEXT and DIETARY_ERROR_TEXT */
export const MEAL_ERROR_KEY = { unknown_option: 'geUnknown', duplicate: 'geDuplicate', not_whole: 'geNotWhole', sum_mismatch: 'geSumMismatch', sum_over: 'geSumOver' } as const;
export const DIETARY_ERROR_KEY = { affected_range: 'geAffected', other_needs_note: 'geOtherNote', needs_without_answer: 'geNeedsNoAnswer' } as const;

/** t(DIET_KEY[need]) — the words for domain/guest-experience DIETARY (which keeps the groups) */
export const DIET_KEY = {
  nuts: 'dtNuts', dairy: 'dtDairy', gluten: 'dtGluten', eggs: 'dtEggs', seafood: 'dtSeafood', halal: 'dtHalal', vegetarian: 'dtVeg', vegan: 'dtVegan', other: 'dtOther',
} as const;
/** t(GIFT_KEY[kind].label / .hint / .link) — the words for GIFT_KIND */
export const GIFT_KEY = {
  gift: { label: 'gkGift', hint: 'gkGiftHint', link: 'gkGiftLink' },
  contribution: { label: 'gkContribution', hint: 'gkContributionHint', link: 'gkContributionLink' },
  flowers: { label: 'gkFlowers', hint: 'gkFlowersHint', link: 'gkFlowersLink' },
} as const;
