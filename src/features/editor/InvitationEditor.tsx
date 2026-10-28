/**
 * Invitation editor — a controlled, template-based studio (not a free canvas).
 *
 * Desktop: the live invitation is the visual anchor; controls sit in an RTL panel with four sections
 *   المحتوى · التصميم · الحركة والصوت · تفاصيل المناسبة
 * Phone: preview-first. "تعديل" shows an instant poster of the invitation above a bottom sheet
 *   (half / full, never closes by accident); "معاينة" plays the real invitation full height.
 *
 * Rules kept from the platform designer:
 * - every invitation change autosaves to the draft (debounced) and the bar always says so
 * - publishing snapshots the draft for guests; draft / published / unpublished changes are explicit
 * - event data (date, time, venue) is edited in its own section and saved to the EVENT, with a clear
 *   notice that it changes everywhere — the preview shows edits instantly, before saving
 * - "تغيير القالب" saves first, then opens the gallery; a template never erases texts
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Event, InvitationDesign, InvitationDesignContent } from '../../domain/types';
import { Logo } from '../../ui/brand';
import { eventTypeInfo } from '../../domain/event';
import { EditorWorkbench, type WorkbenchPage } from './EditorWorkbench';
import { AccountMenu } from '../account/AccountMenu';
import { usePointerGesture } from '../../ui/hooks/usePointerGesture';
import { sheetSnapHeight, swipeStep, type SheetPoint } from '../../domain/gestures';
import { haptic } from '../../ui/motion/motion';
import { SealStamp } from '../signature/SealStamp';
import { DraftQueue } from '../../domain/draft-queue';
import { defaultDesign, publishState, toInvitationData } from '../../domain/invitation';
import { Banner, Button, ErrorState, Icon, IconButton, Segmented, Skeleton } from '../../ui';
import { useServices } from '../../app/data';
import { Link, useBlocker, useLocation, useNavigate } from '../../app/router';
import { paths } from '../../app/paths';
import { useToast } from '../../ui/primitives/Feedback';
import { errorMessage } from '../../services/errors';
import { useDesign, useEvent } from '../shared/queries';
import { LivePreview } from '../invitation/LivePreview';
import { ContentSection, DesignSection, EventSection, MotionSection, eventFields, previewEvent, type EventDraft } from './sections';

type SaveState = 'saved' | 'dirty' | 'saving' | 'error';
export type EditorSection = 'content' | 'design' | 'motion' | 'event';
const SECTIONS: Array<{ value: EditorSection; label: string; icon: 'type' | 'palette' | 'motion' | 'calendar' }> = [
  { value: 'content', label: 'المحتوى', icon: 'type' },
  { value: 'design', label: 'الشكل', icon: 'palette' },
  { value: 'motion', label: 'التجربة', icon: 'motion' },
  { value: 'event', label: 'المناسبة', icon: 'calendar' },
];

function useMedia(q: string) {
  const get = () => typeof matchMedia === 'function' && matchMedia(q).matches;
  const [m, setM] = useState(get);
  useEffect(() => { const mq = matchMedia(q); const on = () => setM(mq.matches); mq.addEventListener('change', on); return () => mq.removeEventListener('change', on); }, [q]);
  return m;
}

export function InvitationEditor({ eventId }: { eventId: string }) {
  const ev = useEvent(eventId);
  const design = useDesign(eventId);
  if (ev.error || design.error) return <div className="ed-state"><ErrorState error={ev.error || design.error} onRetry={() => { ev.refetch(); design.refetch(); }} /></div>;
  if (ev.loading || design.loading || !ev.data) return <div className="ed-state"><Skeleton lines={6} block /></div>;
  return <Editor event={ev.data} saved={design.data ?? null} />;
}

function Editor({ event, saved }: { event: Event; saved: InvitationDesign | null }) {
  const services = useServices();
  const navigate = useNavigate();
  const loc = useLocation();
  const toast = useToast();
  const phone = useMedia('(max-width: 959px)');

  useEffect(() => {
    if (!phone || !window.visualViewport) return;
    const vp = window.visualViewport;
    const sync = () => { const active = document.activeElement; const typing = active instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName); document.documentElement.style.setProperty('--editor-viewport', `${typing ? vp.height : window.innerHeight}px`); if (typing) setSheet('full'); };
    vp.addEventListener('resize', sync); document.addEventListener('focusin', sync); document.addEventListener('focusout', sync); sync();
    return () => { vp.removeEventListener('resize', sync); document.removeEventListener('focusin', sync); document.removeEventListener('focusout', sync); document.documentElement.style.removeProperty('--editor-viewport'); };
  }, [phone]);

  const [content, setContent] = useState<InvitationDesignContent>(saved?.draft ?? defaultDesign(event));
  const contentRef = useRef(content);
  const [save, setSave] = useState<SaveState>(saved ? 'saved' : 'dirty');
  const [design, setDesign] = useState<InvitationDesign | null>(saved);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | undefined>();
  const initial = loc.search.get('section') as EditorSection | null;
  const [section, setSection] = useState<EditorSection>(SECTIONS.some((s) => s.value === initial) ? initial! : 'content');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [page, setPage] = useState<WorkbenchPage>('card');
  // the face's entrance plays when the editor opens and on request; typing never restarts it
  const [cardMotion, setCardMotion] = useState(1);
  // phones: swipe the workbench sideways to turn the invitation's pages (RTL: the page follows the finger, right = next); the tabs remain
  const PAGES: WorkbenchPage[] = ['card', 'message', 'program'];
  const pageSwipe = usePointerGesture({ axis: 'x', onEnd: (g) => {
    if (!g.moved || g.cancelled) return;
    const step = swipeStep(g.dx, g.dy, g.duration);
    if (!step) return;
    setPage((p) => { const i = Math.max(0, Math.min(PAGES.length - 1, PAGES.indexOf(p) + step)); if (PAGES[i] !== p) haptic('snap'); return PAGES[i]!; });
  } });
  const [sheet, setSheet] = useState<SheetPoint>('half');
  const [replay, setReplay] = useState(0);
  const [sound, setSound] = useState(false);
  const [evDraft, setEvDraft] = useState<EventDraft>(() => eventFields(event));
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [queue] = useState(() => new DraftQueue(content, (value: InvitationDesignContent) => services.invitations.saveDraft(event.id, value), !saved));
  const [justPublished, setJustPublished] = useState(false);
  const mounted = useRef(true);

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

  const ps = publishState(design ? { ...design, draft: content } : null);
  const doPublish = async () => {
    setPublishError(undefined);
    if (evDirty) { setSection('event'); setPublishError('احفظ تفاصيل المناسبة أولًا، ثم انشر الدعوة.'); return; }
    setPublishing(true);
    if (save !== 'saved' && !(await persist())) { setPublishing(false); setPublishError('لم نتمكن من حفظ التعديلات، لذلك لم تُنشر. أعد المحاولة.'); return; }
    try {
      const d = await services.invitations.publish(event.id);
      setDesign(d);
      setJustPublished(true);
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

  const publishLabel = ps === 'published' ? 'منشورة' : ps === 'changed' ? 'انشر التعديلات' : 'انشر الدعوة';
  const publishBtn = (
    ps === 'published' ? <Button variant="quiet" className="ed-publish" icon="users" onClick={() => void flushThen(() => navigate(paths.guests(event.id)))}>إلى الضيوف</Button> : <Button variant="primary" className="ed-publish" loading={publishing} icon="send" onClick={() => void doPublish()}>{publishLabel}</Button>
  );

  // phone sheet: three stops (peek · half · full). The handle follows the finger, snaps by position and
  // velocity, a tap toggles half/full, arrow keys step between stops; it never closes while editing.
  const panel = useRef<HTMLElement>(null);
  const clearDrag = () => { panel.current?.style.removeProperty('--drag'); panel.current?.removeAttribute('data-dragging'); };
  const STOPS: SheetPoint[] = ['peek', 'half', 'full'];
  const handleGesture = usePointerGesture({ axis:'y', enabled:phone,
    onMove:dy=>{panel.current?.setAttribute('data-dragging','true');panel.current?.style.setProperty('--drag',`${Math.max(-420,Math.min(360,dy))}px`);},
    onEnd:g=>{
      const h=panel.current?.getBoundingClientRect().height??0;
      clearDrag();
      if(g.cancelled)return; // pointer cancel restores the previous stop
      if(!g.moved){setSheet(s=>s==='full'?'half':s==='peek'?'half':'full');return;}
      const viewport = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--editor-viewport')) || window.innerHeight;
      const bar = document.querySelector('.ed-bar')?.getBoundingClientRect().height ?? 56;
      const dock = document.querySelector('.ed-dock')?.getBoundingClientRect().height ?? 68;
      const full = Math.max(0, viewport - bar - dock - 12);
      setSheet(s=>sheetSnapHeight(h,g.velocity,s,{peek:Math.min(viewport*.22,full),half:Math.min(viewport*.54,full),full}));
    }
  });
  const sheetKeys = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    setSheet(s => STOPS[Math.max(0, Math.min(2, STOPS.indexOf(s) + (e.key === 'ArrowUp' ? 1 : -1)))]!);
  };

  const live = mode === 'preview';
  const saveLabel = save === 'saving' ? <><span className="spinner" aria-hidden="true" />جارٍ الحفظ…</>
    : save === 'dirty' ? <>تعديلات لم تُحفظ بعد</>
    : save === 'error' ? <><Icon name="alert" size="sm" />تعذر الحفظ</>
    : <><Icon name="check" size="sm" />تم الحفظ</>;

  return (
    <div className={`ed is-${mode} sheet-${sheet} ed-signature`}>
      <a href="#editor-controls" className="skip-link">تخطَّ إلى أدوات الدعوة</a>
      <header className="ed-bar">
        <div className="ed-brand-cluster">{<button type="button" className="ed-brand" aria-label="ضيوفي — حفظ والعودة إلى المناسبة" onClick={() => void flushThen(() => navigate(paths.invitation(event.id), { force: !evDirty }))}><Logo height={28} /></button>}<button type="button" className="ed-close" aria-label="حفظ وإغلاق المحرر" onClick={() => void flushThen(() => navigate(paths.invitation(event.id), { force: !evDirty }))}><Icon name="back" /></button></div>
        <div className="ed-title">
          <h1 className="ed-h">تصميم الدعوة</h1>
          <span className="ed-sub truncate">{event.title}</span>
        </div>
        <div className="ed-status" aria-live="polite">
          <AccountMenu />
          <span className={`save-state is-${save}`}>{saveLabel}</span>
          {save === 'error' && <Button size="sm" onClick={() => void persist()}>أعد المحاولة</Button>}
          <span className={`ed-pub is-${ps}`}><span className="ed-pub-dot" aria-hidden="true" />{ps === 'published' ? 'منشورة' : ps === 'changed' ? 'منشورة · تعديلات غير منشورة' : 'مسودة لم تُنشر'}</span>
        </div>
        <div className="ed-actions">
          <Button variant="secondary" icon="eye" onClick={guestPreview}>معاينة كضيف</Button>
          {publishBtn}
        </div>
      </header>
      {publishError && <div className="ed-alert"><Banner tone="danger" compact title="لم تُنشر الدعوة">{publishError}</Banner></div>}

      {<SealStamp show={justPublished} label="نُشرت دعوتك" />}
      {justPublished && <div className="ed-alert"><Banner tone="success" compact title="دعوتك جاهزة للضيوف" action={<Button size="sm" onClick={()=>navigate(paths.guests(event.id))}>أضف الضيوف</Button>}>ابدأ بقائمة الضيوف، ثم شارك رابط كل دعوة.</Banner></div>}
      <div className="ed-main">
        <aside ref={panel} inert={publishing} className="ed-panel" aria-label="أدوات التصميم">
          <button type="button" className="ed-handle" aria-label={`لوحة التعديل: ${sheet === 'full' ? 'مكبّرة' : sheet === 'peek' ? 'مصغّرة' : 'بالمنتصف'}. اسحب أو استخدم الأسهم للأعلى والأسفل`} aria-expanded={sheet === 'full'}
            data-gesture-surface data-stop={sheet}
            {...handleGesture} onKeyDown={sheetKeys} onClick={e=>{if(e.detail===0)setSheet(v=>v==='full'?'half':'full');}}>
            <span aria-hidden="true" />
          </button>
          {<div className="ed-studio-heading"><p className="ed-studio-kicker"><span aria-hidden="true" />استوديو ضيوفي <span className="ed-studio-occasion">{eventTypeInfo(event.type).label}</span></p><h2>دعوة تحمل لمستك.</h2><p>الأسماء والكلمة جاهزة. عدّل ما تحب، ونحفظه تلقائيًا.</p></div>}
          <Segmented label="أقسام المحرر" panels="ed" value={section} onChange={(v: EditorSection)=>{setSection(v);if(phone && (v==='event'||v==='design'))setSheet('full');}} options={SECTIONS} className="ed-tabs" />
          <div className="ed-panel-body" role="tabpanel" id={`ed-${section}`} aria-labelledby={`ed-tab-${section}`} onFocusCapture={e => { const node = e.target as HTMLElement; if (node.closest(".ed-content-message")) setPage("message"); else if (node.closest(".ed-program-disclosure")) setPage("program"); else if (node.closest(".ed-content-names")) setPage("card"); }}>
            <span id="editor-controls" tabIndex={-1} />
            {loc.search.get('first')==='1' && section==='content' && <div className="ed-simple-intro"><Icon name="check-circle" size="sm" /><p><strong>دعوتك جاهزة للتعديل.</strong> راجع التفاصيل، ثم عاين وانشر.</p></div>}
            {section === 'content' && <ContentSection event={event} content={content} update={update} />}
            {section === 'design' && <DesignSection event={shown} content={content} invitation={invitation} update={update} onChangeTemplate={changeTemplate} />}
            {section === 'motion' && <MotionSection content={content} invitation={invitation} update={update} sound={sound} onSound={setSound} />}
            {section === 'event' && <EventSection event={event} draft={evDraft} onDraft={setEvDraft} />}
          </div>
        </aside>

        <section className="ed-stage" aria-label="معاينة الدعوة">
          <div className="ed-stage-heading"><div><p className="ed-stage-kicker">{live ? 'التجربة الكاملة' : 'على طاولة التصميم'}</p><p className="ed-stage-caption">{live ? 'شاهد الدعوة كما تُفتح لضيوفك' : 'دعوتك، بكل تفاصيلها'}</p></div><Segmented label="عرض الاستوديو" value={mode} onChange={setMode} options={[{value:'edit',label:'تعديل',icon:'edit'},{value:'preview',label:'معاينة',icon:'play'}]} /></div>
          {!live && <Segmented className="ed-canvas-tabs" label="صفحة الدعوة المعروضة" value={page} onChange={setPage} options={[{value:'card',label:'البطاقة'},{value:'message',label:'الكلمة'},{value:'program',label:'البرنامج'}]} />}
          {!live ? <div className="ed-page-swipe" {...pageSwipe}><EditorWorkbench event={shown} content={content} page={page} motion={cardMotion} />{page === 'card' && <button type="button" className="ed-motion-replay" onClick={() => setCardMotion((n) => n + 1)}><Icon name="play" size="sm" />شغّل حركة البطاقة</button>}</div> : <div className="ed-screen-wrap">
            <div className="ed-screen"><LivePreview start="card" invitation={invitation} content={content} replayToken={replay} muted={!sound} /></div>
          </div>}
          {live && (
            <div className="ed-stage-tools">
              <Button size="sm" variant="ghost" icon="play" onClick={() => setReplay((n) => n + 1)}>أعد العرض</Button>
              <IconButton size="sm" icon={sound ? 'volume' : 'mute'} label={sound ? 'أوقف الصوت في المعاينة' : 'شغّل الصوت في المعاينة'} aria-pressed={sound} onClick={() => setSound((v) => !v)} />
              <Button size="sm" variant="ghost" icon="expand" className="ed-only-phone" onClick={guestPreview}>كضيف</Button>
            </div>
          )}
          {!live && <p className="ed-studio-safe"><Icon name="check-circle" size="sm" />الكتابة تتحدّث هنا فورًا. شغّل المعاينة لمشاهدة الحركة والصوت.</p>}
        </section>
      </div>

      <footer className="ed-dock">
        <Segmented label="وضع العرض" value={mode} onChange={setMode} options={[{ value: 'edit', label: 'تعديل', icon: 'edit' }, { value: 'preview', label: 'معاينة', icon: 'play' }]} />
        {publishBtn}
      </footer>
    </div>
  );
}
