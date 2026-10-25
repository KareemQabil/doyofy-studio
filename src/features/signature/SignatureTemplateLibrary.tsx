import { useMemo, useState } from 'react';
import type { Event, InvitationDesignContent } from '../../domain/types';
import { applyPreset, type TemplatePreset } from '../../domain/templates';
import { CARD_NAMES, SCENE_NAMES } from '../../domain/invitation';
import { Button, Icon, Segmented } from '../../ui';
import { CardThumb } from '../invitation/CardThumb';
import { SignatureTemplateDeck } from './SignatureTemplateDeck';
import { useMedia } from './useMedia';

/** One card per design family. Scene variants stay available explicitly in the preview. */
export function SignatureTemplateLibrary({ presets, event, base, current, pending, onPreview, onUse }: {
  presets: TemplatePreset[]; event: Event; base: InvitationDesignContent; current?: string; pending: boolean; onPreview: (p: TemplatePreset) => void; onUse: (p: TemplatePreset) => void;
}) {
  const [view, setView] = useState<'grid' | 'deck'>('grid'), [count, setCount] = useState(8);
  const phone = useMedia('(max-width: 640px)');
  const groups = useMemo(() => {
    const map = new Map<string, TemplatePreset[]>(); for (const p of presets) map.set(p.cardId, [...(map.get(p.cardId) || []), p]);
    return [...map.values()].map(items => ({ items, p: items.find(p => p.id === current) || items[0]! }));
  }, [presets, current]);
  return <section className="sig-library" aria-label="مكتبة تصاميم الدعوات"><div className="sig-library-banner"><div><p className="eyebrow">بطاقة واحدة، وأجواء تختارها</p><h3>اختر شكل فرحتك.</h3><p>كل تصميم باسمك وموعدك. اختر أجواءه في المعاينة، ثم أضف لمستك.</p></div><picture aria-hidden="true"><source srcSet="assets/editorial/occasion-collection.avif" type="image/avif" /><img src="assets/editorial/occasion-collection.webp" alt="" width="1536" height="1024" decoding="async" /></picture></div>
    <div className="sig-library-toolbar"><p><b className="num">{groups.length}</b> تصميم مختلف <span>· الأجواء داخل كل تصميم</span></p><Segmented label="طريقة عرض التصاميم" value={view} onChange={setView} options={[{value:'grid',label:'المجموعة'},{value:'deck',label:'استعراض'}]} /></div>
    {view === 'deck' ? <SignatureTemplateDeck presets={groups.map(g=>g.p)} event={event} base={base} current={current} pending={pending} onPreview={onPreview} onUse={onUse} /> : <><ul className="sig-library-grid">{groups.slice(0,count).map(({p,items}) => <li key={p.cardId} className="sig-library-tile"><button type="button" className="sig-library-open" aria-label={`معاينة ${CARD_NAMES[p.cardId] || p.name}`} disabled={pending} onClick={() => onPreview(p)}><span className="sig-tpl-tableau"><picture className="sig-tpl-surface" aria-hidden="true"><source srcSet="assets/editorial/studio-workbench.avif" type="image/avif" /><img src="assets/editorial/studio-workbench.webp" alt="" width="1536" height="1024" loading="lazy" decoding="async" /></picture><CardThumb event={event} content={applyPreset(base,p)} width={phone ? 116 : 170} /></span><span className="sig-library-view"><Icon name="eye" size="sm" />معاينة التصميم</span>{items.some(x=>x.id===current) && <span className="sig-tpl-current"><Icon name="check" size="sm" />الحالي</span>}</button><div className="sig-library-meta"><h3>{CARD_NAMES[p.cardId] || p.name}</h3><p>{p.line}</p><span>{items.length > 1 ? `${items.length} أجواء للاختيار` : SCENE_NAMES[p.sceneId]}</span></div></li>)}</ul>{count < groups.length && <div className="sig-library-more"><Button variant="secondary" onClick={()=>setCount(n=>n+8)}>اكتشف تصاميم أكثر <span className="num">({groups.length-count})</span></Button></div>}</>}
  </section>;
}
