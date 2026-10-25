/** Occasion-specific content for a new invitation. Saved drafts remain the organizer's own. */
import type { EventType } from './types';

interface OccasionStarter {
  presetId: string;
  message: { ar: string; en: string };
  /** Offsets in minutes from the event start; all times remain editable. */
  program: Array<{ after: number; ar: string; en: string }>;
}

export const OCCASION_STARTERS: Record<EventType, OccasionStarter> = {
  wedding: {
    presetId: 'wedding-vow-silk',
    message: { ar: 'يسعدنا أن تشاركونا فرحتنا، في مساءٍ نحتفظ بتفاصيله مع من نحب.', en: 'Join us to celebrate, on an evening we will treasure with the people we love.' },
    program: [{ after: 0, ar: 'استقبال الضيوف', en: 'Welcome of guests' }, { after: 60, ar: 'الزفّة', en: 'The Zaffa' }, { after: 120, ar: 'العشاء', en: 'Dinner' }],
  },
  engagement: {
    presetId: 'engagement-rings-petals',
    message: { ar: 'بداية حكايتنا أجمل بوجودكم. ندعوكم لمشاركتنا فرحة الخطوبة.', en: 'Our story begins with the people we love. Join us to celebrate our engagement.' },
    program: [{ after: 0, ar: 'استقبال الأحبة', en: 'Welcome' }, { after: 60, ar: 'لحظة الخطوبة', en: 'Engagement celebration' }, { after: 120, ar: 'الضيافة', en: 'Refreshments' }],
  },
  katb_kitab: {
    presetId: 'katb-seal-palace',
    message: { ar: 'بكل حب ندعوكم لتشهدوا عقد قراننا وتشاركونا دعاءكم وفرحتنا.', en: 'With love, we invite you to witness our marriage ceremony and share our joy.' },
    program: [{ after: 0, ar: 'استقبال الضيوف', en: 'Welcome' }, { after: 30, ar: 'عقد القران', en: 'Marriage ceremony' }, { after: 90, ar: 'التهاني والضيافة', en: 'Congratulations and refreshments' }],
  },
  henna: {
    presetId: 'henna-lattice-palace',
    message: { ar: 'ليلة حنة وبهجة ولمّة أحبة. حضوركم يكمل فرحتنا.', en: 'An evening of henna, joy and loved ones. Your presence makes it complete.' },
    program: [{ after: 0, ar: 'استقبال الأحبة', en: 'Welcome' }, { after: 60, ar: 'نقش الحنة', en: 'Henna gathering' }, { after: 120, ar: 'الضيافة', en: 'Refreshments' }],
  },
  birthday: {
    presetId: 'birthday-confetti-clay',
    message: { ar: 'سنة جديدة وذكريات أجمل معكم. تعالوا نحتفل بعيد الميلاد معًا.', en: 'A new year of life and new memories together. Join our birthday celebration.' },
    program: [{ after: 0, ar: 'استقبال الأصدقاء', en: 'Welcome' }, { after: 60, ar: 'وقت الكعكة', en: 'Birthday cake' }, { after: 90, ar: 'صور وذكريات', en: 'Photos and memories' }],
  },
  graduation: {
    presetId: 'sig-diploma-marble',
    message: { ar: 'خطوة اكتملت وأفق جديد يبدأ. يسعدنا أن تشاركونا فرحة التخرج.', en: 'One chapter completed, a new horizon ahead. Join us to celebrate graduation.' },
    program: [{ after: 0, ar: 'استقبال الضيوف', en: 'Welcome' }, { after: 45, ar: 'الاحتفاء بالخريجين', en: 'Graduation celebration' }, { after: 90, ar: 'صور وتهانٍ', en: 'Photos and congratulations' }],
  },
  newborn: {
    presetId: 'newborn-moon-silk',
    message: { ar: 'ضيف صغير وفرحة كبيرة. ندعوكم للاحتفاء بمولودنا ومشاركتنا هذه البداية الجميلة.', en: 'A little arrival, a great joy. Join us to welcome our newborn and celebrate this beautiful beginning.' },
    program: [{ after: 0, ar: 'استقبال الأحبة', en: 'Welcome' }, { after: 30, ar: 'التهاني والضيافة', en: 'Congratulations and refreshments' }],
  },
  family: {
    presetId: 'family-table-garden',
    message: { ar: 'اللمّة تحلو بأهلها. ننتظركم على مائدة تجمعنا وحديث يطول مع من نحب.', en: 'A gathering is made by its people. Join us for a shared meal and time with loved ones.' },
    program: [{ after: 0, ar: 'لمّة الأهل', en: 'Family welcome' }, { after: 60, ar: 'على مائدة واحدة', en: 'Shared meal' }],
  },
  iftar: {
    presetId: 'iftar-arch-palace',
    message: { ar: 'رمضان يجمعنا، ومائدتنا تحلو بوجودكم. يسعدنا أن تشاركونا الإفطار.', en: 'Ramadan brings us together. We would be delighted to share iftar with you.' },
    // The organizer's event time is the meal time; do not fabricate a sunset/prayer time.
    program: [{ after: 0, ar: 'مائدة الإفطار', en: 'Iftar meal' }, { after: 60, ar: 'قهوة وحديث', en: 'Coffee and conversation' }],
  },
  conference: {
    presetId: 'forum-grid-marble',
    message: { ar: 'أفكار تستحق اللقاء وحوار يفتح آفاقًا جديدة. ندعوكم للمشاركة في هذا المؤتمر.', en: 'Ideas worth sharing and conversations that open new horizons. Join us at the conference.' },
    program: [{ after: 0, ar: 'التسجيل والاستقبال', en: 'Registration and welcome' }, { after: 30, ar: 'الجلسة الافتتاحية', en: 'Opening session' }, { after: 90, ar: 'حوار وتواصل', en: 'Discussion and networking' }],
  },
  opening: {
    presetId: 'opening-door-palace',
    message: { ar: 'نفتح بابًا جديدًا، ويسعدنا أن تكونوا جزءًا من البداية. ندعوكم لحفل الافتتاح.', en: 'A new door opens, and we would love you to be part of the beginning. Join our opening celebration.' },
    program: [{ after: 0, ar: 'استقبال الضيوف', en: 'Welcome' }, { after: 30, ar: 'لحظة الافتتاح', en: 'Opening celebration' }, { after: 60, ar: 'جولة وضيافة', en: 'Tour and refreshments' }],
  },
  corporate: {
    presetId: 'corporate-edition-marble',
    message: { ar: 'نلتقي لنحتفي بما أنجزناه ونصنع ما يأتي. يسعدنا حضوركم ومشاركتكم هذا اللقاء.', en: 'Together, we celebrate what we have achieved and look ahead. Join us for this team gathering.' },
    program: [{ after: 0, ar: 'الاستقبال والتعارف', en: 'Welcome and introductions' }, { after: 45, ar: 'لقاء الفريق', en: 'Team gathering' }, { after: 90, ar: 'تواصل وضيافة', en: 'Networking and refreshments' }],
  },
  other: {
    presetId: 'celebration-shapes-clay',
    message: { ar: 'لحظة تستحق أن نجتمع لها. يسعدنا حضوركم ومشاركتكم هذه المناسبة.', en: 'A moment worth coming together for. We would be delighted to have you join us.' },
    program: [{ after: 0, ar: 'استقبال الضيوف', en: 'Welcome' }, { after: 60, ar: 'بداية المناسبة', en: 'Event begins' }],
  },
};

/** Labels for the bilingual card and exported calendar entry. */
export const OCCASION_LABELS_EN: Record<EventType, string> = {
  wedding: 'Wedding', engagement: 'Engagement', katb_kitab: 'Marriage ceremony', henna: 'Henna night',
  birthday: 'Birthday', graduation: 'Graduation', newborn: 'Newborn celebration', family: 'Family gathering',
  iftar: 'Ramadan iftar', conference: 'Conference', opening: 'Grand opening', corporate: 'Team gathering', other: 'Celebration',
};
