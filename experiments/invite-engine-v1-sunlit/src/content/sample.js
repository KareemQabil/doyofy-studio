// Sample wedding content. Nothing wedding-specific lives in design code: every card, page
// and finale reads from an object shaped like this one.
export const sampleContent = {
  language: 'ar',               // primary language
  secondaryLanguage: 'en',      // null for single-language invitations
  rtl: true,
  couple: {
    personA: { ar: 'سارة', en: 'Sara' },
    personB: { ar: 'أحمد', en: 'Ahmed' },
    monogram: { ar: ['س', 'أ'], en: ['S', 'A'] },
  },
  families: {
    ar: 'بمباركة عائلتيهما',
    en: 'Together with their families',
  },
  message: {
    ar: 'يسعدنا أن تشاركونا بداية حكايتنا، في مساءٍ نحتفظ بتفاصيله مع من نحب.',
    en: 'Join us as our story begins, on an evening we will treasure with the people we love.',
  },
  quote: {
    ar: 'وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً',
    en: 'And He placed between you affection and mercy.',
  },
  date: '2027-08-12T19:00:00',    // local time at the venue
  endDate: '2027-08-13T00:00:00',
  timezone: 'Africa/Cairo',
  showHijri: true,
  venue: {
    name: { ar: 'قاعة المارغولد الكبرى', en: 'The Grand Marigold Hall' },
    address: { ar: 'القاهرة الجديدة', en: 'New Cairo' },
    city: { ar: 'القاهرة', en: 'Cairo' },
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Grand%20Marigold%20Hall%20Cairo',
  },
  program: [
    { time: '19:00', title: { ar: 'استقبال الضيوف', en: 'Welcome of guests' } },
    { time: '20:00', title: { ar: 'الزفّة', en: 'The Zaffa' } },
    { time: '21:00', title: { ar: 'العشاء', en: 'Dinner' } },
    { time: '22:30', title: { ar: 'الاحتفال', en: 'Celebration & cake' } },
  ],
  dressCode: { ar: 'رسمي — بألوان ترابية هادئة', en: 'Formal — soft, earthy tones' },
  notes: { ar: '', en: '' },
  contacts: [],
  photos: [],
  rsvp: {
    enabled: true,
    deadline: '2027-07-25',
    maxGuests: 6,
    fields: { phone: true, notes: true },
  },
};
