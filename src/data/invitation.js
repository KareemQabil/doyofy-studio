/**
 * InvitationData — the ONLY place invitation-specific content lives.
 *
 * Cards, pages, scenes and the finale consume the derived content (data/derive.js); nothing in
 * rendering code knows about Sara & Ahmed. Replace this object (or pass your own to
 * `createStudio(host, { invitation })`) to make a different invitation.
 *
 * `display` holds hand-written display strings that should win over the Intl-derived defaults
 * (e.g. a spelled-out Arabic time "السابعة مساءً" instead of "٧:٠٠ م"). Every field there is optional.
 */
export const sampleInvitation = {
  id: 'sara-ahmed-2027-08-12',
  locale: { primary: 'ar', secondary: 'en' },
  couple: {
    a: { ar: 'سارة', en: 'Sara', monogram: 'س', initial: 'S' },
    b: { ar: 'أحمد', en: 'Ahmed', monogram: 'أ', initial: 'A' },
  },
  event: {
    start: '2027-08-12T19:00:00+03:00',
    timeZone: 'Africa/Cairo',
    durationHours: 5,
  },
  venue: {
    ar: 'قاعة المارغولد الكبرى',
    en: 'The Grand Marigold Hall',
    city: { ar: 'القاهرة', en: 'Cairo' },
    // optional: exact coordinates or a maps URL; otherwise a search for "venue + city" is used
    mapUrl: null,
  },
  copy: {
    invitation: {
      ar: 'يسعدنا أن تشاركونا بداية حكايتنا، في مساءٍ نحتفظ بتفاصيله مع من نحب.',
      en: 'Join us as our story begins, on an evening we will treasure with the people we love.',
    },
  },
  program: [
    { time: '19:00', ar: 'استقبال الضيوف', en: 'Welcome of guests' },
    { time: '20:00', ar: 'الزفّة', en: 'The Zaffa' },
    { time: '21:00', ar: 'العشاء', en: 'Dinner' },
    { time: '22:30', ar: 'الاحتفال', en: 'Celebration & cake' },
  ],
  rsvp: { minGuests: 1, maxGuests: 8, defaultGuests: 2 },
  // Canonical display strings of the original Studio (kept so the demo is pixel-identical).
  display: {
    dateAr: '١٢ أغسطس ٢٠٢٧',
    timeAr: 'السابعة مساءً',
  },
};
