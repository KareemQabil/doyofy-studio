/**
 * Flat settings — the backdrop behind the invitation card.
 *
 * One colour field plus one flat motif each: no drapes, pedestals, floors, tables or perspective.
 * The motif is a single SVG drawn in a 1440×900 box and cover-scaled (`slice`): that box scales to
 * about 1:1 on a desktop window and on a portrait phone, which shows its centre column (x 512–928).
 * So the same markup fills a phone, a desktop or a gallery thumbnail without bars or a darkened echo,
 * and patterns keep their size.
 * Motion is 2D and slow (drift, twinkle, fall); it stops under reduced motion (studio.css).
 * Ids are kept from the old scene set so saved invitations and links keep their setting.
 */

const W = 1440, H = 900, CX = 720;

/** seeded positions so every render lands the same */
function rand(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}
const r1 = (v) => Math.round(v * 10) / 10;

function scatter(seed, n, fn) {
  const r = rand(seed);
  return Array.from({ length: n }, (_, i) => fn(r, i)).join('');
}

const stars = (seed, n, fill) => scatter(seed, n, (r, i) =>
  `<circle class="fs-tw" cx="${r1(r() * W)}" cy="${r1(r() * H * 0.9)}" r="${r1(r() * 1.4 + 0.6)}" fill="${fill}" style="animation-delay:${r1(-r() * 4)}s;animation-duration:${r1(r() * 2.5 + 2.5)}s"/>`);

const dots = (seed, n, colours, rMin, rMax) => scatter(seed, n, (r, i) =>
  `<circle cx="${r1(r() * W)}" cy="${r1(r() * H)}" r="${r1(rMin + r() * (rMax - rMin))}" fill="${colours[i % colours.length]}"/>`);

const petal = (x, y, s, rot, fill, i) =>
  `<g class="fs-fall" style="animation-delay:${r1(-i * 0.37 * (14 + (i % 5) * 2) % (14 + (i % 5) * 2))}s;animation-duration:${14 + (i % 5) * 2}s"><path transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" d="M0-10C6-10 9-4 0 10C-9-4-6-10 0-10Z" fill="${fill}"/></g>`;

const petals = (seed, n, colours) => scatter(seed, n, (r, i) =>
  petal(r1(r() * W), r1(-r() * 80), r1(r() * 0.6 + 0.7), Math.round(r() * 360), colours[i % colours.length], i));

const arches = (stroke) => {
  let p = '';
  for (let row = 0; row < 8; row++) for (let col = 0; col < 16; col++) {
    const x = col * 96 + (row % 2 ? 48 : 0) - 40, y = row * 120 - 20;
    p += `<path d="M${x} ${y + 96}V${y + 38}a30 30 0 0 1 60 0V${y + 96}" />`;
  }
  return `<g fill="none" stroke="${stroke}" stroke-width="1">${p}</g>`;
};

const leaves = (fill) => {
  const leaf = (x, y, s, rot) => `<path transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" d="M0 0C30-26 74-24 100 0C74 24 30 26 0 0Z"/>`;
  // a sprig at each corner of the phone column and of the wide window
  const sprig = (x, y, flip) => leaf(x, y, 1.2, flip ? 200 : 20) + leaf(x, y + 70, 0.9, flip ? 165 : -15);
  return `<g fill="${fill}">${sprig(490, 90)}${sprig(950, 700, true)}${sprig(500, 760)}${sprig(940, 60, true)}${sprig(-20, 300)}${sprig(1460, 520, true)}</g>`;
};

const waves = (stroke) => {
  let p = '';
  for (let i = 0; i < 9; i++) {
    const y = 580 + i * 34, a = 6 + i;
    p += `<path class="fs-drift" style="animation-delay:${-i * 0.6}s" d="M-60 ${y}q48 ${-a} 96 0${' t96 0'.repeat(16)}" />`;
  }
  return `<g fill="none" stroke="${stroke}" stroke-width="1.4" stroke-linecap="round">${p}</g>`;
};

