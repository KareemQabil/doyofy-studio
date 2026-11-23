/**
 * Create event — two steps, as few decisions as possible:
 *   1. the occasion (the tactile occasion deck, with search as a fallback); tapping the card in front moves on
 *   2. the details: only what the invitation needs — the name(s) the occasion asks for and the date. The time is a
 *      chip on 8:00 مساءً (tap to change), the place is optional behind «أضف المكان (اختياري)», the time zone is
 *      the device's own (changed only from a small link next to the time). The invitation takes shape live.
 *   → the invitation opens in the editor; it is live from the start (no publish step).
 * There is no design step: a new invitation wears its occasion's own (featured) design, and the design is changed
 * only in the editor's «الشكل». A shared design link (?type=…&template=…) still works: it preselects that design
 * silently and opens on the details. The step indicator stays at the top; the unfinished draft (fields, step and a
 * linked design) is saved per local account and resumed.
 */
import { forwardRef, useEffect, useRef, useState, type FormEvent, type InputHTMLAttributes } from 'react';
import type { CreateEventInput, EventType } from '../../domain/types';
import { DEFAULT_EVENT_TIME, eventTypeInfo, isCoupleEvent, validateEssentials, type EssentialsErrors } from '../../domain/event';
import { formatEventDate, formatTime, localDateOf } from '../../domain/format';
import { Banner, Button, EmptyState, Field, FocusLayout, Icon, Input, LinkButton, Select } from '../../ui';
import { useRole } from '../shared/OwnerOnly';
import { can } from '../../domain/roles';
import { useMutation, useServices } from '../../app/data';
import { useBlocker, useLocation, useNavigate } from '../../app/router';
import { paths } from '../../app/paths';
import { errorMessage } from '../../services/errors';
import { SignatureOccasions } from '../signature/SignatureOccasions';
import { SignatureCreatePreview } from '../signature/SignatureCreatePreview';
import { presetById, type TemplatePreset } from '../../domain/templates';
import { useCopy } from '../../ui/copy';
import { useMedia } from '../signature/useMedia';

export const TIME_ZONES: Array<[string, string]> = [
  ['Asia/Riyadh', 'الرياض / جدة (السعودية)'], ['Asia/Dubai', 'دبي / أبوظبي'], ['Asia/Kuwait', 'الكويت'], ['Asia/Qatar', 'الدوحة'],
  ['Asia/Bahrain', 'المنامة'], ['Asia/Muscat', 'مسقط'], ['Africa/Cairo', 'القاهرة'], ['Asia/Amman', 'عمّان'], ['Asia/Beirut', 'بيروت'],
  ['Asia/Baghdad', 'بغداد'], ['Africa/Casablanca', 'الدار البيضاء'], ['Africa/Tunis', 'تونس'], ['Europe/London', 'لندن'],
];

type Step = 1 | 2;
type Draft = { type: EventType | null; a: string; b: string; title: string; date: string; time: string; venue: string; city: string; timeZone: string };
const EMPTY: Draft = { type: null, a: '', b: '', title: '', date: '', time: DEFAULT_EVENT_TIME, venue: '', city: '', timeZone: 'Asia/Riyadh' };

/** the device's own time zone when it is one we list; otherwise Riyadh (the organizer can change it from a small link) */
function deviceZone(): string {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIME_ZONES.some(([z]) => z === zone) ? zone : EMPTY.timeZone;
  } catch { return EMPTY.timeZone; }
}

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
    // drafts saved by the older three-step wizard (occasion · design · details) resume on the details
    return { draft: d as Draft, templateId: typeof saved.templateId === 'string' ? saved.templateId : undefined, step: saved.step === 1 ? 1 : [2, 3].includes(saved.step) ? 2 : undefined };
  } catch { return null; }
}

