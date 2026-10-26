/** Full-screen "what guests will see" preview of the latest draft. Replies are not recorded. */
import { useEffect, useRef, useState } from 'react';
import { defaultDesign, publishState, toInvitationData } from '../../domain/invitation';
import { ErrorState, Icon, Skeleton } from '../../ui';
import { Link, useLocation } from '../../app/router';
import { paths } from '../../app/paths';
import { useDesign, useEvent } from '../shared/queries';
import { loadEngine } from './engine';

export function GuestPreview({ eventId }: { eventId: string }) {
  const ev = useEvent(eventId);
  const design = useDesign(eventId);
  const loc = useLocation();
  const host = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<unknown>(null);
  const back = loc.search.get('from') === 'design' ? `${paths.design(eventId)}${loc.search.get('section') ? `?section=${loc.search.get('section')}` : ''}` : paths.invitation(eventId);
  const event = ev.data;
  const content = design.data?.draft ?? (event ? defaultDesign(event) : null);
  const publication = publishState(design.data);

  useEffect(() => {
    if (!event || !content || !host.current) return;
    let studio: { destroy(): void } | null = null;
    let alive = true;
    loadEngine().then((eng) => {
      if (!alive || !host.current) return;
      studio = new eng.Studio(host.current, {
        invitation: toInvitationData(event, content, event.settings.defaultPartySize),
        card: content.cardId, scene: content.sceneId, experience: content.experience,
        showSwitcher: false, params: new URLSearchParams(),
        guest: { name: 'اسم الضيف', nameLocked: true, maxGuests: event.settings.defaultPartySize },
        rsvp: { submit: async () => ({ ok: true, id: 'preview' }) },
      });
      (window as unknown as { __studio?: unknown }).__studio = studio;
    }).catch(setErr);
    return () => { alive = false; studio?.destroy(); };
  }, [event?.id, design.data?.draftSavedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  if (ev.error || design.error || err) return <ErrorState error={ev.error || design.error || err} onRetry={() => location.reload()} />;
  return (
    <div className="preview-page">
      <div className="preview-bar" role="note">
        <span className="preview-bar-text"><Icon name="eye" size="sm" />{publication === 'published' ? 'معاينة الدعوة المنشورة' : 'معاينة المسودة — هذه التعديلات ليست منشورة للضيوف'}. لن يُسجل أي رد.</span>
        <Link to={back} className="preview-close"><Icon name="close" size="sm" />إغلاق المعاينة</Link>
      </div>
      {(ev.loading || design.loading) && <div className="preview-loading"><Skeleton lines={3} /></div>}
      <div ref={host} className="preview-host" />
    </div>
  );
}
