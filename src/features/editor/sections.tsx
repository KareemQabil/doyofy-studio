/**
 * The editor's three tabs. «النص»: the event's names, date and place (the EVENT itself — one source for everywhere),
 * the invitation message, the programme (optional, empty, collapsed) and English (optional, collapsed). «الشكل»: one
 * grid of designs, one row of backgrounds and the motion. «الصوت»: the sound choice and the voice welcome (r4-audio),
 * uploaded and recorded in place.
 * Every field a tap on the card can reach carries `data-edit-field` (names · date · venue · message · program).
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Event, EventDetails, InvitationDesignContent, UpdateEventInput } from '../../domain/types';
import { eventTypeInfo, isCoupleEvent, suggestTitle } from '../../domain/event';
import { CARD_NAMES, SCENE_NAMES } from '../../domain/invitation';
import { CARD_CATALOGUE, presetsFor } from '../../domain/templates';
import { daysBetween, localDateOf } from '../../domain/format';
import { Button, Dialog, Field, Icon, IconButton, Input, Select, Switch, Textarea } from '../../ui';
import { CardThumb } from '../invitation/CardThumb';
import { TemplateThumb } from '../templates/TemplateThumb';
import { useAudioLibrary } from '../account/audio-state';
import { AudioLibrary } from '../account/AudioLibrary';
import { VoiceRecorder } from '../account/VoiceRecorder';
import { MAX_AUDIO_TRACKS } from '../../domain/audio-library';
import { copyFor, fill, type Copy } from '../../domain/copy';
import { currentDialect, useCopy } from '../../ui/copy';
import type { AudioSelection } from '../../domain/audio-library';
import { useCloud } from '../shared/cloud';

type Update = (patch: Partial<InvitationDesignContent>) => void;
/** what a tap on the card opens in «النص» */
export type EditField = 'names' | 'date' | 'venue' | 'message' | 'program';

function SecHead({ title, hint, children }: { title: string; hint?: ReactNode; children?: ReactNode }) {
  return (
    <div className="ed-sec-head">
      <div className="grow"><h2 className="ed-sec-title">{title}</h2>{hint && <p className="ed-sec-hint">{hint}</p>}</div>
      {children}
    </div>
  );
}

// ------------------------------------------------------------------ the event's own details (shared, single source)
export interface EventDraft { a: string; b: string; aEn: string; bEn: string; date: string; time: string; venue: string; city: string; venueEn: string; cityEn: string; mapUrl: string }
export const eventFields = (e: Event): EventDraft => ({
  a: e.names.a, b: e.names.b ?? '', aEn: e.names.aEn ?? '', bEn: e.names.bEn ?? '',
  date: e.date, time: e.time, venue: e.venue.name, city: e.venue.city, venueEn: e.venue.nameEn ?? '', cityEn: e.venue.cityEn ?? '', mapUrl: e.venue.mapUrl ?? '',
});
export const sameDraft = (x: EventDraft, y: EventDraft) => (Object.keys(x) as Array<keyof EventDraft>).every((k) => x[k] === y[k]);
export type EventDraftErrors = Partial<Record<keyof EventDraft, string>>;

