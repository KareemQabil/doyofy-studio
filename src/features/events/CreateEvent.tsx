/**
 * Create event — a three-step wizard with as few choices per step as possible:
 *   1. the occasion (the tactile occasion deck, with search as a fallback)
 *   2. the design: a full-screen vertical feed of the designs suited to that occasion (one per screen)
 *   3. the details: essentials only (names · date · time · venue/city), with the chosen invitation taking shape live
 *   → the invitation opens in the editor for fine edits and publishing.
 * The step indicator stays at the top of every step. The unfinished draft (fields, step and chosen design) is saved
 * per local account and resumed. A shared catalogue link (?type=…&template=…&preview=1) opens step 2 on that design.
 */
import { forwardRef, useEffect, useMemo, useRef, useState, type FormEvent, type InputHTMLAttributes } from 'react';
import type { CreateEventInput, EventType } from '../../domain/types';
import { eventTypeInfo, isCoupleEvent, validateEssentials, type EssentialsErrors } from '../../domain/event';
import { formatEventDate, formatTime, localDateOf } from '../../domain/format';
import { Banner, Button, Field, FocusLayout, Icon, Input, Select } from '../../ui';
import { useMutation, useServices } from '../../app/data';
import { useBlocker, useLocation, useNavigate } from '../../app/router';
import { paths } from '../../app/paths';
import { errorMessage } from '../../services/errors';
import { SignatureOccasions } from '../signature/SignatureOccasions';
import { SignatureCreatePreview, draftPreviewEvent } from '../signature/SignatureCreatePreview';
import { presetById, type TemplatePreset } from '../../domain/templates';
import { defaultDesign } from '../../domain/invitation';
import { useCopy } from '../../ui/copy';
import { TemplateFeed } from '../templates/TemplateFeed';
import { useDesignFeed } from '../templates/design-feed';
import { sampleEvent } from '../signature/sample-event';
import { useMedia } from '../signature/useMedia';

export const TIME_ZONES: Array<[string, string]> = [
  ['Asia/Riyadh', 'الرياض / جدة (السعودية)'], ['Asia/Dubai', 'دبي / أبوظبي'], ['Asia/Kuwait', 'الكويت'], ['Asia/Qatar', 'الدوحة'],
  ['Asia/Bahrain', 'المنامة'], ['Asia/Muscat', 'مسقط'], ['Africa/Cairo', 'القاهرة'], ['Asia/Amman', 'عمّان'], ['Asia/Beirut', 'بيروت'],
  ['Asia/Baghdad', 'بغداد'], ['Africa/Casablanca', 'الدار البيضاء'], ['Africa/Tunis', 'تونس'], ['Europe/London', 'لندن'],
];

type Step = 1 | 2 | 3;
type Draft = { type: EventType | null; a: string; b: string; aEn: string; bEn: string; title: string; date: string; time: string; venue: string; city: string; timeZone: string };
const EMPTY: Draft = { type: null, a: '', b: '', aEn: '', bEn: '', title: '', date: '', time: '20:00', venue: '', city: '', timeZone: 'Asia/Riyadh' };

/** a draft worth announcing: something the organizer actually typed (not just the occasion they tapped) */
const hasTyped = (d: Draft) => !!(d.a.trim() || d.b.trim() || d.title.trim() || d.date || d.venue.trim() || d.city.trim());

