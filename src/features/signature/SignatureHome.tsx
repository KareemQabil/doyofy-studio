/**
 * «توقيع» home — mixed direction chosen by the owner:
 *   A «احتفال» for entry: a full-bleed brand-red hero (with a soft red/gold mesh) and a fan of REAL invitations —
 *     the organizer's own invitation in three looks (or labelled examples). Swipe / tap / buttons cycle the fan.
 *   C «تحرير» for everything that follows: white canvas, strong type hierarchy, colour tiles holding real cards.
 *   B «مساء» for the closing block (charcoal + gold).
 * Identity: Doyofy palette, Readex Pro display / IBM Plex Sans Arabic text, official logo and pattern,
 * Phosphor icons (MIT). Editorial photography is decorative; invitation content stays live HTML.
 */
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Event, EventType, InvitationDesignContent } from '../../domain/types';
import { OCCASIONS_ORDERED, eventPhase, eventTypeInfo, PHASE_LABEL, todayFor } from '../../domain/event';
import { countdownLabel, formatEventDate, formatTime } from '../../domain/format';
import { defaultDesign, publishState } from '../../domain/invitation';
import { applyPreset, presetsFor } from '../../domain/templates';
import { swipeStep } from '../../domain/gestures';
import { useNow } from '../../app/data';
import { Link, useNavigate } from '../../app/router';
import { paths } from '../../app/paths';
import { ErrorState, Icon, LinkButton, Skeleton, Status } from '../../ui';
import { OccasionGlyph } from '../../ui/icons';
import { usePointerGesture } from '../../ui/hooks/usePointerGesture';
import { TactileDeck } from '../../ui/primitives/TactileDeck';
import { CardThumb } from '../invitation/CardThumb';
import { useDesign, useEvents } from '../shared/queries';
import { UserChip } from '../workspace/EventWorkspace';
import { SignatureShell } from './SignatureShell';
import { Stage, TicketEdge, type BrandTone } from './SignatureArt';
import { useMedia } from './useMedia';
import { useTilt } from './useTilt';
import { SignatureBanner } from './SignatureBanner';

/** the next useful step for an event, in the organizer's words (not engine terms) */
export function nextStep(e: Event, ps: string, phase: string) {
  const past = phase === 'completed' || phase === 'archived';
  if (past) return { label: 'ملخص المناسبة', to: paths.summary(e.id) };
  if (phase === 'event_day') return { label: 'افتح الاستقبال', to: paths.gate(e.id) };
  if (ps === 'none' || ps === 'draft') return { label: 'راجع دعوتك وانشرها', to: paths.design(e.id) };
  if (ps === 'changed') return { label: 'انشر تعديلات الدعوة', to: paths.design(e.id) };
  return { label: 'تابع ضيوفك وردودهم', to: paths.guests(e.id) };
}

export const firstLetter = (s: string) => {
  const core = s.replace(/^(عائلة|آل|أم|أبو)\s+/, '').replace(/^ال(?=\S{2,})/, '').trim();
  return [...core][0] ?? 'ض';
};

export { toneOf } from './tones';
import { toneOf } from './tones';

import { sampleEvent } from './sample-event';
export { sampleEvent } from './sample-event';

/* ------------------------------------------------------------------ hero fan */
type Look = { key: string; event: Event; content: InvitationDesignContent; label: string };

function useLooks(featured: Event | undefined, draft: InvitationDesignContent | undefined): Look[] {
  return useMemo(() => {
    if (featured) {
      const base = draft ?? defaultDesign(featured);
      const others = presetsFor(featured.type).suited.filter((p) => p.cardId !== base.cardId);
      const uniq = others.filter((p, i, a) => a.findIndex((q) => q.cardId === p.cardId) === i).slice(0, 2);
      return [{ key: 'current', event: featured, content: base, label: 'دعوتك الحالية' }, ...uniq.map((p) => ({ key: p.id, event: featured, content: applyPreset(base, p), label: p.name }))];
    }
    return (['wedding', 'graduation', 'birthday'] as EventType[]).map((t) => { const e = sampleEvent(t); return { key: t, event: e, content: defaultDesign(e), label: `مثال: ${eventTypeInfo(t).label}` }; });
  }, [featured, draft]);
}

