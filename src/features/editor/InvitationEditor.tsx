/**
 * Invitation editor — one surface, the card is the hero (decision 2). A controlled, template-based studio, not a free canvas.
 *
 *   header — back (to the event's overview: the editor IS the invitation, there is no summary page behind it) · title
 *            with a calm save status («تم الحفظ» · «التعديلات تصل لضيوفك تلقائيًا») · «معاينة كضيف» («معاينة» on a phone) ·
 *            the one forward action «أرسل للضيوف» (the guests' send flow). There is no publish step and no publish word.
 *   stage  — the live card on the invitation's own setting. Its pages (البطاقة · الكلمة · البرنامج) are swiped on the card
 *            (RTL: a swipe to the right shows the next page) and dotted under it, beside replay and «بحجم أكبر».
 *            Every text on the card (names, date, place, message) is a button that opens «النص» at its field.
 *   tools  — three tabs: النص · الشكل (one grid of designs, one row of backgrounds, motion) · الصوت (upload and record
 *            in place).
 * Desktop: the tools are an RTL side panel beside the stage.
 * Phone: the tools are a bottom sheet whose tab row is the only toolbar (peek). A tab opens it (half / full) and only
 *   switches tabs once open — it never folds the sheet away; the handle and «إخفاء» do that. The stage above always
 *   keeps the card in view and shrinks smoothly — while typing it becomes a live mini card, and the focused field's
 *   label stays in view under the tab row. Leaving a field restores the previous height.
 *
 * Rules:
 * - every invitation change autosaves (debounced) and the header always says so, calmly
 * - names, date and place are the EVENT's own details (one source for everywhere): edited in «النص» or by tapping them on
 *   the card, shown on the card as they are typed, and saved to the event once valid (debounced, like the design)
 * - names on the card ARE the event's names: an old design's separate card names still load, but the editor no longer
 *   offers them and its first save drops them
 * - a design or background never erases texts; a shared design link (?template=) is applied once, to a new invitation
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Event, InvitationDesign, InvitationDesignContent } from '../../domain/types';
import { EditorWorkbench, ExpandedCard, type WorkbenchPage } from './EditorWorkbench';
import { usePointerGesture } from '../../ui/hooks/usePointerGesture';
import { sheetSnapHeight, type SheetPoint } from '../../domain/gestures';
import { useSwipePager } from '../../ui/hooks/useSwipePager';
import { DraftQueue } from '../../domain/draft-queue';
import { defaultDesign, toInvitationData } from '../../domain/invitation';
import { applyPreset, presetById } from '../../domain/templates';
import { Button, ErrorState, Icon, IconButton, Segmented, PageLoader } from '../../ui';
import { useServices } from '../../app/data';
import { useBlocker, useLocation, useNavigate } from '../../app/router';
import { paths } from '../../app/paths';
import { useToast } from '../../ui/primitives/Feedback';
import { useCopy } from '../../ui/copy';
import type { CopyKey } from '../../domain/copy';
import { useDesign, useEvent } from '../shared/queries';
import { DesignSection, SoundSection, TextSection, eventFields, eventPatch, previewEvent, sameDraft, validateEventFields, type EditField, type EventDraft, type EventDraftErrors } from './sections';

type SaveState = 'saved' | 'dirty' | 'saving' | 'error';
/** النص · الشكل · الصوت (the values stay those of the links already in use: ?section=content|design|motion) */
export type EditorSection = 'content' | 'design' | 'motion';
/** labels are dictionary keys, read in the organizer's voice when the tabs render */
const SECTIONS: Array<{ value: EditorSection; label: CopyKey; icon: 'type' | 'palette' | 'volume' }> = [
  { value: 'content', label: 'edContent', icon: 'type' },
  { value: 'design', label: 'edDesign', icon: 'palette' },
  { value: 'motion', label: 'edMotion', icon: 'volume' },
];
/** the old «المناسبة» tab lives in «النص» now */
const sectionOf = (v: string | null): EditorSection | null => v === 'event' ? 'content' : SECTIONS.some((s) => s.value === v) ? v as EditorSection : null;
const PAGE_LABEL: Record<WorkbenchPage, CopyKey> = { card: 'edPageCard', message: 'edPageMessage', program: 'edPageProgram' };
/** what a tap on the card focuses in «النص» */
const FIELD_SELECTOR: Record<EditField, string> = { names: '[data-edit-field="names"]', date: '[data-edit-field="date"]', venue: '[data-edit-field="venue"]', message: '[data-edit-field="message"]', program: '[data-edit-field="program"]' };
const FIELD_PAGE: Record<EditField, WorkbenchPage> = { names: 'card', date: 'card', venue: 'card', message: 'message', program: 'program' };
const STOPS: SheetPoint[] = ['peek', 'half', 'full'];
/** the room under the card for its page dots and tools */
const BAR_ROOM = 56;
/** fields that raise the phone keyboard (pickers — date, time, select — do not) */
const isTextField = (el: Element | null): el is HTMLElement =>
  el?.tagName === 'TEXTAREA' || (el?.tagName === 'INPUT' && /^(text|search|url|email|tel|number|)$/.test((el as HTMLInputElement).type));
