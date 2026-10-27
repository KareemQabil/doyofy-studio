/**
 * Guest event hub (spec §18): after replying, the same link shows the reply, a QR for the gate,
 * the option to change the reply before the event, date/countdown, directions, program and — when
 * the organizer allows — the table. Uses the guest theme scope (same primitives, different tokens).
 */
import { useState } from 'react';
import type { GuestView } from '../../services/contracts';
import { countdownLabel, daysBetween, formatEventDate, formatTime, localDateOf, people, peopleOf } from '../../domain/format';
import { eventStart, eventEnd, isCoupleEvent } from '../../domain/event';
import { resolvedNames } from '../../domain/invitation';
import { validateRsvp, RSVP_ERROR_TEXT } from '../../domain/parties';
import { Banner, Button, ChoiceGroup, Field, Icon, Input, Stepper, Textarea } from '../../ui';
import { useNow, useServices } from '../../app/data';
import { useRouter } from '../../app/router';
import { paths } from '../../app/paths';
import { errorMessage, isAppError } from '../../services/errors';
import { QrFullscreen } from './QrFullscreen';
import { asksAfterAttending, dietaryLabel, mealSummary, showsAfterDecline, showsWishlist } from '../../domain/guest-experience';
import { GuestExtrasFields, Wishlist, emptyExtras, extrasError, extrasPayload, fitExtras, type ExtrasValue } from './GuestExtras';

type Submission = { ok: true; name?: string } | { ok: false; error: string } | null;

