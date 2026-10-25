/**
 * WebGL render mode: a full-layer fragment-shader canvas with DPR cap, render-scale for
 * mobile, pause-when-hidden, resize handling and proper context disposal.
 *
 *   const gl = createShaderLayer(m, { layer: 'background', frag, uniforms: { uTint: [1,0,0] } })
 *   gl.ok === false  → WebGL unavailable (caller shows its CSS fallback)
 */
const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';

export function createShaderLayer(m, { layer = 'background', frag, uniforms = {}, scale } = {}) {
  const canvas = document.createElement('canvas');
  canvas.className = 'xp-gl';
  m.stage.layers[layer].append(canvas);
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
  if (!gl) { canvas.remove(); return { ok: false, destroy() {} }; }
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) { console.warn('[webgl] shader failed, using fallback', e); canvas.remove(); return { ok: false, destroy() {} }; }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(prog, n);
  const uRes = U('uRes'), uTime = U('uTime'), uMouse = U('uMouse');
  const renderScale = scale ?? (m.quality.level === 'high' ? 0.75 : 0.5);
  const set = (name, v) => { const l = U(name); if (!l) return; if (Array.isArray(v)) gl[`uniform${v.length}fv`](l, v); else gl.uniform1f(l, v); };
  Object.entries(uniforms).forEach(([k, v]) => set(k, v));

  let frame = () => {};
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, m.quality.dprCap) * renderScale;
    canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    frame(); // resizing clears the drawing buffer: redraw (matters when the loop is paused for reduced motion)
  };
  resize();
  const ro = new ResizeObserver(resize); ro.observe(canvas);
  let t0 = performance.now();
  frame = () => {
    const root = m.stage.root.style;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, m.quality.reducedMotion ? 4 : (performance.now() - t0) / 1000);
    if (uMouse) gl.uniform2f(uMouse, Number(root.getPropertyValue('--px')) || 0, Number(root.getPropertyValue('--py')) || 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const stop = m.loop(() => { if (!document.hidden) frame(); return !m.quality.reducedMotion; });
  frame();
  return {
    ok: true, canvas, set,
    destroy() { stop(); ro.disconnect(); gl.deleteBuffer(buf); gl.deleteProgram(prog); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); },
  };
}
