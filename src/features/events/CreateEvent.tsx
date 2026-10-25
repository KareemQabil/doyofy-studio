/**
 * Create event — emotional momentum, nothing optional:
 *   1. choose the occasion (Coverflow or Editorial Rail — prototype A/B, same catalogue)
 *   2. essentials only (names · date/time · venue), with the event card taking shape beside the form
 *   → occasion-specific design is ready in the editor for review and publishing.
 *     Changing the template is an optional secondary path.
 */
import { useRef, useState, type FormEvent } from 'react';
import type { CreateEventInput, EventType } from '../../domain/types';
import { eventTypeInfo, isCoupleEvent, suggestTitle, validateEssentials, type EssentialsErrors } from '../../domain/event';
import { formatEventDate, formatTime, localDateOf } from '../../domain/format';
import { Banner, Button, Field, FocusLayout, Input, Select } from '../../ui';
import { useMutation, useServices } from '../../app/data';
import { useBlocker, useLocation, useNavigate } from '../../app/router';
import { paths } from '../../app/paths';
import { useReviewSettings } from '../../app/review';
import { errorMessage } from '../../services/errors';
import { BahjaOccasions } from '../bahja/BahjaOccasions';
import { OrbitOccasions } from '../orbit/OrbitOccasions';
import { SignatureOccasions } from '../signature/SignatureOccasions';
import { SignatureCreatePreview } from '../signature/SignatureCreatePreview';
import { ThemeArtwork } from '../../ui/primitives/ThemeArtwork';
import { CuratedChooser } from '../occasions/CuratedChooser';
import { occasionAction } from '../../domain/experience';
import { CoverflowChooser } from '../occasions/CoverflowChooser';
import { RailChooser } from '../occasions/RailChooser';
import { OccasionArtwork as OccasionArt } from '../occasions/OccasionArtwork';

export const TIME_ZONES: Array<[string, string]> = [
  ['Asia/Riyadh', 'الرياض / جدة (السعودية)'], ['Asia/Dubai', 'دبي / أبوظبي'], ['Asia/Kuwait', 'الكويت'], ['Asia/Qatar', 'الدوحة'],
  ['Asia/Bahrain', 'المنامة'], ['Asia/Muscat', 'مسقط'], ['Africa/Cairo', 'القاهرة'], ['Asia/Amman', 'عمّان'], ['Asia/Beirut', 'بيروت'],
  ['Asia/Baghdad', 'بغداد'], ['Africa/Casablanca', 'الدار البيضاء'], ['Africa/Tunis', 'تونس'], ['Europe/London', 'لندن'],
];

type Draft = { type: EventType | null; a: string; b: string; aEn: string; bEn: string; title: string; date: string; time: string; venue: string; city: string; timeZone: string };
const EMPTY: Draft = { type: null, a: '', b: '', aEn: '', bEn: '', title: '', date: '', time: '20:00', venue: '', city: '', timeZone: 'Asia/Riyadh' };

