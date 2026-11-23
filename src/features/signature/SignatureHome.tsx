/**
 * «توقيع» home — mixed direction chosen by the owner:
 *   A «احتفال» for entry: a full-bleed brand-red hero (with a soft red/gold mesh) and a fan of REAL invitations —
 *     the organizer's own invitation in three looks (or labelled examples). Swipe / tap / buttons cycle the fan.
 *   C «تحرير» for everything that follows: white canvas, strong type hierarchy, colour tiles holding real cards.
 *   B «مساء» for the closing block (charcoal + gold).
 * Identity: Doyofy palette, Readex Pro display / IBM Plex Sans Arabic text, official logo and pattern,
 * Phosphor icons (MIT). No decorative photography: the invitations are the imagery, and they stay live HTML.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Event, EventType, InvitationDesignContent } from '../../domain/types';
import { OCCASIONS_ORDERED, eventPhase, eventTypeInfo, PHASE_LABEL, todayFor } from '../../domain/event';
import { PHASE_KEY } from '../../domain/copy/activity';
import { countdownLabel, formatEventDate, formatTime } from '../../domain/format';
import { defaultDesign } from '../../domain/invitation';
import { applyPreset, presetsFor } from '../../domain/templates';
import { swipeStep } from '../../domain/gestures';
import { useNow } from '../../app/data';
import { useRole } from '../shared/OwnerOnly';
import { can } from '../../domain/roles';
import { Link, useNavigate } from '../../app/router';
import { paths } from '../../app/paths';
import { ErrorState, Icon, LinkButton, Skeleton, Status, PageLoader } from '../../ui';
import { OccasionGlyph } from '../../ui/icons';
import { usePointerGesture } from '../../ui/hooks/usePointerGesture';
import { springTo } from '../../ui/motion/motion';
import { TactileDeck } from '../../ui/primitives/TactileDeck';
import { CardThumb } from '../invitation/CardThumb';
import { useDesign, useEvents } from '../shared/queries';
import { UserChip } from '../workspace/EventWorkspace';
import { SignatureShell } from './SignatureShell';
import { Stage, TicketEdge, type BrandTone } from './SignatureArt';
import { useMedia } from './useMedia';
import { useTilt } from './useTilt';
import { SignatureBanner } from './SignatureBanner';
import { useCopy } from '../../ui/copy';
import type { Copy } from '../../domain/copy';

/** the next useful step for an event, in the organizer's words (not engine terms). The invitation is always live:
 *  a design not yet looked at is a suggestion, never a gate. */
export function nextStep(e: Event, designed: boolean, phase: string, c: Pick<Copy, 'stepSummary' | 'stepGate' | 'stepReview' | 'stepFollow'>) {
  const past = phase === 'completed' || phase === 'archived';
  if (past) return { label: c.stepSummary, to: paths.summary(e.id) };
  if (phase === 'event_day') return { label: c.stepGate, to: paths.gate(e.id) };
  if (!designed) return { label: c.stepReview, to: paths.design(e.id) };
  return { label: c.stepFollow, to: paths.guests(e.id) };
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
  const { t } = useCopy();
  return useMemo(() => {
    if (featured) {
      const base = draft ?? defaultDesign(featured);
      const others = presetsFor(featured.type).suited.filter((p) => p.cardId !== base.cardId);
      const uniq = others.filter((p, i, a) => a.findIndex((q) => q.cardId === p.cardId) === i).slice(0, 2);
      return [{ key: 'current', event: featured, content: base, label: t('homeLookCurrent') }, ...uniq.map((p) => ({ key: p.id, event: featured, content: applyPreset(base, p), label: p.name }))];
    }
    return (['wedding', 'graduation', 'birthday'] as EventType[]).map((type) => { const e = sampleEvent(type); return { key: type, event: e, content: defaultDesign(e), label: t('homeLookExample', { type: eventTypeInfo(type).label }) }; });
  }, [featured, draft, t]);
}

