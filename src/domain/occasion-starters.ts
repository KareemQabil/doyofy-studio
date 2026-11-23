/**
 * Occasion-specific starting point for a new invitation: its own (featured) design and one Arabic invitation line.
 * Nothing else is written for the organizer: no English line and no programme (guests only ever see what the
 * organizer wrote, or this one line in the invitation's own language). Saved drafts remain the organizer's own.
 */
import type { EventType } from './types';

interface OccasionStarter {
  presetId: string;
  /** the invitation's opening line, in Arabic (editable) */
  message: string;
}

export const OCCASION_STARTERS: Record<EventType, OccasionStarter> = {
  wedding: {
    presetId: 'rose-garden-silk',
    message: 'يسعدنا أن تشاركونا فرحتنا، في مساءٍ نحتفظ بتفاصيله مع من نحب.',
  },
  engagement: {
    presetId: 'two-rings-petals',
    message: 'بداية حكايتنا أجمل بوجودكم. ندعوكم لمشاركتنا فرحة الخطوبة.',
  },
  katb_kitab: {
    presetId: 'seal-arch-palace',
    message: 'بكل حب ندعوكم لتشهدوا عقد قراننا وتشاركونا دعاءكم وفرحتنا.',
  },
  henna: {
    presetId: 'henna-rosette-palace',
    message: 'ليلة حنة وبهجة ولمّة أحبة. حضوركم يكمل فرحتنا.',
  },
  birthday: {
    presetId: 'balloons-clay',
    message: 'سنة جديدة وذكريات أجمل معكم. تعالوا نحتفل بعيد الميلاد معًا.',
  },
  graduation: {
    presetId: 'cap-diamond-marble',
    message: 'خطوة اكتملت وأفق جديد يبدأ. يسعدنا أن تشاركونا فرحة التخرج.',
  },
  newborn: {
    presetId: 'moon-cloud-silk',
    message: 'ضيف صغير وفرحة كبيرة. ندعوكم للاحتفاء بمولودنا ومشاركتنا هذه البداية الجميلة.',
  },
  family: {
    presetId: 'dallah-olive-garden',
    message: 'اللمّة تحلو بأهلها. ننتظركم على مائدة تجمعنا وحديث يطول مع من نحب.',
  },
  iftar: {
    presetId: 'lantern-night-palace',
    message: 'رمضان يجمعنا، ومائدتنا تحلو بوجودكم. يسعدنا أن تشاركونا الإفطار.',
  },
  conference: {
    presetId: 'forum-stars-marble',
    message: 'أفكار تستحق اللقاء وحوار يفتح آفاقًا جديدة. ندعوكم للمشاركة في هذا المؤتمر.',
  },
  opening: {
    presetId: 'satin-ribbon-palace',
    message: 'نفتح بابًا جديدًا، ويسعدنا أن تكونوا جزءًا من البداية. ندعوكم لحفل الافتتاح.',
  },
  corporate: {
    presetId: 'laurel-gala-candlelit',
    message: 'نلتقي لنحتفي بما أنجزناه ونصنع ما يأتي. يسعدنا حضوركم ومشاركتكم هذا اللقاء.',
  },
  other: {
    presetId: 'eucalyptus-garden',
    message: 'لحظة تستحق أن نجتمع لها. يسعدنا حضوركم ومشاركتكم هذه المناسبة.',
  },
};

/** Labels for the bilingual card and exported calendar entry. */
export const OCCASION_LABELS_EN: Record<EventType, string> = {
  wedding: 'Wedding', engagement: 'Engagement', katb_kitab: 'Marriage ceremony', henna: 'Henna night',
  birthday: 'Birthday', graduation: 'Graduation', newborn: 'Newborn celebration', family: 'Family gathering',
  iftar: 'Ramadan iftar', conference: 'Conference', opening: 'Grand opening', corporate: 'Team gathering', other: 'Celebration',
};
