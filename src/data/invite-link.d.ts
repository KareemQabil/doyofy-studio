export interface InviteConfig { v?: 1; experience: { dimension: '3d' | '2d'; motion: 'animated' | 'static' }; card: string; scene: string; invitation: unknown }
export function encodeConfig(cfg: InviteConfig): string;
export function decodeConfig(s: string): (InviteConfig & { v: 1 }) | null;
