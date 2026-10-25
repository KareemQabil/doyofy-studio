/**
 * Segmented control / tabs with a moving indicator (the indicator explains where the selection went).
 * role="tablist" when it switches panels (`panels`), radiogroup-like buttons otherwise.
 * Keyboard (tabs): ←/→ follow the reading direction (RTL: ← = next), Home/End.
 */
import { useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { Icon, type IconName } from '../icons';

export function Segmented<T extends string>({ label, value, options, onChange, panels, size = 'md', className = '' }: {
  label: string; value: T; options: Array<{ value: T; label: ReactNode; icon?: IconName }>; onChange: (v: T) => void;
  /** id prefix → tabs control panels `${panels}-${value}` */
  panels?: string; size?: 'md' | 'sm'; className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const r = root.current;
    const on = r?.querySelector<HTMLElement>('[data-on="true"]');
    if (!r || !on) return;
    const place = () => {
      r.style.setProperty('--seg-x', `${on.offsetLeft}px`);
      r.style.setProperty('--seg-w', `${on.offsetWidth}px`);
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(r);
    return () => ro.disconnect();
  }, [value, options.length]);

  const onKey = (e: KeyboardEvent) => {
    const i = options.findIndex((o) => o.value === value);
    const go = (n: number) => { const o = options[(n + options.length) % options.length]!; onChange(o.value); requestAnimationFrame(() => root.current?.querySelector<HTMLElement>('[data-on="true"]')?.focus()); };
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(i + 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(i - 1); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(options.length - 1); }
  };

  return (
    <div ref={root} className={`seg seg-${size} ${className}`} role={panels ? 'tablist' : 'group'} aria-label={label} onKeyDown={onKey}>
      <span className="seg-ind" aria-hidden="true" />
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} type="button" className="seg-btn" data-on={on}
            role={panels ? 'tab' : undefined} aria-selected={panels ? on : undefined} aria-pressed={panels ? undefined : on}
            aria-controls={panels ? `${panels}-${o.value}` : undefined} id={panels ? `${panels}-tab-${o.value}` : undefined}
            tabIndex={panels && !on ? -1 : 0} onClick={() => onChange(o.value)}>
            {o.icon && <Icon name={o.icon} size="sm" />}<span className="seg-label">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
