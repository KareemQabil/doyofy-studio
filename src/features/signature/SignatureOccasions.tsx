/**
 * «توقيع» occasion chooser (create, step 1). The tactile deck is the discovery surface; the plain searchable
 * catalogue is one toggle away (and is what keyboard/screen-reader users can prefer). Whatever card is in
 * front is the selection, so the footer's primary action always says what will happen next.
 */
import { useEffect, useState } from 'react';
import type { EventType } from '../../domain/types';
import { OCCASIONS_ORDERED } from '../../domain/event';
import { TactileDeck } from '../../ui/primitives/TactileDeck';
import { Icon } from '../../ui';
import { CuratedChooser } from '../occasions/CuratedChooser';
import { OccasionPoster } from './SignatureHome';

export function SignatureOccasions({ value, onChange, onConfirm }: { value: EventType | null; onChange: (t: EventType) => void; onConfirm: (t: EventType) => void }) {
  const [view, setView] = useState<'deck' | 'list'>('deck');
  const at = Math.max(0, OCCASIONS_ORDERED.findIndex((t) => t.id === value));
  // the front card is the choice: select the first one on arrival so «متابعة» is never a dead end
  useEffect(() => { if (!value) onChange(OCCASIONS_ORDERED[0]!.id); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="sig-create">
      <header className="sig-create-head">
        <p className="sig-index"><span className="num">01</span>الخطوة الأولى من خطوتين</p>
        <h2>ما المناسبة؟</h2>
        <p className="sig-create-sub">{view === 'deck' ? 'اسحب البطاقات أو استخدم الأسهم، ثم اضغط على مناسبتك.' : 'ابحث عن مناسبتك أو اخترها من القائمة.'} بعدها تكتب الأسماء والموعد، ونجهّز الدعوة.</p>
        <div className="sig-view-switch" role="group" aria-label="طريقة العرض">
          <button type="button" aria-pressed={view === 'deck'} onClick={() => setView('deck')}><Icon name="grid" size="sm" />بطاقات</button>
          <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}><Icon name="search" size="sm" />قائمة وبحث</button>
        </div>
      </header>
      {view === 'deck' ? (
        <TactileDeck items={OCCASIONS_ORDERED} index={at} onIndexChange={(i) => onChange(OCCASIONS_ORDERED[i]!.id)} getKey={(t) => t.id}
          label="اختر نوع المناسبة — اسحب يسارًا للتالي" itemLabel={(t) => `${t.label}، ${t.line}`} activateHint="اضغط للمتابعة"
          onActivate={(t) => onConfirm(t.id)} renderCard={(t, s) => <OccasionPoster type={t.id} active={s.active} />} className="sig-create-deck" />
      ) : <CuratedChooser value={value} onChange={onChange} />}
    </div>
  );
}
