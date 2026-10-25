// Shared envelope prop (used by the envelope reveal and the envelope finale).
// The back panel sits behind the card, pocket/flap/seal in front, so the card can
// genuinely slide in and out between them.
import { h } from '../engine/dom.js';

export function makeEnvelope(m, { mono = '', open = false } = {}) {
  const P = m.card.palette || {};
  const style = `--env:${P.env || '#6B1E2C'};--paper:${P.paper || '#F4EAE0'}`;
  const back = h('div', { class: 'env env--back', style, 'aria-hidden': 'true' }, h('div', { class: 'env__back' }));
  const front = h('div', { class: 'env env--front', style, 'aria-hidden': 'true' },
    h('div', { class: 'env__pocket' }),
    h('div', { class: 'env__flap' }, h('div', { class: 'env__flap-front' }), h('div', { class: 'env__flap-back' })),
    h('div', { class: 'env__seal' }, h('span', {}, mono)),
    h('div', { class: 'env__flash' }));
  m.stage.card.decorBack.append(back);
  m.stage.card.decorFront.append(front);
  m.track(() => { back.remove(); front.remove(); });
  const flap = front.querySelector('.env__flap');
  if (open) m.set(flap, { rotateX: 180 });
  return { back, front, both: [back, front], flap, seal: front.querySelector('.env__seal'), flash: front.querySelector('.env__flash') };
}

export const monogram = (m) => { const mg = m.content.couple.monogram || {}; const p = mg.ar || mg[m.L.primary] || []; return `${p[0] || ''} ${p[1] || ''}`.trim(); };
