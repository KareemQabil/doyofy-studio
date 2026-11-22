/**
 * Guest event hub (spec §18): after replying, the same link shows the reply, a QR for the gate,
 * the option to change the reply before the event, date/countdown, directions, program and — when
 * the organizer allows — the table. Uses the guest theme scope (same primitives, different tokens).
 *
 * A confirmed personal reply leads with the entry pass: the QR is the first thing on the page, visible without
 * scrolling on a phone, then the Wallet button, then the event details. Both reply paths (cinematic and direct)
 * land here, at the top of the page, with the same stamp and the same pass.
 */
import { useEffect, useRef, useState } from 'react';
import type { GuestApi, GuestView } from '../../services/contracts';
import { countdownLabel, daysBetween, dateSeparator, invitationNumbers, localDateOf, type InvitationNumbers } from '../../domain/format';
import { faceDigits } from '../../domain/templates';
import { eventStart, eventEnd, isCoupleEvent } from '../../domain/event';
import { resolvedNames } from '../../domain/invitation';
import { validateRsvp, RSVP_ERROR_TEXT } from '../../domain/parties';
import { Banner, Button, ChoiceGroup, Field, Icon, Input, Stepper } from '../../ui';
import { useNow, useServices } from '../../app/data';
import { useCopy } from '../../ui/copy';
import { errorMessage, isAppError } from '../../services/errors';
import { QrFullscreen } from './QrFullscreen';
import { dietaryLabel, mealSummary, showsAfterDecline, showsWishlist } from '../../domain/guest-experience';
import { FollowUpFields, Wishlist, emptyFollowUp, fitExtras, followUpError, followUpPayload, type FollowUp } from './GuestExtras';
import { WalletPreview } from './WalletPreview';
import { DemoNote } from './DemoNote';
import { SealStamp } from '../signature/SealStamp';

type Submission = { ok: true; name?: string } | { ok: false; error: string } | null;

