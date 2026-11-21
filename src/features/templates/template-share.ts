import { useState } from 'react';
import type { EventType } from '../../domain/types';
import type { TemplatePreset } from '../../domain/templates';
import { paths } from '../../app/paths';
import { useRouter } from '../../app/router';
import { useToast } from '../../ui/primitives/Feedback';
import { copyText } from '../shared/CopyField';

/** A catalogue link contains the design choice only; it never shares the organizer's event or guest data. */
export function useTemplateShare(type: EventType) {
  const { absolute } = useRouter();
  const toast = useToast();
  const [copyUrl, setCopyUrl] = useState('');
  const share = async (preset: TemplatePreset) => {
    const query = new URLSearchParams({ type, template: preset.id, preview: '1' });
    const url = absolute(`${paths.newEvent}?${query}`);
    setCopyUrl('');
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ title: preset.name, text: 'تصميم دعوة من ضيوفي', url }); return; }
      catch (error) { if (error instanceof Error && error.name === 'AbortError') return; }
    }
    if (await copyText(url)) toast({ tone: 'success', text: 'تم نسخ رابط التصميم' });
    else setCopyUrl(url);
  };
  return { share, copyUrl };
}
