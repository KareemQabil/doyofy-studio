/**
 * Entry code that a guest shows at the door. Tap it to fill the screen (large, black on white, nothing
 * else around it) so the reception scanner reads it quickly; swipe down, tap or Escape to return.
 * The page cannot raise screen brightness itself, so the overlay says so instead of pretending.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { QrCode } from './QrCode';
import { Icon } from '../../ui';
import { usePointerGesture } from '../../ui/hooks/usePointerGesture';
import { shouldDismiss } from '../../domain/gestures';
import { haptic } from '../../ui/motion/motion';

export function QrFullscreen({ value, code, name, title }: { value: string; code: string; name: string; title: string }) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => { setOpen(false); requestAnimationFrame(() => trigger.current?.focus()); };
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', key);
    document.documentElement.classList.add('has-dialog');
    panel.current?.querySelector<HTMLButtonElement>('.qrfs-close')?.focus();
    return () => { document.removeEventListener('keydown', key); document.documentElement.classList.remove('has-dialog'); };
  }, [open]);
  const swipe = usePointerGesture({
    axis: 'y', enabled: open,
    onMove: (dy) => { panel.current?.style.setProperty('--qr-drag', `${Math.max(0, dy)}px`); panel.current?.setAttribute('data-dragging', ''); },
    onEnd: (g) => { panel.current?.removeAttribute('data-dragging'); panel.current?.style.removeProperty('--qr-drag'); if (!g.cancelled && g.moved && shouldDismiss(g.dy, g.velocity)) close(); },
  });
  return (
    <>
      <button ref={trigger} type="button" className="qrfs-trigger v2-press" onClick={() => { haptic('tick'); setOpen(true); }} aria-label={`كبّر رمز الدخول لـ${name}`}>
        <QrCode value={value} size={196} label={`رمز QR لدخول ${name}`} />
        <span className="qrfs-hint"><Icon name="expand" size="sm" />اضغط لتكبيره عند الباب</span>
      </button>
      {open && createPortal(
        <div ref={panel} className="qrfs" role="dialog" aria-modal="true" aria-label="رمز الدخول بحجم كبير" {...swipe} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <p className="qrfs-title">{title}</p>
          <p className="qrfs-name"><bdi>{name}</bdi></p>
          <QrCode value={value} size={Math.min(320, Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.78))} label={`رمز QR لدخول ${name}`} />
          <p className="qrfs-code num" dir="ltr">{code}</p>
          <p className="qrfs-tip">ارفع إضاءة الشاشة إن لزم · اسحب لأسفل للرجوع</p>
          <button type="button" className="qrfs-close" onClick={close}><Icon name="close" size="sm" />رجوع</button>
        </div>, document.body)}
    </>
  );
}
