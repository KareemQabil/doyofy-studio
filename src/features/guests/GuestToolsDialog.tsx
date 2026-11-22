import { useState } from 'react';
import type { Event, InvitationParty, Table } from '../../domain/types';
import { guestsCsv, scopedGuests, type GuestExportScope } from '../../domain/guest-tools';
import { Banner, Button, Checkbox, ConfirmDialog, Dialog, Field, Select } from '../../ui';
import { useMutation } from '../../app/data';
import { useEvents } from '../shared/queries';
import { useToast } from '../../ui/primitives/Feedback';
import { errorMessage } from '../../services/errors';
import { useCopy } from '../../ui/copy';

/**
 * Export (organizer review): one «طاولات وأقسام» scope lets tables AND sections go in one file (a guest is in when their
 * table or section is ticked); rows come sorted by table then name with a totals line; a toast confirms the download.
 */
export function ExportGuestsDialog({ event, parties, tables, visibleIds, selectedIds, initialTable, onClose }: {
  event: Event; parties: InvitationParty[]; tables: Table[]; visibleIds: Set<string>; selectedIds: Set<string>; initialTable?: string; onClose: () => void;
}) {
  const { t, n } = useCopy();
  const toast = useToast();
  const [scope, setScope] = useState<GuestExportScope>(initialTable ? 'pick' : selectedIds.size ? 'selected' : 'visible');
  // nothing is preselected unless the dialog was opened from that table's menu
  const [tableIds, setTableIds] = useState(new Set<string>(initialTable ? [initialTable] : []));
  const groups = [...new Set(parties.map((p) => p.side || ''))];
  const [groupNames, setGroupNames] = useState(new Set<string>());
  const [phones, setPhones] = useState(false);
  const chosen = scopedGuests(parties, scope, { visibleIds, selectedIds, tableIds, groupNames });
  const toggleValue = (set: Set<string>, value: string) => { const next = new Set(set); if (next.has(value)) next.delete(value); else next.add(value); return next; };
  const download = () => {
    const url = URL.createObjectURL(new Blob([guestsCsv(chosen, tables, phones)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `guests-${event.slug}-${scope}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); onClose();
    toast({ tone: 'success', text: t('exDownloaded', { n: n(chosen.length, 'invitation', true), phones: phones ? t('exWithPhones') : '' }) });
  };
  return <Dialog open onClose={onClose} title={t('exportFile')} description={t('exHint')}
    footer={<><Button variant="primary" icon="download" disabled={!chosen.length} onClick={download}>{chosen.length ? t('exExportN', { n: n(chosen.length, 'invitation', true) }) : t('exExport')}</Button><Button variant="ghost" onClick={onClose}>{t('cancel')}</Button></>}>
    <Field label={t('exScope')}><Select value={scope} onChange={(e) => setScope(e.target.value as GuestExportScope)}>
      <option value="visible">{t('exVisible', { n: visibleIds.size })}</option><option value="selected" disabled={!selectedIds.size}>{t('exSelected', { n: selectedIds.size })}</option>
      <option value="pick">{t('exPick')}</option><option value="all">{t('exAll', { n: parties.length })}</option>
    </Select></Field>
    {scope === 'pick' && <p className="faint t-sm">{t('exPickHint')}</p>}
    {scope === 'pick' && tables.length > 0 && <fieldset className="guest-export-scope"><legend>{t('exTables', { n: tableIds.size })}</legend><div className="stack gap-2">{[...tables.map((table) => ({ id: table.id, name: table.name })), { id: 'none', name: t('exNoTable') }].map((table) => <Checkbox key={table.id} label={table.name} checked={tableIds.has(table.id)} onChange={() => setTableIds(toggleValue(tableIds, table.id))} />)}</div></fieldset>}
    {scope === 'pick' && <fieldset className="guest-export-scope"><legend>{t('exSections', { n: groupNames.size })}</legend><div className="stack gap-2">{groups.map((g) => <Checkbox key={g} label={g || t('exNoSection')} checked={groupNames.has(g)} onChange={() => setGroupNames(toggleValue(groupNames, g))} />)}</div></fieldset>}
    <Checkbox checked={phones} onChange={setPhones} label={t('exPhones')} hint={t('exPhonesHint')} />
    <p role="status" className="muted t-sm">{chosen.length ? t('exReady', { n: n(chosen.length, 'invitation', true) })
      : t(scope === 'pick' && !tableIds.size && !groupNames.size ? 'exPickOne' : 'exNone')}</p>
  </Dialog>;
}

export function TransferGuestsDialog({ event, parties, onClose, onDone }: {
  event: Event; parties: InvitationParty[]; onClose: () => void; onDone: () => void;
}) {
  const { t, n } = useCopy();
  const events = useEvents();
  const toast = useToast();
  const [target, setTarget] = useState('');
  const [mode, setMode] = useState<'copy' | 'move'>('copy');
  const [confirm, setConfirm] = useState(false);
  const destination = events.data?.find((e) => e.id === target);
  const transfer = useMutation((s) => s.parties.transfer({ ids: parties.map((p) => p.id), targetEventId: target, mode }), {
    onSuccess: (made) => { toast({ tone: 'success', text: t(mode === 'move' ? 'trMoved' : 'trCopied', { n: n(made.length, 'invitation'), to: destination?.title || t('trTheEvent') }) }); onDone(); onClose(); },
    onError: () => setConfirm(false),
  });
  const eligible = (events.data || []).filter((e) => e.id !== event.id && !e.archivedAt);
  return <>
    <Dialog open={!confirm} onClose={onClose} title={t('moveGuests')} description={t('trFrom', { n: n(parties.length, 'invitation'), title: event.title })}
      footer={<><Button variant="primary" disabled={!target || !parties.length} loading={transfer.pending} onClick={() => mode === 'move' ? setConfirm(true) : void transfer.run()}>{t(mode === 'move' ? 'trContinue' : 'trCopy')}</Button><Button variant="ghost" onClick={onClose}>{t('cancel')}</Button></>}>
      {!!transfer.error && <Banner tone="danger">{errorMessage(transfer.error)}</Banner>}
      {!!events.error && <Banner tone="danger">{errorMessage(events.error)}</Banner>}
      <Field label={t('trTarget')}><Select value={target} onChange={(e) => { setTarget(e.target.value); transfer.reset(); }}><option value="">{t(events.loading ? 'trLoading' : 'trPickEvent')}</option>{eligible.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}</Select></Field>
      {!events.loading && !eligible.length && <p className="muted t-sm">{t('trNoEvents')}</p>}
      <Field label={t('trHow')}><Select value={mode} onChange={(e) => setMode(e.target.value as 'copy' | 'move')}><option value="copy">{t('trCopyKeep')}</option><option value="move">{t('trMoveRemove')}</option></Select></Field>
      <p className="muted t-sm">{t('trNewLinks')}</p>
      <p className="faint t-sm">{t('trChecks')}</p>
    </Dialog>
    <ConfirmDialog open={confirm} title={t('trConfirmTitle', { n: n(parties.length, 'invitation', true) })} confirmLabel={t('trConfirm')} loading={transfer.pending}
      body={t('trConfirmBody', { from: event.title, to: destination?.title || t('trChosenEvent') })}
      onCancel={() => setConfirm(false)} onConfirm={() => void transfer.run()} />
  </>;
}
