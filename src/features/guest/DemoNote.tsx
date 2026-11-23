/**
 * The guest's demo disclosure: one calm line that opens to the full sentence. A carried (?d=) link has no server
 * behind it, so the reply stays on this device; the guest is told so without organizer or prototype vocabulary.
 * `compact` is the invitation's top bar (just the label); the hub shows the short sentence.
 */
import { Icon } from '../../ui';
import { useCopy } from '../../ui/copy';

export function DemoNote({ compact = false, pass = false, className = '' }: { compact?: boolean; pass?: boolean; className?: string }) {
  const { t } = useCopy();
  return (
    <details className={`guest-demo${compact ? ' is-compact' : ''} ${className}`}>
      <summary>
        <Icon name="info" size="sm" />
        <span className="guest-demo-line"><strong>{t('guestDemo')}</strong>{!compact && t('demoStays')}</span>
        <Icon name="chevron-down" size="sm" className="guest-demo-chev" />
      </summary>
      <p className="guest-demo-more">
        {t('demoOnly')}{pass ? t('demoPass') : ''}
      </p>
    </details>
  );
}