function HeroFan({ looks }: { looks: Look[] }) {
  const { t } = useCopy();
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
  // the front card follows the finger 1:1 (the side cards drift with it); release either throws it to the next
  // look (RTL: a swipe to the right shows the NEXT one) and lets the cards settle on a spring, or springs it back
  const stopSpring = useRef<() => void>(() => {});
  const drag = (x: number) => { const el = fan.current; if (!el) return; el.style.setProperty('--fan-drag', `${x.toFixed(1)}px`); el.style.setProperty('--fan-turn', `${(x * 0.03).toFixed(2)}deg`); };
  const release = () => { const el = fan.current; if (!el) return; el.removeAttribute('data-dragging'); el.style.removeProperty('--fan-drag'); el.style.removeProperty('--fan-turn'); };
  useEffect(() => () => stopSpring.current(), []);
  const gesture = usePointerGesture({
    axis: 'x',
    onStart: () => stopSpring.current(),
    onMove: (dx) => { fan.current?.setAttribute('data-dragging', ''); drag(dx); },
    onEnd: (g) => {
      const s = g.moved && !g.cancelled ? swipeStep(g.dx, g.dy, g.duration) : 0;
      if (s) { release(); cycle(s); return; }
      if (!g.moved || g.cancelled) { release(); return; }
      stopSpring.current = springTo(g.dx, 0, { velocity: g.velocity * 1000, onUpdate: drag, onRest: release });
    },
  });
  const [screenWidth, setScreenWidth] = useState(() => window.innerWidth);
  useEffect(() => { const resize = () => setScreenWidth(window.innerWidth); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize); }, []);
  const width = phone ? Math.round(Math.min(280, screenWidth * .66)) : 290;
  return (
    <div ref={tilt} className="sig-fan-wrap" data-tilt-zone="">
      <span className="sig-fan-mat" aria-hidden="true" />
      <div ref={fan} className="sig-fan" style={{ '--fan-w': `${width}px` } as React.CSSProperties} {...gesture} data-count={n} role="group" aria-roledescription={t('homeFanRole')} aria-label={t('homeFanLabel')}
        onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); focusFront.current = true; cycle(e.key === 'ArrowLeft' ? 1 : -1); } }}>
        {looks.map((l, i) => {
          const pos = (i - visibleFront + n) % n; // 0 = front, 1 = next (left in RTL), n-1 = previous (right)
          const slot = pos === 0 ? 'front' : pos === 1 ? 'next' : 'prev';
          return (
            <button key={l.key} type="button" className={`sig-fan-card is-${slot}`} data-gesture-surface="" tabIndex={pos === 0 ? 0 : -1}
              aria-label={t(pos === 0 ? 'homeFanFront' : 'homeFanShow', { label: l.label })} onClick={() => (pos === 0 ? cycle(1) : setFront(i))}>
              <CardThumb event={l.event} content={l.content} width={width} />
            </button>
          );
        })}
      </div>
      <div className="sig-fan-controls">
        <button type="button" className="sig-fan-arrow" onClick={() => cycle(-1)} aria-label={t('homeFanPrev')}><Icon name="back" /></button>
        <p className="sig-fan-label" aria-live="polite">{looks[visibleFront]?.label}</p>
        <button type="button" className="sig-fan-arrow" onClick={() => cycle(1)} aria-label={t('homeFanNext')}><Icon name="forward" /></button>
      </div>
      <p className="sig-fan-hint">{t('homeFanHint')} <span aria-hidden="true">→</span></p>
    </div>
  );
}

