/** Calm, proactive guest capacity: used / total people (companions included), a warning from 90%, and the receipt. */
import { useEffect, useId, useState } from 'react';
import { allocatedGuests, capacityLevel, guestLimit, receiptsFor } from '../../domain/billing';
import { plural, P } from '../../domain/format';
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

export function CapacityMeter({ eventId, parties, alwaysOfferUpgrade = false, receiptLink = true }: { eventId: string; parties: readonly InvitationParty[]; alwaysOfferUpgrade?: boolean; receiptLink?: boolean }) {
  useCapacityVersion();
  const { t } = useCopy();
  const id = useId();
  const owner = useServices().session.currentUser().role === 'organizer';
  const used = allocatedGuests(parties), limit = guestLimit(eventId), level = capacityLevel(used, limit), left = Math.max(0, limit - used);
  const note = level === 'ok' ? `المتبقي ${plural(left, P.person)}. السعة تشمل المرافقين.`
    : level === 'near' ? `اقتربت من حد مناسبتك: المتبقي ${plural(left, P.person)}. زِد السعة قبل أن تحتاجها.`
      : level === 'full' ? 'وصلت إلى حد مناسبتك. لإضافة ضيوف أو مرافقين زِد السعة أولًا.'
        : 'القائمة أكبر من حد المناسبة. يمكنك تقليل العدد أو زيادة السعة.';
  const offer = owner && (alwaysOfferUpgrade || level !== 'ok');
  return <section className={`capacity-meter is-${level}`} data-capacity-meter aria-labelledby={`${id}-l`}>
    <div className="capacity-meter-head">
      <span id={`${id}-l`} className="capacity-meter-label">سعة الضيوف</span>
      <span className="capacity-meter-count"><strong className="num">{used}</strong> من {plural(limit, P.person)}</span>
    </div>
    <ProgressBar value={used} max={limit} label="سعة الضيوف المستخدمة" tone={level === 'ok' ? 'primary' : level === 'near' ? 'warning' : 'danger'} />
    <div className="capacity-meter-foot">
      <p className="capacity-meter-note" role={level === 'ok' ? undefined : 'status'}>{note}{!owner && level !== 'ok' ? ' زيادة السعة لصاحب المناسبة.' : ''}</p>
      <div className="capacity-meter-actions">
        {receiptLink && <ReceiptButton receipts={receiptsFor(eventId)} />}
        {offer && <Button size="sm" variant={level === 'ok' ? 'ghost' : 'secondary'} onClick={() => openCapacityUpgrade(eventId, used)}>{t('upgradeCapacity')}</Button>}
      </div>
    </div>
  </section>;
}
