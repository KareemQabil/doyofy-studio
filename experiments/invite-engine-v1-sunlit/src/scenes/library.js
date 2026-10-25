/**
 * Scene library (ported from the Studio + new environments). Scenes are responsive:
 * sky/wall/floor fill the viewport, objects are anchored to the viewport or to the
 * fitted card box in layout(), and silhouettes stretch horizontally — nothing assumes
 * a 390×844 phone.
 */
import { SceneRegistry } from '../engine/registries.js';
import { h, seeded } from '../engine/dom.js';
import { put, place, shadow } from './helpers.js';

const svg = (vb, inner, par = 'none', cls = '') => `<svg class="sc-svg ${cls}" viewBox="${vb}" preserveAspectRatio="${par}" aria-hidden="true">${inner}</svg>`;

const candle = (hgt) => `<div class="sc-candle" style="--hh:${hgt}px"><span class="sc-candle__halo"></span><span class="sc-candle__flame"></span><span class="sc-candle__body"></span></div>`;

SceneRegistry.registerMany([
  // ---------------------------------------------------------------- candle hall
  {
    id: 'candle_hall', meta: { title: 'Candle hall', description: 'Dark hall, warm spotlight, candles on a marble table.' },
    tags: ['night', 'warm', 'cinematic', 'luxury', 'moody', 'romantic'], compat: { prefer: ['luxury', 'cinematic', 'night'], avoid: ['pastel', 'playful'] },
    renderMode: 'dom', backdrop: '#140B0C',
    setup(m) {
      const st = m.state;
      put(m, 'far', '<div class="sc-fill" style="background:radial-gradient(60% 42% at 50% 28%, rgba(255,205,150,.2), transparent 70%), radial-gradient(90% 45% at 50% 100%, rgba(122,30,44,.55), transparent 70%), #140B0C"></div>');
      st.table = put(m, 'mid', '<div class="sc-table"></div>');
      st.candlesL = put(m, 'foreground', `<div class="sc-candles sc-candles--l">${candle(150)}${candle(96)}</div>`);
      st.candlesR = put(m, 'foreground', `<div class="sc-candles sc-candles--r">${candle(120)}${candle(80)}</div>`);
      shadow(m, { x: 0.02, y: 0.03, blur: 26, opacity: 0.55, color: '0,0,0', contact: 0.6 });
    },
    layout(m) { const f = m.stage.fit; place(m.state.table, { x: -60, y: f.y + f.h * 0.985, w: f.vw + 120, h: f.vh }); },
  },
  // ---------------------------------------------------------------- garden evening
  {
    id: 'garden_evening', meta: { title: 'Garden evening', description: 'Hedges, string lights and fireflies after dusk.' },
    tags: ['garden', 'night', 'organic', 'romantic', 'botanical'], compat: { prefer: ['botanical', 'romantic', 'organic'], avoid: ['chrome'] },
    renderMode: 'dom', backdrop: '#0B1712',
    setup(m) {
      const st = m.state;
      put(m, 'far', '<div class="sc-fill" style="background:linear-gradient(180deg,#0A1510 0%,#14271C 58%,#0B1812 100%)"></div>');
      put(m, 'background', svg('0 0 400 300', '<g fill="#10231A"><circle cx="10" cy="120" r="70"/><circle cx="90" cy="92" r="60"/><circle cx="170" cy="118" r="56"/><circle cx="250" cy="84" r="64"/><circle cx="330" cy="112" r="62"/><circle cx="400" cy="92" r="60"/><rect x="-20" y="110" width="440" height="200"/></g><g fill="#0D1D15"><circle cx="40" cy="190" r="56"/><circle cx="140" cy="210" r="50"/><circle cx="260" cy="195" r="58"/><circle cx="360" cy="205" r="52"/><rect x="-20" y="200" width="440" height="120"/></g>', 'none', 'sc-hedge'));
      const R = seeded(4);
      const bulbs = [];
      for (const [y0, y1, sag] of [[10, 9, 12], [19, 17, 11]]) {
        for (let i = 1; i < 14; i++) { const t = i / 14; bulbs.push(`<span class="sc-bulb" style="left:${t * 100}%;top:${(1 - t) * y0 + t * y1 + sag * 4 * t * (1 - t)}%;animation-delay:${(R() * 3).toFixed(2)}s"></span>`); }
      }
      st.lights = put(m, 'mid', `<div class="sc-lights">${svg('0 0 100 100', '<path d="M0 10 Q50 34 100 9" fill="none" stroke="#2E3A2E" stroke-width=".25"/><path d="M0 19 Q50 41 100 17" fill="none" stroke="#26322A" stroke-width=".2"/>')}${bulbs.join('')}</div>`);
      put(m, 'foreground', `<div class="sc-leaves">${svg('0 0 200 200', '<g fill="#06100B"><path d="M-10 200 C0 150 15 120 40 105 C30 135 35 165 45 200Z"/><path d="M-10 128 C15 123 35 138 50 158 C30 158 10 153 -10 148Z"/><path d="M5 200 C20 168 45 153 70 150 C55 168 45 183 42 200Z"/></g>', 'xMinYMax meet', 'sc-leaves__l')}${svg('0 0 200 200', '<g fill="#06100B"><path d="M210 200 C200 150 185 120 160 105 C170 135 165 165 155 200Z"/><path d="M210 128 C185 123 165 138 150 158 C170 158 190 153 210 148Z"/><path d="M195 200 C180 168 155 153 130 150 C145 168 155 183 158 200Z"/></g>', 'xMaxYMax meet', 'sc-leaves__r')}</div>`);
      st.pool = put(m, 'mid', '<div class="sc-pool"></div>');
      shadow(m, { x: 0, y: 0.02, blur: 30, opacity: 0.5, color: '0,0,0', contact: 0.5 });
    },
    layout(m) { const f = m.stage.fit; place(m.state.pool, { x: f.cx - f.w * 0.7, y: f.y + f.h * 0.92, w: f.w * 1.4, h: f.h * 0.2 }); },
  },
  // ---------------------------------------------------------------- desert sunset
  {
    id: 'desert_sunset', meta: { title: 'Desert sunset', description: 'Layered dunes under a setting sun.' },
    tags: ['warm', 'desert', 'sun', 'arabic', 'cinematic', 'earthy'], compat: { prefer: ['arabic', 'earthy', 'warm'], avoid: ['pastel', 'chrome'] },
    renderMode: 'svg', backdrop: '#E07A6E',
    setup(m) {
      const st = m.state;
      put(m, 'far', '<div class="sc-fill" style="background:linear-gradient(180deg,#3E2C5C 0%,#8A4B6E 24%,#E07A6E 46%,#F6B98A 60%,#F8CFA0 68%)"></div>');
      st.sun = put(m, 'far', '<div class="sc-sun"><span></span></div>');
      put(m, 'background', `<div class="sc-birds">${svg('0 0 60 20', '<g fill="none" stroke="#3E2C5C" stroke-width="1.2" stroke-linecap="round"><path d="M2 10q4-4 8 0q4-4 8 0"/><path d="M24 14q3-3 6 0q3-3 6 0"/><path d="M40 6q3-3 6 0q3-3 6 0"/></g>', 'xMidYMid meet')}</div>`);
      put(m, 'background', svg('0 0 400 300', '<path d="M-10 120 C60 80 140 100 200 120 C280 140 330 90 410 100 V300 H-10Z" fill="#C9826A"/>', 'none', 'sc-dune sc-dune--1'));
      put(m, 'mid', svg('0 0 400 300', '<path d="M-10 110 C80 70 170 110 240 100 C320 90 360 80 410 95 V300 H-10Z" fill="#A9604A"/>', 'none', 'sc-dune sc-dune--2'));
      put(m, 'foreground', svg('0 0 400 300', '<path d="M-10 120 C100 80 190 100 260 92 C330 86 380 100 410 110 V300 H-10Z" fill="#7E3F30"/><path d="M-10 120 C100 80 190 100 260 92 C330 86 380 100 410 110" fill="none" stroke="rgba(255,210,160,.35)" stroke-width="1.2"/>', 'none', 'sc-dune sc-dune--3'));
      shadow(m, { x: -0.06, y: 0.02, blur: 20, opacity: 0.35, color: '60,20,20', contact: 0.4 });
    },
  },
  // ---------------------------------------------------------------- starry night
  {
    id: 'starry_night', meta: { title: 'Starry night', description: 'Milky way, moon and a shooting star over hills.' },
    tags: ['night', 'celestial', 'calm', 'dreamy', 'romantic'], compat: { prefer: ['night', 'celestial', 'dreamy'], avoid: ['sun'] },
    renderMode: 'dom', backdrop: '#050919',
    setup(m) {
      put(m, 'far', '<div class="sc-fill" style="background:linear-gradient(180deg,#050919 0%,#121B45 58%,#2B2F63 100%)"></div>');
      put(m, 'far', '<div class="sc-milky"></div>');
      put(m, 'background', '<div class="sc-moon sc-moon--tr"><span></span></div>');
      put(m, 'background', '<div class="sc-shoot"></div>');
      put(m, 'foreground', svg('0 0 400 200', '<path d="M-10 90 C60 50 130 70 190 60 C260 48 320 30 410 70 V200 H-10Z" fill="#0B1030"/><path d="M-10 140 C80 110 180 130 250 120 C320 110 370 120 410 130 V200 H-10Z" fill="#070B1E"/>', 'none', 'sc-hills'));
      shadow(m, { x: 0, y: 0.02, blur: 30, opacity: 0.5, color: '0,0,10', contact: 0.4 });
    },
  },
  // ---------------------------------------------------------------- moonlit sea
  {
    id: 'moonlit_sea', meta: { title: 'Moonlit sea', description: 'Moon path shimmering on a calm night sea.' },
    tags: ['night', 'sea', 'calm', 'cinematic', 'celestial'], compat: { prefer: ['night', 'calm', 'celestial'], avoid: ['desert'] },
    renderMode: 'dom', backdrop: '#081230',
    setup(m) {
      put(m, 'far', '<div class="sc-fill" style="background:linear-gradient(180deg,#081230 0%,#1B2B58 44%,#3A4B7C 58%,#15264D 58.2%,#040915 100%)"></div>');
      put(m, 'background', '<div class="sc-moon sc-moon--sea"><span></span></div>');
      const R = seeded(12); let spans = '';
      for (let i = 0; i < 26; i++) { const w = 3 + i * 0.9 + R() * 7; spans += `<span style="top:${59.5 + i * 1.5 + R() * 0.8}%;width:${w.toFixed(1)}%;margin-left:${(-w / 2 + (R() - 0.5) * (2 + i * 0.6)).toFixed(1)}%;animation-delay:${(R() * 2.4).toFixed(2)}s;animation-duration:${(1.8 + R() * 1.6).toFixed(2)}s"></span>`; }
      put(m, 'mid', `<div class="sc-reflect">${spans}</div>`);
      put(m, 'mid', `<div class="sc-waves">${svg('0 0 560 200', '<g fill="none" stroke="rgba(170,190,255,.2)" stroke-width="1"><path d="M0 40 q20-6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0"/><path d="M0 100 q20-7 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0"/><path d="M0 170 q20-8 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0"/></g>')}</div>`);
      put(m, 'foreground', svg('0 0 400 100', '<path d="M-10 60 C60 40 150 55 220 50 C300 44 360 48 410 55 V100 H-10Z" fill="#0A0E1E"/>', 'none', 'sc-shore'));
      shadow(m, { x: 0.03, y: 0.02, blur: 26, opacity: 0.45, color: '0,0,20', contact: 0.4 });
    },
  },
  // ---------------------------------------------------------------- palace night
  {
    id: 'palace_night', meta: { title: 'Palace at night', description: 'Receding Andalusian arches lit by swaying lanterns.' },
    tags: ['arabic', 'luxury', 'night', 'warm', 'architectural', 'classic'], compat: { prefer: ['arabic', 'classic', 'luxury'], avoid: ['pastel', 'playful'] },
    renderMode: 'svg', backdrop: '#15122B',
    setup(m) {
      const arches = [[9, 'M30 730V428C30 308 149 249 195 210C241 249 360 308 360 428V730'], [6.7, 'M73 652V429C73 340 161 296 195 267C229 296 317 340 317 429V652'], [4.9, 'M105 594V429C105 363 170 331 195 310C220 331 285 363 285 429V594'], [3.6, 'M128 552V429C128 381 176 357 195 341C214 357 262 381 262 429V552'], [2.7, 'M146 520V430C146 394 181 376 195 364C209 376 245 394 245 430V520'], [2, 'M158 497V430C158 403 185 390 195 381C205 390 232 403 232 430V497']];
      const strokes = ['#3B2E57', '#453564', '#4F3C70', '#5A447C', '#654C88', '#705495'];
      put(m, 'far', '<div class="sc-fill" style="background:radial-gradient(40% 30% at 50% 50%, rgba(255,214,150,.55), transparent 70%), linear-gradient(180deg,#1A1633 0%,#241C3F 60%,#2C2146 100%)"></div>');
      put(m, 'background', svg('0 0 390 844', `<g stroke="rgba(255,214,150,.12)" stroke-width="1"><line x1="195" y1="430" x2="-200" y2="844"/><line x1="195" y1="430" x2="80" y2="844"/><line x1="195" y1="430" x2="310" y2="844"/><line x1="195" y1="430" x2="590" y2="844"/><line x1="0" y1="560" x2="390" y2="560"/><line x1="0" y1="660" x2="390" y2="660"/></g><g fill="none">${arches.slice().reverse().map(([w, d], i) => `<path d="${d}" stroke="${strokes[5 - i]}" stroke-width="${w * 1.4}"/>`).join('')}</g>`, 'xMidYMid slice'));
      put(m, 'foreground', '<div class="sc-lanterns"><span class="sc-lantern" style="--x:12%;--len:18%"></span><span class="sc-lantern" style="--x:88%;--len:26%;animation-delay:-2.4s"></span><span class="sc-lantern sc-lantern--far" style="--x:30%;--len:10%;animation-delay:-1.2s"></span><span class="sc-lantern sc-lantern--far" style="--x:70%;--len:12%;animation-delay:-3.1s"></span></div>');
      shadow(m, { x: 0, y: 0.02, blur: 28, opacity: 0.5, color: '10,5,20', contact: 0.5 });
    },
  },
  // ---------------------------------------------------------------- clay playground
  {
    id: 'clay_playground', meta: { title: 'Clay playground', description: 'Pastel clay stage with puffy clouds, hearts and flowers.' },
    tags: ['playful', 'pastel', 'clay', 'festive', 'soft'], compat: { prefer: ['playful', 'pastel', 'clay'], avoid: ['night', 'moody', 'luxury'] },
    renderMode: 'svg', backdrop: '#F7D7E6',
    setup(m) {
      const st = m.state;
      put(m, 'far', '<div class="sc-fill" style="background:radial-gradient(60% 30% at 50% 18%, rgba(255,255,255,.55), transparent 70%), linear-gradient(180deg,#F7D7E6 0%,#FDEBCF 100%)"></div>');
      st.plat = put(m, 'mid', '<div class="sc-platform"><span></span></div>');
      st.props = put(m, 'foreground', '<div class="sc-clayprops"><span class="clay clay-cloud" style="--x:6%;--y:10%"></span><span class="clay clay-cloud clay-cloud--b" style="--x:70%;--y:6%"></span><span class="clay clay-heart" style="--x:8%;--y:40%"></span><span class="clay clay-heart clay-heart--b" style="--x:84%;--y:46%"></span><span class="clay clay-flower" style="--x:6%;--y:74%"></span><span class="clay clay-flower clay-flower--b" style="--x:84%;--y:72%"></span></div>');
      shadow(m, { x: 0, y: 0.02, blur: 22, opacity: 0.22, color: '139,93,111', contact: 0.3 });
    },
    layout(m) { const f = m.stage.fit; place(m.state.plat, { x: f.cx - f.w * 0.75, y: f.y + f.h * 0.93, w: f.w * 1.5, h: f.w * 0.28 }); },
    enter(m, tl, at = 0) { tl.fromTo([...m.state.props.children], { opacity: 0, scale: 0.3, y: 18 }, { opacity: 1, scale: 1, y: 0, duration: 0.9, ease: 'back.out(1.8)', stagger: 0.12 }, at + 0.8); },
  },
  // ---------------------------------------------------------------- marble morning
  {
    id: 'marble_morning', meta: { title: 'Marble morning', description: 'Pale marble, morning beams, scattered petals.' },
    tags: ['light', 'soft', 'romantic', 'minimal', 'editorial', 'floral'], compat: { prefer: ['light', 'soft', 'floral'], avoid: ['night'] },
    renderMode: 'dom', backdrop: '#EDE7E0',
    setup(m) {
      const st = m.state;
      put(m, 'far', '<div class="sc-fill" style="background:linear-gradient(180deg,#F1ECE6 0%,#E6DED4 100%)"></div>');
      put(m, 'background', '<div class="sc-beams"><span></span><span></span><span></span></div>');
      st.floor = put(m, 'mid', `<div class="sc-marble">${svg('0 0 400 200', '<g fill="none" stroke="#CBC1B5" stroke-linecap="round" opacity=".7"><path d="M-10 30 C60 20 120 70 190 50 S320 10 400 60" stroke-width="1.2"/><path d="M-10 110 C80 80 140 140 230 110 S350 70 400 100" stroke-width=".9"/><path d="M40 200 C80 150 150 140 170 100 S230 40 300 30" stroke-width="1.4"/></g>')}</div>`);
      st.petals = put(m, 'foreground', '<div class="sc-petals"><i style="--x:8%;--y:84%;--r:30deg"></i><i style="--x:14%;--y:88%;--r:-20deg"></i><i style="--x:86%;--y:82%;--r:-40deg"></i><i style="--x:78%;--y:92%;--r:15deg"></i><i style="--x:30%;--y:95%;--r:60deg"></i></div>');
      shadow(m, { x: 0.04, y: 0.02, blur: 24, opacity: 0.22, color: '90,70,50', contact: 0.3 });
    },
    layout(m) { const f = m.stage.fit; place(m.state.floor, { x: -40, y: f.y + f.h * 0.985, w: f.vw + 80, h: f.vh }); },
  },
  // ---------------------------------------------------------------- silk drapes
  {
    id: 'silk_drapes', meta: { title: 'Silk drapes', description: 'Blush silk curtains, spotlight and a round pedestal.' },
    tags: ['romantic', 'soft', 'luxury', 'theatrical', 'light'], compat: { prefer: ['romantic', 'luxury'], avoid: ['playful'] },
    renderMode: 'svg', backdrop: '#EAD4CA',
    setup(m) {
      const st = m.state;
      const drape = '<defs><linearGradient id="sdg" x1="0" x2="1"><stop offset="0" stop-color="#D9A99A"/><stop offset=".18" stop-color="#F6E3DB"/><stop offset=".34" stop-color="#E3BCAE"/><stop offset=".52" stop-color="#F8E8E1"/><stop offset=".7" stop-color="#DDB2A4"/><stop offset=".86" stop-color="#F4DED5"/><stop offset="1" stop-color="#D4A08F"/></linearGradient></defs><path d="M0 0H140C120 280 70 470 0 640Z" fill="url(#sdg)"/><path d="M0 640C20 660 30 700 20 760" stroke="#D9A99A" stroke-width="10" fill="none" stroke-linecap="round"/>';
      put(m, 'far', '<div class="sc-fill" style="background:linear-gradient(180deg,#F4E6DF 0%,#EAD4CA 70%,#E1C4B7 100%)"></div>');
      put(m, 'background', '<div class="sc-spot"></div>');
      put(m, 'mid', `<div class="sc-drapes">${svg('0 0 140 760', drape, 'xMinYMin meet', 'sc-drape sc-drape--l')}${svg('0 0 140 760', drape, 'xMinYMin meet', 'sc-drape sc-drape--r')}</div>`);
      st.ped = put(m, 'mid', '<div class="sc-pedestal"><span class="sc-pedestal__top"></span><span class="sc-pedestal__body"></span></div>');
      shadow(m, { x: 0, y: 0.02, blur: 22, opacity: 0.25, color: '120,70,60', contact: 0.35 });
    },
    layout(m) { const f = m.stage.fit; const w = f.w * 1.25; place(m.state.ped, { x: f.cx - w / 2, y: f.y + f.h * 0.94, w, h: Math.max(80, f.vh - f.y - f.h * 0.94) }); },
  },
  // ---------------------------------------------------------------- floating petals
  {
    id: 'floating_petals', meta: { title: 'Floating petals', description: 'Pastel sky, soft clouds, drifting petals.' },
    tags: ['romantic', 'pastel', 'dreamy', 'floral', 'light', 'playful'], compat: { prefer: ['pastel', 'floral', 'dreamy'], avoid: ['night', 'moody'] },
    renderMode: 'dom', backdrop: '#F4EAFB',
    setup(m) {
      put(m, 'far', '<div class="sc-fill" style="background:linear-gradient(180deg,#FDE6EE 0%,#F4EAFB 52%,#E7F0FF 100%)"></div>');
      put(m, 'background', '<div class="sc-clouds"><span></span><span></span><span></span></div>');
      shadow(m, { x: 0, y: 0.03, blur: 30, opacity: 0.18, color: '150,90,130', contact: 0.2 });
    },
  },
  // ---------------------------------------------------------------- modern white gallery
  {
    id: 'modern_white_gallery', meta: { title: 'Modern white gallery', description: 'Gallery wall, skylight and a plinth — nothing else.' },
    tags: ['minimal', 'modern', 'editorial', 'light', 'architectural'], compat: { prefer: ['minimal', 'modern', 'editorial'], avoid: ['playful', 'festive'] },
    renderMode: 'dom', backdrop: '#EFEEEA',
    assets: [{ type: 'image', src: 'textures/gallery-wall-1200.webp', preload: true }],
    setup(m) {
      const st = m.state;
      put(m, 'far', `<div class="sc-fill" style="background:url(${m.assets.url('textures/gallery-wall-1200.webp')}) center/cover, #EFEEEA"></div>`);
      put(m, 'lighting', '<div class="sc-skylight"></div>');
      st.plinth = put(m, 'mid', '<div class="sc-plinth"><span class="sc-plinth__top"></span><span class="sc-plinth__face"></span></div>');
      shadow(m, { x: 0.035, y: 0.02, blur: 30, opacity: 0.2, color: '30,30,30', contact: 0.35 });
    },
    layout(m) { const f = m.stage.fit; const w = f.w * 1.18; place(m.state.plinth, { x: f.cx - w / 2, y: f.y + f.h * 0.985, w, h: f.vh }); },
  },
  // ---------------------------------------------------------------- luxury black studio
  {
    id: 'luxury_black_studio', meta: { title: 'Luxury black studio', description: 'Black seamless sweep, one softbox, a glossy floor reflection.' },
    tags: ['luxury', 'night', 'minimal', 'modern', 'dramatic', 'glam'], compat: { prefer: ['luxury', 'glam', 'minimal'], avoid: ['pastel', 'playful'] },
    renderMode: 'dom', backdrop: '#050505',
    setup(m) {
      put(m, 'far', '<div class="sc-fill" style="background:radial-gradient(70% 55% at 50% 40%, #1c1b1a 0%, #0a0a0a 60%, #050505 100%)"></div>');
      put(m, 'background', '<div class="sc-softbox"></div>');
      m.state.floor = put(m, 'mid', '<div class="sc-gloss"></div>');
      m.stage.root.classList.add('has-reflection');
      shadow(m, { x: 0, y: 0.015, blur: 24, opacity: 0.7, color: '0,0,0', contact: 0.7 });
    },
    layout(m) { const f = m.stage.fit; place(m.state.floor, { x: -40, y: f.y + f.h, w: f.vw + 80, h: f.vh }); },
    destroy(m) { m.stage.root.classList.remove('has-reflection'); },
  },
]);