function HeroFan({ looks }: { looks: Look[] }) {
  const [front, setFront] = useState(0);
  const phone = useMedia('(max-width: 760px)');
  const fan = useRef<HTMLDivElement>(null);
  const focusFront = useRef(false);
  const tilt = useTilt<HTMLDivElement>(4);
  const n = looks.length;
  const visibleFront = front % n;
  const cycle = (d: number) => setFront((f) => (f + d + n) % n);
  useLayoutEffect(() => {
    if (focusFront.current) { fan.current?.querySelector<HTMLButtonElement>('.is-front')?.focus({ preventScroll: true }); focusFront.current = false; }
  }, [visibleFront]);
  const gesture = usePointerGesture({
    axis: 'x',
    onMove: (dx) => { fan.current?.setAttribute('data-dragging', ''); fan.current?.style.setProperty('--fan-drag', `${Math.max(-60, Math.min(60, dx * 0.35))}px`); },
    onEnd: (g) => { fan.current?.removeAttribute('data-dragging'); fan.current?.style.removeProperty('--fan-drag'); if (g.moved && !g.cancelled) { const s = swipeStep(g.dx, g.dy, g.duration); if (s) cycle(s); } },
  });
  const width = phone ? 168 : 250;
  return (
    <div ref={tilt} className="sig-fan-wrap" data-tilt-zone="">
      <span className="sig-fan-mat" aria-hidden="true" />
      <img className="sig-fan-ribbon" src="assets/editorial/ribbon-seal.webp" alt="" width="1536" height="1024" decoding="async" aria-hidden="true" />
      <div ref={fan} className="sig-fan" {...gesture} data-count={n} role="group" aria-roledescription="معرض أشكال" aria-label="أشكال الدعوة — اسحب أو اضغط لتبديل الشكل"
        onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); focusFront.current = true; cycle(e.key === 'ArrowLeft' ? 1 : -1); } }}>
        {looks.map((l, i) => {
          const pos = (i - visibleFront + n) % n; // 0 = front, 1 = next (left in RTL), n-1 = previous (right)
          const slot = pos === 0 ? 'front' : pos === 1 ? 'next' : 'prev';
          return (
            <button key={l.key} type="button" className={`sig-fan-card is-${slot}`} data-gesture-surface="" tabIndex={pos === 0 ? 0 : -1}
              aria-label={pos === 0 ? `${l.label} — الشكل المعروض` : `اعرض: ${l.label}`} onClick={() => (pos === 0 ? cycle(1) : setFront(i))}>
              <CardThumb event={l.event} content={l.content} width={width} />
            </button>
          );
        })}
      </div>
      <div className="sig-fan-controls">
        <button type="button" className="sig-fan-arrow" onClick={() => cycle(-1)} aria-label="الشكل السابق"><Icon name="back" /></button>
        <p className="sig-fan-label" aria-live="polite">{looks[visibleFront]?.label}</p>
        <button type="button" className="sig-fan-arrow" onClick={() => cycle(1)} aria-label="الشكل التالي"><Icon name="forward" /></button>
      </div>
      <p className="sig-fan-hint">اسحب لتكتشف شكلًا آخر <span aria-hidden="true">←</span></p>
    </div>
  );
}

function Hero({ featured, loading }: { featured?: Event; loading: boolean }) {
  const now = useNow(60000);
  const design = useDesign(featured?.id ?? '');
  const looks = useLooks(featured, design.data?.draft);
  const phase = featured ? eventPhase(featured, now) : 'upcoming';
  const step = featured ? nextStep(featured, publishState(design.data), phase) : null;
  return (
    <section className="sig-hero" aria-labelledby="sig-hero-title">
      <span className="sig-hero-pattern" aria-hidden="true" />
      <div className="sig-hero-inner">
        <div className="sig-hero-copy">
          <p className="sig-hero-kicker"><i aria-hidden="true" />دعوات رقمية لكل فرحة</p>
          <h1 id="sig-hero-title"><span className="sig-line">كل فرحة</span> <span className="sig-line">تستاهل دعوة.</span></h1>
          <p className="sig-hero-sub">اختر المناسبة، اكتب الأسماء والموعد، ودعوتك جاهزة في دقائق. رابط خاص لكل ضيف، وردود توصلك أولًا بأول حتى يوم الاستقبال.</p>
          {loading ? <Skeleton lines={2} /> : featured && step ? (
            <div className="sig-hero-next">
              <p className="sig-hero-next-label"><span>مناسبتك القادمة</span><Status tone={PHASE_LABEL[phase].tone}>{countdownLabel(featured.date, todayFor(featured, now))}</Status></p>
              <p className="sig-hero-next-title">{featured.title}</p>
              <div className="sig-hero-actions">
                <LinkButton to={step.to} variant="primary" size="lg" iconEnd="forward">{step.label}</LinkButton>
                <Link to={paths.overview(featured.id)} className="sig-text-link">كل التفاصيل</Link>
              </div>
            </div>
          ) : (
            <div className="sig-hero-actions">
              <LinkButton to={paths.newEvent} variant="primary" size="lg" icon="plus" className="sig-hero-cta">ابدأ دعوتك</LinkButton>
              <Link to={`${paths.newEvent}?type=graduation`} className="sig-hero-link">أو جهّز دعوة تخرّج مباشرة</Link>
            </div>
          )}
        </div>
        <HeroFan looks={looks} />
        <span className="sig-hero-sticker" aria-hidden="true"><b className="num">13</b>مناسبة</span>
      </div>
      <nav className="sig-hero-band" aria-label="ابدأ بمناسبة">
        <ul>{OCCASIONS_ORDERED.map((t) => <li key={t.id}><Link to={`${paths.newEvent}?type=${t.id}`}>{t.label}</Link></li>)}</ul>
      </nav>
    </section>
  );
}

