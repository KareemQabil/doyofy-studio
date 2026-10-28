/**
 * Flat motion artwork for six faces, after the owner's «Doyofy — دعوة تتحرّك» reference (GSAP timelines).
 * Art only: every word on these faces is live text set by collection.js. Drawn in a 600×840 box and shown
 * at 300×420; colours come from CSS custom properties on the face (--paper, --ink, --accent, --soft, --leaf),
 * so a palette change needs no re-render. Groups carry the class names the timelines in card-motion.js animate
 * (.mo-arch, .mo-flower, .mo-balloon …). No ids: faces repeat on a page.
 */
function flower(x, y, s = 1, soft = false) {
  let p = '';
  for (let i = 0; i < 8; i++) p += `<ellipse cx="0" cy="-21" rx="14" ry="24" transform="rotate(${45 * i})" fill="${soft ? 'var(--soft)' : 'var(--accent)'}"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="mo-flower">${p}<circle r="12" fill="var(--paper)"/><circle r="5" fill="var(--ink)"/></g></g>`;
}
const leaf = (x, y, r = 0, s = 1) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path class="mo-leaf" d="M0 0C-45-13-54-54-38-77C-5-66 17-30 0 0Z" fill="var(--leaf)"/></g>`;
function star(x, y, r = 12, color = 'var(--accent)') {
  const pts = [];
  for (let i = 0; i < 8; i++) { const a = Math.PI * i / 4 - Math.PI / 2, k = i % 2 ? r * 0.3 : r; pts.push(`${(x + Math.cos(a) * k).toFixed(1)},${(y + Math.sin(a) * k).toFixed(1)}`); }
  return `<polygon class="mo-spark" points="${pts.join(' ')}" fill="${color}"/>`;
}
const cloud = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><g class="mo-cloud"><path d="M-82 23C-112 23-112-20-82-25C-90-73-25-86-6-45C26-73 74-45 64-15C100-16 106 23 70 23Z" fill="var(--paper)"/></g></g>`;
const lantern = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><g class="mo-lantern"><path d="M0-130V-18" stroke="var(--accent)" stroke-width="2"/><path d="M-24 0L0-20 24 0Z" fill="var(--accent)"/><path d="M-25 3H25L31 66 0 84-31 66Z" fill="var(--accent)"/><path d="M-12 10H12L17 61 0 70-17 61Z" fill="var(--paper)"/><path d="M0 13V65M-24 72H24" stroke="var(--soft)" stroke-width="3"/><circle cy="89" r="4" fill="var(--accent)"/></g></g>`;
function wreath(cy = 292) {
  let v = '';
  for (const side of [-1, 1]) {
    v += `<path class="mo-draw" d="M${300 + side * 60} ${cy + 10}Q${300 + side * 170} ${cy - 35} ${300 + side * 117} ${cy - 162}" fill="none" stroke="var(--leaf)" stroke-width="3"/>`;
    for (let n = 0; n < 7; n++) {
      const a = 1.3 + n * 0.22, x = 300 + side * (70 + Math.sin(a) * 68), y = cy - n * 23;
      v += `<g transform="translate(${x.toFixed(1)} ${y}) rotate(${side * (30 + n * 8)})"><ellipse class="mo-laurel" rx="12" ry="26" fill="var(--leaf)"/></g>`;
    }
  }
  return v;
}
const box = (art) => `<svg class="oc-layer mo-art" viewBox="0 0 600 840" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><rect class="mo-backplate" width="600" height="840" fill="var(--paper)"/>${art}</svg>`;

export const MOTION_ART = {
  /** حديقة الوعد — an arch drawn in, a garden that blooms from the corners */
  wedding: () => box(`<path class="mo-arch" d="M83 628V253A217 217 0 0 1 517 253V628Z" fill="var(--soft)" opacity=".33"/>
<path class="mo-draw" d="M57 752V279A243 243 0 0 1 543 279V752Z" fill="none" stroke="var(--leaf)" stroke-width="1.5"/>
<g><path class="mo-draw" d="M15 821Q143 680 72 497M41 779Q178 720 172 615" stroke="var(--ink)" stroke-width="3" fill="none"/>${leaf(76, 643, -18)}${leaf(76, 703, 92)}${leaf(132, 722, 29, 0.8)}${leaf(44, 749, -46)}${flower(62, 580, 1.1)}${flower(132, 694, 0.8, true)}${flower(54, 772, 0.86)}</g>
<g transform="translate(600 840) rotate(180)"><path class="mo-draw" d="M12 202Q116 135 72 27M47 170Q151 155 155 95" stroke="var(--ink)" stroke-width="3" fill="none"/>${leaf(71, 105, -20, 0.9)}${leaf(99, 157, 110, 0.8)}${flower(61, 49, 0.8, true)}${flower(153, 110, 0.7)}</g>`),
  /** مداران — two rings orbit in and meet */
  engagement: () => box(`<path class="mo-ribbon-a" d="M0 0H126L65 840H0Z" fill="var(--soft)"/><path class="mo-ribbon-b" d="M600 0H547L496 840H600Z" fill="var(--soft)" opacity=".5"/>
