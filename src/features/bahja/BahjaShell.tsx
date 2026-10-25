import { AccountMenu } from '../account/AccountMenu';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from '../../app/router';
import { paths } from '../../app/paths';
import { ThemePicker } from '../../ui/primitives/ThemePicker';
import { Logo } from '../../ui/brand';
import { Icon } from '../../ui/icons';
import type { NavItem } from '../../ui/layouts/Layouts';

export function BahjaShell({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return <div className="bahja-shell"><a href="#main" className="skip-link">تخطَّ إلى المحتوى</a><header className="bahja-header"><Link to={paths.events} className="bahja-brand" aria-label="ضيوفي — مناسباتي"><Logo height={30}/></Link><span className="bahja-edition"><i/>بهجة / 07</span><nav aria-label="القائمة الرئيسية"><Link to={paths.events}>مناسباتي</Link><Link to={paths.newEvent}><Icon name="plus" size="sm"/>مناسبة جديدة</Link></nav><ThemePicker compact/>{right ?? <AccountMenu />}</header>{children}</div>;
}

export function BahjaWorkspace({ context, nav, footer, children }: { context: ReactNode; nav: NavItem[]; footer?: ReactNode; children: ReactNode }) {
  const [more,setMore] = useState(false);
  const essential = nav.filter(n=>['home','envelope','users','door'].includes(n.icon));
  const optional = nav.filter(n=>!essential.includes(n));
  const extraActive=optional.some(n=>n.active);
  useEffect(()=>{if(extraActive)setMore(true);},[extraActive]);
  return <div className="bahja-workspace"><div className="bahja-work-context">{context}</div><div className="bahja-nav-wrap"><nav className="bahja-stepnav" aria-label="رحلة المناسبة">{essential.map((n,i)=><Link key={n.to} to={n.to} aria-current={n.active?'page':undefined} className={n.active?'is-active':''}><span className="bahja-step-num">{i===0?<Icon name="home" size="sm"/>:String(i).padStart(2,'0')}</span><span>{n.label}</span>{n.badge!=null&&n.badge!==0&&<b>{n.badge}</b>}</Link>)}</nav><button type="button" className="bahja-more" aria-expanded={more} onClick={()=>setMore(v=>!v)}><Icon name="sliders" size="sm"/>تفاصيل إضافية</button></div>{more&&<nav className="bahja-optional" aria-label="تفاصيل إضافية">{optional.map(n=><Link to={n.to} key={n.to} aria-current={n.active?'page':undefined}><Icon name={n.icon} size="sm"/>{n.label}{n.icon==='table'&&<small>اختياري</small>}</Link>)}</nav>}<main id="main" className="bahja-work-content" tabIndex={-1}>{children}</main><footer className="bahja-work-foot">{footer}</footer></div>;
}
