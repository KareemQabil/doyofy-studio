// AUTO-PORTED from the Design canvas CardFace component (tools: see README "Porting designs").
// Each design is a pure function of the flattened card text `t`.
import { esc, seeded } from '../engine/dom.js';

export const DEFS = `<svg width="0" height="0" style="position: absolute" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="cf-pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FDF8F2" /><stop offset="1" stop-color="#EADACB" /></linearGradient>
    <filter id="cf-emb" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b" /><feOffset in="b" dx="1.1" dy="1.4" result="o1" /><feFlood flood-color="#76503F" flood-opacity=".4" result="c1" /><feComposite in="c1" in2="o1" operator="in" result="sh" /><feOffset in="b" dx="-.9" dy="-1" result="o2" /><feFlood flood-color="#FFFFFF" flood-opacity=".95" result="c2" /><feComposite in="c2" in2="o2" operator="in" result="hl" /><feMerge><feMergeNode in="sh" /><feMergeNode in="hl" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <filter id="cf-embF" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b" /><feOffset in="b" dx="-1.1" dy="-1.4" result="o1" /><feFlood flood-color="#76503F" flood-opacity=".4" result="c1" /><feComposite in="c1" in2="o1" operator="in" result="sh" /><feOffset in="b" dx=".9" dy="1" result="o2" /><feFlood flood-color="#FFFFFF" flood-opacity=".95" result="c2" /><feComposite in="c2" in2="o2" operator="in" result="hl" /><feMerge><feMergeNode in="sh" /><feMergeNode in="hl" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <filter id="cf-wc" x="-40%" y="-40%" width="180%" height="180%"><feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="3" seed="4" result="n" /><feDisplacementMap in="SourceGraphic" in2="n" scale="24" xChannelSelector="R" yChannelSelector="G" result="d" /><feGaussianBlur in="d" stdDeviation="2.5" /></filter>
    <filter id="cf-wc2" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="9" result="n" /><feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" /></filter>
    <radialGradient id="cf-peony" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="#FBE0E4" /><stop offset=".6" stop-color="#F2B3C0" /><stop offset="1" stop-color="#E08C9F" /></radialGradient>
    <radialGradient id="cf-cheart" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FFD6E3" /><stop offset=".55" stop-color="#FF9EBE" /><stop offset="1" stop-color="#E27A9E" /></radialGradient>
    <radialGradient id="cf-cpetal" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#FFF0F5" /><stop offset="1" stop-color="#FFB9CE" /></radialGradient>
    <radialGradient id="cf-cblue" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#F0F8FF" /><stop offset="1" stop-color="#B9DDFB" /></radialGradient>
    <radialGradient id="cf-ccenter" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#FFF4C4" /><stop offset="1" stop-color="#FFCF5A" /></radialGradient>
    <linearGradient id="cf-ccloud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" /><stop offset="1" stop-color="#F4E4EE" /></linearGradient>
    <linearGradient id="cf-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E58A68" /><stop offset=".7" stop-color="#F4C49B" /><stop offset="1" stop-color="#F7D8B4" /></linearGradient>
    <pattern id="cf-star" width="22" height="22" patternUnits="userSpaceOnUse"><rect x="5.5" y="5.5" width="11" height="11" fill="none" stroke="#B08A4A" stroke-width=".8" /><rect x="5.5" y="5.5" width="11" height="11" fill="none" stroke="#B08A4A" stroke-width=".8" transform="rotate(45 11 11)" /><circle cx="11" cy="11" r="1.5" fill="#B08A4A" /></pattern>
    <mask id="cf-moon"><rect x="0" y="0" width="300" height="140" fill="#fff" /><circle cx="160" cy="62" r="20" fill="#000" /></mask>
    <g id="cf-lobes"><path d="M0 -2 C-13 -4 -19 -17 -12 -26 C-6 -32 6 -32 12 -26 C19 -17 13 -4 0 -2Z" /><path transform="rotate(72)" d="M0 -2 C-13 -4 -19 -17 -12 -26 C-6 -32 6 -32 12 -26 C19 -17 13 -4 0 -2Z" /><path transform="rotate(144)" d="M0 -2 C-13 -4 -19 -17 -12 -26 C-6 -32 6 -32 12 -26 C19 -17 13 -4 0 -2Z" /><path transform="rotate(216)" d="M0 -2 C-13 -4 -19 -17 -12 -26 C-6 -32 6 -32 12 -26 C19 -17 13 -4 0 -2Z" /><path transform="rotate(288)" d="M0 -2 C-13 -4 -19 -17 -12 -26 C-6 -32 6 -32 12 -26 C19 -17 13 -4 0 -2Z" /></g>
    <path id="cf-leafp" d="M0 0 C7 -9 22 -11 34 0 C22 11 7 9 0 0Z" />
    <g id="cf-rose">
      <g filter="url(#cf-emb)" fill="url(#cf-pg)" stroke="#DCC7B4" stroke-width=".6"><use href="#cf-lobes" /></g>
      <g filter="url(#cf-emb)" fill="url(#cf-pg)" stroke="#DCC7B4" stroke-width=".6"><use href="#cf-lobes" transform="rotate(36) scale(.62)" /></g>
      <g filter="url(#cf-emb)"><circle r="7.5" fill="url(#cf-pg)" stroke="#DCC7B4" stroke-width=".6" /><path d="M-3.5 1 C-4.5 -3.5 1 -5.5 3.5 -2 C5.5 1 2.5 4.5 -1 3.4" fill="none" stroke="#C9B09A" stroke-width=".9" stroke-linecap="round" /></g>
    </g>
    <g id="cf-roseF">
      <g filter="url(#cf-embF)" fill="url(#cf-pg)" stroke="#DCC7B4" stroke-width=".6"><use href="#cf-lobes" /></g>
      <g filter="url(#cf-embF)" fill="url(#cf-pg)" stroke="#DCC7B4" stroke-width=".6"><use href="#cf-lobes" transform="rotate(36) scale(.62)" /></g>
      <g filter="url(#cf-embF)"><circle r="7.5" fill="url(#cf-pg)" stroke="#DCC7B4" stroke-width=".6" /><path d="M-3.5 1 C-4.5 -3.5 1 -5.5 3.5 -2 C5.5 1 2.5 4.5 -1 3.4" fill="none" stroke="#C9B09A" stroke-width=".9" stroke-linecap="round" /></g>
    </g>
    <g id="cf-grose">
      <use href="#cf-lobes" fill="#6A1A2A" stroke="#D9B77A" stroke-width="1" />
      <use href="#cf-lobes" transform="rotate(36) scale(.62)" fill="#7C2334" stroke="#E6C79A" stroke-width="1.1" />
      <circle r="7" fill="#8A2D3C" stroke="#E6C79A" stroke-width="1" />
      <path d="M-3.5 1 C-4.5 -3.5 1 -5.5 3.5 -2 C5.5 1 2.5 4.5 -1 3.4" fill="none" stroke="#F3D9A0" stroke-width="1" stroke-linecap="round" />
    </g>
    <g id="cf-sparkle"><path d="M0 -8 L1.4 -1.4 L8 0 L1.4 1.4 L0 8 L-1.4 1.4 L-8 0 L-1.4 -1.4Z" /></g>
    <g id="cf-euc">
      <path class="fx-draw" d="M172 -4 C150 30 128 58 108 96 C96 120 90 146 88 176" fill="none" stroke="#6F7F5C" stroke-width="1.4" />
      <path class="fx-draw" d="M150 34 C138 44 128 52 118 70" fill="none" stroke="#6F7F5C" stroke-width="1" />
      <g fill="#B9C6A7" stroke="#7D8C69" stroke-width=".8">
        <ellipse cx="164" cy="14" rx="11" ry="8" transform="rotate(-30 164 14)" /><ellipse cx="146" cy="18" rx="10" ry="8" transform="rotate(20 146 18)" />
        <ellipse cx="148" cy="42" rx="11" ry="8" transform="rotate(-40 148 42)" /><ellipse cx="130" cy="40" rx="10" ry="8" transform="rotate(15 130 40)" />
        <ellipse cx="134" cy="64" rx="11" ry="8" transform="rotate(-50 134 64)" /><ellipse cx="114" cy="62" rx="10" ry="8" transform="rotate(10 114 62)" />
        <ellipse cx="120" cy="88" rx="11" ry="8" transform="rotate(-60 120 88)" /><ellipse cx="100" cy="84" rx="10" ry="8" transform="rotate(5 100 84)" />
        <ellipse cx="108" cy="112" rx="10" ry="8" transform="rotate(-70 108 112)" /><ellipse cx="89" cy="108" rx="10" ry="7" />
        <ellipse cx="98" cy="136" rx="10" ry="7" transform="rotate(-80 98 136)" /><ellipse cx="81" cy="132" rx="9" ry="7" transform="rotate(-5 81 132)" />
        <ellipse cx="94" cy="158" rx="9" ry="7" transform="rotate(-85 94 158)" /><ellipse cx="80" cy="160" rx="8" ry="6" transform="rotate(-10 80 160)" />
        <ellipse cx="118" cy="74" rx="7" ry="5" transform="rotate(-30 118 74)" opacity=".85" />
      </g>
    </g>
    <g id="cf-cheart"><path d="M0 12 C-20 -2 -16 -22 0 -12 C16 -22 20 -2 0 12Z" fill="url(#cf-cheart)" /><ellipse cx="-7" cy="-9" rx="4.5" ry="2.6" fill="#fff" opacity=".6" transform="rotate(-30 -7 -9)" /></g>
    <g id="cf-cflower"><circle cx="0" cy="-11" r="8" /><circle cx="10.5" cy="-3.4" r="8" /><circle cx="6.5" cy="9" r="8" /><circle cx="-6.5" cy="9" r="8" /><circle cx="-10.5" cy="-3.4" r="8" /></g>
  </defs>
</svg>`;