function Hero({ featured, loading }: { featured?: Event; loading: boolean }) {
  const { t, copy, dialect } = useCopy();
  const now = useNow(60000);
  const design = useDesign(featured?.id ?? '');
  const looks = useLooks(featured, design.data?.draft);
  const phase = featured ? eventPhase(featured, now) : 'upcoming';
  const step = featured ? nextStep(featured, !!design.data, phase, copy) : null;
  return (
    <section className="sig-hero" aria-labelledby="sig-hero-title">
      <span className="sig-hero-pattern" aria-hidden="true" />
      <div className="sig-hero-inner">
        <div className="sig-hero-copy">
          <p className="sig-hero-kicker"><i aria-hidden="true" />{t('homeKicker')}</p>
          <h1 id="sig-hero-title"><span className="sig-line">{t('homeSloganA')}</span> <span className="sig-line">{t('homeSloganB')}</span></h1>
          <p className="sig-hero-sub">{t('homeSub')}</p>
          {loading ? <Skeleton lines={2} /> : featured && step ? (
            <div className="sig-hero-next">
              <p className="sig-hero-next-label"><span>{t('homeNextLabel')}</span><Status tone={PHASE_LABEL[phase].tone}>{countdownLabel(featured.date, todayFor(featured, now), dialect)}</Status></p>
              <p className="sig-hero-next-title">{featured.title}</p>
              <div className="sig-hero-actions">
                <LinkButton to={step.to} variant="primary" size="lg" iconEnd="forward">{step.label}</LinkButton>
                <Link to={paths.overview(featured.id)} className="sig-text-link">{t('homeAllDetails')}</Link>
              </div>
            </div>
          ) : (
            <div className="sig-hero-actions">
              <LinkButton to={paths.newEvent} variant="primary" size="lg" icon="plus" className="sig-hero-cta">{t('homeStart')}</LinkButton>
              <Link to={`${paths.newEvent}?type=graduation`} className="sig-hero-link">{t('homeGraduationLink')}</Link>
            </div>
          )}
        </div>
        <HeroFan looks={looks} />
        <span className="sig-hero-sticker" aria-hidden="true"><b className="num">13</b>{t('homeStickerUnit')}</span>
      </div>
      <nav className="sig-hero-band" aria-label={t('homeStartBy')}>
        <ul>{OCCASIONS_ORDERED.map((t) => <li key={t.id}><Link to={`${paths.newEvent}?type=${t.id}`}>{t.label}</Link></li>)}</ul>
      </nav>
    </section>
  );
}

/* ------------------------------------------------------------------ white sections (C) */
function EventTicket({ event }: { event: Event }) {
  const { t, copy, dialect } = useCopy();
  const now = useNow();
  const design = useDesign(event.id);
  const phase = eventPhase(event, now);
  const step = nextStep(event, !!design.data, phase, copy);
  const past = phase === 'completed' || phase === 'archived';
  return (
    <article className={`sig-ticket${past ? ' is-past' : ''}`}>
      <span className={`sig-ticket-art tone-${toneOf(event.type)}`} aria-hidden="true">{design.data ? <CardThumb event={event} content={design.data.draft} width={84} /> : <OccasionGlyph type={event.type} />}</span>
      <div className="sig-ticket-body">
        <p className="sig-ticket-kind"><span>{eventTypeInfo(event.type).label}</span><Status tone={PHASE_LABEL[phase].tone}>{past ? t(PHASE_KEY[phase]) : countdownLabel(event.date, todayFor(event, now), dialect)}</Status></p>
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
      {/* the occasion's own object (shipped artwork that the deck used to replace with an icon) */}
      <img className="sig-poster-object" src={`assets/occasions/${type}-object.webp`} alt="" width="320" height="320" loading="lazy" decoding="async" aria-hidden="true" />
    </span>
  );
}

function OccasionDeckSection() {
  const { t } = useCopy();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const items = OCCASIONS_ORDERED;
  const active = items[index]!;
  return (
    <section className="sig-section sig-deck-section" aria-labelledby="sig-occasions">
      <header className="sig-section-head">
        <p className="sig-index"><span className="num">02</span>{t('homeOccasions')}</p>
        <h2 id="sig-occasions">{t('homeOccasionsA')}<br />{t('homeOccasionsB')}</h2>
      </header>
      <div className="sig-deck-layout">
        <div className="sig-deck-copy" aria-live="polite">
          <p className="sig-deck-kind"><span className={`sig-dot tone-${toneOf(active.id)}`} aria-hidden="true" />{active.hint}</p>
          <h3>{active.label}</h3>
          <p>{t(active.couple ? 'homeDeckCouple' : 'homeDeckSingle')} {t('homeDeckEditable')}</p>
          <LinkButton to={`${paths.newEvent}?type=${active.id}`} variant="primary" size="lg" iconEnd="forward">{t('homeDeckStart', { type: active.label })}</LinkButton>
        </div>
        <TactileDeck items={items} index={index} onIndexChange={setIndex} getKey={(o) => o.id} window={2}
          label={t('homeDeckLabel')} itemLabel={(o) => o.label} activateHint={t('homeDeckActivate')}
          onActivate={(o) => navigate(`${paths.newEvent}?type=${o.id}`)}
          renderCard={(o, s) => <OccasionPoster type={o.id} active={s.active} />} className="sig-occasion-deck" />
      </div>
    </section>
  );
}