/** The step indicator: always visible; finished steps can be revisited. */
function WizardSteps({ step, onGo, disabled }: { step: Step; onGo: (s: Step) => void; disabled?: boolean }) {
  const { t } = useCopy();
  const labels = [t('wizardOccasion'), t('wizardDetails')];
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

/** only the owner creates events (domain/roles «event.create»): a coordinator arriving here from a link gets the reason, not a form they could never submit */
export function CreateEvent() {
  const role = useRole();
  const { t } = useCopy();
  if (can(role, 'event.create')) return <CreateEventWizard />;
  return (
    <FocusLayout width="narrow" title={t('createEvent')} back={{ to: paths.events, label: t('back') }}>
      <EmptyState icon="users" title={t('createOwnerTitle')} action={<LinkButton to={paths.events} variant="primary">{t('createOwnerBack')}</LinkButton>}>{t('createOwnerText')}</EmptyState>
    </FocusLayout>
  );
}

function CreateEventWizard() {
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
  // an occasion already known (from a link, or a design link) opens on the details
  const [step, setStep] = useState<Step>(() => cached?.step ?? (cached?.draft.a || cached?.draft.date || preset ? 2 : 1));
  const [d, setD] = useState<Draft>(cached?.draft ?? { ...EMPTY, type: preset, timeZone: deviceZone() });
  // only a shared design link chooses a design here; otherwise the occasion's own design is the invitation's
  const [selectedTemplate, setSelectedTemplate] = useState<TemplatePreset | undefined>(() => requestedTemplate ?? presetById(cached?.templateId ?? ''));
  const [resumed, setResumed] = useState(!!cached && hasTyped(cached.draft));
  const [errors, setErrors] = useState<EssentialsErrors>({});
  const [showTz, setShowTz] = useState(false);
  // the time and the place stay folded until asked for (a restored draft opens what it had changed)
  const [timeOpen, setTimeOpen] = useState(() => !!cached && cached.draft.time !== DEFAULT_EVENT_TIME);
  const [placeOpen, setPlaceOpen] = useState(() => !!(cached?.draft.venue.trim() || cached?.draft.city.trim()));
  const formRef = useRef<HTMLFormElement>(null);
  const typed = d.a || d.b || d.title || d.date || d.venue || d.city;
  const create = useMutation((s, input: CreateEventInput) => s.events.create(input));
  const [created, setCreated] = useState(false);
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
  };

  const input = (): CreateEventInput => ({
    type: d.type ?? 'other',
    names: { a: d.a, b: couple ? d.b : undefined },
    title: d.type === 'other' ? d.title : undefined,
    date: d.date, time: d.time || DEFAULT_EVENT_TIME, timeZone: d.timeZone,
    venue: { name: d.venue, city: d.city },
  });

  const go = (next: Step) => {
    if (next > 1 && !d.type) return;
    setStep(next);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0 });
      if (next === 2 && desktop) formRef.current?.querySelector<HTMLInputElement>('input')?.focus();
      // the details on a phone: focus starts on the step's own heading (what it asks), not on the whole page
      else if (next === 2) document.querySelector<HTMLElement>('.wz-details-title')?.focus({ preventScroll: true });
    });
  };

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

  const fields = d.type ? { ...d, type: d.type } : null;

  return (
    <FocusLayout
      width="full"
      title={t('createEvent')}
      back={{ to: paths.events, label: t('cancel') }}
      footer={step === 1
        ? <><span className="create-picked" aria-live="polite">{info ? <>{t('wzPicked')} <strong>{info.label}</strong></> : t('wzPickType')}</span><Button key="next" variant="primary" size="lg" iconEnd="forward" disabled={!d.type} onClick={() => go(2)}>{t('wizardToDetails')}</Button></>
        : <><Button key="back" variant="ghost" icon="back" disabled={create.pending} onClick={() => go(1)}>{t('back')}</Button><Button key="create" variant="primary" size="lg" type="submit" form="create-event" loading={create.pending}>{t('prepareInvitation')}</Button></>}
    >
      <div className={`wz wz-step-${step}`}>
        <WizardSteps step={step} onGo={go} disabled={create.pending} />
        {/* one slim line, only when something typed was restored */}
        {resumed && <p className="wz-resume" role="status"><Icon name="info" size="sm" /><span>{t('wzResumed')}</span>
          <button type="button" className="link-btn" onClick={() => { setD({ ...EMPTY, type: preset ?? d.type, timeZone: deviceZone() }); setErrors({}); setResumed(false); setTimeOpen(false); setPlaceOpen(false); setShowTz(false); setSelectedTemplate(requestedTemplate); }}>{t('wzStartOver')}</button></p>}
        {step === 1 && <SignatureOccasions value={d.type} onChange={chooseType} onConfirm={(type) => { chooseType(type); go(2); }} />}
        {step === 2 && fields && (
          <div className="wz-details">
            {!desktop && <SignatureCreatePreview compact fields={fields} today={today} template={selectedTemplate} />}
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
                <Field label={t('wzDate')} required error={errors.date}><ArabicDateTime kind="date" value={d.date} min={today} onChange={(e) => set('date', e.target.value)} /></Field>
                {/* the time is already chosen (8:00 مساءً): one chip shows it, a tap opens the field */}
                {!timeOpen ? (
                  <button type="button" className="wz-chip"
                    onClick={() => { setTimeOpen(true); requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>('input[type="time"]')?.focus()); }}>
                    {/* read as «الوقت: 8:00 مساءً · غيّر» — the visible words stay inside the accessible name */}
                    <Icon name="clock" size="sm" /><span className="sr-only">{t('wzTime')}: </span><span>{t('wzTimeChip', { time: formatTime(d.time || DEFAULT_EVENT_TIME) })}</span>
                  </button>
                ) : (
                  <>
                    <Field label={t('wzTime')} error={errors.time}><ArabicDateTime kind="time" value={d.time} onChange={(e) => set('time', e.target.value)} /></Field>
                    {/* the time zone is the device's own; it shows (and changes) only here, beside the time */}
                    {!showTz ? (
                      <p className="wz-tz">{t('wzTimeZone', { zone: TIME_ZONES.find(([z]) => z === d.timeZone)?.[1] ?? '' })} <button type="button" className="link-btn wz-tz-change" onClick={() => setShowTz(true)} aria-label={t('wzChangeZone')}>{t('wzChange')}</button></p>
                    ) : (
                      <Field label={t('wzZone')}><Select value={d.timeZone} onChange={(e) => set('timeZone', e.target.value)}>{TIME_ZONES.map(([z, l]) => <option key={z} value={z}>{l}</option>)}</Select></Field>
                    )}
                  </>
                )}
              </fieldset>
              {/* the place is optional: the invitation, guest pages and wallet pass read cleanly without it */}
              {!placeOpen ? (
                <button type="button" className="wz-chip wz-chip-add"
                  onClick={() => { setPlaceOpen(true); requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>('.wz-place input')?.focus()); }}>
                  <Icon name="plus" size="sm" /><span>{t('wzAddPlace')}</span>
                </button>
              ) : (
                <fieldset className="wz-group wz-place">
                  <legend>{t('wzWhere')}</legend>
                  <div className="wz-pair">
                    <Field label={t('wzVenue')} optional><Input value={d.venue} onChange={(e) => set('venue', e.target.value)} placeholder={t('wzVenueExample')} /></Field>
                    <Field label={t('wzCity')} optional><Input value={d.city} onChange={(e) => set('city', e.target.value)} placeholder={t('wzCityExample')} /></Field>
                  </div>
                  <p className="field-hint">{t('wzPlaceLater')}</p>
                </fieldset>
              )}
            </form>
            {desktop && <aside className="wz-aside sig-create-aside" aria-label={t('wzPreviewAside')}><SignatureCreatePreview fields={fields} today={today} template={selectedTemplate} /></aside>}
          </div>
        )}
      </div>
    </FocusLayout>
  );
}
