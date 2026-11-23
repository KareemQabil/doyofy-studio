/**
 * The invitation's general link — one link without a name, for groups — with its switch and the link to copy.
 * It used to live on the invitation summary page (now gone: the «الدعوة» tab opens the editor); it belongs with the
 * other ways of sharing, in the guests' share sheet (GuestsPage mounts it). Personal links stay per guest.
 * Replies through it arrive unmatched, for the organizer to match with the list (the hint says so).
 */
import type { Event } from '../../domain/types';
import { Switch } from '../../ui';
import { useMutation } from '../../app/data';
import { useCopy } from '../../ui/copy';
import { useCan } from './OwnerOnly';
import { CopyField } from './CopyField';
import { useGuestLink } from './share-link';

export function GeneralLinkCard({ event }: { event: Event }) {
  const { t } = useCopy();
  const link = useGuestLink(event);
  const canShare = useCan('guests.share');
  const toggle = useMutation((s, on: boolean) => s.events.update(event.id, { settings: { allowGeneralLink: on } }));
  const on = event.settings.allowGeneralLink;
  return (
    <section className="general-link stack gap-3" aria-label={t('ivGeneral')}>
      <Switch label={t('setGeneral')} hint={t('setGeneralHint')} checked={on} disabled={!canShare || toggle.pending} onChange={(v) => void toggle.run(v)} />
      {on && <CopyField label={t('ivGeneral')} value={link()} hint={t('ivGeneralHint')} />}
    </section>
  );
}