function starsMarkup() {
  const R = seeded(7); let s = '';
  for (let i = 0; i < 34; i++) { const x = Math.round(R() * 290), y = Math.round(R() * 410), r = (R() * 1.8 + 0.8).toFixed(1), d = (R() * 4).toFixed(1), tt = (R() * 2.5 + 2).toFixed(1);
    s += `<span class="fx-twinkle" style="position:absolute;left:${x}px;top:${y}px;width:${r}px;height:${r}px;border-radius:50%;background:#F6E7C1;animation-delay:${d}s;animation-duration:${tt}s"></span>`; }
  return s;
}

export const MARKUP = {
  lace: (t) => {
  return `<div style="position: absolute; inset: 0; background: #F4EAE0; color: #4A2E29">
  <svg width="300" height="420" viewBox="0 0 300 420" style="position: absolute; left: 0; top: 0" aria-hidden="true">
    <path d="M14 408 V120 C14 78 40 62 80 60 C118 58 136 40 150 16 C164 40 182 58 220 60 C260 62 286 78 286 120 V408 Z" fill="none" stroke="#B8925A" stroke-width="1" />
    <path d="M22 400 V124 C22 86 46 72 82 70 C120 68 138 52 150 32 C162 52 180 68 218 70 C254 72 278 86 278 124 V400 Z" fill="none" stroke="#B8925A" stroke-width=".5" opacity=".8" />
    <path d="M150 8 L155 15 L150 22 L145 15Z" fill="#B8925A" />
  </svg>
  <svg width="140" height="158" viewBox="0 0 230 260" style="position: absolute; left: 0; top: 0" aria-hidden="true">
    <g filter="url(#cf-emb)" fill="none" stroke="#F1E5D8" stroke-width="3.2" stroke-linecap="round"><path d="M-6 30 C40 46 84 14 132 30 S196 42 236 20" /><path d="M26 -6 C42 52 12 104 30 164 S28 226 12 266" /><path d="M132 30 c8 -14 24 -10 20 3 c-2 7 -10 6 -9 0" stroke-width="2.2" /></g>
    <g filter="url(#cf-emb)" fill="url(#cf-pg)" stroke="#DCC7B4" stroke-width=".6"><use href="#cf-leafp" transform="translate(96 26) rotate(-18)" /><use href="#cf-leafp" transform="translate(84 86) rotate(35)" /><use href="#cf-leafp" transform="translate(34 104) rotate(96)" /><use href="#cf-leafp" transform="translate(172 36) rotate(-8) scale(.85)" /><use href="#cf-leafp" transform="translate(58 126) rotate(64) scale(.8)" /><use href="#cf-leafp" transform="translate(10 60) rotate(80) scale(.7)" /></g>
    <g filter="url(#cf-emb)" fill="#F8EFE5"><circle cx="104" cy="12" r="2.4" /><circle cx="112" cy="17" r="2.1" /><circle cx="46" cy="40" r="2.4" /><circle cx="40" cy="49" r="2" /><circle cx="92" cy="136" r="2.2" /><circle cx="160" cy="20" r="2.2" /></g>
    <use href="#cf-rose" transform="translate(64 64) scale(1.25)" /><use href="#cf-rose" transform="translate(150 32) scale(.72)" /><use href="#cf-rose" transform="translate(30 170) scale(.78)" />
  </svg>
  <svg width="140" height="158" viewBox="0 0 230 260" style="position: absolute; right: 0; bottom: 0" aria-hidden="true">
    <g transform="rotate(180 115 130)">
      <g filter="url(#cf-embF)" fill="none" stroke="#F1E5D8" stroke-width="3.2" stroke-linecap="round"><path d="M-6 30 C40 46 84 14 132 30 S196 42 236 20" /><path d="M26 -6 C42 52 12 104 30 164 S28 226 12 266" /></g>
      <g filter="url(#cf-embF)" fill="url(#cf-pg)" stroke="#DCC7B4" stroke-width=".6"><use href="#cf-leafp" transform="translate(96 26) rotate(-18)" /><use href="#cf-leafp" transform="translate(84 86) rotate(35)" /><use href="#cf-leafp" transform="translate(34 104) rotate(96)" /><use href="#cf-leafp" transform="translate(172 36) rotate(-8) scale(.85)" /></g>
      <use href="#cf-roseF" transform="translate(64 64) scale(1.25)" /><use href="#cf-roseF" transform="translate(150 32) scale(.72)" />
    </g>
  </svg>
  <div style="position: absolute; left: 36px; right: 36px; top: 74px; bottom: 34px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center">
    <span class="ar" style="font-size: 13px; color: #7A5A2F">بكل الحب</span>
    <span class="ruqaa" style="font-size: 46px; line-height: 1.2; margin-top: 2px">${esc(t.arA)}</span>
    <span class="ruqaa" style="font-size: 22px; line-height: 0.9; color: #B8925A">و</span>
    <span class="ruqaa" style="font-size: 46px; line-height: 1.25">${esc(t.arB)}</span>
    <span dir="ltr" style="font-size: 19px; font-style: italic; color: #6E5048">${esc(t.enA)} <span style="color: #7A5A2F">&amp;</span> ${esc(t.enB)}</span>
    <span style="display: block; width: 90px; height: 1px; background: #B8925A; margin: 12px 0 10px"></span>
    <span class="ar" style="font-size: 14px">${esc(t.dayAr)} · ${esc(t.dateAr)}</span>
    <span dir="ltr" style="font-size: 13px; font-style: italic; color: #6E5048">${esc(t.dayEn)}, ${esc(t.dateEn)} · ${esc(t.timeEn)}</span>
    <span class="ar" style="font-size: 12.5px; color: #7A5A2F; margin-top: 6px">${esc(t.venueAr)} — ${esc(t.cityAr)}</span>
  </div>
</div>`;
  },
  wine: (t) => {
  return `<div style="position: absolute; inset: 0; background: radial-gradient(90% 70% at 50% 45%, #6E1D2C 0%, #521220 100%); color: #F2DDD0">
  <div style="position: absolute; inset: 12px; border: 1px solid rgba(217,183,122,.85)"></div>
  <div style="position: absolute; inset: 17px; border: 1px solid rgba(217,183,122,.4)"></div>
  <svg width="300" height="420" viewBox="0 0 300 420" style="position: absolute; left: 0; top: 0" aria-hidden="true">
    <g fill="none" stroke="#D9B77A" stroke-width="1">
      <path d="M6 30 V6 H30" /><path d="M270 6 H294 V30" /><path d="M6 390 V414 H30" /><path d="M270 414 H294 V390" />
    </g>
    <g fill="#D9B77A"><rect x="3" y="3" width="6" height="6" transform="rotate(45 6 6)" /><rect x="291" y="3" width="6" height="6" transform="rotate(45 294 6)" /><rect x="3" y="411" width="6" height="6" transform="rotate(45 6 414)" /><rect x="291" y="411" width="6" height="6" transform="rotate(45 294 414)" /></g>
    <g transform="translate(150 12)"><rect x="-14" y="-4" width="28" height="8" fill="#5E1624" /><path d="M0 -7 L5 0 L0 7 L-5 0Z" fill="#D9B77A" /><circle cx="-10" cy="0" r="1.6" fill="#D9B77A" /><circle cx="10" cy="0" r="1.6" fill="#D9B77A" /></g>
    <g transform="translate(150 408)"><rect x="-14" y="-4" width="28" height="8" fill="#541321" /><path d="M0 -7 L5 0 L0 7 L-5 0Z" fill="#D9B77A" /><circle cx="-10" cy="0" r="1.6" fill="#D9B77A" /><circle cx="10" cy="0" r="1.6" fill="#D9B77A" /></g>
    <!-- gold roses TL -->
    <g fill="none" stroke="#D9B77A" stroke-width="1" stroke-linecap="round"><path d="M20 100 C30 70 40 56 66 44 C90 34 104 22 118 16" /><path d="M40 60 c-10 -6 -12 -18 -4 -22" /></g>
    <g fill="#6A1A2A" stroke="#D9B77A" stroke-width=".9"><use href="#cf-leafp" transform="translate(70 40) rotate(-25) scale(.9)" /><use href="#cf-leafp" transform="translate(26 88) rotate(-80) scale(.8)" /><use href="#cf-leafp" transform="translate(96 26) rotate(-12) scale(.7)" /><use href="#cf-leafp" transform="translate(38 70) rotate(130) scale(.7)" /><use href="#cf-leafp" transform="translate(110 20) rotate(160) scale(.55)" /></g>
    <use href="#cf-grose" transform="translate(48 48) scale(1.15)" /><use href="#cf-grose" transform="translate(96 30) scale(.55)" />
    <!-- gold roses BR -->
    <g transform="rotate(180 150 210)">
      <g fill="none" stroke="#D9B77A" stroke-width="1" stroke-linecap="round"><path d="M20 100 C30 70 40 56 66 44 C90 34 104 22 118 16" /></g>
      <g fill="#6A1A2A" stroke="#D9B77A" stroke-width=".9"><use href="#cf-leafp" transform="translate(70 40) rotate(-25) scale(.9)" /><use href="#cf-leafp" transform="translate(26 88) rotate(-80) scale(.8)" /><use href="#cf-leafp" transform="translate(96 26) rotate(-12) scale(.7)" /></g>
      <use href="#cf-grose" transform="translate(48 48) scale(1.15)" /><use href="#cf-grose" transform="translate(88 70) scale(.55)" />
    </g>
    <!-- crest -->
    <g transform="translate(150 96)">
      <path d="M-28 -30 H28 V2 C28 22 12 34 0 40 C-12 34 -28 22 -28 2 Z" fill="#5E1624" stroke="#D9B77A" stroke-width="1" />
      <path d="M-23 -25 H23 V2 C23 19 10 29 0 34 C-10 29 -23 19 -23 2 Z" fill="none" stroke="#D9B77A" stroke-width=".5" />
      <path d="M0 -44 C-4 -38 -8 -36 -12 -38 C-8 -34 -4 -32 0 -30 C4 -32 8 -34 12 -38 C8 -36 4 -38 0 -44Z" fill="#D9B77A" />
      <line x1="-12" y1="2" x2="12" y2="2" stroke="#D9B77A" stroke-width=".6" />
    </g>
  </svg>
  <div class="ruqaa" style="position: absolute; left: 0; right: 0; top: 70px; text-align: center; font-size: 20px; line-height: 1; color: #F3D9A0">${esc(t.monoA)}</div>
  <div class="ruqaa" style="position: absolute; left: 0; right: 0; top: 102px; text-align: center; font-size: 20px; line-height: 1; color: #F3D9A0">${esc(t.monoB)}</div>
  <div style="position: absolute; left: 30px; right: 30px; top: 150px; bottom: 34px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center">
    <span class="ar" style="font-size: 13px; color: #E3C58C">بكل الحب</span>
    <span dir="ltr" style="font-size: 9.5px; letter-spacing: 0.3em; color: #E3C58C; margin-top: 2px">WITH LOVE</span>
    <span class="ruqaa fx-foil" style="font-size: 40px; line-height: 1.45; margin-top: 4px">${esc(t.arA)} و ${esc(t.arB)}</span>
    <span dir="ltr" style="font-size: 25px; line-height: 1.1; color: #F2DDD0">${esc(t.enA)} <span style="color: #D9B77A">&amp;</span> ${esc(t.enB)}</span>
    <svg width="120" height="10" viewBox="0 0 120 10" style="margin: 10px 0 8px" aria-hidden="true"><line x1="0" y1="5" x2="52" y2="5" stroke="#D9B77A" stroke-width=".7" /><line x1="68" y1="5" x2="120" y2="5" stroke="#D9B77A" stroke-width=".7" /><path d="M60 0 L65 5 L60 10 L55 5Z" fill="#D9B77A" /></svg>
    <span dir="ltr" style="font-size: 11px; letter-spacing: 0.2em; color: #F2DDD0">${esc(t.dayEnU)} · ${esc(t.dateEnU)}</span>
    <span class="ar" style="font-size: 13px; color: #F2DDD0; margin-top: 2px">${esc(t.dayAr)} · ${esc(t.timeAr)}</span>
    <span dir="ltr" style="font-size: 10px; letter-spacing: 0.2em; color: #F2DDD0; margin-top: 8px">${esc(t.venueEnU)} · ${esc(t.cityEnU)}</span>
    <span dir="ltr" style="font-size: 9.5px; letter-spacing: 0.22em; color: #E3C58C; margin-top: 8px">DINNER · CELEBRATION · RSVP</span>
  </div>
</div>`;
  },
  emerald: (t) => {
  return `<div style="position: absolute; inset: 0; background: radial-gradient(80% 60% at 50% 42%, #1A4539 0%, #0F2C25 100%); color: #F2E8D5">
  <svg width="300" height="420" viewBox="0 0 300 420" style="position: absolute; left: 0; top: 0" aria-hidden="true">
    <g stroke="#D4B06A" stroke-width=".6" opacity=".16">
      <line x1="150" y1="215" x2="150" y2="35" /><line x1="150" y1="215" x2="210" y2="45" /><line x1="150" y1="215" x2="262" y2="80" /><line x1="150" y1="215" x2="290" y2="150" /><line x1="150" y1="215" x2="90" y2="45" /><line x1="150" y1="215" x2="38" y2="80" /><line x1="150" y1="215" x2="10" y2="150" /><line x1="150" y1="215" x2="180" y2="38" /><line x1="150" y1="215" x2="120" y2="38" /><line x1="150" y1="215" x2="238" y2="60" /><line x1="150" y1="215" x2="62" y2="60" /><line x1="150" y1="215" x2="278" y2="112" /><line x1="150" y1="215" x2="22" y2="112" />
    </g>
    <polygon points="28,14 272,14 272,26 286,26 286,394 272,394 272,406 28,406 28,394 14,394 14,26 28,26" fill="none" stroke="#D4B06A" stroke-width="1.1" />
    <polygon points="34,21 266,21 266,33 279,33 279,387 266,387 266,399 34,399 34,387 21,387 21,33 34,33" fill="none" stroke="#D4B06A" stroke-width=".5" />
    <g fill="none" stroke="#D4B06A" stroke-width="1"><path d="M126 54 A24 24 0 0 1 174 54" /><path d="M134 54 A16 16 0 0 1 166 54" /><path d="M142 54 A8 8 0 0 1 158 54" /><line x1="110" y1="54" x2="190" y2="54" /></g>
    <g fill="#D4B06A"><path d="M150 360 L156 368 L150 376 L144 368Z" /><path d="M132 368 L136 372 L132 376 L128 372Z" opacity=".7" /><path d="M168 368 L172 372 L168 376 L164 372Z" opacity=".7" /></g>
    <g fill="#D4B06A"><rect x="10" y="10" width="8" height="8" transform="rotate(45 14 14)" /><rect x="282" y="10" width="8" height="8" transform="rotate(45 286 14)" /><rect x="10" y="402" width="8" height="8" transform="rotate(45 14 406)" /><rect x="282" y="402" width="8" height="8" transform="rotate(45 286 406)" /></g>
  </svg>
  <div style="position: absolute; left: 40px; right: 40px; top: 70px; bottom: 70px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center">
    <span class="kufi" style="font-size: 13px; color: #E2C27E">بكل الحب</span>
    <span dir="ltr" style="font-size: 9.5px; letter-spacing: 0.4em; color: #E2C27E; margin-top: 2px">WITH LOVE</span>
    <span class="kufi" style="font-size: 38px; font-weight: 500; line-height: 1.35; margin-top: 10px">${esc(t.arA)}</span>
    <span class="kufi" style="font-size: 18px; line-height: 1; color: #D4B06A">و</span>
    <span class="kufi" style="font-size: 38px; font-weight: 500; line-height: 1.4">${esc(t.arB)}</span>
    <span dir="ltr" style="font-size: 12.5px; letter-spacing: 0.34em; color: #E2C27E; margin-top: 4px">${esc(t.enAU)} &amp; ${esc(t.enBU)}</span>
    <span style="display: block; width: 110px; height: 1px; background: #D4B06A; margin: 14px 0 10px"></span>
    <span dir="ltr" style="font-size: 24px; font-weight: 300; letter-spacing: 0.14em">${esc(t.dateNum)}</span>
    <span class="ar" style="font-size: 13px; color: #CFC3A8; margin-top: 2px">${esc(t.dayAr)} · ${esc(t.timeAr)}</span>
    <span dir="ltr" style="font-size: 9.5px; letter-spacing: 0.26em; color: #CFC3A8; margin-top: 6px">${esc(t.venueEnU)}</span>
  </div>
</div>`;
  },
  sage: (t) => {
  return `<div style="position: absolute; inset: 0; background: #E6EADC; color: #2F3B2C">
  <svg width="170" height="190" viewBox="0 0 170 190" style="position: absolute; right: 0; top: 0" aria-hidden="true"><use href="#cf-euc" /></svg>
  <svg width="150" height="168" viewBox="0 0 170 190" style="position: absolute; left: 0; bottom: 0" aria-hidden="true"><g transform="rotate(180 85 95)"><use href="#cf-euc" /></g></svg>
  <div style="position: absolute; inset: 14px; border: 1px solid rgba(111,127,92,.45); border-radius: 4px"></div>
  <div style="position: absolute; left: 34px; right: 34px; top: 56px; bottom: 50px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center">
    <span class="ar" style="font-size: 13px; color: #4F5E3F">بكل الحب</span>
    <span class="ruqaa" style="font-size: 42px; line-height: 1.35; margin-top: 4px">${esc(t.arA)} و ${esc(t.arB)}</span>
    <span class="script" dir="ltr" style="font-size: 36px; line-height: 1.2; color: #4F5E3F">${esc(t.enA)} &amp; ${esc(t.enB)}</span>
    <svg width="90" height="14" viewBox="0 0 90 14" style="margin: 10px 0 8px" aria-hidden="true"><path d="M0 7 H36 M54 7 H90" stroke="#6F7F5C" stroke-width=".8" /><ellipse cx="45" cy="7" rx="6" ry="4" fill="#B9C6A7" stroke="#7D8C69" stroke-width=".7" /></svg>
    <span dir="ltr" style="font-size: 11px; letter-spacing: 0.24em; color: #2F3B2C">${esc(t.dayEnU)} · ${esc(t.dateEnU)}</span>
    <span class="ar" style="font-size: 13.5px; margin-top: 2px">${esc(t.dayAr)} · ${esc(t.dateAr)} · ${esc(t.timeAr)}</span>
    <span dir="ltr" style="font-size: 14px; font-style: italic; color: #56624F; margin-top: 6px">${esc(t.venueEn)}, ${esc(t.cityEn)}</span>
  </div>
</div>`;
  },
  blush: (t) => {
  return `<div style="position: absolute; inset: 0; background: #FBF1ED; color: #5A3A3F">
  <svg width="300" height="420" viewBox="0 0 300 420" style="position: absolute; left: 0; top: 0" aria-hidden="true">
    <g filter="url(#cf-wc)"><circle cx="30" cy="40" r="66" fill="#F3C6CB" opacity=".75" /><circle cx="110" cy="6" r="44" fill="#F7DAC6" opacity=".75" /><circle cx="6" cy="140" r="40" fill="#E3D3EE" opacity=".7" /><circle cx="272" cy="386" r="70" fill="#F3C6CB" opacity=".7" /><circle cx="196" cy="420" r="46" fill="#F7DAC6" opacity=".75" /><circle cx="300" cy="286" r="40" fill="#E3D3EE" opacity=".65" /><ellipse cx="94" cy="80" rx="26" ry="10" fill="#BFD2C1" opacity=".8" transform="rotate(30 94 80)" /><ellipse cx="206" cy="344" rx="26" ry="10" fill="#BFD2C1" opacity=".8" transform="rotate(30 206 344)" /></g>
    <g filter="url(#cf-wc2)"><circle cx="54" cy="58" r="30" fill="url(#cf-peony)" /><circle cx="54" cy="58" r="21" fill="url(#cf-peony)" opacity=".9" /><circle cx="54" cy="58" r="12" fill="url(#cf-peony)" /><circle cx="248" cy="360" r="28" fill="url(#cf-peony)" /><circle cx="248" cy="360" r="19" fill="url(#cf-peony)" opacity=".9" /><circle cx="248" cy="360" r="10" fill="url(#cf-peony)" /></g>
  </svg>
  <div style="position: absolute; left: 30px; right: 30px; top: 70px; bottom: 60px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center">
    <span class="ruqaa" style="font-size: 28px; line-height: 1.4; color: #9A5560">${esc(t.arA)} و ${esc(t.arB)}</span>
    <span class="script" dir="ltr" style="font-size: 54px; line-height: 1.05">${esc(t.enA)}</span>
    <span class="script" dir="ltr" style="font-size: 30px; line-height: 0.8; color: #D08F9A">&amp;</span>
    <span class="script" dir="ltr" style="font-size: 54px; line-height: 1.1">${esc(t.enB)}</span>
    <span dir="ltr" style="font-size: 16px; font-style: italic; color: #7A5A5F; margin-top: 10px">${esc(t.dayEn)}, ${esc(t.dateEn)}</span>
    <span class="ar" style="font-size: 13.5px; color: #5A3A3F">${esc(t.dayAr)} · ${esc(t.dateAr)} · ${esc(t.timeAr)}</span>
    <span dir="ltr" style="font-size: 9.5px; letter-spacing: 0.26em; color: #9A5560; margin-top: 8px">${esc(t.venueEnU)} · ${esc(t.cityEnU)}</span>
  </div>
</div>`;
  },
  midnight: (t) => {
  const stars = starsMarkup();
  return `<div style="position: absolute; inset: 0; background: linear-gradient(180deg, #10172E 0%, #1E2A4C 100%); color: #F1E9D8">
  ${stars}
  <svg width="300" height="420" viewBox="0 0 300 420" style="position: absolute; left: 0; top: 0" aria-hidden="true">
    <circle cx="150" cy="66" r="34" fill="#E8C98A" opacity=".12" />
    <circle cx="150" cy="66" r="22" fill="#E8C98A" mask="url(#cf-moon)" />
    <g stroke="rgba(232,201,138,.45)" stroke-width=".6" fill="none"><polyline points="40,52 68,40 92,62 80,92" /><polyline points="220,40 246,58 272,50" /></g>
    <g fill="#E8C98A"><circle cx="40" cy="52" r="1.6" /><circle cx="68" cy="40" r="1.8" /><circle cx="92" cy="62" r="1.5" /><circle cx="80" cy="92" r="1.7" /><circle cx="220" cy="40" r="1.6" /><circle cx="246" cy="58" r="1.9" /><circle cx="272" cy="50" r="1.4" /></g>
    <rect x="14" y="14" width="272" height="392" rx="8" fill="none" stroke="rgba(232,201,138,.5)" stroke-width=".8" />
    <g fill="#E8C98A"><use href="#cf-sparkle" transform="translate(14 14) scale(.9)" /><use href="#cf-sparkle" transform="translate(286 14) scale(.9)" /><use href="#cf-sparkle" transform="translate(14 406) scale(.9)" /><use href="#cf-sparkle" transform="translate(286 406) scale(.9)" /></g>
  </svg>
  <div style="position: absolute; left: 34px; right: 34px; top: 112px; bottom: 36px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center">
    <span class="ar" style="font-size: 13px; color: #E8C98A">بكل الحب</span>
    <span class="ruqaa fx-foil" style="font-size: 44px; line-height: 1.3">${esc(t.arA)}</span>
    <span class="ruqaa" style="font-size: 20px; line-height: 0.9; color: #E8C98A">و</span>
    <span class="ruqaa fx-foil" style="font-size: 44px; line-height: 1.35">${esc(t.arB)}</span>
    <span dir="ltr" style="font-size: 19px; font-style: italic">${esc(t.enA)} &amp; ${esc(t.enB)}</span>
    <span style="display: block; width: 80px; height: 1px; background: rgba(232,201,138,.7); margin: 10px 0 8px"></span>
    <span dir="ltr" style="font-size: 11px; letter-spacing: 0.24em">${esc(t.dayEnU)} · ${esc(t.dateEnU)}</span>
    <span class="ar" style="font-size: 13px; color: #C9C3B5; margin-top: 2px">${esc(t.dayAr)} · ${esc(t.timeAr)} · ${esc(t.venueAr)}</span>
  </div>
</div>`;
  },
  arabesque: (t) => {
  return `<div style="position: absolute; inset: 0; background: #F7F0E3; color: #3A2A1E">
  <svg width="300" height="420" viewBox="0 0 300 420" style="position: absolute; left: 0; top: 0" aria-hidden="true">
    <rect x="10" y="10" width="280" height="22" fill="url(#cf-star)" /><rect x="10" y="388" width="280" height="22" fill="url(#cf-star)" /><rect x="10" y="32" width="22" height="356" fill="url(#cf-star)" /><rect x="268" y="32" width="22" height="356" fill="url(#cf-star)" />
    <rect x="10" y="10" width="280" height="400" fill="none" stroke="#B08A4A" stroke-width="1" />
    <rect x="32" y="32" width="236" height="356" fill="none" stroke="#B08A4A" stroke-width="1" />
    <path d="M60 372 V178 C60 130 104 104 150 74 C196 104 240 130 240 178 V372 Z" fill="rgba(176,138,74,.07)" stroke="#B08A4A" stroke-width="1" />
    <path d="M68 364 V180 C68 136 108 112 150 84 C192 112 232 136 232 180 V364 Z" fill="none" stroke="#B08A4A" stroke-width=".5" />
    <g class="fx-sway" style="transform-origin: 150px 84px">
      <line x1="150" y1="84" x2="150" y2="104" stroke="#B08A4A" stroke-width=".8" />
      <path d="M150 104 L158 114 L156 130 L150 136 L144 130 L142 114 Z" fill="#E9D3A6" stroke="#B08A4A" stroke-width=".8" />
      <circle cx="150" cy="121" r="3" fill="#F6C66A" class="fx-glow" />
    </g>
  </svg>
  <div style="position: absolute; left: 72px; right: 72px; top: 146px; bottom: 56px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center">
    <span class="ar" style="font-size: 12.5px; color: #7E5E2A">بكل الحب</span>
    <span class="ruqaa" style="font-size: 36px; line-height: 1.3">${esc(t.arA)}</span>
    <span class="ruqaa" style="font-size: 18px; line-height: 0.9; color: #B08A4A">و</span>
    <span class="ruqaa" style="font-size: 36px; line-height: 1.35">${esc(t.arB)}</span>
    <span dir="ltr" style="font-size: 16px; font-style: italic; color: #5E4A3A">${esc(t.enA)} &amp; ${esc(t.enB)}</span>
    <svg width="18" height="18" viewBox="0 0 22 22" style="margin: 8px 0 6px" aria-hidden="true"><rect x="5.5" y="5.5" width="11" height="11" fill="none" stroke="#B08A4A" /><rect x="5.5" y="5.5" width="11" height="11" fill="none" stroke="#B08A4A" transform="rotate(45 11 11)" /></svg>
    <span class="ar" style="font-size: 13.5px">${esc(t.dayAr)} · ${esc(t.dateAr)}</span>
    <span dir="ltr" style="font-size: 12.5px; font-style: italic; color: #5E4A3A">${esc(t.dayEn)} · ${esc(t.timeEn)}</span>
    <span class="ar" style="font-size: 12px; color: #7E5E2A; margin-top: 4px">${esc(t.venueAr)}</span>
  </div>
</div>`;
  },
  minimal: (t) => {
  return `<div style="position: absolute; inset: 0; background: #FAFAF7; color: #1C1C1C">
  <div dir="ltr" style="position: absolute; left: 14px; top: -34px; font-size: 250px; font-weight: 300; line-height: 1; color: #EFECE4">${esc(t.initA)}</div>
  <div dir="ltr" style="position: absolute; left: 118px; top: 88px; font-size: 250px; font-weight: 300; line-height: 1; color: #EFECE4">${esc(t.initB)}</div>
  <div dir="ltr" style="position: absolute; left: -38px; top: 200px; transform: rotate(-90deg); font-size: 9px; letter-spacing: 0.5em; color: #7A6230">WEDDING · ${esc(t.year)}</div>
  <div style="position: absolute; right: 30px; top: 34px; display: flex; flex-direction: column; align-items: flex-end; gap: 6px">
    <span class="kufi" style="font-size: 12px; color: #5A5A5A">بكل الحب</span>
    <span style="display: block; width: 28px; height: 1px; background: #B89A5E"></span>
  </div>
  <div style="position: absolute; right: 30px; left: 30px; bottom: 30px; display: flex; flex-direction: column; align-items: flex-start; text-align: right; gap: 2px">
    <span class="kufi" style="font-size: 32px; line-height: 1.35">${esc(t.arA)} و ${esc(t.arB)}</span>
    <span dir="ltr" style="font-size: 12px; letter-spacing: 0.36em; color: #5A5A5A">${esc(t.enAU)} — ${esc(t.enBU)}</span>
    <span style="display: block; width: 40px; height: 1px; background: #B89A5E; margin: 14px 0 8px"></span>
    <span dir="ltr" style="font-size: 50px; font-weight: 300; line-height: 1; letter-spacing: 0.02em">${esc(t.dateShort)}</span>
    <span class="kufi" style="font-size: 12.5px; color: #5A5A5A; margin-top: 8px">${esc(t.dayAr)} · ${esc(t.timeAr)} · ${esc(t.venueAr)}</span>
    <span dir="ltr" style="font-size: 9.5px; letter-spacing: 0.3em; color: #5A5A5A">${esc(t.venueEnU)} · ${esc(t.cityEnU)}</span>
  </div>
</div>`;
  },
  terracotta: (t) => {
  return `<div style="position: absolute; inset: 0; background: #EFE2D2; color: #4A2A1E">
  <svg width="192" height="212" viewBox="-6 -6 192 212" style="position: absolute; left: 54px; top: 28px" aria-hidden="true">
    <defs><clipPath id="cf-archclip"><path d="M0 200 V90 A90 90 0 0 1 180 90 V200 Z" /></clipPath></defs>
    <g clip-path="url(#cf-archclip)">
      <rect x="0" y="0" width="180" height="200" fill="url(#cf-sky)" />
      <g class="fx-sun"><circle cx="90" cy="128" r="46" fill="#FBE6C4" opacity=".35" /><circle cx="90" cy="128" r="32" fill="#FBE6C4" /></g>
      <path d="M-10 150 C30 128 70 140 100 150 C130 160 160 140 200 146 V210 H-10Z" fill="#C9754F" />
      <path d="M-10 170 C40 150 80 172 120 166 C150 162 170 160 200 168 V210 H-10Z" fill="#B4583A" />
      <path d="M-10 188 C40 178 90 196 200 182 V210 H-10Z" fill="#8E3F28" />
    </g>
    <path d="M0 200 V90 A90 90 0 0 1 180 90 V200 Z" fill="none" stroke="#4A2A1E" stroke-width="1" />
    <path d="M-6 206 V90 A96 96 0 0 1 186 90 V206 Z" fill="none" stroke="#B4583A" stroke-width=".6" />
  </svg>
  <div style="position: absolute; left: 30px; right: 30px; top: 250px; bottom: 26px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center">
    <span class="kufi" style="font-size: 30px; line-height: 1.35">${esc(t.arA)} و ${esc(t.arB)}</span>
    <span dir="ltr" style="font-size: 20px; font-style: italic; color: #6E4A3A">${esc(t.enA)} &amp; ${esc(t.enB)}</span>
    <svg width="60" height="12" viewBox="0 0 60 12" style="margin: 8px 0 6px" aria-hidden="true"><path d="M0 8 H22 M38 8 H60" stroke="#B4583A" stroke-width=".8" /><path d="M24 10 A6 6 0 0 1 36 10" fill="#B4583A" /></svg>
    <span dir="ltr" style="font-size: 11px; letter-spacing: 0.24em">${esc(t.dayEnU)} · ${esc(t.dateNum)}</span>
    <span class="kufi" style="font-size: 12.5px; color: #6E4A3A; margin-top: 3px">${esc(t.timeAr)} · ${esc(t.venueAr)}</span>
  </div>
</div>`;
  },
  clay: (t) => {
  return `<div style="position: absolute; inset: 0; background: linear-gradient(180deg, #FFD6E4 0%, #FFE6D2 100%); color: #7A4F5E">
  <div style="position: absolute; inset: 14px; border-radius: 24px; background: #FFF6EE; box-shadow: inset 0 10px 14px rgba(255,255,255,.85), inset 0 -12px 18px rgba(190,140,120,.2), 0 8px 18px rgba(165,106,133,.18)"></div>
  <svg width="300" height="420" viewBox="0 0 300 420" style="position: absolute; left: 0; top: 0" aria-hidden="true">
    <g class="fx-float"><ellipse cx="62" cy="52" rx="34" ry="18" fill="url(#cf-ccloud)" /><ellipse cx="46" cy="46" rx="18" ry="16" fill="url(#cf-ccloud)" /><ellipse cx="74" cy="40" rx="20" ry="18" fill="url(#cf-ccloud)" /></g>
    <g class="fx-float2"><ellipse cx="246" cy="372" rx="32" ry="16" fill="url(#cf-ccloud)" /><ellipse cx="232" cy="364" rx="16" ry="14" fill="url(#cf-ccloud)" /><ellipse cx="258" cy="360" rx="18" ry="16" fill="url(#cf-ccloud)" /></g>
    <g class="fx-float2"><use href="#cf-cheart" transform="translate(252 60) scale(1.05)" /></g>
    <g class="fx-float"><use href="#cf-cheart" transform="translate(44 360) scale(.8) rotate(-12)" /></g>
    <g class="fx-spin"><use href="#cf-cflower" transform="translate(222 40) scale(.9)" fill="url(#cf-cpetal)" /><circle cx="222" cy="40" r="6" fill="url(#cf-ccenter)" /></g>
    <g class="fx-spin"><use href="#cf-cflower" transform="translate(78 384) scale(.8)" fill="url(#cf-cblue)" /><circle cx="78" cy="384" r="5.5" fill="url(#cf-ccenter)" /></g>
    <g fill="#FFC9D8"><circle cx="36" cy="120" r="4" /><circle cx="268" cy="150" r="3.5" /><circle cx="262" cy="300" r="4" /><circle cx="40" cy="270" r="3" /></g>
  </svg>
  <div style="position: absolute; left: 34px; right: 34px; top: 74px; bottom: 60px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center">
    <span class="ar" style="font-size: 13px; color: #A0506C">بكل الحب</span>
    <span class="ruqaa" style="font-size: 44px; line-height: 1.3">${esc(t.arA)}</span>
    <span class="ruqaa" style="font-size: 22px; line-height: 0.9; color: #E58FAE">و</span>
    <span class="ruqaa" style="font-size: 44px; line-height: 1.35">${esc(t.arB)}</span>
    <span dir="ltr" style="font-size: 18px; font-style: italic; color: #8D6879">${esc(t.enA)} &amp; ${esc(t.enB)}</span>
    <div style="display: flex; gap: 8px; margin-top: 12px">
      <span class="ar" style="padding: 5px 12px; border-radius: 16px; background: #FFE3EC; font-size: 13px; box-shadow: inset 0 3px 5px rgba(255,255,255,.8), inset 0 -3px 6px rgba(190,120,150,.2)">${esc(t.dayAr)} · ${esc(t.dateAr)}</span>
      <span dir="ltr" style="padding: 5px 12px; border-radius: 16px; background: #E3F1FF; font-size: 13px; box-shadow: inset 0 3px 5px rgba(255,255,255,.8), inset 0 -3px 6px rgba(120,150,190,.2)">${esc(t.timeEn)}</span>
    </div>
    <span class="ar" style="font-size: 12.5px; color: #8D6879; margin-top: 8px">${esc(t.venueAr)} — ${esc(t.cityAr)}</span>
  </div>
</div>`;
  },
};
