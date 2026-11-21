import type { Role } from './types';

/** Prototype visibility policy. A production API must enforce these permissions too. */
export const canViewFood = (role: Role): boolean => role === 'caterer';
export const canManageGuests = (role: Role): boolean => role !== 'caterer';
