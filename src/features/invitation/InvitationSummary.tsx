/**
 * Invitation section (spec §10): the current design, its state (draft / published / unpublished
 * changes), what guests will see, and the actions: edit design · preview as guest · publish · share.
 */
import { useGuestLink } from '../shared/share-link';
import type { Event } from '../../domain/types';
import { CARD_NAMES, PUBLISH_LABEL, SCENE_NAMES, publishState, resolvedNames } from '../../domain/invitation';
import { relativeTime } from '../../domain/format';
import { countParties } from '../../domain/parties';
import { isCoupleEvent } from '../../domain/event';
import { Badge, Banner, Button, EmptyState, ErrorState, Icon, KeyValue, LinkButton, PageHeader, Panel, Skeleton } from '../../ui';
import { useMutation, useNow } from '../../app/data';
import { useRouter } from '../../app/router';
import { paths } from '../../app/paths';
import { useToast } from '../../ui/primitives/Feedback';
import { errorMessage } from '../../services/errors';
import { useDesign, useParties } from '../shared/queries';
import { CardThumb } from './CardThumb';
import { CopyField } from '../shared/CopyField';

export function InvitationSummary({ event }: { event: Event }) {
  const design = useDesign(event.id);
  const parties = useParties(event.id);
  const now = useNow();
  const toast = useToast();
  const { absolute } = useRouter();
  const publish = useMutation((s) => s.invitations.publish(event.id), {
    onSuccess: () => toast({ tone: 'success', text: 'تم نشر الدعوة. الضيوف يرون الآن هذه النسخة.' }),
  });

  const guestLink = useGuestLink(event);
  if (design.loading) return <Skeleton lines={6} block />;
  if (design.error) return <ErrorState error={design.error} onRetry={design.refetch} />;
  const d = design.data ?? null;
  const ps = publishState(d);
  const c = parties.data ? countParties(parties.data) : null;

  if (!d) {
    return (
      <>
        <PageHeader title="الدعوة" status={<Badge tone="neutral" dot>{PUBLISH_LABEL.none.label}</Badge>} />
        <Panel>
          <EmptyState icon="sparkle" title="لنجهّز دعوتك" action={<LinkButton to={paths.design(event.id)} variant="primary" size="lg" icon="sparkle">راجع دعوتك</LinkButton>}>
            نجهّز قالبًا مناسبًا لفرحتك، باسمك وموعدك ومكانك. راجعه وأضف لمستك، ثم انشره عندما يصبح جاهزًا.
          </EmptyState>
        </Panel>
      </>
    );
  }

  const content = d.draft;
  const names = resolvedNames(event, content);
  if (!isCoupleEvent(event.type)) names.b = '';
  const xLabel = `${content.experience.dimension === '3d' ? 'ثلاثية الأبعاد' : 'ثنائية الأبعاد'} · ${content.experience.motion === 'animated' ? 'متحركة' : 'ثابتة'}`;
  const generalLink = guestLink();
  const primary = ps === 'draft' ? (
    <Button variant="primary" size="lg" icon="send" loading={publish.pending} onClick={() => publish.run()}>انشر الدعوة</Button>
  ) : ps === 'changed' ? (
    <Button variant="primary" size="lg" icon="send" loading={publish.pending} onClick={() => publish.run()}>انشر التعديلات</Button>
  ) : (
    <LinkButton to={paths.guests(event.id, { filter: c && c.parties === 0 ? undefined : 'not_shared' })} variant="primary" size="lg" icon="share">{c && c.parties === 0 ? 'أضف الضيوف' : 'شارك مع الضيوف'}</LinkButton>
  );

  return (
    <>
      <PageHeader title="الدعوة" status={<Badge tone={PUBLISH_LABEL[ps].tone} dot>{PUBLISH_LABEL[ps].label}</Badge>}
        subtitle={ps === 'draft' ? 'المسودة محفوظة. الضيوف لا يرون شيئًا حتى تنشرها.' : ps === 'changed' ? 'لديك تعديلات لم تُنشر بعد — الضيوف يرون النسخة السابقة.' : `نُشرت ${d.publishedAt ? relativeTime(d.publishedAt, now) : ''}. هذا ما يراه الضيوف.`} />
      {publish.error ? <Banner tone="danger" title="لم تُنشر الدعوة">{errorMessage(publish.error)}</Banner> : null}

      <div className="invite-layout">
        <Panel className="invite-card-panel">
          {<picture className="invite-stationery-surface" aria-hidden="true"><source srcSet="assets/editorial/studio-workbench.avif" type="image/avif" /><img src="assets/editorial/studio-workbench.webp" alt="" width="1536" height="1024" decoding="async" /></picture>}
          <div className="invite-card">
            <CardThumb event={event} content={content} width={240} label={`بطاقة ${CARD_NAMES[content.cardId] ?? ''} باسم ${names.a}${names.b ? ` و${names.b}` : ''}`} />
            <div className="stack gap-2 invite-card-actions">
              <LinkButton to={paths.design(event.id)} variant="secondary" icon="edit" block>عدّل التصميم</LinkButton>
              <LinkButton to={paths.preview(event.id)} variant="ghost" icon="eye" block>اعرضها كما يراها الضيف</LinkButton>
            </div>
          </div>
        </Panel>

        <div className="stack gap-6">
          <Panel title="ما تحتاج معرفته">
            <KeyValue items={[
              { k: 'التجربة', v: xLabel, icon: 'sparkle' },
              { k: 'البطاقة', v: CARD_NAMES[content.cardId] ?? content.cardId },
              { k: 'المكان في الدعوة', v: SCENE_NAMES[content.sceneId] ?? content.sceneId },
              { k: 'الأسماء على البطاقة', v: <>{names.a}{names.b ? ` و${names.b}` : ''} {names.fromEvent ? <Badge tone="neutral">من بيانات المناسبة</Badge> : <Badge tone="info">خاصة بالدعوة</Badge>}</> },
              { k: 'آخر حفظ', v: relativeTime(d.draftSavedAt, now), icon: 'clock' },
            ]} />
            <div className="row wrap gap-2 invite-primary">{primary}</div>
          </Panel>

          {(ps === 'published' || ps === 'changed') && (
            <Panel title="روابط الدعوة">
              <div className="stack gap-4">
                <p className="muted t-sm"><Icon name="user" size="sm" className="inline-icon" />لكل ضيف رابط شخصي يعرف اسمه وعدد المسموح له — تجده وتشاركه من صفحة الضيوف.</p>
                {event.settings.allowGeneralLink ? (
                  <CopyField label="الرابط العام (بدون اسم)" value={generalLink} hint="من يرد عبر هذا الرابط يظهر لك في الردود لتطابقه مع قائمة الضيوف." />
                ) : (
                  <p className="faint t-sm">الرابط العام مغلق. يمكنك تفعيله من الإعدادات إذا أردت رابطًا واحدًا للمجموعات.</p>
                )}
              </div>
            </Panel>
          )}
          {ps === 'draft' && <Banner tone="warning" title="الدعوة غير منشورة">لن تعمل روابط الضيوف حتى تنشر الدعوة. يمكنك إضافة الضيوف الآن ومشاركة الروابط بعد النشر.</Banner>}
        </div>
      </div>
    </>
  );
}
