/** Owner review: every journey has an entry, with honest prototype limits. */
import { Link } from '../../app/router';
import { paths } from '../../app/paths';
import { useNow, usePrototype } from '../../app/data';
import { CHOOSER_LABEL, THEME_LABEL, useReviewSettings, type ChooserVariant, type ThemeId } from '../../app/review';
import { eventPhase } from '../../domain/event';
import { Icon, LogoMark, Segmented, LinkButton } from '../../ui';
import { ThemePicker } from '../../ui/primitives/ThemePicker';
import { OccasionArt } from '../occasions/OccasionArt';
import { useEvents, useParties } from '../shared/queries';

export function DesignReview() {
  const proto=usePrototype(),{theme,chooser}=useReviewSettings(),events=useEvents(),now=useNow();
  const event=events.data?.find(e=>e.id==='evt_wedding')??events.data?.find(e=>!['completed','archived'].includes(eventPhase(e,now)))??events.data?.[0];
  const guests=useParties(event?.id??'');
  const completed=events.data?.find(e=>['completed','archived'].includes(eventPhase(e,now)))??event;
  const guest=guests.data?.find(p=>p.rsvpStatus==='pending')??guests.data?.[0];
  const surfaces=[
    {title:'ابدأ بمناسبة',note:'اختر الفرحة، ثم الأسماء والموعد والمكان.',to:paths.newEvent,art:'wedding' as const},
    ...(event?[
      {title:'راجع دعوتك',note:'قالب جاهز من بيانات مناسبتك، تضيف لمستك ثم تنشره.',to:paths.design(event.id),art:'engagement' as const},
      {title:'اجمع أحبابك',note:'أضف الضيوف أو استورد قائمتك وشارك روابطهم.',to:paths.guests(event.id),art:'katb_kitab' as const},
      {title:'بعين ضيفك',note:'الدعوة والموعد وتأكيد الحضور.',to:guest?paths.guestLink(event.slug,guest.code):paths.preview(event.id),art:'family' as const},
    ]:[]),
  ];
  const workspace=event?[
    {title:'المناسبة والخطوة التالية',note:'مرحلة المناسبة والتفاصيل التي تحتاج انتباهك',to:paths.overview(event.id),icon:'home'},
    {title:'الدعوة وروابط المشاركة',note:'حالة النشر ومعاينة النسخة التي يراها الضيف',to:paths.invitation(event.id),icon:'envelope'},
    {title:'قائمة الضيوف',note:'ابحث، أضف ضيفًا، وراجع تفاصيل دعوته',to:paths.guests(event.id),icon:'users'},
    {title:'أضف قائمتك من ملف',note:'معاينة الأسماء والتكرارات قبل اعتمادها',to:paths.importGuests(event.id),icon:'upload'},
    {title:'الردود والمتابعة',note:'التأكيدات والاعتذارات ومن ينتظر التذكير',to:paths.rsvp(event.id),icon:'chat'},
    {title:'الطاولات',note:'وزّع المؤكدين وراجع سعة كل طاولة',to:paths.seating(event.id),icon:'table'},
    {title:'جهّز الاستقبال',note:'الاستعداد لليوم ومتابعة عمليات الوصول',to:paths.checkin(event.id),icon:'door'},
    {title:'جرّب شاشة فريق الاستقبال',note:'ابحث عن ضيف، سجّل وصول جزء من العائلة، ثم تراجع',to:paths.gate(event.id),icon:'scan'},
    {title:'تفاصيل المناسبة',note:'الموعد والمكان وقواعد الدعوات',to:paths.settings(event.id),icon:'settings'},
    {title:'بعد آخر ضيف',note:'ملخص الحضور ورسالة الشكر والأرشفة',to:paths.summary(completed!.id),icon:'heart'},
  ]:[];
  return <main className="dr" id="main">
    <div className="row between"><LogoMark size={36} className="dr-mark"/><LinkButton to={paths.events} variant="ghost" icon="back">إلى مناسباتي</LinkButton></div>
    <header className="dr-intro"><p className="eyebrow">ضيوفي · جولة المراجعة</p><h1>من أول فكرة،<br/>حتى أجمل ذكرى.</h1><p>جرّب رحلة المنظّم والضيف والاستقبال. كل مرحلة متصلة بما قبلها، وكل تفصيلة لها مكان.</p></header>
    <section className="dr-section" aria-labelledby="dr-start"><div className="section-head"><h2 id="dr-start" className="dr-h">ابدأ من هنا</h2><span className="faint t-sm">رحلة واحدة، أربع خطوات</span></div><ol className="dr-grid">{surfaces.map((s,i)=><li key={s.title}><Link to={s.to} className="dr-card"><span className="dr-art"><OccasionArt type={s.art}/></span><span className="dr-card-title"><small className="dr-number">{i+1}</small>{s.title}</span><span className="dr-card-note">{s.note}</span></Link></li>)}</ol></section>
    {workspace.length>0&&<section className="dr-section" aria-labelledby="dr-workspace"><h2 id="dr-workspace" className="dr-h">كل تفاصيل المناسبة</h2><ul className="review-route-list">{workspace.map(s=><li key={s.title}><Link to={s.to}><span className="review-route-icon"><Icon name={s.icon}/></span><span><strong>{s.title}</strong><small>{s.note}</small></span><Icon name="forward" size="sm"/></Link></li>)}</ul></section>}
    <div className="review-lab-link"><Icon name="palette"/><div><h2>سبعة اتجاهات. ولحظة تشبهك.</h2><p>استكشف الصور والتكوين والخطوط، ثم جرّب الاتجاه الذي يشبهك.</p></div><LinkButton to="/prototype/design-directions" variant="primary" iconEnd="forward">استوديو المظهر</LinkButton></div><section className="review-prompts"><h2 className="dr-h">وأنت تجرّب…</h2><ol><li>هل عرفت الخطوة التالية من أول نظرة؟</li><li>هل كان الفرق بين الدعوة والرد والوصول واضحًا؟</li><li>جرّب الموبايل: هل قدرت تُكمل المهمة بيد واحدة؟</li></ol><p>دوّن اسم الشاشة وما توقّعته وما حدث. هذا يفيدنا أكثر من تقييم عام للشكل.</p></section>
    <details className="review-options"><summary>خيارات المظهر وتجارب الاختيار</summary><div className="dr-controls"><div className="dr-control"><h2 className="dr-h">المظهر</h2><ThemePicker inline/><p className="dr-note">طابع وخطوط وتكوين مختلف، مع نفس الرحلة والوظائف.</p></div><div className="dr-control"><h2 className="dr-h">اختيار المناسبة</h2><Segmented label="طريقة الاختيار" value={chooser} onChange={(v:ChooserVariant)=>proto.update({occasionChooser:v})} options={(Object.keys(CHOOSER_LABEL) as ChooserVariant[]).map(v=>({value:v,label:CHOOSER_LABEL[v]}))}/><p className="dr-note">المعرض المباشر هو الافتراضي. التجربتان السابقتان متاحتان للمقارنة.</p></div></div></details>
    <aside className="review-limit"><Icon name="info"/><div><h2>عن هذه النسخة</h2><p>نموذج تفاعلي للمراجعة. تُحفظ البيانات في هذا المتصفح، وتعمل الردود بين تبويباته. الربط بين أجهزة مختلفة والحسابات والإرسال التلقائي ومسح الكاميرا ليست مفعّلة. واتساب يفتح رسالة جاهزة ترسلها بنفسك.</p><p>افتح «أدوات التجربة» لاختبار يوم المناسبة، انقطاع الاتصال، وإعادة البيانات النموذجية.</p><Link to="/prototype/design-review?tools=on" className="link-btn">أدوات التجربة</Link></div></aside>
  </main>;
}
