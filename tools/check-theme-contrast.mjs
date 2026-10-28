// Token contrast for «توقيع» light and dark; this does not replace rendered accessibility QA (npm run gate).
//   text/action/status pairs ≥ 4.5:1 · field borders and focus rings ≥ 3:1 against the surfaces they sit on (WCAG 1.4.11)
import fs from 'node:fs';
const source = ['src/ui/styles/tokens.css', 'src/features/signature/signature.css', 'src/ui/styles/dark.css']
  .map((p) => fs.readFileSync(p, 'utf8')).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
const blocks = [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
const luminance = (hex) => {
  const c = hex.match(/^#([\da-f]{6})$/i); if (!c) throw new Error(`Expected opaque hex color: ${hex}`);
  const v = [0, 2, 4].map((i) => parseInt(c[1].slice(i, i + 2), 16) / 255).map((s) => (s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
};
const ratio = (a, b) => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const SCOPES = { light: [':root', ":root[data-theme='signature']"], dark: [':root', ":root[data-theme='signature']", ":root[data-theme][data-appearance='dark']"] };
let checked = 0;
for (const [name, scopes] of Object.entries(SCOPES)) {
  const vars = {};
  for (const scope of scopes) for (const [, selectors, body] of blocks) {
    if (!selectors.split(',').some((s) => s.trim() === scope)) continue;
    for (const [, key, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars[key] = value.trim();
  }
  const resolve = (k) => (vars[k]?.startsWith('var(') ? resolve(vars[k].slice(4, -1)) : vars[k]);
  const surfaces = ['--c-canvas', '--c-surface', '--c-surface-elevated', '--c-surface-subtle'];
  const pairs = [];
  for (const text of ['--c-text', '--c-text-2', '--c-text-3', '--c-primary-text', '--c-accent-strong']) for (const bg of surfaces) pairs.push([text, bg, 4.5]);
  pairs.push(['--c-on-primary', '--c-primary', 4.5], ['--c-on-selected', '--c-selected', 4.5]);
  for (const kind of ['success', 'danger', 'warning', 'info', 'neutral']) pairs.push([`--c-${kind}`, `--c-${kind}-soft`, 4.5]);
  for (const bg of surfaces) pairs.push(['--c-field-border', bg, 3], ['--c-focus', bg, 3]);
  for (const [fg, bg, need] of pairs) {
    const r = ratio(resolve(fg), resolve(bg));
    if (r < need) throw new Error(`${name}: ${fg} on ${bg}: ${r.toFixed(2)} < ${need}`);
    checked++;
  }
  console.log(`✔ ${name}: ${pairs.length} token pairs (text 4.5:1 · field borders and focus 3:1)`);
}
console.log(`Theme token contrast: ${checked}/${checked} passed. Not rendered accessibility QA.`);
