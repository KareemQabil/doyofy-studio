/**
 * Creation wizard, step 1 — «ما المناسبة؟». One way to choose: the tactile occasion deck (swipe, arrows, keys,
 * tap the front card to continue). Searching by name is the fallback for whoever doesn't see their occasion or
 * prefers typing: it temporarily replaces the deck with a short filtered list. The front card is the selection,
 * so the footer's primary always says what happens next.
 */
import { useEffect, useRef, useState } from 'react';
import type { EventType } from '../../domain/types';
import { OCCASIONS_ORDERED } from '../../domain/event';
import { normaliseForSearch } from '../../domain/parties';
import { TactileDeck } from '../../ui/primitives/TactileDeck';
import { Button, Icon, SearchInput } from '../../ui';
import { OccasionGlyph } from '../../ui/icons';
import { OccasionPoster } from './SignatureHome';
import { useMedia } from './useMedia';

export function SignatureOccasions({ value, onChange, onConfirm }: { value: EventType | null; onChange: (t: EventType) => void; onConfirm: (t: EventType) => void }) {
  const [searching, setSearching] = useState(false);
  // a mouse and keyboard don't swipe: the hint names what works on this device
  const fine = useMedia('(hover: hover) and (pointer: fine)');
  const [q, setQ] = useState('');
  const list = useRef<HTMLUListElement>(null);
  const at = Math.max(0, OCCASIONS_ORDERED.findIndex((t) => t.id === value));
  // the front card is the choice: select the first one on arrival so «التالي» is never a dead end
  useEffect(() => { if (!value) onChange(OCCASIONS_ORDERED[0]!.id); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const matches = OCCASIONS_ORDERED.filter((t) => normaliseForSearch(`${t.label} ${t.line} ${t.hint}`).includes(normaliseForSearch(q)));
  const pick = (t: EventType) => { onChange(t); setSearching(false); setQ(''); };
  return (
    <div className="wz-occasion">
      <header className="wz-head">
        <h2>ما المناسبة؟</h2>
        <p>{searching ? 'اكتب اسم مناسبتك واخترها.' : fine ? 'تصفّح البطاقات بالأسهم، واضغط على مناسبتك.' : 'اسحب البطاقات، واضغط على مناسبتك.'}</p>
      </header>
      {searching ? (
        <div className="wz-search">
          <SearchInput value={q} onChange={setQ} placeholder="مثال: تخرّج، عقيقة، إفطار" label="ابحث عن مناسبتك" autoFocus />
          {matches.length ? (
            <ul ref={list} className="wz-search-list" aria-label="نتائج البحث">
              {matches.map((t) => <li key={t.id}><button type="button" className="wz-search-option" aria-pressed={value === t.id} onClick={() => pick(t.id)}>
                <OccasionGlyph type={t.id} size={22} /><span><strong>{t.label}</strong><small>{t.line}</small></span>{value === t.id && <Icon name="check" size="sm" />}
              </button></li>)}
            </ul>
          ) : <p className="wz-search-empty" role="status">لم نجد «{q}». اختر «مناسبة أخرى» واكتب اسمها في الخطوة الأخيرة.<Button size="sm" variant="secondary" onClick={() => pick('other')}>مناسبة أخرى</Button></p>}
          <button type="button" className="wz-text-btn" onClick={() => { setSearching(false); setQ(''); }}><Icon name="back" size="sm" />العودة إلى البطاقات</button>
        </div>
      ) : (
        <>
          <TactileDeck items={OCCASIONS_ORDERED} index={at} onIndexChange={(i) => onChange(OCCASIONS_ORDERED[i]!.id)} getKey={(t) => t.id}
            label="اختر نوع المناسبة — اسحب يمينًا للتالي" itemLabel={(t) => `${t.label}، ${t.line}`} activateHint="اضغط للمتابعة"
            hint={fine ? 'تصفّح البطاقات بالأسهم' : 'اسحب البطاقات لتتصفّح'}
            onActivate={(t) => onConfirm(t.id)} renderCard={(t, s) => <OccasionPoster type={t.id} active={s.active} />} className="wz-deck" />
          <button type="button" className="wz-text-btn" onClick={() => setSearching(true)}><Icon name="search" size="sm" />لا تجد مناسبتك؟ ابحث بالاسم</button>
        </>
      )}
    </div>
  );
}