/** Brings an invalid field into view BELOW the sticky live-card band (phones), label included, then focuses it. */
function revealField(el: HTMLElement) {
  el.focus({ preventScroll: true });
  const target = el.closest<HTMLElement>('.field') ?? el;
  const band = document.querySelector<HTMLElement>('.wz-live');
  const cover = band && getComputedStyle(band).position === 'sticky' ? band.getBoundingClientRect().bottom : (document.querySelector('.focus-bar')?.getBoundingClientRect().bottom ?? 0);
  const top = target.getBoundingClientRect().top;
  if (top < cover + 12 || top > window.innerHeight - 120) window.scrollTo({ top: window.scrollY + top - cover - 16, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

function readDraft(key: string, requested: EventType | null): { draft: Draft; templateId?: string; step?: Step } | null {
  try {
    const saved = JSON.parse(window.localStorage.getItem(key) || 'null');
    if (saved?.version !== 1 || !saved.draft || typeof saved.draft !== 'object') return null;
    const d = saved.draft;
    if (!d.type || eventTypeInfo(d.type).id !== d.type || (requested && requested !== d.type)) return null;
    if (Object.keys(EMPTY).some(k => k !== 'type' && typeof d[k] !== 'string')) return null;
    if (!TIME_ZONES.some(([zone]) => zone === d.timeZone)) return null;
    return { draft: d as Draft, templateId: typeof saved.templateId === 'string' ? saved.templateId : undefined, step: [1, 2, 3].includes(saved.step) ? saved.step : undefined };
  } catch { return null; }
}

/** The step indicator: always visible; finished steps can be revisited. */
function WizardSteps({ step, onGo, disabled }: { step: Step; onGo: (s: Step) => void; disabled?: boolean }) {
  const { t } = useCopy();
  const labels = [t('wizardOccasion'), t('wizardDesign'), t('wizardDetails')];
  return <nav className="wz-steps" aria-label={t('wzStepsLabel')}><ol>
    {labels.map((label, i) => {
      const n = (i + 1) as Step, done = n < step, on = n === step;
      // the step's position and state are read as words; the numeral and tick are only drawn
      const inner = <><span className="wz-step-n num" aria-hidden="true">{done ? '✓' : n}</span><span className="sr-only">{t('wzStepOf', { n })}</span><span className="wz-step-label">{label}</span>{on && <span className="sr-only">{t('wzStepCurrent')}</span>}</>;
      return <li key={n} className={`${done ? 'is-done' : ''}${on ? ' is-on' : ''}`} aria-current={on ? 'step' : undefined}>
        {done ? <button type="button" onClick={() => onGo(n)} disabled={disabled} aria-label={t('wzStepBack', { n, label })}>{inner}</button>
          : <span aria-current={on ? 'step' : undefined}>{inner}</span>}
      </li>;
    })}
  </ol></nav>;
}

/**
 * A native date/time field whose empty or filled state reads in Arabic: the browser's own "mm/dd/yyyy" / "08:00 PM"
 * is hidden until the field is focused for typing (the picker still opens on tap).
 */
const ArabicDateTime = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { kind: 'date' | 'time' }>(function ArabicDateTime({ kind, value, ...rest }, ref) {
  const { t } = useCopy();
  const v = String(value ?? '');
  const face = !v ? t(kind === 'date' ? 'wzPickDate' : 'wzPickTime') : kind === 'date' ? formatEventDate(v) : formatTime(v);
  return <span className={`wz-datetime${v ? '' : ' is-empty'}`}>
    <Input ref={ref} type={kind} value={v} {...rest} onClick={(e) => { try { (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.(); } catch { /* not allowed here: typing still works */ } rest.onClick?.(e); }} />
    <span className="wz-datetime-face" aria-hidden="true">{face}</span>
  </span>;
});

export function CreateEvent() {
  const services = useServices();
  const navigate = useNavigate();
  const loc = useLocation();
  const { t } = useCopy();
  const desktop = useMedia('(min-width: 960px)');
  const requestedTemplate = presetById(loc.search.get('template') ?? '');
  const queryType = loc.search.get('type') as EventType | null;
  const preset = queryType && eventTypeInfo(queryType).id === queryType ? queryType : requestedTemplate?.primaryOccasion ?? null;
  const draftKey = `doyofy:create-draft:v1:${services.session.currentUser().id}`;
  const [cached] = useState(() => readDraft(draftKey, preset));
  const fromLink = loc.search.get('preview') === '1' && !!requestedTemplate;
  const [step, setStep] = useState<Step>(() => fromLink ? 2 : cached?.step ?? (cached?.draft.a || cached?.draft.date ? 3 : requestedTemplate ? 3 : preset ? 2 : 1));
  const [d, setD] = useState<Draft>(cached?.draft ?? { ...EMPTY, type: preset });
  const [selectedTemplate, setSelectedTemplate] = useState<TemplatePreset | undefined>(() => requestedTemplate ?? presetById(cached?.templateId ?? ''));
  const [browsed, setBrowsed] = useState<TemplatePreset | null>(() => requestedTemplate ?? presetById(cached?.templateId ?? '') ?? null);
  const [resumed, setResumed] = useState(!!cached && hasTyped(cached.draft));
  const [errors, setErrors] = useState<EssentialsErrors>({});
  const [showTz, setShowTz] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const typed = d.a || d.b || d.title || d.date || d.venue || d.city;
  const create = useMutation((s, input: CreateEventInput) => s.events.create(input));
  const [created, setCreated] = useState(false);
  const feed = useDesignFeed(d.type, browsed?.id ?? selectedTemplate?.id);
  useEffect(() => {
    try {
      if (created) window.localStorage.removeItem(draftKey);
      else if (d.type) window.localStorage.setItem(draftKey, JSON.stringify({ version: 1, draft: d, templateId: selectedTemplate?.id, step }));
    } catch { /* Creation remains usable when browser storage is full or disabled. */ }
  }, [d, selectedTemplate?.id, step, created, draftKey]);
  useBlocker(!!typed && !created, t('wzLeave'));

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => { setD((x) => ({ ...x, [k]: v })); if (errors[k as keyof EssentialsErrors]) setErrors((e) => ({ ...e, [k]: undefined })); };
  const info = d.type ? eventTypeInfo(d.type) : null;
  const couple = d.type ? isCoupleEvent(d.type) : true;
  const today = localDateOf(services.clock.now(), d.timeZone);
  // a design chosen for another occasion doesn't follow the organizer to a new one
  const chooseType = (type: EventType) => {
    setD((x) => ({ ...x, type }));
    if (selectedTemplate && !selectedTemplate.occasionTags.includes(type)) setSelectedTemplate(undefined);
    if (browsed && !browsed.occasionTags.includes(type)) setBrowsed(null);
  };

  const input = (): CreateEventInput => ({
    type: d.type ?? 'other',
    names: { a: d.a, b: couple ? d.b : undefined, aEn: d.aEn || undefined, bEn: couple ? d.bEn || undefined : undefined },
    title: d.type === 'other' ? d.title : undefined,
    date: d.date, time: d.time, timeZone: d.timeZone,
    venue: { name: d.venue, city: d.city },
  });

  const go = (next: Step) => {
    if (next > 1 && !d.type) return;
    setStep(next);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0 });
      if (next === 3 && desktop) formRef.current?.querySelector<HTMLInputElement>('input')?.focus();
      // step 3 on a phone: focus starts on the step's own heading (what it asks), not on the whole page
      else document.querySelector<HTMLElement>(next === 2 ? '.tf-scroll' : '.wz-details-title')?.focus({ preventScroll: true });
    });
  };
  const shown = feed.list.find(p => p.cardId === browsed?.cardId) ?? feed.list.find(p => p.cardId === selectedTemplate?.cardId) ?? feed.list[0] ?? null;
  const chooseDesign = () => { if (shown) { setSelectedTemplate(shown); setBrowsed(shown); } go(3); };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = validateEssentials(input(), today);
    setErrors(e);
    if (Object.keys(e).length) {
      requestAnimationFrame(() => { const bad = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]'); if (bad) revealField(bad); });
      return;
    }
    const made = await create.run(input());
    if (made) {
      setCreated(true);
      try { window.localStorage.removeItem(draftKey); } catch { /* storage can be unavailable */ }
      const query = new URLSearchParams({ first: '1', ...(selectedTemplate ? { template: selectedTemplate.id } : {}) });
      navigate(`${paths.design(made.id)}?${query}`, { force: true });
    }
  };

  // step 2 shows the designs with the names typed so far, or a labelled example couple/person before that
  const feedEvent = useMemo(() => d.type ? (d.a.trim() ? draftPreviewEvent({ ...d, type: d.type }, today) : sampleEvent(d.type)) : null, [d, today]);
  const fields = d.type ? { ...d, type: d.type } : null;

  return (
    <FocusLayout
      width="full"
      title={t('createEvent')}
      back={{ to: paths.events, label: t('cancel') }}
      footer={step === 1
        ? <><span className="create-picked" aria-live="polite">{info ? <>{t('wzPicked')} <strong>{info.label}</strong></> : t('wzPickType')}</span><Button key="next" variant="primary" size="lg" iconEnd="forward" disabled={!d.type} onClick={() => go(2)}>{t('wizardToDesign')}</Button></>
        : step === 2
          ? <><Button key="back" variant="ghost" icon="back" onClick={() => go(1)}>{t('back')}</Button><Button key="choose" variant="primary" size="lg" iconEnd="forward" disabled={!shown} onClick={chooseDesign}>{t('chooseDesign')}</Button></>
          : <><Button key="back" variant="ghost" icon="back" disabled={create.pending} onClick={() => go(2)}>{t('back')}</Button><Button key="create" variant="primary" size="lg" type="submit" form="create-event" loading={create.pending}>{t('prepareInvitation')}</Button></>}
    >
      <div className={`wz wz-step-${step}`}>
        <WizardSteps step={step} onGo={go} disabled={create.pending} />
        {/* one slim line, only when something typed was restored */}
        {resumed && step !== 2 && <p className="wz-resume" role="status"><Icon name="info" size="sm" /><span>{t('wzResumed')}</span>
          <button type="button" className="link-btn" onClick={() => { setD({ ...EMPTY, type: preset ?? d.type }); setErrors({}); setResumed(false); setSelectedTemplate(requestedTemplate); setBrowsed(requestedTemplate ?? null); }}>{t('wzStartOver')}</button></p>}
        {step === 1 && <SignatureOccasions value={d.type} onChange={chooseType} onConfirm={(type) => { chooseType(type); go(2); }} />}
        {step === 2 && feedEvent && d.type && (
          <div className="wz-feed-page">
            <h2 className="sr-only">{t('wzFeedTitle', { type: info?.label ?? '' })}</h2>
            <TemplateFeed presets={feed.list} preset={shown} event={feedEvent} base={defaultDesign(feedEvent)} current={selectedTemplate?.id} currentLabel={t(fromLink && selectedTemplate?.id === requestedTemplate?.id ? 'wzSentToYou' : 'wzYourChoice')} pending={false} onNavigate={setBrowsed}
              filters={feed.filters} filter={feed.filter} onFilter={feed.setFilter} emptyAction={() => feed.setFilter('for-you')} />
          </div>
        )}
        {step === 3 && fields && (
          <div className="wz-details">
            {!desktop && <SignatureCreatePreview compact fields={fields} today={today} template={selectedTemplate} onChangeDesign={() => go(2)} />}
            <form id="create-event" ref={formRef} className="wz-form" onSubmit={submit} noValidate>
              <header className="wz-head wz-head-start">
                <h2 className="wz-details-title" tabIndex={-1}>{t('wzEssentials', { type: info?.label ?? '' })}</h2>
                <p>{t('createEssentials')}</p>
              </header>
              {create.error ? <Banner tone="danger" title={t('wzNotCreated')}>{errorMessage(create.error)}</Banner> : null}
              <fieldset className="wz-group">
                <legend>{t(couple ? 'wzCouple' : 'wzHost')}</legend>
                <div className={couple ? 'wz-pair' : 'wz-one'}>
                  <Field label={info?.nameLabel ?? t('wzName')} required error={errors.a}><Input value={d.a} onChange={(e) => set('a', e.target.value)} autoComplete="off" /></Field>
                  {couple && <Field label={info?.nameLabelB ?? t('wzSecondName')} required error={errors.b}><Input value={d.b} onChange={(e) => set('b', e.target.value)} autoComplete="off" /></Field>}
                </div>
                {d.type === 'other' && <Field label={t('wzEventName')} required error={errors.title} hint={t('wzEventNameHint')}><Input value={d.title} onChange={(e) => set('title', e.target.value)} /></Field>}
              </fieldset>
              <fieldset className="wz-group">
                <legend>{t('wzWhen')}</legend>
                <div className="wz-pair">
                  <Field label={t('wzDate')} required error={errors.date}><ArabicDateTime kind="date" value={d.date} min={today} onChange={(e) => set('date', e.target.value)} /></Field>
                  <Field label={t('wzTime')} required error={errors.time}><ArabicDateTime kind="time" value={d.time} onChange={(e) => set('time', e.target.value)} /></Field>
                </div>
                {!showTz ? (
                  <p className="wz-tz">{t('wzTimeZone', { zone: TIME_ZONES.find(([z]) => z === d.timeZone)?.[1] ?? '' })} <button type="button" className="link-btn wz-tz-change" onClick={() => setShowTz(true)} aria-label={t('wzChangeZone')}>{t('wzChange')}</button></p>
                ) : (
                  <Field label={t('wzZone')}><Select value={d.timeZone} onChange={(e) => set('timeZone', e.target.value)}>{TIME_ZONES.map(([z, l]) => <option key={z} value={z}>{l}</option>)}</Select></Field>
                )}
              </fieldset>
              <fieldset className="wz-group">
                <legend>{t('wzWhere')}</legend>
                <div className="wz-pair">
                  <Field label={t('wzVenue')} required error={errors.venue}><Input value={d.venue} onChange={(e) => set('venue', e.target.value)} placeholder={t('wzVenueExample')} /></Field>
                  <Field label={t('wzCity')} required error={errors.city}><Input value={d.city} onChange={(e) => set('city', e.target.value)} placeholder={t('wzCityExample')} /></Field>
                </div>
              </fieldset>
            </form>
            {desktop && <aside className="wz-aside sig-create-aside" aria-label={t('wzPreviewAside')}><SignatureCreatePreview fields={fields} today={today} template={selectedTemplate} onChangeDesign={() => go(2)} /></aside>}
          </div>
        )}
      </div>
    </FocusLayout>
  );
}
