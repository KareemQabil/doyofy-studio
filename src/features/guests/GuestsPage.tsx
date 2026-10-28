/**
 * Guest list (spec §11, feedback F021–F045).
 *   · the counters ARE the filters: tapping «أكدوا» opens exactly that list (F037)
 *   · the name is the anchor; WhatsApp sits right under it (F032, F039, F045)
 *   · phones: real cards, not a shrunken table (F040, F041) — swipe a card left for WhatsApp,
 *     right for select/details; press and hold to start selecting. Every gesture has a visible button.
 *   · «حسب الطاولة» groups invitations under their table with alternating bands (F034, F035)
 *   · selected invitations can be shared one after another, honestly: opening WhatsApp is not delivery (F044)
 *   · «الطعام» is a third lens on the same list: meal totals, needs and food per table (F053, F054)
 * Details open in a drawer (?party=). Filter, search and grouping live in the URL.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Event, InvitationParty, PublishState, Table } from '../../domain/types';
import { CHECKIN_STATUS, PARTY_FILTERS, RSVP_STATUS, countParties, duplicatePhoneIds, invitationStatus, matchesFilter, partyNeedsAttention, searchParties, type PartyFilter } from '../../domain/parties';
import { publishState } from '../../domain/invitation';
import { formatPhone, plural, pluralOf, P } from '../../domain/format';
import { Avatar, Banner, Button, EmptyState, ErrorState, Icon, LinkButton, Menu, PageHeader, SearchInput, PageLoader } from '../../ui';
import { useMutation, useNow } from '../../app/data';
import { Link, useLocation, useNavigate, useRouter } from '../../app/router';
import { paths } from '../../app/paths';
import { useToast } from '../../ui/primitives/Feedback';
import { useDesign, useParties, useResponses, useTables } from '../shared/queries';
import { useGuestLink } from '../shared/share-link';
import { asksAfterAttending, experienceOf } from '../../domain/guest-experience';
import { FoodLine, FoodReport } from './FoodReport';
import { GuestViews } from '../shared/GuestViews';
import { errorMessage } from '../../services/errors';
import { PartyDrawer } from './PartyDrawer';
import { PartyFormDialog } from './PartyForm';
import { ShareQueue } from './ShareQueue';
import { inviteMessage, whatsappUrl } from './share';
import { mergeHandlers, useLongPress, useSwipeReveal } from '../../ui/hooks/useTouchGestures';
import { haptic } from '../../ui/motion/motion';

const SWIPE_HINT = 'doyofy:guest-swipe-hint';

export function GuestsPage({ event }: { event: Event }) {
  const parties = useParties(event.id);
  const design = useDesign(event.id);
  const tables = useTables(event.id);
  const loc = useLocation();
  const navigate = useNavigate();
  const { absolute } = useRouter();
  const toast = useToast();
  const filter = (loc.search.get('filter') as PartyFilter | null) ?? 'all';
  const view = loc.search.get('view');
  const grouped = view === 'tables';
  const responses = useResponses(event.id);
  const now = useNow();
  const xp = experienceOf(event);
  const foodOn = asksAfterAttending(xp) || xp.meals.options.length > 0;
  const food = view === 'food' && foodOn;
  const openId = loc.search.get('party');
  const [q, setQ] = useState(loc.search.get('q') ?? '');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [adding, setAdding] = useState(false);
  const [moreFilters, setMoreFilters] = useState(false);
  const [sharePrompt, setSharePrompt] = useState<string | null>(null);
  const [queue, setQueue] = useState<string[] | null>(null);

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
  const clearSelection = () => { setSelected(new Set()); setSelectMode(false); };
  const bulkSend = useMutation((s, ids: string[]) => s.parties.simulateSend(ids), {
    onSuccess: (r) => { clearSelection(); toast({ tone: r.failed.length ? 'warning' : 'success', text: `أُرسلت ${plural(r.sent.length, P.invitation)} (محاكاة)${r.failed.length ? ` · تعذر إرسال ${r.failed.length} بلا رقم` : ''}` }); },
  });
  const bulkManual = useMutation((s, ids: string[]) => s.parties.markShared(ids, 'manual'), { onSuccess: () => { clearSelection(); toast({ tone: 'success', text: 'تم التحديد كمُرسلة يدويًا' }); } });
  const bulkRemind = useMutation((s, ids: string[]) => s.parties.sendReminder(ids), { onSuccess: (n) => { clearSelection(); toast({ tone: 'success', text: `تم إرسال تذكير إلى ${pluralOf(n, P.invitation)} (محاكاة)` }); } });
  const quickManual = useMutation((s, id: string) => s.parties.markShared([id], 'manual'), { onSuccess: () => { setSharePrompt(null); haptic('success'); toast({ tone: 'success', text: 'سُجّل التواصل اليدوي' }); } });

  const all = parties.data ?? [];
  const ps = publishState(design.data);
  const published = ps === 'published' || ps === 'changed';
  const dup = useMemo(() => duplicatePhoneIds(all), [all]);
  const c = useMemo(() => countParties(all), [all]);
  const counts = useMemo(() => Object.fromEntries(PARTY_FILTERS.map((f) => [f.id, all.filter((p) => matchesFilter(p, f.id, dup)).length])), [all, dup]) as Record<PartyFilter, number>;
  const visible = useMemo(() => searchParties(all.filter((p) => matchesFilter(p, filter, dup)), q).sort((a, b) => a.primaryGuestName.localeCompare(b.primaryGuestName, 'ar')), [all, filter, q, dup]);
  const open = all.find((p) => p.id === openId) ?? null;
  const tableList = tables.data ?? [];
  const tableName = (id?: string) => tableList.find((t) => t.id === id)?.name;
  const sel = [...selected].filter((id) => all.some((p) => p.id === id));
  const visibleSelected = visible.filter((p) => selected.has(p.id)).length;
  const allVisibleSelected = visible.length > 0 && visible.every((p) => selected.has(p.id));
  const selecting = selectMode || sel.length > 0;
  const toggle = (id: string) => { haptic('tick'); setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; }); };
  const guestLink = useGuestLink(event);
  const shareUrl = (p: InvitationParty) => published && p.phone ? whatsappUrl(p.phone, inviteMessage(event, p, guestLink(p))) : undefined;

  // first visit on a phone: nudge the first card so the swipe is discoverable, once
  const [hintRow, setHintRow] = useState(false);
  useEffect(() => {
    if (!visible.length || typeof matchMedia !== 'function' || !matchMedia('(pointer: coarse)').matches) return;
    try { if (localStorage.getItem(SWIPE_HINT)) return; localStorage.setItem(SWIPE_HINT, '1'); } catch { return; }
    setHintRow(true);
    const t = setTimeout(() => setHintRow(false), 2600);
    return () => clearTimeout(t);
  }, [visible.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  if (parties.error) return <ErrorState error={parties.error} onRetry={parties.refetch} />;

  const counters: Array<{ id: PartyFilter; label: string; value: number; unit: string; tone: string }> = [
    { id: 'all', label: 'كل الدعوات', value: c.parties, unit: `تتسع لـ${pluralOf(c.maxSeats, P.person)}`, tone: 'ink' },
    { id: 'confirmed', label: 'أكدوا الحضور', value: c.confirmedPeople, unit: `شخصًا · ${pluralOf(counts.confirmed, P.invitation)}`, tone: 'success' },
    { id: 'pending', label: 'بانتظار الرد', value: counts.pending, unit: 'دعوة', tone: 'warning' },
    { id: 'not_shared', label: 'لم تُشارك بعد', value: counts.not_shared, unit: 'دعوة', tone: 'accent' },
  ];
  const groups = grouped ? groupByTable(visible, tableList) : null;
  const rowProps = (p: InvitationParty, i: number) => ({
    p, publish: ps, table: tableName(p.tableId), seatingEnabled: tableList.length > 0, attention: partyNeedsAttention(p, dup), checked: selected.has(p.id), selecting,
    hint: hintRow && i === 0, onToggle: () => toggle(p.id), onSelectStart: () => { setSelectMode(true); setSelected((s) => new Set(s).add(p.id)); },
    onOpen: () => setParam('party', p.id), shareUrl: shareUrl(p), onShare: () => setSharePrompt(p.id), event,
  });

  return (
    <div className="g2">
      <PageHeader title="الضيوف"
        subtitle={c.parties ? `${plural(c.parties, P.invitation)} · ${peopleLine(c.confirmedPeople)}` : 'أضف من ستدعوهم: شخصًا شخصًا أو من ملف'}
        actions={<>
          <Button variant="primary" icon="plus" onClick={() => setAdding(true)}>أضف ضيفًا</Button>
          <LinkButton to={paths.importGuests(event.id)} icon="upload">استيراد</LinkButton>
        </>} />

      <GuestViews eventId={event.id} active="list" />
      {parties.loading ? <PageLoader /> : all.length === 0 ? (
        <EmptyState icon="users" title="لا ضيوف بعد" action={<><Button variant="primary" icon="plus" onClick={() => setAdding(true)}>أضف ضيفًا</Button><LinkButton to={paths.importGuests(event.id)} icon="upload">استيراد من ملف</LinkButton></>}>
          كل دعوة يمكن أن تشمل شخصًا أو عائلة. تحدد العدد المسموح، والضيف يرد بالعدد الفعلي.
        </EmptyState>
      ) : (
        <div className="g2-body">
          <div className="g2-counters" role="group" aria-label="أعداد الضيوف — اضغط لعرض القائمة">
            {counters.map((k) => (
              <button key={k.id} type="button" className={`g2-counter tone-${k.tone}`} aria-pressed={filter === k.id} onClick={() => { haptic('tick'); clearSelection(); setParam('filter', k.id === 'all' || filter === k.id ? null : k.id); }}>
                <span className="g2-counter-label">{k.label}</span>
                <strong className="num">{k.value}</strong>
                <span className="g2-counter-unit">{k.unit}</span>
              </button>
            ))}
          </div>

          {!published && <Banner tone="warning" compact title="الدعوة غير منشورة" action={<LinkButton to={paths.invitation(event.id)} size="sm">إلى الدعوة</LinkButton>}>رتّب القائمة الآن؛ الروابط تعمل بعد النشر.</Banner>}

          <div className="g2-toolbar">
            {!food && <SearchInput value={q} onChange={setQ} placeholder="ابحث بالاسم أو الجوال أو الرمز" />}
            <div className="g2-toolbar-row">
              {(tableList.length > 0 || foodOn) && <div className="g2-switch" role="group" aria-label="طريقة العرض">
                <button type="button" aria-pressed={!grouped && !food} onClick={() => setParam('view', null)}><Icon name="list" size="sm" />قائمة</button>
                {tableList.length > 0 && <button type="button" aria-pressed={grouped} onClick={() => setParam('view', 'tables')}><Icon name="table" size="sm" />الطاولات</button>}
                {foodOn && <button type="button" aria-pressed={food} onClick={() => { haptic('tick'); setParam('view', 'food'); }}><Icon name="sparkle" size="sm" />الطعام</button>}
              </div>}
              {!food && <Button variant="ghost" size="sm" icon="sliders" className="g2-tool" aria-label={moreFilters ? 'فلاتر أقل' : 'فلاتر'} aria-expanded={moreFilters} onClick={() => setMoreFilters((v) => !v)}><span className="g2-tool-label">{moreFilters ? 'فلاتر أقل' : 'فلاتر'}</span></Button>}
              {!food && !selecting && visible.length > 0 && <Button variant="ghost" size="sm" icon="check" className="g2-tool" aria-label="تحديد" onClick={() => { haptic('tick'); setSelectMode(true); }}><span className="g2-tool-label">تحديد</span></Button>}
            </div>
            {!food && moreFilters && <div className="g2-chips" role="group" aria-label="تصفية الضيوف">
              {PARTY_FILTERS.map((f) => <button key={f.id} type="button" className="chip v2-press" aria-pressed={filter === f.id} onClick={() => { clearSelection(); setParam('filter', f.id === 'all' ? null : f.id); }}>{f.label}<span className="num">{counts[f.id]}</span></button>)}
            </div>}
          </div>

          {selecting && (
            <div className="bulk-bar g2-bulk" role="region" aria-label="إجراءات على المحدد">
              <div className="g2-bulk-head">
                <button type="button" className="g2-bulk-close" onClick={clearSelection} aria-label="إنهاء التحديد"><Icon name="close" size="sm" /></button>
                <span className="t-bold" aria-live="polite">{sel.length ? `${plural(sel.length, P.invitation)} محددة` : 'اختر الدعوات'}{visibleSelected < sel.length ? ` · ${visibleSelected} ظاهرة` : ''}</span>
                <button type="button" className="g2-bulk-all" onClick={() => setSelected(allVisibleSelected ? new Set() : new Set(visible.map((p) => p.id)))}>{allVisibleSelected ? 'إلغاء الكل' : `تحديد الظاهر (${visible.length})`}</button>
              </div>
              <div className="g2-bulk-actions">
                <Button size="sm" variant="primary" icon="chat" disabled={!published || !sel.length} onClick={() => setQueue(sel)}>شارك بالتتابع</Button>
                <Button size="sm" icon="check" disabled={!published || !sel.length} loading={bulkManual.pending} onClick={() => void bulkManual.run(sel)}>تم التواصل يدويًا</Button>
                <Menu label="إجراءات أخرى" items={[
                  { label: 'إرسال (محاكاة)', icon: 'send', disabled: !published || !sel.length, onSelect: () => void bulkSend.run(sel) },
                  { label: 'تذكير (محاكاة)', icon: 'bell', disabled: !sel.length, onSelect: () => void bulkRemind.run(sel) },
                ]} />
              </div>
            </div>
          )}

          {(bulkSend.error || bulkManual.error || bulkRemind.error) ? <Banner tone="danger" title="لم يكتمل الإجراء">{errorMessage(bulkSend.error || bulkManual.error || bulkRemind.error)}</Banner> : null}
          {sharePrompt && <Banner tone="info" title="هل أرسلت الرسالة؟" action={<div className="row gap-2 wrap"><Button size="sm" loading={quickManual.pending} onClick={() => void quickManual.run(sharePrompt)}>نعم، أرسلتها يدويًا</Button><Button size="sm" variant="ghost" onClick={() => setSharePrompt(null)}>لاحقًا</Button></div>}>
            فتح واتساب يجهّز الرسالة فقط؛ سجّلها بعد أن ترسلها بنفسك. {quickManual.error ? errorMessage(quickManual.error) : null}
          </Banner>}

          {food ? (
            <FoodReport event={event} parties={all} responses={responses.data ?? []} tables={tableList} now={now} onOpen={(id) => setParam('party', id)} />
          ) : visible.length === 0 ? (
            <EmptyState compact icon="search" title="لا نتائج" action={<Button onClick={() => { setQ(''); setParam('filter', null); }}>اعرض كل الضيوف</Button>}>
              {q ? `لا يوجد ضيف يطابق «${q}»` : 'لا يوجد ضيوف في هذا التصنيف.'}
            </EmptyState>
          ) : groups ? (
            <div className="g2-groups">
              {groups.map((g, gi) => (
                <section key={g.id} className={`g2-group${gi % 2 ? ' is-alt' : ''}`} aria-labelledby={`g2-g-${g.id}`}>
                  <header className="g2-group-head">
                    <h3 id={`g2-g-${g.id}`}>{g.name}</h3>
                    {g.table ? <span className={`g2-group-cap num${g.used > g.table.capacity ? ' is-over' : ''}`}>{g.used}/{g.table.capacity}</span> : <span className="g2-group-cap">{plural(g.parties.length, P.invitation)}</span>}
                    {g.table && <Link to={`${paths.seating(event.id)}?table=${encodeURIComponent(g.table.id)}`} className="g2-group-link">الطاولة<Icon name="forward" size="sm" /></Link>}
                  </header>
                  <ul className="g2-list" aria-label={g.name}>{g.parties.map((p, i) => <GuestCard key={p.id} {...rowProps(p, gi === 0 ? i : 1)} />)}</ul>
                </section>
              ))}
            </div>
          ) : (
            <ul className="g2-list" aria-label="قائمة الضيوف">{visible.map((p, i) => <GuestCard key={p.id} {...rowProps(p, i)} />)}</ul>
          )}
          {!food && <p className="faint t-sm g2-foot">{visible.length !== all.length ? `يعرض ${visible.length} من ${all.length}` : plural(all.length, P.invitation)}{published ? ' · روابط هذه النسخة التجريبية تعمل على هذا الجهاز فقط.' : ''}</p>}
        </div>
      )}

      {adding && (
        <PartyFormDialog open key="new" title="إضافة ضيف" existing={all} defaultSize={event.settings.defaultPartySize}
          onClose={() => { setAdding(false); add.reset(); }} pending={add.pending} error={add.error} onSubmit={(input) => void add.run(input)} />
      )}
      {queue && <ShareQueue event={event} parties={queue.map((id) => all.find((p) => p.id === id)).filter((p): p is InvitationParty => !!p)} urlFor={shareUrl}
        onClose={(done) => { setQueue(null); if (done) clearSelection(); }} />}
      {open && tables.data && <PartyDrawer key={open.id} event={event} party={open} all={all} tables={tables.data} publish={ps} onClose={() => setParam('party', null)} />}
      {openId && !open && !parties.loading && <Banner tone="info">هذا الضيف لم يعد في القائمة.</Banner>}
    </div>
  );
}

const peopleLine = (n: number) => n ? `${plural(n, P.person)} أكدوا` : 'لا تأكيدات بعد';

function groupByTable(list: InvitationParty[], tables: Table[]) {
  const out = tables.map((t) => ({ id: t.id, name: t.name, table: t as Table | null, parties: list.filter((p) => p.tableId === t.id), used: 0 }));
  for (const g of out) g.used = g.parties.reduce((n, p) => n + (p.rsvpStatus === 'confirmed' ? p.confirmedPartySize ?? 0 : 0), 0);
  const none = list.filter((p) => !p.tableId || !tables.some((t) => t.id === p.tableId));
  return [...out.filter((g) => g.parties.length), ...(none.length ? [{ id: 'none', name: 'بلا طاولة', table: null, parties: none, used: 0 }] : [])];
}

/** WhatsApp-like ticks for the invitation link — they describe the link, never a WhatsApp read receipt */
function DeliveryTicks({ p, publish }: { p: InvitationParty; publish: PublishState }) {
  const s = invitationStatus(p, publish);
  const label = s === 'draft' ? 'غير منشورة' : s === 'ready' ? 'جاهزة للمشاركة' : s === 'shared' ? (p.delivery.source === 'manual' ? 'شاركتها يدويًا' : p.delivery.source === 'simulated' ? 'أُرسلت (محاكاة)' : 'تمت المشاركة') : s === 'opened' ? 'فتح الدعوة' : 'تعذر الإرسال';
  return (
    <span className={`g2-ticks is-${s}`} title={s === 'opened' ? 'فُتح رابط الدعوة — ليس إشعار قراءة من واتساب' : undefined}>
      <svg viewBox="0 0 18 12" aria-hidden="true">{s === 'failed' ? <path d="M4 3l6 6M10 3l-6 6" /> : <><path d="M1.5 6.5l3 3 6-7" />{(s === 'shared' || s === 'opened') && <path d="M7.5 9.5l.5.3 6-7.3" />}</>}</svg>
      {label}
    </span>
  );
}

