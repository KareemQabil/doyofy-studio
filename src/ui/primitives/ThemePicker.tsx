import { useState } from 'react';
import { THEMES } from '../../domain/themes';
import { usePrototype } from '../../app/data';
import { useReviewSettings } from '../../app/review';
import { Icon } from '../icons';
import { Dialog } from './Overlay';
import { Button } from './Button';
import { Link } from '../../app/router';

export function ThemePicker({ compact = false, inline = false }: { compact?: boolean; inline?: boolean }) {
  const [open,setOpen]=useState(false);
  const {theme}=useReviewSettings();const proto=usePrototype();
  const current=THEMES.find(t=>t.id===theme)!;
  const cards=<div className="theme-options" role="group" aria-label="ثيم الواجهة">{THEMES.map(t=><button type="button" key={t.id} className={`theme-option${theme===t.id?' is-selected':''}`} aria-pressed={theme===t.id} onClick={()=>proto.update({theme:t.id})}>
    <span className="theme-mini" data-preview-theme={t.id} style={{'--sample-bg':t.colors[0],'--sample-art':t.colors[1],'--sample-ink':t.colors[2],'--sample-radius':t.radius} as React.CSSProperties} aria-hidden="true"><span className="theme-mini-nav"><i/><i/><i/></span><span className="theme-mini-content"><span className="theme-mini-lines"><b/><i/><i/><em/></span><span className="theme-mini-poster"><i/></span></span><span className="theme-mini-bottom"><i/><i/><i/></span></span>
    <span className="theme-option-title">{t.label}<span className="theme-check"><Icon name="check" size="sm"/></span></span><span className="theme-option-note">{t.line}</span><span className="theme-swatch-row" aria-hidden="true">{t.colors.map(c=><i key={c} style={{background:c}}/>)}</span>
  </button>)}</div>;
  if(inline)return cards;
  return <><button type="button" className={`theme-trigger${compact?' is-compact':''}`} onClick={()=>setOpen(true)} aria-label={`تغيير المظهر، الحالي ${current.label}`} aria-haspopup="dialog"><span className="theme-trigger-dot"/><Icon name="palette" size="sm"/>{!compact&&<span>المظهر</span>}</button>
    <Dialog open={open} onClose={()=>setOpen(false)} title="اختر إحساس المكان" description="سبعة اتجاهات، لكل منها شخصيته. جرّب أيًّا منها؛ اختيارك يُحفظ فورًا." size="lg" gestureDismiss className="theme-dialog" footer={<><p className="theme-current" role="status">المظهر الحالي: {current.label}</p><Button variant="primary" onClick={()=>setOpen(false)}>هذا يناسبني</Button></>}>
      {cards}<Link className="theme-lab-open" to="/prototype/design-directions" onClick={()=>setOpen(false)}>استكشف الاتجاهات بصورها وتفاصيلها <Icon name="forward" size="sm"/></Link><p className="theme-explanation">«بهجة» و«مدار الفرحة» يغيّران طريقة العرض والتنقّل أيضًا. محتوى دعوتك وبياناتك تبقى محفوظة.</p>
    </Dialog></>;
}
