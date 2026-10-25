/**
 * Dialog / Drawer on the native <dialog> element: focus trap, Escape, inert background and
 * top-layer stacking come from the browser. On phones both become a bottom sheet.
 */
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button, IconButton } from './Button';
import { usePointerGesture } from '../hooks/usePointerGesture';
import { shouldDismiss } from '../../domain/gestures';

export function Dialog({ open, onClose, title, description, children, footer, variant = 'modal', size = 'md', dismissible = true, labelledBy, className = '', gestureDismiss = variant === 'drawer' }: {
  open: boolean; onClose: () => void; title: ReactNode; description?: ReactNode; children?: ReactNode; footer?: ReactNode;
  variant?: 'modal' | 'drawer'; size?: 'sm' | 'md' | 'lg' | 'xl'; dismissible?: boolean; labelledBy?: string; className?: string; gestureDismiss?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const resetDrag = () => { panel.current?.style.removeProperty('--sheet-drag'); panel.current?.removeAttribute('data-dragging'); };
  const gesture = usePointerGesture({ axis:'y',enabled:open && dismissible && gestureDismiss && typeof matchMedia==='function' && matchMedia('(max-width:640px)').matches,
    onMove:delta=>{panel.current?.setAttribute('data-dragging','true');panel.current?.style.setProperty('--sheet-drag',`${Math.max(0,delta)}px`);},
    onEnd:g=>{resetDrag();if(!g.cancelled && g.moved && shouldDismiss(g.delta,g.velocity))onClose();}
  });
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const previous = document.activeElement as HTMLElement | null;
    if (open && !d.open) {
      d.showModal();
      document.documentElement.classList.add('has-dialog');
      const auto = d.querySelector<HTMLElement>('[autofocus], [data-autofocus]');
      const first = variant === 'drawer' ? null : d.querySelector<HTMLElement>('.dialog-body input:not([readonly]), .dialog-body select, .dialog-body textarea, .dialog-body button');
      (auto ?? first ?? d.querySelector<HTMLElement>('.dialog-close'))?.focus();
    } else if (!open && d.open) d.close();
    return () => {
      if (d.open) d.close();
      if (!document.querySelector('dialog[open]')) document.documentElement.classList.remove('has-dialog');
      if (open && previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onCancel = (e: Event) => { e.preventDefault(); if (dismissible) onClose(); };
    d.addEventListener('cancel', onCancel);
    return () => d.removeEventListener('cancel', onCancel);
  }, [onClose, dismissible]);
  return (
    <dialog
      ref={ref}
      className={`dialog dialog-${variant} dialog-${size} ${className}`}
      aria-labelledby={labelledBy ?? `${id}-t`}
      aria-describedby={description ? `${id}-d` : undefined}
      onClick={(e) => { if (dismissible && e.target === ref.current) onClose(); }}
    >
      {open && (
        <div ref={panel} className="dialog-panel">
          {gestureDismiss && <button type="button" className="sheet-grip" data-gesture-surface aria-label="إغلاق اللوحة" disabled={!dismissible} {...gesture} onClick={onClose}><span/></button>}
          <header className="dialog-head">
            <div className="grow">
              <h2 id={`${id}-t`} className="dialog-title">{title}</h2>
              {description && <p id={`${id}-d`} className="dialog-desc">{description}</p>}
            </div>
            {dismissible && <IconButton icon="close" label="إغلاق" onClick={onClose} className="dialog-close" />}
          </header>
          <div className="dialog-body">{children}</div>
          {footer && <footer className="dialog-foot">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}

export function ConfirmDialog({ open, title, body, confirmLabel, cancelLabel = 'تراجع', tone = 'primary', onConfirm, onCancel, loading }: {
  open: boolean; title: ReactNode; body?: ReactNode; confirmLabel: string; cancelLabel?: string; tone?: 'primary' | 'danger'; onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
  return (
    <Dialog open={open} onClose={onCancel} title={title} size="sm" dismissible={!loading}
      footer={<>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading} data-autofocus={tone === 'danger' ? undefined : true}>{confirmLabel}</Button>
        {/* destructive: start on the safe choice so a stray Enter never deletes */}
        <Button variant="ghost" onClick={onCancel} disabled={loading} data-autofocus={tone === 'danger' ? true : undefined}>{cancelLabel}</Button>
      </>}>
      {body && <div className="muted">{body}</div>}
    </Dialog>
  );
}
