/**
 * Guest details (drawer). Invitation delivery and RSVP are shown as SEPARATE states (spec §13/§15),
 * and every delivery state says who knows it: the platform, the organizer (manual), or a simulation.
 */
import { useState } from 'react';
import type { Event, InvitationParty, PublishState, Table } from '../../domain/types';
import { CHECKIN_STATUS, INVITATION_STATUS, RSVP_STATUS, duplicatePhoneIds, invitationStatus, partyNeedsAttention } from '../../domain/parties';
import { ARRIVAL_KEY, FLAG_KEY, INVITATION_KEY, RSVP_KEY, SOURCE_KEY } from '../../domain/copy/guests';
import { formatPhone, relativeTime } from '../../domain/format';
import { Badge, Banner, Button, ConfirmDialog, Dialog, Icon, KeyValue, Menu, Status } from '../../ui';
import { useMutation, useNow, useServices } from '../../app/data';
import { useGuestLink } from '../shared/share-link';
import { useRouter } from '../../app/router';
import { paths } from '../../app/paths';
import { useToast } from '../../ui/primitives/Feedback';
import { errorMessage } from '../../services/errors';
import { CopyField, copyText } from '../shared/CopyField';
import { RecordRsvpDialog } from '../rsvp/RecordRsvpDialog';
import { PartyFormDialog } from './PartyForm';
import { inviteMessage, reminderMessage, smsUrl, whatsappUrl } from './share';
import { normalisePhone } from '../../domain/phone';
import { useCopy } from '../../ui/copy';
import { can } from '../../domain/roles';

