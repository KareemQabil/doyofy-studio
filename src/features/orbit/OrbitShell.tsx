import { AccountMenu } from '../account/AccountMenu';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {useLocation,Link,useNavigate,matchPath} from '../../app/router';
import {paths} from '../../app/paths';
import {ThemePicker} from '../../ui/primitives/ThemePicker';
import {Logo} from '../../ui/brand';
import {Icon, type IconName} from '../../ui/icons';
import {Dialog} from '../../ui/primitives/Overlay';
import {normaliseForSearch} from '../../domain/parties';
import type {NavItem} from '../../ui/layouts/Layouts';

export function OrbitQuickOpen(){
 const [open,setOpen]=useState(false),[q,setQ]=useState('');const input=useRef<HTMLInputElement>(null),loc=useLocation(),navigate=useNavigate();
 const segments=loc.pathname.split('/');const id=segments.length>4?matchPath('/app/events/:id',segments.slice(0,4).join('/'))?.id:undefined;
 const actions:Array<{label:string;to:string;icon:IconName}>=[{label:'مساحة مناسباتي',to:paths.events,icon:'home'},{label:'فرحة جديدة',to:paths.newEvent,icon:'plus'},...(id?[
  {label:'خريطة المناسبة',to:paths.overview(id),icon:'sparkle' as const},{label:'تصميم الدعوة',to:paths.design(id),icon:'envelope' as const},{label:'دفتر الضيوف',to:paths.guests(id),icon:'users' as const},{label:'الردود',to:paths.rsvp(id),icon:'chat' as const},{label:'ترتيب الطاولات',to:paths.seating(id),icon:'table' as const},{label:'الاستقبال',to:paths.checkin(id),icon:'door' as const},{label:'تفاصيل المناسبة',to:paths.settings(id),icon:'settings' as const}]:[])];
 const filtered=actions.filter(a=>normaliseForSearch(a.label).includes(normaliseForSearch(q)));
 useEffect(()=>{const on=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){if(!open&&document.querySelector('dialog[open]'))return;e.preventDefault();setOpen(v=>!v);setQ('');}};window.addEventListener('keydown',on);return()=>window.removeEventListener('keydown',on);},[open]);
 const choose=(to:string)=>{setOpen(false);setQ('');navigate(to);};
 return <><button type="button" className="orbit-quick" onClick={()=>{setQ('');setOpen(true);}} aria-label="افتح سريعًا"><Icon name="search" size="sm"/><span>افتح سريعًا</span><kbd>⌘ K</kbd></button>
 <Dialog open={open} onClose={()=>setOpen(false)} title="إلى أين نذهب؟" size="md" className="orbit-command"><input ref={input} data-autofocus className="input" aria-label="ابحث عن مهمة" value={q} placeholder="الدعوة، الضيوف، الطاولات…" onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&filtered[0]){e.preventDefault();choose(filtered[0].to);}}}/><div className="orbit-command-list">{filtered.map(a=><button type="button" key={a.to} onClick={()=>choose(a.to)}><Icon name={a.icon}/>{a.label}<Icon name="forward" size="sm"/></button>)}{!filtered.length&&<p role="status">لم نجد مهمة بهذا الاسم.</p>}</div></Dialog></>;
}
export function OrbitShell({children,right}:{children:ReactNode;right?:ReactNode}){
 return <div className="orbit-shell"><a href="#main" className="skip-link">تخطَّ إلى المحتوى</a><header className="orbit-header"><Link to={paths.events} className="orbit-brand" aria-label="ضيوفي — مساحة مناسباتي"><Logo height={28}/></Link><span className="orbit-edition"><i/>مدار الفرحة<span>06</span></span><OrbitQuickOpen/><ThemePicker compact/>{right ?? <AccountMenu />}</header>{children}</div>;
}
export function OrbitWorkspace({context,nav,footer,children}:{context:ReactNode;nav:NavItem[];footer?:ReactNode;children:ReactNode}){
 const [expanded,setExpanded]=useState(false);const active=nav.find(n=>n.active),group=active?.group??nav[0]?.group;
 const shown=expanded?nav:nav.filter(n=>n.group===group),groups=[...new Set(nav.map(n=>n.group).filter(Boolean))];
 return <div className="orbit-workspace"><header className="orbit-context"><div>{context}</div><button type="button" className="orbit-sections-toggle" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}><Icon name={expanded?'close':'menu'} size="sm"/>{expanded?'ركّز على هذه المرحلة':'كل مساحات المناسبة'}</button></header>
 <nav className="orbit-phase-switch" aria-label="مراحل المناسبة">{groups.map(g=><Link key={g} to={nav.find(n=>n.group===g)!.to} className={group===g?'is-current':''}>{g}</Link>)}</nav>
 <nav className="orbit-chapters" aria-label="مساحات المناسبة">{shown.map(n=><Link key={n.to} to={n.to} className={n.active?'is-active':''} aria-current={n.active?'page':undefined}><span className="orbit-chapter-num">0{nav.indexOf(n)+1}</span><Icon name={n.icon}/><span>{n.label}</span>{n.badge!=null&&n.badge!==0&&<b>{n.badge}</b>}</Link>)}</nav>
 <main id="main" className="orbit-work-content" tabIndex={-1}>{children}</main><footer className="orbit-work-foot">{footer}</footer></div>;
}
