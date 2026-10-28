import { JourneyArtwork } from '../../../ui/primitives/JourneyArtwork';
/**
 * Guest import (spec §11): 1 choose a file / paste / sample → 2 match columns → 3 review & resolve
 * (missing name, malformed phone, duplicates in file or list, skip) → 4 result summary.
 * Nothing is written until the organizer confirms; unresolved rows block the confirm button.
 */
import { useMemo, useRef, useState } from 'react';
import type { Event } from '../../../domain/types';
import { FIELD_LABEL, SAMPLE_IMPORT_CSV, guessMapping, mappingProblems, parseDelimited, reviewImport, rowsToPartyInputs, summarise, toRawTable, type ImportField, type ImportRow, type Mapping, type RawTable, type RowDecision, type RowEdit } from '../../../domain/import';
import { formatPhone, people, peopleOf, plural, pluralOf, P } from '../../../domain/format';
import { Badge, Banner, Button, ErrorState, Field, FilterChips, FocusLayout, Icon, Input, LinkButton, Select, Textarea, PageLoader } from '../../../ui';
import { useMutation } from '../../../app/data';
import { useBlocker, useNavigate } from '../../../app/router';
import { paths } from '../../../app/paths';
import { readSpreadsheet } from '../../../services/files/spreadsheet';
import { errorMessage } from '../../../services/errors';
import { useEvent, useParties } from '../../shared/queries';

type Step = 'source' | 'map' | 'review' | 'done';

export function ImportFlow({ eventId }: { eventId: string }) {
  const ev = useEvent(eventId);
  const parties = useParties(eventId);
  if (ev.error || parties.error) return <FocusLayout title="استيراد الضيوف" back={{ to: paths.guests(eventId), label: 'إلغاء' }}><ErrorState error={ev.error || parties.error} onRetry={() => { ev.refetch(); parties.refetch(); }} /></FocusLayout>;
  if (!ev.data || !parties.data) return <FocusLayout title="استيراد الضيوف" back={{ to: paths.guests(eventId), label: 'إلغاء' }}><PageLoader /></FocusLayout>;
  return <Flow event={ev.data} existing={parties.data} />;
}

function Flow({ event, existing }: { event: Event; existing: NonNullable<ReturnType<typeof useParties>['data']> }) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('source');
  const [source, setSource] = useState('');
  const [table, setTable] = useState<RawTable | null>(null);
  const [mapping, setMapping] = useState<Mapping>([]);
  const [edits, setEdits] = useState<Record<number, RowEdit>>({});
  const [decisions, setDecisions] = useState<Record<number, RowDecision>>({});
  const [result, setResult] = useState<{ added: number; skipped: number; people: number } | null>(null);
  const importing = useMutation((s, rows: ImportRow[], skipped: number) => s.parties.importMany(event.id, rowsToPartyInputs(rows), { skipped, source }));
  useBlocker(!!table && step !== 'done', 'لم يكتمل الاستيراد. إذا غادرت الآن لن يُضاف أي ضيف.');

  const rows = useMemo(() => (table ? reviewImport({ table, mapping, edits, decisions, existing, defaultSize: event.settings.defaultPartySize }) : []), [table, mapping, edits, decisions, existing, event.settings.defaultPartySize]);
  const sum = summarise(rows);

  const load = (cells: string[][], label: string) => {
    const t = toRawTable(cells);
    const guessed = guessMapping(t);
    setTable(t); setMapping(guessed); setEdits({}); setDecisions({}); setSource(label);
    setStep(t.hadHeader && mappingProblems(guessed).length === 0 && guessed.includes('name') ? 'review' : 'map');
  };

  const confirm = async () => {
    const created = await importing.run(rows, sum.skipped);
    if (created) { setResult({ added: created.length, skipped: sum.skipped, people: sum.people }); setStep('done'); }
  };

  const stepNo = { source: 1, map: 2, review: 3, done: 4 }[step];
  const footer = step === 'map' ? (
    <><Button variant="ghost" icon="back" onClick={() => { setStep('source'); setTable(null); }}>ملف آخر</Button>
      <Button variant="primary" size="lg" iconEnd="forward" disabled={mappingProblems(mapping).length > 0} onClick={() => setStep('review')}>راجع الأسماء</Button></>
  ) : step === 'review' ? (
    <><Button variant="ghost" icon="back" onClick={() => setStep('map')}>تعديل الأعمدة</Button>
      <div className="row gap-3">
        {sum.blocked > 0 && <span className="t-sm text-warning">عالج {pluralOf(sum.blocked, P.row)} أو تخطَّها</span>}
        <Button variant="primary" size="lg" disabled={sum.blocked > 0 || sum.toImport === 0} loading={importing.pending} onClick={() => void confirm()}>أضف {pluralOf(sum.toImport, P.guest)}</Button>
      </div></>
  ) : undefined;

  return (
    <FocusLayout title="استيراد الضيوف" width={step === 'review' ? 'wide' : 'narrow'} back={{ to: paths.guests(event.id), label: step === 'done' ? 'إغلاق' : 'إلغاء' }}
      right={step !== 'done' ? <span className="faint t-sm num">الخطوة {stepNo} من 3</span> : undefined} footer={footer}>
      {step === 'source' && <SourceStep onLoad={load} />}
      {step === 'map' && table && <MapStep table={table} mapping={mapping} onChange={setMapping} source={source} />}
      {step === 'review' && (
        <ReviewStep rows={rows} sum={sum} error={importing.error}
          onEdit={(i, e) => setEdits((x) => ({ ...x, [i]: { ...x[i], ...e } }))}
          onDecide={(i, d) => setDecisions((x) => ({ ...x, [i]: d }))}
          onSkipBlocked={() => setDecisions((x) => ({ ...x, ...Object.fromEntries(rows.filter((r) => r.state === 'blocked').map((r) => [r.index, 'skip' as const])) }))} />
      )}
      {step === 'done' && result && (
        <div className="stack gap-6 import-done">
          <JourneyArtwork kind="celebrate"/>
          <div className="stack gap-2">
            <h2 className="t-xl">تمت إضافة {pluralOf(result.added, P.guest)}</h2>
            <p className="muted">{result.added ? `${plural(result.added, P.invitation)} تتسع لـ${peopleOf(result.people)}.` : ''} {result.skipped ? `تم تخطي ${pluralOf(result.skipped, P.row)} — لم يُضف منها شيء.` : 'لم يُتخطَّ أي صف.'}</p>
          </div>
          <div className="row wrap gap-2">
            <Button variant="primary" size="lg" icon="share" onClick={() => navigate(paths.guests(event.id, { filter: 'not_shared' }))}>شارك الدعوات الجديدة</Button>
            <LinkButton to={paths.guests(event.id)}>اعرض قائمة الضيوف</LinkButton>
          </div>
        </div>
      )}
    </FocusLayout>
  );
}

