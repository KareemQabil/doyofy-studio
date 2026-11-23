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
import { useCopy } from '../../ui/copy';

export function SignatureOccasions({ value, onChange, onConfirm }: { value: EventType | null; onChange: (t: EventType) => void; onConfirm: (t: EventType) => void }) {
  const { t } = useCopy();
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
        <h2>{t('wzWhat')}</h2>
        <p>{t(searching ? 'wzSearchHint' : fine ? 'wzBrowseFine' : 'wzBrowseTouch')}</p>
      </header>
      {searching ? (
        <div className="wz-search">
          <SearchInput value={q} onChange={setQ} placeholder={t('wzSearchPlaceholder')} label={t('wzSearchLabel')} autoFocus />
          {matches.length ? (
            <ul ref={list} className="wz-search-list" aria-label={t('wzResults')}>
              {matches.map((t) => <li key={t.id}><button type="button" className="wz-search-option" aria-pressed={value === t.id} onClick={() => pick(t.id)}>
                <OccasionGlyph type={t.id} size={22} /><span><strong>{t.label}</strong><small>{t.line}</small></span>{value === t.id && <Icon name="check" size="sm" />}
              </button></li>)}
            </ul>
          ) : <p className="wz-search-empty" role="status">{t('wzNoMatch', { q })}<Button size="sm" variant="secondary" onClick={() => pick('other')}>{t('wzOther')}</Button></p>}
          <button type="button" className="wz-text-btn" onClick={() => { setSearching(false); setQ(''); }}><Icon name="back" size="sm" />{t('wzBackToCards')}</button>
        </div>
      ) : (
        <>
          <TactileDeck items={OCCASIONS_ORDERED} index={at} onIndexChange={(i) => onChange(OCCASIONS_ORDERED[i]!.id)} getKey={(o) => o.id}
            label={t('wzDeckLabel')} itemLabel={(o) => `${o.label}، ${o.line}`} activateHint={t('wzDeckActivate')}
            hint={t(fine ? 'wzDeckHintFine' : 'wzDeckHintTouch')}
            onActivate={(o) => onConfirm(o.id)} renderCard={(o, s) => <OccasionPoster type={o.id} active={s.active} />} className="wz-deck" />
          <button type="button" className="wz-text-btn" onClick={() => setSearching(true)}><Icon name="search" size="sm" />{t('wzSearchByName')}</button>
        </>
      )}
    </div>
  );
}
