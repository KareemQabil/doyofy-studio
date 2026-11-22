/** The four editor sections. Only a few controls are visible at once; English and extras are disclosed on demand. */
import { useState, type ReactNode } from 'react';
import type { Event, InvitationDesignContent } from '../../domain/types';
import { eventTypeInfo, isCoupleEvent } from '../../domain/event';
import { CARD_NAMES, SCENE_NAMES } from '../../domain/invitation';
import { presetOf, presetsFor, TEMPLATE_PRESETS } from '../../domain/templates';
import { daysBetween, localDateOf } from '../../domain/format';
import { Banner, Button, Field, Icon, IconButton, Input, Select, Stepper, Switch, Textarea } from '../../ui';
import { useMutation, useServices } from '../../app/data';
import { errorMessage } from '../../services/errors';
import { CardThumb } from '../invitation/CardThumb';
import { TemplateThumb } from '../templates/TemplateThumb';
import { useAudioLibrary } from '../account/audio-state';
import { Link } from '../../app/router';
import { copyFor, type Copy } from '../../domain/copy';
import { currentDialect, useCopy } from '../../ui/copy';

type Update = (patch: Partial<InvitationDesignContent>) => void;

function SecHead({ title, hint, children }: { title: string; hint?: ReactNode; children?: ReactNode }) {
  return (
    <div className="ed-sec-head">
      <div className="grow"><h2 className="ed-sec-title">{title}</h2>{hint && <p className="ed-sec-hint">{hint}</p>}</div>
      {children}
    </div>
  );
}

