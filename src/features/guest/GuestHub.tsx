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
import { countdownLabel, daysBetween, formatEventDate, formatTime, localDateOf, people, peopleOf } from '../../domain/format';
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
  const p = view.party;
  const names = resolvedNames(view.event, view.design);
  const today = localDateOf(now, view.event.timeZone);
  const days = daysBetween(today, view.event.date);
  const failed = submission && !submission.ok;
  const [generalSubmitted, setGeneralSubmitted] = useState('');
  const [editing, setEditing] = useState<boolean>(!!failed || (!!p && p.rsvpStatus === 'pending'));
  // a reply saved on this page (direct path); the cinematic path arrives with `submission`
  const [saved, setSaved] = useState(0);
  const result = useRef<HTMLHeadingElement>(null);
  const replied = !!submission?.ok || saved > 0;
  // the entry pass: only a confirmed personal invitation, until the event ends, and not while the reply is being edited
  // (a party that has partly arrived keeps it for the rest)
  const pass = !!p && p.rsvpStatus === 'confirmed' && view.phase !== 'after' && !editing;

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
      <p className="hub-date">{formatEventDate(view.event.date)} · {formatTime(view.event.time)}</p>
      {view.phase !== 'after' && <p className="hub-count">{days > 0 ? countdownLabel(view.event.date, today) : days === 0 ? 'اليوم!' : ''}</p>}
    </header>
  );

  return (
    <main className="guest-page theme-guest">
      <SealStamp key={saved} show={replied} label={demo ? 'حُفظ ردكم للتجربة' : p?.rsvpStatus === 'declined' ? 'وصل اعتذاركم' : 'وصل ردكم'} tone={p?.rsvpStatus === 'declined' ? 'charcoal' : 'gold'} />
      <div className="hub">
        {demo && <DemoNote pass={pass} />}

        {/* ---------------- the entry pass: the success state of a confirmed personal reply */}
        {pass && p && (
          <section className="hub-card hub-qr hub-pass" aria-labelledby="hub-status">
            <p className="hub-pass-kicker">{view.event.title}</p>
            <h2 id="hub-status" ref={result} tabIndex={-1} className="hub-pass-title"><Icon name="check-circle" />{p.checkedInCount > 0 ? 'أهلًا وسهلًا!' : 'حضوركم مؤكد'}</h2>
            <p className="hub-pass-who"><bdi>{p.name}</bdi> · {p.checkedInCount > 0 ? <>تم تسجيل دخول {peopleOf(p.checkedInCount)}{p.confirmedPartySize && p.checkedInCount < p.confirmedPartySize ? ` من ${p.confirmedPartySize}` : ''}</> : people(p.confirmedPartySize ?? 1)}</p>
            <QrFullscreen value={`DOYOFY:${p.code}`} code={p.code} name={p.name} title={view.event.title} />
            <p className="hub-code num" dir="ltr">{p.code}</p>
            <p className="muted t-sm">اعرضوا الرمز على فريق الاستقبال عند الوصول.</p>
            {p.tableName && <p className="hub-table"><Icon name="table" size="sm" />طاولتكم: <strong>{p.tableName}</strong></p>}
            {view.experience && p.meals?.length ? <p className="gx-mine">العشاء: {mealSummary(view.experience, p.meals)}</p> : null}
            {p.dietary?.needs.length ? <p className="gx-mine">نراعي: {dietaryLabel(p.dietary)}</p> : null}
            {p.companionNames?.length ? <p className="faint t-sm">المرافقون: {p.companionNames.join('، ')}</p> : null}
            <WalletPreview view={view} value={`DOYOFY:${p.code}`} demo={demo} />
            {view.canEdit && <Button variant="ghost" size="sm" icon="edit" onClick={() => setEditing(true)}>تعديل الرد</Button>}
          </section>
        )}

        {head}

        {failed && <Banner tone="danger" title={demo ? 'لم يُحفظ ردكم' : 'لم يصل ردكم'}>{submission.error} جرّبوا مرة أخرى.</Banner>}

        {/* ---------------- reply status (everything but the entry pass) */}
        {!pass && (
          <section className="hub-card" aria-labelledby="hub-status">
            {!p ? (
              (submission?.ok || generalSubmitted) ? (
                <div className="stack gap-2">
                  <h2 id="hub-status" ref={result} tabIndex={-1} className="hub-h">شكرًا{submission?.ok && submission.name ? ` ${submission.name}` : generalSubmitted ? ` ${generalSubmitted}` : ''}، {demo ? 'حُفظ ردكم' : 'وصل ردكم'}</h2>
                  <p className="muted">{demo ? 'حُفظ ردّكم على هذا الجهاز فقط.' : 'سيراجع صاحب المناسبة ردكم ويطابقه مع قائمة الضيوف، ثم يمكنه مشاركة رابطكم الشخصي معكم.'}</p>
                </div>
              ) : (
                <div className="stack gap-4"><h2 id="hub-status" className="hub-h">نسعد بحضوركم</h2>{view.canEdit ? <GeneralResponse view={view} guestApi={guestApi} onSaved={(v, name) => { onView(v); setGeneralSubmitted(name); setSaved((n) => n + 1); }} /> : <p className="muted">انتهت فترة تأكيد الحضور. تواصلوا مع صاحب المناسبة.</p>}</div>
              )
            ) : p.checkedInCount > 0 ? (
              <div className="hub-status is-in">
                <Icon name="check-circle" size="lg" />
                <div><h2 id="hub-status" ref={result} tabIndex={-1} className="hub-h">أهلًا وسهلًا!</h2><p className="muted">تم تسجيل دخول {peopleOf(p.checkedInCount)}{p.confirmedPartySize && p.checkedInCount < p.confirmedPartySize ? ` من ${p.confirmedPartySize}` : ''}.</p></div>
              </div>
            ) : p.rsvpStatus === 'confirmed' ? (
              <div className="hub-status is-yes">
                <Icon name="check-circle" size="lg" />
                <div><h2 id="hub-status" ref={result} tabIndex={-1} className="hub-h">حضوركم مؤكد</h2><p className="muted">{p.name} · {people(p.confirmedPartySize ?? 1)}</p>
                  {view.experience && p.meals?.length ? <p className="gx-mine">العشاء: {mealSummary(view.experience, p.meals)}</p> : null}
                  {p.dietary?.needs.length ? <p className="gx-mine">نراعي: {dietaryLabel(p.dietary)}</p> : null}</div>
              </div>
            ) : p.rsvpStatus === 'declined' ? (
              <div className="hub-status is-no">
                <Icon name="envelope" size="lg" />
                <div><h2 id="hub-status" ref={result} tabIndex={-1} className="hub-h">سجّلنا اعتذاركم</h2><p className="muted">نفتقدكم{view.canEdit ? '. إن تغيّرت الظروف يمكنكم تعديل الرد.' : '.'}</p></div>
              </div>
            ) : (
              <div><h2 id="hub-status" className="hub-h">لم تردّوا بعد</h2><p className="muted">الدعوة تشمل {peopleOf(p.maxPartySize)}.</p></div>
            )}

            {p && p.rsvpStatus === 'confirmed' && p.tableName && <p className="hub-table"><Icon name="table" size="sm" />طاولتكم: <strong>{p.tableName}</strong></p>}
            {p?.companionNames?.length && p.rsvpStatus === 'confirmed' ? <p className="faint t-sm">المرافقون: {p.companionNames.join('، ')}</p> : null}

            {p && view.canEdit && !editing && <Button variant="secondary" icon="edit" onClick={() => setEditing(true)}>{p.rsvpStatus === 'pending' ? 'ردّوا الآن' : 'تعديل الرد'}</Button>}
            {p && !view.canEdit && view.phase !== 'after' && p.rsvpStatus !== 'pending' && <p className="faint t-sm">بدأت المناسبة — لتعديل الرد تواصلوا مع صاحب المناسبة.</p>}
            {p && editing && view.canEdit && <RsvpForm view={view} code={code!} guestApi={guestApi} onSaved={(v) => { onView(v); setEditing(false); setSaved((n) => n + 1); }} onRefresh={onView} onCancel={p.rsvpStatus !== 'pending' ? () => setEditing(false) : undefined} />}
          </section>
        )}

        {/* ---------------- after a decline: the reply is accepted first, then an optional way to share the joy (F066–F068) */}
        {p?.rsvpStatus === 'declined' && !editing && view.experience && showsAfterDecline(view.experience) && <Wishlist x={view.experience} mode="decline" />}

        {/* ---------------- details */}
        <section className="hub-card" aria-labelledby="hub-where">
          <h2 id="hub-where" className="hub-h">الموعد والمكان</h2>
          <ul className="hub-facts">
            <li><Icon name="calendar" size="sm" /><span>{formatEventDate(view.event.date)}<br /><span className="faint">{formatTime(view.event.time)}</span></span></li>
            <li><Icon name="pin" size="sm" /><span>{view.event.venue.name}<br /><span className="faint">{view.event.venue.city}</span></span></li>
          </ul>
          <div className="row wrap gap-2">
            <a className="btn btn-primary btn-md" href={mapUrl(view)} target="_blank" rel="noopener noreferrer"><Icon name="pin" size="sm" />الاتجاهات</a>
            {view.phase === 'before' && <a className="btn btn-secondary btn-md" href={calendarUrl(view)} target="_blank" rel="noopener noreferrer"><Icon name="calendar" size="sm" />أضف إلى التقويم</a>}
          </div>
        </section>

        {view.design.program.length > 0 && (
          <section className="hub-card" aria-labelledby="hub-prog">
            <h2 id="hub-prog" className="hub-h">برنامج المناسبة</h2>
            <ol className="hub-program">
              {view.design.program.filter((x) => x.time && x.ar).map((x, i) => <li key={i}><span className="num" dir="ltr">{formatTime(x.time)}</span><span>{x.ar}</span></li>)}
            </ol>
          </section>
        )}

        {view.experience && showsWishlist(view.experience) && !(p?.rsvpStatus === 'declined' && !editing && showsAfterDecline(view.experience)) && <Wishlist x={view.experience} mode="hub" />}

        <Button variant="ghost" icon="play" onClick={onReplay}>شاهدوا الدعوة مرة أخرى</Button>
        <p className="hub-foot" lang="en" dir="ltr">Doyofy</p>
      </div>
    </main>
  );
}

