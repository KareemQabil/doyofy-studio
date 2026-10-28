import type { EventType } from '../../domain/types';
import { OccasionGlyph } from '../../ui/icons';
import { toneOf } from '../signature/tones';

/** an occasion's mark: a licensed Phosphor glyph on its brand colour tile (no generated imagery) */
export function OccasionArtwork({type,className='',framed=true}:{type:EventType;className?:string;framed?:boolean}){
  return <span className={`occ-art occ-sig-tile tone-${toneOf(type)} ${className}${framed?' is-framed':''}`} aria-hidden="true"><OccasionGlyph type={type} weight="light"/></span>;
}
