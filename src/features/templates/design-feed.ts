import { useMemo, useState } from 'react';
import type { EventType } from '../../domain/types';
import { eventTypeInfo } from '../../domain/event';
import { TEMPLATE_STYLES, presetsFor, type TemplatePreset } from '../../domain/templates';
import type { FeedFilter } from './TemplateFeed';

/** one entry per design family (a face); scene variants stay a fine edit in the editor */
export function designFamilies(presets: TemplatePreset[], keep?: string): TemplatePreset[] {
  const out = new Map<string, TemplatePreset>();
  for (const p of presets) if (!out.has(p.cardId) || p.id === keep) out.set(p.cardId, p);
  return [...out.values()];
}

/** The feed's catalogue for an occasion: suited designs first, with style filters for the sheet. */
export function useDesignFeed(type: EventType | null, keep?: string) {
  const [filter, setFilter] = useState('for-you');
  const { suited, rest } = useMemo(() => presetsFor(type), [type]);
  const all = useMemo(() => designFamilies([...suited, ...rest], keep), [suited, rest, keep]);
  const forYou = useMemo(() => designFamilies(suited.length ? suited : [...suited, ...rest], keep), [suited, rest, keep]);
  const filters: FeedFilter[] = useMemo(() => [
    { id: 'for-you', label: type ? `مختارة لـ${eventTypeInfo(type).label}` : 'مختارة لك', count: forYou.length },
    { id: 'all', label: 'كل التصاميم', count: all.length },
    ...TEMPLATE_STYLES.map(s => ({ id: s.id, label: s.label, count: all.filter(p => p.styles.includes(s.id)).length })),
  ], [type, forYou, all]);
  const list = filter === 'for-you' ? forYou : filter === 'all' ? all : all.filter(p => p.styles.includes(filter as TemplatePreset['styles'][number]));
  return { list, filters, filter, setFilter };
}
