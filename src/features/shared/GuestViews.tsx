import { Link } from '../../app/router';
import { paths } from '../../app/paths';
import { useCopy } from '../../ui/copy';

export function GuestViews({ eventId, active }: { eventId: string; active: 'list' | 'responses' }) {
  const { t } = useCopy();
  return <nav className="guest-views" aria-label={t('gvLabel')}>
    <Link to={paths.guests(eventId)} aria-current={active === 'list' ? 'page' : undefined}>{t('guestList')}</Link>
    <Link to={paths.rsvp(eventId)} aria-current={active === 'responses' ? 'page' : undefined}>{t('gvReplies')}</Link>
  </nav>;
}
