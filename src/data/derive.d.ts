export type Digits = 'arab' | 'latn';
export declare function digitsOf(value: unknown): Digits;
export declare function localDigits(value: unknown, digits: Digits): string;
export declare function dateSep(digits: unknown): string;
export declare function deriveContent(inv: unknown, opts?: { digits?: Digits }): { c: Record<string, string>; calHref: string; mapHref: string | null; program: Array<{ time: string; dir: 'rtl' | 'ltr'; ar: string; en: string }>; start: number; digits: Digits };
export declare function countdown(startMs: number, now?: number): { days: number; h: string; m: string; s: string };
