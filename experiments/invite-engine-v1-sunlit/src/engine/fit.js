/**
 * Responsive framing. The card box is always computed from the real viewport and the
 * card's aspect ratio, leaving safe room for the top controls and the bottom hint/nav.
 * It is the single source of truth for camera framing: cameras animate *towards* this box,
 * so the resting card is guaranteed to be fully inside the viewport on any screen.
 */
export function fitCard({ vw, vh, aspect }) {
  const mobile = vw < 700;
  const short = vh < 700;
  const safe = mobile
    ? { t: 70, b: 96, l: 22, r: 22 }
    : { t: short ? 58 : 76, b: short ? 78 : 104, l: 48, r: 48 };
  const availW = Math.max(120, vw - safe.l - safe.r);
  const availH = Math.max(160, vh - safe.t - safe.b);
  // leave breathing room for the environment: the card is the subject, not the whole frame
  let h = Math.min(availH * (mobile ? 0.9 : 0.9), (availW * (mobile ? 0.84 : 1)) / aspect, 780);
  const w = h * aspect;
  const x = (vw - w) / 2;
  const y = safe.t + (availH - h) / 2;
  return { w, h, x, y, vw, vh, safe, mobile, short, cx: x + w / 2, cy: y + h / 2 };
}

/**
 * Transform that moves `rect` (the card's resting box) into `target` (a region of the
 * viewport) — used by the camera to frame the card next to the pages or in the finale.
 * The camera's transform-origin is the card centre, so translation is centre-to-centre.
 */
export function frameInto(rect, target) {
  const scale = Math.min(target.w / rect.w, target.h / rect.h);
  return { scale, x: target.x + target.w / 2 - (rect.x + rect.w / 2), y: target.y + target.h / 2 - (rect.y + rect.h / 2) };
}
