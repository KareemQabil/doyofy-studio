/**
 * HTTP / PostgREST / RPC-envelope failures → AppError (services/errors.ts).
 * The database speaks in stable machine reasons (backend/supabase/migrations/0001_doyofy_init.sql);
 * the Arabic text lives here so wording stays with the client, like the mock's messages.
 */
import { AppError, type ErrorCode } from '../errors';
import { RSVP_ERROR_TEXT } from '../../domain/parties';

const CODES: ReadonlySet<string> = new Set<ErrorCode>(['not_found', 'validation', 'conflict', 'network', 'not_published', 'storage', 'forbidden']);

export const REASON_TEXT: Record<string, string> = {
  // public guest path (same wording as services/mock/repositories.ts)
  unknown_event: 'هذه الدعوة غير موجودة. تأكد من الرابط مع صاحب الدعوة.',
  not_published: 'الدعوة غير متاحة بعد. سيشاركها صاحب المناسبة قريبًا.',
  unknown_code: 'رابط الدعوة غير صحيح أو أُلغي. تواصل مع صاحب الدعوة.',
  personal_only: 'هذه الدعوة شخصية. استخدم الرابط الذي وصلك من صاحب الدعوة.',
  rsvp_closed: 'انتهى وقت الرد على هذه الدعوة.',
  name_required: 'اكتب اسمك ليعرف صاحب الدعوة من رد.',
  name_too_long: 'الاسم طويل جدًا.',
  note_too_long: 'الملاحظة طويلة جدًا (500 حرف كحد أقصى).',
  attending_required: 'اختر: سأحضر أو أعتذر.',
  count_too_low: RSVP_ERROR_TEXT.count_too_low,
  count_exceeds_allowed: RSVP_ERROR_TEXT.count_exceeds_allowed,
  no_count: RSVP_ERROR_TEXT.no_count,
  too_many_requests: 'محاولات كثيرة خلال وقت قصير. انتظر قليلًا ثم أعد المحاولة.',
  too_many_wrong_codes: 'محاولات كثيرة برمز غير صحيح. انتظر ربع ساعة ثم أعد المحاولة بالرابط الذي وصلك.',
  too_many_unmatched: 'استقبلت هذه الدعوة ردودًا كثيرة عبر الرابط العام. تواصل مع صاحب الدعوة مباشرة.',
  // organizer / gate
  not_authenticated: 'انتهت الجلسة. سجّل الدخول من جديد.',
  not_a_member: 'ليست لديك صلاحية على هذه المناسبة.',
  organizer_only: 'هذا الإجراء متاح لصاحب المناسبة فقط.',
  immutable_field: 'لا يمكن تعديل هذا الحقل.',
  invalid_time_zone: 'المنطقة الزمنية غير معروفة.',
  event_not_found: 'لم نجد هذه المناسبة. ربما حُذفت أو أن الرابط غير صحيح.',
  party_not_found: 'لم نجد هذا الضيف في القائمة. ربما حُذف.',
  response_not_found: 'لم نجد هذا الرد.',
  response_already_resolved: 'تمت معالجة هذا الرد من قبل.',
  check_in_not_found: 'لم نجد تسجيل الدخول هذا.',
  already_undone: 'تم التراجع عن هذا التسجيل من قبل.',
  exceptions_not_acknowledged: 'تغيرت حالة هذه الدعوة منذ فتحها (ربما سُجّل دخولها من بوابة أخرى). راجع التنبيهات ثم أكد من جديد.',
  idempotency_key_reused: 'تعارض في تسجيل الدخول. أعد فتح الدعوة ثم سجّل من جديد.',
  idempotency_key_invalid: 'تعذر تسجيل الدخول. أعد المحاولة.',
  check_in_count_invalid: 'اختر عدد القادمين الآن.',
  check_in_method_invalid: 'طريقة التسجيل غير معروفة.',
  event_archived: 'المناسبة مؤرشفة. استعدها أولًا.',
  draft_revision_conflict: 'عُدّلت الدعوة من جهاز آخر. حدّث الصفحة لترى آخر نسخة قبل الحفظ أو النشر.',
  nothing_to_publish: 'لا توجد مسودة للنشر بعد.',
  design_invalid: 'تعذر حفظ التصميم: البيانات غير مكتملة.',
  seat_requires_confirmed: 'يمكن توزيع الدعوات المؤكدة فقط.',
  mixed_events: 'اختر ضيوفًا من مناسبة واحدة.',
  import_rows_invalid: 'ملف الاستيراد غير صالح.',
  import_empty: 'لا توجد صفوف للاستيراد.',
  import_too_large: 'الملف كبير جدًا: 2000 ضيف كحد أقصى في المرة الواحدة.',
  code_space_exhausted: 'تعذر إنشاء رمز دعوة. أعد المحاولة.',
  messaging_not_configured: 'الإرسال التلقائي عبر واتساب غير مفعّل بعد. شارك الرابط بنفسك ثم حدده كمُرسل.',
  slug_taken: 'تعذر إنشاء رابط فريد للمناسبة. أعد المحاولة.',
  // generic
  session_expired: 'انتهت الجلسة. سجّل الدخول من جديد.',
  forbidden: 'ليست لديك صلاحية لهذا الإجراء.',
  not_found: 'لم نجد ما تبحث عنه. ربما حُذف.',
  validation: 'بعض البيانات غير صحيحة. راجعها ثم أعد المحاولة.',
  conflict: 'تغيّرت البيانات أثناء العملية. حدّث الصفحة ثم أعد المحاولة.',
  network: 'لا يوجد اتصال الآن. لم يتم حفظ أي تغيير — أعد المحاولة بعد عودة الاتصال.',
  unavailable: 'الخدمة غير متاحة مؤقتًا. أعد المحاولة بعد قليل.',
};

