import { useState } from 'react';
import { Link } from '../../app/router';
import { useServices } from '../../app/data';
import { Dialog, Icon } from '../../ui';
import { ThemePicker } from '../../ui/primitives/ThemePicker';
import { useDemoAccount } from './session';
export function AccountMenu() {
  const [open, setOpen] = useState(false); const a = useDemoAccount(), user = useServices().session.currentUser();
  if (a.status === 'signed-out') return <Link to="/app/login" className="account-login-link">تسجيل الدخول</Link>;
  const name = a.name || user.name;
  return <><button type="button" className="account-trigger" aria-label={`حسابك: ${name}`} aria-haspopup="dialog" onClick={() => setOpen(true)}><span className="account-avatar" aria-hidden="true">{[...name][0]}</span><Icon name="chevron-down" size="sm" /></button>
    <Dialog open={open} title="حسابك" description={`${name} · جلسة تجربة`} onClose={() => setOpen(false)} size="sm" className="account-menu">
      <nav className="account-links" aria-label="خيارات الحساب"><Link to="/app/account" onClick={() => setOpen(false)}><Icon name="user" />الملف الشخصي<Icon name="forward" size="sm" /></Link><Link to="/app/help" onClick={() => setOpen(false)}><Icon name="info" />دليل ضيوفي<Icon name="forward" size="sm" /></Link><Link to="/app/logout" onClick={() => setOpen(false)}><Icon name="back" />تسجيل الخروج<Icon name="forward" size="sm" /></Link></nav>
      <div className="account-appearance"><p>مظهر المنصة</p><ThemePicker /></div>
    </Dialog></>;
}