function RsvpForm({ view, code, onSaved, onRefresh, onCancel, guestApi }: { view: GuestView; code: string; onSaved: (v: GuestView) => void; onRefresh: (v: GuestView) => void; onCancel?: () => void; guestApi?: GuestApi }) {
  const services = useServices();
  const { t } = useCopy();
  const p = view.party!;
  const [attending, setAttending] = useState<'yes' | 'no' | null>(p.rsvpStatus === 'confirmed' ? 'yes' : p.rsvpStatus === 'declined' ? 'no' : null);
  const [count, setCount] = useState(Math.min(p.maxPartySize, p.confirmedPartySize || Math.min(2, p.maxPartySize)));
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
      <ChoiceGroup label="هل ستحضرون؟" value={attending} onChange={setAttending} error={tried && !attending ? 'اختاروا الحضور أو الاعتذار' : null}
        options={[{ value: 'yes', label: 'نعم، سنحضر' }, { value: 'no', label: 'نعتذر' }]} />
      {yes && (
        <>
          <Stepper label="عدد الحضور" value={count} min={1} max={p.maxPartySize} onChange={(c) => { setCount(c); setMore((v) => ({ ...v, extras: fitExtras(v.extras, c) })); }} />
          <p className="faint t-sm">يشملكم مع المرافقين · الدعوة تشمل حتى {peopleOf(p.maxPartySize)}.</p>
          {err && <p className="field-error">{RSVP_ERROR_TEXT[err]}</p>}
        </>
      )}
      {attending && <FollowUpFields view={view} attending={yes} count={n} value={more} onChange={setMore} error={tried ? xErr : null} />}
      <div className="row wrap gap-2">
        <Button variant="primary" loading={pending} onClick={() => void save()}>{t('guestSendReply')}</Button>
        {onCancel && <Button variant="ghost" onClick={onCancel}>إلغاء</Button>}
      </div>
    </div>
  );
}

