/**
 * «توقيع» art kit — built only from the Doyofy identity:
 *   · colours from the Visual Identity Guidelines (gold, ivory, beige, red, turquoise, charcoal)
 *   · the official logomark and brand pattern (owner-supplied SVGs, see BrandPattern.tsx)
 *   · geometry derived from the logomark: the circle, the capsule (stem + half-circle = the arch), the double line
 *   · icons from Phosphor Icons (MIT) via ui/icons — nothing hand-drawn, no generated imagery
 * Everything here is flat (no glow, no skeuomorphic wax or satin) and decorative (aria-hidden).
 */
import { useId, type CSSProperties, type ReactNode } from 'react';
import { LogoMark } from '../../ui/brand';
import { OccasionGlyph } from '../../ui/icons';
import { Motif, type MotifName } from './BrandPattern';

export type { BrandTone } from './tones';
import type { BrandTone } from './tones';

/** the brand seal: a flat disc with a double ring (the logo's double line) holding the logomark, a numeral or an initial */
export function Seal({ size = 64, mark, tone = 'gold', className = '', style }: { size?: number; mark?: string; tone?: BrandTone | 'coral' | 'plum' | 'cobalt'; className?: string; style?: CSSProperties }) {
  const t = tone === 'coral' ? 'red' : tone === 'plum' ? 'charcoal' : tone === 'cobalt' ? 'turquoise' : tone;
  return (
    <span className={`sig-seal tone-${t} ${className}`} style={{ ...style, '--seal': `${size}px` } as CSSProperties} aria-hidden="true">
      {mark ? <span className="sig-seal-mark">{mark}</span> : <LogoMark size={Math.round(size * 0.5)} />}
    </span>
  );
}

/** a flat brand field: the expressive surface of a screen (charcoal, gold, turquoise, or the soft brand mesh) */
export function Stage({ children, className = '', size = 'lg', tone = 'charcoal', pattern, as: As = 'section', ...rest }: {
  children: ReactNode; className?: string; size?: 'lg' | 'md' | 'sm'; tone?: 'charcoal' | 'gold' | 'turquoise' | 'mesh' | 'ivory'; pattern?: MotifName | 'field' | false; as?: 'section' | 'div' | 'header';
} & Record<string, unknown>) {
  return (
    <As className={`sig-stage sig-stage-${size} tone-${tone} ${className}`} {...rest}>
      {pattern !== false && <span className={`sig-stage-pattern${pattern && pattern !== 'field' ? ` is-motif motif-${pattern}` : ''}`} aria-hidden="true">{pattern && pattern !== 'field' ? <Motif name={pattern} /> : null}</span>}
      {children}
    </As>
  );
}

/** capsule (arch) frame: the logomark's stem-and-loop geometry turned into a frame for the invitation itself */
export function Capsule({ children, className = '', tone = 'beige' }: { children?: ReactNode; className?: string; tone?: BrandTone | 'mesh' }) {
  return <span className={`sig-capsule tone-${tone} ${className}`}>{children}</span>;
}

/** an occasion's mark: Phosphor Light glyph inside a brand-colour capsule with the brand pattern behind it */
export function OccasionObject({ type, className = '' }: { type: string; className?: string; eager?: boolean }) {
  return <span className={`sig-occ-mark ${className}`} aria-hidden="true"><OccasionGlyph type={type} /></span>;
}

/** a flat envelope from the brand's basic shapes (rectangle + two triangles), for the guest reveal */
export function EnvelopeBack({ className = '' }: { className?: string }) {
  const patternId = useId();
  return (
    <svg className={`sig-env-back ${className}`} viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs><pattern id={patternId} patternUnits="userSpaceOnUse" width="52" height="72"><image href="assets/brand/envelope-lining.svg" width="52" height="72" /></pattern></defs>
      <rect x="0" y="100" width="400" height="200" rx="6" fill="#B8955A" />
      <rect x="14" y="110" width="372" height="180" rx="3" fill="#F2EAD9" />
      <rect x="14" y="110" width="372" height="180" rx="3" fill={`url(#${patternId})`} opacity="0.18" />
    </svg>
  );
}
export function EnvelopeFront({ className = '' }: { className?: string }) {
  return (
    <svg className={`sig-env-front ${className}`} viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0 160 L200 250 L400 160 L400 294 Q400 300 394 300 L6 300 Q0 300 0 294 Z" fill="#C7A661" />
      <path d="M0 160 L200 250 L400 160" fill="none" stroke="#F2EAD9" strokeWidth="2" />
      <path d="M0 168 L200 258 L400 168" fill="none" stroke="#F2EAD9" strokeWidth="1" strokeOpacity="0.7" />
    </svg>
  );
}

/** event date as editorial numerals (no ornament): day, month, time */
export function DateSeal({ day, month, time, className = '' }: { day: string; month: string; time?: string; className?: string }) {
  return (
    <span className={`sig-date ${className}`} aria-hidden="true">
      <b className="num">{day}</b>
      <span>{month}</span>
      {time && <small className="num">{time}</small>}
    </span>
  );
}

/** perforated ticket edge (guest pass, reception results, summary facts) */
export function TicketEdge({ className = '' }: { className?: string }) {
  return <span className={`sig-ticket-edge ${className}`} aria-hidden="true"><i /><i /></span>;
}

export { Motif };
