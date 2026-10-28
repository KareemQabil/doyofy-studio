/**
 * Gate mode (spec §17): a focused, high-contrast screen for reception staff — no organizer
 * dashboard. Scan (simulated) or search → party card → full or partial check-in. Exceptions
 * (declined, not replied, more than confirmed/allowed, already used, no table) are shown and need
 * an explicit staff decision; nothing is silently fixed. Every check-in can be undone.
 */
import { useMemo, useRef, useState } from 'react';
import type { CheckInRecord, Event, InvitationParty } from '../../domain/types';
import { assessCheckIn, BLOCKING, codeFromScan, EXCEPTION_TEXT } from '../../domain/checkin';
import { countParties, searchParties } from '../../domain/parties';
import { eventPhase, todayFor } from '../../domain/event';
import { countdownLabel, people, peopleOf } from '../../domain/format';
import { Button, Checkbox, Dialog, ErrorState, Icon, Input, Stepper, Textarea, PageLoader, Lottie } from '../../ui';
import { useMutation, useNow, useServices } from '../../app/data';
import { Link, useRouter } from '../../app/router';
import { paths } from '../../app/paths';
import { errorMessage } from '../../services/errors';
import { useEvent, useParties, useTables } from '../shared/queries';

type View = { kind: 'search' } | { kind: 'party'; id: string; method: 'qr' | 'search' } | { kind: 'done'; record: CheckInRecord; party: InvitationParty } | { kind: 'notfound'; input: string } | { kind: 'lookup-error'; input: string; message: string };

export function GateMode({ eventId }: { eventId: string }) {
  const ev = useEvent(eventId);
  const parties = useParties(eventId);
  const tables = useTables(eventId);
  if (ev.error || parties.error || tables.error) return <div className="gate theme-gate"><ErrorState error={ev.error || parties.error || tables.error} onRetry={() => { ev.refetch(); parties.refetch(); tables.refetch(); }} /></div>;
  if (!ev.data || !parties.data || !tables.data) return <div className="gate theme-gate"><PageLoader /></div>;
  return <Gate seatingEnabled={tables.data.length>0} event={ev.data} parties={parties.data} tableName={(id) => tables.data!.find((t) => t.id === id)?.name} />;
}

