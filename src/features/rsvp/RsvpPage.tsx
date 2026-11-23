/**
 * Replies (spec §14–15): confirmed headcount vs invitations, who still needs a nudge (opened but
 * silent first), the latest replies, and general-link replies that must be matched to a party.
 * Reminders use the share queue in «remind» mode: the organizer sends each one from WhatsApp/SMS and confirms
 * «أرسلتها»; only then is the invitation stamped «ذُكّر». Nothing here pretends to send.
 */
import { useMemo, useState } from 'react';
import type { Event, InvitationParty, RSVPResponse } from '../../domain/types';
import { INVITATION_STATUS, countParties, invitationStatus, normaliseForSearch, searchParties } from '../../domain/parties';
import { publishState } from '../../domain/invitation';
import { relativeTime } from '../../domain/format';
import { canRemind, remindHold, REMIND_HOLD_HOURS } from '../../domain/guest-tools';
import { INVITATION_KEY } from '../../domain/copy/guests';
import { useCopy } from '../../ui/copy';
import type { CopyKey } from '../../domain/copy';
import { normalisePhone } from '../../domain/phone';
import { GuestViews } from '../shared/GuestViews';
import { Avatar, Badge, Banner, Button, Dialog, EmptyState, ErrorState, FilterChips, Icon, PageHeader, Panel, ProgressBar, SearchInput, Stat, PageLoader } from '../../ui';
import { useMutation, useNow } from '../../app/data';
import { Link, useLocation, useNavigate } from '../../app/router';
import { paths } from '../../app/paths';
import { useToast } from '../../ui/primitives/Feedback';
import { errorMessage } from '../../services/errors';
import { useDesign, useParties, useResponses } from '../shared/queries';
import { RecordRsvpDialog } from './RecordRsvpDialog';
import { ShareQueue } from '../guests/ShareQueue';
import { reminderMessage, whatsappUrl } from '../guests/share';
import { useGuestLink } from '../shared/share-link';


type Tab = 'pending' | 'recent' | 'unmatched';
const CHANNEL: Record<RSVPResponse['channel'], CopyKey> = { guest_link: 'rpFromLink', general_link: 'rpFromGeneral', organizer: 'rpByYou' };