function SourceStep({ onLoad }: { onLoad: (cells: string[][], label: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<unknown>(null);
  const [reading, setReading] = useState(false);
  const [paste, setPaste] = useState('');
  const [drag, setDrag] = useState(false);
  const read = async (f: File | undefined) => {
    if (!f) return;
    setError(null); setReading(true);
    try {
      const cells = await readSpreadsheet(f);
      if (cells.length === 0) throw new Error('لم نجد أي صفوف في الملف. تأكد أن القائمة في الورقة الأولى.');
      onLoad(cells, f.name);
    } catch (e) { setError(e); } finally { setReading(false); if (input.current) input.current.value = ''; }
  };
  const sampleHref = `data:text/csv;charset=utf-8,${encodeURIComponent('﻿' + SAMPLE_IMPORT_CSV)}`;
  return (
    <div className="stack gap-6">
      <header className="stack gap-2">
        <p className="eyebrow">نجمع أحبابك، بكل اطمئنان</p><h2 className="t-xl">قائمة ضيوفك جاهزة؟</h2>
        <p className="muted">ملف Excel أو CSV فيه عمود للاسم على الأقل. الجوال والعدد المسموح اختياريان.</p>
      </header>
      <p className="import-assurance"><Icon name="check-circle" size="sm"/>ستراجع الأسماء والتكرارات قبل الإضافة. قائمتك الحالية تبقى كما هي.</p>
      {error ? <Banner tone="danger" title="تعذر قراءة الملف">{errorMessage(error)}</Banner> : null}
      <label className={`dropzone${drag ? ' is-drag' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); void read(e.dataTransfer.files[0]); }}>
        <input ref={input} type="file" accept=".xlsx,.csv,.tsv,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" onChange={(e) => void read(e.target.files?.[0])} />
        {reading ? <span className="spinner spinner-lg" aria-label="جارٍ القراءة" /> : <JourneyArtwork kind="upload"/>}
        <span className="dropzone-title">اختر ملفًا أو اسحبه هنا</span>
        <span className="faint t-sm">‏.xlsx أو ‎.csv · حتى 5 ميجابايت</span>
      </label>
      <details className="import-alternatives"><summary>بدون ملف؟ الصق قائمة أو جرّب نموذجًا <Icon name="chevron-down" size="sm"/></summary>
      <div className="grid-2">
        <div className="stack gap-2 sample-box">
          <p className="t-bold">جرّب بملف نموذجي</p>
          <p className="faint t-sm">21 صفًا فيها حالات حقيقية: رقم مكرر، اسم ناقص، رقم غير صحيح.</p>
          <div className="row wrap gap-2">
            <Button variant="quiet" icon="file" onClick={() => onLoad(parseDelimited(SAMPLE_IMPORT_CSV), 'ملف نموذجي')}>استخدم الملف النموذجي</Button>
            <a className="btn btn-ghost btn-sm" href={sampleHref} download="doyofy-guests-sample.csv"><Icon name="download" size="sm" />نزّله</a>
          </div>
        </div>
        <div className="stack gap-2">
          <Field label="أو الصق من Excel" hint="انسخ الأعمدة من Excel أو Google Sheets والصقها هنا">
            <Textarea rows={4} value={paste} onChange={(e) => setPaste(e.target.value)} dir="auto" />
          </Field>
          <Button disabled={!paste.trim()} onClick={() => onLoad(parseDelimited(paste), 'لصق')}>متابعة بالنص الملصق</Button>
        </div>
      </div>
      </details>
    </div>
  );
}

function MapStep({ table, mapping, onChange, source }: { table: RawTable; mapping: Mapping; onChange: (m: Mapping) => void; source: string }) {
  const problems = mappingProblems(mapping);
  const fields: ImportField[] = ['name', 'phone', 'size', 'side', 'companions', 'notes', 'ignore'];
  return (
    <div className="stack gap-6">
      <header className="stack gap-2">
        <h2 className="t-xl">تأكد من تفاصيل القائمة</h2>
        <p className="muted">{source} · {plural(table.rows.length, P.row)}. تعرّفنا على الأعمدة. راجعها فقط إذا احتاجت تعديلًا.</p>
      </header>
      {problems.map((p) => <Banner key={p} tone="warning" compact>{p}</Banner>)}
      <div className="map-list">
        {table.headers.map((h, i) => (
          <div key={i} className={`map-row${mapping[i] === 'ignore' ? ' is-ignored' : ''}`}>
            <div className="map-col">
              <p className="t-bold">{h}</p>
              <p className="faint t-sm truncate">{table.rows.slice(0, 3).map((r) => r[i]).filter(Boolean).join(' · ') || '—'}</p>
            </div>
            <Icon name="forward" size="sm" className="faint" />
            <Select aria-label={`العمود ${h}`} value={mapping[i]} onChange={(e) => onChange(mapping.map((m, j) => (j === i ? (e.target.value as ImportField) : m === e.target.value && e.target.value !== 'ignore' ? 'ignore' : m)))}>
              {fields.map((f) => <option key={f} value={f}>{FIELD_LABEL[f]}{f === 'name' ? ' (مطلوب)' : ''}</option>)}
            </Select>
          </div>
        ))}
      </div>
      {!table.hadHeader && <p className="faint t-sm">لم نجد صف عناوين، فاعتبرنا كل الصفوف بيانات.</p>}
    </div>
  );
}

type ReviewFilter = 'all' | 'blocked' | 'warning' | 'skipped';

function ReviewStep({ rows, sum, error, onEdit, onDecide, onSkipBlocked }: {
  rows: ImportRow[]; sum: ReturnType<typeof summarise>; error: unknown;
  onEdit: (i: number, e: RowEdit) => void; onDecide: (i: number, d: RowDecision) => void; onSkipBlocked: () => void;
}) {
  const [f, setF] = useState<ReviewFilter>(sum.blocked ? 'blocked' : 'all');
  const list = rows.filter((r) => f === 'all' || r.state === f);
  return (
    <div className="stack gap-5">
      <header className="stack gap-2">
        <h2 className="t-xl">راجع قبل الإضافة</h2>
        <p className="muted">لن يُضاف أي ضيف حتى تضغط «أضف». يمكنك تصحيح الصفوف هنا أو تخطيها.</p>
      </header>
      {error ? <Banner tone="danger" title="لم يكتمل الاستيراد">{errorMessage(error)} لم يُضف أي ضيف.</Banner> : null}
      <div className="import-summary">
        <div className="is-ok"><strong className="num">{sum.toImport}</strong><span>ستُضاف</span></div>
        <div className="is-blocked"><strong className="num">{sum.blocked}</strong><span>تحتاج قرارك</span></div>
        <div className="is-warn"><strong className="num">{sum.warnings}</strong><span>بملاحظات</span></div>
        <div className="is-skip"><strong className="num">{sum.skipped}</strong><span>متخطاة</span></div>
      </div>
      <div className="row wrap between gap-3">
        <FilterChips label="عرض الصفوف" value={f} onChange={setF} options={[
          { id: 'blocked', label: 'تحتاج قرارك', count: sum.blocked }, { id: 'warning', label: 'بملاحظات', count: sum.warnings },
          { id: 'skipped', label: 'متخطاة', count: sum.skipped }, { id: 'all', label: 'الكل', count: sum.total }]} />
        {sum.blocked > 0 && <Button size="sm" variant="ghost" onClick={onSkipBlocked}>تخطَّ كل ما يحتاج قرارًا</Button>}
      </div>
      {list.length === 0 ? <p className="faint t-sm empty-compact">{f === 'blocked' ? 'لا توجد صفوف تحتاج قرارك. جاهز للإضافة.' : 'لا توجد صفوف هنا.'}</p> : (
        <ol className="import-rows">
          {list.map((r) => <ImportRowItem key={r.index} r={r} onEdit={onEdit} onDecide={onDecide} />)}
        </ol>
      )}
    </div>
  );
}

const STATE_BADGE = { ok: ['جاهز', 'success'], warning: ['جاهز بملاحظة', 'info'], blocked: ['يحتاج قرارك', 'warning'], skipped: ['متخطى', 'neutral'] } as const;

function ImportRowItem({ r, onEdit, onDecide }: { r: ImportRow; onEdit: (i: number, e: RowEdit) => void; onDecide: (i: number, d: RowDecision) => void }) {
  const has = (code: string) => r.issues.some((x) => x.code === code);
  const dupBlocking = r.issues.some((x) => (x.code === 'duplicate_in_file' || x.code === 'duplicate_existing') && x.blocking);
  return (
    <li className={`import-row is-${r.state}`}>
      <div className="import-row-head">
        <span className="faint t-xs num">صف {r.index}</span>
        <span className="t-bold grow">{r.name || <span className="text-warning">بدون اسم</span>}</span>
        <span className="num t-sm" dir="ltr">{r.phone ? formatPhone(r.phone) : r.phoneRaw || '—'}</span>
        <span className="t-sm faint">{people(r.size)}</span>
        <Badge tone={STATE_BADGE[r.state][1]}>{STATE_BADGE[r.state][0]}</Badge>
      </div>
      {r.issues.length > 0 && (
        <ul className="import-issues">
          {r.issues.map((x) => <li key={x.code} className={x.blocking && r.state === 'blocked' ? 'is-blocking' : ''}><Icon name={x.blocking && r.state === 'blocked' ? 'alert' : 'info'} size="sm" />{x.text}</li>)}
        </ul>
      )}
      {r.state !== 'skipped' && (has('missing_name') || has('malformed_phone')) && (
        <div className="import-fix">
          {has('missing_name') && <Field label="اكتب الاسم"><Input defaultValue={r.name} onBlur={(e) => onEdit(r.index, { name: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') onEdit(r.index, { name: e.currentTarget.value }); }} /></Field>}
          {has('malformed_phone') && <Field label="صحّح الرقم"><Input ltr type="tel" defaultValue={r.phoneRaw} onBlur={(e) => onEdit(r.index, { phone: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') onEdit(r.index, { phone: e.currentTarget.value }); }} /></Field>}
        </div>
      )}
      <div className="row wrap gap-2">
        {r.state === 'skipped' ? (
          <Button size="sm" variant="ghost" icon="undo" onClick={() => onDecide(r.index, 'import')}>{dupBlocking ? 'أضفه على أي حال' : 'لا تتخطَّه'}</Button>
        ) : (
          <>
            {dupBlocking && r.state === 'blocked' && <Button size="sm" variant="primary" icon="close" onClick={() => onDecide(r.index, 'skip')}>لا تضفه مرتين (تخطَّ)</Button>}
            {dupBlocking && r.state === 'blocked' && <Button size="sm" onClick={() => onDecide(r.index, 'import')}>أضفه على أي حال</Button>}
            {has('malformed_phone') && <Button size="sm" onClick={() => onDecide(r.index, 'import_without_phone')}>استورد بدون رقم</Button>}
            {r.decision === 'import_without_phone' && <Button size="sm" variant="ghost" onClick={() => onDecide(r.index, 'import')}>أعد الرقم</Button>}
            {!(dupBlocking && r.state === 'blocked') && <Button size="sm" variant="ghost" icon="close" onClick={() => onDecide(r.index, 'skip')}>تخطَّ هذا الصف</Button>}
          </>
        )}
      </div>
    </li>
  );
}
