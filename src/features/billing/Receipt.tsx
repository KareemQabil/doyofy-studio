/** Demo receipts for capacity upgrades: plan, amount, date and a demo reference. Nothing is ever charged. */
import { useState } from 'react';
import type { Receipt } from '../../domain/billing';
import { plural, P } from '../../domain/format';
import { Button, Dialog } from '../../ui';
import { useCopy } from '../../ui/copy';

export const sar = (n: number) => `${n} ر.س`;
const when = (iso: string) => { try { return new Date(iso).toLocaleString('ar-u-nu-latn', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return iso.slice(0, 10); } };

export function ReceiptDetails({ receipt: r, compact }: { receipt: Receipt; compact?: boolean }) {
  const { t, n } = useCopy();
  return <div className={`capacity-receipt${compact ? ' is-compact' : ''}`} data-receipt>
    <dl className="capacity-summary">
      <div><dt>{t('rcPlan')}</dt><dd>{t('rcCapacity', { people: n(r.limit, 'person') })}<span className="faint t-xs">{t('rcWas', { people: n(r.fromLimit, 'person') })}</span></dd></div>
      {r.credit > 0 && <div><dt>{t('rcPrice')}</dt><dd className="num">{sar(r.price)}</dd></div>}
      {r.credit > 0 && <div><dt>{t('rcPaidBefore')}</dt><dd className="num">− {sar(r.credit)}</dd></div>}
      <div className="is-total"><dt>{t(r.credit > 0 ? 'rcDiffDemo' : 'rcAmountDemo')}</dt><dd className="num">{sar(r.charged)}</dd></div>
      <div><dt>{t('rcDate')}</dt><dd>{when(r.at)}</dd></div>
      <div><dt>{t('rcRef')}</dt><dd><bdi className="num" dir="ltr">{r.ref}</bdi></dd></div>
    </dl>
    <p className="faint t-xs">{t('rcNote')}</p>
  </div>;
}

export function ReceiptDialog({ receipt, onClose }: { receipt: Receipt; onClose: () => void }) {
  const { t } = useCopy();
  return <Dialog open onClose={onClose} title={t('rcTitle')} size="sm" className="capacity-dialog" footer={<Button variant="primary" onClick={onClose}>{t('close')}</Button>}>
    <ReceiptDetails receipt={receipt} />
  </Dialog>;
}

/** Receipt link(s) for a meter or settings: the latest receipt opens directly; older ones are listed in settings. */
export function ReceiptButton({ receipts, label }: { receipts: readonly Receipt[]; label?: string }) {
  const { t } = useCopy();
  const [open, setOpen] = useState<Receipt | null>(null);
  if (!receipts.length) return null;
  return <>
    <button type="button" className="link-btn capacity-receipt-link" onClick={() => setOpen(receipts[0]!)}>{label ?? t('viewReceipt')}</button>
    {open && <ReceiptDialog receipt={open} onClose={() => setOpen(null)} />}
  </>;
}

/** `eventName`: the account's list names each receipt's event (receipts of every event on one page) */
export function ReceiptList({ receipts, eventName, empty }: { receipts: readonly Receipt[]; eventName?: (eventId: string) => string | undefined; empty?: string }) {
  const { t } = useCopy();
  const [open, setOpen] = useState<Receipt | null>(null);
  if (!receipts.length) return <p className="faint t-sm">{empty ?? t('rcNone', { people: plural(100, P.person) })}</p>;
  return <>
    <ul className="capacity-receipts" aria-label={t('rcList')}>
      {receipts.map(r => <li key={r.ref}>
        <span className="grow"><strong>{eventName?.(r.eventId) ? `${eventName(r.eventId)} · ` : ''}{t('rcCapacity', { people: plural(r.limit, P.person) })}</strong><span className="faint t-sm"> · {sar(r.charged)} {t('rcDemo')} · {when(r.at)}</span></span>
        <Button size="sm" variant="ghost" icon="file" onClick={() => setOpen(r)} aria-label={`${t('viewReceipt')}: ${t('rcCapacity', { people: r.limit })}`}>{t('viewReceipt')}</Button>
      </li>)}
    </ul>
    {open && <ReceiptDialog receipt={open} onClose={() => setOpen(null)} />}
  </>;
}
