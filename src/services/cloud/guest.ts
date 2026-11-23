/**
 * The guest side of the backend: a GuestApi over /api/invite and /api/replies, and the composition the app uses —
 * this device's own store first (the organizer previewing, the prototype's demo links), then the backend for a short
 * link this device knows nothing about. When the backend is off the local answer stands, exactly as before.
 */
import type { GuestApi, GuestRsvpInput, GuestView } from '../contracts';
import { AppError, isAppError } from '../errors';
import { validateRsvp, RSVP_ERROR_TEXT } from '../../domain/parties';
import { checkAnswers } from '../../domain/guest-experience';
import { backendStatus, fetchInvite, postReply } from './api';

/** the general link has no identity: this device remembers its own reply id (the server's capability to correct it) */
const replyKey = (slug: string) => `doyofy:guest-remote:${slug}`;
const storage = (): Storage | null => { try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; } };

export function remoteGuestApi(): GuestApi {
  const views = new Map<string, GuestView>();
  const id = (slug: string, code?: string | null) => `${slug}/${code ?? ''}`;
  return {
    async open(slug, code) {
      const own = code ? undefined : storage()?.getItem(replyKey(slug)) ?? undefined;
      const view = await fetchInvite(slug, code, own);
      if (view?.event?.slug !== slug || !view.design) throw new AppError('not_found', 'هذه الدعوة غير موجودة. تأكد من الرابط مع صاحب الدعوة.');
      views.set(id(slug, code), view);
      return view;
    },
    async submitRsvp(slug, code, input: GuestRsvpInput) {
      const view = views.get(id(slug, code)) ?? await this.open(slug, code ?? undefined);
      if (!view.canEdit) throw new AppError('conflict', 'انتهى وقت الرد على هذه الدعوة.');
      // the same checks as the mock, before anything leaves the device; the server checks again
      const error = validateRsvp(input, view.maxGuests);
      if (error) throw new AppError('validation', RSVP_ERROR_TEXT[error], 'count');
      if (!code && !input.name?.trim()) throw new AppError('validation', 'اكتبوا الاسم قبل إرسال الرد.', 'name');
      if (view.experience && input.attending) {
        const check = checkAnswers(view.experience, input);
        if (!check.ok) throw new AppError(check.conflict ? 'conflict' : 'validation', check.message, check.field);
      }
      const { reply, view: next } = await postReply(slug, code, {
        attending: input.attending, count: input.attending ? input.count : 0, name: input.name, companionNames: input.companionNames,
        note: input.note, meals: input.meals, dietary: input.dietary, replaces: input.replaces,
      });
      if (!code) { try { storage()?.setItem(replyKey(slug), reply.id); } catch { /* the reply still arrived */ } }
      views.set(id(slug, code), next);
      return { ...next, responseId: reply.id };
    },
  };
}

/** local first; a link this device's store has never heard of goes to the backend (when there is one) */
export function withRemoteFallback(local: GuestApi, remote: GuestApi = remoteGuestApi(), isOn: () => Promise<boolean> = () => backendStatus()): GuestApi {
  const viaRemote = new Set<string>();
  return {
    async open(slug, code) {
      if (viaRemote.has(slug)) return remote.open(slug, code);
      try { return await local.open(slug, code); }
      catch (e) {
        if (!(isAppError(e) && (e.code === 'not_found' || e.code === 'not_published')) || !(await isOn())) throw e;
        let view: GuestView;
        // the backend does not know it either: this device's own answer (e.g. «not shared yet») says more
        try { view = await remote.open(slug, code); } catch (r) { throw isAppError(r) && r.code === 'not_found' ? e : r; }
        viaRemote.add(slug);
        return view;
      }
    },
    submitRsvp: (slug, code, input) => viaRemote.has(slug) ? remote.submitRsvp(slug, code, input) : local.submitRsvp(slug, code, input),
  };
}
