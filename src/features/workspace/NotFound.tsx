import { AppShell, EmptyState, LinkButton } from '../../ui';
import { paths } from '../../app/paths';

export function NotFound({ message }: { message?: string }) {
  return (
    <AppShell>
      <main id="main" className="page-center">
        <EmptyState icon="search" title="الصفحة غير موجودة" action={<LinkButton to={paths.events} variant="primary">اذهب إلى مناسباتي</LinkButton>}>
          {message ?? 'ربما تغير الرابط أو حُذفت الصفحة.'}
        </EmptyState>
      </main>
    </AppShell>
  );
}
