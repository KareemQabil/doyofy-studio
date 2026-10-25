import { Link } from '../../app/router';
import { paths } from '../../app/paths';

export function GuestViews({ eventId, active }: { eventId: string; active: 'list' | 'responses' }) {
  return <nav className="guest-views" aria-label="عرض الضيوف">
    <Link to={paths.guests(eventId)} aria-current={active === 'list' ? 'page' : undefined}>قائمة الضيوف</Link>
    <Link to={paths.rsvp(eventId)} aria-current={active === 'responses' ? 'page' : undefined}>الردود والمتابعة</Link>
  </nav>;
}
