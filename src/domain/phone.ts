/**
 * Phone numbers: accept what people actually type or export from Excel (Arabic digits, spaces,
 * dashes, 05…, 00966…, +966…) and normalise to E.164. Saudi Arabia is the default country for
 * local numbers (D-005). Egypt and the GCC are recognised by their prefixes.
 */
import { toArabicDigitsSafe } from './format';

export type PhoneResult =
  | { ok: true; e164: string }
  | { ok: false; reason: 'empty' | 'malformed' };

const COUNTRY_RULES: Array<{ cc: string; national: RegExp }> = [
  { cc: '966', national: /^5\d{8}$/ },          // Saudi mobile
  { cc: '20', national: /^1[0125]\d{8}$/ },      // Egypt mobile
  { cc: '971', national: /^5\d{8}$/ },          // UAE
  { cc: '965', national: /^[569]\d{7}$/ },      // Kuwait
  { cc: '974', national: /^[3567]\d{7}$/ },     // Qatar
  { cc: '973', national: /^3\d{7}$/ },          // Bahrain
  { cc: '968', national: /^[79]\d{7}$/ },       // Oman
  { cc: '962', national: /^7[789]\d{7}$/ },     // Jordan
];

export function normalisePhone(raw: string | undefined | null, defaultCc = '966'): PhoneResult {
  if (raw == null) return { ok: false, reason: 'empty' };
  let s = toArabicDigitsSafe(String(raw)).trim();
  if (!s) return { ok: false, reason: 'empty' };
  // Excel sometimes exports numbers as 9.66501E+11 or with a trailing .0
  if (/^\d+\.0$/.test(s)) s = s.slice(0, -2);
  if (/[a-zA-Z؀-ۿ]/.test(s.replace(/[٠-٩]/g, ''))) return { ok: false, reason: 'malformed' };
  const plus = s.startsWith('+');
  let digits = s.replace(/\D/g, '');
  if (!digits) return { ok: false, reason: 'malformed' };
  if (!plus && digits.startsWith('00')) digits = digits.slice(2);
  else if (!plus) {
    // local formats: 05XXXXXXXX (KSA), 01XXXXXXXXX (Egypt), 5XXXXXXXX
    if (/^05\d{8}$/.test(digits)) digits = '966' + digits.slice(1);
    else if (/^01[0125]\d{8}$/.test(digits)) digits = '20' + digits.slice(1);
    else if (/^5\d{8}$/.test(digits)) digits = defaultCc + digits;
  }
  for (const r of COUNTRY_RULES) {
    if (digits.startsWith(r.cc)) {
      const national = digits.slice(r.cc.length).replace(/^0/, '');
      return r.national.test(national) ? { ok: true, e164: `+${r.cc}${national}` } : { ok: false, reason: 'malformed' };
    }
  }
  // other countries: plausible E.164 length when written with + or 00
  if ((plus || String(raw).trim().startsWith('00')) && digits.length >= 8 && digits.length <= 15) return { ok: true, e164: `+${digits}` };
  return { ok: false, reason: 'malformed' };
}