/* ------------------------------------------------------------------ white sections (C) */
function EventTicket({ event }: { event: Event }) {
  const now = useNow();
  const design = useDesign(event.id);
  const phase = eventPhase(event, now);
  const step = nextStep(event, publishState(design.data), phase);
  const past = phase === 'completed' || phase === 'archived';
  return (
    <article className={`sig-ticket${past ? ' is-past' : ''}`}>
      <span className={`sig-ticket-art tone-${toneOf(event.type)}`} aria-hidden="true">{design.data ? <CardThumb event={event} content={design.data.draft} width={84} /> : <OccasionGlyph type={event.type} />}</span>
      <div className="sig-ticket-body">
        <p className="sig-ticket-kind"><span>{eventTypeInfo(event.type).label}</span><Status tone={PHASE_LABEL[phase].tone}>{past ? PHASE_LABEL[phase].label : countdownLabel(event.date, todayFor(event, now))}</Status></p>
        <h3><Link to={paths.overview(event.id)}>{event.title}</Link></h3>
        <p className="sig-ticket-meta"><Icon name="calendar" size="sm" />{formatEventDate(event.date)} · <bdi className="num">{formatTime(event.time)}</bdi></p>
        <p className="sig-ticket-meta"><Icon name="pin" size="sm" />{event.venue.name}، {event.venue.city}</p>
      </div>
      <TicketEdge />
      <div className="sig-ticket-stub"><LinkButton to={step.to} variant={past ? 'ghost' : 'secondary'} iconEnd="forward">{step.label}</LinkButton></div>
    </article>
  );
}

/** an occasion as a colour tile holding a real invitation (sample names) — used by every occasion deck */
export function OccasionPoster({ type, active }: { type: EventType; active?: boolean }) {
  const info = eventTypeInfo(type);
  const ev = useMemo(() => sampleEvent(type), [type]);
  const content = useMemo(() => defaultDesign(ev), [ev]);
  const phone = useMedia('(max-width: 760px)');
  return (
    <span className={`sig-poster tone-${toneOf(type)}${active ? ' is-active' : ''}`}>
      <span className="sig-poster-head"><strong>{info.label}</strong><small>{info.line}</small></span>
      <span className="sig-poster-card" aria-hidden="true"><CardThumb event={ev} content={content} width={phone ? 128 : 150} /></span>
      <span className="sig-poster-glyph" aria-hidden="true"><OccasionGlyph type={type} /></span>
    </span>
  );
}

function OccasionDeckSection() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const items = OCCASIONS_ORDERED;
  const active = items[index]!;
  return (
    <section className="sig-section sig-deck-section" aria-labelledby="sig-occasions">
      <header className="sig-section-head">
        <p className="sig-index"><span className="num">02</span>المناسبات</p>
        <h2 id="sig-occasions">ثلاث عشرة مناسبة،<br />ولكل واحدة دعوتها.</h2>
      </header>
      <div className="sig-deck-layout">
        <div className="sig-deck-copy" aria-live="polite">
          <p className="sig-deck-kind"><span className={`sig-dot tone-${toneOf(active.id)}`} aria-hidden="true" />{active.hint}</p>
          <h3>{active.label}</h3>
          <p>{active.couple ? 'نجهّز دعوة باسمَي العروسين، بكلمة وبرنامج يناسبان المناسبة.' : 'نجهّز دعوة باسم صاحب المناسبة، بكلمة وبرنامج يناسبانها.'} وكل شيء قابل للتعديل لاحقًا.</p>
          <LinkButton to={`${paths.newEvent}?type=${active.id}`} variant="primary" size="lg" iconEnd="forward">ابدأ {active.label}</LinkButton>
        </div>
        <TactileDeck items={items} index={index} onIndexChange={setIndex} getKey={(t) => t.id} window={2}
          label="المناسبات — اسحب يسارًا للتالي أو استخدم الأسهم" itemLabel={(t) => t.label} activateHint="اضغط للبدء"
          onActivate={(t) => navigate(`${paths.newEvent}?type=${t.id}`)}
          renderCard={(t, s) => <OccasionPoster type={t.id} active={s.active} />} className="sig-occasion-deck" />
      </div>
    </section>
  );
}

