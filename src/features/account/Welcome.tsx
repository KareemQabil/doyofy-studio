/**
 * Public landing (board 01; feedback F014, F016, F073).
 *   Hero     paper, envelope and ribbon (editorial photo) with a fan of REAL invitation faces dealt from
 *            the envelope. Drag/flick the fan on phones (spring physics), tilt with the pointer on desktop,
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

const FAN: EventType[] = ['graduation', 'wedding', 'birthday'];

/* ------------------------------------------------------------------ the dealt fan */
function InvitationFan() {
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
      <div ref={fan} className="wl-fan" {...gesture} role="group" aria-roledescription="معرض دعوات" aria-label="أمثلة دعوات — اسحب البطاقة أو اضغطها لتبديلها"
        onKeyDown={(e) => { if (e.key === 'ArrowLeft') { e.preventDefault(); cycle(1); } if (e.key === 'ArrowRight') { e.preventDefault(); cycle(-1); } }}>
        {looks.map((l, i) => {
          const slot = order.indexOf(i);
          return (
            <button key={l.type} type="button" className={`wl-card slot-${slot}`} data-gesture-surface="" style={{ '--deal': slot } as CSSProperties}
              tabIndex={slot === 0 ? 0 : -1} aria-label={slot === 0 ? `مثال: دعوة ${l.label}` : `اعرض مثال ${l.label}`}
              onClick={() => { if (slot === 0) cycle(1); else { haptic('tick'); setOrder((o) => [i, ...o.filter((x) => x !== i)]); } }}>
              <CardThumb event={l.event} content={l.content} width={width} />
            </button>
          );
        })}
      </div>
      <p className="wl-fan-caption" aria-live="polite"><span className="num">{String(front + 1).padStart(2, '0')}</span>مثال: {looks[front]!.label}<span className="wl-fan-hint">· اسحب البطاقة</span></p>
    </div>
  );
}

