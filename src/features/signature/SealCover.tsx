/**
 * «توقيع» invitation reveal for guests: a sealed envelope addressed to them.
 *   · lift the wax seal (drag it up) or press «افتحوا الدعوة» → the flap opens, the card rises, the invitation plays
 *   · «الموعد وتأكيد الحضور» skips straight to the practical details and RSVP — never blocked by the cinema
 *   · the first touch is also the user gesture that lets sound start, if the guest turns it on
 *   · reduced motion: no flap/rise animation, the invitation opens at once
 */
import { useEffect, useRef, useState } from 'react';
import type { GuestView } from '../../services/contracts';
import { sealOpens } from '../../domain/gestures';
import { usePointerGesture } from '../../ui/hooks/usePointerGesture';
import { haptic, springTo } from '../../ui/motion/motion';
import { invitationNumbers } from '../../domain/format';
import { faceDigits } from '../../domain/templates';
import { useCopy } from '../../ui/copy';
import { CardThumb } from '../invitation/CardThumb';
import { EnvelopeBack, EnvelopeFront, Seal, Stage } from './SignatureArt';

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function SealCover({ view, onOpen, onDetails }: { view: GuestView; onOpen: () => void; onDetails: () => void }) {
  const { t } = useCopy();
  // the cover writes the date in the card's own number system, as the card, its pages and the hub do
  const N = invitationNumbers(faceDigits(view.design.cardId));
  const [opening, setOpening] = useState(false);
  const openingRef = useRef(false);
  const openTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(openTimer.current), []);
  const seal = useRef<HTMLButtonElement>(null);
  const env = useRef<HTMLDivElement>(null);
  const armed = useRef(false);
  const stop = useRef<() => void>(() => {});
  useEffect(() => () => stop.current(), []);
  // the envelope answers the finger: lifting the seal starts opening the flap and raising the card
  const lift = (dy: number) => {
    const y = Math.max(-TRAVEL * 1.2, Math.min(18, dy));
    seal.current?.style.setProperty('--lift', `${y}px`);
    env.current?.style.setProperty('--open-p', Math.max(0, Math.min(1, -y / TRAVEL)).toFixed(3));
  };
  const TRAVEL = 140;
  const ev = view.event;
  const open = () => {
    if (openingRef.current) return;
    openingRef.current = true;
    setOpening(true);
    haptic('success');
    if (reduced()) { onOpen(); return; }
    openTimer.current = window.setTimeout(onOpen, 900);
  };
  const gesture = usePointerGesture({
    axis: 'y', enabled: !opening,
    onStart: () => { stop.current(); armed.current = false; },
    onMove: (dy) => {
      lift(dy); seal.current?.setAttribute('data-dragging', ''); env.current?.setAttribute('data-dragging', '');
      const now = -dy >= TRAVEL * 0.55; if (now !== armed.current) { armed.current = now; haptic(now ? 'select' : 'tick'); }
    },
    onEnd: (g) => {
      seal.current?.removeAttribute('data-dragging');
      env.current?.removeAttribute('data-dragging');
      if (!g.moved) return; // a plain tap is handled by onClick
      if (!g.cancelled && sealOpens(g.dy, g.velocity, TRAVEL)) { open(); return; }
      // not far enough: the seal sinks back on a spring and the flap closes with it
      stop.current = springTo(Math.max(-TRAVEL * 1.2, Math.min(18, g.dy)), 0, { velocity: g.velocity * 1000, onUpdate: lift, onRest: () => { seal.current?.style.removeProperty('--lift'); env.current?.style.removeProperty('--open-p'); } });
    },
  });
  return (
    <main className={`sig-cover${opening ? ' is-opening' : ''}`}>
      <Stage size="lg" tone="charcoal" pattern="field" className="sig-cover-stage" as="div">
        <header className="sig-cover-head">
          <p className="sig-cover-kicker">{view.party ? <PrivateTo template={t('shPrivateTo')} name={view.party.name} /> : t('shForYou')}</p>
          <h1>{ev.title}</h1>
          <p className="sig-cover-date">{N.join(N.date(ev.date), ev.venue.city)}</p>
        </header>
        <div ref={env} className="sig-cover-env">
          <EnvelopeBack className="sig-cover-back" />
          <span className="sig-cover-flap" aria-hidden="true" />
          <span className="sig-cover-card" aria-hidden="true"><CardThumb event={{ ...ev, ownerId: 'guest', settings: { defaultPartySize: 2, revealTableToGuests: false, allowGeneralLink: false }, createdAt: '', updatedAt: '' }} content={view.design} width={140} /></span>
          <EnvelopeFront className="sig-cover-front" />
          <button ref={seal} type="button" className="sig-cover-seal" data-gesture-surface="" {...gesture} onClick={open} disabled={opening}
            aria-label={t('guestSealLabel')}>
            <Seal size={92} />
            <span className="sig-cover-seal-hint" aria-hidden="true">{t('guestSealHint')} ↑</span>
          </button>
        </div>
        <div className="sig-cover-actions">
          <button type="button" className="btn btn-primary btn-lg sig-cta" onClick={open} disabled={opening}>{t('guestOpen')}</button>
          <button type="button" className="sig-link-on-stage sig-cover-skip" onClick={onDetails}>{t('guestSkipToDetails')}</button>
        </div>
      </Stage>
    </main>
  );
}

/** «دعوة خاصة إلى {name}» / «لـ{name}»: the voice places the name; it stays an isolated run of its own direction */
function PrivateTo({ template, name }: { template: string; name: string }) {
  const [before, after = ''] = template.split('{name}');
  return <>{before}<bdi>{name}</bdi>{after}</>;
}
