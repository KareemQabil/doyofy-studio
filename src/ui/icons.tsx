/**
 * Icon set: Phosphor Icons 2.1.1 (MIT, https://phosphoricons.com), vendored as path data by
 * tools/gen-phosphor-icons.mjs into ./vendor-icons/phosphor.ts — no hand-drawn glyphs.
 * The legacy path table below is kept only as the list of icon names (the API every feature uses).
 * Directional icons carry `dir` so they mirror in RTL.
 */
import type { SVGProps } from 'react';
import { UI_GLYPHS, OCCASION_GLYPHS, OCCASION_GLYPHS_THIN, type IconNode } from './vendor-icons/phosphor';

const P: Record<string, string> = {
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z',
  'chevron-up': 'M6 15l6-6 6 6',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  'check-circle': 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8.5 12.5l2.5 2.5 4.5-5',
  alert: 'M12 4l9 16H3L12 4zM12 10v4.5M12 17.2v.1',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8v.1',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  forward: 'M15 6l-6 6 6 6',          // points left (forward in RTL) before mirroring logic: we draw "next in LTR" = right
  back: 'M9 6l6 6-6 6',
  'chevron-down': 'M6 9l6 6 6-6',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 6.8M18 14.6c1.8.6 3.1 2.4 3.5 5.4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c.8-3.8 3.8-6 7.5-6s6.7 2.2 7.5 6',
  calendar: 'M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v10a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-10zM4 10h16M8.5 3v4M15.5 3v4',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5V12l3 2',
  pin: 'M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2',
  copy: 'M9 9.5A1.5 1.5 0 0 1 10.5 8h8A1.5 1.5 0 0 1 20 9.5v9a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 9 18.5v-9zM15 8V5.5A1.5 1.5 0 0 0 13.5 4h-8A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H9',
  share: 'M12 15V4M8 7.5L12 3.5l4 4M5 12v6.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V12',
  send: 'M20.5 3.5L10 14M20.5 3.5l-6.5 17-4-6.5-6.5-4 17-6.5z',
  chat: 'M4.5 19.5l1.2-3.6A7.5 7.5 0 1 1 9 19.1l-4.5.4z',
  phone: 'M6.5 4h3l1.5 4-2 1.3a10 10 0 0 0 5.7 5.7l1.3-2 4 1.5v3a2 2 0 0 1-2 2A15.5 15.5 0 0 1 4.5 6a2 2 0 0 1 2-2z',
  upload: 'M12 16V4M7.5 8.5L12 4l4.5 4.5M4.5 15v3.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V15',
  download: 'M12 4v12M7.5 11.5L12 16l4.5-4.5M4.5 15v3.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V15',
  file: 'M14 3.5H7.5A1.5 1.5 0 0 0 6 5v14a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 19V7.5L14 3.5zM14 3.5V8h4M9 13h6M9 16.5h6',
  table: 'M12 13.5c4.4 0 8-1.6 8-3.5s-3.6-3.5-8-3.5-8 1.6-8 3.5 3.6 3.5 8 3.5zM6 12.6V18M18 12.6V18M12 13.5V20',
  qr: 'M4 4h6v6H4V4zM14 4h6v6h-6V4zM4 14h6v6H4v-6zM14 14h2.5v2.5H14V14zM18 18h2v2h-2v-2zM17.5 14H20v2M14 18.5V20h2',
  scan: 'M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16M4 12h16',
  door: 'M14 4h3.5A1.5 1.5 0 0 1 19 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14M4.5 12H14M10.5 8L14.5 12l-4 4',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 13.5l1.6 1.2-2 3.4-1.9-.7a7.4 7.4 0 0 1-2.3 1.3L14.5 21h-4l-.3-2.3a7.4 7.4 0 0 1-2.3-1.3l-1.9.7-2-3.4 1.6-1.2a7.6 7.6 0 0 1 0-2.9L4 9.3l2-3.4 1.9.7a7.4 7.4 0 0 1 2.3-1.3L10.5 3h4l.3 2.3a7.4 7.4 0 0 1 2.3 1.3l1.9-.7 2 3.4-1.6 1.2a7.6 7.6 0 0 1 0 2.9z',
  home: 'M4 10.5L12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-8.5z',
  sparkle: 'M12 3.5l1.8 4.9 4.9 1.8-4.9 1.8L12 16.9l-1.8-4.9-4.9-1.8 4.9-1.8L12 3.5zM18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z',
  envelope: 'M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-11zM4.5 6.5L12 12.5l7.5-6',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  edit: 'M14.5 5.5l4 4M4 20l1-4.5L15.8 4.7a1.8 1.8 0 0 1 2.5 0l1 1a1.8 1.8 0 0 1 0 2.5L8.5 19 4 20z',
  trash: 'M5 7h14M10 4h4M7 7l.8 11.5A1.6 1.6 0 0 0 9.4 20h5.2a1.6 1.6 0 0 0 1.6-1.5L17 7M10 11v5.5M14 11v5.5',
  more: 'M5.5 12h.1M12 12h.1M18.5 12h.1',
  undo: 'M9 14L4.5 9.5 9 5M5 9.5h9.5a5 5 0 0 1 0 10H11',
  refresh: 'M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4',
  archive: 'M4 5h16v4H4V5zM5.5 9v9.5A1.5 1.5 0 0 0 7 20h10a1.5 1.5 0 0 0 1.5-1.5V9M10 13h4',
  bell: 'M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5l1.5-1.5zM10 20a2 2 0 0 0 4 0',
  list: 'M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.1M4.5 12h.1M4.5 17.5h.1',
  external: 'M14 4h6v6M20 4l-8.5 8.5M17.5 13.5V19a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1H11',
  grid: 'M4 4h7v7H4V4zM13 4h7v7h-7V4zM4 13h7v7H4v-7zM13 13h7v7h-7v-7z',
  play: 'M8 5.5v13l10.5-6.5L8 5.5z',
  minus: 'M5 12h14',
  menu: 'M4 7h16M4 12h16M4 17h16',
  flag: 'M5.5 21V4.5M5.5 4.5h11l-2 4 2 4h-11',
  move: 'M12 3.5v17M3.5 12h17M9 6.5l3-3 3 3M9 17.5l3 3 3-3M6.5 9l-3 3 3 3M17.5 9l3 3-3 3',
  wifi: 'M2.5 9a14 14 0 0 1 19 0M5.8 12.5a9.5 9.5 0 0 1 12.4 0M9.2 16a4.8 4.8 0 0 1 5.6 0M12 19.5v.1',
  sliders: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
  type: 'M5 7V5h14v2M12 5v14M9 19h6',
  palette: 'M12 3.5a8.5 8.5 0 0 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.2-1-1.6-1-2.6 0-.9.8-1.7 1.8-1.7h2.2a3.7 3.7 0 0 0 3.7-3.7C20.5 7 16.7 3.5 12 3.5zM7.5 12h.1M9.5 8h.1M14.5 8h.1',
  motion: 'M3 10c2.5-5 5.5-5 8 0s5.5 5 8 0M3 16c2.5-3 5.5-3 8 0s5.5 3 8 0',
  volume: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4v-5zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11',
  mute: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4v-5zM16 9.5l5 5M21 9.5l-5 5',
  expand: 'M14 4h6v6M10 20H4v-6M20 4l-6.5 6.5M4 20l6.5-6.5',
};

