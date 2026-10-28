import { JourneyArtwork } from '../../ui/primitives/JourneyArtwork';
/** Event closure, with useful outcomes and an honest, editable thank-you. */
import { useState } from 'react';
import type { Event } from '../../domain/types';
import { countParties } from '../../domain/parties';
import { eventPhase } from '../../domain/event';
import { formatEventDate, plural, P } from '../../domain/format';
import { Banner, Button, ConfirmDialog, ErrorState, Icon, PageHeader, Panel, Textarea, Field, PageLoader } from '../../ui';
import { useMutation, useNow } from '../../app/data';
import { useNavigate } from '../../app/router';
import { paths } from '../../app/paths';
import { useParties } from '../shared/queries';
import { copyText } from '../shared/CopyField';
import { errorMessage } from '../../services/errors';

export function SummaryPage({ event }: { event: Event }) {
  const parties=useParties(event.id), now=useNow(), navigate=useNavigate();
  const [thanked,setThanked]=useState(false), [archiving,setArchiving]=useState(false), [copied,setCopied]=useState(false), [copyFailed,setCopyFailed]=useState(false);
  const [message,setMessage]=useState(`شكرًا لأنكم كنتم جزءًا من فرحتنا في ${event.title}. حضوركم جعلها أجمل، وذكراها تبقى معنا. بكل المحبة.`);
  const archive=useMutation(s=>s.events.archive(event.id),{onSuccess:()=>navigate(paths.events,{force:true})});
  if(parties.error)return <ErrorState error={parties.error} onRetry={parties.refetch}/>;
  if(parties.loading)return <PageLoader />;
  const all=parties.data!,c=countParties(all),phase=eventPhase(event,now), completed=phase==='completed'||phase==='archived';
  const confirmedArrivals=all.reduce((n,p)=>n+(p.rsvpStatus==='confirmed'?Math.min(p.checkedInCount,p.confirmedPartySize??0):0),0);
  const remaining=Math.max(0,c.confirmedPeople-confirmedArrivals);
  const bars=[{label:'المقاعد المتاحة للدعوات',value:c.maxSeats,tone:'neutral'},{label:'أكدوا الحضور',value:c.confirmedPeople,tone:'success'},{label:'سُجّل وصولهم',value:c.checkedInPeople,tone:'accent'}];
  const max=Math.max(1,...bars.map(b=>b.value));
  return <>
    <PageHeader title="ملخص المناسبة" subtitle={`${event.title} · ${formatEventDate(event.date)}`}/>
    {!completed&&<Banner tone="info">المناسبة لم تنتهِ بعد. هذه أرقام اللحظة، ويكتمل الملخص بعد الاستقبال.</Banner>}
    <section className="summary-closure has-editorial">
      {<picture className="summary-photo" aria-hidden="true"><source srcSet="assets/editorial/celebration-table.avif" type="image/avif" /><img src="assets/editorial/celebration-table.webp" alt="" width="1536" height="1024" loading="lazy" decoding="async" /></picture>}
      <div className="summary-closure-copy"><JourneyArtwork kind="celebrate"/><p className="eyebrow">{completed?'وتبقى المحبة':'لحظات تتشكّل'}</p><h2>{completed?'كل حضور، صنع ذكرى.':'فرحتك تكتمل بضيوفك.'}</h2><p>{c.checkedInPeople?<>شارككم <strong>{c.checkedInPeople}</strong> شخصًا بحسب سجل الاستقبال.</>:'لم تُسجّل عمليات وصول لهذه المناسبة.'}</p></div>
    </section>
    <div className="summary-layout">
      <section className="summary-outcome"><h2>كيف اجتمع الأحباب؟</h2><ul className="summary-bars">{bars.map(b=><li key={b.label}><span className="summary-label">{b.label}</span><span className="summary-track"><span className={`summary-fill tone-${b.tone}`} style={{width:`${b.value/max*100}%`}}/></span><span className="summary-value num">{b.value}</span></li>)}</ul><p className="faint t-sm">{plural(c.parties,P.invitation)} · {c.declinedParties} اعتذروا · {c.pendingParties} لم يردوا.</p>{c.confirmedPeople>0&&<p className="faint t-sm">{remaining?`${remaining} من الأشخاص المؤكدين لم يُسجّل وصولهم، ويشمل ذلك المرافقين الذين لم يصلوا.`:'سُجّل وصول كل الأشخاص المؤكدين.'}</p>}</section>
      <section className="summary-thanks"><h2>كلمة أخيرة… من القلب.</h2><p className="muted t-sm">رسالة بسيطة تترك أثرًا جميلًا. انسخها وشاركها مع ضيوفك.</p><Field label="رسالة الشكر"><Textarea rows={4} value={message} onChange={e=>{setMessage(e.target.value);setCopied(false);}}/></Field><Button variant="primary" icon={copied?'check':'copy'} disabled={!message.trim()} onClick={async()=>{const ok=await copyText(message);setCopied(ok);setCopyFailed(!ok);}}>{copied?'تم نسخ الرسالة':'انسخ رسالة الشكر'}</Button>{copyFailed&&<p role="status" className="field-hint">تعذّر النسخ التلقائي. حدّد نص الرسالة وانسخه يدويًا.</p>}<details className="drawer-secondary"><summary>تجربة إرسال الشكر</summary><p className="faint t-sm">محاكاة فقط؛ لن تُرسل أي رسالة فعلية.</p><Button size="sm" disabled={thanked||!c.arrivedParties} onClick={()=>setThanked(true)}>{thanked?'اكتملت المحاكاة':`جرّب الإرسال إلى ${c.arrivedParties} دعوات`}</Button></details></section>
    </div>
    {!event.archivedAt&&<div className="summary-archive"><div><h2>احتفظ بها ضمن ذكرياتك</h2><p>الأرشفة تحتفظ بالبيانات وتوقف رابط الدعوة. ويمكنك إعادتها لاحقًا.</p></div><Button icon="archive" onClick={()=>setArchiving(true)}>أرشفة المناسبة</Button></div>}
    {archive.error&&<Banner tone="danger">{errorMessage(archive.error)}</Banner>}
    <ConfirmDialog open={archiving} tone="danger" title="أرشفة المناسبة؟" body="سيتوقف رابط الدعوة، وتبقى بيانات المناسبة محفوظة في هذا المتصفح." confirmLabel="أرشفة" loading={archive.pending} onCancel={()=>setArchiving(false)} onConfirm={()=>void archive.run()}/>
  </>;
}
