/**
 * Reveal library. A reveal owns the hero entrance of the card (and any temporary props:
 * fabric, envelope, curtains, letterbox). It writes three labels on the hero timeline so
 * the engine can align the rest:  'card' (card becomes visible), 'decor' (decorative
 * layers settle), 'readable' (motion calms down, the card is fully legible).
 */
import { RevealRegistry } from '../engine/registries.js';
import { h } from '../engine/dom.js';
import { makeEnvelope, monogram } from './envelope.js';

const hideCard = (m, vars) => m.set(m.stage.card.reveal, vars);

RevealRegistry.registerMany([
  {
    id: 'fade', meta: { title: 'Fade', description: 'Soft defocused fade-up.' }, tags: ['minimal', 'calm', 'soft', 'editorial'],
    enter(m, tl) {
      tl.fromTo(m.stage.card.reveal, { opacity: 0, y: 14, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.6, ease: 'editorial' }, 0.5);
      tl.fromTo(m.stage.card.shadow, { opacity: 0 }, { opacity: 1, duration: 1.6 }, 0.6);
      tl.addLabel('card', 0.5); tl.addLabel('decor', 1.3); tl.addLabel('readable', 2.2);
    },
  },
  {
    id: 'card_lift', meta: { title: 'Card lift', description: 'The card rises out of the surface with real depth.' }, tags: ['modern', 'soft', 'playful', 'editorial'],
    enter(m, tl) {
      const f = m.stage.fit;
      tl.fromTo(m.stage.card.reveal, { opacity: 0, y: f.h * 0.3, rotateX: 26, scale: 0.94 }, { opacity: 1, y: 0, rotateX: 0, scale: 1, duration: 1.9, ease: 'settle' }, 0.5);
      tl.fromTo(m.stage.card.shadow, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 1.9, ease: 'settle' }, 0.6);
      tl.addLabel('card', 0.6); tl.addLabel('decor', 1.8); tl.addLabel('readable', 2.8);
    },
  },
  {
    id: 'fabric_peel_and_card_lift', meta: { title: 'Fabric peel + card lift', description: 'A linen cloth peels away, foreground botanicals part, the card rises.' },
    tags: ['editorial', 'luxury', 'architectural', 'soft', 'cinematic', 'light'],
    compat: { prefer: ['light', 'architectural', 'editorial'], avoid: ['playful'] },
    enter(m, tl) {
      const f = m.stage.fit;
      // 0.0–1.2  light establishes (scene.enter).   1.2–2.6  fabric peels + foreground parts
      const cloth = h('div', { class: 'rv-fabric', 'aria-hidden': 'true' },
        h('div', { class: 'rv-fabric__weave', style: `--linen:url(${m.assets.pick({ base: 'textures/linen', widths: [800, 1600] }, f.w * 1.3)})` }),
        h('div', { class: 'rv-fabric__folds' }), h('div', { class: 'rv-fabric__edge' }));
      m.stage.card.decorFront.append(cloth);
      m.track(() => cloth.remove());
      hideCard(m, { opacity: 0, y: f.h * 0.13, rotateX: 22, scale: 0.95 });
      m.set(m.stage.card.shadow, { opacity: 0 });
      m.set(cloth, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%)' });
      tl.fromTo(cloth, { filter: 'brightness(.9)' }, { filter: 'brightness(1)', duration: 1.2, ease: 'sine.out' }, 0);
      const rtl = m.L.dir === 'rtl';
      // lift the leading corner, then slide the cloth away along the diagonal
      tl.to(cloth, { clipPath: rtl ? 'polygon(0% 0%, 64% 0%, 100% 28%, 100% 100%, 0% 100%)' : 'polygon(36% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 28%)', x: (rtl ? 1 : -1) * f.w * 0.04, y: f.h * 0.02, rotate: rtl ? 2 : -2, duration: 0.8, ease: 'power2.inOut' }, 1.2);
      // slide the whole cloth out of frame along the diagonal (stays opaque: it's fabric, not a fade)
      tl.to(cloth, { x: (rtl ? 1 : -1) * (f.vw * 0.5 + f.w * 1.3), y: f.h * 0.7, rotate: rtl ? 18 : -18, skewX: rtl ? -5 : 5, duration: 1.35, ease: 'power3.in' }, 1.75);
      tl.call(() => cloth.remove(), [], 3.2);
      // 2.6–4.2 card rises with depth (camera dolly runs in parallel)
      tl.to(m.stage.card.reveal, { opacity: 1, y: 0, rotateX: 0, scale: 1, duration: 1.7, ease: 'settle' }, 2.5);
      tl.fromTo(m.stage.card.shadow, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1.8, ease: 'settle' }, 2.6);
      tl.addLabel('card', 2.6); tl.addLabel('decor', 4.1); tl.addLabel('readable', 5.8);
    },
  },
  {
    id: 'envelope_open', meta: { title: 'Envelope open', description: 'Wax seal breaks, flap opens, the card slides out.' }, tags: ['classic', 'romantic', 'luxury', 'arabic', 'paper'],
    enter(m, tl) {
      const f = m.stage.fit;
      const E = makeEnvelope(m, { mono: monogram(m) });
      hideCard(m, { opacity: 0, y: f.h * 0.3, scale: 0.8 });
      tl.fromTo(E.both, { y: f.h * 0.7, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'settle' }, 0.2);
      tl.set(m.stage.card.reveal, { opacity: 1 }, 1.3);
      tl.to(E.seal, { scale: 1.15, rotate: -8, duration: 0.35, ease: 'power2.out' }, 1.5);
      tl.to(E.seal, { scale: 0.5, y: -30, opacity: 0, rotate: 14, duration: 0.45, ease: 'power2.in' }, 1.85);
      tl.to(E.flap, { rotateX: 180, duration: 0.9, ease: 'power3.inOut' }, 1.9);
      tl.to(E.flap, { opacity: 0, duration: 0.5 }, 2.7);
      tl.to(m.stage.card.reveal, { y: -f.h * 0.2, scale: 0.86, duration: 1, ease: 'power2.out' }, 2.6);
      tl.to(E.both, { y: f.h * 0.95, opacity: 0, duration: 1.1, ease: 'power3.in' }, 3.4);
      tl.to(m.stage.card.reveal, { y: 0, scale: 1, duration: 1.3, ease: 'settle' }, 3.5);
      tl.fromTo(m.stage.card.shadow, { opacity: 0 }, { opacity: 1, duration: 1.2 }, 3.7);
      tl.addLabel('card', 2.6); tl.addLabel('decor', 4.2); tl.addLabel('readable', 4.9);
    },
  },
  {
    id: 'curtain_reveal', meta: { title: 'Curtain reveal', description: 'Two drapes part on the scene.' }, tags: ['theatrical', 'luxury', 'classic', 'dramatic'],
    enter(m, tl) {
      const col = m.card.palette.env || '#5B1523';
      const L = h('div', { class: 'rv-curtain rv-curtain--l', style: `--c:${col}` }), R = h('div', { class: 'rv-curtain rv-curtain--r', style: `--c:${col}` });
      m.stage.layers.overlay.append(L, R); m.track(() => { L.remove(); R.remove(); });
      hideCard(m, { opacity: 0, scale: 0.96 });
      tl.to(L, { xPercent: -104, skewX: 4, duration: 2.2, ease: 'power3.inOut' }, 0.6);
      tl.to(R, { xPercent: 104, skewX: -4, duration: 2.2, ease: 'power3.inOut' }, 0.6);
      tl.to(m.stage.card.reveal, { opacity: 1, scale: 1, duration: 1.6, ease: 'settle' }, 1.4);
      tl.fromTo(m.stage.card.shadow, { opacity: 0 }, { opacity: 1, duration: 1.4 }, 1.6);
      tl.call(() => { L.remove(); R.remove(); }, [], 3);
      tl.addLabel('card', 1.4); tl.addLabel('decor', 2.4); tl.addLabel('readable', 3.2);
    },
  },
  {
    id: 'cinematic_dolly_reveal', meta: { title: 'Cinematic fly-in', description: 'Letterbox, title credit, the card flies in from depth.' }, tags: ['cinematic', 'dramatic', 'night', 'luxury'],
    enter(m, tl) {
      const { L, content: c } = m;
      const top = h('div', { class: 'rv-bar rv-bar--top' }), bot = h('div', { class: 'rv-bar rv-bar--bot' });
      const credit = h('div', { class: 'rv-credit' },
        h('span', { class: 'rv-credit__names', ...L.lang(L.primary) }, `${L.p(c.couple.personA)} ${L.t('and')} ${L.p(c.couple.personB)}`),
        L.secondary && h('span', { class: 'rv-credit__sub', ...L.lang(L.secondary) }, `${L.s(c.couple.personA)} & ${L.s(c.couple.personB)}`));
      const black = h('div', { class: 'rv-black' });
      m.stage.layers.overlay.append(black, top, bot, credit);
      m.track(() => { black.remove(); top.remove(); bot.remove(); credit.remove(); });
      hideCard(m, { opacity: 0, z: -1300, y: m.stage.fit.h * 0.35, rotateX: 55, rotateY: -75, rotateZ: -12 });
      tl.fromTo(credit, { opacity: 0, filter: 'blur(10px)', scale: 1.06 }, { opacity: 1, filter: 'blur(0px)', scale: 1, duration: 0.9, ease: 'sine.out' }, 0.2);
      tl.to(credit, { opacity: 0, filter: 'blur(8px)', duration: 0.7, ease: 'sine.in' }, 1.8);
      tl.to(black, { opacity: 0, duration: 1.2, ease: 'sine.inOut' }, 1.9);
      tl.to(m.stage.card.reveal, { opacity: 1, z: 0, y: 0, rotateX: 0, rotateY: 0, rotateZ: 0, duration: 2.4, ease: 'expo.out' }, 2.2);
      tl.fromTo(m.stage.card.shadow, { opacity: 0 }, { opacity: 1, duration: 1.2 }, 3.4);
      tl.to([top, bot], { height: 0, duration: 1, ease: 'power3.inOut' }, 3.9);
      tl.call(() => { black.remove(); credit.remove(); top.remove(); bot.remove(); }, [], 5);
      tl.addLabel('card', 2.2); tl.addLabel('decor', 3.8); tl.addLabel('readable', 4.8);
    },
  },
]);
