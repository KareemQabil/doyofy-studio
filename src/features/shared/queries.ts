/** Shared query hooks (one key scheme for the whole app). */
import { useQuery } from '../../app/data';

/** `fresh`: wait for data newer than any write before this mount (editors that seed a local draft). */
export const useEvent = (id: string | null, opts?: { fresh?: boolean }) => useQuery(id ? `event:${id}` : null, (s) => s.events.get(id!), opts);
export const useEvents = () => useQuery('events', (s) => s.events.list());
export const useDesign = (eventId: string | null, opts?: { fresh?: boolean }) => useQuery(eventId ? `design:${eventId}` : null, (s) => s.invitations.get(eventId!), opts);
export const useParties = (eventId: string | null) => useQuery(eventId ? `parties:${eventId}` : null, (s) => s.parties.list(eventId!));
export const useTables = (eventId: string | null) => useQuery(eventId ? `tables:${eventId}` : null, (s) => s.seating.listTables(eventId!));
export const useResponses = (eventId: string | null) => useQuery(eventId ? `responses:${eventId}` : null, (s) => s.rsvp.listResponses(eventId!));
export const useCheckIns = (eventId: string | null) => useQuery(eventId ? `checkins:${eventId}` : null, (s) => s.checkIn.list(eventId!));
export const useActivity = (eventId: string | null, limit = 30) => useQuery(eventId ? `activity:${eventId}:${limit}` : null, (s) => s.activity.list(eventId!, limit));
