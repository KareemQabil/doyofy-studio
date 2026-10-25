/** Data display primitives: panels, stats, filter chips, progress, key/value lists, overflow menu. */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { Tone } from '../../domain/types';
import { Icon, type IconName } from '../icons';

export function Panel({ title, subtitle, actions, children, padded = true, as: As = 'section', id, className = '' }: { title?: ReactNode; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode; padded?: boolean; as?: 'section' | 'div' | 'article'; id?: string; className?: string }) {
  const hid = useId();
  return (
    <As className={`panel ${className}`} aria-labelledby={title ? hid : undefined} id={id}>
      {(title || actions) && (
        <header className="panel-head">
          <div className="grow">
            {title && <h2 id={hid} className="panel-title">{title}</h2>}
            {subtitle && <p className="panel-sub">{subtitle}</p>}
          </div>
          {actions && <div className="panel-actions">{actions}</div>}
        </header>
      )}
      <div className={padded ? 'panel-body' : 'panel-body flush'}>{children}</div>
    </As>
  );
}

export function Stat({ label, value, sub, tone, emphasis }: { label: ReactNode; value: ReactNode; sub?: ReactNode; tone?: Tone; emphasis?: boolean }) {
  return (
    <div className={`stat${emphasis ? ' stat-emph' : ''}${tone ? ` tone-text-${tone}` : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value num">{value}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

export function FilterChips<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Array<{ id: T; label: string; count?: number }>; onChange: (v: T) => void }) {
  return (
    <div className="chips" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} className={`chip${value === o.id ? ' is-on' : ''}`} onClick={() => onChange(o.id)}>
          {o.label}{o.count != null && <span className="chip-count num">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function ProgressBar({ value, max, label, tone = 'primary' }: { value: number; max: number; label?: string; tone?: 'primary' | 'success' | 'warning' | 'danger' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={`progress progress-${tone}`} role="progressbar" aria-valuemin={0} aria-valuemax={Math.max(1,max)} aria-valuenow={Math.max(0,Math.min(value,Math.max(1,max)))} aria-valuetext={`${value} من ${max}`} aria-label={label}>
      <span className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function KeyValue({ items }: { items: Array<{ k: ReactNode; v: ReactNode; icon?: IconName }> }) {
  return (
    <dl className="kv">
      {items.map((it, i) => (
        <div className="kv-row" key={i}>
          <dt>{it.icon && <Icon name={it.icon} size="sm" />}{it.k}</dt>
          <dd>{it.v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** overflow menu: button + list of actions; keyboard (arrows, Escape) and click-outside */
export function Menu({ label, items, icon = 'more', triggerLabel }: { label: string; icon?: IconName; triggerLabel?: ReactNode; items: Array<{ label: string; icon?: IconName; onSelect: () => void; danger?: boolean; disabled?: boolean } | null> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const off = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', off);
    ref.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not([disabled])')?.focus();
    return () => document.removeEventListener('pointerdown', off);
  }, [open]);
  const list = items.filter(Boolean) as Array<NonNullable<(typeof items)[number]>>;
  return (
    <div className="menu" ref={ref} onKeyDown={(e) => {
      if (e.key === 'Escape') { setOpen(false); ref.current?.querySelector<HTMLButtonElement>('.menu-trigger')?.focus(); }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const els = [...(ref.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])') ?? [])];
        const i = els.indexOf(document.activeElement as HTMLButtonElement);
        els[(i + (e.key === 'ArrowDown' ? 1 : -1) + els.length) % els.length]?.focus();
      }
    }}>
      <button type="button" className={`btn btn-ghost ${triggerLabel ? 'btn-sm' : 'btn-md btn-icon'} menu-trigger`} aria-haspopup="menu" aria-expanded={open} aria-controls={id} aria-label={triggerLabel ? undefined : label} title={label} onClick={() => setOpen((v) => !v)}>
        <Icon name={icon} size="sm" />{triggerLabel && <span className="btn-label">{triggerLabel}</span>}
      </button>
      {open && (
        <div className="menu-list" role="menu" id={id} aria-label={label}>
          {list.map((it) => (
            <button key={it.label} type="button" role="menuitem" disabled={it.disabled} className={`menu-item${it.danger ? ' is-danger' : ''}`} onClick={() => { setOpen(false); it.onSelect(); }}>
              {it.icon && <Icon name={it.icon} size="sm" />}{it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Avatar({ name, tone = 'neutral' }: { name: string; tone?: Tone }) {
  const letter = [...name.replace(/^(عائلة|أم|أبو|ال)\s*/, '').trim()][0] ?? '؟';
  return <span className={`avatar tone-${tone}`} aria-hidden="true">{letter}</span>;
}
