/**
 * «أضف إلى Google Wallet» at the end of a confirmed personal reply. Issuing a real pass needs a Wallet issuer
 * service, which this build does not have, so the button opens a preview of the pass and says plainly — next to
 * the button and inside the preview — that nothing was added. Declined replies and general links never get here.
 * The button follows Google's brand guidance (black pill, light outline, the four-colour Wallet mark), drawn in SVG.
 */
import { useState } from 'react';
import type { GuestView } from '../../services/contracts';
import { formatEventDate, formatTime, people } from '../../domain/format';
import { Button, Dialog, LogoMark } from '../../ui';
import { useCopy } from '../../ui/copy';
import { QrCode } from './QrCode';

/** the Google Wallet mark: a wallet with three cards tucked behind its front (no image is fetched) */
function WalletMark() {
  return (
    <svg className="gw-mark" viewBox="0 0 24 20" width="24" height="20" aria-hidden="true" focusable="false">
      <rect className="gw-c1" x="1" y="1" width="22" height="9" rx="2.4" />
      <rect className="gw-c2" x="1" y="4.2" width="22" height="9" rx="2.4" />
      <rect className="gw-c3" x="1" y="7.4" width="22" height="9" rx="2.4" />
      <path className="gw-c4" d="M1 11.4c0-.7.6-1.1 1.2-.9L9.5 13a7.5 7.5 0 0 0 5 0l7.3-2.5c.6-.2 1.2.2 1.2.9v5.2A2.4 2.4 0 0 1 20.6 19H3.4A2.4 2.4 0 0 1 1 16.6z" />
    </svg>
  );
}

export function GoogleWalletButton({ onClick }: { onClick: () => void }) {
  const { t } = useCopy();
  return (
    <button type="button" className="gw-btn" onClick={onClick} aria-haspopup="dialog">
      <WalletMark /><span className="gw-label">{t('guestAddToWallet')}</span>
    </button>
  );
}

export function WalletPreview({ view, value, demo = false }: { view: GuestView; value: string; demo?: boolean }) {
  const [open, setOpen] = useState(false);
  if (!view.party || view.party.rsvpStatus !== 'confirmed') return null;
  const p = view.party;
  const ev = view.event;
  return <>
    <div className="gw-wrap">
      <GoogleWalletButton onClick={() => setOpen(true)} />
      <p className="gw-note">يفتح معاينة لشكل البطاقة — لا تُضاف فعليًا.</p>
    </div>
    <Dialog open={open} title="معاينة بطاقة Google Wallet" description="هكذا تظهر بطاقة دخولكم في المحفظة." onClose={() => setOpen(false)} size="sm" className="theme-guest wallet-dialog"
      footer={<Button variant="primary" onClick={() => setOpen(false)}>العودة إلى رمز الدخول</Button>}>
      <p className="wallet-disclosure" role="note">هذه معاينة فقط — لم تُضف أي بطاقة إلى Google Wallet.{demo ? ' رمز هذه النسخة للتجربة ولا يثبت حجزًا.' : ''}</p>
      <article className="wpass" aria-label={`بطاقة دخول ${p.name}`}>
        <header className="wpass-top">
          <span className="wpass-logo"><LogoMark size={20} /></span>
          <span className="wpass-issuer">ضيوفي</span>
          <span className="wpass-kind">بطاقة دخول</span>
        </header>
        <h3 className="wpass-title">{ev.title}</h3>
        <dl className="wpass-fields">
          <div><dt>التاريخ</dt><dd>{formatEventDate(ev.date)}</dd></div>
          <div><dt>الوقت</dt><dd>{formatTime(ev.time)}</dd></div>
          <div className="is-wide"><dt>المكان</dt><dd>{ev.venue.name} · {ev.venue.city}</dd></div>
          <div><dt>الضيف</dt><dd><bdi>{p.name}</bdi></dd></div>
          <div><dt>العدد</dt><dd>{people(p.confirmedPartySize ?? 1)}</dd></div>
          {p.tableName && <div className="is-wide"><dt>الطاولة</dt><dd>{p.tableName}</dd></div>}
        </dl>
        <div className="wpass-code">
          <QrCode value={value} size={168} label={`رمز QR لدخول ${p.name}`} />
          <bdi className="num" dir="ltr">{p.code}</bdi>
        </div>
      </article>
    </Dialog>
  </>;
}
