/**
 * Template gallery (inside an event) — the same full-screen design feed as creation step 2.
 * - one design family per screen, ordered for the occasion (suited first); style filters live in a small sheet
 * - every card is rendered live with the event's names and date
 * - nothing is applied by browsing: «استخدم التصميم» applies it and returns to the editor
 * - a template changes only the look; names, texts and program stay (domain/templates.applyPreset)
 * Reached from the editor, or right after creating an event (?first=1, with "decide later").
 */
import { useMemo, useState } from 'react';
import type { Event, InvitationDesign } from '../../domain/types';
import { defaultDesign } from '../../domain/invitation';
import { applyPreset, presetById, presetOf, type TemplatePreset } from '../../domain/templates';
import { Banner, Button, ErrorState, FocusLayout, LinkButton, PageLoader } from '../../ui';
import { useMutation } from '../../app/data';
import { useLocation, useNavigate } from '../../app/router';
import { paths } from '../../app/paths';
import { errorMessage } from '../../services/errors';
import { useCopy } from '../../ui/copy';
import { useDesign, useEvent } from '../shared/queries';
import { TemplateFeed } from './TemplateFeed';
import { useDesignFeed } from './design-feed';

export function TemplateGallery({ eventId }: { eventId: string }) {
  const ev = useEvent(eventId);
  const design = useDesign(eventId);
  const { t } = useCopy();
  const loc = useLocation();
  const first = loc.search.get('first') === '1';
  const back = first ? { to: paths.overview(eventId), label: t('tgLater') } : { to: paths.design(eventId), label: t('tgBack') };
  if (ev.error || design.error) return <FocusLayout title={t('templatesTitle')} back={back}><ErrorState error={ev.error || design.error} onRetry={() => { ev.refetch(); design.refetch(); }} /></FocusLayout>;
  if (ev.loading || design.loading || !ev.data) return <FocusLayout title={t('templatesTitle')} back={back} width="wide"><PageLoader /></FocusLayout>;
  return <Gallery event={ev.data} design={design.data ?? null} first={first} back={back} />;
}

function Gallery({ event, design, first, back }: { event: Event; design: InvitationDesign | null; first: boolean; back: { to: string; label: string } }) {
  const navigate = useNavigate();
  const loc = useLocation();
  const { t } = useCopy();
  const base = design?.draft ?? defaultDesign(event);
  const current = design ? presetOf(design.draft) : undefined;
  // a design link (?template=) opens the feed on exactly that design and scene
  const [linked] = useState(() => presetById(loc.search.get('template') ?? ''));
  const feed = useDesignFeed(event.type, linked?.id ?? current?.id);
  const [browsed, setBrowsed] = useState<TemplatePreset | null>(() => linked ?? current ?? null);
  const shown = useMemo(() => feed.list.find(p => p.cardId === browsed?.cardId) ?? feed.list[0] ?? null, [feed.list, browsed]);

  // apply onto the latest saved draft, not this render's copy: edits flushed just before opening the
  // gallery may still be revalidating here, and a template must never undo them
  const use = useMutation(async (s, p: TemplatePreset) => {
    const latest = await s.invitations.get(event.id);
    return s.invitations.saveDraft(event.id, applyPreset(latest?.draft ?? base, p));
  }, {
    onSuccess: () => navigate(paths.design(event.id), { force: true }),
  });
  const isCurrent = !!shown && current?.id === shown.id;

  return (
    <FocusLayout width="full" title={t('templatesTitle')} back={back}
      right={first ? <LinkButton to={paths.overview(event.id)} variant="ghost" size="sm">{t('tgChooseLater')}</LinkButton> : undefined}
      footer={<><span className="wz-foot-note">{first ? t('tgCreated', { title: event.title }) : t('tgOnlyLook')}</span><Button variant="primary" size="lg" loading={use.pending} disabled={!shown} onClick={() => shown && (isCurrent ? navigate(paths.design(event.id)) : void use.run(shown))}>{isCurrent ? t('tgKeep') : t('templateUse')}</Button></>}>
      <div className="wz-feed-page">
        {use.error ? <Banner tone="danger" title={t('tgFailed')}>{errorMessage(use.error)}</Banner> : null}
        <TemplateFeed presets={feed.list} preset={shown} event={event} base={base} current={current?.id} pending={use.pending} onNavigate={setBrowsed}
          filters={feed.filters} filter={feed.filter} onFilter={feed.setFilter} emptyAction={() => feed.setFilter('for-you')} />
      </div>
    </FocusLayout>
  );
}
