/**
 * Invitation section (spec §10): the current design, its state (draft / published / unpublished
 * changes), what guests will see, and the actions: edit design · preview as guest · publish · share.
 */
import { useGuestLink } from '../shared/share-link';
import type { Event } from '../../domain/types';
import { CARD_NAMES, PUBLISH_LABEL, SCENE_NAMES, publishState, resolvedNames } from '../../domain/invitation';
import { PUBLISH_KEY } from '../../domain/copy/activity';
import { useCopy } from '../../ui/copy';
import { relativeTime } from '../../domain/format';
import { countParties } from '../../domain/parties';
import { isCoupleEvent } from '../../domain/event';
import { Badge, Banner, Button, EmptyState, ErrorState, Icon, KeyValue, LinkButton, PageHeader, Panel, PageLoader } from '../../ui';
import { useMutation, useNow } from '../../app/data';
import { useRouter } from '../../app/router';
import { paths } from '../../app/paths';
import { useToast } from '../../ui/primitives/Feedback';
import { errorMessage } from '../../services/errors';
import { useDesign, useParties } from '../shared/queries';
import { CardThumb } from './CardThumb';
import { SceneBackdrop } from './SceneBackdrop';
import { CopyField } from '../shared/CopyField';
import { OwnerOnly, useCan } from '../shared/OwnerOnly';

export function InvitationSummary({ event }: { event: Event }) {
  const design = useDesign(event.id);
  const parties = useParties(event.id);
  const now = useNow();
  const toast = useToast();
  const { t, dialect } = useCopy();
  const { absolute } = useRouter();
  const publish = useMutation((s) => s.invitations.publish(event.id), {
    onSuccess: () => toast({ tone: 'success', text: t('ivPublished'), celebrate: true }),
  });

  const guestLink = useGuestLink(event);
  const mayPublish = useCan('invitation.publish');
  if (design.loading) return <PageLoader />;
  if (design.error) return <ErrorState error={design.error} onRetry={design.refetch} />;
  const d = design.data ?? null;
  const ps = publishState(d);
  const c = parties.data ? countParties(parties.data) : null;

  if (!d) {
    return (
      <>
        <PageHeader title={t('wsInvitation')} status={<Badge tone="neutral" dot>{t(PUBLISH_KEY.none)}</Badge>} />
        <Panel>
          <EmptyState icon="sparkle" title={t('ivEmptyTitle')} action={<LinkButton to={paths.design(event.id)} variant="primary" size="lg" icon="sparkle">{t('ivReview')}</LinkButton>}>
            {t('ivEmptyText')}
          </EmptyState>
        </Panel>
      </>
    );
  }

  const content = d.draft;
  const names = resolvedNames(event, content);
  if (!isCoupleEvent(event.type)) names.b = '';
  const xLabel = content.experience.motion === 'animated' ? t('ivAnimated') : t('ivStatic');
  const generalLink = guestLink();
  const primary = (ps === 'draft' || ps === 'changed') && !mayPublish ? (
    <OwnerOnly><Button variant="primary" size="lg" icon="send" disabled>{ps === 'draft' ? t('ivPublish') : t('ivPublishChanges')}</Button></OwnerOnly>
  ) : ps === 'draft' ? (
    <Button variant="primary" size="lg" icon="send" loading={publish.pending} onClick={() => publish.run()}>{t('ivPublish')}</Button>
  ) : ps === 'changed' ? (
    <Button variant="primary" size="lg" icon="send" loading={publish.pending} onClick={() => publish.run()}>{t('ivPublishChanges')}</Button>
  ) : (
    <LinkButton to={paths.guests(event.id, { filter: c && c.parties === 0 ? undefined : 'not_shared' })} variant="primary" size="lg" icon="share">{c && c.parties === 0 ? t('ovGuestsLabel') : t('ivShare')}</LinkButton>
  );

  return (
    <>
      <PageHeader title={t('wsInvitation')} status={<Badge tone={PUBLISH_LABEL[ps].tone} dot>{t(PUBLISH_KEY[ps])}</Badge>}
        subtitle={ps === 'draft' ? t('ivDraftSub') : ps === 'changed' ? t('ivChangedSub') : t('ivPublishedSub', { when: d.publishedAt ? relativeTime(d.publishedAt, now, dialect) : '' })} />
      {publish.error ? <Banner tone="danger" title={t('ivNotPublished')}>{errorMessage(publish.error)}</Banner> : null}

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
              { k: t('ivLastSave'), v: relativeTime(d.draftSavedAt, now, dialect), icon: 'clock' },
            ]} />
            <div className="row wrap gap-2 invite-primary">{primary}</div>
          </Panel>

          {(ps === 'published' || ps === 'changed') && (
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
          )}
          {ps === 'draft' && <Banner tone="warning" title={t('ivDraftTitle')}>{t('ivDraftText')}</Banner>}
        </div>
      </div>
    </>
  );
}