function Gate({ event, parties, tableName, seatingEnabled }: { seatingEnabled: boolean; event: Event; parties: InvitationParty[]; tableName: (id?: string) => string | undefined }) {
  const now = useNow();
  const services = useServices();
  const [view, setView] = useState<View>({ kind: 'search' });
  const [q, setQ] = useState('');
  const [scanning, setScanning] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const c = countParties(parties);
  const phase = eventPhase(event, now);
  const results = useMemo(() => (q.trim().length >= 2 ? searchParties(parties, q).slice(0, 12) : []), [parties, q]);
  const back = () => { setView({ kind: 'search' }); setQ(''); setTimeout(() => searchRef.current?.focus(), 50); };

  const onScan = async (payload: string) => {
    setScanning(false);
    const code = codeFromScan(payload);
    let p: InvitationParty | null = null;
    if (code) {
      try { p = await services.checkIn.findByCode(event.id, code); }
      catch (error) { setView({ kind: 'lookup-error', input: payload, message: errorMessage(error) }); return; }
    }
    if (!p) { setView({ kind: 'notfound', input: payload }); return; }
    setView({ kind: 'party', id: p.id, method: 'qr' });
  };

  return (
    <div className="gate theme-gate" dir="rtl">
      <header className="gate-bar">
        <Link to={paths.checkin(event.id)} className="gate-exit" aria-label="خروج من الاستقبال"><Icon name="close" /></Link>
        <div className="grow">
          <h1 className="gate-title truncate">{event.title}</h1>
          <p className="gate-sub">مساحة فريق الاستقبال</p>
        </div>
        <div className="gate-counter" aria-live="polite"><span className="num">{c.checkedInPeople}</span><span className="gate-counter-of">/ {c.confirmedPeople} وصلوا</span></div>
      </header>

      {phase !== 'event_day' && (
        <p className="gate-note" role="note">{phase === 'completed' ? 'انتهت المناسبة.' : `المناسبة ${countdownLabel(event.date, todayFor(event, now))}.`} أي تسجيل الآن يُحتسب، ويمكن التراجع عنه.</p>
      )}

      <main className="gate-main" id="main">
        {view.kind === 'search' && (
          <div className="gate-home">
            <button type="button" className="gate-scan" onClick={() => setScanning(true)}>
              <Icon name="scan" size="lg" /><span>مسح رمز QR</span>
            </button>
            <div className="gate-search">
              <label htmlFor="gate-q" className="gate-label">أو ابحث بالاسم أو الجوال أو الرمز</label>
              <div className="gate-search-row">
                <Icon name="search" />
                <input id="gate-q" ref={searchRef} className="gate-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="مثال: الشهري أو 0551…" autoComplete="off" />
                {q && <button type="button" className="gate-clear" aria-label="مسح" onClick={() => setQ('')}><Icon name="close" /></button>}
              </div>
            </div>
            {q.trim().length >= 2 && (
              results.length === 0 ? (
                <div className="gate-empty"><p className="t-bold">لا يوجد ضيف بهذا الاسم</p><p>جرّب جزءًا من الاسم أو رقم الجوال. إن لم يكن في القائمة، تواصل مع المنظم قبل السماح بالدخول.</p></div>
              ) : (
                <ul className="gate-results" aria-label="نتائج البحث">
                  {results.map((p) => (
                    <li key={p.id}>
                      <button type="button" className="gate-result" onClick={() => setView({ kind: 'party', id: p.id, method: 'search' })}>
                        <span className="grow"><span className="gate-result-name">{p.primaryGuestName}</span>
                          <span className="gate-result-sub">{p.rsvpStatus === 'confirmed' ? `أكدوا ${peopleOf(p.confirmedPartySize ?? 0)}` : p.rsvpStatus === 'declined' ? 'اعتذروا' : 'لم يردوا'}{tableName(p.tableId) ? ` · ${tableName(p.tableId)}` : ''}</span></span>
                        <span className={`gate-pill is-${p.checkInStatus}`}>{p.checkInStatus === 'checked_in' ? 'وصلوا' : p.checkInStatus === 'partial' ? `وصل ${p.checkedInCount}` : 'لم يصلوا'}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )
            )}
          </div>
        )}

        {view.kind === 'party' && (() => {
          const p = parties.find((x) => x.id === view.id);
          return p ? <PartyCheckIn seatingEnabled={seatingEnabled} key={p.id + p.checkedInCount} party={p} method={view.method} table={tableName(p.tableId)} onBack={back} onDone={(record, party) => setView({ kind: 'done', record, party })} /> : null;
        })()}

        {view.kind === 'done' && (() => {
          // the mutation's party is fresh; the list catches up a moment later — show whichever is newer
          const listed = parties.find((x) => x.id === view.party.id);
          const party = listed && listed.updatedAt > view.party.updatedAt ? listed : view.party;
          return <DoneCard seatingEnabled={seatingEnabled} record={view.record} party={party} table={tableName(party.tableId)} onNext={back} onUndone={back} />;
        })()}

        {view.kind === 'notfound' && (
          <div className="gate-card is-alert" role="alert">
            <Icon name="alert" size="lg" />
            <h2 className="gate-h">لم نجد هذا الرمز</h2>
            <p>الرمز غير صحيح أو أن الدعوة حُذفت. لا تسمح بالدخول قبل التأكد: ابحث باسم الضيف، أو تواصل مع المنظم.</p>
            <div className="gate-actions"><Button variant="primary" size="lg" icon="search" onClick={back}>ابحث بالاسم</Button><Button size="lg" icon="scan" onClick={() => setScanning(true)}>امسح مرة أخرى</Button></div>
          </div>
        )}
        {view.kind === 'lookup-error' && (
          <div className="gate-card is-alert" role="alert">
            <Icon name="alert" size="lg" />
            <h2 className="gate-h">تعذر التحقق من الرمز</h2>
            <p>{view.message} لم نسجّل وصولًا. احتفظ بالرمز وحاول مجددًا.</p>
            <div className="gate-actions"><Button variant="primary" size="lg" onClick={() => void onScan(view.input)}>أعد المحاولة بنفس الرمز</Button><Button size="lg" icon="search" onClick={back}>ابحث بالاسم</Button></div>
          </div>
        )}
      </main>

      {scanning && <ScanSimulator parties={parties} onClose={() => setScanning(false)} onScan={(v) => void onScan(v)} eventSlug={event.slug} />}
    </div>
  );
}

function PartyCheckIn({ party, method, table, onBack, onDone, seatingEnabled }: { seatingEnabled: boolean; party: InvitationParty; method: 'qr' | 'search'; table?: string; onBack: () => void; onDone: (r: CheckInRecord, p: InvitationParty) => void }) {
  const base = assessCheckIn(party);
  const [count, setCount] = useState(Math.max(1, base.remaining || 1));
  const [confirmed, setConfirmed] = useState(false);
  const [note, setNote] = useState('');
  const assessed = assessCheckIn(party, count);
  const a = { ...assessed, exceptions: assessed.exceptions.filter(e=>e!=='no_table'||seatingEnabled) };
  const blocking = a.exceptions.filter((e) => BLOCKING.has(e));
  const needsDecision = blocking.length > 0;
  const save = useMutation((s) => s.checkIn.checkIn(party.id, count, { method, by: 'الاستقبال', exceptions: a.exceptions, staffNote: note.trim() || undefined }), {
    onSuccess: (r) => onDone(r.record, r.party),
  });
  const confirmedSize = party.rsvpStatus === 'confirmed' ? party.confirmedPartySize ?? party.maxPartySize : 0;
  const total = party.checkedInCount + count;
  const label = needsDecision ? `سجّل دخول ${peopleOf(count)} رغم ذلك` : total < a.expected ? `دخول جزئي: ${people(count)} الآن` : `تسجيل دخول ${peopleOf(count)}`;

  return (
    <div className="gate-card">
      <button type="button" className="gate-back" onClick={onBack}><Icon name="back" size="sm" />رجوع للبحث</button>
      <h2 className="gate-name">{party.primaryGuestName}</h2>
      <div className="gate-facts">
        <div><span className="gate-k">أكدوا</span><span className="gate-v num">{party.rsvpStatus === 'confirmed' ? confirmedSize : party.rsvpStatus === 'declined' ? 'اعتذروا' : 'لم يردوا'}</span></div>
        <div><span className="gate-k">وصل</span><span className="gate-v num">{party.checkedInCount}</span></div>
        <div><span className="gate-k">{seatingEnabled?'الطاولة':'الدعوة'}</span><span className="gate-v">{seatingEnabled?table??'—':'دون توزيع مقاعد'}</span></div>
      </div>
      {party.notes && <p className="gate-notes"><Icon name="info" size="sm" />{party.notes}</p>}

      {a.exceptions.map((e) => (
        <div key={e} className={`gate-ex${BLOCKING.has(e) ? ' is-blocking' : ''}`} role={BLOCKING.has(e) ? 'alert' : 'status'}>
          <Icon name="alert" size="sm" />
          <div><p className="t-bold">{EXCEPTION_TEXT[e].title}</p><p className="t-sm">{EXCEPTION_TEXT[e].body}</p></div>
        </div>
      ))}

      <div className="gate-count">
        <Stepper label="كم شخصًا يدخل الآن؟" value={count} min={1} max={20} onChange={(n) => { setCount(n); setConfirmed(false); }} />
        {a.remaining > 0 && count < a.remaining && <p className="gate-hint">الباقون يصلون لاحقًا: {people(a.remaining - count)}</p>}
      </div>

      {needsDecision && (
        <div className="gate-decision">
          <Checkbox checked={confirmed} onChange={setConfirmed} label="تأكدت من المنظم أو من صاحب الدعوة" />
          <label className="gate-label" htmlFor="gate-note">ملاحظة للمنظم (اختياري)</label>
          <Textarea id="gate-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثال: قالوا إن ظروفهم تغيرت" />
        </div>
      )}
      {save.error ? <p className="gate-error" role="alert">{errorMessage(save.error)}</p> : null}
      <div className="gate-actions">
        <Button variant={needsDecision ? 'danger' : 'primary'} size="lg" block disabled={needsDecision && !confirmed} loading={save.pending} onClick={() => void save.run()}>{label}</Button>
        {!needsDecision && a.remaining > 1 && count !== a.remaining && <Button size="lg" block onClick={() => setCount(a.remaining)}>الكل ({people(a.remaining)})</Button>}
      </div>
    </div>
  );
}

function DoneCard({ record, party, table, onNext, onUndone, seatingEnabled }: { seatingEnabled: boolean; record: CheckInRecord; party: InvitationParty; table?: string; onNext: () => void; onUndone: () => void }) {
  const undo = useMutation((s) => s.checkIn.undo(record.id), { onSuccess: onUndone });
  const expected = party.rsvpStatus === 'confirmed' ? party.confirmedPartySize ?? party.maxPartySize : party.maxPartySize;
  const partial = party.checkedInCount < expected;
  return (
    <div className={`gate-card gate-done${record.exceptions.some((e) => BLOCKING.has(e)) ? ' is-exception' : ''}`} role="status">
      {record.exceptions.some((e) => BLOCKING.has(e))
        ? <span className="gate-done-mark" aria-hidden="true"><Icon name="check" size="lg" /></span>
        : <Lottie name="success" size={96} className="gate-done-seal" />}
      <h2 className="gate-h">{partial ? `دخل ${people(record.count)}` : 'أهلًا وسهلًا'}</h2>
      <p className="gate-done-line">{party.primaryGuestName} · وصل <strong className="num">{party.checkedInCount}</strong> من <span className="num">{expected}</span>{partial ? ' — الباقون لاحقًا' : ''}</p>
      {table && <p className="gate-table"><Icon name="table" />{table}</p>}
      {seatingEnabled && !table && party.rsvpStatus === 'confirmed' && <p className="gate-hint">لا توجد طاولة — وجّههم لمنسق القاعة.</p>}
      {undo.error ? <p className="gate-error">{errorMessage(undo.error)}</p> : null}
      <div className="gate-actions">
        <Button variant="primary" size="lg" block icon="scan" onClick={onNext}>الضيف التالي</Button>
        <Button size="lg" block icon="undo" loading={undo.pending} onClick={() => void undo.run()}>تراجع عن التسجيل</Button>
      </div>
    </div>
  );
}

/** Camera scanning is simulated in the prototype (D-010): enter/paste a code, or pick a test scenario. */
function ScanSimulator({ parties, onClose, onScan, eventSlug }: { parties: InvitationParty[]; onClose: () => void; onScan: (v: string) => void; eventSlug: string }) {
  const [value, setValue] = useState('');
  const { absolute } = useRouter();
  const pick = (f: (p: InvitationParty) => boolean) => parties.find(f);
  const samples = [
    { label: 'دعوة مؤكدة لم تصل', p: pick((p) => p.rsvpStatus === 'confirmed' && p.checkedInCount === 0 && !!p.tableId) },
    { label: 'دعوة وصل جزء منها', p: pick((p) => p.checkInStatus === 'partial') ?? pick((p) => p.rsvpStatus === 'confirmed' && p.confirmedPartySize! > 2 && p.checkedInCount === 0) },
    { label: 'رمز استُخدم بالكامل', p: pick((p) => p.checkInStatus === 'checked_in') },
    { label: 'ضيف معتذر', p: pick((p) => p.rsvpStatus === 'declined' && p.checkedInCount === 0) },
    { label: 'ضيف لم يرد', p: pick((p) => p.rsvpStatus === 'pending') },
    { label: 'مؤكد بلا طاولة', p: pick((p) => p.rsvpStatus === 'confirmed' && !p.tableId && p.checkedInCount === 0) },
  ].filter((s) => s.p);
  return (
    <Dialog open onClose={onClose} title="مسح رمز QR" description="الكاميرا محاكاة في هذا النموذج: أدخل الرمز أو اختر حالة تجريبية.">
      <div className="scan-frame" aria-hidden="true"><span /><Icon name="qr" size="lg" /></div>
      <form className="row gap-2" onSubmit={(e) => { e.preventDefault(); if (value.trim()) onScan(value); }}>
        <Input ltr value={value} onChange={(e) => setValue(e.target.value)} placeholder="رمز من 5 أحرف أو رابط الدعوة" aria-label="الرمز أو الرابط" data-autofocus />
        <Button type="submit" variant="primary" disabled={!value.trim()}>تحقق</Button>
      </form>
      <div className="stack gap-2">
        <p className="field-label">حالات تجريبية</p>
        <div className="scan-samples">
          {samples.map((s) => <Button key={s.label} size="sm" onClick={() => onScan(absolute(paths.guestLink(eventSlug, s.p!.code)))}>{s.label}</Button>)}
          <Button size="sm" onClick={() => onScan('ZZZZ9')}>رمز غير موجود</Button>
        </div>
      </div>
    </Dialog>
  );
}
