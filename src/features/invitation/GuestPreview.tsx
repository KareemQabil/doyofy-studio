/**
 * "What guests will see" preview of the latest draft, from the guest's first screen (the sealed envelope) to the
 * invitation itself. Phones: full-bleed under one slim bar. Desktop: a device frame standing on the invitation's
 * own setting. Replies are not recorded.
 */
import { useEffect, useRef, useState } from 'react';
import type { GuestView } from '../../services/contracts';
import { defaultDesign, publishState, toInvitationData } from '../../domain/invitation';
import { ErrorState, Icon, PageLoader } from '../../ui';
import { Link, useLocation } from '../../app/router';
import { paths } from '../../app/paths';
import { useCopy } from '../../ui/copy';
import { useDesign, useEvent } from '../shared/queries';
import { SealCover } from '../signature/SealCover';
import { SceneBackdrop } from './SceneBackdrop';
import { loadEngine } from './engine';

export function GuestPreview({ eventId }: { eventId: string }) {
  const ev = useEvent(eventId);
  const design = useDesign(eventId);
  const loc = useLocation();
  const { t } = useCopy();
  const host = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<unknown>(null);
  // the guest's first screen is the envelope; «افتح الدعوة» plays the invitation, «الموعد…» opens it at the card
  const [phase, setPhase] = useState<{ at: 'cover' | 'invitation'; start: 'intro' | 'card'; run: number }>({ at: 'cover', start: 'intro', run: 0 });
  const back = loc.search.get('from') === 'design' ? `${paths.design(eventId)}${loc.search.get('section') ? `?section=${loc.search.get('section')}` : ''}` : paths.invitation(eventId);
  const event = ev.data;
  const content = design.data?.draft ?? (event ? defaultDesign(event) : null);
  const publication = publishState(design.data);

  useEffect(() => {
    if (phase.at !== 'invitation' || !event || !content || !host.current) return;
    let studio: { destroy(): void } | null = null;
    let alive = true;
    loadEngine().then((eng) => {
      if (!alive || !host.current) return;
      studio = new eng.Studio(host.current, {
        invitation: toInvitationData(event, content, event.settings.defaultPartySize),
        card: content.cardId, scene: content.sceneId, experience: content.experience, start: phase.start,
        embedded: true, showSwitcher: false, params: new URLSearchParams(), authorNotes: true, // organizer-only hints (an upload missing on this device)
        guest: { name: t('shGuestName'), nameLocked: true, maxGuests: event.settings.defaultPartySize },
        rsvp: { submit: async () => ({ ok: true, id: 'preview' }) },
      });
      (window as unknown as { __studio?: unknown }).__studio = studio;
    }).catch(setErr);
    return () => { alive = false; studio?.destroy(); };
  }, [event?.id, design.data?.draftSavedAt, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (ev.error || design.error || err) return <ErrorState error={ev.error || design.error || err} onRetry={() => location.reload()} />;
  const view: GuestView | null = event && content ? { event, design: content, party: null, canEdit: true, maxGuests: event.settings.defaultPartySize, phase: 'before' } : null;
  const note = publication === 'published' ? t('shPreviewPublished') : t('shPreviewDraft');
  return (
    <div className="preview-page">
      <div className="preview-bar" role="note">
        <span className="preview-bar-text"><Icon name="eye" size="sm" /><span><span className="preview-bar-long">{note}. {t('shNoReply')}.</span><span className="preview-bar-short">{publication === 'published' ? t('shPreviewShort') : t('shDraftShort')} · {t('shNoReply')}</span></span></span>
        <span className="preview-bar-actions">
          {phase.at === 'invitation' && <button type="button" className="preview-restart" aria-label={t('previewRestart')} onClick={() => setPhase((p) => ({ at: 'cover', start: 'intro', run: p.run + 1 }))}><Icon name="refresh" size="sm" /><span className="preview-bar-long">{t('previewRestart')}</span></button>}
          <Link to={back} className="preview-close" aria-label={t('shClosePreview')}><Icon name="close" size="sm" /><span className="preview-bar-long">{t('shClosePreview')}</span><span className="preview-bar-short">{t('close')}</span></Link>
        </span>
      </div>
      {content && <SceneBackdrop sceneId={content.sceneId} className="preview-backdrop" />}
      {!view ? <div className="preview-loading"><PageLoader name="envelope" label={t('shPreparing')} /></div>
        : <div className="preview-device">
          {phase.at === 'cover'
            ? <SealCover key={phase.run} view={view} onOpen={() => setPhase((p) => ({ ...p, at: 'invitation', start: 'intro' }))} onDetails={() => setPhase((p) => ({ ...p, at: 'invitation', start: 'card' }))} />
            : <div key={phase.run} ref={host} className="preview-host" />}
        </div>}
    </div>
  );
}