<circle class="mo-halo" cx="300" cy="200" r="150" fill="var(--soft)" opacity=".45"/>
<g class="mo-ring-a"><circle cx="266" cy="170" r="62" fill="none" stroke="var(--accent)" stroke-width="11"/><path d="M252 106L266 84 281 106 266 120Z" fill="var(--accent)"/></g>
<g class="mo-ring-b"><circle cx="335" cy="192" r="62" fill="none" stroke="var(--ink)" stroke-width="9" opacity=".85"/></g>
${star(420, 120, 17)}${star(186, 236, 12)}<path class="mo-draw" d="M146 252Q307 350 455 188" fill="none" stroke="var(--ink)" opacity=".4" stroke-width="1.4"/>`),
  /** يوم ملوّن — bunting, balloons that float up, confetti */
  birthday: () => {
    let confetti = '';
    for (let n = 0; n < 24; n++) {
      const x = 25 + (n * 71) % 550, y = 35 + (n * 43) % 230, co = ['var(--accent)', 'var(--soft)', 'var(--leaf)'][n % 3];
      confetti += n % 2 ? `<rect class="mo-confetti" x="${x}" y="${y}" width="7" height="15" fill="${co}" transform="rotate(${n * 17} ${x} ${y})"/>` : `<circle class="mo-confetti" cx="${x}" cy="${y}" r="5" fill="${co}"/>`;
    }
    return box(`${confetti}<g transform="translate(78 150)"><g class="mo-balloon"><path d="M0 70Q-25 125 4 187" fill="none" stroke="var(--ink)" opacity=".4"/><ellipse rx="44" ry="59" fill="var(--leaf)"/><path d="M0 57L-7 72H7Z" fill="var(--leaf)"/><ellipse cx="-16" cy="-16" rx="7" ry="17" fill="var(--paper)" opacity=".4"/></g></g>
<g transform="translate(522 210)"><g class="mo-balloon"><path d="M0 66Q25 120-5 175" fill="none" stroke="var(--ink)" opacity=".4"/><ellipse rx="43" ry="57" fill="var(--soft)"/><path d="M0 55L-7 68H7Z" fill="var(--soft)"/></g></g>
<path class="mo-draw" d="M80 0Q300 180 520 0" fill="none" stroke="var(--ink)" stroke-width="2"/>
<g class="mo-flags"><path d="M152 43L208 61 167 99Z" fill="var(--accent)"/><path d="M224 68H280L249 118Z" fill="var(--leaf)"/><path d="M304 73L359 66 339 118Z" fill="var(--soft)"/><path d="M380 57L432 38 421 95Z" fill="var(--accent)"/></g>
<g class="mo-cake" transform="translate(0 40)"><ellipse cx="300" cy="772" rx="118" ry="10" fill="var(--leaf)" opacity=".7"/><rect x="205" y="705" width="190" height="62" rx="6" fill="var(--accent)"/><path d="M205 705H395V723Q383 740 371 723Q359 740 347 723Q335 740 323 723Q311 740 299 723Q287 740 275 723Q263 740 251 723Q239 740 227 723Q215 740 205 723Z" fill="var(--paper)"/><rect x="233" y="662" width="134" height="43" rx="5" fill="var(--soft)"/><path d="M233 662H367V674H233Z" fill="var(--paper)"/>${[265, 300, 335].map((x) => `<g class="mo-candle"><path d="M${x} 632V661" stroke="var(--ink)" stroke-width="6"/><path class="mo-flame" d="M${x} 624Q${x - 14} 614 ${x} 598Q${x + 14} 614 ${x} 624Z" fill="var(--accent)"/></g>`).join('')}</g>`);
  },
  /** نحو السماء — a cap that rises inside a laurel wreath */
  graduation: () => box(`<path class="mo-panel-a" d="M0 0H600V63L0 138Z" fill="var(--soft)" opacity=".4"/><path class="mo-panel-b" d="M0 840H600V750L0 803Z" fill="var(--soft)" opacity=".4"/>
${wreath(262)}<g class="mo-cap" transform="translate(0 -40)"><path d="M224 208H377V259Q300 300 224 259Z" fill="var(--soft)"/><path d="M179 207L300 150 421 207 300 264Z" fill="var(--accent)"/><path d="M300 207L393 225V295" fill="none" stroke="var(--ink)" stroke-width="4"/><path d="M393 286L385 311H401Z" fill="var(--accent)"/></g>
${star(300, 70, 20)}${star(470, 330, 12)}${star(118, 360, 11)}`),
  /** لمّة على نور — a crescent and swaying lanterns under an arch */
  iftar: () => box(`<path class="mo-arch" d="M48 840V318C48 158 223 153 300 61C377 153 552 158 552 318V840Z" fill="var(--soft)"/>
<path class="mo-draw" d="M29 840V312C29 143 219 122 300 32C381 122 571 143 571 312V840" fill="none" stroke="var(--accent)" stroke-width="1.5"/>
<g class="mo-moon"><path d="M326 124A49 49 0 1 0 357 204A40 40 0 0 1 326 124Z" fill="var(--accent)"/></g>
${lantern(141, 167, 0.83)}${lantern(466, 197, 0.69)}${lantern(408, 111, 0.47)}${star(225, 219, 10)}${star(387, 245, 10)}${star(286, 88, 7)}`),
  /** أصغر فرحة — a moon, drifting clouds and soft hills */
  newborn: () => box(`<circle class="mo-halo" cx="300" cy="215" r="165" fill="var(--soft)" opacity=".56"/>
<g class="mo-moon"><path d="M331 75A88 88 0 1 0 390 218A72 72 0 0 1 331 75Z" fill="var(--accent)"/></g>
${star(203, 100, 16)}${star(413, 92, 11)}${star(432, 236, 13)}${star(177, 242, 12)}${cloud(114, 214, 0.72)}${cloud(479, 280, 0.6)}
<path class="mo-hill-a" d="M0 739Q166 638 327 749T600 705V840H0Z" fill="var(--soft)"/><path class="mo-hill-b" d="M0 804Q164 723 299 795T600 756V840H0Z" fill="var(--leaf)" opacity=".75"/>
${star(462, 776, 13, 'var(--paper)')}${star(137, 812, 8, 'var(--paper)')}`),
};