function Steps() {
  const steps: Array<[string, string]> = [
    ['اختر المناسبة', 'زفاف، تخرّج، افتتاح، أو لمّة عائلة. كل مناسبة تبدأ بدعوة مكتوبة لها.'],
    ['راجع دعوتك وانشرها', 'الأسماء والكلمة والبرنامج جاهزة. غيّر الشكل متى شئت دون أن يضيع شيء.'],
    ['استقبل ضيوفك', 'رابط خاص لكل ضيف، ردود واضحة، ورمز دخول يمسحه فريق الاستقبال.'],
  ];
  return (
    <section className="sig-section sig-steps" aria-labelledby="sig-steps-title">
      <header className="sig-section-head"><p className="sig-index"><span className="num">03</span>كيف تعمل</p><h2 id="sig-steps-title">من أول دعوة حتى آخر ضيف.</h2></header>
      <ol>{steps.map(([t, d], i) => <li key={t}><span className="sig-step-art" aria-hidden="true"><Icon name={i === 0 ? 'calendar' : i === 1 ? 'envelope' : 'users'} size="lg" /></span><span className="sig-steps-num num">{String(i + 1).padStart(2, '0')}</span><strong>{t}</strong><p>{d}</p></li>)}</ol>
    </section>
  );
}

export function SignatureHome() {
  const events = useEvents();
  const now = useNow(60000);
  const [memories, setMemories] = useState(false);
  const all = events.data ?? [];
  const { active, past } = useMemo(() => ({
    active: all.filter((e) => !['completed', 'archived'].includes(eventPhase(e, now))).sort((a, b) => a.date.localeCompare(b.date)),
    past: all.filter((e) => ['completed', 'archived'].includes(eventPhase(e, now))).sort((a, b) => b.date.localeCompare(a.date)),
  }), [all, now]);
  const list = memories ? past : active.slice(1);
  return (
    <SignatureShell right={<UserChip />}>
      <main id="main" tabIndex={-1} className="sig-home">
        <Hero featured={active[0]} loading={events.loading} />
        <div className="sig-page">
          <section className="sig-section" aria-labelledby="sig-mine">
            <header className="sig-section-head sig-section-head-row">
              <div><p className="sig-index"><span className="num">01</span>مناسباتك</p><h2 id="sig-mine">{memories ? 'مناسبات مضت.' : active.length > 1 ? 'مناسبات أخرى قادمة.' : 'مساحة لمناسبة جديدة.'}</h2></div>
              {past.length > 0 && <button type="button" className="sig-chip-toggle" aria-pressed={memories} onClick={() => setMemories((v) => !v)}><Icon name="archive" size="sm" />{memories ? 'المناسبات القادمة' : <>المناسبات السابقة <span className="num">{past.length}</span></>}</button>}
            </header>
            {events.loading ? <Skeleton lines={4} block /> : events.error ? <ErrorState error={events.error} onRetry={events.refetch} /> : (
              <div className="sig-tickets">
                {list.map((e) => <EventTicket key={e.id} event={e} />)}
                {!memories && <Link to={paths.newEvent} className="sig-new-ticket"><span className="sig-new-plus" aria-hidden="true"><Icon name="plus" /></span><span><strong>مناسبة جديدة</strong><small>تبدأ باختيار المناسبة، والدعوة تتجهّز معك.</small></span><Icon name="forward" size="sm" /></Link>}
                {memories && !past.length && <p className="sig-empty-line">لا توجد مناسبات سابقة بعد.</p>}
              </div>
            )}
          </section>
          <OccasionDeckSection />
          <SignatureBanner />
          <Steps />
        </div>
        <Stage tone="charcoal" size="lg" className="sig-closing" pattern="bloom" as="section" aria-label="ابدأ">
          <p className="sig-closing-kicker">ضيوفي</p>
          <p className="sig-closing-line">فرحتك علينا.<br /><em>وضيوفك في انتظارك.</em></p>
          <div className="sig-closing-actions"><LinkButton to={paths.newEvent} variant="primary" size="lg" icon="plus">مناسبة جديدة</LinkButton><Link to="/prototype/signature-directions" className="sig-text-link">كيف بُني هذا الأسلوب</Link></div>
        </Stage>
      </main>
    </SignatureShell>
  );
}

