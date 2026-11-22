import { JourneyArtwork } from '../../../ui/primitives/JourneyArtwork';
/**
 * Guest import (spec §11): 1 choose a file / paste / sample → 2 match columns → 3 review & resolve
 * (missing name, malformed phone, duplicates in file or list, skip) → 4 result summary.
 * Nothing is written until the organizer confirms; unresolved rows block the confirm button.
 */
import { useMemo, useRef, useState } from 'react';
import type { Event } from '../../../domain/types';
import { fieldLabel, SAMPLE_IMPORT_CSV, guessMapping, importTables, mappingProblems, matchTable, newTableName, parseDelimited, reviewImport, rowsToPartyInputs, summarise, toRawTable, type ImportField, type ImportRow, type Mapping, type RawTable, type RowDecision, type RowEdit } from '../../../domain/import';
import { formatPhone } from '../../../domain/format';
import { useCopy } from '../../../ui/copy';
import { Badge, Banner, Button, Checkbox, ErrorState, Field, FilterChips, FocusLayout, Icon, Input, LinkButton, Select, Textarea, PageLoader } from '../../../ui';
import { useMutation } from '../../../app/data';
import { useBlocker, useNavigate } from '../../../app/router';
import { paths } from '../../../app/paths';
import { readSpreadsheet } from '../../../services/files/spreadsheet';
import { errorMessage } from '../../../services/errors';
import { useEvent, useParties, useTables } from '../../shared/queries';
import { allocatedGuests, guestLimit, GuestLimitError } from '../../../domain/billing';
import { useCapacityVersion } from '../../billing/CapacityMeter';

type Step = 'source' | 'map' | 'review' | 'done';

export function ImportFlow({ eventId }: { eventId: string }) {
  const ev = useEvent(eventId);
  const parties = useParties(eventId);
  const { t } = useCopy();
  if (ev.error || parties.error) return <FocusLayout title={t('imTitle')} back={{ to: paths.guests(eventId), label: t('cancel') }}><ErrorState error={ev.error || parties.error} onRetry={() => { ev.refetch(); parties.refetch(); }} /></FocusLayout>;
  if (!ev.data || !parties.data) return <FocusLayout title={t('imTitle')} back={{ to: paths.guests(eventId), label: t('cancel') }}><PageLoader /></FocusLayout>;
  return <Flow event={ev.data} existing={parties.data} />;
}