/** The editor saves the event as the organizer types, so it accepts only what the event can hold. Venue and city are optional. */
export function validateEventFields(event: Event, draft: EventDraft, now: Date, c: Copy = copyFor(currentDialect())): EventDraftErrors {
  const errors: EventDraftErrors = {};
  const info = eventTypeInfo(event.type);
  if (!draft.a.trim()) errors.a = fill(c.esNameError, { label: isCoupleEvent(event.type) ? info.nameLabel : c.esName });
  if (isCoupleEvent(event.type) && !draft.b.trim()) errors.b = fill(c.esNameError, { label: info.nameLabelB ?? c.esSecondName });
  const parsed = new Date(`${draft.date}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== draft.date) errors.date = c.esDateError;
  else if (draft.date !== event.date && daysBetween(localDateOf(now, event.timeZone), draft.date) < 0) errors.date = c.esFutureError;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time)) errors.time = c.esTimeError;
  if (draft.mapUrl.trim()) {
    try { const url = new URL(draft.mapUrl); if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) errors.mapUrl = c.esMapHttps; }
    catch { errors.mapUrl = c.esMapBad; }
  }
  return errors;
}

const namesOf = (e: Pick<EventDetails, 'type'>, d: EventDraft) => {
  const couple = isCoupleEvent(e.type);
  return { a: d.a.trim(), b: couple ? d.b.trim() || undefined : undefined, aEn: d.aEn.trim() || undefined, bEn: couple ? d.bEn.trim() || undefined : undefined };
};

/** only what changed. A title that was the automatic one («زفاف نورة وفيصل») follows the new names. */
export function eventPatch(e: Event, d: EventDraft): UpdateEventInput {
  const was = eventFields(e);
  const patch: UpdateEventInput = {};
  if (d.a !== was.a || d.b !== was.b || d.aEn !== was.aEn || d.bEn !== was.bEn) {
    patch.names = namesOf(e, d);
    if (e.title === suggestTitle(e.type, e.names)) patch.title = suggestTitle(e.type, patch.names);
  }
  if (d.date !== was.date) patch.date = d.date;
  if (d.time !== was.time) patch.time = d.time;
  if (d.venue !== was.venue || d.city !== was.city || d.venueEn !== was.venueEn || d.cityEn !== was.cityEn || d.mapUrl !== was.mapUrl) patch.venue = venueOf(e, d);
  return patch;
}

/** the place as typed; the English names of the place are optional (in «إضافة نص إنجليزي») */
const venueOf = (e: Event, d: EventDraft): Event['venue'] => ({ ...e.venue, name: d.venue.trim(), city: d.city.trim(), nameEn: d.venueEn.trim() || undefined, cityEn: d.cityEn.trim() || undefined, mapUrl: d.mapUrl.trim() || undefined });

/** the event as the card should show it: valid edits appear as they are typed, before the event is saved */
export function previewEvent(e: Event, d: EventDraft): Event {
  const names = namesOf(e, d);
  return {
    ...e,
    names: { ...names, a: names.a || e.names.a, b: isCoupleEvent(e.type) ? names.b || e.names.b : undefined },
    date: /^\d{4}-\d{2}-\d{2}$/.test(d.date) ? d.date : e.date,
    time: /^\d{2}:\d{2}$/.test(d.time) ? d.time : e.time,
    venue: venueOf(e, d),
  };
}

// ------------------------------------------------------------------ النص
export function TextSection({ event, draft, onDraft, errors, content, update }: {
  event: Event; draft: EventDraft; onDraft: (patch: Partial<EventDraft>) => void; errors: EventDraftErrors; content: InvitationDesignContent; update: Update;
}) {
  const { t } = useCopy();
  const couple = isCoupleEvent(event.type);
  const info = eventTypeInfo(event.type);
  const labelA = couple ? info.nameLabel : t('esName'), labelB = info.nameLabelB ?? t('esSecondName');
  const [en, setEn] = useState(false); // English is optional: collapsed until asked for
  // the English line is separate text: once the Arabic changes, say so where it is typed (it never silently goes stale)
  const [arEdited, setArEdited] = useState(false);
  const enStale = arEdited && !!content.message.en.trim();
  const prog = content.program;
  const setProg = (i: number, k: 'time' | 'ar' | 'en', v: string) => update({ program: prog.map((p, j) => (j === i ? { ...p, [k]: v } : p)) });
  const ev = (k: keyof EventDraft) => ({ value: draft[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => onDraft({ [k]: e.target.value }) });

  return (
    <div className="ed-sec">
      <section className="ed-group ed-content-names" data-page-for="card">
        <SecHead title={t('esNames')} hint={t('esNamesHint')} />
        <div className="ed-fields">
          <Field label={labelA} error={errors.a}><Input data-edit-field="names" data-event-field="a" autoComplete="off" {...ev('a')} /></Field>
          {couple && <Field label={labelB} error={errors.b}><Input data-event-field="b" autoComplete="off" {...ev('b')} /></Field>}
        </div>
      </section>

      <section className="ed-group ed-content-when" data-page-for="card">
        <SecHead title={t('esWhen')} />
        <div className="ed-fields is-pair">
          <Field label={t('esDate')} error={errors.date}><Input type="date" data-edit-field="date" data-event-field="date" {...ev('date')} /></Field>
          <Field label={t('esTime')} error={errors.time}><Input type="time" data-event-field="time" {...ev('time')} /></Field>
        </div>
      </section>

      <section className="ed-group ed-content-where" data-page-for="card">
        <SecHead title={t('esWhere')} />
        <div className="ed-fields">
          <Field label={t('esVenue')} optional><Input data-edit-field="venue" data-event-field="venue" {...ev('venue')} /></Field>
          <Field label={t('esCity')} optional><Input data-event-field="city" {...ev('city')} /></Field>
          <Field label={t('esMap')} optional error={errors.mapUrl} hint={t('esMapHint')}><Input ltr type="url" data-event-field="mapUrl" placeholder="https://maps.google.com/…" {...ev('mapUrl')} /></Field>
        </div>
      </section>

      <section className="ed-group ed-content-message" data-page-for="message">
        <Field label={t('esMessage')}><Textarea rows={3} data-edit-field="message" value={content.message.ar} onChange={(e) => { setArEdited(true); update({ message: { ...content.message, ar: e.target.value } }); }} /></Field>
        {enStale && <p className="ed-en-stale" role="status"><Icon name="info" size="sm" /><span>{t('esEnStale')} <bdi dir="ltr">«{content.message.en.length > 48 ? `${content.message.en.slice(0, 48)}…` : content.message.en}»</bdi></span>
          <span className="ed-en-stale-actions">{!en && <button type="button" className="link-btn" onClick={() => setEn(true)}>{t('esEditIt')}</button>}<button type="button" className="link-btn" onClick={() => update({ message: { ...content.message, en: '' } })}>{t('esDeleteIt')}</button></span></p>}
      </section>

      <details className="ed-group ed-program-disclosure" data-page-for="program">
        <summary data-edit-field="program">{t('esProgramme')} <span>{prog.length ? t('esProgrammeMeta', { n: prog.length }) : t('esOptional')}</span><Icon name="chevron-down" size="sm"/></summary>
        <p className="ed-sec-hint">{t('esProgrammeHint')}</p>
        <ol className="ed-program">
          {prog.map((p, i) => (
            <li key={i}>
              <Input type="time" aria-label={t('esItemTime', { n: i + 1 })} value={p.time} onChange={(e) => setProg(i, 'time', e.target.value)} />
              <Input aria-label={t('esItem', { n: i + 1 })} value={p.ar} placeholder={t('esItemPlaceholder')} onChange={(e) => setProg(i, 'ar', e.target.value)} />
              <IconButton icon="trash" size="sm" label={t('esDeleteItem', { n: i + 1 })} onClick={() => update({ program: prog.filter((_, j) => j !== i) })} />
              {en && <Input ltr className="ed-prog-en" aria-label={t('esItemEn', { n: i + 1 })} value={p.en} placeholder="Item" onChange={(e) => setProg(i, 'en', e.target.value)} />}
            </li>
          ))}
        </ol>
        {prog.length < 6 && <Button variant="ghost" size="sm" icon="plus" onClick={() => update({ program: [...prog, { time: prog.at(-1)?.time ?? event.time, ar: '', en: '' }] })}>{t('esAddItem')}</Button>}
      </details>

      <details className="ed-group ed-english" open={en} onToggle={(e) => setEn(e.currentTarget.open)}>
        <summary>{t('esEnglish')} <span>{t('esOptional')}</span><Icon name="chevron-down" size="sm"/></summary>
        <p className="ed-sec-hint">{t('esEnglishHint')}</p>
        <div className="ed-fields">
          <Field label={t('esNameEn', { label: labelA })}><Input ltr data-event-field="aEn" {...ev('aEn')} /></Field>
          {couple && <Field label={t('esNameEn', { label: labelB })}><Input ltr data-event-field="bEn" {...ev('bEn')} /></Field>}
          <Field label={t('esNameEn', { label: t('esVenue') })}><Input ltr data-event-field="venueEn" {...ev('venueEn')} /></Field>
          <Field label={t('esNameEn', { label: t('esCity') })}><Input ltr data-event-field="cityEn" {...ev('cityEn')} /></Field>
          <Field label={t('esMessageEn')}><Textarea rows={3} dir="ltr" value={content.message.en} onChange={(e) => { setArEdited(false); update({ message: { ...content.message, en: e.target.value } }); }} /></Field>
        </div>
      </details>
    </div>
  );
}

// ------------------------------------------------------------------ الشكل
function Option({ on, title, text, onClick, art, disabled }: { on: boolean; title: string; text: string; onClick: () => void; art?: ReactNode; disabled?: boolean }) {
  return (
    <button type="button" role="radio" aria-checked={on} className={`ed-option${on ? ' is-on' : ''}`} onClick={onClick} disabled={disabled}>
      {art}
      <span className="ed-option-text"><span className="ed-option-title">{title}</span><span className="ed-option-d">{text}</span></span>
      <span className="ed-option-mark" aria-hidden="true"><Icon name="check" size="sm" /></span>
    </button>
  );
}

/**
 * «الشكل»: one grid of designs — the occasion's own first, «المزيد» for every design — one row of backgrounds (the
 * design's own three settings first) and the motion. Changing either keeps every text the organizer wrote.
 */
export function DesignSection({ event, content, invitation, update }: { event: Event; content: InvitationDesignContent; invitation: unknown; update: Update }) {
  const { t } = useCopy();
  const uniq = (ids: string[]) => [...new Set(ids)];
  const forOccasion = uniq(presetsFor(event.type).suited.map((p) => p.cardId));
  const everyCard = uniq([...forOccasion, ...Object.keys(CARD_NAMES)]);
  // the current design always shows (an old or linked one from another occasion joins the end of the grid)
  const [more, setMore] = useState(false);
  const cards = more ? everyCard : uniq([...forOccasion, content.cardId]);
  const own = CARD_CATALOGUE.find((c) => c.card === content.cardId)?.scenes ?? [];
  const scenes = uniq([...own, ...Object.keys(SCENE_NAMES)]);
  const x = content.experience;
  const setX = (patch: Partial<InvitationDesignContent['experience']>) => update({ experience: { ...x, ...patch, dimension: '2d' } });
  return (
    <div className="ed-sec">
      <section className="ed-group ed-design-cards">
        <SecHead title={t('esDesign')} hint={t('esForYouHint')} />
        <div className="ed-picks ed-cards" role="radiogroup" aria-label={t('esDesign')}>
          {cards.map((id) => (
            <button key={id} type="button" role="radio" aria-label={CARD_NAMES[id]} aria-checked={content.cardId === id} className={`ed-pick${content.cardId === id ? ' is-on' : ''}`} onClick={() => update({ cardId: id })}>
              <CardThumb event={event} content={{ ...content, cardId: id }} width={84} />
              <span className="ed-pick-name">{CARD_NAMES[id]}</span>
            </button>
          ))}
        </div>
        {!more && everyCard.length > cards.length && <Button variant="ghost" size="sm" icon="grid" className="ed-more" onClick={() => setMore(true)}>{t('esMore', { n: everyCard.length - cards.length })}</Button>}
      </section>

      <section className="ed-group ed-scene-selection">
        <SecHead title={t('esScene')} hint={t('esSceneHint')} />
        {/* one row, scrolled sideways: the design's own settings lead */}
        <div className="ed-picks ed-scenes ed-scene-row" role="radiogroup" aria-label={t('esScene')} data-scroll-x="">
          {scenes.map((id) => (
            <button key={id} type="button" role="radio" aria-label={SCENE_NAMES[id]} aria-checked={content.sceneId === id} className={`ed-pick${content.sceneId === id ? ' is-on' : ''}`} onClick={() => update({ sceneId: id })}>
              <TemplateThumb preset={{ id, name: '', line: '', styles: [], occasionTags: [], cardId: content.cardId, sceneId: id, experience: content.experience }} invitation={invitation} />
              <span className="ed-pick-name">{SCENE_NAMES[id]}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="ed-group ed-motion">
        <SecHead title={t('esMotion')} />
        <div className="ed-options is-text" role="radiogroup" aria-label={t('esMotion')}>
          <Option on={x.motion === 'animated'} title={t('ivAnimated')} text={t('esAnimatedD')} onClick={() => setX({ motion: 'animated' })} />
          <Option on={x.motion === 'static'} title={t('ivStatic')} text={t('esStaticD')} onClick={() => setX({ motion: 'static' })} />
        </div>
      </section>
    </div>
  );
}

// ------------------------------------------------------------------ الصوت
export function SoundSection({ content, update }: { content: InvitationDesignContent; update: Update }) {
  return <div className="ed-sec"><SoundGroup content={content} update={update} /></div>;
}

/**
 * One sound choice — none / built-in / my music (pick a track) — plus an optional voice welcome (r4-audio).
 * `default` (nothing chosen yet) shows as the account default: its track when there is one, built-in otherwise.
 * Uploading music and recording the voice welcome happen right here, in a sheet over the editor (the account's own
 * audio components): nothing leaves the editor, and what was just added is chosen at once — the music becomes the
 * invitation's sound, a new recording turns the voice welcome on. The device-only line is organizer UI (gone once the
 * backend uploads the sounds); guests elsewhere just hear the built-in sound. «معاينة كضيف» plays it.
 */
function SoundGroup({ content, update }: { content: InvitationDesignContent; update: Update }) {
  const { t } = useCopy();
  const library = useAudioLibrary();
  const cloudOn = useCloud().status() === true;
  const [sheet, setSheet] = useState<'music' | 'voice' | null>(null);
  const audio: AudioSelection = content.audio ?? { mode: 'default' };
  const music = library.tracks.filter(tr => tr.kind === 'music'), voices = library.tracks.filter(tr => tr.kind === 'voice');
  const shown = audio.mode === 'default' ? (library.defaultTrackId ? 'library' : 'builtin') : audio.mode;
  const trackId = audio.mode === 'library' ? audio.trackId : audio.mode === 'default' ? library.defaultTrackId : undefined;
  const voice = audio.voiceId ? { voiceId: audio.voiceId, ...(audio.voiceName ? { voiceName: audio.voiceName } : {}) } : {};
  const pickTrack = (id: string | undefined) => { const tr = music.find(m => m.id === id) ?? music[0]; if (tr) update({ audio: { mode: 'library', trackId: tr.id, trackName: tr.name, ...voice } }); };
  const choose = (mode: 'off' | 'builtin' | 'library') => mode === 'library' ? pickTrack(trackId) : update({ audio: { mode, ...voice } });
  const setVoice = (id: string | undefined) => {
    const { voiceId: _v, voiceName: _n, ...rest } = audio;
    const tr = voices.find(v => v.id === id);
    update({ audio: { ...rest, ...(tr ? { voiceId: tr.id, voiceName: tr.name } : {}) } });
  };
  // a track added in the sheet is chosen at once (the latest one, if several)
  const known = useRef<Set<string> | null>(null);
  useEffect(() => { if (sheet) known.current = new Set(library.tracks.map(tr => tr.id)); }, [sheet]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const seen = known.current;
    if (!seen) return;
    const added = library.tracks.filter(tr => !seen.has(tr.id));
    if (!added.length) return;
    added.forEach(tr => seen.add(tr.id));
    const newMusic = added.filter(tr => tr.kind === 'music').at(-1), newVoice = added.filter(tr => tr.kind === 'voice').at(-1);
    const base: AudioSelection = newMusic ? { mode: 'library', trackId: newMusic.id, trackName: newMusic.name } : (() => { const { voiceId: _v, voiceName: _n, ...rest } = audio; return rest; })();
    const withVoice = newVoice ? { voiceId: newVoice.id, voiceName: newVoice.name } : voice;
    update({ audio: { ...base, ...withVoice } });
  }, [library.tracks]); // eslint-disable-line react-hooks/exhaustive-deps
  // the snapshot outlives the sheet: a recording saved as the sheet closes is still picked up
  const close = () => setSheet(null);

  const trackMissing = shown === 'library' && !!trackId && !music.some(m => m.id === trackId);
  const voiceMissing = !!audio.voiceId && !voices.some(v => v.id === audio.voiceId);
  const uploaded = shown === 'library' || !!audio.voiceId;
  return (
    <section className="ed-group">
      <SecHead title={t('audioSoundTitle')} hint={t('audioSoundHint')} />
      <div className="ed-options is-text" role="radiogroup" aria-label={t('audioChoiceLabel')}>
        <Option on={shown === 'off'} title={t('audioChoiceNone')} text={t('audioChoiceNoneD')} onClick={() => choose('off')} />
        <Option on={shown === 'builtin'} title={t('audioChoiceBuiltin')} text={t('audioChoiceBuiltinD')} onClick={() => choose('builtin')} />
        <Option on={shown === 'library'} disabled={!music.length && !trackMissing} title={t('audioChoiceMine')} text={music.length ? t('audioChoiceMineD') : t('audioChoiceMineEmpty')} onClick={() => choose('library')} />
      </div>
      {shown === 'library' && (music.length > 0 || trackMissing) && <Field label={t('audioPickTrack')}><Select data-audio-track value={trackId ?? ''} onChange={e => pickTrack(e.target.value)}>
        {music.map(tr => <option key={tr.id} value={tr.id}>{tr.name}</option>)}
        {trackMissing && <option value={trackId}>{t('audioTrackMissing')}</option>}
      </Select></Field>}
      <div><Button variant="secondary" size="sm" icon="upload" data-audio-sheet="music" onClick={() => setSheet('music')}>{music.length ? t('esUploadMore') : t('esUploadMusic')}</Button></div>
      <Switch label={t('audioVoiceToggle')} hint={t('audioVoiceToggleHint')} checked={!!audio.voiceId} disabled={!voices.length && !audio.voiceId} onChange={on => setVoice(on ? (voices.find(v => v.id === audio.voiceId) ?? voices[0])?.id : undefined)} />
      {audio.voiceId && (voices.length > 1 || voiceMissing) && <Field label={t('audioVoicePick')}><Select data-audio-voice value={audio.voiceId} onChange={e => setVoice(e.target.value)}>
        {voices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        {voiceMissing && <option value={audio.voiceId}>{t('audioVoiceMissing')}</option>}
      </Select></Field>}
      <div><Button variant="secondary" size="sm" icon="volume" data-audio-sheet="voice" onClick={() => setSheet('voice')}>{voices.length ? t('esRecordAgain') : t('esRecordVoice')}</Button></div>
      {uploaded && !cloudOn && <p className="ed-sec-hint" data-audio-device-note>{t('audioDeviceOnly')}</p>}
      <Dialog open={sheet === 'music'} onClose={close} variant="drawer" size="lg" title={t('esUploadMusic')} className="ed-audio-sheet">
        <AudioLibrary embedded focus />
      </Dialog>
      <Dialog open={sheet === 'voice'} onClose={close} variant="drawer" title={t('esRecordVoice')} className="ed-audio-sheet"
        footer={<Button variant="secondary" onClick={close}>{t('done')}</Button>}>
        <VoiceRecorder disabled={library.tracks.length >= MAX_AUDIO_TRACKS} onSaved={() => close()} />
      </Dialog>
    </section>
  );
}
