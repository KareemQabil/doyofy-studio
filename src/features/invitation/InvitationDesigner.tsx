/**
 * Invitation design (focus mode): hosts the existing 5-step wizard in platform mode.
 * - starts from the event's saved design (or a default made from the event)
 * - every change autosaves to the InvitationRepository (debounced) — the bar always says whether it's saved
 * - "Publish" snapshots the draft for guests; "Preview as guest" opens the full-screen preview
 * The organizer always knows: editing the INVITATION (not the event) · saved? · published?
 */
import { useEffect, useRef, useState } from 'react';
import type { Event, InvitationDesign, InvitationDesignContent } from '../../domain/types';
import { defaultDesign, publishState, toInvitationData } from '../../domain/invitation';
import { Badge, Button, ErrorState, FocusLayout, Icon, Skeleton } from '../../ui';
import { useServices } from '../../app/data';
import { useBlocker, useLocation, useNavigate, useRouter } from '../../app/router';
import { paths } from '../../app/paths';
import { useToast } from '../../ui/primitives/Feedback';
import { errorMessage } from '../../services/errors';
import { useDesign, useEvent } from '../shared/queries';
import { loadEngine } from './engine';
import { contentFromState, eventSummaryForWizard, stateFromContent } from './design-mapping';
import type { Wizard } from '../../wizard/Wizard.js';

type SaveState = 'saved' | 'dirty' | 'saving' | 'error';

export function InvitationDesigner({ eventId }: { eventId: string }) {
  const ev = useEvent(eventId);
  const design = useDesign(eventId);
  if (ev.error || design.error) return <FocusLayout title="تصميم الدعوة" back={{ to: paths.invitation(eventId), label: 'رجوع' }}><ErrorState error={ev.error || design.error} onRetry={() => { ev.refetch(); design.refetch(); }} /></FocusLayout>;
  if (ev.loading || design.loading || !ev.data) return <FocusLayout title="تصميم الدعوة" back={{ to: paths.invitation(eventId), label: 'رجوع' }}><Skeleton lines={6} block /></FocusLayout>;
  return <Designer event={ev.data} saved={design.data ?? null} />;
}