function Flow({ event, existing }: { event: Event; existing: NonNullable<ReturnType<typeof useParties>['data']> }) {
  const navigate = useNavigate();
  const { t, n, dialect } = useCopy();
  const [step, setStep] = useState<Step>('source');
  const [source, setSource] = useState('');
  const [table, setTable] = useState<RawTable | null>(null);
  const [mapping, setMapping] = useState<Mapping>([]);
  const [edits, setEdits] = useState<Record<number, RowEdit>>({});
  const [decisions, setDecisions] = useState<Record<number, RowDecision>>({});
  const [result, setResult] = useState<{ added: number; skipped: number; people: number; seated: number; newTables: number } | null>(null);
  // the file's «الطاولة» column: rows on an existing table keep it; missing tables are created only if the organizer asks
  const tables = useTables(event.id).data ?? [];
  const [createTables, setCreateTables] = useState(false);
  const tableFor = (cell: string) => { const id = matchTable(cell, tables); return id ? tables.find((t) => t.id === id)!.name : createTables ? newTableName(cell) : undefined; };
  const importing = useMutation((s, rows: ImportRow[], skipped: number) => s.parties.importMany(event.id, rowsToPartyInputs(rows, tableFor), { skipped, source, newTables: createTables ? importTables(rows, tables).missing : [] }));
  useBlocker(!!table && step !== 'done', t('imLeave'));

  const rows = useMemo(() => (table ? reviewImport({ table, mapping, edits, decisions, existing, defaultSize: event.settings.defaultPartySize, dialect }) : []), [table, mapping, edits, decisions, existing, event.settings.defaultPartySize, dialect]);
  const sum = summarise(rows);

  const load = (cells: string[][], label: string) => {
    const raw = toRawTable(cells);
    const guessed = guessMapping(raw);
    setTable(raw); setMapping(guessed); setEdits({}); setDecisions({}); setSource(label);
    setStep(raw.hadHeader && mappingProblems(guessed).length === 0 && guessed.includes('name') ? 'review' : 'map');
  };

  const confirm = async () => {
    const created = await importing.run(rows, sum.skipped);
    if (created) { setResult({ added: created.length, skipped: sum.skipped, people: sum.people, seated: created.filter((p) => p.tableId).length, newTables: createTables ? importTables(rows, tables).missing.length : 0 }); setStep('done'); }
  };

  const stepNo = { source: 1, map: 2, review: 3, done: 4 }[step];
  const footer = step === 'map' ? (
    <><Button variant="ghost" icon="back" onClick={() => { setStep('source'); setTable(null); }}>{t('imOtherFile')}</Button>
      <Button variant="primary" size="lg" iconEnd="forward" disabled={mappingProblems(mapping).length > 0} onClick={() => setStep('review')}>{t('imToReview')}</Button></>
  ) : step === 'review' ? (
    // phones: the hint gets its own line above the two buttons (never a word-per-line column beside a clipped primary)
    <>{sum.blocked > 0 && <p className="import-foot-hint t-sm text-warning" role="status">{t('imFixFirst', { rows: n(sum.blocked, 'row', true) })}</p>}
      <Button variant="ghost" icon="back" className="import-foot-btn" onClick={() => setStep('map')}>{t('imEditColumns')}</Button>
      <Button variant="primary" size="lg" className="import-foot-btn" disabled={sum.blocked > 0 || sum.toImport === 0} loading={importing.pending} onClick={() => void confirm()}>{t('imAddN', { guests: n(sum.toImport, 'guest', true) })}</Button></>
  ) : undefined;

  return (
    <FocusLayout title={t('imTitle')} width={step === 'review' ? 'wide' : 'narrow'} back={{ to: paths.guests(event.id), label: step === 'done' ? t('close') : t('cancel') }}
      right={step !== 'done' ? <span className="faint t-sm num">{t('imStepOf', { n: stepNo })}</span> : undefined} footer={footer}>
      {step === 'source' && <SourceStep onLoad={load} />}
      {step === 'map' && table && <MapStep table={table} mapping={mapping} onChange={setMapping} source={source} />}
      {step === 'review' && (
        <ReviewStep rows={rows} sum={sum} error={importing.error} capacity={{ used: allocatedGuests(existing), limit: guestLimit(event.id) }}
          tables={mapping.includes('table') ? importTables(rows, tables) : null} createTables={createTables} onCreateTables={setCreateTables}
          onEdit={(i, e) => setEdits((x) => ({ ...x, [i]: { ...x[i], ...e } }))}
          onDecide={(i, d) => setDecisions((x) => ({ ...x, [i]: d }))}
          onSkipBlocked={() => setDecisions((x) => ({ ...x, ...Object.fromEntries(rows.filter((r) => r.state === 'blocked').map((r) => [r.index, 'skip' as const])) }))} />
      )}
      {step === 'done' && result && (
        <div className="stack gap-6 import-done">
          <JourneyArtwork kind="celebrate"/>
          <div className="stack gap-2">
            <h2 className="t-xl">{t('imDoneTitle', { guests: n(result.added, 'guest', true) })}</h2>
            <p className="muted">{result.added ? t('imDoneFits', { invitations: n(result.added, 'invitation'), people: n(result.people, 'person', true) }) : ''} {result.skipped ? t('imDoneSkipped', { rows: n(result.skipped, 'row', true) }) : t('imDoneNoSkip')}</p>
            {result.seated > 0 && <p className="muted">{t('imDoneSeated', { invitations: n(result.seated, 'invitation') })}{result.newTables ? t('imDoneNewTables', { tables: n(result.newTables, 'table') }) : ''}{t('imDoneSeatsLater')}</p>}
          </div>
          <div className="row wrap gap-2">
            <Button variant="primary" size="lg" icon="share" onClick={() => navigate(paths.guests(event.id, { filter: 'not_shared' }))}>{t('imShareNew')}</Button>
            <LinkButton to={paths.guests(event.id)}>{t('imShowList')}</LinkButton>
          </div>
        </div>
      )}
    </FocusLayout>
  );
}

