export interface CardMotionHandle { replay(): void; revert(): void; readonly timeline: unknown }
export declare const BEATS: Record<string, number>;
export declare function playCardMotion(root: Element | null, opts?: { reduced?: boolean; onDone?: () => void }): CardMotionHandle;
