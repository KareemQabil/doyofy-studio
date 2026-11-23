/** Guest capacity, the demo checkout and its receipts. Every amount here is a demo: «تجريبي» says so once. */
import { voiced } from './group';

export const BILLING = voiced({
  capLeft: 'المتبقي {people}. السعة تشمل المرافقين.', capNear: 'اقتربت من حد مناسبتك: المتبقي {people}. زِد السعة قبل أن تحتاجها.', capFull: 'وصلت إلى حد مناسبتك. لإضافة ضيوف أو مرافقين زِد السعة أولًا.',
  capOver: 'القائمة أكبر من حد المناسبة. قلّل العدد أو زِد السعة.', capLabel: 'سعة الضيوف', capUsed: 'سعة الضيوف المستخدمة', capOwner: ' زيادة السعة لصاحب المناسبة.', capOf: 'من {people}',
  upFailed: 'تعذّر الدفع التجريبي. لم تتغير السعة أو قائمة الضيوف.', upResumeTitle: 'زِد السعة لإكمال الإضافة', upCheckout: 'مراجعة الدفع', upDone: 'تمت زيادة السعة', upFull: 'السعة ممتلئة',
  upChoose: 'اختر السعة', upBest: 'الأنسب لك', upWillBe: 'سعة مناسبتك ستصبح {people}', upCurrent: 'الحد الحالي', upPrice: 'سعر الباقة', upPaidBefore: 'مدفوع سابقًا لهذه المناسبة', upDiff: 'الفرق المستحق الآن', upDue: 'المبلغ المستحق',
  upNotPaid: 'لم ينجح الدفع', upTryAgain: 'يمكنك المحاولة مرة أخرى أو تغيير الباقة.', upNewLimit: 'أصبح حدّ مناسبتك {people}',
  rcPlan: 'الباقة', rcCapacity: 'سعة {people}', rcWas: ' · كانت {people}', rcPrice: 'سعر الباقة', rcPaidBefore: 'مدفوع سابقًا', rcDiffDemo: 'الفرق المدفوع (تجريبي)', rcAmountDemo: 'المبلغ (تجريبي)', rcDate: 'التاريخ', rcRef: 'المرجع',
  rcNote: 'إيصال تجريبي، لم يُخصم أي مبلغ، ولا يصلح إثباتًا للدفع.', rcTitle: 'إيصال زيادة السعة', rcNone: 'لا مدفوعات لهذه المناسبة. أول {people} مجانًا.', rcList: 'إيصالات زيادة السعة', rcDemo: 'تجريبي',
}, {
  capLeft: 'فاضل {people}. السعة بتشمل اللي مع الضيوف.', capNear: 'قرّبت من حد مناسبتك: فاضل {people}. زوّد السعة قبل ما تحتاجها.', capFull: 'وصلت لحد مناسبتك. عشان تضيف ضيوف زوّد السعة الأول.',
  capOver: 'القايمة أكبر من حد المناسبة. قلّل العدد أو زوّد السعة.', capLabel: 'سعة الضيوف', capUsed: 'سعة الضيوف المستخدمة', capOwner: ' زيادة السعة لصاحب المناسبة.', capOf: 'من {people}',
  upFailed: 'الدفع التجريبي ما نفعش. السعة وقايمة الضيوف ما اتغيروش.', upResumeTitle: 'زوّد السعة عشان تكمّل الإضافة', upCheckout: 'راجع الدفع', upDone: 'السعة زادت', upFull: 'السعة مليانة',
  upChoose: 'اختار السعة', upBest: 'الأنسب ليك', upWillBe: 'سعة مناسبتك هتبقى {people}', upCurrent: 'الحد الحالي', upPrice: 'سعر الباقة', upPaidBefore: 'اللي دفعته قبل كده للمناسبة دي', upDiff: 'الفرق المطلوب دلوقتي', upDue: 'المبلغ المطلوب',
  upNotPaid: 'الدفع ما نجحش', upTryAgain: 'تقدر تجرّب تاني أو تغيّر الباقة.', upNewLimit: 'حد مناسبتك بقى {people}',
  rcPlan: 'الباقة', rcCapacity: 'سعة {people}', rcWas: ' · كانت {people}', rcPrice: 'سعر الباقة', rcPaidBefore: 'مدفوع قبل كده', rcDiffDemo: 'الفرق المدفوع (تجريبي)', rcAmountDemo: 'المبلغ (تجريبي)', rcDate: 'التاريخ', rcRef: 'المرجع',
  rcNote: 'إيصال تجريبي، مفيش فلوس اتخصمت، ومينفعش يتاخد إثبات دفع.', rcTitle: 'إيصال زيادة السعة', rcNone: 'مفيش مدفوعات للمناسبة دي. أول {people} ببلاش.', rcList: 'إيصالات زيادة السعة', rcDemo: 'تجريبي',
}, {
  capLeft: 'باقي {people}. السعة تشمل المرافقين.', capNear: 'قرّبت من حد مناسبتك: باقي {people}. زِد السعة قبل لا تحتاجها.', capFull: 'وصلت لحد مناسبتك. عشان تضيف ضيوف زِد السعة أول.',
  capOver: 'القائمة أكبر من حد المناسبة. قلّل العدد أو زِد السعة.', capLabel: 'سعة الضيوف', capUsed: 'سعة الضيوف المستخدمة', capOwner: ' زيادة السعة لصاحب المناسبة.', capOf: 'من {people}',
  upFailed: 'ما زبط الدفع التجريبي. السعة وقائمة الضيوف ما تغيّرت.', upResumeTitle: 'زِد السعة عشان تكمّل الإضافة', upCheckout: 'راجع الدفع', upDone: 'زادت السعة', upFull: 'السعة مليانة',
  upChoose: 'اختر السعة', upBest: 'الأنسب لك', upWillBe: 'سعة مناسبتك بتصير {people}', upCurrent: 'الحد الحالي', upPrice: 'سعر الباقة', upPaidBefore: 'اللي دفعته قبل لهالمناسبة', upDiff: 'الفرق المطلوب الحين', upDue: 'المبلغ المطلوب',
  upNotPaid: 'ما نجح الدفع', upTryAgain: 'تقدر تجرّب مرة ثانية أو تغيّر الباقة.', upNewLimit: 'صار حد مناسبتك {people}',
  rcPlan: 'الباقة', rcCapacity: 'سعة {people}', rcWas: ' · كانت {people}', rcPrice: 'سعر الباقة', rcPaidBefore: 'مدفوع من قبل', rcDiffDemo: 'الفرق المدفوع (تجريبي)', rcAmountDemo: 'المبلغ (تجريبي)', rcDate: 'التاريخ', rcRef: 'المرجع',
  rcNote: 'إيصال تجريبي، ما انخصم أي مبلغ، وما يصلح إثبات دفع.', rcTitle: 'إيصال زيادة السعة', rcNone: 'ما فيه مدفوعات لهالمناسبة. أول {people} مجانًا.', rcList: 'إيصالات زيادة السعة', rcDemo: 'تجريبي',
});
