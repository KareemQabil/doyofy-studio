/**
 * Guest details (drawer). Invitation delivery and RSVP are shown as SEPARATE states (spec §13/§15),
 * and every delivery state says who knows it: the platform, the organizer (manual), or a simulation.
 */
import { useState } from 'react';
import type { Event, InvitationParty, PublishState, Table } from '../../domain/types';
import { CHECKIN_STATUS, INVITATION_STATUS, RSVP_STATUS, SOURCE_LABEL, duplicatePhoneIds, invitationStatus, partyNeedsAttention } from '../../domain/parties';
import { formatPhone, people, relativeTime } from '../../domain/format';
import { Badge, Banner, Button, ConfirmDialog, Dialog, Icon, KeyValue, Menu, Status } from '../../ui';
import { useMutation, useNow } from '../../app/data';
import { useRouter } from '../../app/router';
import { paths } from '../../app/paths';
import { useToast } from '../../ui/primitives/Feedback';
import { errorMessage } from '../../services/errors';
import { CopyField, copyText } from '../shared/CopyField';
import { RecordRsvpDialog } from '../rsvp/RecordRsvpDialog';
import { PartyFormDialog } from './PartyForm';
import { inviteMessage, reminderMessage, whatsappUrl } from './share';

export function PartyDrawer({ event, party, all, tables, publish, onClose }: {
  event: Event; party: InvitationParty; all: readonly InvitationParty[]; tables: readonly Table[]; publish: PublishState; onClose: () => void;
}) {
  const now = useNow();
  const toast = useToast();
  const { absolute, navigate } = useRouter();
  const [editing, setEditing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copiedAsk, setCopiedAsk] = useState(false);
  const link = absolute(paths.guestLink(event.slug, party.code));
  const published = publish === 'published' || publish === 'changed';
  const inv = invitationStatus(party, publish);
  const table = tables.find((t) => t.id === party.tableId);
  const issues = partyNeedsAttention(party, duplicatePhoneIds(all));

  const markShared = useMutation((s) => s.parties.markShared([party.id], 'manual'), { onSuccess: () => toast({ tone: 'success', text: 'تم تحديد الدعوة كمُرسلة يدويًا' }) });
  const simulate = useMutation((s) => s.parties.simulateSend([party.id]), {
    onSuccess: (r) => toast(r.failed.length ? { tone: 'danger', text: 'تعذر الإرسال (محاكاة): لا يوجد رقم جوال صحيح' } : { tone: 'success', text: 'تم الإرسال (محاكاة)' }),
  });
  const remind = useMutation((s) => s.parties.sendReminder([party.id]), { onSuccess: (n) => toast(n ? { tone: 'success', text: 'تم إرسال تذكير (محاكاة)' } : { tone: 'warning', text: 'لا يمكن التذكير: بلا رقم جوال أو تم الرد' }) });
  const update = useMutation((s, input: Parameters<typeof s.parties.update>[1]) => s.parties.update(party.id, input), { onSuccess: () => { setEditing(false); toast({ tone: 'success', text: 'تم حفظ التعديلات' }); } });
  const remove = useMutation((s) => s.parties.remove(party.id), { onSuccess: () => { toast({ tone: 'neutral', text: `تم حذف ${party.primaryGuestName}` }); onClose(); } });

  const busy = markShared.pending || simulate.pending || remind.pending;
  const err = markShared.error || simulate.error || remind.error;

  return (
    <>
      <Dialog open={!editing && !recording && !confirmDelete} variant="drawer" onClose={onClose} title={party.primaryGuestName}
        description={[party.side, party.phone ? formatPhone(party.phone) : 'بلا رقم جوال'].filter(Boolean).join(' · ')}
        footer={<><Button variant="ghost" onClick={onClose}>رجوع إلى القائمة</Button><Menu label="خيارات الضيف" triggerLabel="المزيد" items={[{ label:'تعديل البيانات', icon:'edit', onSelect:()=>setEditing(true) },{ label:'حذف الضيف',icon:'trash',danger:true,onSelect:()=>setConfirmDelete(true) }]} /></>}>
        <div className="drawer-summary"><Status label="الرد" tone={party.rsvpStatus==='confirmed'?'success':'neutral'}>{RSVP_STATUS[party.rsvpStatus].label}</Status><p className="drawer-summary-count">{party.rsvpStatus==='confirmed'?`${people(party.confirmedPartySize??0)} سيحضرون`:party.rsvpStatus==='declined'?'نلتقي في مناسبة قادمة':`الدعوة تتسع لـ${people(party.maxPartySize)}`}</p><p className="t-sm muted">{table?.name??'لم تُحدد طاولة'}{party.checkedInCount?` · وصل ${party.checkedInCount}`:''}</p>
          {party.rsvpStatus==='pending' && ['shared','opened'].includes(inv) && <Button variant="primary" icon="check" onClick={()=>setRecording(true)}>سجّل رد الضيف</Button>}
          {party.rsvpStatus==='confirmed' && !table && <Button variant="primary" icon="table" onClick={()=>navigate(paths.seating(event.id))}>اختر لهم طاولة</Button>}
        </div>
        {issues.length > 0 && <Banner tone="warning" compact title="يحتاج انتباهك">{issues.join(' · ')}</Banner>}
        {err ? <Banner tone="danger">{errorMessage(err)}</Banner> : null}

        <section className="drawer-section" aria-labelledby="pd-inv">
          <div className="row between"><h3 id="pd-inv" className="drawer-h">الدعوة</h3><Badge tone={INVITATION_STATUS[inv].tone} dot>{INVITATION_STATUS[inv].label}</Badge></div>
          <p className="faint t-sm">
            {inv === 'draft' ? 'الدعوة غير منشورة بعد — انشرها لتعمل الروابط.'
              : inv === 'ready' ? 'جاهزة. لم تُرسل بعد.'
              : inv === 'opened' ? `فتح الضيف الدعوة ${party.delivery.openedAt ? relativeTime(party.delivery.openedAt, now) : ''} · ${SOURCE_LABEL.platform}`
              : inv === 'failed' ? `تعذر الإرسال${party.delivery.failureReason === 'missing_phone' || party.delivery.failureReason === 'invalid_phone' ? ' — الرقم ناقص أو غير صحيح' : ''} · ${SOURCE_LABEL[party.delivery.source ?? 'simulated']}`
              : `أُرسلت ${party.delivery.at ? relativeTime(party.delivery.at, now) : ''} · ${SOURCE_LABEL[party.delivery.source ?? 'manual']}`}
            {party.delivery.reminderAt && ` · آخر تذكير ${relativeTime(party.delivery.reminderAt, now)}`}
          </p>
          {published ? (
            <>
              <CopyField label="الرابط الشخصي" value={link} hint={`رمز الدعوة: ${party.code}`} onCopied={() => { if (inv === 'ready' || inv === 'failed') setCopiedAsk(true); }} />
              {copiedAsk && (
                <Banner tone="info" compact title="هل أرسلت الرابط للضيف؟" action={<Button size="sm" onClick={() => { setCopiedAsk(false); void markShared.run(); }}>نعم، أرسلته</Button>}>
                  حدّدها كمُرسلة لتتابعها في القائمة.
                </Banner>
              )}
              <div className="action-grid">
                {party.phone ? <a className={`btn ${inv==='ready'||inv==='failed'?'btn-primary':'btn-secondary'} btn-md`} href={whatsappUrl(party.phone, inviteMessage(event, party, link))} target="_blank" rel="noopener noreferrer" onClick={()=>setCopiedAsk(true)}><Icon name="chat" size="sm"/>افتح الرسالة في واتساب</a> : <Button icon="phone" onClick={()=>setEditing(true)}>أضف رقم الجوال</Button>}
                {party.rsvpStatus==='pending' && ['shared','opened'].includes(inv) && party.phone && <a className="btn btn-secondary btn-md" href={whatsappUrl(party.phone, reminderMessage(event,party,link))} target="_blank" rel="noopener noreferrer" onClick={()=>setCopiedAsk(true)}><Icon name="bell" size="sm"/>جهّز رسالة تذكير</a>}
              </div>
              <details className="drawer-secondary"><summary>خيارات المشاركة والمتابعة</summary><div className="action-grid">
                <Button icon="check" disabled={busy} loading={markShared.pending} onClick={()=>void markShared.run()}>تم التواصل يدويًا</Button>
                <Button icon="send" loading={simulate.pending} disabled={busy} onClick={()=>void simulate.run()}>{inv==='failed'?'أعد المحاولة (محاكاة)':'جرّب الإرسال (محاكاة)'}</Button>
                {party.rsvpStatus==='pending' && <Button icon="bell" loading={remind.pending} disabled={busy} onClick={()=>void remind.run()}>جرّب التذكير (محاكاة)</Button>}
              </div></details>
              <p className="faint t-xs">فتح واتساب لا يعني أن الرسالة أُرسلت. أكّد «تم التواصل يدويًا» بعد إرسالها. خيارات المحاكاة لا ترسل رسائل فعلية.</p>
            </>
          ) : (
            <Banner tone="warning" compact action={<Button size="sm" onClick={() => navigate(paths.invitation(event.id))}>إلى الدعوة</Button>}>انشر الدعوة أولًا لتحصل على الروابط.</Banner>
          )}
        </section>

        <section className="drawer-section" aria-labelledby="pd-rsvp">
          <div className="row between"><h3 id="pd-rsvp" className="drawer-h">الرد</h3><Badge tone={RSVP_STATUS[party.rsvpStatus].tone} dot>{RSVP_STATUS[party.rsvpStatus].label}</Badge></div>
          <KeyValue items={[
            { k: 'العدد المسموح', v: people(party.maxPartySize) },
            ...(party.rsvpStatus === 'confirmed' ? [{ k: 'سيحضر', v: <strong className={(party.confirmedPartySize ?? 0) > party.maxPartySize ? 'text-danger' : ''}>{people(party.confirmedPartySize ?? 0)}</strong> }] : []),
            ...(party.respondedAt ? [{ k: 'وقت الرد', v: relativeTime(party.respondedAt, now) }] : []),
            ...(party.companionNames?.length ? [{ k: 'المرافقون', v: party.companionNames.join('، ') }] : []),
          ]} />
          {party.guestNote && <blockquote className="guest-note">«{party.guestNote}»</blockquote>}
          <Button size="sm" icon="edit" onClick={() => setRecording(true)}>{party.rsvpStatus === 'pending' ? 'سجّل الرد يدويًا' : 'تعديل الرد'}</Button>
        </section>

        <section className="drawer-section" aria-labelledby="pd-seat">
          <h3 id="pd-seat" className="drawer-h">الطاولة والوصول</h3>
          <KeyValue items={[
            { k: 'الطاولة', v: table ? table.name : party.rsvpStatus === 'confirmed' ? <span className="text-warning">غير موزع على طاولة</span> : '—', icon: 'table' },
            { k: 'الوصول', v: <Badge tone={CHECKIN_STATUS[party.checkInStatus].tone}>{CHECKIN_STATUS[party.checkInStatus].label}{party.checkedInCount ? ` · ${party.checkedInCount}` : ''}</Badge>, icon: 'door' },
          ]} />
          {party.rsvpStatus === 'confirmed' && <Button size="sm" variant="ghost" icon="table" onClick={() => navigate(paths.seating(event.id))}>{table ? 'تغيير الطاولة' : 'وزّع على طاولة'}</Button>}
        </section>

        {party.notes && <section className="drawer-section"><h3 className="drawer-h">ملاحظتك</h3><p className="muted t-sm">{party.notes}</p></section>}
      </Dialog>

      {editing && (
        <PartyFormDialog open key={party.id} title="تعديل بيانات الضيف" initial={party} existing={all} defaultSize={event.settings.defaultPartySize}
          onClose={() => { setEditing(false); update.reset(); }} pending={update.pending} error={update.error} onSubmit={(input) => void update.run(input)} />
      )}
      {recording && <RecordRsvpDialog party={party} onClose={() => setRecording(false)} />}
      <ConfirmDialog open={confirmDelete} tone="danger" title={`حذف ${party.primaryGuestName}؟`} confirmLabel="حذف الضيف" loading={remove.pending}
        body={<>{party.rsvpStatus === 'confirmed' ? 'هذا الضيف أكد حضوره. سيُحذف رده ومكانه على الطاولة، ولن يعمل رابطه.' : 'لن يعمل رابطه الشخصي بعد الحذف.'}{remove.error ? <Banner tone="danger">{errorMessage(remove.error)}</Banner> : null}</>}
        onCancel={() => setConfirmDelete(false)} onConfirm={() => void remove.run()} />
    </>
  );
}

export { copyText };
