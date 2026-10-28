/**
 * Guest links that open on any device: /i/<slug>/<code>?d=<the invitation itself>.
 * On the organizer's device the link opens the real invitation (real reply); anywhere else the guest page falls back
 * to the self-contained copy in ?d= and its reply is clearly a demo (owner decision Q1).
 */
import type { Event, InvitationParty } from '../../domain/types';
import { inviteConfig } from '../../domain/invitation';
import { encodeConfig } from '../../data/invite-link.js';
import { paths } from '../../app/paths';
import { useRouter } from '../../app/router';
import { useDesign } from './queries';

export function useGuestLink(event: Event): (party?: Pick<InvitationParty, 'code' | 'primaryGuestName' | 'maxPartySize'>) => string {
  const { absolute } = useRouter();
  const design = useDesign(event.id).data;
  return (party) => {
    const base = absolute(paths.guestLink(event.slug, party?.code));
    const content = design?.published ?? design?.draft;
    if (!content) return base;
    const cfg = inviteConfig(event, content, party?.maxPartySize ?? event.settings.defaultPartySize, party?.primaryGuestName);
    return `${base}?d=${encodeConfig(cfg)}`;
  };
}
