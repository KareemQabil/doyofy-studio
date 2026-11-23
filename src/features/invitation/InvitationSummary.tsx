/**
 * Invitation section (spec §10): the current design — always live, so what is shown here is what guests get —
 * and the actions: edit design · preview as guest · «أرسل للضيوف». No publish step: before the first save the
 * occasion's default design is already the guests' invitation.
 */
import { useGuestLink } from '../shared/share-link';
import type { Event } from '../../domain/types';
import { CARD_NAMES, SCENE_NAMES, liveDesign, resolvedNames } from '../../domain/invitation';
import { useCopy } from '../../ui/copy';
import { relativeTime } from '../../domain/format';
import { countParties } from '../../domain/parties';
import { isCoupleEvent } from '../../domain/event';
import { Badge, ErrorState, Icon, KeyValue, LinkButton, PageHeader, Panel, PageLoader } from '../../ui';
import { useNow } from '../../app/data';
import { paths } from '../../app/paths';
import { useDesign, useParties } from '../shared/queries';
import { CardThumb } from './CardThumb';
import { SceneBackdrop } from './SceneBackdrop';
import { CopyField } from '../shared/CopyField';

export function InvitationSummary({ event }: { event: Event }) {
  const design = useDesign(event.id);
  const parties = useParties(event.id);
  const now = useNow();
  const { t, dialect } = useCopy();
  const guestLink = useGuestLink(event);
  if (design.loading) return <PageLoader />;
  if (design.error) return <ErrorState error={design.error} onRetry={design.refetch} />;
  const d = design.data ?? null;
  const c = parties.data ? countParties(parties.data) : null;

  const content = liveDesign(d, event);
  const names = resolvedNames(event, content);
  if (!isCoupleEvent(event.type)) names.b = '';
  const xLabel = content.experience.motion === 'animated' ? t('ivAnimated') : t('ivStatic');
  const generalLink = guestLink();
  // the one forward action: send to guests (or add them first when the list is still empty)
  const primary = (
    <LinkButton to={paths.guests(event.id, { filter: c && c.parties === 0 ? undefined : 'not_shared' })} variant="primary" size="lg" icon="send">{c && c.parties === 0 ? t('ovGuestsLabel') : t('ivShare')}</LinkButton>
  );

  return (
    <>
      <PageHeader title={t('wsInvitation')} subtitle={t('ivLiveSub')} />

      <div className="invite-layout">
        <Panel className="invite-card-panel">
          {/* the card stands on its own setting — what the guest sees around it — instead of a decorative photo */}
          <SceneBackdrop sceneId={content.sceneId} className="invite-scene" />
          <div className="invite-card">
            <CardThumb event={event} content={content} width={240} label={t('ivCardLabel', { card: CARD_NAMES[content.cardId] ?? '', names: `${names.a}${names.b ? ` و${names.b}` : ''}` })} />
            <div className="stack gap-2 invite-card-actions">
              <LinkButton to={paths.design(event.id)} variant="secondary" icon="edit" block>{t('ivEditDesign')}</LinkButton>
              <LinkButton to={paths.preview(event.id)} variant="ghost" icon="eye" block>{t('ivAsGuest')}</LinkButton>
            </div>
          </div>
        </Panel>

        <div className="stack gap-6">
          <Panel title={t('ivKnow')}>
            <KeyValue items={[
              { k: t('ivMotion'), v: xLabel, icon: 'sparkle' },
              { k: t('ivCard'), v: CARD_NAMES[content.cardId] ?? content.cardId },
              { k: t('ivScene'), v: SCENE_NAMES[content.sceneId] ?? content.sceneId },
              { k: t('ivNames'), v: <>{names.a}{names.b ? ` و${names.b}` : ''} {names.fromEvent ? <Badge tone="neutral">{t('ivFromEvent')}</Badge> : <Badge tone="info">{t('ivOwn')}</Badge>}</> },
              ...(d ? [{ k: t('ivLastSave'), v: relativeTime(d.draftSavedAt, now, dialect), icon: 'clock' as const }] : []),
            ]} />
            <div className="row wrap gap-2 invite-primary">{primary}</div>
          </Panel>

          <Panel title={t('ivLinks')}>
            <div className="stack gap-4">
              <p className="muted t-sm"><Icon name="user" size="sm" className="inline-icon" />{t('ivPersonal')}</p>
              {event.settings.allowGeneralLink ? (
                <CopyField label={t('ivGeneral')} value={generalLink} hint={t('ivGeneralHint')} />
              ) : (
                <p className="faint t-sm">{t('ivGeneralOff')}</p>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
