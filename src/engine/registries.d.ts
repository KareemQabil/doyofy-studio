export interface CardModule { id: string; name: string; tags: string[]; compat: { recommended: string[] }; theme: Record<string, string>; render(c: Record<string, string>): string }
export interface SceneModule { id: string; name: string; renderers: Array<{ mode: string }>; compat: { recommended?: string[] } }
interface Reg<T> { get(id: string): T; has(id: string | null): boolean; list(): T[] }
export declare const CardRegistry: Reg<CardModule>;
export declare const SceneRegistry: Reg<SceneModule>;