/** names on the card are the event's names: the old per-design names are not offered any more */
const ownNames = (c: InvitationDesignContent): InvitationDesignContent => Object.values(c.displayNames ?? {}).some((v) => v?.trim()) ? { ...c, displayNames: {} } : c;

function useMedia(q: string) {
  const get = () => typeof matchMedia === 'function' && matchMedia(q).matches;
  const [m, setM] = useState(get);
  useEffect(() => { const mq = matchMedia(q); const on = () => setM(mq.matches); mq.addEventListener('change', on); return () => mq.removeEventListener('change', on); }, [q]);
  return m;
}

export function InvitationEditor({ eventId }: { eventId: string }) {
  // fresh: the editor seeds its draft once; a cached copy from before the last write (a template
  // just applied, a card picked elsewhere) would be shown, edited and autosaved back over it
  const ev = useEvent(eventId, { fresh: true });
  const design = useDesign(eventId, { fresh: true });
  if (ev.error || design.error) return <div className="ed-state"><ErrorState error={ev.error || design.error} onRetry={() => { ev.refetch(); design.refetch(); }} /></div>;
  if (ev.loading || design.loading || !ev.data) return <div className="ed-state"><PageLoader /></div>;
  return <Editor event={ev.data} saved={design.data ?? null} />;
}

