/** Human-readable activity lines (spec §9/§31): "أحمد أكد الحضور — شخصان", in the organizer's voice. */
import type { ActivityKind, EventActivity, Tone } from './types';
import { copyFor, countOf, fill, type Dialect } from './copy';

const s = (v: unknown) => (v == null ? '' : String(v));
const n = (v: unknown) => Number(v) || 0;

export function activityText(a: EventActivity, dialect: Dialect = 'ar'): string {
  const d = a.data, c = copyFor(dialect);
  const t = (template: string, vars: Record<string, string | number> = {}) => fill(template, vars);
  const many = (count: unknown, noun: 'guest' | 'invitation' | 'row' | 'table', oblique = true) => countOf(dialect, n(count), noun, oblique);
  const people = (count: unknown) => countOf(dialect, n(count), 'person');
  const how = d.how === 'simulated' ? c.acDemo : '';
  switch (a.kind) {
    case 'event_created': return c.acCreated;
    case 'event_updated': return t(c.acUpdated, { what: d.what ? ` (${s(d.what)})` : '' });
    case 'invitation_saved': return c.acSaved;
    // legacy rows from before the invitation was always live: read as «ready / updated for guests»
    case 'invitation_published': return d.first ? c.acPublished : c.acRepublished;
    case 'party_added': return t(c.acAdded, { name: s(d.name) });
    case 'parties_imported': return t(c.acImported, { guests: many(d.count, 'guest'), skipped: n(d.skipped) ? t(c.acImportSkipped, { rows: many(d.skipped, 'row') }) : '' });
    case 'party_updated': return t(c.acPartyUpdated, { name: s(d.name) });
    case 'party_removed': return t(c.acRemoved, { name: s(d.name) });
    // moved/copied between events: never «deleted» — the line names the other event
    case 'parties_transferred': {
      const event = s(d.event), invitations = many(d.count, 'invitation', false);
      if (d.direction === 'in') return t(d.mode === 'move' ? c.acTransferredIn : c.acCopiedIn, { invitations, event });
      return d.mode === 'move' ? t(c.acTransferredOut, { name: s(d.name), event }) : t(c.acCopiedOut, { invitations, event });
    }
    case 'invitation_shared': return n(d.count) > 1 ? t(c.acSharedMany, { invitations: many(d.count, 'invitation'), how }) : t(c.acSharedOne, { name: s(d.name), how: d.how === 'manual' ? c.acManual : how });
    case 'invitation_opened': return t(c.acOpened, { name: s(d.name) });
    case 'invitation_failed': return n(d.count) > 1 ? t(c.acFailedMany, { invitations: many(d.count, 'invitation') }) : t(c.acFailedOne, { name: s(d.name) });
    // reminders are sent by the organizer from their own WhatsApp/SMS and recorded only after they confirm
    case 'reminder_sent': return n(d.count) > 1 ? t(c.acRemindedMany, { invitations: many(d.count, 'invitation') }) : t(c.acRemindedOne, { name: s(d.name) });
    case 'rsvp_confirmed': return t(c.acConfirmed, { name: s(d.name), people: people(d.count) });
    case 'rsvp_declined': return t(c.acDeclined, { name: s(d.name) });
    case 'rsvp_edited': return d.attending ? t(c.acEdited, { name: s(d.name), people: people(d.count) }) : t(c.acEditedNo, { name: s(d.name) });
    case 'rsvp_unmatched': return t(c.acUnmatched, { name: s(d.name) });
    case 'rsvp_matched': return t(c.acMatched, { name: s(d.name) });
    case 'table_created': return t(c.acTable, { name: s(d.name), seats: countOf(dialect, n(d.capacity), 'seat') });
    case 'party_seated': return t(c.acSeated, { name: s(d.name), table: s(d.table) });
    case 'party_moved': return t(c.acMoved, { name: s(d.name), table: s(d.table) });
    case 'party_unseated': return t(c.acUnseated, { name: s(d.name), table: s(d.table) });
    case 'seating_auto_applied': return t(c.acAuto, { invitations: many(d.count, 'invitation'), tables: n(d.tables) ? t(c.acAutoTables, { tables: many(d.tables, 'table') }) : '' });
    case 'seating_auto_undone': return t(c.acAutoUndone, { invitations: many(d.count, 'invitation') });
    case 'checked_in': return t(c.acIn, { name: s(d.name), people: people(d.count) });
    case 'checked_in_partial': return t(c.acPartial, { name: s(d.name), n: n(d.total), of: n(d.expected) });
    case 'check_in_exception': return t(c.acException, { name: s(d.name), reason: s(d.reason) });
    case 'check_in_undone': return t(c.acInUndone, { name: s(d.name) });
    case 'check_in_walk_in': return t(c.acWalkIn, { name: s(d.name), people: people(d.count), note: d.note ? ` («${s(d.note)}»)` : '' });
    case 'event_archived': return c.acArchived;
  }
}

export function activityTone(kind: ActivityKind): Tone {
  if (kind === 'rsvp_confirmed' || kind === 'checked_in' || kind === 'invitation_published') return 'success';
  if (kind === 'invitation_failed' || kind === 'check_in_exception' || kind === 'check_in_walk_in' || kind === 'rsvp_unmatched') return 'warning';
  if (kind === 'rsvp_declined' || kind === 'party_removed') return 'neutral';
  if (kind === 'invitation_opened' || kind === 'checked_in_partial') return 'info';
  return 'neutral';
}
