/** Errors carry a code the UI can recover from and a human Arabic message (spec §32: no "something went wrong"). */
export type ErrorCode = 'not_found' | 'validation' | 'conflict' | 'network' | 'not_published' | 'storage' | 'forbidden';

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly field?: string;
  constructor(code: ErrorCode, message: string, field?: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.field = field;
  }
}

export const isAppError = (e: unknown): e is AppError => e instanceof AppError;

export function errorMessage(e: unknown): string {
  if (isAppError(e)) return e.message;
  return 'تعذر إكمال العملية. تحقق من الاتصال ثم أعد المحاولة.';
}
