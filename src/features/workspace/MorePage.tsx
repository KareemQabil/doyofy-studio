/** Phone-only "more" page: the event sections that don't fit in the bottom tab bar. */
import type { Event } from '../../domain/types';
import { eventPhase } from '../../domain/event';
import { countParties } from '../../domain/parties';
import { Icon, PageHeader, type IconName } from '../../ui';
import { Link } from '../../app/router';
import { useNow } from '../../app/data';
import { paths } from '../../app/paths';
import { useParties } from '../shared/queries';

export function MorePage({ event }: { event: Event }) {
  const now = useNow();
  const parties = useParties(event.id);
  const phase = eventPhase(event, now);
  const c = parties.data ? countParties(parties.data) : null;
  const items: Array<{ to: string; icon: IconName; label: string; hint: string }> = [
    { to: paths.seating(event.id), icon: 'table', label: 'الطاولات', hint: 'أماكن ضيوفك وتوزيع المقاعد' },
    { to: paths.rsvp(event.id), icon: 'envelope', label: 'الردود', hint: c ? `${c.pendingParties} بانتظار الرد · ${c.confirmedPeople} مؤكدون` : 'متابعة الردود' },
    { to: paths.checkin(event.id), icon: 'door', label: 'الاستقبال', hint: phase === 'event_day' ? 'اليوم يوم المناسبة' : 'تجهيز الاستقبال يوم المناسبة' },
    { to: paths.gate(event.id), icon: 'scan', label: 'افتح شاشة الاستقبال', hint: 'شاشة مبسطة لفريق البوابة' },
    { to: paths.settings(event.id), icon: 'settings', label: 'تفاصيل المناسبة', hint: 'البيانات، الموعد، المكان، الردود' },
    ...(phase === 'completed' || phase === 'archived' ? [{ to: paths.summary(event.id), icon: 'flag' as IconName, label: 'ملخص المناسبة', hint: 'الحضور النهائي' }] : []),
    { to: paths.events, icon: 'list', label: 'كل المناسبات', hint: 'التبديل إلى مناسبة أخرى' },
  ];
  return (
    <>
      <PageHeader title="المزيد" />
      <ul className="more-list">
        {items.map((it) => (
          <li key={it.to}>
            <Link to={it.to} className="more-item">
              <span className="more-icon"><Icon name={it.icon} /></span>
              <span className="grow"><span className="more-label">{it.label}</span><span className="more-hint">{it.hint}</span></span>
              <Icon name="forward" size="sm" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
