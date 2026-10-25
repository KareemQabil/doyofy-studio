/**
 * The ONLY door from Doyofy platform code into the existing Invitation Studio engine.
 * Loaded lazily so the organizer workspace stays light until an invitation is shown.
 */
export type Engine = typeof import('./engine-impl');
let pending: Promise<Engine> | null = null;
export function loadEngine(): Promise<Engine> {
  pending ??= import('./engine-impl');
  return pending;
}
