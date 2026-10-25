// Procedural botanical SVG authoring. Every asset is generated from a seed so it can be
// re-rendered at any resolution, restyled, or regenerated as a variation.
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const r2 = (n) => Math.round(n * 100) / 100;

function bezier(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
  const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
  const dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
  const dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
  return { x, y, a: Math.atan2(dy, dx) };
}

const leafPath = (L, W) => `M0 0 C${r2(L * 0.22)} ${r2(-W)} ${r2(L * 0.68)} ${r2(-W * 0.95)} ${r2(L)} 0 C${r2(L * 0.68)} ${r2(W * 0.95)} ${r2(L * 0.22)} ${r2(W)} 0 0Z`;

/**
 * Olive branch.
 * style: 'natural' (painted, soft shading) | 'engraving' (fine ink line art for the card)
 */
export function oliveBranch({ w = 900, h = 700, seed = 3, base = [60, 620], tip = [840, 120], bend = 0.25,
  leaves = 26, leafLen = 92, leafW = 13, fruits = 3, style = 'natural', twigs = 2, palette = {} } = {}) {
  const R = rng(seed);
  const P = {
    top1: palette.top1 || '#6E765A', top2: palette.top2 || '#9CA383', under1: palette.under1 || '#A9AE98', under2: palette.under2 || '#D3D6C6',
    stem: palette.stem || '#6A5E48', ink: palette.ink || '#4F533D', paperFill: palette.paperFill || '#F1F0E6', fruit: palette.fruit || '#3F4127',
  };
  const dx = tip[0] - base[0], dy = tip[1] - base[1];
  const nx = -dy, ny = dx;
  const p1 = [base[0] + dx * 0.33 + nx * bend * 0.6, base[1] + dy * 0.33 + ny * bend * 0.6];
  const p2 = [base[0] + dx * 0.7 + nx * bend * 0.35, base[1] + dy * 0.7 + ny * bend * 0.35];
  const stem = [base, p1, p2, tip];
  const els = [];
  const defs = [];
  if (style === 'natural') {
    defs.push(`<linearGradient id="lt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.top1}"/><stop offset=".5" stop-color="${P.top2}"/><stop offset="1" stop-color="${P.top1}"/></linearGradient>`);
    defs.push(`<linearGradient id="lu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.under1}"/><stop offset=".5" stop-color="${P.under2}"/><stop offset="1" stop-color="${P.under1}"/></linearGradient>`);
    defs.push(`<radialGradient id="fr" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#8A8A5A"/><stop offset=".45" stop-color="${P.fruit}"/><stop offset="1" stop-color="#23241A"/></radialGradient>`);
  }
  const stemD = `M${stem[0]} C${stem[1].map(r2)} ${stem[2].map(r2)} ${stem[3]}`;
  const stemW = style === 'natural' ? 5 : 1.6;
  els.push(style === 'natural'
    ? `<path d="${stemD}" fill="none" stroke="${P.stem}" stroke-width="${stemW}" stroke-linecap="round"/>`
    : `<path d="${stemD}" fill="none" stroke="${P.ink}" stroke-width="${stemW}" stroke-linecap="round"/>`);

  const leafEls = [];
  const addLeaf = (x, y, ang, len, wid) => {
    const under = R() < 0.35;
    const d = leafPath(len, wid);
    const t = `translate(${r2(x)} ${r2(y)}) rotate(${r2(ang * 180 / Math.PI)})`;
    if (style === 'natural') {
      leafEls.push(`<g transform="${t}"><path d="${d}" fill="url(#${under ? 'lu' : 'lt'})"/><path d="M${r2(len * 0.04)} 0 Q${r2(len * 0.5)} ${r2(wid * 0.08)} ${r2(len * 0.93)} 0" fill="none" stroke="${under ? '#E4E6D9' : '#B7BC9E'}" stroke-width="0.9" opacity=".8"/></g>`);
    } else {
      let hatch = '';
      for (let k = 0; k < 4; k++) {
        const hx = len * (0.25 + k * 0.15);
        hatch += `<path d="M${r2(hx)} ${r2(wid * 0.15)} l${r2(len * 0.06)} ${r2(wid * 0.45)}" stroke="${P.ink}" stroke-width=".6" opacity=".55"/>`;
      }
      leafEls.push(`<g transform="${t}"><path d="${d}" fill="${P.paperFill}" stroke="${P.ink}" stroke-width="1.05" stroke-linejoin="round"/><path d="M${r2(len * 0.05)} 0 L${r2(len * 0.9)} 0" stroke="${P.ink}" stroke-width=".7"/>${hatch}</g>`);
    }
  };
  for (let i = 0; i < leaves; i++) {
    const t = 0.06 + (i / leaves) * 0.92 + (R() - 0.5) * 0.02;
    const p = bezier(...stem, Math.min(0.995, t));
    const side = i % 2 === 0 ? 1 : -1;
    const ang = p.a + side * (0.5 + R() * 0.45) * (1 - t * 0.35);
    const s = 1 - t * 0.42 + (R() - 0.5) * 0.15;
    addLeaf(p.x, p.y, ang, leafLen * s, leafW * s);
  }
  // tip leaves
  const pt = bezier(...stem, 1);
  addLeaf(pt.x, pt.y, pt.a + 0.12, leafLen * 0.55, leafW * 0.55);
  addLeaf(pt.x, pt.y, pt.a - 0.25, leafLen * 0.45, leafW * 0.5);

  // twigs
  for (let k = 0; k < twigs; k++) {
    const t = 0.25 + k * 0.28 + R() * 0.08;
    const p = bezier(...stem, t);
    const side = k % 2 ? 1 : -1;
    const a = p.a + side * (0.7 + R() * 0.3);
    const L = 110 + R() * 70;
    const ex = p.x + Math.cos(a) * L, ey = p.y + Math.sin(a) * L;
    const cx = p.x + Math.cos(a - side * 0.25) * L * 0.5, cy = p.y + Math.sin(a - side * 0.25) * L * 0.5;
    els.push(`<path d="M${r2(p.x)} ${r2(p.y)} Q${r2(cx)} ${r2(cy)} ${r2(ex)} ${r2(ey)}" fill="none" stroke="${style === 'natural' ? P.stem : P.ink}" stroke-width="${style === 'natural' ? 2.6 : 1.1}" stroke-linecap="round"/>`);
    for (let j = 0; j < 5; j++) {
      const tt = 0.2 + j * 0.18;
      const qx = (1 - tt) * (1 - tt) * p.x + 2 * (1 - tt) * tt * cx + tt * tt * ex;
      const qy = (1 - tt) * (1 - tt) * p.y + 2 * (1 - tt) * tt * cy + tt * tt * ey;
      addLeaf(qx, qy, a + (j % 2 ? 1 : -1) * (0.55 + R() * 0.3), leafLen * (0.62 - j * 0.05), leafW * (0.62 - j * 0.05));
    }
    addLeaf(ex, ey, a, leafLen * 0.4, leafW * 0.45);
  }
  els.push(...leafEls);
  // fruits
  for (let f = 0; f < fruits; f++) {
    const p = bezier(...stem, 0.3 + f * 0.17 + R() * 0.05);
    const side = f % 2 ? 1 : -1;
    const fx = p.x + Math.cos(p.a + side * 1.4) * 16, fy = p.y + Math.sin(p.a + side * 1.4) * 16;
    if (style === 'natural') {
      els.push(`<path d="M${r2(p.x)} ${r2(p.y)} L${r2(fx)} ${r2(fy)}" stroke="${P.stem}" stroke-width="1.4"/><ellipse cx="${r2(fx)}" cy="${r2(fy)}" rx="7.5" ry="10" transform="rotate(${r2(p.a * 57.3 + side * 80)} ${r2(fx)} ${r2(fy)})" fill="url(#fr)"/><ellipse cx="${r2(fx - 2)}" cy="${r2(fy - 3)}" rx="2" ry="3" fill="#fff" opacity=".35"/>`);
    } else {
      els.push(`<path d="M${r2(p.x)} ${r2(p.y)} L${r2(fx)} ${r2(fy)}" stroke="${P.ink}" stroke-width=".9"/><ellipse cx="${r2(fx)}" cy="${r2(fy)}" rx="5.5" ry="7.5" transform="rotate(${r2(p.a * 57.3 + side * 80)} ${r2(fx)} ${r2(fy)})" fill="${P.paperFill}" stroke="${P.ink}" stroke-width="1"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs.join('')}</defs>${els.join('')}</svg>`;
}

/** Palm frond silhouette (used to cast soft leaf shadows in the sunlight video). */
export function palmFrondPath({ seed = 5, len = 520, leaflets = 34, spread = 150 } = {}) {
  const R = rng(seed);
  let d = `M0 0 Q${len * 0.5} ${-len * 0.08} ${len} ${len * 0.05}`;
  const parts = [];
  for (let i = 0; i < leaflets; i++) {
    const t = 0.08 + (i / leaflets) * 0.9;
    const x = len * t, y = -len * 0.08 * 4 * t * (1 - t) * 0.5 + len * 0.05 * t * t;
    for (const side of [-1, 1]) {
      const L = spread * (1 - Math.abs(t - 0.45) * 1.2) * (0.8 + R() * 0.3);
      const a = side * (0.9 + R() * 0.25) + 0.35;
      const ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L;
      const w = 13 + R() * 8;
      parts.push(`M${r2(x)} ${r2(y)} Q${r2((x + ex) / 2 + w)} ${r2((y + ey) / 2 - w)} ${r2(ex)} ${r2(ey)} Q${r2((x + ex) / 2 - w)} ${r2((y + ey) / 2 + w)} ${r2(x)} ${r2(y)}Z`);
    }
  }
  return { rachis: d, leaflets: parts.join(' ') };
}

/** Ceramic vase with dried pampas grass. */
export function pampasVase({ w = 520, h = 900, seed = 9 } = {}) {
  const R = rng(seed);
  const cx = w / 2;
  const vaseTop = h - 330;
  const plumes = [];
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i - 4) * 0.16 + (R() - 0.5) * 0.08;
    const L = 380 + R() * 180;
    const bx = cx + (R() - 0.5) * 20, by = vaseTop + 20;
    const ex = bx + Math.cos(a) * L, ey = by + Math.sin(a) * L;
    const mx = bx + Math.cos(a) * L * 0.5 + (i - 4) * 8, my = by + Math.sin(a) * L * 0.5;
    plumes.push(`<path d="M${r2(bx)} ${r2(by)} Q${r2(mx)} ${r2(my)} ${r2(ex)} ${r2(ey)}" stroke="#A89274" stroke-width="2.2" fill="none"/>`);
    // feathery plume along the last 45% of the stem
    const fluff = [];
    for (let k = 0; k < 170; k++) {
      const t = 0.5 + (k / 170) * 0.5;
      const qx = (1 - t) * (1 - t) * bx + 2 * (1 - t) * t * mx + t * t * ex;
      const qy = (1 - t) * (1 - t) * by + 2 * (1 - t) * t * my + t * t * ey;
      const fl = 46 * Math.sin(Math.PI * (t - 0.5) / 0.5) + 8;
      const fa = a + (k % 2 ? 1 : -1) * (0.25 + R() * 0.45);
      fluff.push(`<path d="M${r2(qx)} ${r2(qy)} q${r2(Math.cos(fa) * fl * 0.5)} ${r2(Math.sin(fa) * fl * 0.5 - 4)} ${r2(Math.cos(fa) * fl)} ${r2(Math.sin(fa) * fl)}" stroke="${k % 3 ? '#EADFCB' : '#D6C4A6'}" stroke-width="1.8" stroke-linecap="round" fill="none" opacity=".85"/>`);
    }
    plumes.push(`<g filter="url(#fl)">${fluff.join('')}</g>`);
  }
  const vase = `M${cx - 70} ${vaseTop} C${cx - 72} ${vaseTop + 40} ${cx - 140} ${vaseTop + 90} ${cx - 140} ${vaseTop + 190} C${cx - 140} ${vaseTop + 280} ${cx - 90} ${h - 12} ${cx} ${h - 12} C${cx + 90} ${h - 12} ${cx + 140} ${vaseTop + 280} ${cx + 140} ${vaseTop + 190} C${cx + 140} ${vaseTop + 90} ${cx + 72} ${vaseTop + 40} ${cx + 70} ${vaseTop}Z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>
<filter id="fl" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.1"/></filter>
<linearGradient id="vg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B9A488"/><stop offset=".32" stop-color="#E9DCC8"/><stop offset=".55" stop-color="#DCCBB2"/><stop offset="1" stop-color="#9C8669"/></linearGradient>
<radialGradient id="vs" cx="50%" cy="100%" r="60%"><stop offset="0" stop-color="#6B5840" stop-opacity=".35"/><stop offset="1" stop-color="#6B5840" stop-opacity="0"/></radialGradient>
<filter id="spk"><feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="1" seed="4"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .28  0 0 0 0 .2  0 0 0 -2.2 1.05"/><feComposite in2="SourceGraphic" operator="in"/></filter>
</defs>${plumes.join('')}<path d="${vase}" fill="url(#vg)"/><path d="${vase}" fill="url(#vs)"/><path d="${vase}" filter="url(#spk)" opacity=".35"/><ellipse cx="${cx}" cy="${vaseTop}" rx="70" ry="10" fill="#8E7A5F"/><ellipse cx="${cx}" cy="${vaseTop - 1}" rx="62" ry="7" fill="#5E4E3A"/></svg>`;
}

/** Architectural card frame: thin double rule with an arched head (vector, recolourable). */
export function cardFrame({ w = 1000, h = 1400, ink = '#5B5E45', inset = 46 } = {}) {
  const i1 = inset, i2 = inset + 14;
  const arch = (i) => { const r = (w - 2 * i) / 2; return `M${i} ${h - i} V${i + r} A${r} ${r} 0 0 1 ${w - i} ${i + r} V${h - i}Z`; };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="none"><g fill="none" stroke="${ink}" vector-effect="non-scaling-stroke"><path d="${arch(i1)}" stroke-width="2" opacity=".9"/><path d="${arch(i2)}" stroke-width="1" opacity=".55"/></g><g fill="${ink}"><circle cx="${w / 2}" cy="${i1}" r="5"/><circle cx="${w / 2}" cy="${h - i1}" r="3.5"/></g></svg>`;
}

/** A lush cluster of several olive branches radiating from one anchor (foreground framing). */
export function oliveCluster({ w = 1400, h = 1200, anchor = [1380, 1180], arms = [], seed = 1, leafLen = 150, leafW = 21 } = {}) {
  const parts = arms.map((tip, i) => oliveBranch({ w, h, seed: seed + i * 7, base: anchor, tip, bend: (i % 2 ? 0.2 : -0.2) * (1 + i * 0.1),
    leaves: 38, leafLen: leafLen * (1 - i * 0.08), leafW: leafW * (1 - i * 0.06), fruits: i === 0 ? 4 : 2, twigs: 3 }));
  const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.map(inner).join('')}</svg>`;
}
