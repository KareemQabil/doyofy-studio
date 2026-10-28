import { useState } from 'react';
import { Link } from '../../app/router';
import { usePrototype, useServices } from '../../app/data';
import { Dialog, Icon } from '../../ui';
import { ConfirmDialog } from '../../ui/primitives/Overlay';
import { AppearanceSwitch } from '../../ui/primitives/AppearanceSwitch';
import { useDemoAccount } from './session';
export function AccountMenu() {
  const [open, setOpen] = useState(false); const [resetAsk, setResetAsk] = useState(false); const proto = usePrototype(); const a = useDemoAccount(), user = useServices().session.currentUser();
  if (a.status === 'signed-out') return <Link to="/app/login" className="account-login-link">تسجيل الدخول</Link>;
  const name = a.name || user.name;
  return <><button type="button" className="account-trigger" aria-label={`حسابك: ${name}`} aria-haspopup="dialog" onClick={() => setOpen(true)}><span className="account-avatar" aria-hidden="true">{[...name][0]}</span><Icon name="chevron-down" size="sm" /></button>
    <Dialog open={open} title="حسابك" description={`${name} · جلسة تجربة`} onClose={() => setOpen(false)} size="sm" className="account-menu">
      <nav className="account-links" aria-label="خيارات الحساب"><Link to="/app/account" onClick={() => setOpen(false)}><Icon name="user" />الملف الشخصي<Icon name="forward" size="sm" /></Link><Link to="/app/help" onClick={() => setOpen(false)}><Icon name="info" />دليل ضيوفي<Icon name="forward" size="sm" /></Link><Link to="/app/logout" onClick={() => setOpen(false)}><Icon name="back" />تسجيل الخروج<Icon name="forward" size="sm" /></Link></nav>
      <div className="account-appearance"><AppearanceSwitch /></div>
      <button type="button" className="account-reset" onClick={() => setResetAsk(true)}><Icon name="refresh" size="sm" />ابدأ التجربة من جديد</button>
    </Dialog>
    <ConfirmDialog open={resetAsk} title="البدء من جديد؟" body="تُحذف المناسبات والضيوف التي أضفتها على هذا الجهاز، وتعود البيانات التجريبية كما كانت." confirmLabel="ابدأ من جديد" cancelLabel="تراجع" tone="danger"
      onConfirm={() => { proto.reset('before'); setResetAsk(false); setOpen(false); location.assign('/app/events'); }} onCancel={() => setResetAsk(false)} /></>;
}
