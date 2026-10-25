/**
 * Replies (spec §14–15): confirmed headcount vs invitations, who still needs a nudge (opened but
 * silent first), the latest replies, and general-link replies that must be matched to a party.
 */
import { useMemo, useState } from 'react';
import { useReviewSettings } from '../../app/review';
import { OrbitResponseLenses } from '../orbit/OrbitWorkLenses';
import type { Event, InvitationParty, RSVPResponse } from '../../domain/types';
import { INVITATION_STATUS, countParties, invitationStatus, normaliseForSearch, searchParties } from '../../domain/parties';
import { publishState } from '../../domain/invitation';
import { people, plural, pluralOf, P, relativeTime } from '../../domain/format';
import { GuestViews } from '../shared/GuestViews';
import { Avatar, Badge, Banner, Button, Dialog, EmptyState, ErrorState, FilterChips, Icon, PageHeader, Panel, ProgressBar, SearchInput, Skeleton, Stat } from '../../ui';
import { useMutation, useNow } from '../../app/data';
import { Link, useLocation, useNavigate } from '../../app/router';
import { paths } from '../../app/paths';
import { useToast } from '../../ui/primitives/Feedback';
import { errorMessage } from '../../services/errors';
import { useDesign, useParties, useResponses } from '../shared/queries';
import { RecordRsvpDialog } from './RecordRsvpDialog';

type Tab = 'pending' | 'recent' | 'unmatched';
const CHANNEL: Record<RSVPResponse['channel'], string> = { guest_link: 'من رابطه الشخصي', general_link: 'من الرابط العام', organizer: 'سجّلتَه يدويًا' };