function calendarUrl(v: GuestView): string {
  const st = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(v.event.title)}&dates=${st(eventStart(v.event))}/${st(eventEnd(v.event))}&location=${encodeURIComponent(`${v.event.venue.name}، ${v.event.venue.city}`)}`;
}
const mapUrl = (v: GuestView) => v.event.venue.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${v.event.venue.nameEn || v.event.venue.name} ${v.event.venue.cityEn || v.event.venue.city}`)}`;

import { SealStamp } from '../signature/SealStamp';
import { useReviewSettings } from '../../app/review';

export function GuestHub({ view, code, submission, onView, onReplay }: { view: GuestView; code: string | null; submission: Submission; onView: (v: GuestView) => void; onReplay: () => void }) {
  const now = useNow(60000);
  const { absolute } = useRouter();
  const p = view.party;
  const names = resolvedNames(view.event, view.design);
  const today = localDateOf(now, view.event.timeZone);
  const days = daysBetween(today, view.event.date);
  const failed = submission && !submission.ok;
  const { theme } = useReviewSettings();
  const [generalSubmitted, setGeneralSubmitted] = useState('');
  const [editing, setEditing] = useState<boolean>(!!failed || (!!p && p.rsvpStatus === 'pending'));

  return (
    <main className="guest-page theme-guest">
      {theme === 'signature' && <SealStamp show={!!submission?.ok} label={p?.rsvpStatus === 'declined' ? 'وصل اعتذاركم' : 'وصل ردكم'} tone={p?.rsvpStatus === 'declined' ? 'charcoal' : 'gold'} />}
      <div className="hub">
        <header className="hub-head">
          <p className="hub-kicker">{view.event.title}</p>
          <h1 className="hub-names">{names.a}{isCoupleEvent(view.event.type) && names.b ? <> <span className="hub-amp">و</span> {names.b}</> : null}</h1>
          <p className="hub-date">{formatEventDate(view.event.date)} · {formatTime(view.event.time)}</p>
          {view.phase !== 'after' && <p className="hub-count">{days > 0 ? countdownLabel(view.event.date, today) : days === 0 ? 'اليوم!' : ''}</p>}
        </header>

        {failed && <Banner tone="danger" title="لم يصل ردكم">{submission.error} جرّبوا مرة أخرى.</Banner>}

        {/* ---------------- reply status */}
        <section className="hub-card" aria-labelledby="hub-status">
          {!p ? (
            (submission?.ok || generalSubmitted) ? (
              <div className="stack gap-2">
                <h2 id="hub-status" className="hub-h">شكرًا{submission?.ok && submission.name ? ` ${submission.name}` : generalSubmitted ? ` ${generalSubmitted}` : ''}، وصل ردكم</h2>
                <p className="muted">سيراجع صاحب المناسبة ردكم ويطابقه مع قائمة الضيوف، ثم يمكنه مشاركة رابطكم الشخصي معكم.</p>
              </div>
            ) : (
              <div className="stack gap-4"><h2 id="hub-status" className="hub-h">نسعد بحضوركم</h2>{view.canEdit ? <GeneralResponse view={view} onSaved={(v,name)=>{onView(v);setGeneralSubmitted(name);}}/> : <p className="muted">انتهت فترة تأكيد الحضور. تواصلوا مع صاحب المناسبة.</p>}</div>
            )
          ) : p.checkedInCount > 0 ? (
            <div className="hub-status is-in">
              <Icon name="check-circle" size="lg" />
              <div><h2 id="hub-status" className="hub-h">أهلًا وسهلًا!</h2><p className="muted">تم تسجيل دخول {peopleOf(p.checkedInCount)}{p.confirmedPartySize && p.checkedInCount < p.confirmedPartySize ? ` من ${p.confirmedPartySize}` : ''}.</p></div>
            </div>
          ) : p.rsvpStatus === 'confirmed' ? (
            <div className="hub-status is-yes">
              <Icon name="check-circle" size="lg" />
              <div><h2 id="hub-status" className="hub-h">حضوركم مؤكد</h2><p className="muted">{p.name} · {people(p.confirmedPartySize ?? 1)}</p>
                {view.experience && p.meals?.length ? <p className="gx-mine">العشاء: {mealSummary(view.experience, p.meals)}</p> : null}
                {p.dietary?.needs.length ? <p className="gx-mine">نراعي: {dietaryLabel(p.dietary)}</p> : null}</div>
            </div>
          ) : p.rsvpStatus === 'declined' ? (
            <div className="hub-status is-no">
              <Icon name="envelope" size="lg" />
              <div><h2 id="hub-status" className="hub-h">سجّلنا اعتذاركم</h2><p className="muted">نفتقدكم{view.canEdit ? '. إن تغيّرت الظروف يمكنكم تعديل الرد.' : '.'}</p></div>
            </div>
          ) : (
            <div><h2 id="hub-status" className="hub-h">لم تردوا بعد</h2><p className="muted">الدعوة تشمل {peopleOf(p.maxPartySize)}.</p></div>
          )}

          {p && p.rsvpStatus === 'confirmed' && p.tableName && <p className="hub-table"><Icon name="table" size="sm" />طاولتكم: <strong>{p.tableName}</strong></p>}
          {p?.companionNames?.length ? <p className="faint t-sm">المرافقون: {p.companionNames.join('، ')}</p> : null}

          {p && view.canEdit && !editing && <Button variant="secondary" icon="edit" onClick={() => setEditing(true)}>{p.rsvpStatus === 'pending' ? 'ردّوا الآن' : 'تعديل الرد'}</Button>}
          {p && !view.canEdit && view.phase !== 'after' && p.rsvpStatus !== 'pending' && <p className="faint t-sm">بدأت المناسبة — لتعديل الرد تواصلوا مع صاحب الدعوة.</p>}
          {p && editing && view.canEdit && <RsvpForm view={view} code={code!} onSaved={(v) => { onView(v); setEditing(false); }} onRefresh={onView} onCancel={p.rsvpStatus !== 'pending' ? () => setEditing(false) : undefined} />}
        </section>

        {/* ---------------- after a decline: the reply is accepted first, then an optional way to share the joy (F066–F068) */}
        {p?.rsvpStatus === 'declined' && !editing && view.experience && showsAfterDecline(view.experience) && <Wishlist x={view.experience} mode="decline" />}

        {/* ---------------- QR for the gate */}
        {p && p.rsvpStatus === 'confirmed' && view.phase !== 'after' && (
          <section className="hub-card hub-qr" aria-labelledby="hub-qr">
            <h2 id="hub-qr" className="hub-h">رمز الدخول</h2>
            <p className="muted t-sm">اعرضوه على فريق الاستقبال عند الوصول.</p>
            <QrFullscreen value={absolute(paths.guestLink(view.event.slug, p.code))} code={p.code} name={p.name} title={view.event.title} />
            <p className="hub-code num" dir="ltr">{p.code}</p>
          </section>
        )}

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

function RsvpForm({ view, code, onSaved, onRefresh, onCancel }: { view: GuestView; code: string; onSaved: (v: GuestView) => void; onRefresh: (v: GuestView) => void; onCancel?: () => void }) {
  const services = useServices();
  const p = view.party!;
  const [attending, setAttending] = useState<'yes' | 'no' | null>(p.rsvpStatus === 'confirmed' ? 'yes' : p.rsvpStatus === 'declined' ? 'no' : null);
  const [count, setCount] = useState(Math.min(p.maxPartySize, p.confirmedPartySize || Math.min(2, p.maxPartySize)));
  const [companions, setCompanions] = useState<string[]>(p.companionNames ?? []);
  const [note, setNote] = useState(p.guestNote ?? '');
  const [extras, setExtras] = useState<ExtrasValue>(() => emptyExtras(p));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const x = view.experience;
  const asks = attending === 'yes' && !!x && asksAfterAttending(x);
  const err = attending === 'yes' ? validateRsvp({ attending: true, count }, p.maxPartySize) : null;
  const xErr = asks ? extrasError(x, extras, count) : null;

  const save = async () => {
    setTried(true);
    if (!attending || err || xErr) return;
    setPending(true); setError(null);
    try {
      const v = await services.guest.submitRsvp(view.event.slug, code, { attending: attending === 'yes', count: attending === 'yes' ? count : 0, companionNames: companions.slice(0, Math.max(0, count - 1)).filter(Boolean), note: note || undefined, ...(asks ? extrasPayload(x, extras) : {}) });
      onSaved(v);
    } catch (e) {
      setError(errorMessage(e));
      // the host changed the menu while this form was open: load it, keep every answer that still exists (T17)
      if (isAppError(e) && e.code === 'conflict' && e.field === 'meals') {
        try { const fresh = await services.guest.open(view.event.slug, code); onRefresh(fresh); } catch { /* the banner already explains */ }
      }
    } finally { setPending(false); }
  };

  return (
    <div className="stack gap-4 hub-form">
      {error && <Banner tone="danger">{error}</Banner>}
      <ChoiceGroup label="هل ستحضرون؟" value={attending} onChange={setAttending} error={tried && !attending ? 'اختاروا الحضور أو الاعتذار' : null}
        options={[{ value: 'yes', label: 'نعم، سنحضر' }, { value: 'no', label: 'نعتذر' }]} />
      {attending === 'yes' && (
        <>
          <Stepper label="عدد الحضور" value={count} min={1} max={p.maxPartySize} onChange={(n) => { setCount(n); setExtras((v) => fitExtras(v, n)); }} />
          <p className="faint t-sm">الدعوة تشمل حتى {peopleOf(p.maxPartySize)}.</p>
          {err && <p className="field-error">{RSVP_ERROR_TEXT[err]}</p>}
          {count > 1 && (
            <fieldset className="form-group">
              <legend className="field-label">أسماء المرافقين <span className="field-opt">(اختياري)</span></legend>
              {Array.from({ length: count - 1 }, (_, i) => (
                <Input key={i} aria-label={`اسم المرافق ${i + 1}`} placeholder={`المرافق ${i + 1}`} value={companions[i] ?? ''} onChange={(e) => setCompanions((c) => { const n = [...c]; n[i] = e.target.value; return n; })} />
              ))}
            </fieldset>
          )}
          {asks && <GuestExtrasFields x={x!} count={count} value={extras} onChange={setExtras} error={tried ? xErr : null} />}
        </>
      )}
      <Field label="رسالة لأصحاب الدعوة" optional><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={240} /></Field>
      <div className="row wrap gap-2">
        <Button variant="primary" loading={pending} onClick={() => void save()}>إرسال الرد</Button>
        {onCancel && <Button variant="ghost" onClick={onCancel}>إلغاء</Button>}
      </div>
    </div>
  );
}

function GeneralResponse({ view, onSaved }: { view: GuestView; onSaved: (v: GuestView, name: string) => void }) {
  const services=useServices();
  const [name,setName]=useState(''), [answer,setAnswer]=useState<'yes'|'no'|null>(null), [count,setCount]=useState(1), [busy,setBusy]=useState(false), [error,setError]=useState('');
  const [extras,setExtras]=useState<ExtrasValue>(()=>emptyExtras()), [tried,setTried]=useState(false);
  const x=view.experience, asks=answer==='yes'&&!!x&&asksAfterAttending(x), xErr=asks?extrasError(x,extras,count):null;
  return <form className="stack gap-4" onSubmit={async e=>{
    e.preventDefault(); setTried(true); if(!name.trim()||!answer){setError('اكتبوا الاسم واختاروا تأكيد الحضور أو الاعتذار.');return;}
    if(xErr) return;
    setBusy(true);setError('');
    try { const v=await services.guest.submitRsvp(view.event.slug,null,{name:name.trim(),attending:answer==='yes',count:answer==='yes'?count:0,...(asks?extrasPayload(x,extras):{})});onSaved(v,name.trim()); }
    catch(e){setError(errorMessage(e));}finally{setBusy(false);}
  }}><Field label="الاسم" required><Input value={name} onChange={e=>setName(e.target.value)} autoComplete="name" required/></Field><ChoiceGroup label="هل ستشرفوننا؟" value={answer} onChange={(v:'yes'|'no')=>setAnswer(v)} options={[{value:'yes',label:'بكل سرور، سنحضر'},{value:'no',label:'نعتذر عن الحضور'}]}/>{answer==='yes'&&<Stepper label="العدد شاملًا صاحب الدعوة" value={count} min={1} max={view.maxGuests} onChange={n=>{setCount(n);setExtras(v=>fitExtras(v,n));}}/>}{asks&&<GuestExtrasFields x={x!} count={count} value={extras} onChange={setExtras} error={tried?xErr:null}/>}<p className="field-hint">هذا رابط عام؛ يراجع صاحب المناسبة الرد قبل تخصيص رمز دخول.</p>{error&&<Banner tone="danger">{error}</Banner>}<Button variant="primary" type="submit" loading={busy}>تأكيد الرد</Button></form>;
}
