import { AppShell, EmptyState, LinkButton } from '../../ui';
import { paths } from '../../app/paths';
import { useCopy } from '../../ui/copy';

export function NotFound({ message }: { message?: string }) {
  const { t } = useCopy();
  return (
    <AppShell>
      <main id="main" className="page-center">
        <EmptyState icon="search" title={t('notFoundTitle')} action={<LinkButton to={paths.events} variant="primary">{t('notFoundAction')}</LinkButton>}>
          {message ?? t('notFoundHint')}
        </EmptyState>
      </main>
    </AppShell>
  );
}