function Editor({ event, saved }: { event: Event; saved: InvitationDesign | null }) {
  const services = useServices();
  const navigate = useNavigate();
  const loc = useLocation();
  const toast = useToast();
  const { t, copy } = useCopy();
  const phone = useMedia('(max-width: 959px)');

  const [content, setContent] = useState<InvitationDesignContent>(() => { const base = ownNames(saved?.draft ?? defaultDesign(event)); const selected = !saved && presetById(loc.search.get('template') ?? ''); return selected ? applyPreset(base, selected) : base; });
  const contentRef = useRef(content);
  const [save, setSave] = useState<SaveState>(saved ? 'saved' : 'dirty');
  const [design, setDesign] = useState<InvitationDesign | null>(saved);
  const linked = sectionOf(loc.search.get('section'));
  const [section, setSection] = useState<EditorSection>(linked ?? 'content');
  const [page, setPage] = useState<WorkbenchPage>('card');
  const pages: WorkbenchPage[] = content.program.length ? ['card', 'message', 'program'] : ['card', 'message'];
  const shownPage = pages.includes(page) ? page : 'card';
  const [expanded, setExpanded] = useState(false);
  const [intro, setIntro] = useState(loc.search.get('first') === '1');
  // the face's entrance plays when the editor opens and on request; typing never restarts it
  const [cardMotion, setCardMotion] = useState(0);
  // swipe the card sideways to turn the invitation's pages (RTL: the page follows the finger, right = next)
  const step = (d: 1 | -1) => { const i = pages.indexOf(shownPage) + d; return i >= 0 && i < pages.length ? pages[i]! : null; };
  const pager = useSwipePager<HTMLDivElement>({ canStep: (d) => !!step(d), onStep: (d) => { const p = step(d); if (p) setPage(p); } });
  // a section linked from elsewhere (?section=…) opens with its tools showing; otherwise the card leads
  const [sheet, setSheet] = useState<SheetPoint>(linked ? 'half' : 'peek');
  const sheetRef = useRef(sheet);
  sheetRef.current = sheet;
  const [typing, setTyping] = useState(false);
  const beforeTyping = useRef<SheetPoint | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [queue] = useState(() => new DraftQueue(content, (value: InvitationDesignContent) => services.invitations.saveDraft(event.id, value), !saved));
  const mounted = useRef(true);
  const panel = useRef<HTMLElement>(null);
  const body = useRef<HTMLDivElement>(null);

  // ---- the event's own details: edited here, saved to the event (debounced, only when valid)
  const server = useRef(event);
  if (event.updatedAt > server.current.updatedAt) server.current = event;
  const [evDraft, setEvDraft] = useState<EventDraft>(() => eventFields(event));
  const evRef = useRef(evDraft);
  const evBase = useRef(eventFields(event)); // what the event holds (as far as this editor knows)
  const [evSave, setEvSave] = useState<SaveState | 'invalid'>('saved');
  const [evErrors, setEvErrors] = useState<EventDraftErrors>({});
  const evTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // phones: a text field raises the keyboard → the sheet takes the room the keyboard leaves and the stage keeps a live
  // mini card above it; leaving the field restores the height the sheet had before
  useEffect(() => {
    if (!phone) return;
    const vp = window.visualViewport;
    let leave: ReturnType<typeof setTimeout> | undefined;
    const sync = () => {
      const active = document.activeElement;
      const typingNow = isTextField(active) && !!panel.current?.contains(active);
      document.documentElement.style.setProperty('--editor-viewport', `${typingNow && vp ? vp.height : window.innerHeight}px`);
      clearTimeout(leave);
      if (typingNow) {
        setTyping(true);
        if (beforeTyping.current === null) beforeTyping.current = sheetRef.current === 'peek' ? 'half' : sheetRef.current;
        setSheet('full');
        return;
      }
      // focus may be moving to the next field: wait a beat before restoring
      leave = setTimeout(() => {
        if (isTextField(document.activeElement) && panel.current?.contains(document.activeElement)) return;
        setTyping(false);
        const back = beforeTyping.current;
        beforeTyping.current = null;
        if (back) setSheet(back);
      }, 140);
    };
    vp?.addEventListener('resize', sync); document.addEventListener('focusin', sync); document.addEventListener('focusout', sync); sync();
    return () => { clearTimeout(leave); vp?.removeEventListener('resize', sync); document.removeEventListener('focusin', sync); document.removeEventListener('focusout', sync); document.documentElement.style.removeProperty('--editor-viewport'); };
  }, [phone]);

  // the design changed outside this editor (another tab, a template applied elsewhere): take it while there are no
  // local edits waiting, so an autosave can never write an older design back
  useEffect(() => {
    if (!saved || save !== 'saved') return;
    if (saved.draftSavedAt === design?.draftSavedAt) return;
    if (design && saved.draftSavedAt < design.draftSavedAt) return; // our own newer save is not in the cache yet
    const next = ownNames(saved.draft);
    if (!queue.replace(next)) return;
    contentRef.current = next;
    setContent(next);
    setDesign(saved);
  }, [saved?.draftSavedAt, save]); // eslint-disable-line react-hooks/exhaustive-deps

  // the event was saved (here or in another tab): take the new values unless there are local edits still waiting
  useEffect(() => {
    const fresh = eventFields(event);
    if (sameDraft(evRef.current, evBase.current)) { evRef.current = fresh; setEvDraft(fresh); }
    evBase.current = fresh;
  }, [event.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  // a tab opens at its top (a tap on the card then scrolls to its field)
  useEffect(() => { body.current?.scrollTo?.(0, 0); }, [section]);

  const evPending = !sameDraft(evDraft, evBase.current);
  useBlocker(save !== 'saved' || evPending, t(evPending ? 'edLeaveEvent' : 'edLeave'));

  const persist = async () => {
    clearTimeout(timer.current);
    setSave('saving');
    try {
      const d = await queue.flush();
      if (mounted.current) { if (d) setDesign(d); setSave(queue.dirty ? 'dirty' : 'saved'); }
      return d ?? design;
    } catch {
      if (mounted.current) setSave('error');
      return null;
    }
  };
  useEffect(() => { mounted.current = true; if (!saved) void persist(); return () => { mounted.current = false; clearTimeout(timer.current); clearTimeout(evTimer.current); }; }, []);

  const update = (patch: Partial<InvitationDesignContent>) => {
    const next = { ...contentRef.current, ...patch };
    contentRef.current = next;
    queue.update(next);
    setContent(next);
    setSave('dirty');
    setIntro(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(), 650);
  };

  /** saves the event's details when they are valid; invalid ones stay on screen, marked, and are not saved */
  const saveEvent = async (): Promise<boolean> => {
    clearTimeout(evTimer.current);
    const d = evRef.current;
    if (sameDraft(d, evBase.current)) { setEvSave('saved'); return true; }
    const errors = validateEventFields(server.current, d, services.clock.now(), copy);
    if (Object.keys(errors).length) { setEvErrors(errors); setEvSave('invalid'); return false; }
    setEvSave('saving');
    try {
      const next = await services.events.update(event.id, eventPatch(server.current, d));
      if (next.updatedAt >= server.current.updatedAt) server.current = next;
      evBase.current = d;
      if (!mounted.current) return true;
      if (sameDraft(evRef.current, d)) setEvSave('saved');
      else { setEvSave('dirty'); evTimer.current = setTimeout(() => void saveEvent(), 900); }
      return true;
    } catch {
      if (mounted.current) setEvSave('error');
      return false;
    }
  };
  const editEvent = (patch: Partial<EventDraft>) => {
    const next = { ...evRef.current, ...patch };
    evRef.current = next;
    setEvDraft(next);
    setEvErrors((e) => { const rest = { ...e }; for (const k of Object.keys(patch)) delete rest[k as keyof EventDraft]; return rest; });
    setEvSave('dirty');
    setIntro(false);
    clearTimeout(evTimer.current);
    evTimer.current = setTimeout(() => void saveEvent(), 900);
  };

  /** opens «النص» at a field: a tap on the card, or a field that needs a look before leaving */
  const reveal = (selector: string) => {
    const go = () => {
      const el = panel.current?.querySelector<HTMLElement>(selector);
      if (!el) return false;
      const details = el.closest('details');
      if (details && !details.open) details.open = true;
      el.focus({ preventScroll: true });
      // the whole field, its label included, comes into view (not just the input)
      (el.closest('.field') ?? el).scrollIntoView?.({ block: 'center', behavior: 'smooth' });
      return true;
    };
    // already in view: focus in the same tap, so a phone raises its keyboard
    if (section === 'content' && (!phone || sheetRef.current !== 'peek') && go()) return;
    setSection('content');
    if (phone && sheetRef.current === 'peek') setSheet('half');
    requestAnimationFrame(() => requestAnimationFrame(() => { go(); }));
  };
  const editField = (field: EditField) => { setIntro(false); if (pages.includes(FIELD_PAGE[field])) setPage(FIELD_PAGE[field]); reveal(FIELD_SELECTOR[field]); };

  /** everything saved (and valid) before leaving the editor — what is saved is what guests get */
  const settle = async (): Promise<boolean> => {
    clearTimeout(timer.current);
    const errors = sameDraft(evRef.current, evBase.current) ? {} : validateEventFields(server.current, evRef.current, services.clock.now(), copy);
    const bad = Object.keys(errors)[0] as keyof EventDraft | undefined;
    if (bad) { setEvErrors(errors); setEvSave('invalid'); toast({ tone: 'danger', text: t('edCheckFields') }); reveal(`[data-event-field="${bad}"]`); return false; }
    const d = queue.dirty || save !== 'saved' ? await persist() : design;
    if (!d || !(await saveEvent())) { toast({ tone: 'danger', text: t('edSaveFailedLeave') }); return false; }
    return true;
  };
  const leave = (to: string) => void settle().then((ok) => { if (ok) navigate(to, { force: true }); });

  const shown = useMemo(() => previewEvent(event, evDraft), [event, evDraft]);
  const invitation = useMemo(() => toInvitationData(shown, content, event.settings.defaultPartySize), [shown, content, event.settings.defaultPartySize]);
  const guestPreview = () => leave(`${paths.preview(event.id)}?from=design&section=${section}`);
  const close = () => leave(paths.overview(event.id));
  // «أرسل للضيوف»: the guests' send flow (it opens the share sheet for those not sent yet)
  const send = () => leave(paths.guests(event.id, { share: 'unsent' }));

  // phone sheet: three stops (peek = the tab row only · half · full, which still keeps a mini card above).
  // The handle follows the finger, snaps by position and velocity, a tap toggles, arrow keys step between stops.
  const clearDrag = () => { panel.current?.style.removeProperty('--drag'); panel.current?.removeAttribute('data-dragging'); };
  const handleGesture = usePointerGesture({ axis: 'y', enabled: phone,
    onMove: (dy) => { panel.current?.setAttribute('data-dragging', 'true'); panel.current?.style.setProperty('--drag', `${Math.max(-420, Math.min(360, dy))}px`); },
    onEnd: (g) => {
      const h = panel.current?.getBoundingClientRect().height ?? 0;
      clearDrag();
      if (g.cancelled) return; // pointer cancel restores the previous stop
      if (!g.moved) { setSheet((s) => s === 'peek' ? 'half' : s === 'half' ? 'full' : 'half'); return; }
      const viewport = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--editor-viewport')) || window.innerHeight;
      const bar = document.querySelector('.ed-bar')?.getBoundingClientRect().height ?? 56;
      const mini = Math.max(128, Math.min(240, viewport * .3));
      const full = Math.max(0, viewport - bar - mini);
      setSheet((s) => sheetSnapHeight(h, g.velocity, s, { peek: Math.min(96, full), half: Math.min(viewport * .5, full), full }));
    },
  });
  const sheetKeys = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    setSheet((s) => STOPS[Math.max(0, Math.min(2, STOPS.indexOf(s) + (e.key === 'ArrowUp' ? 1 : -1)))]!);
  };
  // phones: the tab row is the toolbar — a tab opens the sheet from its peek. Once open a tab only switches tabs
  // (tapping the open one again never folds the sheet away under the finger): the handle and «إخفاء» close it.
  const onTabs = (e: React.MouseEvent) => {
    if (!phone || sheet !== 'peek') return;
    const tab = (e.target as HTMLElement).closest('[role="tab"]');
    if (!tab) return;
    setSheet(tab.id === 'ed-tab-design' ? 'full' : 'half');
  };
  // the focused field's label never hides under the sheet's tab row: the field (label included) is scrolled into the
  // panel's view, again once the keyboard has resized it
  const keepLabel = (target: HTMLElement) => {
    const field = target.closest<HTMLElement>('.field, .ed-program li, .ed-group');
    if (!field || !body.current) return;
    const fit = () => {
      const box = body.current;
      if (!box || !field.isConnected) return;
      const above = field.getBoundingClientRect().top - box.getBoundingClientRect().top;
      if (above < 8) box.scrollTop += above - 8;
    };
    requestAnimationFrame(fit);
    window.setTimeout(fit, 360);
  };

  // one status for the design and the event: pending and in-flight read the same, so it does not flicker while typing
  const status: SaveState | 'invalid' = save === 'error' || evSave === 'error' ? 'error' : evSave === 'invalid' ? 'invalid' : save === 'saved' && evSave === 'saved' ? 'saved' : 'saving';
  const saveLabel = status === 'error' ? <><Icon name="alert" size="sm" />{t('edSaveFailed')}</>
    : status === 'invalid' ? <><Icon name="alert" size="sm" />{t('edFixField')}</>
    : status === 'saved' ? <><Icon name="check" size="sm" />{t('edSaved')}</>
    : <><span className="ed-save-dot" aria-hidden="true" />{t('edSaving')}</>;
  const retry = () => { if (save === 'error') void persist(); if (evSave === 'error') void saveEvent(); };
  const mini = phone && typing;

  return (
    <div className={`ed ed-v3 at-${sheet}${typing ? ' is-typing' : ''}`} data-sheet={sheet}>
      <a href="#editor-controls" className="skip-link">{t('edSkip')}</a>
      <header className="ed-bar">
        <button type="button" className="ed-close" aria-label={t('edCloseLabel')} onClick={close}><Icon name="back" /></button>
        <div className="ed-title">
          <h1 className="ed-h">{t('edTitle')}</h1>
          <p className="ed-status-line">
            <span className={`save-state is-${status}`} role="status" aria-live="polite">{saveLabel}</span>
            {status === 'error' ? <button type="button" className="link-btn ed-retry" onClick={retry}>{t('retry')}</button>
              : status !== 'invalid' && <span className="ed-live">{t('edLive')}</span>}
          </p>
        </div>
        <div className="ed-actions">
          {/* one button; a phone shows its short word («معاينة»), the full name stays its accessible name */}
          <Button variant="secondary" icon="eye" className="ed-preview-btn" aria-label={t('editorPreview')} onClick={guestPreview}><span className="ed-preview-long">{t('editorPreview')}</span><span className="ed-preview-short" aria-hidden="true">{t('edPreviewShort')}</span></Button>
          <Button variant="primary" icon="send" className="ed-send" onClick={send}>{t('edSend')}</Button>
        </div>
      </header>

      <div className="ed-main">
        <aside ref={panel} className="ed-panel" aria-label={t('edToolsLabel')}>
          <div className="ed-handle-row">
            <button type="button" className="ed-handle" aria-label={t('shSheet', { state: t(sheet === 'full' ? 'shSheetFull' : sheet === 'peek' ? 'shSheetPeek' : 'shSheetHalf') })} aria-expanded={sheet !== 'peek'}
              data-gesture-surface data-stop={sheet}
              {...handleGesture} onKeyDown={sheetKeys} onClick={(e) => { if (e.detail === 0) setSheet((v) => v === 'full' ? 'half' : 'full'); }}>
              <span aria-hidden="true" />
            </button>
            {sheet !== 'peek' && <IconButton size="sm" icon="chevron-down" className="ed-sheet-hide" label={t('editorHideTools')} onClick={() => { (document.activeElement as HTMLElement | null)?.blur?.(); beforeTyping.current = null; setSheet('peek'); }} />}
          </div>
          <div className="ed-tabs-wrap" onClick={onTabs}>
            <Segmented label={t('edTabsLabel')} panels="ed" value={section} onChange={(v: EditorSection) => setSection(v)} options={SECTIONS.map((s) => ({ ...s, label: t(s.label) }))} className="ed-tabs" />
          </div>
          <div ref={body} className="ed-panel-body" role="tabpanel" id={`ed-${section}`} aria-labelledby={`ed-tab-${section}`}
            onFocusCapture={(e) => { const el = e.target as HTMLElement; const p = el.closest('[data-page-for]')?.getAttribute('data-page-for') as WorkbenchPage | null; if (p && pages.includes(p)) setPage(p); if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) keepLabel(el); }}>
            <span id="editor-controls" tabIndex={-1} />
            {section === 'content' && <TextSection event={event} draft={evDraft} onDraft={editEvent} errors={evErrors} content={content} update={update} />}
            {section === 'design' && <DesignSection event={shown} content={content} invitation={invitation} update={update} />}
            {section === 'motion' && <SoundSection content={content} update={update} />}
          </div>
        </aside>

        <section className="ed-stage" aria-label={t('edStageLabel')}>
          {intro && <p className="ed-intro" role="note"><Icon name="check-circle" size="sm" /><span><strong>{t('edReadyTitle')}</strong> {t('edReadyText')}</span></p>}
          <div className="ed-canvas">
            <div className="ed-page-swipe" key={shownPage} ref={pager.ref} data-pager="" data-enter={pager.enter} {...pager.gesture}>
              <EditorWorkbench event={shown} content={content} page={shownPage} motion={cardMotion} bottom={mini ? 0 : BAR_ROOM} onEdit={editField} />
            </div>
            {!mini && <div className="ed-canvas-bar">
              <div className="ed-dots" role="group" aria-label={t('edPagesLabel')}>
                {pages.map((p, i) => <button key={p} type="button" className="ed-dot" aria-current={p === shownPage ? 'page' : undefined}
                  aria-label={t('edPageOf', { name: t(PAGE_LABEL[p]), n: i + 1, total: pages.length })} onClick={() => setPage(p)}><span aria-hidden="true" /></button>)}
              </div>
              <span className="ed-canvas-actions">
                {shownPage === 'card' && <IconButton size="sm" variant="ghost" icon="play" className="ed-motion-replay" label={t('edReplayCard')} onClick={() => setCardMotion((n) => n + 1)} />}
                <IconButton size="sm" variant="ghost" icon="expand" className="ed-workbench-expand" label={t('edExpand')} onClick={() => setExpanded(true)} />
              </span>
            </div>}
          </div>
        </section>
      </div>
      {expanded && <ExpandedCard event={shown} content={content} page={shownPage} onClose={() => setExpanded(false)} />}
    </div>
  );
}
