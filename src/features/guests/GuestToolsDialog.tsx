import { useState } from 'react';
import type { Event, InvitationParty, Table } from '../../domain/types';
import { guestsCsv, scopedGuests, type GuestExportScope } from '../../domain/guest-tools';
import { Banner, Button, Checkbox, ConfirmDialog, Dialog, Field, Select } from '../../ui';
import { useMutation } from '../../app/data';
import { useEvents } from '../shared/queries';
import { useToast } from '../../ui/primitives/Feedback';
import { errorMessage } from '../../services/errors';
import { useCopy } from '../../ui/copy';
import { plural, pluralOf, P } from '../../domain/format';

/**
 * Export (organizer review): one «طاولات وأقسام» scope lets tables AND sections go in one file (a guest is in when their
 * table or section is ticked); rows come sorted by table then name with a totals line; a toast confirms the download.
 */
export function ExportGuestsDialog({ event, parties, tables, visibleIds, selectedIds, initialTable, onClose }: {
  event: Event; parties: InvitationParty[]; tables: Table[]; visibleIds: Set<string>; selectedIds: Set<string>; initialTable?: string; onClose: () => void;
}) {
  const { t } = useCopy();
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
    toast({ tone: 'success', text: `نزّلنا ملف ${pluralOf(chosen.length, P.invitation)}${phones ? ' مع أرقام الجوال' : ''}. افتحه في Excel أو Google Sheets.` });
  };
  return <Dialog open onClose={onClose} title={t('exportFile')} description="اختر ما تحتاجه في ملف يفتح في Excel وGoogle Sheets."
    footer={<><Button variant="primary" icon="download" disabled={!chosen.length} onClick={download}>{chosen.length ? `تصدير ${pluralOf(chosen.length, P.invitation)}` : 'تصدير'}</Button><Button variant="ghost" onClick={onClose}>{t('cancel')}</Button></>}>
    <Field label="نطاق التصدير"><Select value={scope} onChange={(e) => setScope(e.target.value as GuestExportScope)}>
      <option value="visible">القائمة الظاهرة ({visibleIds.size})</option><option value="selected" disabled={!selectedIds.size}>المحدد ({selectedIds.size})</option>
      <option value="pick">طاولات وأقسام محددة</option><option value="all">كل الضيوف ({parties.length})</option>
    </Select></Field>
    {scope === 'pick' && <p className="faint t-sm">اختر ما تريد من الطاولات والأقسام معًا؛ يدخل الضيف إذا كانت طاولته أو قسمه مختارًا.</p>}
    {scope === 'pick' && tables.length > 0 && <fieldset className="guest-export-scope"><legend>الطاولات ({tableIds.size})</legend><div className="stack gap-2">{[...tables.map((table) => ({ id: table.id, name: table.name })), { id: 'none', name: 'بلا طاولة' }].map((table) => <Checkbox key={table.id} label={table.name} checked={tableIds.has(table.id)} onChange={() => setTableIds(toggleValue(tableIds, table.id))} />)}</div></fieldset>}
    {scope === 'pick' && <fieldset className="guest-export-scope"><legend>الأقسام ({groupNames.size})</legend><div className="stack gap-2">{groups.map((g) => <Checkbox key={g} label={g || 'بلا قسم'} checked={groupNames.has(g)} onChange={() => setGroupNames(toggleValue(groupNames, g))} />)}</div></fieldset>}
    <Checkbox checked={phones} onChange={setPhones} label="تضمين أرقام الجوال" hint="الملف بدون أرقام افتراضيًا. لا يتضمن ملاحظاتك الخاصة أو بيانات الطعام." />
    <p role="status" className="muted t-sm">{chosen.length ? `جاهز لتصدير ${pluralOf(chosen.length, P.invitation)}، مع العدد المسموح وأسماء المرافقين.`
      : scope === 'pick' && !tableIds.size && !groupNames.size ? 'اختر طاولة أو قسمًا واحدًا على الأقل.' : 'لا توجد دعوات في هذا النطاق.'}</p>
  </Dialog>;
}

export function TransferGuestsDialog({ event, parties, onClose, onDone }: {
  event: Event; parties: InvitationParty[]; onClose: () => void; onDone: () => void;
}) {
  const { t } = useCopy();
  const events = useEvents();
  const toast = useToast();
  const [target, setTarget] = useState('');
  const [mode, setMode] = useState<'copy' | 'move'>('copy');
  const [confirm, setConfirm] = useState(false);
  const destination = events.data?.find((e) => e.id === target);
  const transfer = useMutation((s) => s.parties.transfer({ ids: parties.map((p) => p.id), targetEventId: target, mode }), {
    onSuccess: (made) => { toast({ tone: 'success', text: `${mode === 'move' ? 'نُقلت' : 'نُسخت'} ${plural(made.length, P.invitation)} إلى ${destination?.title || 'المناسبة'}` }); onDone(); onClose(); },
    onError: () => setConfirm(false),
  });
  const eligible = (events.data || []).filter((e) => e.id !== event.id && !e.archivedAt);
  return <>
    <Dialog open={!confirm} onClose={onClose} title={t('moveGuests')} description={`${plural(parties.length, P.invitation)} من ${event.title}`}
      footer={<><Button variant="primary" disabled={!target || !parties.length} loading={transfer.pending} onClick={() => mode === 'move' ? setConfirm(true) : void transfer.run()}>{mode === 'move' ? 'متابعة النقل' : 'نسخ الدعوات'}</Button><Button variant="ghost" onClick={onClose}>{t('cancel')}</Button></>}>
      {!!transfer.error && <Banner tone="danger">{errorMessage(transfer.error)}</Banner>}
      {!!events.error && <Banner tone="danger">{errorMessage(events.error)}</Banner>}
      <Field label="المناسبة الجديدة"><Select value={target} onChange={(e) => { setTarget(e.target.value); transfer.reset(); }}><option value="">{events.loading ? 'تحميل المناسبات…' : 'اختر مناسبة'}</option>{eligible.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}</Select></Field>
      {!events.loading && !eligible.length && <p className="muted t-sm">أنشئ مناسبة أخرى أولًا لتنسخ الضيوف أو تنقلهم إليها.</p>}
      <Field label="طريقة الإضافة"><Select value={mode} onChange={(e) => setMode(e.target.value as 'copy' | 'move')}><option value="copy">نسخ مع الاحتفاظ بهم هنا</option><option value="move">نقل وإزالتهم من هذه المناسبة</option></Select></Field>
      <p className="muted t-sm">تُنشأ روابط جديدة بانتظار الرد. الردود والطاولات والوصول وبيانات الطعام تبقى خاصة بكل مناسبة.</p>
      <p className="faint t-sm">نراجع التكرار وسعة الباقة قبل الإضافة. إذا وُجد تعارض، لا تُنقل أي دعوة.</p>
    </Dialog>
    <ConfirmDialog open={confirm} title={`نقل ${pluralOf(parties.length, P.invitation)}؟`} confirmLabel="نقل الدعوات" loading={transfer.pending}
      body={`ستُزال الدعوات المحددة وروابطها وردودها من ${event.title}، وتُنشأ دعوات جديدة في ${destination?.title || 'المناسبة المختارة'}.`}
      onCancel={() => setConfirm(false)} onConfirm={() => void transfer.run()} />
  </>;
}
