export interface CardMotionHandle { replay(): void; finish(): void; revert(): void; readonly timeline: unknown }
export declare const BEATS: Record<string, number>;
export declare const BREATH: { cycle: number; cycles: number };
export declare const EASES: Record<string, (p: number) => number>;
export declare function cubicBezier(x1: number, y1: number, x2: number, y2: number): (p: number) => number;
export declare function settle(damping: number, turns: number): (p: number) => number;
export declare function scatter(i: number, n: number): number;
export declare function playCardMotion(root: Element | null, opts?: { reduced?: boolean; onDone?: () => void; delay?: number }): CardMotionHandle;
