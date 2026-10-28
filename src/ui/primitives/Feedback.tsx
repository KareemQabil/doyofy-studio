/** Status & feedback: badges, banners, empty/error/loading states, toasts. Tones map to tokens in CSS. */
import { Lottie } from './Lottie';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import type { Tone } from '../../domain/types';
import { Icon, type IconName } from '../icons';
import { JourneyArtwork, type JourneyArtKind } from './JourneyArtwork';
import { Button } from './Button';

export function Badge({ tone = 'neutral', children, icon, dot, title }: { tone?: Tone; children: ReactNode; icon?: IconName; dot?: boolean; title?: string }) {
  return (
    <span className={`badge tone-${tone}`} title={title}>
      {dot && <span className="badge-dot" aria-hidden="true" />}
      {icon && <Icon name={icon} size="sm" />}
      {children}
    </span>
  );
}

const TONE_ICON: Record<Tone, IconName> = { neutral: 'info', info: 'info', success: 'check-circle', warning: 'alert', danger: 'alert', accent: 'sparkle' };

export function Banner({ tone = 'info', title, children, action, icon, compact }: { tone?: Tone; title?: ReactNode; children?: ReactNode; action?: ReactNode; icon?: IconName; compact?: boolean }) {
  return (
    <div className={`banner tone-${tone}${compact ? ' banner-compact' : ''}`} role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}>
      <Icon name={icon ?? TONE_ICON[tone]} className="banner-icon" />
      <div className="banner-text">
        {title && <p className="banner-title">{title}</p>}
        {children && <div className="banner-body">{children}</div>}
      </div>
      {action && <div className="banner-action">{action}</div>}
    </div>
  );
}

export function EmptyState({ icon = 'sparkle', title, children, action, compact, artwork }: { icon?: IconName; title: ReactNode; children?: ReactNode; action?: ReactNode; compact?: boolean; artwork?: JourneyArtKind }) {
  return (
    <div className={`empty${compact ? ' empty-compact' : ''}`}>
      <JourneyArtwork kind={artwork ?? ({users: 'guests', search: 'search', table: 'seating', door: 'reception', envelope: 'reply', heart: 'celebrate', 'check-circle': 'celebrate', alert: 'offline', upload: 'upload'} as Partial<Record<IconName,JourneyArtKind>>)[icon] ?? 'invitation'} />
      <h2 className="empty-title">{title}</h2>
      {children && <div className="empty-body">{children}</div>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'تعذر تحميل البيانات' }: { error: unknown; onRetry?: () => void; title?: string }) {
  const msg = error instanceof Error ? error.message : 'حدث خطأ غير متوقع.';
  return (
    <div className="empty empty-error" role="alert">
      <JourneyArtwork kind="offline" />
      <h2 className="empty-title">{title}</h2>
      <div className="empty-body">{msg}</div>
      {onRetry && <div className="empty-action"><Button icon="refresh" onClick={onRetry}>أعد المحاولة</Button></div>}
    </div>
  );
}

export function Skeleton({ lines = 3, block }: { lines?: number; block?: boolean }) {
  return (
    <div className="skeleton" aria-busy="true" aria-label="جارٍ التحميل">
      {block && <div className="skel skel-block" />}
      {Array.from({ length: lines }, (_, i) => <div key={i} className="skel skel-line" style={{ width: `${92 - ((i * 17) % 40)}%` }} />)}
    </div>
  );
}

/** a standalone loading mark (the brand Lottie); buttons keep their own small inline spinner */
export function Spinner({ label = 'جارٍ التحميل', size = 56 }: { label?: string; size?: number }) {
  return <span className="spinner-lottie" role="status" aria-label={label}><Lottie name="loader" size={size} /></span>;
}

// ------------------------------------------------------------------ toasts
/** `celebrate`: a milestone (publish, first guest in): the success seal also plays large in the middle of the screen */
interface Toast { id: number; tone: Tone; text: ReactNode; action?: { label: string; run: () => void }; celebrate?: boolean }
const ToastCtx = createContext<(t: Omit<Toast, 'id'>) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [burst, setBurst] = useState<number | null>(null);
  const n = useRef(0);
  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++n.current;
    setToasts((x) => [...x.slice(-2), { ...t, id }]);
    if (t.celebrate) setBurst(id);
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), t.action ? 7000 : 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`toast tone-${t.tone}`} role="status">
            {t.tone === 'success' ? <Lottie name="success" size={28} className="toast-seal" /> : <Icon name={TONE_ICON[t.tone]} size="sm" />}
            <span className="grow">{t.text}</span>
            {t.action && <button type="button" className="toast-action" onClick={() => { t.action!.run(); setToasts((x) => x.filter((y) => y.id !== t.id)); }}>{t.action.label}</button>}
          </div>
        ))}
      </div>
      {burst !== null && <div key={burst} className="celebrate-burst" aria-hidden="true"><Lottie name="success" size={168} onDone={() => setBurst(null)} /></div>}
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
