import { LinkButton } from '../../ui';
import { useCopy } from '../../ui/copy';
export function JourneyBanner({ title, line, to, action }: { title: string; line: string; to?: string; action?: string }) {
  const { t } = useCopy();
  return <aside className="journey-banner"><div><p className="eyebrow">{t('shJourney')}</p><h2>{title}</h2><p>{line}</p>{to && action && <LinkButton to={to} variant="secondary" size="sm" iconEnd="forward">{action}</LinkButton>}</div><picture aria-hidden="true"><source srcSet="assets/editorial/reception-desk.avif" type="image/avif" /><img src="assets/editorial/reception-desk.webp" alt="" width="1536" height="1024" decoding="async" loading="lazy" /></picture></aside>;
}
