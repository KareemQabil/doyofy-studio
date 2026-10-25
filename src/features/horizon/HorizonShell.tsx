import { AccountMenu } from '../account/AccountMenu';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from '../../app/router';
import { paths } from '../../app/paths';
import { ThemePicker } from '../../ui/primitives/ThemePicker';
import { Logo } from '../../ui/brand';
import { Icon } from '../../ui/icons';
import type { NavItem } from '../../ui/layouts/Layouts';
export function HorizonShell({children,right}:{children:ReactNode;right?:ReactNode}) {
 return <div className="horizon-shell"><a href="#main" className="skip-link">تخطَّ إلى المحتوى</a><header className="horizon-header"><Link to={paths.events} aria-label="ضيوفي — مناسباتي"><Logo height={30}/></Link><span className="horizon-edition">أفق / 08</span><nav aria-label="القائمة الرئيسية"><Link to={paths.events}>مناسباتي</Link><Link to="/prototype/screen-review">مراجعة الرحلة</Link></nav><ThemePicker compact/>{right ?? <AccountMenu />}</header>{children}</div>;
}
export function HorizonWorkspace({context,nav,footer,children}:{context:ReactNode;nav:NavItem[];footer?:ReactNode;children:ReactNode}) {
 const essential=nav.filter(n=>['home','envelope','users','door'].includes(n.icon)),optional=nav.filter(n=>!essential.includes(n)),active=optional.some(n=>n.active);
 const [more,setMore]=useState(active);useEffect(()=>{if(active)setMore(true);},[active]);
 return <div className="horizon-workspace"><aside className="horizon-rail"><div className="horizon-context">{context}</div><nav className="horizon-steps" aria-label="رحلة المناسبة">{essential.map((n,i)=><Link key={n.to} to={n.to} aria-current={n.active?'page':undefined}><span className="horizon-step-index">{String(i+1).padStart(2,'0')}</span><Icon name={n.icon} size="sm"/><span>{n.label}</span>{!!n.badge&&<b>{n.badge}</b>}</Link>)}</nav><button type="button" className="horizon-extras" aria-expanded={more} onClick={()=>setMore(v=>!v)}><Icon name="sliders" size="sm"/>تفاصيل إضافية</button>{more&&<nav className="horizon-optional" aria-label="تفاصيل إضافية">{optional.map(n=><Link key={n.to} to={n.to} aria-current={n.active?'page':undefined}><Icon name={n.icon} size="sm"/>{n.label}{n.icon==='table'&&<small>اختياري</small>}</Link>)}</nav>}<div className="horizon-rail-foot">{footer}</div></aside><main id="main" className="horizon-content" tabIndex={-1}>{children}</main></div>;
}
