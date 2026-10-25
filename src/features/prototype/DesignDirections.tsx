/** Six visual directions with real shipped artwork and explicit, persistent try actions. */
import { THEMES } from '../../domain/themes';
import { ThemePicker } from '../../ui/primitives/ThemePicker';
import { usePrototype } from '../../app/data';
import { useReviewSettings } from '../../app/review';
import { Link, useNavigate } from '../../app/router';
import { paths } from '../../app/paths';
import { Button, Icon, LogoMark } from '../../ui';
import { OCCASION_OBJECTS } from '../occasions/OccasionArtwork';

export function DesignDirections(){
  const {theme}=useReviewSettings(),proto=usePrototype(),navigate=useNavigate();
  return <main className="direction-studio">
    <header className="direction-top"><Link to={paths.events} className="brand"><LogoMark size={32}/><span>ضيوفي</span></Link><Link to="/prototype/design-review" className="link-btn">جولة المراجعة</Link><ThemePicker compact/></header>
    <div className="direction-intro"><p className="eyebrow">استوديو المظهر · 01—08</p><h1>نفس الفرحة.<br/>ثمانية عوالم مختلفة.</h1><p>ورق دافئ، حديقة، احتفال مرح، حبر صريح، ضوء بعد الغروب، أو مساحة حيّة تدور حول فرحتك، أو احتفال جريء بتجربة أبسط. كل اتجاه له تكوينه وخطوطه وخاماته؛ اختر ما يشبهك.</p></div>
    <nav className="direction-index" aria-label="الاتجاهات البصرية">{THEMES.map((t,i)=><a href={`#direction-${t.id}`} key={t.id} onClick={e=>{e.preventDefault();document.getElementById(`direction-${t.id}`)?.scrollIntoView?.({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});}}><span>0{i+1}</span>{t.label}</a>)}</nav>
    <div className="direction-collection">{THEMES.map((t,i)=><section className="direction-section" id={`direction-${t.id}`} key={t.id}>
      <div className="direction-caption"><span className="direction-number">0{i+1}</span><div><p className="eyebrow">{t.mood}</p><h2>{t.label}</h2><p>{t.line}</p></div><Button variant={theme===t.id?'secondary':'primary'} iconEnd="forward" onClick={()=>{proto.update({theme:t.id});navigate(paths.events);}}>{theme===t.id?'افتح مظهرك الحالي':'جرّب هذا الاتجاه'}</Button></div>
      <div className="direction-demo" data-direction={t.id} style={{'--demo-bg':t.colors[0],'--demo-art':t.colors[1],'--demo-ink':t.colors[2],'--demo-radius':t.radius} as React.CSSProperties}>
        <div className="direction-demo-toolbar"><span>ضيوفي</span><div><span>مناسباتي</span><span>دعوتك</span><span>ضيوفك</span></div><span className="direction-demo-avatar">ن</span></div>
        <div className="direction-demo-body"><div className="direction-demo-text"><small>فرحة تستحق كل التفاصيل</small><h3>كل حكاية جميلة،<br/>تبدأ بدعوة.</h3><p>زفاف نورة وفيصل</p><div className="direction-demo-action">جهّز فرحتك <Icon name="forward" size="sm"/></div><span className="direction-demo-note">المحتوى نفسه. إحساس جديد.</span></div>
          <div className="direction-demo-art"><img src={t.artwork} alt={`خامات ومشهد اتجاه ${t.label}`} loading="lazy" decoding="async"/><div className="direction-sample-card"><small>بكل الحب</small><strong>نورة<br/><span>و</span>فيصل</strong><i>نلتقي لنصنع أجمل ذكرى</i><span>الرياض · 2026</span></div></div>
        </div>
        <div className="direction-demo-bottom"><span>01 <b>الدعوة</b></span><span>02 <b>أحبابك</b></span><span>03 <b>يومكم</b></span></div>
      </div>
      <div className="direction-details"><p>{t.id==='bahja'?'ملصقات كبيرة، منضدة دعوات حية، واختيار تلقائي يختصر بداية الرحلة.':t.id==='orbit'?'خريطة حيّة، ترتيب بالسحب، تقريب بإصبعين، ومنضدة قوالب بدل المعرض.':t.id==='warm'?'عناوين أميري، قصّة تحريرية، ورق ملموس وزخرفة محسوبة.':t.id==='sage'?'أقواس ومساحات عضوية، ظلال طبيعية، وزوايا أكثر نعومة.':t.id==='rose'?'تكوين غير متماثل، ليلك ووردي، ومجسّمات لامعة خفيفة.':t.id==='ink'?'تكوين معكوس، خطوط حاسمة، ورق معماري وتباين مرتفع.':'مشهد ممتد، نص مضيء، وتفاصيل عنبرية على الأزرق العميق.'}</p><span className="direction-palette">{t.colors.map(c=><i key={c} style={{background:c}} aria-label={c}/>)}</span></div>
    </section>)}</div>
    <section className="direction-objects"><div className="direction-objects-head"><div><p className="eyebrow">لكل لحظة رمزها</p><h2>تفاصيل صغيرة، إحساس كبير.</h2><p>خاتمان لبداية الحكاية، شموع ليومك، وضوء يجمع الأحباب.</p></div><Link className="link-btn" to={paths.newEvent}>اختر مناسبتك <Icon name="forward" size="sm"/></Link></div><div className="direction-object-grid">{OCCASION_OBJECTS.map(a=><figure key={a.id}><div><img src={a.artwork} alt={a.label} loading="lazy" decoding="async"/></div><figcaption>{a.label}</figcaption></figure>)}</div></section>
    <footer className="direction-end"><Icon name="sparkle"/><p>الأسلوب لك. وضيوفي يجمع التفاصيل.</p><Link to={paths.events}>إلى مناسباتك</Link></footer>
  </main>;
}
