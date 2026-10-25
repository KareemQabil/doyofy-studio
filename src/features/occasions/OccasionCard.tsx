/** One occasion as a visual card (art + name + a short line). Same card in both choosers. */
import type { EventTypeInfo } from '../../domain/event';
import { Icon } from '../../ui';
import { OccasionArtwork as OccasionArt } from './OccasionArtwork';

export function OccasionCard({ info, selected, size = 'md', showLine = true }: { info: EventTypeInfo; selected?: boolean; size?: 'lg' | 'md' | 'sm'; showLine?: boolean }) {
  return (
    <span className={`occ-card occ-${size}${selected ? ' is-selected' : ''}`}>
      <span className="occ-art-frame"><OccasionArt type={info.id} /></span>
      <span className="occ-text">
        <span className="occ-name">{info.label}</span>
        {showLine && <span className="occ-line">{info.line}</span>}
      </span>
      <span className="occ-check" aria-hidden="true"><Icon name="check" size="sm" /></span>
    </span>
  );
}
