import { AppShell, ErrorState, LinkButton, PageHeader, PageLoader, Panel } from '../../ui';
import { AccountMenu } from './AccountMenu';
import { useEvents } from '../shared/queries';
import { paths } from '../../app/paths';
import { formatEventDate } from '../../domain/format';
import { useCopy } from '../../ui/copy';

/** Focused read-only event list for the catering presentation role. */
export function CateringHome() {
  const events = useEvents();
  const { t } = useCopy();
  return <AppShell right={<AccountMenu />}><main id="main" className="account-page">
    <PageHeader title={t('shCatEvents')} subtitle={t('shCatSub')} actions={<LinkButton to="/app/account" icon="settings">{t('roleTitle')}</LinkButton>} />
    {events.error ? <ErrorState error={events.error} onRetry={events.refetch} /> : events.loading ? <PageLoader /> : <div className="stack gap-3">
      {(events.data || []).filter((event) => !event.archivedAt).map((event) => <Panel key={event.id} title={event.title} subtitle={formatEventDate(event.date)}>
        <div className="row wrap gap-2"><LinkButton to={`${paths.guests(event.id)}?view=food`} variant="primary" icon="sparkle">{t('auCatOpen')}</LinkButton><LinkButton to={paths.seating(event.id)} icon="table">{t('tables')}</LinkButton><LinkButton to={paths.settings(event.id)} icon="settings">{t('xsFoodTitle')}</LinkButton></div>
      </Panel>)}
      {!events.data?.some((event) => !event.archivedAt) && <p className="muted">{t('shNoActive')}</p>}
    </div>}
  </main></AppShell>;
}
