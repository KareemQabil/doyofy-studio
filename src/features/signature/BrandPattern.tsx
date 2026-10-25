/**
 * The official Doyofy brand pattern (owner-supplied identity pack), used exactly as drawn by the brand:
 * double-line «d» modules arranged in mirrored (bloom), rotated (knot) and stacked (column) symmetries.
 * Colour comes from `currentColor`; size from CSS. Decorative only (aria-hidden).
 * Philosophy: one module, repeated by symmetry on a grid — the same logic as Islamic geometric construction.
 */
import { BRAND_PATTERN, GRID_STEP, type PatternSymbol } from './brand-pattern.generated';

const paths = (s: PatternSymbol) => s.paths.map((p, i) => <path key={i} d={p.d} transform={p.t ? `matrix(${p.t.join(' ')})` : undefined} />);

export type MotifName = keyof typeof BRAND_PATTERN;

export function Motif({ name, className = '' }: { name: MotifName; className?: string }) {
  const s = BRAND_PATTERN[name];
  return <svg className={`brand-motif motif-${name} ${className}`} viewBox={`0 0 ${s.w} ${s.h}`} fill="currentColor" aria-hidden="true" focusable="false">{paths(s)}</svg>;
}

/** a field of the grid pattern (the brand's tile, repeated on its own period) */
export function PatternField({ cols = 4, rows = 2, className = '' }: { cols?: number; rows?: number; className?: string }) {
  const s = BRAND_PATTERN.gridCell;
  const w = GRID_STEP.x * (cols - 1) + s.w, h = GRID_STEP.y * (rows - 1) + s.h;
  return (
    <svg className={`brand-field ${className}`} viewBox={`0 0 ${w.toFixed(1)} ${h.toFixed(1)}`} fill="currentColor" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">
      {Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => <g key={`${r}-${c}`} transform={`translate(${(c * GRID_STEP.x).toFixed(2)} ${(r * GRID_STEP.y).toFixed(2)})`}>{paths(s)}</g>))}
    </svg>
  );
}

/** CSS background tile of the grid pattern (for quiet watermark fields) */
export function patternTile(color: string): string {
  const s = BRAND_PATTERN.gridCell;
  const body = s.paths.map((p) => `<path d="${p.d}"${p.t ? ` transform="matrix(${p.t.join(' ')})"` : ''}/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GRID_STEP.x} ${GRID_STEP.y}" fill="${color}">${body}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