const REASON_FIELD: Record<string, string> = {
  count_too_low: 'count', count_exceeds_allowed: 'count', no_count: 'count', check_in_count_invalid: 'count',
  name_required: 'name', name_too_long: 'name', note_too_long: 'note',
};

/** check-constraint name → [field, message] for direct table writes */
const CONSTRAINT_TEXT: Record<string, [string, string]> = {
  parties_phone_check: ['phone', 'رقم الجوال غير صحيح. مثال: 0551234567 أو ‎+966551234567'],
  parties_max_party_size_check: ['maxPartySize', 'العدد المسموح بين 1 و20.'],
  parties_primary_guest_name_check: ['primaryGuestName', 'اكتب اسم الضيف أو العائلة.'],
  seating_tables_capacity_check: ['capacity', 'السعة بين 1 و60.'],
  seating_tables_name_check: ['name', 'اكتب اسم الطاولة'],
};

const asCode = (s: unknown): ErrorCode | null => (typeof s === 'string' && CODES.has(s) ? (s as ErrorCode) : null);

/** An AppError (instanceof works everywhere) that also carries the server's machine reason. */
export class RemoteAppError extends AppError {
  readonly reason: string;
  constructor(code: ErrorCode, message: string, field: string | undefined, reason: string) {
    super(code, message, field);
    this.reason = reason;
  }
}

export function appError(code: ErrorCode, reason: string): RemoteAppError {
  return new RemoteAppError(code, REASON_TEXT[reason] ?? REASON_TEXT[code] ?? REASON_TEXT.validation!, REASON_FIELD[reason], reason);
}

export const reasonOf = (e: unknown): string | undefined => (e instanceof RemoteAppError ? e.reason : undefined);

export const networkError = (): AppError => appError('network', 'network');

/** public guest RPCs answer {ok:false, code, reason, status} instead of raising (rate-limit counters must commit) */
export function appErrorFromEnvelope(env: { code?: unknown; reason?: unknown }): AppError {
  const code = asCode(env.code);
  const reason = typeof env.reason === 'string' ? env.reason : '';
  if (env.code === 'rate_limited') return appError('conflict', reason || 'too_many_requests');
  return appError(code ?? 'validation', reason || (code ?? 'validation'));
}

interface PgErrorBody { code?: unknown; message?: unknown; details?: unknown; hint?: unknown; error?: unknown; error_description?: unknown; msg?: unknown }

/** PostgREST error JSON (or GoTrue JSON) + HTTP status → AppError */
export function appErrorFromResponse(status: number, body: unknown): AppError {
  const b: PgErrorBody = body && typeof body === 'object' ? (body as PgErrorBody) : {};
  const pgCode = typeof b.code === 'string' ? b.code : '';
  const message = typeof b.message === 'string' ? b.message : '';
  // 1. our own RAISE: HINT = ErrorCode, MESSAGE = reason
  const hinted = asCode(b.hint);
  if (hinted && message) return appError(hinted, message);
  // 2. Postgres / PostgREST codes
  if (pgCode === '23505') return appError('conflict', 'conflict');
  if (pgCode === '23514') {
    const constraint = Object.keys(CONSTRAINT_TEXT).find((c) => message.includes(c));
    if (constraint) { const [field, text] = CONSTRAINT_TEXT[constraint]!; return new RemoteAppError('validation', text, field, constraint); }
    return appError('validation', 'validation');
  }
  if (['23502', '23503', '22P02', '22023', '22007', '22008', '22001', 'P0001'].includes(pgCode)) return appError('validation', 'validation');
  if (pgCode === '42501') return appError('forbidden', 'forbidden');
  if (pgCode === 'PGRST116') return appError('not_found', 'not_found');
  if (pgCode === 'PGRST301' || pgCode === 'PGRST302' || pgCode === 'PGRST303') return appError('forbidden', 'session_expired');
  // 3. HTTP status
  if (status === 401) return appError('forbidden', 'session_expired');
  if (status === 403) return appError('forbidden', 'forbidden');
  if (status === 404 || status === 406) return appError('not_found', 'not_found');
  if (status === 409) return appError('conflict', 'conflict');
  if (status === 429) return appError('conflict', 'too_many_requests');
  if (status >= 500) return appError('network', 'unavailable');
  return appError('validation', 'validation');
}