function Designer({ event, saved }: { event: Event; saved: InvitationDesign | null }) {
  const services = useServices();
  const navigate = useNavigate();
  const { absolute } = useRouter();
  const loc = useLocation();
  const toast = useToast();
  const host = useRef<HTMLDivElement>(null);
  const wizard = useRef<Wizard | null>(null);
  const content = useRef<InvitationDesignContent>(saved?.draft ?? defaultDesign(event));
  const [save, setSave] = useState<SaveState>(saved ? 'saved' : 'dirty');
  const [design, setDesign] = useState<InvitationDesign | null>(saved);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | undefined>();
  const [engineError, setEngineError] = useState<unknown>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inflight = useRef<Promise<unknown> | null>(null);
  const stateRef = useRef({ design, publishing, publishError, save });
  stateRef.current = { design, publishing, publishError, save };

  useBlocker(save !== 'saved', 'آخر تعديلاتك على الدعوة لم تُحفظ بعد. هل تريد المغادرة؟');

  const persist = async () => {
    clearTimeout(timer.current);
    setSave('saving');
    const p = services.invitations.saveDraft(event.id, content.current);
    inflight.current = p;
    try {
      const d = await p;
      if (inflight.current === p) { setDesign(d); setSave('saved'); }
      return d;
    } catch {
      if (inflight.current === p) setSave('error');
      return null;
    }
  };

  // first visit: store the default design so "saved" is true from the start
  useEffect(() => { if (!saved) void persist(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let wz: Wizard | null = null;
    let alive = true;
    const startStep = Number(new URLSearchParams(loc.search).get('step') ?? (saved ? 0 : 0));
    loadEngine().then((eng) => {
      if (!alive || !host.current) return;
      wz = new eng.Wizard(host.current, {
        assetBase: 'assets/',
        startStep,
        platform: {
          initial: stateFromContent(event, content.current),
          eventSummary: eventSummaryForWizard(event),
          toInvitation: (st) => toInvitationData(event, contentFromState(event, st), event.settings.defaultPartySize),
          onChange: (st) => {
            content.current = contentFromState(event, st);
            setSave('dirty');
            clearTimeout(timer.current);
            timer.current = setTimeout(() => void persist(), 700);
          },
          onAction: (a) => {
            if (a === 'publish') void doPublish();
            if (a === 'preview-guest') void flushThen(() => navigate(`${paths.preview(event.id)}?from=design`, { force: true }));
            if (a === 'edit-event') void flushThen(() => navigate(paths.settings(event.id), { force: true }));
            if (a === 'done') void flushThen(() => navigate(paths.invitation(event.id), { force: true }));
          },
          status: () => {
            const s = stateRef.current;
            const ps = publishState(s.design ? { ...s.design, draft: content.current } : null);
            return { state: ps === 'none' ? 'draft' : ps, link: absolute(paths.guestLink(event.slug)), busy: s.publishing, error: s.publishError };
          },
        },
      });
      wizard.current = wz;
      (window as unknown as { __wizard?: unknown }).__wizard = wz;
    }).catch((e) => setEngineError(e));
    return () => { alive = false; wz?.destroy(); wizard.current = null; clearTimeout(timer.current); };
  }, [event.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // keep the publish step in sync with save/publish state
  useEffect(() => { wizard.current?.refresh(); }, [design, publishing, publishError]);

  const flushThen = async (go: () => void) => {
    if (stateRef.current.save !== 'saved') {
      const d = await persist();
      if (!d) { toast({ tone: 'danger', text: 'تعذر حفظ آخر التعديلات. أعد المحاولة قبل المغادرة.' }); return; }
    }
    go();
  };

  const doPublish = async () => {
    setPublishError(undefined);
    setPublishing(true);
    if (stateRef.current.save !== 'saved' && !(await persist())) {
      setPublishing(false); setPublishError('لم نتمكن من حفظ التعديلات، لذلك لم تُنشر. أعد المحاولة.');
      return;
    }
    try {
      const d = await services.invitations.publish(event.id);
      setDesign(d);
      toast({ tone: 'success', text: 'تم نشر الدعوة. الضيوف يرون الآن هذه النسخة.', action: { label: 'أضف الضيوف', run: () => navigate(paths.guests(event.id)) } });
    } catch (e) {
      setPublishError(errorMessage(e));
    } finally {
      setPublishing(false);
    }
  };

  const ps = publishState(design ? { ...design, draft: content.current } : null);
  const saveLabel = save === 'saving' ? <><span className="spinner" aria-hidden="true" />جارٍ الحفظ…</>
    : save === 'dirty' ? <>تعديلات غير محفوظة</>
    : save === 'error' ? <><Icon name="alert" size="sm" />تعذر الحفظ</>
    : <><Icon name="check" size="sm" />تم حفظ المسودة</>;

  return (
    <FocusLayout
      width="full"
      title={<>تصميم الدعوة <span className="faint t-sm">· {event.title}</span></>}
      back={{ to: paths.invitation(event.id), label: 'إغلاق' }}
      right={
        <div className="designer-status" aria-live="polite">
          <span className={`save-state is-${save}`}>{saveLabel}</span>
          {save === 'error' && <Button size="sm" onClick={() => void persist()}>أعد المحاولة</Button>}
          <Badge tone={ps === 'published' ? 'success' : ps === 'changed' ? 'info' : 'warning'}>{ps === 'published' ? 'منشورة' : ps === 'changed' ? 'تعديلات غير منشورة' : 'غير منشورة'}</Badge>
        </div>
      }
    >
      {engineError ? <ErrorState error={engineError} title="تعذر تحميل محرر الدعوة" onRetry={() => location.reload()} /> : <div ref={host} className="designer-host" />}
    </FocusLayout>
  );
}