export function RsvpPage({ event }: { event: Event }) {
  const parties = useParties(event.id);
  const responses = useResponses(event.id);
  const design = useDesign(event.id);
  const loc = useLocation();
  const navigate = useNavigate();
  const now = useNow();
  const toast = useToast();
  const { t, n, dialect } = useCopy();
  const people = (count: number) => n(count, 'person');
  const [recording, setRecording] = useState<InvitationParty | null>(null);
  const [matching, setMatching] = useState<RSVPResponse | null>(null);
  const guestLink = useGuestLink(event);
  const [reminding, setReminding] = useState<string[] | null>(null);
  const addFrom = useMutation((s, id: string) => s.rsvp.addPartyFromResponse(id), { onSuccess: (p) => toast({ tone: 'success', text: t('rpAdded', { name: p.primaryGuestName }) }) });
  const dismiss = useMutation((s, id: string) => s.rsvp.dismissResponse(id), { onSuccess: () => toast({ tone: 'neutral', text: t('rpDismissed') }) });

  const all = parties.data ?? [];
  const unmatched = (responses.data ?? []).filter((r) => !r.partyId && !r.resolution);
  const tab = (loc.search.get('tab') as Tab | null) ?? (all.length === 0 && unmatched.length ? 'unmatched' : 'pending');
  const c = countParties(all);
  const ps = publishState(design.data);
  const pending = all.filter((p) => p.rsvpStatus === 'pending');
  const groups: Array<{ id: string; title: string; hint: string; items: InvitationParty[] }> = [
    { id: 'opened', title: t('rpOpened'), hint: t('rpOpenedHint'), items: pending.filter((p) => p.delivery.status === 'opened') },
    { id: 'shared', title: t('rpShared'), hint: t('rpSharedHint'), items: pending.filter((p) => p.delivery.status === 'shared') },
    { id: 'unsent', title: t('rpUnsent'), hint: t('rpUnsentHint'), items: pending.filter((p) => p.delivery.status === 'not_shared' || p.delivery.status === 'failed') },
  ];
  const published = ps === 'published' || ps === 'changed';
  // already invited and still silent; guests without a number get the copy option at the end of the queue.
  // A family invited or reminded in the last 48 h waits (remindHold): not counted, not queued, no per-row button.
  const remindable = published ? pending.filter((p) => canRemind(p, now)).map((p) => p.id) : [];
  const held = published ? pending.filter((p) => (p.delivery.status === 'opened' || p.delivery.status === 'shared') && remindHold(p, now)).length : 0;
  const remindUrl = (p: InvitationParty) => published && normalisePhone(p.phone).ok ? whatsappUrl(p.phone, reminderMessage(event, p, guestLink(p), dialect)) : undefined;
  const replied = c.parties - c.pendingParties;

  if (parties.error || responses.error) return <ErrorState error={parties.error || responses.error} onRetry={() => { parties.refetch(); responses.refetch(); }} />;
  if (parties.loading || responses.loading) return <PageLoader />;

  return (
    <>
      <PageHeader title={t('guests')} subtitle={c.parties ? t('rpSub', { n: replied, all: n(c.parties, 'invitation', true) }) : unmatched.length ? t('rpToMatch', { n: n(unmatched.length, 'invitation') }) : t('rpNone')} />
      <GuestViews eventId={event.id} active="responses" />
      {c.parties === 0 && unmatched.length === 0 ? (
        <EmptyState icon="envelope" title={t('rpNoReplies')} action={<Link to={paths.guests(event.id)} className="btn btn-primary btn-md">{t('rpAddGuests')}</Link>}>{t('rpNoRepliesHint')}</EmptyState>
      ) : (
        <div className="stack gap-6">
          {c.parties > 0 && <div className="rsvp-head">
            <Stat label={t('rpComing')} value={c.confirmedPeople} sub={t('rpComingSub', { n: n(c.confirmedParties, 'invitation', true) })} tone="success" emphasis />
            <div className="rsvp-head-side">
              <div className="row gap-6 wrap">
                <Stat label={t('rpDeclined')} value={c.declinedParties} sub={t('rpInvitations')} />
                <Stat label={t('rpPending')} value={c.pendingParties} sub={t('rpInvitations')} tone={c.pendingParties ? 'warning' : undefined} />
              </div>
              <ProgressBar value={replied} max={c.parties} tone="success" label={t('rpRate')} />
              <p className="faint t-sm">{t('rpRateLine', { pct: Math.round((replied / Math.max(1, c.parties)) * 100), people: people(c.maxSeats) })}</p>
            </div>
          </div>}

          <FilterChips label={t('rpShow')} value={tab} onChange={(v) => navigate(paths.rsvp(event.id, v === 'pending' ? undefined : v), { replace: true })} options={[
            { id: 'pending', label: t('rpPending'), count: c.pendingParties },
            { id: 'recent', label: t('rpRecent'), count: (responses.data ?? []).filter((r) => r.partyId).length },
            { id: 'unmatched', label: t('rpNeedMatch'), count: unmatched.length },
          ]} />

          {tab === 'pending' && (
            pending.length === 0 ? <EmptyState compact icon="check-circle" title={t('rpAllReplied')}>{t('rpNobodyPending')}</EmptyState> : (
              <div className="stack gap-5">
                {remindable.length > 0 && (
                  <Banner tone="info" title={t('rpCanRemind', { n: n(remindable.length, 'invitation') })} action={<Button size="sm" icon="bell" onClick={() => setReminding(remindable)}>{t('rpRemindThem')}</Button>}>
                    {t('rpRemindHow')}{held > 0 && <> {t('rpHeldCount', { n: n(held, 'invitation'), hours: REMIND_HOLD_HOURS })}</>}
                  </Banner>
                )}
                {remindable.length === 0 && held > 0 && <p className="muted t-sm">{t('rpHeldCount', { n: n(held, 'invitation'), hours: REMIND_HOLD_HOURS })}</p>}
                {groups.filter((g) => g.items.length).map((g) => (
                  <Panel key={g.id} title={`${g.title} (${g.items.length})`} subtitle={g.hint} padded={false}>
                    <ul className="plain-list">
                      {g.items.map((p) => {
                        const inv = invitationStatus(p, ps);
                        const hold = remindHold(p, now);
                        return (
                          <li key={p.id} className="plain-row">
                            <Avatar name={p.primaryGuestName} tone="warning" />
                            <span className="grow">
                              <Link to={paths.guests(event.id, { party: p.id })} className="row-title">{p.primaryGuestName}</Link>
                              <span className="row-sub">
                                <Badge tone={INVITATION_STATUS[inv].tone}>{t(INVITATION_KEY[inv])}</Badge>
                                <span>{t('rpAllowed', { people: people(p.maxPartySize) })}</span>
                                {p.delivery.openedAt && <span>{t('rpOpenedAt', { when: relativeTime(p.delivery.openedAt, now, dialect) })}</span>}
                                {p.delivery.reminderAt && <span>{t('rpRemindedAt', { when: relativeTime(p.delivery.reminderAt, now, dialect) })}</span>}
                                {hold?.kind === 'sent' && g.id !== 'unsent' && <span>{t('rpHeldSent', { when: relativeTime(hold.at, now, dialect) })}</span>}
                              </span>
                            </span>
                            <span className="row gap-2 row-actions">
                              {published && g.id !== 'unsent' && !hold && <Button size="sm" variant="ghost" icon="bell" onClick={() => setReminding([p.id])} aria-label={t('rpRemindName', { name: p.primaryGuestName })}>{t('rpRemind')}</Button>}
                              <Button size="sm" onClick={() => setRecording(p)}>{t('rpRecord')}</Button>
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
                        <Badge tone={r.attending ? 'success' : 'neutral'} dot>{r.attending ? t('rpWillCome', { people: people(r.count) }) : t('rpDeclinedOne')}</Badge>
                        <span>{t(CHANNEL[r.channel])}</span>
                        {r.note && <span className="row-note">«{r.note}»</span>}
                      </span>
                    </span>
                    <time className="faint t-xs" dateTime={r.at}>{relativeTime(r.at, now, dialect)}</time>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {tab === 'unmatched' && (
            unmatched.length === 0 ? <EmptyState compact icon="check-circle" title={t('rpNoMatch')}>{t('rpNoMatchHint')}</EmptyState> : (
              <div className="stack gap-3">
                <p className="muted t-sm">{t('rpMatchIntro')}</p>
                {(addFrom.error || dismiss.error) ? <Banner tone="danger">{errorMessage(addFrom.error || dismiss.error)}</Banner> : null}
                {unmatched.map((r) => (
                  <Panel key={r.id}>
                    <div className="unmatched">
                      <div className="grow stack gap-1">
                        <p className="t-bold">{r.name}</p>
                        <p className="t-sm muted">{r.attending ? t('rpWillCome', { people: people(r.count) }) : t('rpDeclinedOne')} · {relativeTime(r.at, now, dialect)}</p>
                        {r.note && <p className="t-sm row-note">«{r.note}»</p>}
                      </div>
                      <div className="row wrap gap-2">
                        <Button variant="primary" size="sm" icon="link" onClick={() => setMatching(r)}>{t('rpMatch')}</Button>
                        <Button size="sm" icon="plus" loading={addFrom.pending} onClick={() => void addFrom.run(r.id)}>{t('rpAddNew')}</Button>
                        <Button size="sm" variant="ghost" onClick={() => void dismiss.run(r.id)}>{t('rpDismiss')}</Button>
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
      {reminding && <ShareQueue event={event} mode="remind" parties={reminding.map((id) => all.find((p) => p.id === id)).filter((p): p is InvitationParty => !!p)} urlFor={remindUrl} linkFor={guestLink}
        onClose={() => setReminding(null)} />}
      {matching && <MatchDialog response={matching} parties={all} onClose={() => setMatching(null)} />}
    </>
  );
}

function MatchDialog({ response, parties, onClose }: { response: RSVPResponse; parties: InvitationParty[]; onClose: () => void }) {
  const toast = useToast();
  const { t, n } = useCopy();
  const people = (count: number) => n(count, 'person');
  const [q, setQ] = useState('');
  const match = useMutation((s, partyId: string) => s.rsvp.matchResponse(response.id, partyId), { onSuccess: () => { toast({ tone: 'success', text: t('rpMatched', { name: response.name }) }); onClose(); } });
  const candidates = useMemo(() => {
    const base = searchParties(parties.filter((p) => p.rsvpStatus === 'pending'), q);
    // suggest likely matches first: shared words with the reply's name
    const words = response.name.split(/\s+/).map(normaliseForSearch).filter((w) => w.length > 2);
    const score = (p: InvitationParty) => words.filter((w) => normaliseForSearch(p.primaryGuestName).includes(w)).length;
    return base.sort((a, b) => score(b) - score(a)).slice(0, 30);
  }, [parties, q, response.name]);
  return (
    <Dialog open onClose={onClose} title={t('rpMatchTitle', { name: response.name })} description={t('rpMatchSub', { reply: response.attending ? t('rpWillCome', { people: people(response.count) }) : t('rpDeclinedOne') })}>
      {match.error ? <Banner tone="danger">{errorMessage(match.error)}</Banner> : null}
      <SearchInput value={q} onChange={setQ} placeholder={t('rpSearch')} autoFocus />
      {candidates.length === 0 ? <p className="faint t-sm">{t('rpNoCandidate')}</p> : (
        <ul className="pick-list">
          {candidates.map((p) => (
            <li key={p.id}>
              <button type="button" className="pick-item" disabled={match.pending} onClick={() => void match.run(p.id)}>
                <span className="grow"><span className="t-bold">{p.primaryGuestName}</span><span className="faint t-sm"> · {t('rpAllowed', { people: people(p.maxPartySize) })}{p.side ? ` · ${p.side}` : ''}</span></span>
                {response.attending && response.count > p.maxPartySize ? <Badge tone="warning">{t('rpOver')}</Badge> : <Icon name="forward" size="sm" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
