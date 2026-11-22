/**
 * Invitation editor — a controlled, template-based studio (not a free canvas). The card is the hero.
 *
 * One hierarchy on every size:
 *   header  — close · title with a calm save/publish status · «معاينة كضيف» · the ONE primary action (publish / publish
 *             changes / to the guests), always in the same place
 *   stage   — the live card standing on the invitation's own setting, with one small row under it: the page
 *             (البطاقة · الكلمة · البرنامج), replay and «بحجم أكبر»
 *   tools   — four sections: المحتوى · الشكل · التجربة · المناسبة
 * Desktop: the tools are an RTL side panel and the stage can switch to the playing invitation in a device frame.
 * Phone: the tools are a bottom sheet whose tab row is the only toolbar (peek). A section opens it (half / full);
 *   the stage above always keeps the card in view and shrinks smoothly — while typing it becomes a live mini card.
 *   Leaving a field restores the previous height; «إخفاء» and publishing return to the full card. «معاينة كضيف»
 *   opens the full-bleed guest preview.
 *
 * Rules kept from the platform designer:
 * - every invitation change autosaves to the draft (debounced) and the header always says so, calmly
 * - publishing snapshots the draft for guests; draft / published / unpublished changes are explicit
 * - event data (date, time, venue) is edited in its own section and saved to the EVENT, with a clear
 *   notice that it changes everywhere — the preview shows edits instantly, before saving
 * - "تغيير القالب" saves first, then opens the gallery; a template never erases texts
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Event, InvitationDesign, InvitationDesignContent } from '../../domain/types';
import { Logo } from '../../ui/brand';
import { EditorWorkbench, ExpandedCard, type WorkbenchPage } from './EditorWorkbench';
import { AccountMenu } from '../account/AccountMenu';
import { usePointerGesture } from '../../ui/hooks/usePointerGesture';
import { sheetSnapHeight, type SheetPoint } from '../../domain/gestures';
import { useSwipePager } from '../../ui/hooks/useSwipePager';
import { SealStamp } from '../signature/SealStamp';
import { DraftQueue } from '../../domain/draft-queue';
import { CARD_NAMES, defaultDesign, publishState, toInvitationData } from '../../domain/invitation';
import { applyPreset, presetById } from '../../domain/templates';
import { Banner, Button, ErrorState, Icon, IconButton, Segmented, PageLoader } from '../../ui';
import { useServices } from '../../app/data';
import { useBlocker, useLocation, useNavigate } from '../../app/router';
import { paths } from '../../app/paths';
import { useToast } from '../../ui/primitives/Feedback';
import { useCopy } from '../../ui/copy';
import { errorMessage } from '../../services/errors';
import { useDesign, useEvent } from '../shared/queries';
import { useCan } from '../shared/OwnerOnly';
import { LivePreview } from '../invitation/LivePreview';
import { ContentSection, DesignSection, EventSection, MotionSection, eventFields, previewEvent, validateEventFields, type EventDraft, type EventDraftErrors } from './sections';

type SaveState = 'saved' | 'dirty' | 'saving' | 'error';
export type EditorSection = 'content' | 'design' | 'motion' | 'event';
const SECTIONS: Array<{ value: EditorSection; label: string; icon: 'type' | 'palette' | 'motion' | 'calendar' }> = [
  { value: 'content', label: 'المحتوى', icon: 'type' },
  { value: 'design', label: 'الشكل', icon: 'palette' },
  { value: 'motion', label: 'التجربة', icon: 'motion' },
  { value: 'event', label: 'المناسبة', icon: 'calendar' },
];
const PAGES: Array<{ value: WorkbenchPage; label: string }> = [{ value: 'card', label: 'البطاقة' }, { value: 'message', label: 'الكلمة' }, { value: 'program', label: 'البرنامج' }];
const STOPS: SheetPoint[] = ['peek', 'half', 'full'];
/** fields that raise the phone keyboard (pickers — date, time, select — do not) */
const isTextField = (el: Element | null): el is HTMLElement =>
  el?.tagName === 'TEXTAREA' || (el?.tagName === 'INPUT' && /^(text|search|url|email|tel|number|)$/.test((el as HTMLInputElement).type));

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
  const mayPublish = useCan('invitation.publish'); // owner only (domain/roles)
  const navigate = useNavigate();
  const loc = useLocation();
  const toast = useToast();
  const { t } = useCopy();
  const phone = useMedia('(max-width: 959px)');

  const [content, setContent] = useState<InvitationDesignContent>(() => { const base = saved?.draft ?? defaultDesign(event); const selected = !saved && presetById(loc.search.get('template') ?? ''); return selected ? applyPreset(base, selected) : base; });
  const contentRef = useRef(content);
  const [save, setSave] = useState<SaveState>(saved ? 'saved' : 'dirty');
  const [design, setDesign] = useState<InvitationDesign | null>(saved);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | undefined>();
  const initial = loc.search.get('section') as EditorSection | null;
  const linked = SECTIONS.some((s) => s.value === initial);
  const [section, setSection] = useState<EditorSection>(linked ? initial! : 'content');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [page, setPage] = useState<WorkbenchPage>('card');
  const [expanded, setExpanded] = useState(false);
  // the face's entrance plays when the editor opens and on request; typing never restarts it
  const [cardMotion, setCardMotion] = useState(0);
  // phones: swipe the stage sideways to turn the invitation's pages (RTL: the page follows the finger, right = next)
  const pager = useSwipePager<HTMLDivElement>({
    canStep: (d) => { const i = PAGES.findIndex((p) => p.value === page) + d; return i >= 0 && i < PAGES.length; },
    onStep: (d) => setPage((p) => PAGES[Math.max(0, Math.min(PAGES.length - 1, PAGES.findIndex((x) => x.value === p) + d))]!.value),
  });
  // a section linked from elsewhere (?section=…) opens with its tools showing; otherwise the card leads
  const [sheet, setSheet] = useState<SheetPoint>(linked ? 'half' : 'peek');
  const sheetRef = useRef(sheet);
  sheetRef.current = sheet;
  const [typing, setTyping] = useState(false);
  const beforeTyping = useRef<SheetPoint | null>(null);
  const [replay, setReplay] = useState(0);
  const [sound, setSound] = useState(false);
  const [evDraft, setEvDraft] = useState<EventDraft>(() => eventFields(event));
  const [eventErrors, setEventErrors] = useState<EventDraftErrors>({});
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [queue] = useState(() => new DraftQueue(content, (value: InvitationDesignContent) => services.invitations.saveDraft(event.id, value), !saved));
  const [justPublished, setJustPublished] = useState(false);
  const mounted = useRef(true);
  const panel = useRef<HTMLElement>(null);

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

  // the draft or publication changed outside this editor (another tab, a template applied elsewhere):
  // take it while there are no local edits waiting, so an autosave can never write an older design back
  useEffect(() => {
    if (!saved || save !== 'saved') return;
    if (saved.draftSavedAt === design?.draftSavedAt && saved.publishedAt === design?.publishedAt) return;
    if (design && saved.draftSavedAt < design.draftSavedAt) return; // our own newer save is not in the cache yet
    if (!queue.replace(saved.draft)) return;
    contentRef.current = saved.draft;
    setContent(saved.draft);
    setDesign(saved);
  }, [saved?.draftSavedAt, saved?.publishedAt, save]); // eslint-disable-line react-hooks/exhaustive-deps

  const evDirty = JSON.stringify(evDraft) !== JSON.stringify(eventFields(event));
  // the event was saved (or changed in another tab): take the new values
  useEffect(() => { setEvDraft(eventFields(event)); }, [event.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  useBlocker(save !== 'saved' || evDirty, evDirty ? 'لم تُحفظ تعديلات تفاصيل المناسبة. هل تريد المغادرة دون حفظها؟' : 'آخر تعديلاتك على الدعوة لم تُحفظ بعد. هل تريد المغادرة؟');

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
  useEffect(() => { mounted.current = true; if (!saved) void persist(); return () => { mounted.current = false; clearTimeout(timer.current); }; }, []);

  const update = (patch: Partial<InvitationDesignContent>) => {
    const next = { ...contentRef.current, ...patch };
    contentRef.current = next;
    queue.update(next);
    setJustPublished(false);
    setContent(next);
    setSave('dirty');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(), 650);
  };

  const flushThen = async (go: () => void) => {
    if (save !== 'saved') {
      const d = await persist();
      if (!d) { toast({ tone: 'danger', text: 'تعذر حفظ آخر التعديلات. أعد المحاولة قبل المغادرة.' }); return; }
    }
    go();
  };

  const designState = publishState(design ? { ...design, draft: content } : null);
  const ps = evDirty && (designState === 'published' || designState === 'changed') ? 'changed' : designState;
  const doPublish = async () => {
    if (publishing) return;
    setPublishError(undefined);
    const errors = validateEventFields(event, evDraft, services.clock.now());
    setEventErrors(errors);
    if (Object.keys(errors).length) {
      setSection('event');
      if (phone) setSheet('full');
      setPublishError('راجع الحقول الموضّحة، ثم انشر الدعوة.');
      requestAnimationFrame(() => { panel.current?.querySelector<HTMLElement>(`[data-event-field="${Object.keys(errors)[0]}"]`)?.focus(); });
      return;
    }
    setPublishing(true);
    if (save !== 'saved' && !(await persist())) { setPublishing(false); setPublishError('لم نتمكن من حفظ التعديلات، لذلك لم تُنشر. أعد المحاولة.'); return; }
    try {
      if (evDirty) await services.events.update(event.id, {
        date: evDraft.date, time: evDraft.time,
        venue: { ...event.venue, name: evDraft.venue.trim(), city: evDraft.city.trim(), mapUrl: evDraft.mapUrl.trim() || undefined },
        settings: { defaultPartySize: evDraft.partySize },
      });
      const d = await services.invitations.publish(event.id);
      setDesign(d);
      setJustPublished(true);
      // the published card takes the stage again
      if (phone) { (document.activeElement as HTMLElement | null)?.blur?.(); beforeTyping.current = null; setTyping(false); setSheet('peek'); setPage('card'); }
    } catch (e) {
      setPublishError(errorMessage(e));
    } finally {
      setPublishing(false);
    }
  };

  const shown = useMemo(() => previewEvent(event, evDraft), [event, evDraft]);
  const invitation = useMemo(() => toInvitationData(shown, content, event.settings.defaultPartySize), [shown, content, event.settings.defaultPartySize]);
  const guestPreview = () => void flushThen(() => navigate(`${paths.preview(event.id)}?from=design&section=${section}`, { force: !evDirty }));
  const changeTemplate = () => void flushThen(() => navigate(paths.templates(event.id), { force: !evDirty }));
  const close = () => void flushThen(() => navigate(paths.invitation(event.id), { force: !evDirty }));

  const publishBtn = ps !== 'published' && !mayPublish
    // a team member sees where publishing lives and who does it, in the button's place (domain/roles)
    ? <span className="ed-publish ed-publish-owner" role="note"><Icon name="lock" size="sm" />النشر لصاحب المناسبة</span>
    : ps === 'published'
    ? <Button variant="secondary" className="ed-publish is-done" icon="users" onClick={() => void flushThen(() => navigate(paths.guests(event.id)))}>إلى الضيوف</Button>
    : <Button variant="primary" className="ed-publish" loading={publishing} icon="send" onClick={() => void doPublish()}>{ps === 'changed' ? 'انشر التعديلات' : 'انشر الدعوة'}</Button>;

  // phone sheet: three stops (peek = the section toolbar only · half · full, which still keeps a mini card above).
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
  // phones: the tab row is the toolbar — a section opens the sheet; the open section's tab hides it again
  const onTabs = (e: React.MouseEvent) => {
    if (!phone) return;
    const tab = (e.target as HTMLElement).closest('[role="tab"]');
    if (!tab) return;
    const value = tab.id.replace('ed-tab-', '') as EditorSection;
    if (sheet === 'peek') setSheet(value === 'design' || value === 'event' ? 'full' : 'half');
    else if (value === section) setSheet('peek');
  };

  const live = mode === 'preview' && !phone;
  const saveLabel = save === 'error' ? <><Icon name="alert" size="sm" />تعذر الحفظ</>
    : save === 'saved' ? <><Icon name="check" size="sm" />تم الحفظ</>
    // pending and in-flight read the same, so the status does not flicker while typing
    : <><span className="ed-save-dot" aria-hidden="true" />جارٍ الحفظ…</>;
  const pubLabel = ps === 'published' ? 'منشورة' : ps === 'changed' ? 'تعديلات غير منشورة' : 'مسودة لم تُنشر';

  return (
    <div className={`ed ed-v3 mode-${live ? 'preview' : 'edit'} at-${sheet}${typing ? ' is-typing' : ''}`} data-sheet={sheet}>
      <a href="#editor-controls" className="skip-link">تخطَّ إلى أدوات الدعوة</a>
      <header className="ed-bar">
        <div className="ed-brand-cluster">
          <button type="button" className="ed-brand" aria-label="ضيوفي — حفظ والعودة إلى المناسبة" onClick={close}><Logo height={28} /></button>
          <button type="button" className="ed-close" aria-label="حفظ وإغلاق المحرر" onClick={close}><Icon name="back" /></button>
        </div>
        <div className="ed-title">
          <h1 className="ed-h">تصميم الدعوة</h1>
          <span className="ed-sub truncate">{event.title}</span>
          <span className="ed-status-line" aria-hidden="true"><span className={`ed-status-save is-${save}`}>{saveLabel}</span><span className={`ed-status-pub is-${ps}`}>{pubLabel}</span></span>
        </div>
        <div className="ed-status">
          <AccountMenu />
          <span className={`save-state is-${save}`} role="status" aria-live="polite">{saveLabel}</span>
          {save === 'error' && <Button size="sm" onClick={() => void persist()}>أعد المحاولة</Button>}
          <span className={`ed-pub is-${ps}`}><span className="ed-pub-dot" aria-hidden="true" />{ps === 'published' ? 'منشورة' : ps === 'changed' ? 'منشورة · تعديلات غير منشورة' : 'مسودة لم تُنشر'}</span>
        </div>
        <div className="ed-actions">
          <Button variant="secondary" icon="eye" className="ed-preview-btn" onClick={guestPreview}>{t('editorPreview')}</Button>
          <IconButton variant="secondary" icon="eye" className="ed-preview-icon" label={t('editorPreview')} onClick={guestPreview} />
          {publishBtn}
        </div>
      </header>

      <SealStamp show={justPublished} label="نُشرت دعوتك" />
      <div className="ed-main">
        <aside ref={panel} inert={publishing} className="ed-panel" aria-label="أدوات التصميم">
          <div className="ed-handle-row">
            <button type="button" className="ed-handle" aria-label={`لوحة التعديل: ${sheet === 'full' ? 'مكبّرة' : sheet === 'peek' ? 'مصغّرة' : 'بالمنتصف'}. اسحب أو استخدم الأسهم للأعلى والأسفل`} aria-expanded={sheet !== 'peek'}
              data-gesture-surface data-stop={sheet}
              {...handleGesture} onKeyDown={sheetKeys} onClick={(e) => { if (e.detail === 0) setSheet((v) => v === 'full' ? 'half' : 'full'); }}>
              <span aria-hidden="true" />
            </button>
            {sheet !== 'peek' && <IconButton size="sm" icon="chevron-down" className="ed-sheet-hide" label={t('editorHideTools')} onClick={() => { (document.activeElement as HTMLElement | null)?.blur?.(); beforeTyping.current = null; setSheet('peek'); }} />}
          </div>
          <div className="ed-tabs-wrap" onClick={onTabs}>
            <Segmented label="أقسام المحرر" panels="ed" value={section} onChange={(v: EditorSection) => setSection(v)} options={SECTIONS} className="ed-tabs" />
          </div>
          <div className="ed-panel-body" role="tabpanel" id={`ed-${section}`} aria-labelledby={`ed-tab-${section}`} onFocusCapture={(e) => { const node = e.target as HTMLElement; if (node.closest('.ed-content-message')) setPage('message'); else if (node.closest('.ed-program-disclosure')) setPage('program'); else if (node.closest('.ed-content-names')) setPage('card'); }}>
            <span id="editor-controls" tabIndex={-1} />
            {publishError && <Banner tone="danger" compact title="لم تُنشر الدعوة">{publishError}</Banner>}
            {loc.search.get('first') === '1' && section === 'content' && <div className="ed-simple-intro"><Icon name="check-circle" size="sm" /><p><strong>دعوتك جاهزة للتعديل.</strong> راجع التفاصيل، ثم عاين وانشر.</p></div>}
            {section === 'content' && <ContentSection event={event} content={content} update={update} />}
            {section === 'design' && <DesignSection event={shown} content={content} invitation={invitation} update={update} onChangeTemplate={changeTemplate} />}
            {section === 'motion' && <MotionSection content={content} invitation={invitation} update={update} sound={sound} onSound={setSound} />}
            {section === 'event' && <EventSection event={event} draft={evDraft} onDraft={(d) => { setEvDraft(d); setEventErrors({}); }} validationErrors={eventErrors} />}
          </div>
        </aside>

        <section className="ed-stage" aria-label="معاينة الدعوة">
          <div className="ed-stage-heading">
            <div><p className="ed-stage-kicker">{live ? 'التجربة الكاملة' : 'على طاولة التصميم'}</p><p className="ed-stage-caption">{live ? 'شاهد الدعوة كما تُفتح لضيوفكم' : 'دعوتك، بكل تفاصيلها'}</p></div>
            <Segmented label="عرض الاستوديو" value={mode} onChange={setMode} options={[{ value: 'edit', label: 'تعديل', icon: 'edit' }, { value: 'preview', label: 'معاينة', icon: 'play' }]} />
          </div>
          {justPublished && <div className="ed-published" role="status"><Icon name="check-circle" size="sm" /><p><strong>دعوتك جاهزة للضيوف.</strong> ابدأ بقائمة الضيوف، ثم شارك رابط كل دعوة.</p><Button size="sm" onClick={() => navigate(paths.guests(event.id))}>أضف الضيوف</Button></div>}
          {!live ? <>
            <div className="ed-page-swipe" key={page} ref={pager.ref} data-pager="" data-enter={pager.enter} {...pager.gesture}>
              <EditorWorkbench event={shown} content={content} page={page} motion={cardMotion} />
            </div>
            <div className="ed-stage-tools ed-canvas-bar">
              <Segmented className="ed-canvas-tabs" size="sm" label="صفحة الدعوة المعروضة" value={page} onChange={setPage} options={PAGES} />
              <span className="ed-canvas-caption">{CARD_NAMES[content.cardId] ?? 'دعوتك'} <span aria-hidden="true">·</span> تتغيّر مع كتابتك</span>
              <span className="ed-canvas-actions">
                {page === 'card' && <IconButton size="sm" variant="ghost" icon="play" className="ed-motion-replay" label="شغّل حركة البطاقة" onClick={() => setCardMotion((n) => n + 1)} />}
                <IconButton size="sm" variant="ghost" icon="expand" className="ed-workbench-expand" label="تكبير البطاقة" onClick={() => setExpanded(true)} />
              </span>
            </div>
          </> : <>
            <div className="ed-screen-wrap"><div className="ed-screen"><LivePreview start="intro" invitation={invitation} content={content} replayToken={replay} muted={!sound} /></div></div>
            <div className="ed-stage-tools">
              <Button size="sm" variant="ghost" icon="play" onClick={() => setReplay((n) => n + 1)}>أعد العرض</Button>
              <IconButton size="sm" icon={sound ? 'volume' : 'mute'} label={sound ? 'أوقف الصوت في المعاينة' : 'شغّل الصوت في المعاينة'} aria-pressed={sound} onClick={() => setSound((v) => !v)} />
            </div>
          </>}
        </section>
      </div>
      {expanded && <ExpandedCard event={shown} content={content} page={page} onClose={() => setExpanded(false)} />}
    </div>
  );
}