/** name (Arabic, shown in pickers), field colour (also the swatch), light|dark, motif */
export const FLAT_SCENES = {
  silk: {
    name: 'وردي حريري', field: '#F3E4DD', tone: 'light',
    motif: () => `<circle cx="520" cy="150" r="220" fill="#EBCFC4" opacity=".55"/><circle cx="930" cy="760" r="250" fill="#EBCFC4" opacity=".45"/><circle cx="900" cy="190" r="80" fill="#F9EEE9"/><circle cx="160" cy="620" r="180" fill="#EBCFC4" opacity=".35"/><circle cx="1300" cy="220" r="160" fill="#EBCFC4" opacity=".35"/>`,
  },
  palace: {
    name: 'أقواس ذهبية', field: '#EDE1C9', tone: 'warm',
    motif: () => arches('#D6BC8C'),
  },
  marble: {
    name: 'عاجي', field: '#F6F1E8', tone: 'light',
    motif: () => dots(5, 520, ['#E4DACA', '#EDE5D8'], 0.6, 1.6),
  },
  petals: {
    name: 'بتلات', field: '#F3EAF6', tone: 'light',
    motif: () => petals(9, 44, ['#E7C6DD', '#F2D7E3', '#FFFFFF', '#DDBDE0']),
  },
  candlelit: {
    name: 'عنّابي دافئ', field: '#35181D', tone: 'dark',
    motif: () => `<circle cx="${CX}" cy="400" r="420" fill="#5A262A" opacity=".6"/><circle cx="${CX}" cy="400" r="230" fill="#7A3536" opacity=".5"/>${stars(3, 70, '#F6C98B')}`,
  },
  desert: {
    name: 'غروب', field: '#F2C9AE', tone: 'warm',
    motif: () => `<circle cx="850" cy="116" r="40" fill="#FBE3CB"/><rect y="580" width="${W}" height="${H - 580}" fill="#E8A889"/><rect y="700" width="${W}" height="${H - 700}" fill="#D98E73"/>`,
  },
  clay: {
    name: 'نقاط ملوّنة', field: '#F8DCE8', tone: 'light',
    motif: () => dots(14, 110, ['#FFC5D8', '#C9E4FF', '#D6EEC4', '#FFE1B5', '#FFF3C9'], 5, 11),
  },
  starry: {
    name: 'كحلي ونجوم', field: '#141C44', tone: 'dark',
    motif: () => `${stars(11, 200, '#E8E4FF')}<circle cx="860" cy="104" r="28" fill="#F4EBD0"/><circle cx="872" cy="97" r="25" fill="#141C44"/>`,
  },
  garden: {
    name: 'أخضر الليل', field: '#18291F', tone: 'dark',
    motif: () => `${leaves('#24402F')}${scatter(17, 36, (r) => `<circle class="fs-tw" cx="${r1(r() * W)}" cy="${r1(r() * H * 0.8 + 60)}" r="2" fill="#E9E39A" style="animation-delay:${r1(-r() * 5)}s"/>`)}`,
  },
  sea: {
    name: 'أزرق البحر', field: '#1B2A55', tone: 'dark',
    motif: () => `<circle cx="830" cy="110" r="34" fill="#EDE6CF"/>${waves('#3D5492')}`,
  },
};

export const SCENE_IDS = Object.keys(FLAT_SCENES);

/** the backdrop as markup; it fills whatever box it is placed in */
export function flatSceneHtml(id) {
  const s = FLAT_SCENES[id] || FLAT_SCENES.marble;
  return `<div class="fs fs-${s.tone}" data-scene="${id in FLAT_SCENES ? id : 'marble'}" style="background:${s.field}" aria-hidden="true">`
    + `<svg class="fs-motif" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMin slice" focusable="false">${s.motif()}</svg></div>`;
}
