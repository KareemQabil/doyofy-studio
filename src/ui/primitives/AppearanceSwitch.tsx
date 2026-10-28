/** Platform appearance: light · dark · follow the device. Saved with the organizer's settings; never touches the invitation. */
import { usePrototype } from '../../app/data';
import { APPEARANCE_LABEL, useAppearance, type Appearance } from '../../app/review';
import { Segmented } from './Segmented';
import { Icon } from '../icons';
import { flushSync } from 'react-dom';
import type { MouseEvent } from 'react';

const ICON = { light: 'sun', dark: 'moon', system: 'device' } as const;

export function AppearanceSwitch({ className = '' }: { className?: string }) {
  const proto = usePrototype();
  const { appearance } = useAppearance();
  return (
    <div className={`appearance-switch ${className}`}>
      <p className="appearance-label" id="appearance-label">مظهر المنصة</p>
      <Segmented size="sm" label="مظهر المنصة" value={appearance} onChange={(v: Appearance) => proto.update({ appearance: v })}
        options={(Object.keys(APPEARANCE_LABEL) as Appearance[]).map((v) => ({ value: v, label: APPEARANCE_LABEL[v], icon: ICON[v] }))} />
    </div>
  );
}

/** One tap between light and dark from the header. The new appearance spreads as a circle from the button
 *  (View Transitions where the browser has them; an instant switch otherwise and under reduced motion). */
export function AppearanceToggle({ className = '' }: { className?: string }) {
  const proto = usePrototype();
  const { resolved } = useAppearance();
  const next: Appearance = resolved === 'dark' ? 'light' : 'dark';
  const label = next === 'dark' ? 'المظهر الداكن' : 'المظهر الفاتح';
  const toggle = (e: MouseEvent<HTMLButtonElement>) => {
    const root = document.documentElement;
    const apply = () => flushSync(() => { root.dataset.appearance = next; root.style.colorScheme = next; proto.update({ appearance: next }); });
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } };
    const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!doc.startViewTransition || still) { apply(); return; }
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.dataset.vt = 'appearance';
    const t = doc.startViewTransition(apply);
    t.ready.then(() => root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
      { duration: 520, easing: 'cubic-bezier(.2,.7,.2,1)', pseudoElement: '::view-transition-new(root)' })).catch(() => {});
    t.finished.finally(() => { delete root.dataset.vt; });
  };
  return (
    <button type="button" className={`btn btn-ghost btn-md btn-icon appearance-toggle ${className}`} aria-label={label} title={label} onClick={toggle}>
      <Icon name={resolved === 'dark' ? 'sun' : 'moon'} size="sm" />
    </button>
  );
}
