/** QR code as crisp SVG (Project Nayuki's encoder, vendored). */
import { useMemo } from 'react';
import { qrcodegen } from '../../vendor/qrcodegen';

export function QrCode({ value, size = 200, label }: { value: string; size?: number; label: string }) {
  const { path, n } = useMemo(() => {
    const qr = qrcodegen.QrCode.encodeText(value, qrcodegen.QrCode.Ecc.MEDIUM);
    const parts: string[] = [];
    for (let y = 0; y < qr.size; y++) for (let x = 0; x < qr.size; x++) if (qr.getModule(x, y)) parts.push(`M${x + 4},${y + 4}h1v1h-1z`);
    return { path: parts.join(''), n: qr.size + 8 };
  }, [value]);
  return (
    <svg className="qr" width={size} height={size} viewBox={`0 0 ${n} ${n}`} role="img" aria-label={label} shapeRendering="crispEdges">
      <rect className="qr-light" width={n} height={n} />
      <path className="qr-dark" d={path} />
    </svg>
  );
}
