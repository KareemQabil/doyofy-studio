/**
 * Relative time and the countdown («قبل ساعتين»، «بعد 9 أيام») in each voice. domain/format reads these directly
 * (it sits below copy.ts), so this file only imports the group helper.
 */
import { voiced } from './group';
import type { PluralForms } from '../format';

export const TIME = voiced({
  tmNow: 'الآن', tmAgo: 'قبل {t}', tmYesterday: 'أمس', tmToday: 'اليوم', tmTomorrow: 'غدًا', tmIn: 'بعد {t}', tmSince: 'منذ {t}',
}, {
  tmNow: 'دلوقتي', tmAgo: 'من {t}', tmYesterday: 'امبارح', tmToday: 'النهارده', tmTomorrow: 'بكرة', tmIn: 'بعد {t}', tmSince: 'من {t}',
}, {
  tmNow: 'الحين', tmAgo: 'قبل {t}', tmYesterday: 'أمس', tmToday: 'اليوم', tmTomorrow: 'بكرة', tmIn: 'بعد {t}', tmSince: 'قبل {t}',
});

/** spoken counts of minutes, hours and days («5 دقايق»، «ساعتين»، «15 يوم») */
export const SPOKEN_TIME: Record<'ar-EG' | 'ar-SA', Record<'minute' | 'hour' | 'day', PluralForms>> = {
  'ar-EG': {
    minute: { zero: 'دلوقتي', one: 'دقيقة', two: 'دقيقتين', few: '# دقايق', many: '# دقيقة', other: '# دقيقة' },
    hour: { zero: 'دلوقتي', one: 'ساعة', two: 'ساعتين', few: '# ساعات', many: '# ساعة', other: '# ساعة' },
    day: { zero: 'النهارده', one: 'يوم', two: 'يومين', few: '# أيام', many: '# يوم', other: '# يوم' },
  },
  'ar-SA': {
    minute: { zero: 'الحين', one: 'دقيقة', two: 'دقيقتين', few: '# دقايق', many: '# دقيقة', other: '# دقيقة' },
    hour: { zero: 'الحين', one: 'ساعة', two: 'ساعتين', few: '# ساعات', many: '# ساعة', other: '# ساعة' },
    day: { zero: 'اليوم', one: 'يوم', two: 'يومين', few: '# أيام', many: '# يوم', other: '# يوم' },
  },
};
