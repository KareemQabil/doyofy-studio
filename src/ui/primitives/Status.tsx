import type { Tone } from '../../domain/types';
import type { ReactNode } from 'react';

/** Invitation, response and arrival are always separate, explicitly labelled values. */
export function Status({ children, tone = 'neutral', label }: { children: ReactNode; tone?: Tone; label?: string }) {
  return <span className={`status tone-text-${tone}`}>
    <span className="status-dot" aria-hidden="true" />
    {label && <span className="sr-only">{label}: </span>}{children}
  </span>;
}
