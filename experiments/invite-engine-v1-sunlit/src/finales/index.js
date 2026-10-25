/**
 * Finale library. Runs after a successful RSVP (or at the end of a flow without RSVP).
 * Finales never simply fade out: each gives the card a closing gesture, then the
 * engine (or the finale's own thankYou()) shows the closing message with replay.
 */
import { FinaleRegistry } from '../engine/registries.js';
import { h } from '../engine/dom.js';
import { makeEnvelope, monogram } from '../reveals/envelope.js';

const mono = (m) => { const mg = m.content.couple.monogram || {}; const p = mg[m.L.primary] || mg.ar || []; return `${p[0] || ''}${p[1] ? ' · ' + p[1] : ''}`; };

FinaleRegistry.registerMany([
  {
    id: 'translucent_sleeve', meta: { title: 'Translucent sleeve', description: 'The card slides into a vellum sleeve, botanicals align, a blind-embossed monogram seals it.' },
    tags: ['editorial', 'modern', 'luxury', 'minimal', 'light', 'architectural'],
    enter(m, tl) {
      const f = m.stage.fit;
      const sleeve = h('div', { class: 'fn-sleeve', 'aria-hidden': 'true' },
        h('div', { class: 'fn-sleeve__sheen' }),
        h('div', { class: 'fn-sleeve__seal' }, h('span', {}, mono(m))));
      m.stage.card.decorFront.append(sleeve); m.track(() => sleeve.remove());
      const seal = sleeve.querySelector('.fn-sleeve__seal');
      m.camera.toRest(tl, 0, 1.1);
      tl.to(m.stage.card.tilt, { rotateX: 0, rotateY: 0, x: 0, y: 0, duration: 0.8 }, 0);
      tl.to(m.stage.card.flip, { rotateY: 0, duration: 0.8 }, 0);
      // card lifts a touch, the sleeve rises to meet it, the card settles inside
      tl.to(m.stage.card.reveal, { y: -f.h * 0.04, duration: 0.8, ease: 'power2.out' }, 0.9);
      tl.fromTo(sleeve, { y: f.h * 0.9, opacity: 0 }, { y: f.h * 0.16, opacity: 1, duration: 1.1, ease: 'editorial' }, 1.1);
      tl.to(m.stage.card.reveal, { y: f.h * 0.02, duration: 1.2, ease: 'settle' }, 1.9);
      tl.to(sleeve, { y: 0, duration: 1.2, ease: 'settle' }, 1.9);
      // botanicals align symmetrically around the sleeve
      (m.card.decor || []).forEach((d, i) => { if (d.finale) tl.to(d.el, { ...d.finale, duration: 1.6, ease: 'editorial' }, 2.2 + i * 0.1); });
      tl.fromTo(seal, { opacity: 0, scale: 1.25 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' }, 3.1);
      tl.call(() => m.audio.emit('seal'), [], 3.25);
      m.camera.pullBack(tl, 3.0, f.mobile ? 0.72 : 0.8, 1.8);
      tl.to(m.stage.camera, { y: -f.h * (f.mobile ? 0.19 : 0.14), duration: 1.8, ease: 'cinematic' }, 3.0);
      tl.addLabel('finale', 3.6);
    },
  },
  {
    id: 'envelope_and_seal', meta: { title: 'Envelope & wax seal', description: 'The card slides into an envelope, the flap closes and a wax seal stamps it.' },
    tags: ['classic', 'romantic', 'luxury', 'cinematic', 'arabic', 'paper'],
    enter(m, tl) {
      const f = m.stage.fit;
      const E = makeEnvelope(m, { mono: monogram(m), open: true });
      m.set(E.seal, { opacity: 0 }); m.set(E.flash, { opacity: 0 });
      m.camera.toRest(tl, 0, 1);
      tl.to(m.stage.card.flip, { rotateY: 0, duration: 0.8 }, 0);
      tl.fromTo(E.both, { y: f.h * 0.9, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'settle' }, 0.8);
      tl.to(m.stage.card.reveal, { scale: 0.8, y: -f.h * 0.14, duration: 0.8, ease: 'power2.out' }, 0.8);
      tl.to(m.stage.card.reveal, { y: f.h * 0.26, duration: 1, ease: 'power2.in' }, 1.7);
      tl.to(E.flap, { rotateX: 0, duration: 0.8, ease: 'power3.inOut' }, 2.6);
      tl.set(m.stage.card.reveal, { opacity: 0 }, 3.3);
      tl.fromTo(E.seal, { opacity: 0, scale: 2.6, rotate: -10 }, { opacity: 1, scale: 1, rotate: 0, duration: 0.5, ease: 'power3.in' }, 3.3);
      tl.call(() => m.audio.emit('seal'), [], 3.75);
      tl.fromTo(E.flash, { opacity: 0.9, scale: 0.5 }, { opacity: 0, scale: 3, duration: 0.8, ease: 'sine.out' }, 3.8);
      tl.to(E.both, { y: -f.vh * 0.9, scale: 0.25, rotate: -14, opacity: 0, duration: 1.5, ease: 'power3.in' }, 4.7);
      tl.to(m.stage.card.shadow, { opacity: 0, duration: 0.6 }, 1.8);
      tl.addLabel('finale', 5.4);
    },
  },
  {
    id: 'float_away', meta: { title: 'Float away', description: 'The card lifts and drifts up, with a burst of celebration.' },
    tags: ['playful', 'dreamy', 'pastel', 'festive', 'romantic'],
    enter(m, tl) {
      const f = m.stage.fit;
      m.camera.toRest(tl, 0, 1);
      tl.to(m.stage.card.flip, { rotateY: 0, duration: 0.8 }, 0);
      tl.to(m.stage.card.reveal, { y: -f.h * 0.05, rotate: -2, duration: 0.8, ease: 'power2.out' }, 0.9);
      tl.call(() => { m.fx.burst('confetti', { y: f.cy }); m.fx.burst('sparkles', { x: f.cx, y: f.cy, n: 24 }); }, [], 1.5);
      tl.to(m.stage.card.reveal, { y: -f.vh, rotate: 6, scale: 0.7, opacity: 0, duration: 2.4, ease: 'power2.in' }, 1.6);
      tl.to(m.stage.card.shadow, { opacity: 0, duration: 1 }, 1.6);
      tl.addLabel('finale', 2.4);
    },
  },
]);
