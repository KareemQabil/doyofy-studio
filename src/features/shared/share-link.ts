/**
 * Guest links that open on any device. With the backend on (docs/BACKEND.md) they are short — /i/<public slug>/<code> —
 * as soon as that event and that guest reached it, and replies reach the organizer from any device. Otherwise (no backend,
 * or a guest added a second ago) the portable form /i/<slug>/<code>?d=<the invitation itself>.
 * A link with ?d= always opens its public snapshot with a device-only demo reply, even on the organizer's device.
 * Local routes without ?d= still use the prototype's organizer store; portable links never claim remote delivery.
 * The snapshot carries the organizer's voice (modern · Egyptian · Saudi), so the guest pages follow it on any device.
 */
import type { Event, InvitationParty } from '../../domain/types';
import { paths } from '../../app/paths';
import { useRouter } from '../../app/router';
import { useDesign } from './queries';
import { portableView, encodePortableView } from '../../domain/portable-invite';
import { currentDialect } from '../../ui/copy';
import { useCloud } from './cloud';

export function useGuestLink(event: Event): (party?: Pick<InvitationParty, 'code' | 'primaryGuestName' | 'maxPartySize'>) => string {
  const { absolute } = useRouter();
  const design = useDesign(event.id).data;
  const cloud = useCloud();
  return (party) => {
    const short = cloud.guestPath(event.id, party?.code);
    if (short) return absolute(short);
    const base = absolute(paths.guestLink(event.slug, party?.code));
    // the invitation is always live: guests get the latest saved design
    const content = design?.draft ?? design?.published;
    if (!content) return base;
    // the organizer's voice travels with the invitation: the guest pages speak it on any device
    return `${base}?d=${encodePortableView(portableView(event, content, party, currentDialect()))}`;
  };
}
