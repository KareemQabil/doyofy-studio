/**
 * Guest list (spec §11): header counts (invitations ≠ people), search, filters, bulk sharing,
 * quick add, import. Desktop: table. Phone: compact stacked rows. Details open in a drawer (?party=).
 */
import { useMemo, useState } from 'react';
import type { Event, InvitationParty } from '../../domain/types';
import { CHECKIN_STATUS, INVITATION_STATUS, PARTY_FILTERS, RSVP_STATUS, countParties, duplicatePhoneIds, invitationStatus, matchesFilter, partyNeedsAttention, searchParties, type PartyFilter } from '../../domain/parties';
import { publishState } from '../../domain/invitation';
import { formatPhone, people, peopleOf, plural, pluralOf, P } from '../../domain/format';
import { Avatar, Badge, Banner, Button, EmptyState, ErrorState, FilterChips, Icon, LinkButton, PageHeader, SearchInput, Skeleton, Status } from '../../ui';
import { useMutation } from '../../app/data';
import { useLocation, useNavigate } from '../../app/router';
import { paths } from '../../app/paths';
import { useToast } from '../../ui/primitives/Feedback';
import { useDesign, useParties, useTables } from '../shared/queries';
import { GuestViews } from '../shared/GuestViews';
import { errorMessage } from '../../services/errors';
import { PartyDrawer } from './PartyDrawer';
import { PartyFormDialog } from './PartyForm';