function GeneralResponse({ view, onSaved, guestApi }: { view: GuestView; onSaved: (v: GuestView, name: string) => void; guestApi?: GuestApi }) {
  const services = useServices();
  const [name, setName] = useState(''), [answer, setAnswer] = useState<'yes' | 'no' | null>(null), [count, setCount] = useState(1), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [more, setMore] = useState<FollowUp>(() => emptyFollowUp()), [tried, setTried] = useState(false);
  const yes = answer === 'yes', n = yes ? count : 0;
  const xErr = answer ? followUpError(view, yes, n, more) : null;
  return <form className="stack gap-4" onSubmit={async (e) => {
    e.preventDefault(); setTried(true); if (!name.trim() || !answer) { setError('اكتبوا الاسم واختاروا تأكيد الحضور أو الاعتذار.'); return; }
    if (xErr) return;
    setBusy(true); setError('');
    try { const v = await (guestApi ?? services.guest).submitRsvp(view.event.slug, null, { name: name.trim(), attending: yes, count: n, ...followUpPayload(view, yes, n, more) }); onSaved(v, name.trim()); }
    catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }}>
    <Field label="الاسم" required><Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required /></Field>
    <ChoiceGroup label="هل ستشرفوننا؟" value={answer} onChange={(v: 'yes' | 'no') => setAnswer(v)} options={[{ value: 'yes', label: 'بكل سرور، سنحضر' }, { value: 'no', label: 'نعتذر عن الحضور' }]} />
    {yes && <><Stepper label="عدد الحضور" value={count} min={1} max={view.maxGuests} onChange={(c) => { setCount(c); setMore((v) => ({ ...v, extras: fitExtras(v.extras, c) })); }} /><p className="faint t-sm">يشملكم مع المرافقين.</p></>}
    {answer && <FollowUpFields view={view} attending={yes} count={n} value={more} onChange={setMore} error={tried ? xErr : null} />}
    <p className="field-hint">يراجع صاحب المناسبة ردّكم ويطابقه مع قائمة الضيوف.</p>
    {error && <Banner tone="danger">{error}</Banner>}
    <Button variant="primary" type="submit" loading={busy}>تأكيد الرد</Button>
  </form>;
}
