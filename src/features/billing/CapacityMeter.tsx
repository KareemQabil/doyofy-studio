/** Calm, proactive guest capacity: used / total people (companions included), a warning from 90%, and the receipt. */
import { useEffect, useId, useState } from 'react';
import { allocatedGuests, capacityLevel, guestLimit, receiptsFor } from '../../domain/billing';
import type { InvitationParty } from '../../domain/types';
import { Button, ProgressBar } from '../../ui';
import { useServices } from '../../app/data';
import { useCopy } from '../../ui/copy';
import { openCapacityUpgrade } from './UpgradeFlow';
import { ReceiptButton } from './Receipt';

/** Re-renders when capacity changes here or in another tab. */
export function useCapacityVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const update = () => setVersion(n => n + 1);
    window.addEventListener('doyofy:capacity', update); window.addEventListener('storage', update);
    return () => { window.removeEventListener('doyofy:capacity', update); window.removeEventListener('storage', update); };
  }, []);
  return version;
}

/**
 * `slim`: one line for working screens (the guest list) — label, count, a thin meter, the receipt; the explanatory
 * note appears only once capacity needs attention (near / full / over).
 */
export function CapacityMeter({ eventId, parties, alwaysOfferUpgrade = false, receiptLink = true, slim = false }: { eventId: string; parties: readonly InvitationParty[]; alwaysOfferUpgrade?: boolean; receiptLink?: boolean; slim?: boolean }) {
  useCapacityVersion();
  const { t, n } = useCopy();
  const id = useId();
  const owner = useServices().session.currentUser().role === 'organizer';
  const used = allocatedGuests(parties), limit = guestLimit(eventId), level = capacityLevel(used, limit), left = Math.max(0, limit - used);
  const note = level === 'ok' ? t('capLeft', { people: n(left, 'person') })
    : level === 'near' ? t('capNear', { people: n(left, 'person') })
      : t(level === 'full' ? 'capFull' : 'capOver');
  const offer = owner && (alwaysOfferUpgrade || level !== 'ok');
  if (slim) return <section className={`capacity-meter is-slim is-${level}`} data-capacity-meter aria-labelledby={`${id}-l`}>
    <div className="capacity-meter-line">
      <span id={`${id}-l`} className="capacity-meter-label">{t('capLabel')}</span>
      <span className="capacity-meter-count num"><strong>{used}</strong> / {limit}</span>
      <ProgressBar value={used} max={limit} label={t('capUsed')} tone={level === 'ok' ? 'primary' : level === 'near' ? 'warning' : 'danger'} />
      {receiptLink && <ReceiptButton receipts={receiptsFor(eventId)} />}
      {offer && <Button size="sm" variant={level === 'ok' ? 'ghost' : 'secondary'} onClick={() => openCapacityUpgrade(eventId, used)}>{t('upgradeCapacity')}</Button>}
    </div>
    {level !== 'ok' && <p className="capacity-meter-note" role="status">{note}{!owner ? t('capOwner') : ''}</p>}
  </section>;
  return <section className={`capacity-meter is-${level}`} data-capacity-meter aria-labelledby={`${id}-l`}>
    <div className="capacity-meter-head">
      <span id={`${id}-l`} className="capacity-meter-label">{t('capLabel')}</span>
      <span className="capacity-meter-count"><strong className="num">{used}</strong> {t('capOf', { people: n(limit, 'person') })}</span>
    </div>
    <ProgressBar value={used} max={limit} label={t('capUsed')} tone={level === 'ok' ? 'primary' : level === 'near' ? 'warning' : 'danger'} />
    <div className="capacity-meter-foot">
      <p className="capacity-meter-note" role={level === 'ok' ? undefined : 'status'}>{note}{!owner && level !== 'ok' ? t('capOwner') : ''}</p>
      <div className="capacity-meter-actions">
        {receiptLink && <ReceiptButton receipts={receiptsFor(eventId)} />}
        {offer && <Button size="sm" variant={level === 'ok' ? 'ghost' : 'secondary'} onClick={() => openCapacityUpgrade(eventId, used)}>{t('upgradeCapacity')}</Button>}
      </div>
    </div>
  </section>;
}