function calendarUrl(v: GuestView): string {
  const st = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(v.event.title)}&dates=${st(eventStart(v.event))}/${st(eventEnd(v.event))}&location=${encodeURIComponent(`${v.event.venue.name}، ${v.event.venue.city}`)}`;
}
const mapUrl = (v: GuestView) => v.event.venue.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${v.event.venue.nameEn || v.event.venue.name} ${v.event.venue.cityEn || v.event.venue.city}`)}`;

export function GuestHub({ view, code, submission, onView, onReplay, guestApi, demo = false }: { view: GuestView; code: string | null; submission: Submission; onView: (v: GuestView) => void; onReplay: () => void; guestApi?: GuestApi; demo?: boolean }) {
  const now = useNow(60000);
  const { t, n } = useCopy();
  const p = view.party;
  const names = resolvedNames(view.event, view.design);
  const today = localDateOf(now, view.event.timeZone);
  const days = daysBetween(today, view.event.date);
  // every number on this page (date, time, headcounts, meals) uses the face's number system (١٢٣ or 123), as the
  // card and its pages do, so one guest journey never mixes the two
  const N = invitationNumbers(faceDigits(view.design.cardId));
  const sep = dateSeparator(N.digits);
  const failed = submission && !submission.ok;
  const [generalSubmitted, setGeneralSubmitted] = useState('');
  // the general-link reply just sent (its id lets the guest correct it); `editingGeneral` reopens the form with it
  const [generalReply, setGeneralReply] = useState<GeneralReply | null>(null);
  const [editingGeneral, setEditingGeneral] = useState(false);
  const [editing, setEditing] = useState<boolean>(!!failed || (!!p && p.rsvpStatus === 'pending'));
  // a reply saved on this page (direct path); the cinematic path arrives with `submission`
  const [saved, setSaved] = useState(0);
  const result = useRef<HTMLHeadingElement>(null);
  const replied = !!submission?.ok || saved > 0;
  // the entry pass: only a confirmed personal invitation, until the event ends, and not while the reply is being edited
  // (a party that has partly arrived keeps it for the rest)
  const pass = !!p && p.rsvpStatus === 'confirmed' && view.phase !== 'after' && !editing;
  const formOpen = view.canEdit && (p ? editing : (!(submission?.ok || generalSubmitted) || editingGeneral));

  // after a reply, whichever path: the top of the page and its result, never somewhere mid-way down
  useEffect(() => {
    if (!replied) return;
    window.scrollTo({ top: 0 });
    result.current?.focus({ preventScroll: true });
  }, [submission, saved]); // eslint-disable-line react-hooks/exhaustive-deps

  const head = (
    <header className="hub-head">
      <p className="hub-kicker">{view.event.title}</p>
      <h1 className="hub-names">{names.a}{isCoupleEvent(view.event.type) && names.b ? <> <span className="hub-amp">و</span> {names.b}</> : null}</h1>
      <p className="hub-date">{N.join(N.date(view.event.date), N.time(view.event.time))}</p>
      {view.phase !== 'after' && <p className="hub-count">{days > 0 ? N.text(countdownLabel(view.event.date, today)) : days === 0 ? t('ghToday') : ''}</p>}
    </header>
  );

  return (
    <main className="guest-page theme-guest">
      <SealStamp key={saved} show={replied} label={demo ? t('ghDemoSaved') : p?.rsvpStatus === 'declined' ? t('ghDeclineArrived') : t('guestReplyArrived')} tone={p?.rsvpStatus === 'declined' ? 'charcoal' : 'gold'} />
      <div className="hub">
        {demo && <DemoNote pass={pass} />}

        {/* ---------------- the entry pass: the success state of a confirmed personal reply */}
        {pass && p && (
          <section className="hub-card hub-qr hub-pass" aria-labelledby="hub-status">
            <p className="hub-pass-kicker">{view.event.title}</p>
            <h2 id="hub-status" ref={result} tabIndex={-1} className="hub-pass-title"><Icon name="check-circle" />{p.checkedInCount > 0 ? t('ghWelcome') : t('guestConfirmed')}</h2>
            <p className="hub-pass-who"><bdi>{p.name}</bdi>{sep}{p.checkedInCount > 0 ? <>{t('ghCheckedIn', { people: N.text(n(p.checkedInCount, 'person', true)) })}{p.confirmedPartySize && p.checkedInCount < p.confirmedPartySize ? t('ghOf', { n: N.num(p.confirmedPartySize) }) : ''}</> : N.text(n(p.confirmedPartySize ?? 1, 'person'))}</p>
            <QrFullscreen value={`DOYOFY:${p.code}`} code={p.code} name={p.name} title={view.event.title} />
            <p className="hub-code num" dir="ltr">{p.code}</p>
            <p className="muted t-sm">{t('guestShowCode')}</p>
            {p.tableName && <p className="hub-table"><Icon name="table" size="sm" />{t('ghYourTable')} <strong>{p.tableName}</strong></p>}
            {view.experience && p.meals?.length ? <p className="gx-mine">{t('ghDinner', { meals: N.text(mealSummary(view.experience, p.meals, sep)) })}</p> : null}
            {p.dietary?.needs.length ? <p className="gx-mine">{t('ghWeCare', { needs: dietaryLabel(p.dietary) })}</p> : null}
            {p.companionNames?.length ? <p className="faint t-sm">{t('ghCompanions', { names: p.companionNames.join('، ') })}</p> : null}
            <WalletPreview view={view} value={`DOYOFY:${p.code}`} demo={demo} />
            {view.canEdit && <Button variant="ghost" size="sm" icon="edit" onClick={() => setEditing(true)}>{t('guestEditReply')}</Button>}
          </section>
        )}

        {head}

        {failed && <Banner tone="danger" title={t(demo ? 'ghNotSaved' : 'ghNotArrived')}>{submission.error} {t('ghTryAgain')}</Banner>}

        {/* ---------------- reply status (everything but the entry pass) */}
        {!pass && (
          <section className="hub-card" aria-labelledby="hub-status">
            {!p ? (
              (submission?.ok || generalSubmitted) && !editingGeneral ? (
                <div className="stack gap-2">
                  <h2 id="hub-status" ref={result} tabIndex={-1} className="hub-h">{t('ghThanks')}{submission?.ok && submission.name ? <> <bdi>{submission.name}</bdi></> : generalSubmitted ? <> <bdi>{generalSubmitted}</bdi></> : ''}، {demo ? t('ghSaved') : t('guestReplyArrived')}</h2>
                  {generalReply && <p className="muted">{generalReply.attending ? `${t('guestAccept')}${sep}${N.people(generalReply.count)}` : t('guestDecline')}</p>}
                  <p className="muted">{t(demo ? 'ghSavedHere' : 'ghReview')}</p>
                  {generalReply && view.canEdit && <div><Button variant="secondary" icon="edit" onClick={() => setEditingGeneral(true)}>{t('guestEditReply')}</Button></div>}
                </div>
              ) : (
                <div className="stack gap-4"><h2 id="hub-status" className="hub-h">{t('ghHappy')}</h2>{view.canEdit
                  ? <GeneralResponse view={view} N={N} guestApi={guestApi} initial={editingGeneral ? generalReply : null} onCancel={editingGeneral ? () => setEditingGeneral(false) : undefined}
                    onSaved={(v, reply) => { onView(v); setGeneralSubmitted(reply.name); setGeneralReply(reply); setEditingGeneral(false); setSaved((n) => n + 1); }} />
                  : <p className="muted">{t('ghClosed')}</p>}</div>
              )
            ) : p.checkedInCount > 0 ? (
              <div className="hub-status is-in">
                <Icon name="check-circle" size="lg" />
                <div><h2 id="hub-status" ref={result} tabIndex={-1} className="hub-h">{t('ghWelcome')}</h2><p className="muted">{t('ghCheckedIn', { people: N.text(n(p.checkedInCount, 'person', true)) })}{p.confirmedPartySize && p.checkedInCount < p.confirmedPartySize ? t('ghOf', { n: N.num(p.confirmedPartySize) }) : ''}.</p></div>
              </div>
            ) : p.rsvpStatus === 'confirmed' ? (
              <div className="hub-status is-yes">
                <Icon name="check-circle" size="lg" />
                <div><h2 id="hub-status" ref={result} tabIndex={-1} className="hub-h">{t('guestConfirmed')}</h2><p className="muted"><bdi>{p.name}</bdi>{sep}{N.people(p.confirmedPartySize ?? 1)}</p>
                  {view.experience && p.meals?.length ? <p className="gx-mine">{t('ghDinner', { meals: N.text(mealSummary(view.experience, p.meals, sep)) })}</p> : null}
                  {p.dietary?.needs.length ? <p className="gx-mine">{t('ghWeCare', { needs: dietaryLabel(p.dietary) })}</p> : null}</div>
              </div>
            ) : p.rsvpStatus === 'declined' ? (
              <div className="hub-status is-no">
                <Icon name="envelope" size="lg" />
                <div><h2 id="hub-status" ref={result} tabIndex={-1} className="hub-h">{t('guestDeclined')}</h2><p className="muted">{t('ghMissYou')}{view.canEdit ? t('ghCanChange') : '.'}</p></div>
              </div>
            ) : (
              <div><h2 id="hub-status" className="hub-h">{t('ghNotYet')}</h2><p className="muted">{t('ghIncludes', { people: N.text(n(p.maxPartySize, 'person', true)) })}</p></div>
            )}

            {p && p.rsvpStatus === 'confirmed' && p.tableName && <p className="hub-table"><Icon name="table" size="sm" />{t('ghYourTable')} <strong>{p.tableName}</strong></p>}
            {p?.companionNames?.length && p.rsvpStatus === 'confirmed' ? <p className="faint t-sm">{t('ghCompanions', { names: p.companionNames.join('، ') })}</p> : null}

            {p && view.canEdit && !editing && <Button variant="secondary" icon="edit" onClick={() => setEditing(true)}>{p.rsvpStatus === 'pending' ? t('ghReplyNow') : t('guestEditReply')}</Button>}
            {p && !view.canEdit && view.phase !== 'after' && p.rsvpStatus !== 'pending' && <p className="faint t-sm">{t('ghStarted')}</p>}
            {p && editing && view.canEdit && <RsvpForm view={view} N={N} code={code!} guestApi={guestApi} onSaved={(v) => { onView(v); setEditing(false); setSaved((n) => n + 1); }} onRefresh={onView} onCancel={p.rsvpStatus !== 'pending' ? () => setEditing(false) : undefined} />}
          </section>
        )}

        {/* ---------------- after a decline: the reply is accepted first, then an optional way to share the joy (F066–F068) */}
        {p?.rsvpStatus === 'declined' && !editing && view.experience && showsAfterDecline(view.experience) && <Wishlist x={view.experience} mode="decline" />}

        {/* ---------------- details */}
        <section className="hub-card" aria-labelledby="hub-where">
          <h2 id="hub-where" className="hub-h">{t('ghWhenWhere')}</h2>
          <ul className="hub-facts">
            <li><Icon name="calendar" size="sm" /><span>{N.date(view.event.date)}<br /><span className="faint">{N.time(view.event.time)}</span></span></li>
            <li><Icon name="pin" size="sm" /><span>{view.event.venue.name}<br /><span className="faint">{view.event.venue.city}</span></span></li>
          </ul>
          <div className="row wrap gap-2">
            {/* one gold primary per screen: while a reply form is open, sending it is the primary, the way there is not */}
            <a className={`btn ${formOpen ? 'btn-secondary' : 'btn-primary'} btn-md`} href={mapUrl(view)} target="_blank" rel="noopener noreferrer"><Icon name="pin" size="sm" />{t('ghDirections')}</a>
            {view.phase === 'before' && <a className="btn btn-secondary btn-md" href={calendarUrl(view)} target="_blank" rel="noopener noreferrer"><Icon name="calendar" size="sm" />{t('ghCalendar')}</a>}
          </div>
        </section>

        {view.design.program.length > 0 && (
          <section className="hub-card" aria-labelledby="hub-prog">
            <h2 id="hub-prog" className="hub-h">{t('ghProgramme')}</h2>
            <ol className="hub-program">
              {view.design.program.filter((x) => x.time && x.ar).map((x, i) => <li key={i}><span className="num" dir={N.digits === 'arab' ? 'rtl' : 'ltr'}>{N.time(x.time)}</span><span>{x.ar}</span></li>)}
            </ol>
          </section>
        )}

        {view.experience && showsWishlist(view.experience) && !(p?.rsvpStatus === 'declined' && !editing && showsAfterDecline(view.experience)) && <Wishlist x={view.experience} mode="hub" />}

        <Button variant="ghost" icon="play" onClick={onReplay}>{t('guestWatchAgain')}</Button>
        <p className="hub-foot" lang="en" dir="ltr">Doyofy</p>
      </div>
    </main>
  );
}

function RsvpForm({ view, N, code, onSaved, onRefresh, onCancel, guestApi }: { view: GuestView; N: InvitationNumbers; code: string; onSaved: (v: GuestView) => void; onRefresh: (v: GuestView) => void; onCancel?: () => void; guestApi?: GuestApi }) {
  const services = useServices();
  const { t, n: countOf } = useCopy();
  const p = view.party!;
  const [attending, setAttending] = useState<'yes' | 'no' | null>(p.rsvpStatus === 'confirmed' ? 'yes' : p.rsvpStatus === 'declined' ? 'no' : null);
  // a first reply starts at the party's whole allowance (who is invited usually comes); a change starts from the last answer
  const [count, setCount] = useState(Math.min(p.maxPartySize, p.confirmedPartySize || p.maxPartySize));
  // the same follow-up questions the cinematic invitation asks (GuestExtras: companions, food, message)
  const [more, setMore] = useState<FollowUp>(() => emptyFollowUp(p));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const yes = attending === 'yes';
  const n = yes ? count : 0;
  const err = yes ? validateRsvp({ attending: true, count }, p.maxPartySize) : null;
  const xErr = attending ? followUpError(view, yes, n, more) : null;

  const save = async () => {
    setTried(true);
    if (!attending || err || xErr) return;
    setPending(true); setError(null);
    try {
      const v = await (guestApi ?? services.guest).submitRsvp(view.event.slug, code, { attending: yes, count: n, ...followUpPayload(view, yes, n, more) });
      onSaved(v);
    } catch (e) {
      setError(errorMessage(e));
      // the host changed the menu while this form was open: load it, keep every answer that still exists (T17)
      if (isAppError(e) && e.code === 'conflict' && e.field === 'meals') {
        try { const fresh = await (guestApi ?? services.guest).open(view.event.slug, code); onRefresh(fresh); } catch { /* the banner already explains */ }
      }
    } finally { setPending(false); }
  };

  return (
    <div className="stack gap-4 hub-form">
      {error && <Banner tone="danger">{error}</Banner>}
      <ChoiceGroup label={t('guestAttendQuestion')} value={attending} onChange={setAttending} error={tried && !attending ? t('guestChooseReply') : null}
        options={[{ value: 'yes', label: t('guestAccept') }, { value: 'no', label: t('guestDecline') }]} />
      {yes && (
        <>
          <Stepper label={t('ghCount')} value={count} min={1} max={p.maxPartySize} format={N.num} onChange={(c) => { setCount(c); setMore((v) => ({ ...v, extras: fitExtras(v.extras, c) })); }} />
          <p className="faint t-sm">{t('ghCountHint', { people: N.text(countOf(p.maxPartySize, 'person', true)) })}</p>
          {err && <p className="field-error">{RSVP_ERROR_TEXT[err]}</p>}
        </>
      )}
      {attending && <FollowUpFields view={view} attending={yes} count={n} value={more} onChange={setMore} error={tried ? xErr : null} />}
      <div className="row wrap gap-2">
        <Button variant="primary" loading={pending} onClick={() => void save()}>{t('guestSendReply')}</Button>
        {onCancel && <Button variant="ghost" onClick={onCancel}>{t('cancel')}</Button>}
      </div>
    </div>
  );
}

type GeneralReply = { id: string; name: string; attending: boolean; count: number; more: FollowUp };

/** the general link's reply: the same question, answers and wording as a personal link, with the guest's name first.
 *  Validation is ours, in Arabic, next to the field (never the browser's English bubble). With `initial` it corrects
 *  the reply just sent (GuestRsvpInput.replaces) instead of adding a second one. */
function GeneralResponse({ view, N, onSaved, onCancel, initial, guestApi }: { view: GuestView; N: InvitationNumbers; onSaved: (v: GuestView, reply: GeneralReply) => void; onCancel?: () => void; initial?: GeneralReply | null; guestApi?: GuestApi }) {
  const services = useServices();
  const { t } = useCopy();
  const [name, setName] = useState(initial?.name ?? ''), [answer, setAnswer] = useState<'yes' | 'no' | null>(initial ? (initial.attending ? 'yes' : 'no') : null);
  const [count, setCount] = useState(initial?.attending ? initial.count : view.maxGuests), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [more, setMore] = useState<FollowUp>(() => initial?.more ?? emptyFollowUp()), [tried, setTried] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const yes = answer === 'yes', n = yes ? count : 0;
  const xErr = answer ? followUpError(view, yes, n, more) : null;
  const nameErr = tried && !name.trim() ? t('guestNameRequired') : null;
  const answerErr = tried && !answer ? t('guestChooseReply') : null;
  return <form className="stack gap-4" noValidate onSubmit={async (e) => {
    e.preventDefault(); setTried(true);
    if (!name.trim()) { nameInput.current?.focus(); return; }
    if (!answer || xErr) return;
    setBusy(true); setError('');
    try {
      const v = await (guestApi ?? services.guest).submitRsvp(view.event.slug, null, { name: name.trim(), attending: yes, count: n, ...followUpPayload(view, yes, n, more), ...(initial ? { replaces: initial.id } : {}) });
      onSaved(v, { id: v.responseId, name: name.trim(), attending: yes, count: n, more });
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }}>
    <Field label={t('ghName')} required error={nameErr}><Input ref={nameInput} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></Field>
    <ChoiceGroup label={t('guestAttendQuestion')} value={answer} onChange={(v: 'yes' | 'no') => setAnswer(v)} error={answerErr} options={[{ value: 'yes', label: t('guestAccept') }, { value: 'no', label: t('guestDecline') }]} />
    {yes && <><Stepper label={t('ghCount')} value={count} min={1} max={view.maxGuests} format={N.num} onChange={(c) => { setCount(c); setMore((v) => ({ ...v, extras: fitExtras(v.extras, c) })); }} /><p className="faint t-sm">{t('ghWithCompanions')}</p></>}
    {answer && <FollowUpFields view={view} attending={yes} count={n} value={more} onChange={setMore} error={tried ? xErr : null} />}
    <p className="field-hint">{t('ghMatches')}</p>
    {error && <Banner tone="danger">{error}</Banner>}
    <div className="row wrap gap-2">
      <Button variant="primary" type="submit" loading={busy}>{t('guestSendReply')}</Button>
      {onCancel && <Button variant="ghost" onClick={onCancel}>{t('cancel')}</Button>}
    </div>
  </form>;
}