function SourceStep({ onLoad }: { onLoad: (cells: string[][], label: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const { t } = useCopy();
  const [error, setError] = useState<unknown>(null);
  const [reading, setReading] = useState(false);
  const [paste, setPaste] = useState('');
  const [drag, setDrag] = useState(false);
  const read = async (f: File | undefined) => {
    if (!f) return;
    setError(null); setReading(true);
    try {
      const cells = await readSpreadsheet(f);
      if (cells.length === 0) throw new Error(t('imNoRows'));
      onLoad(cells, f.name);
    } catch (e) { setError(e); } finally { setReading(false); if (input.current) input.current.value = ''; }
  };
  const sampleHref = `data:text/csv;charset=utf-8,${encodeURIComponent('﻿' + SAMPLE_IMPORT_CSV)}`;
  return (
    <div className="stack gap-6">
      <header className="stack gap-2">
        <p className="eyebrow">{t('imEyebrow')}</p><h2 className="t-xl">{t('imReadyQ')}</h2>
        <p className="muted">{t('imFileHint')}</p>
      </header>
      <p className="import-assurance"><Icon name="check-circle" size="sm"/>{t('imAssurance')}</p>
      {error ? <Banner tone="danger" title={t('imReadFailed')}>{errorMessage(error)}</Banner> : null}
      <label className={`dropzone${drag ? ' is-drag' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); void read(e.dataTransfer.files[0]); }}>
        <input ref={input} type="file" accept=".xlsx,.csv,.tsv,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" onChange={(e) => void read(e.target.files?.[0])} />
        {reading ? <span className="spinner spinner-lg" aria-label={t('imReading')} /> : <JourneyArtwork kind="upload"/>}
        <span className="dropzone-title">{t('imDrop')}</span>
        <span className="faint t-sm">{t('imDropHint')}</span>
      </label>
      <details className="import-alternatives"><summary>{t('imNoFile')} <Icon name="chevron-down" size="sm"/></summary>
      <div className="grid-2">
        <div className="stack gap-2 sample-box">
          <p className="t-bold">{t('imSampleTitle')}</p>
          <p className="faint t-sm">{t('imSampleHint')}</p>
          <div className="row wrap gap-2">
            <Button variant="quiet" icon="file" onClick={() => onLoad(parseDelimited(SAMPLE_IMPORT_CSV), t('imSampleName'))}>{t('imUseSample')}</Button>
            <a className="btn btn-ghost btn-sm" href={sampleHref} download="doyofy-guests-sample.csv"><Icon name="download" size="sm" />{t('imDownload')}</a>
          </div>
        </div>
        <div className="stack gap-2">
          <Field label={t('imPasteLabel')} hint={t('imPasteHint')}>
            <Textarea rows={4} value={paste} onChange={(e) => setPaste(e.target.value)} dir="auto" />
          </Field>
          <Button disabled={!paste.trim()} onClick={() => onLoad(parseDelimited(paste), t('imPasteName'))}>{t('imPasteGo')}</Button>
        </div>
      </div>
      </details>
    </div>
  );
}

function MapStep({ table, mapping, onChange, source }: { table: RawTable; mapping: Mapping; onChange: (m: Mapping) => void; source: string }) {
  const { t, n, dialect } = useCopy();
  const problems = mappingProblems(mapping, dialect);
  const fields: ImportField[] = ['name', 'phone', 'size', 'side', 'table', 'companions', 'notes', 'ignore'];
  return (
    <div className="stack gap-6">
      <header className="stack gap-2">
        <h2 className="t-xl">{t('imMapTitle')}</h2>
        <p className="muted">{t('imMapSub', { source, rows: n(table.rows.length, 'row') })}</p>
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
            <Select aria-label={t('imColumn', { name: h })} value={mapping[i]} onChange={(e) => onChange(mapping.map((m, j) => (j === i ? (e.target.value as ImportField) : m === e.target.value && e.target.value !== 'ignore' ? 'ignore' : m)))}>
              {fields.map((f) => <option key={f} value={f}>{fieldLabel(f, dialect)}{f === 'name' ? t('imRequired') : ''}</option>)}
            </Select>
          </div>
        ))}
      </div>
      {!table.hadHeader && <p className="faint t-sm">{t('imNoHeader')}</p>}
    </div>
  );
}

type ReviewFilter = 'all' | 'blocked' | 'warning' | 'skipped';

function ReviewStep({ rows, sum, error, capacity, tables, createTables, onCreateTables, onEdit, onDecide, onSkipBlocked }: {
  rows: ImportRow[]; sum: ReturnType<typeof summarise>; error: unknown; capacity: { used: number; limit: number };
  tables: ReturnType<typeof importTables> | null; createTables: boolean; onCreateTables: (v: boolean) => void;
  onEdit: (i: number, e: RowEdit) => void; onDecide: (i: number, d: RowDecision) => void; onSkipBlocked: () => void;
}) {
  const { t, n } = useCopy();
  const [f, setF] = useState<ReviewFilter>(sum.blocked ? 'blocked' : 'all');
  const list = rows.filter((r) => f === 'all' || r.state === f);
  useCapacityVersion();
  const left = Math.max(0, capacity.limit - capacity.used);
  return (
    <div className="stack gap-5">
      <header className="stack gap-2">
        <h2 className="t-xl">{t('imReviewTitle')}</h2>
        <p className="muted">{t('imReviewSub')}</p>
      </header>
      {/* closing the capacity upgrade is a choice, not a failure: calm, and nothing is lost */}
      {error instanceof GuestLimitError ? <Banner tone="info" compact title={t('imLimitTitle')} reveal={error}>
        {t('imLimitBody', { required: n(error.required, 'person'), limit: n(error.limit, 'person') })}
      </Banner> : error ? <Banner tone="danger" title={t('imFailedTitle')} reveal={error}>{errorMessage(error)} {t('imNoneAdded')}</Banner> : null}
      {/* before the wall, not after — and with the same numbers the upgrade will show (the whole list after adding) */}
      {!error && sum.people > left && <Banner tone="warning" compact title={t('imOverTitle')}>
        {t('imOverBody', { total: n(capacity.used + sum.people, 'person'), limit: n(capacity.limit, 'person') })}
      </Banner>}
      {tables && tables.withTable > 0 && <div className="import-tables" role="group" aria-label={t('imTableCol')}>
        <p><Icon name="table" size="sm" />{tables.matched ? t('imTablesMatched', { invitations: n(tables.matched, 'invitation') }) : t('imTablesNone')}
          {tables.missingRows ? t('imTablesMissing', { invitations: n(tables.missingRows, 'invitation'), names: `${tables.missing.slice(0, 4).join('، ')}${tables.missing.length > 4 ? '…' : ''}` }) : ''}</p>
        {tables.missing.length > 0 && <Checkbox checked={createTables} onChange={onCreateTables} label={t('imCreateTables', { n: tables.missing.length })} hint={createTables ? t('imCreateOn') : t('imCreateOff')} />}
      </div>}
      <div className="import-summary">
        <div className="is-ok"><strong className="num">{sum.toImport}</strong><span>{t('imWillAdd')}</span></div>
        <div className="is-blocked"><strong className="num">{sum.blocked}</strong><span>{t('imNeedYou')}</span></div>
        <div className="is-warn"><strong className="num">{sum.warnings}</strong><span>{t('imWithNotes')}</span></div>
        <div className="is-skip"><strong className="num">{sum.skipped}</strong><span>{t('imSkipped')}</span></div>
      </div>
      <div className="row wrap between gap-3 import-review-filters">
        <FilterChips label={t('imRowsFilter')} value={f} onChange={setF} options={[
          { id: 'blocked', label: t('imNeedYou'), count: sum.blocked }, { id: 'warning', label: t('imWithNotes'), count: sum.warnings },
          { id: 'skipped', label: t('imSkipped'), count: sum.skipped }, { id: 'all', label: t('imAll'), count: sum.total }]} />
        {sum.blocked > 0 && <Button size="sm" variant="ghost" onClick={onSkipBlocked}>{t('imSkipAllBlocked')}</Button>}
      </div>
      {list.length === 0 ? <p className="faint t-sm empty-compact">{f === 'blocked' ? t('imNoBlocked') : t('imNoRowsHere')}</p> : (
        <ol className="import-rows">
          {list.map((r) => <ImportRowItem key={r.index} r={r} onEdit={onEdit} onDecide={onDecide} />)}
        </ol>
      )}
    </div>
  );
}

const STATE_BADGE = { ok: ['imStOk', 'success'], warning: ['imStWarn', 'info'], blocked: ['imStBlocked', 'warning'], skipped: ['imStSkipped', 'neutral'] } as const;

function ImportRowItem({ r, onEdit, onDecide }: { r: ImportRow; onEdit: (i: number, e: RowEdit) => void; onDecide: (i: number, d: RowDecision) => void }) {
  const { t, n } = useCopy();
  const has = (code: string) => r.issues.some((x) => x.code === code);
  const dupBlocking = r.issues.some((x) => (x.code === 'duplicate_in_file' || x.code === 'duplicate_existing') && x.blocking);
  return (
    <li className={`import-row is-${r.state}`}>
      <div className="import-row-head">
        <span className="faint t-xs num">{t('imRow', { n: r.index })}</span>
        <span className="t-bold grow">{r.name || <span className="text-warning">{t('imNoName')}</span>}</span>
        <span className="num t-sm" dir="ltr">{r.phone ? formatPhone(r.phone) : r.phoneRaw || '—'}</span>
        <span className="t-sm faint">{n(r.size, 'person')}</span>
        <Badge tone={STATE_BADGE[r.state][1]}>{t(STATE_BADGE[r.state][0])}</Badge>
      </div>
      {r.issues.length > 0 && (
        <ul className="import-issues">
          {r.issues.map((x) => <li key={x.code} className={x.blocking && r.state === 'blocked' ? 'is-blocking' : ''}><Icon name={x.blocking && r.state === 'blocked' ? 'alert' : 'info'} size="sm" />{x.text}</li>)}
        </ul>
      )}
      {r.state !== 'skipped' && (has('missing_name') || has('malformed_phone')) && (
        <div className="import-fix">
          {has('missing_name') && <Field label={t('imWriteName')}><Input defaultValue={r.name} onBlur={(e) => onEdit(r.index, { name: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') onEdit(r.index, { name: e.currentTarget.value }); }} /></Field>}
          {has('malformed_phone') && <Field label={t('imFixPhone')}><Input ltr type="tel" defaultValue={r.phoneRaw} onBlur={(e) => onEdit(r.index, { phone: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') onEdit(r.index, { phone: e.currentTarget.value }); }} /></Field>}
        </div>
      )}
      <div className="row wrap gap-2">
        {r.state === 'skipped' ? (
          <Button size="sm" variant="ghost" icon="undo" onClick={() => onDecide(r.index, 'import')}>{dupBlocking ? t('imAddAnyway') : t('imUnskip')}</Button>
        ) : (
          <>
            {dupBlocking && r.state === 'blocked' && <Button size="sm" variant="primary" icon="close" onClick={() => onDecide(r.index, 'skip')}>{t('imSkipDup')}</Button>}
            {dupBlocking && r.state === 'blocked' && <Button size="sm" onClick={() => onDecide(r.index, 'import')}>{t('imAddAnyway')}</Button>}
            {has('malformed_phone') && <Button size="sm" onClick={() => onDecide(r.index, 'import_without_phone')}>{t('imNoPhone')}</Button>}
            {r.decision === 'import_without_phone' && <Button size="sm" variant="ghost" onClick={() => onDecide(r.index, 'import')}>{t('imRestorePhone')}</Button>}
            {!(dupBlocking && r.state === 'blocked') && <Button size="sm" variant="ghost" icon="close" onClick={() => onDecide(r.index, 'skip')}>{t('imSkipRow')}</Button>}
          </>
        )}
      </div>
    </li>
  );
}
