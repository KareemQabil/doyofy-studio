import { useState } from 'react';
import { Link } from '../../app/router';
import { usePrototype, useServices } from '../../app/data';
import { Dialog, Icon } from '../../ui';
import { ConfirmDialog } from '../../ui/primitives/Overlay';
import { AppearanceSwitch } from '../../ui/primitives/AppearanceSwitch';
import { useDemoAccount } from './session';
import { useCopy } from '../../ui/copy';
export function AccountMenu() {
  const { t } = useCopy();
  const [open, setOpen] = useState(false); const [resetAsk, setResetAsk] = useState(false); const proto = usePrototype(); const a = useDemoAccount(), user = useServices().session.currentUser();
  if (a.status === 'signed-out') return <Link to="/app/login" className="account-login-link">{t('login')}</Link>;
  const name = a.name || user.name;
  return <><button type="button" className="account-trigger" aria-label={t('shAccountOf', { name })} aria-haspopup="dialog" onClick={() => setOpen(true)}><span className="account-avatar" aria-hidden="true">{[...name][0]}</span><Icon name="chevron-down" size="sm" /></button>
    <Dialog open={open} title={t('account')} description={t('shDemoSession', { name })} onClose={() => setOpen(false)} size="sm" className="account-menu">
      <nav className="account-links" aria-label={t('accountOptions')}><Link to="/app/account" onClick={() => setOpen(false)}><Icon name="user" />{t('account')}<Icon name="forward" size="sm" /></Link><Link to="/app/help" onClick={() => setOpen(false)}><Icon name="info" />{t('help')}<Icon name="forward" size="sm" /></Link><Link to="/app/logout" onClick={() => setOpen(false)}><Icon name="back" />{t('logout')}<Icon name="forward" size="sm" /></Link></nav>
      <div className="account-appearance"><AppearanceSwitch /></div>
      <button type="button" className="account-reset" onClick={() => setResetAsk(true)}><Icon name="refresh" size="sm" />{t('resetDemo')}</button>
    </Dialog>
    <ConfirmDialog open={resetAsk} title={t('shResetQ')} body={t('shResetBody')} confirmLabel={t('shResetGo')} cancelLabel={t('cancel')} tone="danger"
      onConfirm={() => { proto.reset('before'); setResetAsk(false); setOpen(false); location.assign('/app/events'); }} onCancel={() => setResetAsk(false)} /></>;
}