export function GuestsPage({ event }: { event: Event }) {
  const parties = useParties(event.id);
  const design = useDesign(event.id);
  const tables = useTables(event.id);
  const loc = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const filter = (loc.search.get('filter') as PartyFilter | null) ?? 'all';
  const openId = loc.search.get('party');
  const [q, setQ] = useState(loc.search.get('q') ?? '');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [moreFilters, setMoreFilters] = useState(false);

  const setParam = (k: string, v: string | null) => {
    const sp = new URLSearchParams(loc.search);
    if (q) sp.set('q', q); else sp.delete('q');
    if (v) sp.set(k, v); else sp.delete(k);
    const s = sp.toString();
    // opening a guest is a step the phone Back button should undo; filters and closing just replace
    navigate(`${paths.guests(event.id)}${s ? `?${s}` : ''}`, { replace: !(k === 'party' && v) });
  };

  const add = useMutation((s, input: Parameters<typeof s.parties.create>[1]) => s.parties.create(event.id, input), {
    onSuccess: (p) => { setAdding(false); toast({ tone: 'success', text: `تمت إضافة ${p.primaryGuestName}`, action: { label: 'افتح', run: () => setParam('party', p.id) } }); },
  });
  const bulkSend = useMutation((s, ids: string[]) => s.parties.simulateSend(ids), {
    onSuccess: (r) => { setSelected(new Set()); toast({ tone: r.failed.length ? 'warning' : 'success', text: `أُرسلت ${plural(r.sent.length, P.invitation)} (محاكاة)${r.failed.length ? ` · تعذر إرسال ${r.failed.length} بلا رقم` : ''}` }); },
  });
  const bulkManual = useMutation((s, ids: string[]) => s.parties.markShared(ids, 'manual'), { onSuccess: () => { setSelected(new Set()); toast({ tone: 'success', text: 'تم التحديد كمُرسلة يدويًا' }); } });
  const bulkRemind = useMutation((s, ids: string[]) => s.parties.sendReminder(ids), { onSuccess: (n) => { setSelected(new Set()); toast({ tone: 'success', text: `تم إرسال تذكير إلى ${pluralOf(n, P.invitation)} (محاكاة)` }); } });

  const all = parties.data ?? [];
  const ps = publishState(design.data);
  const published = ps === 'published' || ps === 'changed';
  const dup = useMemo(() => duplicatePhoneIds(all), [all]);
  const c = useMemo(() => countParties(all), [all]);
  const counts = useMemo(() => Object.fromEntries(PARTY_FILTERS.map((f) => [f.id, all.filter((p) => matchesFilter(p, f.id, dup)).length])), [all, dup]);
  const visible = useMemo(() => searchParties(all.filter((p) => matchesFilter(p, filter, dup)), q).sort((a, b) => a.primaryGuestName.localeCompare(b.primaryGuestName, 'ar')), [all, filter, q, dup]);
  const open = all.find((p) => p.id === openId) ?? null;
  const tableName = (id?: string) => tables.data?.find((t) => t.id === id)?.name;
  const sel = [...selected].filter((id) => all.some((p) => p.id === id));
  const allVisibleSelected = visible.length > 0 && visible.every((p) => selected.has(p.id));
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  if (parties.error) return <ErrorState error={parties.error} onRetry={parties.refetch} />;

  return (
    <>
      <PageHeader title="الضيوف"
        subtitle={c.parties ? `${plural(c.parties, P.invitation)} تتسع لـ${peopleOf(c.maxSeats)}` : 'أضف من ستدعوهم: شخصًا شخصًا أو من ملف'}
        actions={<>
          <Button variant="primary" icon="plus" onClick={() => setAdding(true)}>أضف ضيفًا</Button>
          <LinkButton to={paths.importGuests(event.id)} icon="upload">استيراد من ملف</LinkButton>
        </>} />

      <GuestViews eventId={event.id} active="list" />
      {parties.loading ? <Skeleton lines={8} /> : all.length === 0 ? (
        <EmptyState icon="users" title="لا ضيوف بعد" action={<><Button variant="primary" icon="plus" onClick={() => setAdding(true)}>أضف ضيفًا</Button><LinkButton to={paths.importGuests(event.id)} icon="upload">استيراد من ملف</LinkButton></>}>
          كل دعوة يمكن أن تشمل شخصًا أو عائلة. تحدد العدد المسموح، والضيف يرد بالعدد الفعلي.
        </EmptyState>
      ) : (
        <div className="stack gap-4">
          <dl className="guest-facts"><div><dt>أكدوا الحضور</dt><dd><strong className="num">{c.confirmedPeople}</strong> شخص</dd></div><div><dt>بانتظار الرد</dt><dd><strong className="num">{c.pendingParties}</strong> دعوة</dd></div><div><dt>العدد المتاح</dt><dd><strong className="num">{c.maxSeats}</strong> مقعد</dd></div></dl>
          {!published && <Banner tone="warning" title="الدعوة غير منشورة" action={<LinkButton to={paths.invitation(event.id)} size="sm">إلى الدعوة</LinkButton>}>يمكنك ترتيب القائمة الآن، لكن الروابط لا تعمل حتى تنشر الدعوة.</Banner>}

          <div className="guest-toolbar">
            <SearchInput value={q} onChange={setQ} placeholder="ابحث بالاسم أو الجوال أو الرمز" />
            <FilterChips label="تصفية الضيوف" value={filter} onChange={(f) => { setSelected(new Set()); setParam('filter', f === 'all' ? null : f); }}
              options={PARTY_FILTERS.filter(f => moreFilters || ['all','confirmed','pending',filter].includes(f.id)).map((f) => ({ id: f.id, label: f.label, count: counts[f.id] }))} />
            <Button variant="ghost" size="sm" icon="sliders" aria-expanded={moreFilters} onClick={()=>setMoreFilters(v=>!v)}>{moreFilters ? 'فلاتر أقل' : 'فلاتر إضافية'}</Button>
          </div>

          {sel.length > 0 && (
            <div className="bulk-bar" role="region" aria-label="إجراءات على المحدد">
              <span className="t-bold">{plural(sel.length, P.invitation)} محددة</span>
              <div className="row wrap gap-2">
                <Button size="sm" variant="primary" icon="send" disabled={!published} loading={bulkSend.pending} onClick={() => void bulkSend.run(sel)}>إرسال (محاكاة)</Button>
                <Button size="sm" icon="check" disabled={!published} loading={bulkManual.pending} onClick={() => void bulkManual.run(sel)}>تم التواصل يدويًا</Button>
                <Button size="sm" icon="bell" loading={bulkRemind.pending} onClick={() => void bulkRemind.run(sel)}>تذكير (محاكاة)</Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>إلغاء التحديد</Button>
              </div>
            </div>
          )}

          {(bulkSend.error || bulkManual.error || bulkRemind.error) ? <Banner tone="danger" title="لم يكتمل الإجراء">{errorMessage(bulkSend.error || bulkManual.error || bulkRemind.error)}</Banner> : null}
          {visible.length === 0 ? (
            <EmptyState compact icon="search" title="لا نتائج" action={<Button onClick={() => { setQ(''); setParam('filter', null); }}>اعرض كل الضيوف</Button>}>
              {q ? `لا يوجد ضيف يطابق «${q}»` : 'لا يوجد ضيوف في هذا التصنيف.'}
            </EmptyState>
          ) : (
            <div className="guest-table" role="table" aria-label="قائمة الضيوف" aria-rowcount={visible.length + 1}>
              <div className="gt-row gt-head" role="row">
                <span role="columnheader" className="gt-check">
                  <label className="gt-check-hit"><input type="checkbox" aria-label="تحديد الكل" checked={allVisibleSelected} onChange={() => setSelected(allVisibleSelected ? new Set() : new Set(visible.map((p) => p.id)))} /></label>
                </span>
                <span role="columnheader">الضيف</span>
                <span role="columnheader" className="gt-phone">الجوال</span>
                <span role="columnheader" className="gt-num">المسموح</span>
                <span role="columnheader">الدعوة</span>
                <span role="columnheader">الرد</span>
                <span role="columnheader" className="gt-table">الطاولة</span>
                <span role="columnheader" className="gt-in">الوصول</span>
              </div>
              {visible.map((p) => <PartyRow key={p.id} p={p} published={ps} table={tableName(p.tableId)} attention={partyNeedsAttention(p, dup)} checked={selected.has(p.id)} onToggle={() => toggle(p.id)} onOpen={() => setParam('party', p.id)} />)}
            </div>
          )}
          <p className="faint t-sm">{visible.length !== all.length ? `يعرض ${visible.length} من ${all.length}` : `${all.length} دعوة`}</p>
        </div>
      )}

      {adding && (
        <PartyFormDialog open key="new" title="إضافة ضيف" existing={all} defaultSize={event.settings.defaultPartySize}
          onClose={() => { setAdding(false); add.reset(); }} pending={add.pending} error={add.error} onSubmit={(input) => void add.run(input)} />
      )}
      {open && tables.data && <PartyDrawer key={open.id} event={event} party={open} all={all} tables={tables.data} publish={ps} onClose={() => setParam('party', null)} />}
      {openId && !open && !parties.loading && <Banner tone="info">هذا الضيف لم يعد في القائمة.</Banner>}
    </>
  );
}

