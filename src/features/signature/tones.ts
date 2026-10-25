/** «توقيع» brand tile colour per occasion — ordered so neighbours in the catalogue never share a colour. */
import type { EventType } from '../../domain/types';
export type BrandTone = 'gold' | 'charcoal' | 'ivory' | 'beige' | 'red' | 'turquoise';
const TONE: Record<EventType, BrandTone> = {
  wedding: 'red', engagement: 'gold', katb_kitab: 'charcoal', birthday: 'turquoise', graduation: 'red', iftar: 'charcoal',
  henna: 'gold', newborn: 'turquoise', family: 'red', conference: 'ivory', opening: 'gold', corporate: 'charcoal', other: 'turquoise',
};
export const toneOf = (t: EventType): BrandTone => TONE[t] ?? 'gold';
