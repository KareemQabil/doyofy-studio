/**
 * Guest links that open on any device: /i/<slug>/<code>?d=<the invitation itself>.
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

export function useGuestLink(event: Event): (party?: Pick<InvitationParty, 'code' | 'primaryGuestName' | 'maxPartySize'>) => string {
  const { absolute } = useRouter();
  const design = useDesign(event.id).data;
  return (party) => {
    const base = absolute(paths.guestLink(event.slug, party?.code));
    const content = design?.published ?? design?.draft;
    if (!content) return base;
    // the organizer's voice travels with the invitation: the guest pages speak it on any device
    return `${base}?d=${encodePortableView(portableView(event, content, party, currentDialect()))}`;
  };
}