function Steps() {
  const { t } = useCopy();
  const steps: Array<[string, string]> = [
    [t('homeStep1'), t('homeStep1Hint')],
    [t('homeStep2'), t('homeStep2Hint')],
    [t('homeStep3'), t('homeStep3Hint')],
  ];
  return (
    <section className="sig-section sig-steps" aria-labelledby="sig-steps-title">
      <header className="sig-section-head"><p className="sig-index"><span className="num">03</span>{t('homeHow')}</p><h2 id="sig-steps-title">{t('homeHowTitle')}</h2></header>
      <ol>{steps.map(([t, d], i) => <li key={t}><span className="sig-step-art" aria-hidden="true"><Icon name={i === 0 ? 'calendar' : i === 1 ? 'envelope' : 'users'} size="lg" /></span><span className="sig-steps-num num">{String(i + 1).padStart(2, '0')}</span><strong>{t}</strong><p>{d}</p></li>)}</ol>
    </section>
  );
}

export function SignatureHome() {
  const { t } = useCopy();
  const events = useEvents();
  const now = useNow(60000);
  const [memories, setMemories] = useState(false);
  // a coordinator works on the owner's events; creating one of their own would be a dead end (domain/roles «event.create»)
  const mayCreate = can(useRole(), 'event.create');
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
              <div><p className="sig-index"><span className="num">01</span>{t('homeMine')}</p><h2 id="sig-mine">{t(memories ? 'homeMinePast' : active.length > 1 ? 'homeMineMore' : 'homeMineRoom')}</h2></div>
              {past.length > 0 && <button type="button" className="sig-chip-toggle" aria-pressed={memories} onClick={() => setMemories((v) => !v)}><Icon name="archive" size="sm" />{memories ? t('homeShowUpcoming') : <>{t('homeShowPast')} <span className="num">{past.length}</span></>}</button>}
            </header>
            {events.loading ? <PageLoader /> : events.error ? <ErrorState error={events.error} onRetry={events.refetch} /> : (
              <div className="sig-tickets">
                {list.map((e) => <EventTicket key={e.id} event={e} />)}
                {!memories && mayCreate && <Link to={paths.newEvent} className="sig-new-ticket"><span className="sig-new-plus" aria-hidden="true"><Icon name="plus" /></span><span><strong>{t('homeNewEvent')}</strong><small>{t('homeNewEventHint')}</small></span><Icon name="forward" size="sm" /></Link>}
                {memories && !past.length && <p className="sig-empty-line">{t('homeNoPast')}</p>}
              </div>
            )}
          </section>
          <OccasionDeckSection />
          <SignatureBanner />
          <Steps />
        </div>
        <Stage tone="charcoal" size="lg" className="sig-closing" pattern="bloom" as="section" aria-label={t('homeStartRegion')}>
          <p className="sig-closing-kicker">ضيوفي</p>
          <p className="sig-closing-line">{t('homeClosingA')}<br /><em>{t('homeClosingB')}</em></p>
          <div className="sig-closing-actions">{mayCreate && <LinkButton to={paths.newEvent} variant="primary" size="lg" icon="plus">{t('homeNewEvent')}</LinkButton>}<Link to="/app/help" className="sig-text-link">{t('homeHowLink')}</Link></div>
        </Stage>
      </main>
    </SignatureShell>
  );
}