// ------------------------------------------------------------------ المحتوى
export function ContentSection({ event, content, update }: { event: Event; content: InvitationDesignContent; update: Update }) {
  const { t } = useCopy();
  const couple = isCoupleEvent(event.type);
  const info = eventTypeInfo(event.type);
  const dn = content.displayNames;
  const [en, setEn] = useState(!!(dn.aEn || dn.bEn));
  // the English line is separate text: once the Arabic changes, say so where it is typed (it never silently goes stale)
  const [arEdited, setArEdited] = useState(false);
  const enStale = arEdited && !en && !!content.message.en.trim();
  const setName = (k: keyof typeof dn, v: string) => update({ displayNames: { ...dn, [k]: v.trim() ? v : undefined } });
  const prog = content.program;
  const setProg = (i: number, k: 'time' | 'ar' | 'en', v: string) => update({ program: prog.map((p, j) => (j === i ? { ...p, [k]: v } : p)) });

  return (
    <div className="ed-sec">
      <section className="ed-group ed-content-names">
        <SecHead title={t('esNames')} hint={t('esNamesHint')} />
        <div className={couple ? 'grid-2' : 'stack'}>
          <Field label={couple ? info.nameLabel : t('esName')}><Input value={dn.a ?? ''} placeholder={event.names.a} onChange={(e) => setName('a', e.target.value)} /></Field>
          {couple && <Field label={info.nameLabelB ?? t('esSecondName')}><Input value={dn.b ?? ''} placeholder={event.names.b} onChange={(e) => setName('b', e.target.value)} /></Field>}
        </div>
        {en && (
          <div className={couple ? 'grid-2' : 'stack'}>
            <Field label={t('esEnglish')} optional><Input ltr value={dn.aEn ?? ''} placeholder={event.names.aEn || 'Sara'} onChange={(e) => setName('aEn', e.target.value)} /></Field>
            {couple && <Field label={t('esEnglish')} optional><Input ltr value={dn.bEn ?? ''} placeholder={event.names.bEn || 'Ahmed'} onChange={(e) => setName('bEn', e.target.value)} /></Field>}
          </div>
        )}
      </section>

      <section className="ed-group ed-content-message">
        <SecHead title={t('esMessage')} />
        <Field label={t('esArabic')}><Textarea rows={3} value={content.message.ar} onChange={(e) => { setArEdited(true); update({ message: { ...content.message, ar: e.target.value } }); }} /></Field>
        {enStale && <p className="ed-en-stale" role="status"><Icon name="info" size="sm" /><span>{t('esEnStale')} <bdi dir="ltr">«{content.message.en.length > 48 ? `${content.message.en.slice(0, 48)}…` : content.message.en}»</bdi></span>
          <span className="ed-en-stale-actions"><button type="button" className="link-btn" onClick={() => setEn(true)}>{t('esEditIt')}</button><button type="button" className="link-btn" onClick={() => update({ message: { ...content.message, en: '' } })}>{t('esDeleteIt')}</button></span></p>}
        {en && <Field label={t('esEnglish')} optional><Textarea rows={3} dir="ltr" value={content.message.en} onChange={(e) => update({ message: { ...content.message, en: e.target.value } })} /></Field>}
        <button type="button" className="link-btn" aria-expanded={en} onClick={() => setEn((v) => !v)}>{t(en ? 'esHideEnglish' : 'esShowEnglish')}</button>
      </section>

      <details className="ed-group ed-program-disclosure">
        <summary>{t('esProgramme')} <span>{t('esProgrammeMeta', { n: prog.length })}</span><Icon name="chevron-down" size="sm"/></summary>
        <p className="ed-sec-hint">{t('esProgrammeHint')}</p>
        <ol className="ed-program">
          {prog.map((p, i) => (
            <li key={i}>
              <Input type="time" aria-label={t('esItemTime', { n: i + 1 })} value={p.time} onChange={(e) => setProg(i, 'time', e.target.value)} />
              <Input aria-label={t('esItem', { n: i + 1 })} value={p.ar} placeholder={t('esItemPlaceholder')} onChange={(e) => setProg(i, 'ar', e.target.value)} />
              <IconButton icon="trash" size="sm" label={t('esDeleteItem', { n: i + 1 })} onClick={() => update({ program: prog.filter((_, j) => j !== i) })} />
              {en && <Input ltr className="ed-prog-en" aria-label={`Item ${i + 1}`} value={p.en} placeholder="Item" onChange={(e) => setProg(i, 'en', e.target.value)} />}
            </li>
          ))}
        </ol>
        {prog.length < 6 && <Button variant="ghost" size="sm" icon="plus" onClick={() => update({ program: [...prog, { time: prog.at(-1)?.time ?? event.time, ar: '', en: '' }] })}>{t('esAddItem')}</Button>}
      </details>
    </div>
  );
}

