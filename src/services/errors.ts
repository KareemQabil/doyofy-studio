/** Errors carry a code the UI can recover from and a human Arabic message (spec §32: no "something went wrong"). */
import { copyFor, fill, type Dialect } from '../domain/copy';
import { ERRORS } from '../domain/copy/ui';
import { currentDialect } from '../data/copy-preference.js';

export type ErrorCode = 'not_found' | 'validation' | 'conflict' | 'network' | 'not_published' | 'storage' | 'forbidden';
export type ErrorKey = keyof typeof ERRORS.modern;
type Vars = Readonly<Record<string, string | number>>;

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly field?: string;
  /** the dictionary line behind the message, so the UI can say it in the organizer's voice */
  readonly copy?: { key: ErrorKey; vars?: Vars };
  constructor(code: ErrorCode, message: string, field?: string, copy?: { key: ErrorKey; vars?: Vars }) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.field = field;
    this.copy = copy;
  }
}

/** a service error from the dictionary: the message stays modern Arabic (logs, tests); errorMessage() voices it */
export const copyError = (code: ErrorCode, key: ErrorKey, opts: { vars?: Vars; field?: string } = {}): AppError =>
  new AppError(code, fill(ERRORS.modern[key], opts.vars), opts.field, { key, vars: opts.vars });

export const isAppError = (e: unknown): e is AppError => e instanceof AppError;

/** modern line → key, for errors raised with a dictionary line as plain text (e.g. the remote client's local checks) */
const BY_TEXT = new Map<string, ErrorKey>(Object.entries(ERRORS.modern).map(([k, v]) => [v, k as ErrorKey]));

/** the message in the organizer's voice (this device's preference unless a voice is given) */
export function errorMessage(e: unknown, dialect: Dialect = currentDialect() as Dialect): string {
  if (e instanceof Error && e.name === 'GuestLimitError') return e.message;
  const c = copyFor(dialect);
  if (isAppError(e)) {
    const key = e.copy?.key ?? BY_TEXT.get(e.message);
    return key ? fill(c[key], e.copy?.vars) : e.message;
  }
  return c.uiGenericError;
}