/* ------------------------------------------------------------------ occasion rail */
function OccasionRail() {
  const rail = useRef<HTMLUListElement>(null);
  const step = (dir: 1 | -1) => { const el = rail.current; if (!el) return; el.scrollBy({ left: -dir * el.clientWidth * 0.7, behavior: prefersReducedMotion() ? 'auto' : 'smooth' }); };
  return (
    <section className="wl-section wl-occasions" aria-labelledby="wl-occ">
      <header className="wl-section-head">
        <h2 id="wl-occ">ما مناسبتك؟</h2>
        <div className="wl-rail-arrows"><button type="button" className="wl-arrow v2-press" onClick={() => step(-1)} aria-label="السابق"><Icon name="back" /></button><button type="button" className="wl-arrow v2-press" onClick={() => step(1)} aria-label="التالي"><Icon name="forward" /></button></div>
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
        <p className="wl-kicker">على جوال ضيفك</p>
        <h2 id="wl-demo">هكذا تصل دعوتك.</h2>
        <p>ظرف بختمٍ يفتحه الضيف بلمسة، ثم دعوتك كاملة، ورد واحد: سيحضر ومعه كم شخصًا، أو يعتذر بلطف. جرّبها هنا كما سيجرّبها ضيفك.</p>
        <ol className="wl-demo-steps">
          <li className={step === 'sealed' ? 'is-on' : ''}><b className="num">01</b>اسحب الختم للأعلى أو اضغطه</li>
          <li className={step === 'open' ? 'is-on' : ''}><b className="num">02</b>اقرأ الدعوة واختر ردك</li>
          <li className={step === 'attend' || step === 'sent' || step === 'declined' ? 'is-on' : ''}><b className="num">03</b>حضور بعدد، أو اعتذار</li>
        </ol>
      </div>
      <div className="wl-phone" aria-label="تجربة توضيحية لدعوة الضيف">
        <span className="wl-phone-notch" aria-hidden="true" />
        <p className="wl-phone-badge"><Icon name="eye" size="sm" />تجربة — لا يُسجَّل أي رد</p>
        <div className={`wl-envelope is-${step}`}>
          <span className="wl-env-back" aria-hidden="true" />
          <div className="wl-env-card" aria-hidden={step === 'sealed'}><CardThumb event={ev} content={content} width={196} /></div>
          <span className="wl-env-front" aria-hidden="true" />
          <span className="wl-env-flap" aria-hidden="true" />
          {step === 'sealed' && (
            <button ref={seal} type="button" className="wl-seal" data-gesture-surface="" {...lift} onClick={open} aria-label="افتح الدعوة">
              <Seal size={74} tone="red" />
              <span className="wl-seal-hint"><Icon name="chevron-up" size="sm" />اسحب لأعلى</span>
            </button>
          )}
        </div>
        <div className="wl-phone-panel" aria-live="polite">
          {step === 'sealed' && <p className="wl-phone-line">دعوة من نورة وفيصل</p>}
          {step === 'open' && <div className="wl-answer"><button type="button" className="wl-btn is-primary v2-press" onClick={() => { haptic('tick'); setStep('attend'); }}>سأحضر</button><button type="button" className="wl-btn v2-press" onClick={() => { haptic('tick'); setStep('declined'); }}>أعتذر</button></div>}
          {step === 'attend' && (
            <div className="wl-count">
              <span>كم شخصًا سيحضر؟</span>
              <div className="wl-stepper"><button type="button" className="v2-press" onClick={() => setCount((c) => Math.max(1, c - 1))} aria-label="أقل" disabled={count <= 1}><Icon name="minus" size="sm" /></button><b className="num" aria-live="polite">{count}</b><button type="button" className="v2-press" onClick={() => setCount((c) => Math.min(4, c + 1))} aria-label="أكثر" disabled={count >= 4}><Icon name="plus" size="sm" /></button></div>
              <button type="button" className="wl-btn is-primary v2-press" onClick={() => { haptic('success'); setStep('sent'); }}>أكّد الحضور</button>
            </div>
          )}
          {step === 'sent' && <div className="wl-result"><Seal size={52} tone="gold" className="wl-result-seal" /><p><b>هكذا يرى ضيفك التأكيد.</b><br />في الدعوة الحقيقية يظهر بعد حفظ الرد فعلًا.</p></div>}
          {step === 'declined' && <div className="wl-result"><p><b>نقدّر اعتذارك.</b><br />يصل الاعتذار لصاحب المناسبة دون أي خطوة إضافية.</p></div>}
          {step !== 'sealed' && <button type="button" className="wl-replay" onClick={() => { setStep('sealed'); setCount(2); }}><Icon name="refresh" size="sm" />أعد التجربة</button>}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ page */
export function WelcomePage() {
  const navigate = useNavigate();
  const demo = () => { saveDemoAccount({ status: 'demo' }); navigate('/app/events'); };
  const jump = (id: string) => document.getElementById(id)?.closest('section')?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  return (
    <div className="wl">
      <header className="wl-header">
        <Link to="/app/welcome" className="wl-brand" aria-label="ضيوفي"><Logo height={30} /></Link>
        {/* in-page jumps are buttons: with <base href="/"> a bare #hash link would leave the SPA */}
        <nav className="wl-nav" aria-label="روابط"><button type="button" onClick={() => jump('wl-occ')}>المناسبات</button><button type="button" onClick={() => jump('wl-demo')}>على جوال ضيفك</button><Link to="/app/help">كيف تعمل</Link></nav>
        <Link to="/app/login" className="wl-login v2-press"><Icon name="user" size="sm" />دخول</Link>
      </header>
      <main id="main" tabIndex={-1}>
        <section className="wl-hero" aria-labelledby="wl-title">
          <picture className="wl-hero-photo" aria-hidden="true">
            <source srcSet="assets/editorial/stationery-still-life.avif" type="image/avif" />
            <img src="assets/editorial/stationery-still-life.webp" alt="" width="1536" height="1024" decoding="async" fetchPriority="high" />
          </picture>
          <div className="wl-hero-copy">
            <p className="wl-kicker"><span aria-hidden="true" />دعوات رقمية لكل فرحة</p>
            <h1 id="wl-title"><span className="wl-line">كل فرحة</span><span className="wl-line is-red">تستاهل دعوة.</span></h1>
            <p className="wl-sub">من أول دعوة، إلى آخر ضيف. اكتب الأسماء والموعد، ونجهّز لك دعوة جاهزة للمشاركة، وردودًا واضحة حتى يوم الاستقبال.</p>
            <div className="wl-actions">
              <LinkButton to="/app/signup" variant="primary" size="lg" iconEnd="forward">ابدأ مناسبتك</LinkButton>
              <LinkButton to="/app/login" variant="secondary" size="lg">عندي حساب</LinkButton>
            </div>
            <button type="button" className="wl-demo-link" onClick={demo}>أو استكشف بمناسبة جاهزة<Icon name="forward" size="sm" /></button>
          </div>
          <InvitationFan />
        </section>
        <OccasionRail />
        <GuestDemo />
        <section className="wl-section wl-steps" aria-labelledby="wl-steps">
          <h2 id="wl-steps">ثلاث خطوات، وفرحتك جاهزة.</h2>
          <ol>
            <li><Seal size={54} tone="red" mark="١" /><strong>اختر مناسبتك</strong><p>زفاف، تخرّج، ميلاد أو إفطار — كل مناسبة تبدأ بدعوة مكتوبة لها.</p></li>
            <li><Seal size={54} tone="gold" mark="٢" /><strong>أضف لمستك</strong><p>الأسماء والكلمة والبرنامج جاهزة، وغيّر الشكل متى شئت دون أن يضيع شيء.</p></li>
            <li><Seal size={54} tone="charcoal" mark="٣" /><strong>رحّب بضيوفك</strong><p>رابط لكل ضيف، ردود واضحة، وطاولات واستقبال في مكان واحد.</p></li>
          </ol>
        </section>
        <section className="wl-closing" aria-label="ابدأ">
          <p className="wl-closing-line">فرحتك علينا.<br /><em>وضيوفك في انتظارك.</em></p>
          <LinkButton to="/app/signup" variant="primary" size="lg" iconEnd="forward">ابدأ الآن</LinkButton>
        </section>
      </main>
      <footer className="wl-footer"><Logo height={22} /><span>من أول دعوة إلى آخر ضيف.</span><span className="wl-footer-note">نسخة تجربة — الحسابات والبيانات على هذا الجهاز.</span></footer>
    </div>
  );
}