// ------------------------------------------------------------------ التصميم
export function DesignSection({ event, content, invitation, update, onChangeTemplate }: { event: Event; content: InvitationDesignContent; invitation: unknown; update: Update; onChangeTemplate: () => void }) {
  const { t } = useCopy();
  const preset = presetOf(content);
  const scenes = Object.keys(SCENE_NAMES);
  const cards = [...new Set([content.cardId, ...presetsFor(event.type).suited.map(p => p.cardId)])].slice(0,6);
  const recommendedScenes = [...new Set([content.sceneId, ...TEMPLATE_PRESETS.filter(p=>p.cardId===content.cardId).map(p=>p.sceneId)])].slice(0,3);
  return (
    <div className="ed-sec">
      <section className="ed-group ed-template">
        <TemplateThumb className="ed-template-thumb" preset={{ id: 'current', name: '', line: '', styles: [], occasionTags: [], cardId: content.cardId, sceneId: content.sceneId, experience: content.experience }} invitation={invitation} />
        <div className="stack gap-2">
          <p className="ed-sec-hint">{t('esDesign')}</p>
          <p className="ed-template-name">{preset?.name ?? t('esCustom')}</p>
          <Button variant="secondary" size="sm" icon="grid" onClick={onChangeTemplate}>{t('esChangeDesign')}</Button>
        </div>
      </section>

      <section className="ed-group"><SecHead title={t('esForYou')} hint={t('esForYouHint')} /><div className="ed-picks ed-cards" role="radiogroup" aria-label={t('esCardsLabel')}>{cards.map(id => <button key={id} type="button" role="radio" aria-label={CARD_NAMES[id]} aria-checked={content.cardId===id} className={`ed-pick${content.cardId===id?' is-on':''}`} onClick={()=>update({cardId:id})}><CardThumb event={event} content={{...content,cardId:id}} width={84} /><span className="ed-pick-name">{CARD_NAMES[id]}</span></button>)}</div></section>
      <section className="ed-group ed-scene-selection"><SecHead title={t('esScene')} hint={t('esSceneHint')} /><div className="ed-picks ed-scenes" role="radiogroup" aria-label={t('esScenesLabel')}>{recommendedScenes.map(id => <button key={id} type="button" role="radio" aria-label={SCENE_NAMES[id]} aria-checked={content.sceneId===id} className={`ed-pick${content.sceneId===id?' is-on':''}`} onClick={()=>update({sceneId:id})}><TemplateThumb preset={{id,name:'',line:'',styles:[],occasionTags:[],cardId:content.cardId,sceneId:id,experience:content.experience}} invitation={invitation} /><span className="ed-pick-name">{SCENE_NAMES[id]}</span></button>)}</div></section>
      <details className="ed-advanced"><summary>{t('esAll')} <span>{t('esOptional')}</span><Icon name="chevron-down" size="sm"/></summary>
      <section className="ed-group">
        <SecHead title={t('esCard')} />
        <div className="ed-picks ed-cards" role="radiogroup" aria-label={t('esCard')}>
          {Object.keys(CARD_NAMES).map((id) => (
            <button key={id} type="button" role="radio" aria-label={CARD_NAMES[id]} aria-checked={content.cardId === id} className={`ed-pick${content.cardId === id ? ' is-on' : ''}`} onClick={() => update({ cardId: id })}>
              <CardThumb event={event} content={{ ...content, cardId: id }} width={84} />
              <span className="ed-pick-name">{CARD_NAMES[id]}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="ed-group">
        <SecHead title={t('esScene')} />
        <div className="ed-picks ed-scenes" role="radiogroup" aria-label={t('esScene')}>
          {scenes.map((id) => (
            <button key={id} type="button" role="radio" aria-label={SCENE_NAMES[id]} aria-checked={content.sceneId === id} className={`ed-pick${content.sceneId === id ? ' is-on' : ''}`} onClick={() => update({ sceneId: id })}>
              <TemplateThumb preset={{ id, name: '', line: '', styles: [], occasionTags: [], cardId: content.cardId, sceneId: id, experience: content.experience }} invitation={invitation} />
              <span className="ed-pick-name">{SCENE_NAMES[id]}</span>
            </button>
          ))}
        </div>
      </section>
      </details>
    </div>
  );
}

// ------------------------------------------------------------------ الحركة والصوت
function Option({ on, title, text, onClick, art }: { on: boolean; title: string; text: string; onClick: () => void; art?: ReactNode }) {
  return (
    <button type="button" role="radio" aria-checked={on} className={`ed-option${on ? ' is-on' : ''}`} onClick={onClick}>
      {art}
      <span className="ed-option-text"><span className="ed-option-title">{title}</span><span className="ed-option-d">{text}</span></span>
      <span className="ed-option-mark" aria-hidden="true"><Icon name="check" size="sm" /></span>
    </button>
  );
}

export function MotionSection({ content, invitation, update, sound, onSound }: { content: InvitationDesignContent; invitation: unknown; update: Update; sound: boolean; onSound: (v: boolean) => void }) {
  const x = content.experience;
  const library = useAudioLibrary();
  const audio = content.audio ?? { mode: 'default' as const };
  const selectedAudio = audio.mode === 'library' ? `track:${audio.trackId}` : audio.mode;
  const setX = (patch: Partial<InvitationDesignContent['experience']>) => update({ experience: { ...x, ...patch, dimension: '2d' } });
  return (
    <div className="ed-sec">
      <section className="ed-group">
        <SecHead title="الحركة" />
        <div className="ed-options is-text" role="radiogroup" aria-label="الحركة">
          <Option on={x.motion === 'animated'} title="متحركة" text="افتتاحية سينمائية، وظرف يُختم ويطير بعد الرد." onClick={() => setX({ motion: 'animated' })} />
          <Option on={x.motion === 'static'} title="ثابتة" text="تفتح مباشرة على البطاقة، بلا حركة." onClick={() => setX({ motion: 'static' })} />
        </div>
      </section>
      <section className="ed-group">
        <SecHead title="الصوت" hint="اختر صوت الدعوة. يبدأ بعد أول تفاعل ويمكن للضيف كتمه." />
        <Field label="صوت الدعوة"><Select value={selectedAudio} onChange={e => {
          const value = e.target.value;
          if (value === 'off' || value === 'default') update({ audio: { mode: value } });
          else { const track = library.tracks.find(t => t.id === value.slice(6)); if (track) update({ audio: { mode: 'library', trackId: track.id, trackName: track.name } }); }
        }}>
          <option value="default">{library.defaultTrackId ? `افتراضي الحساب · ${library.tracks.find(t => t.id === library.defaultTrackId)?.name}` : 'الصوت الأساسي'}</option>
          {library.tracks.map(track => <option key={track.id} value={`track:${track.id}`}>{track.name}</option>)}
          {audio.mode === 'library' && !library.tracks.some(t => t.id === audio.trackId) && <option value={selectedAudio}>المقطع غير متاح · سيعمل الصوت الأساسي</option>}
          <option value="off">بدون صوت</option>
        </Select></Field>
        <p className="ed-sec-hint"><Link to="/app/account">إدارة مكتبتي الصوتية</Link> · المقاطع المرفوعة تعمل على هذا المتصفح فقط في التجربة.</p>
        <Switch label="شغّل الصوت في المعاينة" hint="هنا فقط، لتسمعه كما سيسمعه الضيف. لا يغيّر الدعوة." checked={sound} onChange={onSound} />
      </section>
    </div>
  );
}

// ------------------------------------------------------------------ تفاصيل المناسبة (event data — shared)
export interface EventDraft { date: string; time: string; venue: string; city: string; mapUrl: string; partySize: number }
export const eventFields = (e: Event): EventDraft => ({ date: e.date, time: e.time, venue: e.venue.name, city: e.venue.city, mapUrl: e.venue.mapUrl ?? '', partySize: e.settings.defaultPartySize });
export type EventDraftErrors = Partial<Record<keyof EventDraft, string>>;
/** Shared by the manual save and the one-action publish, so the two paths accept the same values. */
export function validateEventFields(event: Event, draft: EventDraft, now: Date, c: Copy = copyFor(currentDialect())): EventDraftErrors {
  const errors: EventDraftErrors = {};
  const parsed = new Date(`${draft.date}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== draft.date) errors.date = c.esDateError;
  else if (draft.date !== event.date && daysBetween(localDateOf(now, event.timeZone), draft.date) < 0) errors.date = c.esFutureError;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time)) errors.time = c.esTimeError;
  if (!draft.venue.trim()) errors.venue = c.esVenueError;
  if (!draft.city.trim()) errors.city = c.esCityError;
  if (draft.mapUrl.trim()) {
    try { const url = new URL(draft.mapUrl); if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) errors.mapUrl = c.esMapHttps; }
    catch { errors.mapUrl = c.esMapBad; }
  }
  if (!Number.isInteger(draft.partySize) || draft.partySize < 1 || draft.partySize > 20) errors.partySize = c.esSizeError;
  return errors;
}

/** the event as the preview should show it: valid unsaved edits appear instantly */
export function previewEvent(e: Event, d: EventDraft): Event {
  return {
    ...e,
    date: /^\d{4}-\d{2}-\d{2}$/.test(d.date) ? d.date : e.date,
    time: /^\d{2}:\d{2}$/.test(d.time) ? d.time : e.time,
    venue: { ...e.venue, name: d.venue.trim() || e.venue.name, city: d.city.trim() || e.venue.city, mapUrl: d.mapUrl.trim() || undefined },
  };
}

export function EventSection({ event, draft, onDraft, validationErrors = {} }: { event: Event; draft: EventDraft; onDraft: (d: EventDraft) => void; validationErrors?: EventDraftErrors }) {
  const services = useServices();
  const { t, copy } = useCopy();
  const [errors, setErrors] = useState<Partial<Record<keyof EventDraft, string>>>({});
  const [savedAt, setSavedAt] = useState(0);
  const dirty = JSON.stringify(draft) !== JSON.stringify(eventFields(event));
  const set = <K extends keyof EventDraft>(k: K, v: EventDraft[K]) => { onDraft({ ...draft, [k]: v }); if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined })); };
  const save = useMutation((s, d: EventDraft) => s.events.update(event.id, {
    date: d.date, time: d.time,
    venue: { ...event.venue, name: d.venue.trim(), city: d.city.trim(), mapUrl: d.mapUrl.trim() || undefined },
    settings: { defaultPartySize: d.partySize },
  }), { onSuccess: () => setSavedAt(Date.now()) });

  const submit = () => {
    const e = validateEventFields(event, draft, services.clock.now(), copy);
    setErrors(e);
    if (!Object.keys(e).length) void save.run(draft);
  };
  const shownErrors = { ...validationErrors, ...errors };

  return (
    <div className="ed-sec">
      <Banner tone="info" compact title={t('esUnified')}>{t('esUnifiedText')}</Banner>
      <section className="ed-group">
        <SecHead title={t('esWhen')} />
        <div className="grid-2">
          <Field label={t('esDate')} required error={shownErrors.date}><Input type="date" data-event-field="date" value={draft.date} onChange={(e) => set('date', e.target.value)} /></Field>
          <Field label={t('esTime')} required error={shownErrors.time}><Input type="time" data-event-field="time" value={draft.time} onChange={(e) => set('time', e.target.value)} /></Field>
        </div>
      </section>
      <section className="ed-group">
        <SecHead title={t('esWhere')} />
        <div className="grid-2">
          <Field label={t('esVenue')} required error={shownErrors.venue}><Input data-event-field="venue" value={draft.venue} onChange={(e) => set('venue', e.target.value)} /></Field>
          <Field label={t('esCity')} required error={shownErrors.city}><Input data-event-field="city" value={draft.city} onChange={(e) => set('city', e.target.value)} /></Field>
        </div>
        <Field label={t('esMap')} optional error={shownErrors.mapUrl} hint={t('esMapHint')}><Input ltr type="url" data-event-field="mapUrl" value={draft.mapUrl} placeholder="https://maps.google.com/…" onChange={(e) => set('mapUrl', e.target.value)} /></Field>
      </section>
      <section className="ed-group">
        <SecHead title={t('esGuests')} />
        <Stepper label={t('esPerInvitation')} value={draft.partySize} min={1} max={20} onChange={(v) => set('partySize', v)} />
        {shownErrors.partySize && <p role="alert" className="text-danger">{shownErrors.partySize}</p>}
        <p className="ed-sec-hint">{t('esPerInvitationHint')}</p>
      </section>
      {save.error ? <Banner tone="danger" compact>{errorMessage(save.error)}</Banner> : null}
      <div className="ed-save-row">
        <Button variant="primary" loading={save.pending} disabled={!dirty} onClick={submit}>{t('esSave')}</Button>
        {dirty ? <Button variant="ghost" onClick={() => { onDraft(eventFields(event)); setErrors({}); }}>{t('undo')}</Button>
          : savedAt ? <span className="ed-saved" role="status"><Icon name="check" size="sm" />{t('esSaved')}</span> : null}
      </div>
    </div>
  );
}