function PartyRow({ p, published, table, attention, checked, onToggle, onOpen }: {
  p: InvitationParty; published: ReturnType<typeof publishState>; table?: string; attention: string[]; checked: boolean; onToggle: () => void; onOpen: () => void;
}) {
  const inv = invitationStatus(p, published);
  return (
    <div className={`gt-row${checked ? ' is-selected' : ''}`} role="row">
      <span role="cell" className="gt-check"><label className="gt-check-hit"><input type="checkbox" checked={checked} onChange={onToggle} aria-label={`تحديد ${p.primaryGuestName}`} /></label></span>
      <span role="cell" className="gt-name">
        <Avatar name={p.primaryGuestName} tone={p.rsvpStatus === 'confirmed' ? 'success' : p.rsvpStatus === 'declined' ? 'neutral' : 'warning'} />
        <span className="grow">
          <button type="button" className="gt-open" onClick={onOpen}>{p.primaryGuestName}</button>
          <span className="gt-sub">{[p.side, `حتى ${p.maxPartySize} أشخاص`, p.companionNames?.length ? `+${p.companionNames.length} مرافقين` : null].filter(Boolean).join(' · ')}{attention.length > 0 && <span className="gt-flag"><Icon name="alert" size="sm" />{attention[0]}</span>}</span>
        </span>
      </span>
      <span role="cell" className="gt-phone num" dir="ltr">{p.phone ? formatPhone(p.phone) : <span className="faint">—</span>}</span>
      <span role="cell" className="gt-num num"><span className="gt-mlabel">المسموح </span>{p.maxPartySize}</span>
      <span role="cell" className="gt-inv"><Status label="الدعوة" tone={INVITATION_STATUS[inv].tone}>{INVITATION_STATUS[inv].label}</Status></span>
      <span role="cell" className="gt-rsvp"><Status label="الرد" tone={p.rsvpStatus === 'declined' ? 'neutral' : RSVP_STATUS[p.rsvpStatus].tone}>{RSVP_STATUS[p.rsvpStatus].label}{p.rsvpStatus === 'confirmed' ? ` · ${p.confirmedPartySize}` : ''}</Status></span>
      <span role="cell" className="gt-table">{table ?? (p.rsvpStatus === 'confirmed' ? <span className="text-warning t-sm">بلا طاولة</span> : <span className="faint">—</span>)}</span>
      <span role="cell" className="gt-in">{p.checkedInCount ? <Badge tone={CHECKIN_STATUS[p.checkInStatus].tone}>{CHECKIN_STATUS[p.checkInStatus].label} {p.checkedInCount}</Badge> : <span className="faint">—</span>}</span>
    </div>
  );
}
