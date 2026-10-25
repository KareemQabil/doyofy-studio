/**
 * Seating (MVP): tables with a capacity; a confirmed party sits at one table.
 * Seats a party needs = its confirmed headcount. Warnings are computed, never auto-fixed.
 */
import type { InvitationParty, SeatAssignment, Table } from './types';
import { seatsFor } from './parties';

export interface TableOccupancy {
  table: Table;
  parties: InvitationParty[];
  used: number;
  remaining: number;          // negative = over capacity
  over: boolean;
  declined: InvitationParty[]; // declined but still assigned
}

export function occupancy(tables: readonly Table[], parties: readonly InvitationParty[]): TableOccupancy[] {
  return [...tables]
    .sort((a, b) => a.order - b.order)
    .map((table) => {
      const at = parties.filter((p) => p.tableId === table.id);
      const used = at.reduce((n, p) => n + seatsFor(p), 0);
      return { table, parties: at, used, remaining: table.capacity - used, over: used > table.capacity, declined: at.filter((p) => p.rsvpStatus === 'declined') };
    });
}

export function assignments(parties: readonly InvitationParty[]): SeatAssignment[] {
  return parties.filter((p) => p.tableId).map((p) => ({ partyId: p.id, tableId: p.tableId!, seats: seatsFor(p) }));
}

export type AssignCheck =
  | { ok: true }
  | { ok: false; reason: 'not_confirmed' | 'does_not_fit'; free: number; need: number };

/** Can `party` sit at `table`? "does_not_fit" is a warning the organizer may override (spec: show, don't silently fix). */
export function checkAssign(party: InvitationParty, table: TableOccupancy): AssignCheck {
  const need = seatsFor(party);
  const already = party.tableId === table.table.id ? need : 0;
  const free = table.remaining + already;
  if (party.rsvpStatus !== 'confirmed') return { ok: false, reason: 'not_confirmed', free, need };
  if (need > free) return { ok: false, reason: 'does_not_fit', free, need };
  return { ok: true };
}

export interface SeatingWarnings {
  overCapacity: TableOccupancy[];
  unassigned: InvitationParty[];
  declinedAssigned: InvitationParty[];
}

export function seatingWarnings(tables: readonly Table[], parties: readonly InvitationParty[]): SeatingWarnings {
  const occ = occupancy(tables, parties);
  return {
    overCapacity: occ.filter((o) => o.over),
    unassigned: parties.filter((p) => p.rsvpStatus === 'confirmed' && !p.tableId),
    declinedAssigned: parties.filter((p) => p.rsvpStatus === 'declined' && p.tableId),
  };
}

export function totalCapacity(tables: readonly Table[]): number {
  return tables.reduce((n, t) => n + t.capacity, 0);
}

export function nextTableName(tables: readonly Table[]): string {
  const nums = tables.map((t) => Number((t.name.match(/\d+/) || ['0'])[0])).filter((n) => !Number.isNaN(n));
  return `طاولة ${Math.max(0, ...nums) + 1}`;
}

export function validateTable(input: { name: string; capacity: number }): Partial<Record<'name' | 'capacity', string>> {
  const e: Partial<Record<'name' | 'capacity', string>> = {};
  if (!input.name.trim()) e.name = 'اكتب اسم الطاولة';
  if (!Number.isInteger(input.capacity) || input.capacity < 1) e.capacity = 'السعة يجب أن تكون 1 أو أكثر';
  else if (input.capacity > 60) e.capacity = 'السعة كبيرة جدًا — 60 كحد أقصى';
  return e;
}
