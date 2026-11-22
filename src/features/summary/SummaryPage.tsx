import { JourneyArtwork } from '../../ui/primitives/JourneyArtwork';
/** Event closure, with useful outcomes and an honest, editable thank-you. */
import { useState } from 'react';
import type { Event } from '../../domain/types';
import { countParties } from '../../domain/parties';
import { eventPhase } from '../../domain/event';
import { formatEventDate } from '../../domain/format';
import { Banner, Button, ConfirmDialog, ErrorState, Icon, PageHeader, Panel, Textarea, Field, PageLoader } from '../../ui';
import { useMutation, useNow } from '../../app/data';
import { useNavigate } from '../../app/router';
import { paths } from '../../app/paths';
import { useParties } from '../shared/queries';
import { copyText } from '../shared/CopyField';
import { errorMessage } from '../../services/errors';
import { useCan } from '../shared/OwnerOnly';
import { useCopy } from '../../ui/copy';

export function SummaryPage({ event }: { event: Event }) {
  const parties=useParties(event.id), now=useNow(), navigate=useNavigate();
  const { t, n } = useCopy();
  const [thanked,setThanked]=useState(false), [archiving,setArchiving]=useState(false), [copied,setCopied]=useState(false), [copyFailed,setCopyFailed]=useState(false);
  // the thank-you starts in the organizer's voice; once edited it is their own text
  const [message,setMessage]=useState(()=>t('smThanks',{title:event.title}));
  const archive=useMutation(s=>s.events.archive(event.id),{onSuccess:()=>navigate(paths.events,{force:true})});
  const mayArchive=useCan('event.archive'); // owner only (domain/roles)
  if(parties.error)return <ErrorState error={parties.error} onRetry={parties.refetch}/>;
  if(parties.loading)return <PageLoader />;
  const all=parties.data!,c=countParties(all),phase=eventPhase(event,now), completed=phase==='completed'||phase==='archived';
  const confirmedArrivals=all.reduce((n,p)=>n+(p.rsvpStatus==='confirmed'?Math.min(p.checkedInCount,p.confirmedPartySize??0):0),0);
  const remaining=Math.max(0,c.confirmedPeople-confirmedArrivals);
  const bars=[{label:t('smSeats'),value:c.maxSeats,tone:'neutral'},{label:t('ovConfirmedFact'),value:c.confirmedPeople,tone:'success'},{label:t('smArrived'),value:c.checkedInPeople,tone:'accent'}];
  const max=Math.max(1,...bars.map(b=>b.value));
  return <>
    <PageHeader title={t('stepSummary')} subtitle={`${event.title} · ${formatEventDate(event.date)}`}/>
    {!completed&&<Banner tone="info">{t('smNotYet')}</Banner>}
    {/* the brand's own closure block (colour field, pattern and the celebrate artwork) — no decorative photography */}
    <section className="summary-closure">
      <div className="summary-closure-copy"><JourneyArtwork kind="celebrate"/><p className="eyebrow">{completed?t('smEyebrowDone'):t('smEyebrowLive')}</p><h2>{completed?t('smHeadDone'):t('smHeadLive')}</h2><p>{c.checkedInPeople?<>{t('smSharedPre')} <strong>{n(c.checkedInPeople,'person')}</strong> {t('smSharedPost')}</>:t('smNoArrivals')}</p></div>
    </section>
    <div className="summary-layout">
      <section className="summary-outcome"><h2>{t('smHow')}</h2><ul className="summary-bars">{bars.map(b=><li key={b.label}><span className="summary-label">{b.label}</span><span className="summary-track"><span className={`summary-fill tone-${b.tone}`} style={{width:`${b.value/max*100}%`}}/></span><span className="summary-value num">{b.value}</span></li>)}</ul><p className="faint t-sm">{t('smCounts',{invitations:n(c.parties,'invitation'),declined:c.declinedParties,pending:c.pendingParties})}</p>{c.confirmedPeople>0&&<p className="faint t-sm">{remaining?t('smRemaining',{n:remaining}):t('smAllArrived')}</p>}</section>
      <section className="summary-thanks"><h2>{t('smLastWord')}</h2><p className="muted t-sm">{t('smLastWordHint')}</p><Field label={t('smThanksLabel')}><Textarea rows={4} value={message} onChange={e=>{setMessage(e.target.value);setCopied(false);}}/></Field><Button variant="primary" icon={copied?'check':'copy'} disabled={!message.trim()} onClick={async()=>{const ok=await copyText(message);setCopied(ok);setCopyFailed(!ok);}}>{copied?t('smCopied'):t('smCopy')}</Button>{copyFailed&&<p role="status" className="field-hint">{t('smCopyFailed')}</p>}<details className="drawer-secondary"><summary>{t('smTry')}</summary><p className="faint t-sm">{t('smSimOnly')}</p><Button size="sm" disabled={thanked||!c.arrivedParties} onClick={()=>setThanked(true)}>{thanked?t('smSimDone'):t('smTrySend',{invitations:n(c.arrivedParties,'invitation',true)})}</Button></details></section>
    </div>
    {!event.archivedAt&&mayArchive&&<div className="summary-archive"><div><h2>{t('smKeep')}</h2><p>{t('smKeepText')}</p></div><Button icon="archive" onClick={()=>setArchiving(true)}>{t('setArchive')}</Button></div>}
    {archive.error&&<Banner tone="danger">{errorMessage(archive.error)}</Banner>}
    <ConfirmDialog open={archiving} tone="danger" title={t('setArchiveQ')} body={t('smArchiveBody')} confirmLabel={t('setArchiveShort')} loading={archive.pending} onCancel={()=>setArchiving(false)} onConfirm={()=>void archive.run()}/>
  </>;
}
