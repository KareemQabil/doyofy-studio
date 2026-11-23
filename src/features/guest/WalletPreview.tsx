/**
 * «أضف إلى Google Wallet» at the end of a confirmed personal reply. Issuing a real pass needs a Wallet issuer
 * service, which this build does not have, so the button opens a preview of the pass and says plainly — next to
 * the button and inside the preview — that nothing was added. Declined replies and general links never get here.
 * The button follows Google's brand guidance (black pill, light outline, the four-colour Wallet mark), drawn in SVG.
 */
import { useState } from 'react';
import type { GuestView } from '../../services/contracts';
import { invitationNumbers } from '../../domain/format';
import { hasVenue, placeLine } from '../../domain/event';
import { faceDigits } from '../../domain/templates';
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
  const { t, n } = useCopy();
  if (!view.party || view.party.rsvpStatus !== 'confirmed') return null;
  const p = view.party;
  const ev = view.event;
  // our own pass (not a copy of Google's layout), so it writes the invitation's numbers as its card does
  const N = invitationNumbers(faceDigits(view.design.cardId));
  return <>
    <div className="gw-wrap">
      <GoogleWalletButton onClick={() => setOpen(true)} />
      <p className="gw-note">{t('gwNote')}</p>
    </div>
    <Dialog open={open} title={t('gwTitle')} description={t('gwHint')} onClose={() => setOpen(false)} size="sm" className="theme-guest wallet-dialog"
      footer={<Button variant="primary" onClick={() => setOpen(false)}>{t('gwBack')}</Button>}>
      <p className="wallet-disclosure" role="note">{t('gwOnly')}{demo ? t('gwDemoCode') : ''}</p>
      <article className="wpass" aria-label={t('shPassFor', { name: p.name })}>
        <header className="wpass-top">
          <span className="wpass-logo"><LogoMark size={20} /></span>
          <span className="wpass-issuer">ضيوفي</span>
          <span className="wpass-kind">{t('gwPass')}</span>
        </header>
        <h3 className="wpass-title">{ev.title}</h3>
        <dl className="wpass-fields">
          <div><dt>{t('gwDate')}</dt><dd>{N.date(ev.date)}</dd></div>
          <div><dt>{t('gwTime')}</dt><dd>{N.time(ev.time)}</dd></div>
          {hasVenue(ev.venue) && <div className="is-wide"><dt>{t('gwPlace')}</dt><dd>{placeLine(ev.venue)}</dd></div>}
          <div><dt>{t('gwGuest')}</dt><dd><bdi>{p.name}</bdi></dd></div>
          <div><dt>{t('gwCount')}</dt><dd>{N.text(n(p.confirmedPartySize ?? 1, 'person'))}</dd></div>
          {p.tableName && <div className="is-wide"><dt>{t('gwTable')}</dt><dd>{p.tableName}</dd></div>}
        </dl>
        <div className="wpass-code">
          <QrCode value={value} size={168} label={t('shQrFor', { name: p.name })} />
          <bdi className="num" dir="ltr">{p.code}</bdi>
        </div>
      </article>
    </Dialog>
  </>;
}