export function PartyDrawer({ event, party, all, tables, publish, startEditing = false, onClose }: {
  event: Event; party: InvitationParty; all: readonly InvitationParty[]; tables: readonly Table[]; publish: PublishState; startEditing?: boolean; onClose: () => void;
}) {
  const now = useNow();
  const toast = useToast();
  const { t, n, dialect } = useCopy();
  const people = (count: number) => n(count, 'person');
  const guestLink = useGuestLink(event);
  const { absolute, navigate } = useRouter();
  const [editing, setEditing] = useState(startEditing); // «أضف رقمًا» opens the form directly
  const [recording, setRecording] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copiedAsk, setCopiedAsk] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const link = guestLink(party);
  const published = publish === 'published' || publish === 'changed';
  const inv = invitationStatus(party, publish);
  const table = tables.find((t) => t.id === party.tableId);
  const issues = partyNeedsAttention(party, duplicatePhoneIds(all)).map((f) => (FLAG_KEY[f] ? t(FLAG_KEY[f]!) : f));
  const validPhone = normalisePhone(party.phone).ok;
  const message = inviteMessage(event, party, link, dialect);

  const markShared = useMutation((s) => s.parties.markShared([party.id], 'manual'), { onSuccess: () => toast({ tone: 'success', text: t('pdMarkedManual') }) });
  const simulate = useMutation((s) => s.parties.simulateSend([party.id]), {
    onSuccess: (r) => toast(r.failed.length ? { tone: 'danger', text: t('pdSimNoPhone') } : { tone: 'success', text: t('pdSimSent') }),
  });
  // a reminder is recorded only after the organizer confirms they sent it (no simulated reminders)
  const [remindAsk, setRemindAsk] = useState(false);
  const remind = useMutation((s) => s.parties.markReminded([party.id]), { onSuccess: () => { setRemindAsk(false); toast({ tone: 'success', text: t('glReminded') }); } });
  const update = useMutation((s, input: Parameters<typeof s.parties.update>[1]) => s.parties.update(party.id, input), { onSuccess: () => { setEditing(false); toast({ tone: 'success', text: t('pdSavedEdits') }); } });
  const mayDelete = can(useServices().session.currentUser().role, 'guests.delete'); // owner only
  const remove = useMutation((s) => s.parties.remove(party.id), { onSuccess: () => { toast({ tone: 'neutral', text: t('pdDeleted', { name: party.primaryGuestName }) }); onClose(); } });

  const busy = markShared.pending || simulate.pending || remind.pending;
  const err = markShared.error || simulate.error || remind.error;

  return (
    <>
      <Dialog open={!editing && !recording && !confirmDelete} variant="drawer" onClose={onClose} title={party.primaryGuestName}
        description={<>{party.side ? `${party.side} · ` : ''}{party.phone ? <bdi dir="ltr" className="num">{formatPhone(party.phone)}</bdi> : t('pdNoPhone')}</>}
        footer={<><Button variant="ghost" onClick={onClose}>{t('pdBack')}</Button><Menu label={t('pdOptions')} triggerLabel={t('wsMore')} items={[{ label:t('pdEdit'), icon:'edit', onSelect:()=>setEditing(true) },mayDelete ? { label:t('pdDelete'),icon:'trash',danger:true,onSelect:()=>setConfirmDelete(true) } : null]} /></>}>
        <div className="drawer-summary"><Status label={t('pdReply')} tone={party.rsvpStatus==='confirmed'?'success':'neutral'}>{t(RSVP_KEY[party.rsvpStatus])}</Status><p className="drawer-summary-count">{party.rsvpStatus==='confirmed'?t('pdComing', { people: people(party.confirmedPartySize??0) }):party.rsvpStatus==='declined'?t('pdNextTime'):t('pdFits', { people: n(party.maxPartySize, 'person', true) })}</p><p className="t-sm muted">{table?.name??t('pdNoTable')}{party.checkedInCount?t('pdArrived', { n: party.checkedInCount }):''}</p>
          {party.rsvpStatus==='pending' && ['shared','opened'].includes(inv) && <Button variant="primary" icon="check" onClick={()=>setRecording(true)}>{t('pdRecordReply')}</Button>}
          {party.rsvpStatus==='confirmed' && !table && <Button variant="primary" icon="table" onClick={()=>navigate(paths.seating(event.id))}>{t('pdPickTable')}</Button>}
        </div>
        {issues.length > 0 && <Banner tone="warning" compact title={t('pdAttention')}>{issues.join(' · ')}</Banner>}
        {err ? <Banner tone="danger">{errorMessage(err)}</Banner> : null}

        <section className="drawer-section" aria-labelledby="pd-inv">
          <div className="row between"><h3 id="pd-inv" className="drawer-h">{t('pdInvitation')}</h3><Badge tone={INVITATION_STATUS[inv].tone} dot>{t(INVITATION_KEY[inv])}</Badge></div>
          <p className="faint t-sm">
            {inv === 'draft' ? t('pdDraft')
              : inv === 'ready' ? t('pdReady')
              : inv === 'opened' ? `${t('pdOpened', { when: party.delivery.openedAt ? relativeTime(party.delivery.openedAt, now, dialect) : '' })} · ${t(SOURCE_KEY.platform)}`
              : inv === 'failed' ? `${t('pdFailed')}${party.delivery.failureReason === 'missing_phone' || party.delivery.failureReason === 'invalid_phone' ? t('pdBadPhone') : ''} · ${t(SOURCE_KEY[party.delivery.source ?? 'simulated'])}`
              : `${t('pdSent', { when: party.delivery.at ? relativeTime(party.delivery.at, now, dialect) : '' })} · ${t(SOURCE_KEY[party.delivery.source ?? 'manual'])}`}
            {party.delivery.reminderAt && t('pdLastReminder', { when: relativeTime(party.delivery.reminderAt, now, dialect) })}
          </p>
          {published ? (
            <>
              <CopyField label={t('pdPersonalLink')} value={link} hint={t('pdCode', { code: party.code })} onCopied={() => { if (inv === 'ready' || inv === 'failed') setCopiedAsk(true); }} />
              {copiedAsk && (
                <Banner tone="info" compact title={t('pdDidSendLink')} action={<Button size="sm" onClick={() => { setCopiedAsk(false); void markShared.run(); }}>{t('pdYesSentIt')}</Button>}>
                  {t('pdMarkToFollow')}
                </Banner>
              )}
              <div className="action-grid">
                {validPhone ? <a className={`btn ${inv==='ready'||inv==='failed'?'btn-primary':'btn-secondary'} btn-md`} href={whatsappUrl(party.phone, message)} target="_blank" rel="noopener noreferrer" onClick={()=>setCopiedAsk(true)}><Icon name="chat" size="sm"/>{t('sendWhatsapp')}</a> : <Button icon="phone" onClick={()=>setEditing(true)}>{t(party.phone ? 'pdFixPhone' : 'pdAddPhone')}</Button>}
                {validPhone && <a className="btn btn-secondary btn-md" href={smsUrl(party.phone, message)} onClick={() => setCopiedAsk(true)}><Icon name="phone" size="sm" />{t('sendSms')}</a>}
                {typeof navigator.share === 'function' && <Button icon="share" onClick={async () => {
                  try { await navigator.share({ title: event.title, text: message }); setCopiedAsk(true); setShareStatus(t('pdShareDone')); }
                  catch (e) { if (!(e instanceof DOMException && e.name === 'AbortError')) setShareStatus(t('pdShareFailed')); }
                }}>{t('pdDeviceShare')}</Button>}
                {party.rsvpStatus==='pending' && ['shared','opened'].includes(inv) && validPhone && <a className="btn btn-secondary btn-md" href={whatsappUrl(party.phone, reminderMessage(event,party,link,dialect))} target="_blank" rel="noopener noreferrer" onClick={()=>setRemindAsk(true)}><Icon name="bell" size="sm"/>{t('pdPrepareReminder')}</a>}
              </div>
              {remindAsk && (
                <Banner tone="info" compact title={t('glDidRemind')} action={<Button size="sm" loading={remind.pending} onClick={() => void remind.run()}>{t('glYesSent')}</Button>}>
                  {t('pdRemindAfter')}
                </Banner>
              )}
              {shareStatus && <p className="field-hint" role="status">{shareStatus}</p>}
              <details className="drawer-secondary"><summary>{t('pdMoreShare')}</summary><div className="action-grid">
                <Button icon="check" disabled={busy} loading={markShared.pending} onClick={()=>void markShared.run()}>{t('glManualDone')}</Button>
                <Button icon="send" loading={simulate.pending} disabled={busy} onClick={()=>void simulate.run()}>{inv==='failed'?t('pdTryAgain'):t('simulateSend')} <Badge tone="neutral">{t('demoBadge')}</Badge></Button>
              </div></details>
              <p className="faint t-xs">{t('pdOpenNote')}</p>
            </>
          ) : (
            <Banner tone="warning" compact action={<Button size="sm" onClick={() => navigate(paths.invitation(event.id))}>{t('glToInvitation')}</Button>}>{t('pdPublishFirst')}</Banner>
          )}
        </section>

        <section className="drawer-section" aria-labelledby="pd-rsvp">
          <div className="row between"><h3 id="pd-rsvp" className="drawer-h">{t('pdReply')}</h3><Badge tone={RSVP_STATUS[party.rsvpStatus].tone} dot>{t(RSVP_KEY[party.rsvpStatus])}</Badge></div>
          <KeyValue items={[
            { k: t('pdAllowed'), v: people(party.maxPartySize) },
            ...(party.rsvpStatus === 'confirmed' ? [{ k: t('pdWillCome'), v: <strong className={(party.confirmedPartySize ?? 0) > party.maxPartySize ? 'text-danger' : ''}>{people(party.confirmedPartySize ?? 0)}</strong> }] : []),
            ...(party.respondedAt ? [{ k: t('pdReplyTime'), v: relativeTime(party.respondedAt, now, dialect) }] : []),
            ...(party.companionNames?.length ? [{ k: t('pdCompanions'), v: party.companionNames.join('، ') }] : []),
          ]} />
          {party.guestNote && <blockquote className="guest-note">«{party.guestNote}»</blockquote>}
          <Button size="sm" icon="edit" onClick={() => setRecording(true)}>{t(party.rsvpStatus === 'pending' ? 'pdRecordManual' : 'pdEditReply')}</Button>
        </section>

        <section className="drawer-section" aria-labelledby="pd-seat">
          <h3 id="pd-seat" className="drawer-h">{t('pdSeatArrival')}</h3>
          <KeyValue items={[
            { k: t('pdTable'), v: table ? table.name : party.rsvpStatus === 'confirmed' ? <span className="text-warning">{t('pdUnseated')}</span> : '—', icon: 'table' },
            { k: t('pdArrival'), v: <Badge tone={CHECKIN_STATUS[party.checkInStatus].tone}>{t(ARRIVAL_KEY[party.checkInStatus])}{party.checkedInCount ? ` · ${party.checkedInCount}` : ''}</Badge>, icon: 'door' },
          ]} />
          {party.rsvpStatus === 'confirmed' && <Button size="sm" variant="ghost" icon="table" onClick={() => navigate(paths.seating(event.id))}>{t(table ? 'pdChangeTable' : 'pdSeat')}</Button>}
        </section>

        {party.notes && <section className="drawer-section"><h3 className="drawer-h">{t('pdYourNote')}</h3><p className="muted t-sm">{party.notes}</p></section>}
      </Dialog>

      {editing && (
        <PartyFormDialog open key={party.id} title={t('pdEditTitle')} eventId={event.id} initial={party} existing={all} defaultSize={event.settings.defaultPartySize}
          onClose={() => { setEditing(false); update.reset(); }} pending={update.pending} error={update.error} onSubmit={(input) => void update.run(input)} />
      )}
      {recording && <RecordRsvpDialog party={party} onClose={() => setRecording(false)} />}
      <ConfirmDialog open={confirmDelete && mayDelete} tone="danger" title={t('pdDeleteTitle', { name: party.primaryGuestName })} confirmLabel={t('pdDelete')} loading={remove.pending}
        body={<>{t(party.rsvpStatus === 'confirmed' ? 'pdDeleteConfirmed' : 'pdDeleteLink')}{remove.error ? <Banner tone="danger">{errorMessage(remove.error)}</Banner> : null}</>}
        onCancel={() => setConfirmDelete(false)} onConfirm={() => void remove.run()} />
    </>
  );
}

export { copyText };