function GuestCard({ p, publish, table, seatingEnabled, attention, checked, selecting, hint, onToggle, onSelectStart, onOpen, shareUrl, onShare, event }: {
  p: InvitationParty; publish: PublishState; table?: string; seatingEnabled: boolean; attention: string[]; checked: boolean; selecting: boolean; hint: boolean; event: Event;
  onToggle: () => void; onSelectStart: () => void; onOpen: () => void; shareUrl?: string; onShare: () => void;
}) {
  const share = () => { if (!shareUrl) return; window.open(shareUrl, '_blank', 'noopener'); onShare(); };
  const swipe = useSwipeReveal({ start: true, end: true, tray: 92, onCommit: (side) => { if (side === 'start') { if (shareUrl) share(); else onOpen(); } else onToggle(); } });
  const press = useLongPress(onSelectStart, { enabled: !selecting });
  const rsvp = RSVP_STATUS[p.rsvpStatus];
  const name = p.primaryGuestName;
  const cardRef = useRef<HTMLLIElement>(null);
  useEffect(() => { if (hint) cardRef.current?.setAttribute('data-hint', 'true'); else cardRef.current?.removeAttribute('data-hint'); }, [hint]);
  return (
    <li ref={cardRef} className={`g2-row swipe-row${checked ? ' is-selected' : ''}${selecting ? ' is-selecting' : ''} rsvp-${p.rsvpStatus}`}>
      <div className="swipe-tray swipe-tray-start" aria-hidden="true">
        {shareUrl ? <a className="swipe-action is-whatsapp" href={shareUrl} target="_blank" rel="noopener noreferrer" tabIndex={-1} onClick={() => { onShare(); swipe.close(); }}><Icon name="chat" />واتساب</a>
          : <button type="button" className="swipe-action is-muted" tabIndex={-1} onClick={() => { swipe.close(); onOpen(); }}><Icon name="chat" />{publish === 'draft' || publish === 'none' ? 'بعد النشر' : 'أضف رقمًا'}</button>}
      </div>
      <div className="swipe-tray swipe-tray-end" aria-hidden="true">
        <button type="button" className="swipe-action is-muted" tabIndex={-1} onClick={() => { swipe.close(); onOpen(); }}><Icon name="eye" />التفاصيل</button>
        <button type="button" className="swipe-action is-dark" tabIndex={-1} onClick={() => { swipe.close(); onToggle(); }}><Icon name="check" />{checked ? 'إلغاء' : 'تحديد'}</button>
      </div>
      <div ref={swipe.content} className="swipe-content g2-card" {...mergeHandlers(swipe.gesture, press)}>
        <label className="g2-check gt-check-hit"><input type="checkbox" checked={checked} onChange={onToggle} aria-label={`تحديد ${name}`} /></label>
        <Avatar name={name} tone={p.rsvpStatus === 'confirmed' ? 'success' : p.rsvpStatus === 'declined' ? 'neutral' : 'warning'} />
        <div className="g2-main">
          <button type="button" className="g2-name" data-gesture-surface="" onClick={selecting ? onToggle : onOpen} aria-pressed={selecting ? checked : undefined}>{name}</button>
          <span className="g2-meta">{[p.side, `حتى ${p.maxPartySize}`, p.companionNames?.length ? `+${p.companionNames.length} مرافقين` : null].filter(Boolean).join(' · ')}{p.phone && <bdi className="g2-phone num" dir="ltr">{formatPhone(p.phone)}</bdi>}</span>
          <span className="g2-share-line">
            {shareUrl ? <a className="g2-wa v2-press" href={shareUrl} target="_blank" rel="noopener noreferrer" data-gesture-surface="" onClick={onShare} aria-label={`جهّز رسالة واتساب إلى ${name}`}><Icon name="chat" size="sm" />واتساب</a>
              : <button type="button" className="g2-wa is-muted v2-press" data-gesture-surface="" onClick={onOpen} aria-label={publish === 'draft' || publish === 'none' ? `انشر الدعوة قبل مشاركة رابط ${name}` : `أضف رقمًا لمشاركة دعوة ${name}`}><Icon name="chat" size="sm" />{publish === 'draft' || publish === 'none' ? 'بعد النشر' : 'أضف رقمًا'}</button>}
            <DeliveryTicks p={p} publish={publish} />
          </span>
          <FoodLine event={event} p={p} />
          {attention.length > 0 && <span className="g2-flag"><Icon name="alert" size="sm" />{attention[0]}</span>}
        </div>
        <div className="g2-state">
          <span className={`g2-rsvp tone-${rsvp.tone}`}><span className="g2-dot" aria-hidden="true" />{rsvp.label}{p.rsvpStatus === 'confirmed' ? <b className="num"> · {p.confirmedPartySize}</b> : null}</span>
          {table ? <span className="g2-table"><Icon name="table" size="sm" />{table}</span> : seatingEnabled && p.rsvpStatus === 'confirmed' ? <span className="g2-table is-missing">بلا طاولة</span> : null}
          {p.checkedInCount ? <span className={`g2-in tone-${CHECKIN_STATUS[p.checkInStatus].tone}`}>{CHECKIN_STATUS[p.checkInStatus].label} {p.checkedInCount}</span> : null}
        </div>
      </div>
    </li>
  );
}