export type IconName = keyof typeof P;

/** `forward`/`back` are written for RTL: forward points left (towards the end of the line). */
const DIRECTIONAL = new Set(['forward', 'back']);

function nodes(list: IconNode[]): React.ReactNode[] {
  return list.map((n, i) => n.tag === 'path' ? <path key={i} d={n.attr.d} /> : null);
}

export function Icon({ name, size = 'md', label, className = '', ...rest }: { name: IconName; size?: 'sm' | 'md' | 'lg'; label?: string } & Omit<SVGProps<SVGSVGElement>, 'name'>) {
  const glyph = UI_GLYPHS[name] ?? UI_GLYPHS.info!;
  return (
    <svg
      viewBox="0 0 256 256" fill="currentColor"
      className={`icon ${size === 'sm' ? 'icon-sm' : size === 'lg' ? 'icon-lg' : ''} ${DIRECTIONAL.has(name) ? 'icon-dirfixed' : ''} ${className}`}
      aria-hidden={label ? undefined : true} role={label ? 'img' : undefined} aria-label={label} focusable="false" {...rest}
    >
      {nodes(glyph)}
    </svg>
  );
}

/** Large occasion glyph (Phosphor Light / Thin), for posters and event cards. Decorative. */
export function OccasionGlyph({ type, weight = 'light', className = '', size }: { type: string; weight?: 'light' | 'thin'; className?: string; size?: number }) {
  const glyph = (weight === 'thin' ? OCCASION_GLYPHS_THIN : OCCASION_GLYPHS)[type] ?? OCCASION_GLYPHS.other!;
  return <svg viewBox="0 0 256 256" fill="currentColor" className={`occasion-glyph ${className}`} width={size} height={size} aria-hidden="true" focusable="false">{nodes(glyph)}</svg>;
}
