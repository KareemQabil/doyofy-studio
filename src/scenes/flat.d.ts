export declare const FLAT_SCENES: Record<string, { name: string; field: string; tone: 'light' | 'dark' | 'warm'; motif: () => string }>;
export declare const SCENE_IDS: string[];
export declare function flatSceneHtml(id: string): string;
