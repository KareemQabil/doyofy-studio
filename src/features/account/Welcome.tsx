/**
 * Public landing (board 01; feedback F014, F016, F073).
 *   Hero     the design system's warm surface and brand pattern (no decorative photo) with a fan of REAL
 *            invitation faces dealt in. Drag/flick the fan on phones (spring physics), tilt with the pointer on desktop,
 *            tap a card to bring it forward. Headline/CTA are live HTML, never baked into an image.
 *   Rail     every occasion as an object you can swipe through; each opens the creator for that occasion.
 *   Phone    «هكذا يراها ضيفك»: a small, clearly-labelled demo of the guest's side — lift the seal, open,
 *            answer. It records nothing (no service calls), so it can never fake a real reply.
 * Reduced motion: no deal-in, no tilt, instant states; every action stays available as a button.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { EventType } from '../../domain/types';
import { OCCASIONS_ORDERED, eventTypeInfo } from '../../domain/event';
import { defaultDesign } from '../../domain/invitation';
import { sealOpens } from '../../domain/gestures';
import { Link, useNavigate } from '../../app/router';
import { usePrototype } from '../../app/data';
import { paths } from '../../app/paths';
import { Logo } from '../../ui/brand';
import { Icon, LinkButton } from '../../ui';
import { usePointerGesture } from '../../ui/hooks/usePointerGesture';
import { haptic, prefersReducedMotion, springTo } from '../../ui/motion/motion';
import { CardThumb } from '../invitation/CardThumb';
import { sampleEvent } from '../signature/sample-event';
import { useTilt } from '../signature/useTilt';
import { useMedia } from '../signature/useMedia';
import { Seal } from '../signature/SignatureArt';
import { saveDemoAccount } from './session';
import { useCopy } from '../../ui/copy';

const FAN: EventType[] = ['graduation', 'wedding', 'birthday'];

/* ------------------------------------------------------------------ the dealt fan */
function InvitationFan() {
  const { t } = useCopy();
  const phone = useMedia('(max-width: 760px)');
  const [order, setOrder] = useState<number[]>([0, 1, 2]);
  const fan = useRef<HTMLDivElement>(null);
  const tilt = useTilt<HTMLDivElement>(5);
  const stop = useRef<() => void>(() => {});
  const looks = useMemo(() => FAN.map((t) => { const e = sampleEvent(t); return { type: t, event: e, content: defaultDesign(e), label: eventTypeInfo(t).label }; }), []);
  const width = phone ? 150 : 236;
  const front = order[0]!;

  const paint = (x: number) => { const el = fan.current; if (!el) return; el.style.setProperty('--fan-x', `${x.toFixed(1)}px`); el.style.setProperty('--fan-r', `${(x * 0.045).toFixed(2)}deg`); };
  const cycle = (dir: 1 | -1) => { haptic('snap'); setOrder((o) => (dir === 1 ? [...o.slice(1), o[0]!] : [o[o.length - 1]!, ...o.slice(0, -1)])); };
  const gesture = usePointerGesture({
    axis: 'x',
    onStart: () => { stop.current(); fan.current?.setAttribute('data-dragging', ''); },
    onMove: (dx) => paint(dx),
    onEnd: (g) => {
      fan.current?.removeAttribute('data-dragging');
      const x = g.dx;
      if (g.moved && !g.cancelled && (Math.abs(x) > 70 || Math.abs(g.velocity) > 0.6)) {
        // the front card is thrown off to the side it travelled, then slides in at the back
        const out = Math.sign(x || g.velocity) * (width * 1.4);
        stop.current = springTo(x, out, { velocity: g.velocity * 1000, onUpdate: paint, onRest: () => { paint(0); cycle(1); } });
        return;
      }
      stop.current = springTo(x, 0, { velocity: g.velocity * 1000, onUpdate: paint });
    },
  });

  // phones that report device tilt without a permission prompt (Android) get a gentle parallax
  useEffect(() => {
    if (!phone || prefersReducedMotion() || typeof DeviceOrientationEvent === 'undefined') return;
    if (typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown }).requestPermission === 'function') return;
    let raf = 0;
    const on = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { const el = tilt.current; if (!el) return; el.style.setProperty('--ry', `${Math.max(-6, Math.min(6, e.gamma! / 6)).toFixed(2)}deg`); el.style.setProperty('--rx', `${Math.max(-5, Math.min(5, (e.beta! - 45) / 9)).toFixed(2)}deg`); });
    };
    window.addEventListener('deviceorientation', on);
    return () => { window.removeEventListener('deviceorientation', on); cancelAnimationFrame(raf); };
  }, [phone]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stop.current(), []);

  return (
    <div className="wl-stage" ref={tilt} data-tilt-zone="">
      <div ref={fan} className="wl-fan" {...gesture} role="group" aria-roledescription={t('wlFanRole')} aria-label={t('wlFanLabel')}
        onKeyDown={(e) => { if (e.key === 'ArrowLeft') { e.preventDefault(); cycle(1); } if (e.key === 'ArrowRight') { e.preventDefault(); cycle(-1); } }}>
        {looks.map((l, i) => {
          const slot = order.indexOf(i);
          return (
            <button key={l.type} type="button" className={`wl-card slot-${slot}`} data-gesture-surface="" style={{ '--deal': slot } as CSSProperties}
              tabIndex={slot === 0 ? 0 : -1} aria-label={t(slot === 0 ? 'wlFanFront' : 'wlFanShow', { label: l.label })}
              onClick={() => { if (slot === 0) cycle(1); else { haptic('tick'); setOrder((o) => [i, ...o.filter((x) => x !== i)]); } }}>
              <CardThumb event={l.event} content={l.content} width={width} />
            </button>
          );
        })}
      </div>
      <p className="wl-fan-caption" aria-live="polite"><span className="num">{String(front + 1).padStart(2, '0')}</span>{t('wlFanCaption', { label: looks[front]!.label })}<span className="wl-fan-hint">{t('wlFanHint')}</span></p>
    </div>
  );
}