export function RsvpPage({ event }: { event: Event }) {
  const {theme}=useReviewSettings();
  const parties = useParties(event.id);
  const responses = useResponses(event.id);
  const design = useDesign(event.id);
  const loc = useLocation();
  const navigate = useNavigate();
  const now = useNow();
  const toast = useToast();
  const [recording, setRecording] = useState<InvitationParty | null>(null);
  const [matching, setMatching] = useState<RSVPResponse | null>(null);
  const remindAll = useMutation((s, ids: string[]) => s.parties.sendReminder(ids), { onSuccess: (n) => toast({ tone: 'success', text: `تم إرسال تذكير إلى ${pluralOf(n, P.invitation)} (محاكاة)` }) });
  const remindOne = useMutation((s, id: string) => s.parties.sendReminder([id]), { onSuccess: (n) => toast(n ? { tone: 'success', text: 'تم إرسال تذكير (محاكاة)' } : { tone: 'warning', text: 'لا يمكن التذكير بلا رقم جوال' }) });
  const addFrom = useMutation((s, id: string) => s.rsvp.addPartyFromResponse(id), { onSuccess: (p) => toast({ tone: 'success', text: `أُضيف ${p.primaryGuestName} إلى القائمة بحالة «أكد الحضور»` }) });
  const dismiss = useMutation((s, id: string) => s.rsvp.dismissResponse(id), { onSuccess: () => toast({ tone: 'neutral', text: 'تم تجاهل الرد' }) });

  const all = parties.data ?? [];
  const unmatched = (responses.data ?? []).filter((r) => !r.partyId && !r.resolution);
  const tab = (loc.search.get('tab') as Tab | null) ?? 'pending';
  const c = countParties(all);
  const ps = publishState(design.data);
  const pending = all.filter((p) => p.rsvpStatus === 'pending');
  const groups: Array<{ id: string; title: string; hint: string; items: InvitationParty[] }> = [
    { id: 'opened', title: 'فتحوا الدعوة ولم يردوا', hint: 'الأكثر احتمالًا للرد بعد تذكير لطيف', items: pending.filter((p) => p.delivery.status === 'opened') },
    { id: 'shared', title: 'أُرسلت ولم تُفتح بعد', hint: 'ربما لم تصلهم الرسالة — تأكد من الرقم', items: pending.filter((p) => p.delivery.status === 'shared') },
    { id: 'unsent', title: 'لم تُرسل لهم الدعوة', hint: 'أرسلها أولًا من صفحة الضيوف', items: pending.filter((p) => p.delivery.status === 'not_shared' || p.delivery.status === 'failed') },
  ];
  const remindable = pending.filter((p) => p.phone && (p.delivery.status === 'opened' || p.delivery.status === 'shared')).map((p) => p.id);
  const replied = c.parties - c.pendingParties;

  if (parties.error || responses.error) return <ErrorState error={parties.error || responses.error} onRetry={() => { parties.refetch(); responses.refetch(); }} />;
  if (parties.loading || responses.loading) return <Skeleton lines={8} />;

  return (
    <>
      <PageHeader title="الضيوف" subtitle={c.parties ? `ردّت ${replied} من ${pluralOf(c.parties, P.invitation)}` : 'لا دعوات بعد'} />
      <GuestViews eventId={event.id} active="responses" />
      {c.parties === 0 ? (
        <EmptyState icon="envelope" title="لا ردود بعد" action={<Link to={paths.guests(event.id)} className="btn btn-primary btn-md">أضف الضيوف</Link>}>تظهر الردود هنا عندما يرد الضيوف من روابطهم.</EmptyState>
      ) : (
        <div className="stack gap-6">
          <div className="rsvp-head">
            <Stat label="سيحضرون" value={c.confirmedPeople} sub={`شخصًا · من ${pluralOf(c.confirmedParties, P.invitation)}`} tone="success" emphasis />
            <div className="rsvp-head-side">
              <div className="row gap-6 wrap">
                <Stat label="اعتذروا" value={c.declinedParties} sub="دعوات" />
                <Stat label="بانتظار الرد" value={c.pendingParties} sub="دعوات" tone={c.pendingParties ? 'warning' : undefined} />
              </div>
              <ProgressBar value={replied} max={c.parties} tone="success" label="نسبة الرد" />
              <p className="faint t-sm">نسبة الرد {Math.round((replied / Math.max(1, c.parties)) * 100)}٪ · الحد الأقصى لو حضر الجميع {people(c.maxSeats)}</p>
            </div>
          </div>

          {theme==='orbit'?<OrbitResponseLenses value={tab} onChange={t=>navigate(paths.rsvp(event.id,t==='pending'?undefined:t),{replace:true})} pending={c.pendingParties} recent={(responses.data??[]).filter(r=>r.partyId).length} unmatched={unmatched.length}/>:<FilterChips label="عرض" value={tab} onChange={(t) => navigate(paths.rsvp(event.id, t === 'pending' ? undefined : t), { replace: true })} options={[
            { id: 'pending', label: 'بانتظار الرد', count: c.pendingParties },
            { id: 'recent', label: 'آخر الردود', count: (responses.data ?? []).filter((r) => r.partyId).length },
            { id: 'unmatched', label: 'تحتاج مطابقة', count: unmatched.length },
          ]} />}

          {tab === 'pending' && (
            pending.length === 0 ? <EmptyState compact icon="check-circle" title="الجميع ردّوا">لا أحد بانتظار الرد.</EmptyState> : (
              <div className="stack gap-5">
                {remindable.length > 0 && (
                  <Banner tone="info" title={`${plural(remindable.length, P.invitation)} يمكن تذكيرها`} action={<Button size="sm" icon="bell" loading={remindAll.pending} onClick={() => void remindAll.run(remindable)}>ذكّرهم (محاكاة)</Button>}>
                    التذكير في هذا النموذج محاكاة — لا تُرسل رسائل فعلية.
                  </Banner>
                )}
                {remindAll.error ? <Banner tone="danger">{errorMessage(remindAll.error)}</Banner> : null}
                {groups.filter((g) => g.items.length).map((g) => (
                  <Panel key={g.id} title={`${g.title} (${g.items.length})`} subtitle={g.hint} padded={false}>
                    <ul className="plain-list">
                      {g.items.map((p) => {
                        const inv = invitationStatus(p, ps);
                        return (
                          <li key={p.id} className="plain-row">
                            <Avatar name={p.primaryGuestName} tone="warning" />
                            <span className="grow">
                              <Link to={paths.guests(event.id, { party: p.id })} className="row-title">{p.primaryGuestName}</Link>
                              <span className="row-sub">
                                <Badge tone={INVITATION_STATUS[inv].tone}>{INVITATION_STATUS[inv].label}</Badge>
                                <span>{people(p.maxPartySize)} مسموح</span>
                                {p.delivery.openedAt && <span>فتحها {relativeTime(p.delivery.openedAt, now)}</span>}
                                {p.delivery.reminderAt && <span>ذُكّر {relativeTime(p.delivery.reminderAt, now)}</span>}
                              </span>
                            </span>
                            <span className="row gap-2 row-actions">
                              {g.id !== 'unsent' && <Button size="sm" variant="ghost" icon="bell" disabled={!p.phone || remindOne.pending} onClick={() => void remindOne.run(p.id)}>تذكير</Button>}
                              <Button size="sm" onClick={() => setRecording(p)}>سجّل الرد</Button>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </Panel>
                ))}
              </div>
            )
          )}

          {tab === 'recent' && (
            <Panel padded={false}>
              <ul className="plain-list">
                {(responses.data ?? []).filter((r) => r.partyId).slice(0, 60).map((r) => (
                  <li key={r.id} className="plain-row">
                    <Avatar name={r.name} tone={r.attending ? 'success' : 'neutral'} />
                    <span className="grow">
                      <Link to={paths.guests(event.id, { party: r.partyId })} className="row-title">{r.name}</Link>
                      <span className="row-sub">
                        <Badge tone={r.attending ? 'success' : 'neutral'} dot>{r.attending ? `سيحضر · ${people(r.count)}` : 'اعتذر'}</Badge>
                        <span>{CHANNEL[r.channel]}</span>
                        {r.note && <span className="row-note">«{r.note}»</span>}
                      </span>
                    </span>
                    <time className="faint t-xs" dateTime={r.at}>{relativeTime(r.at, now)}</time>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {tab === 'unmatched' && (
            unmatched.length === 0 ? <EmptyState compact icon="check-circle" title="لا ردود تحتاج مطابقة">ردود الرابط العام تظهر هنا لتربطها بضيف في القائمة.</EmptyState> : (
              <div className="stack gap-3">
                <p className="muted t-sm">هذه ردود وصلت من الرابط العام (بدون اسم محدد). اربط كل رد بدعوة في القائمة، أو أضفه كضيف جديد.</p>
                {(addFrom.error || dismiss.error) ? <Banner tone="danger">{errorMessage(addFrom.error || dismiss.error)}</Banner> : null}
                {unmatched.map((r) => (
                  <Panel key={r.id}>
                    <div className="unmatched">
                      <div className="grow stack gap-1">
                        <p className="t-bold">{r.name}</p>
                        <p className="t-sm muted">{r.attending ? `سيحضر · ${people(r.count)}` : 'اعتذر'} · {relativeTime(r.at, now)}</p>
                        {r.note && <p className="t-sm row-note">«{r.note}»</p>}
                      </div>
                      <div className="row wrap gap-2">
                        <Button variant="primary" size="sm" icon="link" onClick={() => setMatching(r)}>طابق مع ضيف</Button>
                        <Button size="sm" icon="plus" loading={addFrom.pending} onClick={() => void addFrom.run(r.id)}>أضفه كضيف جديد</Button>
                        <Button size="sm" variant="ghost" onClick={() => void dismiss.run(r.id)}>تجاهل</Button>
                      </div>
                    </div>
                  </Panel>
                ))}
              </div>
            )
          )}
        </div>
      )}
      {recording && <RecordRsvpDialog party={recording} onClose={() => setRecording(null)} />}
      {matching && <MatchDialog response={matching} parties={all} onClose={() => setMatching(null)} />}
    </>
  );
}

function MatchDialog({ response, parties, onClose }: { response: RSVPResponse; parties: InvitationParty[]; onClose: () => void }) {
  const toast = useToast();
  const [q, setQ] = useState('');
  const match = useMutation((s, partyId: string) => s.rsvp.matchResponse(response.id, partyId), { onSuccess: () => { toast({ tone: 'success', text: `تمت مطابقة رد ${response.name}` }); onClose(); } });
  const candidates = useMemo(() => {
    const base = searchParties(parties.filter((p) => p.rsvpStatus === 'pending'), q);
    // suggest likely matches first: shared words with the reply's name
    const words = response.name.split(/\s+/).map(normaliseForSearch).filter((w) => w.length > 2);
    const score = (p: InvitationParty) => words.filter((w) => normaliseForSearch(p.primaryGuestName).includes(w)).length;
    return base.sort((a, b) => score(b) - score(a)).slice(0, 30);
  }, [parties, q, response.name]);
  return (
    <Dialog open onClose={onClose} title={`مطابقة رد «${response.name}»`} description={`${response.attending ? `سيحضر · ${people(response.count)}` : 'اعتذر'} — اختر دعوته من القائمة`}>
      {match.error ? <Banner tone="danger">{errorMessage(match.error)}</Banner> : null}
      <SearchInput value={q} onChange={setQ} placeholder="ابحث في الضيوف الذين لم يردوا" autoFocus />
      {candidates.length === 0 ? <p className="faint t-sm">لا يوجد ضيف بانتظار الرد يطابق البحث. يمكنك إضافته كضيف جديد.</p> : (
        <ul className="pick-list">
          {candidates.map((p) => (
            <li key={p.id}>
              <button type="button" className="pick-item" disabled={match.pending} onClick={() => void match.run(p.id)}>
                <span className="grow"><span className="t-bold">{p.primaryGuestName}</span><span className="faint t-sm"> · {people(p.maxPartySize)} مسموح{p.side ? ` · ${p.side}` : ''}</span></span>
                {response.attending && response.count > p.maxPartySize ? <Badge tone="warning">العدد أكبر من المسموح</Badge> : <Icon name="forward" size="sm" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