export function CreateEvent() {
  const services = useServices();
  const navigate = useNavigate();
  const loc = useLocation();
  const { chooser, theme } = useReviewSettings();
  const preset = loc.search.get('type') as EventType | null;
  const [step, setStep] = useState<1 | 2>(preset && eventTypeInfo(preset).id === preset ? 2 : 1);
  const [chapter,setChapter]=useState(0);
  const chapters=['الأسماء','الموعد','المكان'];
  const chapterFields:Array<Array<keyof EssentialsErrors>>=[['a','b','title'],['date','time'],['venue','city']];
  const [d, setD] = useState<Draft>({ ...EMPTY, type: preset && eventTypeInfo(preset).id === preset ? preset : null });
  const [errors, setErrors] = useState<EssentialsErrors>({});
  const [showEn, setShowEn] = useState(false);
  const [showTz, setShowTz] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const typed = d.a || d.b || d.title || d.date || d.venue || d.city;
  const create = useMutation((s, input: CreateEventInput) => s.events.create(input));
  const [created, setCreated] = useState(false);
  useBlocker(!!typed && !created, 'لم تُنشأ المناسبة بعد. هل تريد المغادرة وترك ما كتبته؟');

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => { setD((x) => ({ ...x, [k]: v })); if (errors[k as keyof EssentialsErrors]) setErrors((e) => ({ ...e, [k]: undefined })); };
  const info = d.type ? eventTypeInfo(d.type) : null;
  const couple = d.type ? isCoupleEvent(d.type) : true;
  const today = localDateOf(services.clock.now(), d.timeZone);

  const input = (): CreateEventInput => ({
    type: d.type ?? 'other',
    names: { a: d.a, b: couple ? d.b : undefined, aEn: d.aEn || undefined, bEn: couple ? d.bEn || undefined : undefined },
    title: d.type === 'other' ? d.title : undefined,
    date: d.date, time: d.time, timeZone: d.timeZone,
    venue: { name: d.venue, city: d.city },
  });

  const toStep2 = (t?: EventType) => {
    if (t) setD((x) => ({ ...x, type: t }));
    if (!t && !d.type) return;
    setStep(2);
    requestAnimationFrame(() => { window.scrollTo({ top: 0 }); formRef.current?.querySelector<HTMLInputElement>('input')?.focus(); });
  };

  const toChapter=(next:number)=>{
    if(create.pending)return;
    if(next>chapter){const all=validateEssentials(input(),today),fields=chapterFields.slice(0,next).flat();const subset=Object.fromEntries(Object.entries(all).filter(([k])=>fields.includes(k as keyof EssentialsErrors))) as EssentialsErrors;setErrors(subset);if(Object.keys(subset).length){const bad=chapterFields.findIndex(f=>f.some(k=>subset[k]));setChapter(Math.max(0,bad));requestAnimationFrame(()=>formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());return;}}
    setChapter(next);requestAnimationFrame(()=>formRef.current?.querySelector<HTMLInputElement>('fieldset:not([hidden]) input')?.focus());
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if(theme==='orbit'&&chapter<2){toChapter(chapter+1);return;}
    const e = validateEssentials(input(), today);
    setErrors(e);
    if (Object.keys(e).length) {
      if(theme==='orbit')setChapter(Math.max(0,chapterFields.findIndex(f=>f.some(k=>e[k]))));
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    const made = await create.run(input());
    if (made) {
      setCreated(true);
      navigate(`${paths.design(made.id)}?first=1`, { force: true });
    }
  };

  const title = d.type === 'other' ? d.title : d.type && d.a ? suggestTitle(d.type, { a: d.a, b: d.b }) : '';

  return (
    <FocusLayout
      width={step === 1 ? 'full' : 'wide'}
      title="مناسبة جديدة"
      back={{ to: paths.events, label: 'إلغاء' }}
      right={<span className="faint t-sm num">الخطوة {step} من 2</span>}
      footer={step === 1
        ? <><span className="create-picked" aria-live="polite">{info ? <>اخترت: <strong>{info.label}</strong></> : 'اختر نوع المناسبة'}</span><Button key="next" variant="primary" size="lg" iconEnd="forward" disabled={!d.type} onClick={() => toStep2()}>{occasionAction(d.type)}</Button></>
        : <><Button key="back" variant="ghost" icon="back" disabled={create.pending} onClick={() => theme==='orbit'&&chapter>0?setChapter(chapter-1):setStep(1)}>رجوع</Button>{theme==='orbit'&&chapter<2?<Button variant="primary" size="lg" iconEnd="forward" onClick={()=>toChapter(chapter+1)}>التالي: {chapters[chapter+1]}</Button>:<Button key="create" variant="primary" size="lg" type="submit" form="create-event" loading={create.pending}>جهّز دعوتي</Button>}</>}
    >
      {step === 1 && theme==='signature' ? <SignatureOccasions value={d.type} onChange={t=>set('type',t)} onConfirm={t=>toStep2(t)}/> : step === 1 && theme==='bahja' ? <BahjaOccasions value={d.type} onChange={t=>set('type',t)}/> : step === 1 && theme==='orbit' ? <OrbitOccasions value={d.type} onChange={t=>set('type',t)} onConfirm={t=>toStep2(t)}/> : step === 1 ? (
        <div className={`create-occasion is-${chooser}`}>
          <header className="create-hero">
            <div className="create-hero-copy"><p className="eyebrow">اختر اللحظة. نرتّب الحكاية.</p>
            <h2 className="t-display">كل فرحة تبدأ من هنا.</h2>
            <p className="create-sub">ما المناسبة التي تجمع أحبابك؟ اخترها، ودع التفاصيل تأخذ شكلها.</p></div><div className="create-direction-art"><ThemeArtwork eager/><span className="art-spark"><OccasionArt type={d.type??'wedding'} framed={false}/></span></div>
          </header>
          {chooser === 'curated' ? <CuratedChooser value={d.type} onChange={t=>set('type',t)} /> : chooser === 'rail'
            ? <div className="create-rail"><RailChooser value={d.type} onChange={(t) => set('type', t)} onConfirm={(t) => toStep2(t)} /></div>
            : <CoverflowChooser value={d.type} onChange={(t) => set('type', t)} onConfirm={(t) => toStep2(t)} />}
        </div>
      ) : (
        <div className="create-details">
          <form id="create-event" ref={formRef} className="stack gap-6 create-form" onSubmit={submit} noValidate>
            {theme==='orbit'&&<nav className="orbit-create-chapters" aria-label="فصول تفاصيل المناسبة">{chapters.map((name,i)=><button type="button" key={name} disabled={create.pending} aria-current={chapter===i?'step':undefined} onClick={()=>toChapter(i)}><span>0{i+1}</span>{name}</button>)}</nav>}
            <header className="stack gap-2">
              <h2 className="create-h">{info?.label} تليق بك.</h2>
              <p className="muted">ابدأ بالأسماء والموعد والمكان. باقي التفاصيل على مهل.</p>
            </header>
            {create.error ? <Banner tone="danger" title="لم تُنشأ المناسبة">{errorMessage(create.error)}</Banner> : null}

            <fieldset className="form-group" hidden={theme==='orbit'&&chapter!==0}>
              <legend className="form-legend">{couple ? 'العروسان' : 'صاحب المناسبة'}</legend>
              <div className={couple ? 'grid-2' : 'stack'}>
                <Field label={info?.nameLabel ?? 'الاسم'} required error={errors.a}><Input value={d.a} onChange={(e) => set('a', e.target.value)} autoComplete="off" /></Field>
                {couple && <Field label={info?.nameLabelB ?? 'الاسم الثاني'} required error={errors.b}><Input value={d.b} onChange={(e) => set('b', e.target.value)} autoComplete="off" /></Field>}
              </div>
              {d.type === 'other' && <Field label="اسم المناسبة" required error={errors.title} hint="مثال: حفل افتتاح، عزيمة رمضان"><Input value={d.title} onChange={(e) => set('title', e.target.value)} /></Field>}
              {!showEn ? (
                <button type="button" className="link-btn" onClick={() => setShowEn(true)}>أضف {couple ? 'الأسماء' : 'الاسم'} بالإنجليزية (اختياري)</button>
              ) : (
                <div className={couple ? 'grid-2' : 'stack'}>
                  <Field label="بالإنجليزية" optional><Input ltr value={d.aEn} onChange={(e) => set('aEn', e.target.value)} placeholder="Sara" /></Field>
                  {couple && <Field label="بالإنجليزية" optional><Input ltr value={d.bEn} onChange={(e) => set('bEn', e.target.value)} placeholder="Ahmed" /></Field>}
                </div>
              )}
            </fieldset>

            <fieldset className="form-group" hidden={theme==='orbit'&&chapter!==1}>
              <legend className="form-legend">الموعد</legend>
              <div className="grid-2">
                <Field label="التاريخ" required error={errors.date}><Input type="date" value={d.date} min={today} onChange={(e) => set('date', e.target.value)} /></Field>
                <Field label="الوقت" required error={errors.time}><Input type="time" value={d.time} onChange={(e) => set('time', e.target.value)} /></Field>
              </div>
              {!showTz ? (
                <p className="faint t-sm">التوقيت: {TIME_ZONES.find(([z]) => z === d.timeZone)?.[1]} <button type="button" className="link-btn" onClick={() => setShowTz(true)}>تغيير</button></p>
              ) : (
                <Field label="المنطقة الزمنية"><Select value={d.timeZone} onChange={(e) => set('timeZone', e.target.value)}>{TIME_ZONES.map(([z, l]) => <option key={z} value={z}>{l}</option>)}</Select></Field>
              )}
            </fieldset>

            <fieldset className="form-group" hidden={theme==='orbit'&&chapter!==2}>
              <legend className="form-legend">المكان</legend>
              <div className="grid-2">
                <Field label="اسم القاعة أو المكان" required error={errors.venue}><Input value={d.venue} onChange={(e) => set('venue', e.target.value)} placeholder="مثال: قاعة الياسمين" /></Field>
                <Field label="المدينة" required error={errors.city}><Input value={d.city} onChange={(e) => set('city', e.target.value)} placeholder="مثال: الرياض" /></Field>
              </div>
            </fieldset>
          </form>

          {theme==='signature'&&d.type ? <aside className="create-preview sig-create-aside" aria-label="معاينة الدعوة"><SignatureCreatePreview type={d.type} a={d.a} b={d.b} aEn={d.aEn} bEn={d.bEn} title={d.title} date={d.date} time={d.time} venue={d.venue} city={d.city} timeZone={d.timeZone} today={today}/></aside> : <aside className="create-preview" aria-label="معاينة المناسبة">
            <div className="ep-card">
              {d.type && <span className="ep-art"><OccasionArt type={d.type} /></span>}
              <div className="ep-body">
                <p className="ep-kicker">{info?.label}</p>
                <p className={`ep-title${title ? '' : ' is-empty'}`}>{title || 'اسم المناسبة يظهر هنا'}</p>
                <p className="ep-row">{d.date ? formatEventDate(d.date) : 'التاريخ'}{d.time ? <span className="num"> · {formatTime(d.time)}</span> : null}</p>
                <p className="ep-row">{[d.venue, d.city].filter(Boolean).join('، ') || 'المكان'}</p>
              </div>
            </div>
            <p className="create-next">نجهّز لك قالبًا مناسبًا تلقائيًا بالأسماء والموعد. راجعه وانشره، أو غيّر شكله وقت ما تحب.</p>
          </aside>}
        </div>
      )}
    </FocusLayout>
  );
}
