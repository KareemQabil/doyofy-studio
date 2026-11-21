/** A reviewable pass concept. Actual Google Wallet issuance needs a configured provider. */
import { useState } from 'react';
import type { GuestView } from '../../services/contracts';
import { formatEventDate, formatTime, people } from '../../domain/format';
import { Button, Dialog, Icon } from '../../ui';
import { QrCode } from './QrCode';

export function WalletPreview({ view, value, demo = false }: { view: GuestView; value: string; demo?: boolean }) {
  const [open, setOpen] = useState(false);
  if (!view.party || view.party.rsvpStatus !== 'confirmed') return null;
  const p = view.party;
  return <>
    <Button variant="secondary" icon="qr" block onClick={() => setOpen(true)}>معاينة بطاقة Google Wallet</Button>
    <Dialog open={open} title="معاينة بطاقة Google Wallet" description="تجربة شكل بطاقة الدخول بعد تأكيد الحضور" onClose={() => setOpen(false)} size="sm" footer={<Button variant="primary" onClick={() => setOpen(false)}>العودة إلى رمز الدخول</Button>}>
      <article className="wallet-pass" aria-label={`بطاقة دخول ${p.name}`}>
        <p className="wallet-pass-brand"><Icon name="envelope" size="sm" />ضيوفي · بطاقة الدخول</p>
        <h3>{view.event.title}</h3><p><strong>{p.name}</strong></p>
        <p className="muted t-sm">{formatEventDate(view.event.date)} · {formatTime(view.event.time)}</p>
        <p className="muted t-sm">{view.event.venue.name} · {people(p.confirmedPartySize ?? 1)}</p>
        {p.tableName && <p className="muted t-sm">{p.tableName}</p>}
        <QrCode value={value} size={196} label="رمز الدخول في معاينة المحفظة" /><bdi className="num" dir="ltr">{p.code}</bdi>
      </article>
      <p className="wallet-disclosure" role="note">هذه معاينة فقط؛ لم تُضف بطاقة إلى Google Wallet. يتطلب الحفظ الفعلي ربط خدمة إصدار البطاقات.{demo ? ' رمز هذه النسخة للتجربة ولا يثبت حجزًا فعليًا.' : ''}</p>
    </Dialog>
  </>;
}