/* ------------------------------------------------------------------ occasion rail */
function OccasionRail() {
  const { t } = useCopy();
  const rail = useRef<HTMLUListElement>(null);
  const step = (dir: 1 | -1) => { const el = rail.current; if (!el) return; el.scrollBy({ left: -dir * el.clientWidth * 0.7, behavior: prefersReducedMotion() ? 'auto' : 'smooth' }); };
  return (
    <section className="wl-section wl-occasions" aria-labelledby="wl-occ">
      <header className="wl-section-head">
        <h2 id="wl-occ">{t('wlWhatOccasion')}</h2>
        <div className="wl-rail-arrows"><button type="button" className="wl-arrow v2-press" onClick={() => step(-1)} aria-label={t('wlPrev')}><Icon name="back" /></button><button type="button" className="wl-arrow v2-press" onClick={() => step(1)} aria-label={t('wlNext')}><Icon name="forward" /></button></div>
      </header>
      <ul ref={rail} className="wl-rail">
        {OCCASIONS_ORDERED.map((o, i) => (
          <li key={o.id} style={{ '--i': i } as CSSProperties}>
            <Link to={`${paths.newEvent}?type=${o.id}`} className="wl-occ v2-lift">
              <span className="wl-occ-art"><img src={`assets/occasions/${o.id}-object.webp`} alt="" width="320" height="320" loading={i < 5 ? 'eager' : 'lazy'} decoding="async" /></span>
              <span className="wl-occ-name">{o.label}</span>
              <span className="wl-occ-hint">{o.hint}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ the guest's side, as a demo */
type DemoStep = 'sealed' | 'open' | 'attend' | 'sent' | 'declined';
function GuestDemo() {
  const { t } = useCopy();
  const [step, setStep] = useState<DemoStep>('sealed');
  const [count, setCount] = useState(2);
  const seal = useRef<HTMLButtonElement>(null);
  const ev = useMemo(() => sampleEvent('wedding'), []);
  const content = useMemo(() => defaultDesign(ev), [ev]);
  const open = () => { haptic('success'); setStep('open'); };
  const lift = usePointerGesture({
    axis: 'y', enabled: step === 'sealed',
    onMove: (dy) => seal.current?.style.setProperty('--lift', `${Math.min(0, dy)}px`),
    onEnd: (g) => {
      const travel = 120;
      if (!g.cancelled && g.moved && sealOpens(g.dy, g.velocity, travel)) { seal.current?.style.removeProperty('--lift'); open(); return; }
      const from = Math.min(0, g.dy);
      springTo(from, 0, { velocity: g.velocity * 1000, onUpdate: (v) => seal.current?.style.setProperty('--lift', `${v}px`) });
    },
  });
  return (
    <section className="wl-section wl-demo" aria-labelledby="wl-demo">
      <div className="wl-demo-copy">
        <p className="wl-kicker">{t('wlOnPhone')}</p>
        <h2 id="wl-demo">{t('wlDemoTitle')}</h2>
        <p>{t('wlDemoText')}</p>
        <ol className="wl-demo-steps">
          <li className={step === 'sealed' ? 'is-on' : ''}><b className="num">01</b>{t('wlDemoStep1')}</li>
          <li className={step === 'open' ? 'is-on' : ''}><b className="num">02</b>{t('wlDemoStep2')}</li>
          <li className={step === 'attend' || step === 'sent' || step === 'declined' ? 'is-on' : ''}><b className="num">03</b>{t('wlDemoStep3')}</li>
        </ol>
      </div>
      <div className="wl-phone" aria-label={t('wlPhoneLabel')}>
        <span className="wl-phone-notch" aria-hidden="true" />
        <p className="wl-phone-badge"><Icon name="eye" size="sm" />{t('wlPhoneBadge')}</p>
        <div className={`wl-envelope is-${step}`}>
          <span className="wl-env-back" aria-hidden="true" />
          <div className="wl-env-card" aria-hidden={step === 'sealed'}><CardThumb event={ev} content={content} width={196} /></div>
          <span className="wl-env-front" aria-hidden="true" />
          <span className="wl-env-flap" aria-hidden="true" />
          {step === 'sealed' && (
            <button ref={seal} type="button" className="wl-seal" data-gesture-surface="" {...lift} onClick={open} aria-label={t('wlSealOpen')}>
              <Seal size={74} tone="red" />
              <span className="wl-seal-hint"><Icon name="chevron-up" size="sm" />{t('wlSealHint')}</span>
            </button>
          )}
        </div>
        <div className="wl-phone-panel" aria-live="polite">
          {step === 'sealed' && <p className="wl-phone-line">{t('wlFrom', { names: 'نورة وفيصل' })}</p>}
          {step === 'open' && <div className="wl-answer"><button type="button" className="wl-btn is-primary v2-press" onClick={() => { haptic('tick'); setStep('attend'); }}>{t('guestAccept')}</button><button type="button" className="wl-btn v2-press" onClick={() => { haptic('tick'); setStep('declined'); }}>{t('guestDecline')}</button></div>}
          {step === 'attend' && (
            <div className="wl-count">
              <span>{t('wlHowMany')}</span>
              <div className="wl-stepper"><button type="button" className="v2-press" onClick={() => setCount((c) => Math.max(1, c - 1))} aria-label={t('wlFewer')} disabled={count <= 1}><Icon name="minus" size="sm" /></button><b className="num" aria-live="polite">{count}</b><button type="button" className="v2-press" onClick={() => setCount((c) => Math.min(4, c + 1))} aria-label={t('wlMore')} disabled={count >= 4}><Icon name="plus" size="sm" /></button></div>
              <button type="button" className="wl-btn is-primary v2-press" onClick={() => { haptic('success'); setStep('sent'); }}>{t('wlConfirm')}</button>
            </div>
          )}
          {step === 'sent' && <div className="wl-result"><Seal size={52} tone="gold" className="wl-result-seal" /><p><b>{t('wlSentTitle')}</b><br />{t('wlSentText')}</p></div>}
          {step === 'declined' && <div className="wl-result"><p><b>{t('wlDeclinedTitle')}</b><br />{t('wlDeclinedText')}</p></div>}
          {step !== 'sealed' && <button type="button" className="wl-replay" onClick={() => { setStep('sealed'); setCount(2); }}><Icon name="refresh" size="sm" />{t('wlReplay')}</button>}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ page */
export function WelcomePage() {
  const { t } = useCopy();
  const navigate = useNavigate();
  const proto = usePrototype();
  // the demo is the seeded events; after a fresh (empty) sign-up on this device, bring them back first
  const demo = () => { saveDemoAccount({ status: 'demo' }); if (proto.scenario() === 'empty') proto.reset('before'); navigate('/app/events'); };
  const jump = (id: string) => document.getElementById(id)?.closest('section')?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  return (
    <div className="wl">
      <header className="wl-header">
        <Link to="/app/welcome" className="wl-brand" aria-label="ضيوفي"><Logo height={30} /></Link>
        {/* in-page jumps are buttons: with <base href="/"> a bare #hash link would leave the SPA */}
        <nav className="wl-nav" aria-label={t('wlNav')}><button type="button" onClick={() => jump('wl-occ')}>{t('wlOccasions')}</button><button type="button" onClick={() => jump('wl-demo')}>{t('wlOnPhone')}</button><Link to="/app/help">{t('wlHow')}</Link></nav>
        <Link to="/app/login" className="wl-login v2-press"><Icon name="user" size="sm" />{t('wlLogin')}</Link>
      </header>
      <main id="main" tabIndex={-1}>
        <section className="wl-hero" aria-labelledby="wl-title">
          <div className="wl-hero-copy">
            <p className="wl-kicker"><span aria-hidden="true" />{t('homeKicker')}</p>
            <h1 id="wl-title"><span className="wl-line">{t('homeSloganA')}</span><span className="wl-line is-red">{t('homeSloganB')}</span></h1>
            <p className="wl-sub">{t('wlSub')}</p>
            <div className="wl-actions">
              <LinkButton to="/app/signup" variant="primary" size="lg" iconEnd="forward">{t('wlStart')}</LinkButton>
              <LinkButton to="/app/login" variant="secondary" size="lg">{t('wlHaveAccount')}</LinkButton>
            </div>
            <button type="button" className="wl-demo-link" onClick={demo}>{t('wlExplore')}<Icon name="forward" size="sm" /></button>
          </div>
          <InvitationFan />
        </section>
        <OccasionRail />
        <GuestDemo />
        <section className="wl-section wl-steps" aria-labelledby="wl-steps">
          <h2 id="wl-steps">{t('wlStepsTitle')}</h2>
          <ol>
            <li><Seal size={54} tone="red" mark="١" /><strong>{t('wlStep1')}</strong><p>{t('wlStep1Hint')}</p></li>
            <li><Seal size={54} tone="gold" mark="٢" /><strong>{t('wlStep2')}</strong><p>{t('wlStep2Hint')}</p></li>
            <li><Seal size={54} tone="charcoal" mark="٣" /><strong>{t('wlStep3')}</strong><p>{t('wlStep3Hint')}</p></li>
          </ol>
        </section>
        <section className="wl-closing" aria-label={t('homeStartRegion')}>
          <p className="wl-closing-line">{t('homeClosingA')}<br /><em>{t('homeClosingB')}</em></p>
          <LinkButton to="/app/signup" variant="primary" size="lg" iconEnd="forward">{t('wlStartNow')}</LinkButton>
        </section>
      </main>
      <footer className="wl-footer"><Logo height={22} /><span>{t('wlFooter')}</span><span className="wl-footer-note">{t('wlFooterNote')}</span></footer>
    </div>
  );
}
