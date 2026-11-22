/** The replies page: who is pending, recent replies, and general-link replies to match. */
import { partly } from './group';

export const REPLIES = partly({
  rpFromLink: 'من رابطه الشخصي', rpFromGeneral: 'من الرابط العام', rpByYou: 'سجّلتَه يدويًا', rpAdded: 'أضفنا {name} إلى القائمة بحالة «أكد الحضور»', rpDismissed: 'تجاهلنا الرد',
  rpOpened: 'فتحوا الدعوة ولم يردوا', rpOpenedHint: 'الأكثر احتمالًا للرد بعد تذكير لطيف', rpShared: 'أُرسلت ولم تُفتح بعد', rpSharedHint: 'ربما لم تصلهم الرسالة، فتأكد من الرقم', rpUnsent: 'لم تُرسل لهم الدعوة', rpUnsentHint: 'أرسلها أولًا من صفحة الضيوف',
  rpSub: 'ردّت {n} من {all}', rpToMatch: '{n} من الرابط العام تحتاج مطابقة', rpNone: 'لا دعوات بعد', rpNoReplies: 'لا ردود بعد', rpAddGuests: 'أضف الضيوف', rpNoRepliesHint: 'تظهر الردود هنا عندما يرد الضيوف من روابطهم.',
  rpComing: 'سيحضرون', rpComingSub: 'شخصًا · من {n}', rpDeclined: 'اعتذروا', rpInvitations: 'دعوات', rpPending: 'بانتظار الرد', rpRate: 'نسبة الرد', rpRateLine: 'نسبة الرد {pct}٪ · الحد الأقصى لو حضر الجميع {people}',
  rpShow: 'عرض', rpRecent: 'آخر الردود', rpNeedMatch: 'تحتاج مطابقة', rpAllReplied: 'الجميع ردّوا', rpNobodyPending: 'لا أحد بانتظار الرد.', rpCanRemind: '{n} يمكن تذكيرها', rpRemindThem: 'ذكّرهم بالرد',
  rpRemindHow: 'نفتح لك رسالة التذكير لكل ضيف في واتساب أو رسالة نصية، وتؤكد «أرسلتها» بعد إرسالها.', rpAllowed: '{people} مسموح', rpOpenedAt: 'فتحها {when}', rpRemindedAt: 'ذكّرته {when}',
  rpRemindName: 'تذكير {name} بالرد', rpRemind: 'تذكير', rpRecord: 'سجّل الرد', rpWillCome: 'سيحضر · {people}', rpDeclinedOne: 'اعتذر',
  rpNoMatch: 'لا ردود تحتاج مطابقة', rpNoMatchHint: 'ردود الرابط العام تظهر هنا لتربطها بضيف في القائمة.', rpMatchIntro: 'هذه ردود وصلت من الرابط العام بلا اسم محدد. اربط كل رد بدعوة في القائمة، أو أضفه كضيف جديد.',
  rpMatch: 'طابق مع ضيف', rpAddNew: 'أضفه كضيف جديد', rpDismiss: 'تجاهل', rpMatched: 'طابقنا رد {name}', rpMatchTitle: 'مطابقة رد «{name}»', rpMatchSub: '{reply} — اختر دعوته من القائمة',
  rpSearch: 'ابحث في الضيوف الذين لم يردوا', rpNoCandidate: 'لا يوجد ضيف بانتظار الرد يطابق البحث. يمكنك إضافته كضيف جديد.', rpOver: 'العدد أكبر من المسموح',
}, {
  rpByYou: 'إنت سجّلته', rpAdded: 'ضفنا {name} للقايمة على إنه «أكّد حضوره»', rpDismissed: 'تجاهلنا الرد',
  rpOpened: 'فتحوا الدعوة ولسه ما ردّوش', rpOpenedHint: 'غالبًا هيردوا بعد تذكير لطيف', rpShared: 'اتبعتت ولسه ما اتفتحتش', rpSharedHint: 'يمكن الرسالة ما وصلتش، اتأكد من الرقم', rpUnsent: 'الدعوة لسه ما اتبعتتلهمش', rpUnsentHint: 'ابعتها الأول من صفحة الضيوف',
  rpNone: 'لسه مفيش دعوات', rpNoReplies: 'لسه مفيش ردود', rpAddGuests: 'ضيف الضيوف', rpComing: 'جايين', rpPending: 'مستنيين ردهم', rpRecent: 'آخر الردود',
  rpAllReplied: 'الكل ردّ', rpNobodyPending: 'مفيش حد مستني رد.', rpRemindThem: 'فكّرهم بالرد', rpRemind: 'فكّره', rpRecord: 'سجّل الرد', rpWillCome: 'جاي · {people}',
  rpMatch: 'طابقه مع ضيف', rpAddNew: 'ضيفه ضيف جديد', rpDismiss: 'تجاهله', rpMatched: 'طابقنا رد {name}', rpSearch: 'دوّر في الضيوف اللي لسه ما ردّوش',
}, {
  rpByYou: 'أنت سجّلته', rpAdded: 'أضفنا {name} للقائمة على إنه «أكّد حضوره»',
  rpOpened: 'فتحوا الدعوة وما ردّوا', rpOpenedHint: 'غالبًا بيردون بعد تذكير لطيف', rpShared: 'انرسلت وما انفتحت للحين', rpSharedHint: 'يمكن ما وصلتهم الرسالة، تأكد من الرقم', rpUnsent: 'ما انرسلت لهم الدعوة', rpUnsentHint: 'أرسلها أول من صفحة الضيوف',
  rpNone: 'ما فيه دعوات للحين', rpNoReplies: 'ما فيه ردود للحين', rpComing: 'بيحضرون', rpPending: 'ما ردّوا', rpAllReplied: 'الكل ردّ', rpNobodyPending: 'ما أحد ينتظر رد.',
  rpRemindThem: 'ذكّرهم بالرد', rpRemind: 'ذكّره', rpWillCome: 'بيحضر · {people}', rpMatch: 'طابقه مع ضيف', rpAddNew: 'أضفه ضيف جديد', rpSearch: 'دوّر في الضيوف اللي ما ردّوا',
});
