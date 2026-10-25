import type { ActivityKind, EventActivity, InvitationParty } from '../../domain/types';
import { makeId } from '../../domain/ids';
import { AppError } from '../errors';
import type { DbShape, MockStore } from './store';

export function log(db: DbShape, at: Date, eventId: string, kind: ActivityKind, data: EventActivity['data'] = {}, actor: EventActivity['actor'] = 'organizer', partyId?: string) {
  db.activity.push({ id: makeId('act'), eventId, kind, at: at.toISOString(), actor, partyId, data });
}

export function findEvent(db: DbShape, id: string) {
  const ev = db.events.find((e) => e.id === id);
  if (!ev) throw new AppError('not_found', 'لم نجد هذه المناسبة. ربما حُذفت أو أن الرابط غير صحيح.');
  return ev;
}

export function findParty(db: DbShape, id: string): InvitationParty {
  const p = db.parties.find((x) => x.id === id);
  if (!p) throw new AppError('not_found', 'لم نجد هذا الضيف في القائمة. ربما حُذف.');
  return p;
}

export function touch(p: { updatedAt: string }, at: Date) { p.updatedAt = at.toISOString(); }

export type Ctx = { store: MockStore; now: () => Date };
