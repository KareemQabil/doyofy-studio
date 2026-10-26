/**
 * Hall map (feedback F020, F023, F028, F029, F036, F042).
 *   HallMap   overview above the detailed list: round tables with their real seats filled, tap one to
 *             show its people below. The arrangement is an overview, not a measured floor plan.
 *   SeatDock  while moving a family: every table as a destination with the capacity it WOULD have
 *             (7/10 + 2 → 9/10), on a strip at the bottom of the screen where the thumb is.
 *   useLiftDrag  phones: press and hold a family to lift it, then drag it onto a table in the dock.
 *             Desktop keeps native drag-and-drop; the «نقل» button does the same by tapping.
 */
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import type { InvitationParty } from '../../domain/types';
import { checkAssign, type TableOccupancy } from '../../domain/seating';
import { seatsFor } from '../../domain/parties';
import { people } from '../../domain/format';
import { Icon } from '../../ui';
import { haptic } from '../../ui/motion/motion';

/** seat positions around a round table, first seat at the top, going clockwise */
function seatPoints(n: number, r: number) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) };
  });
}

export function TableDisc({ o, preview }: { o: TableOccupancy; preview?: number }) {
  const cap = o.table.capacity;
  const used = preview ?? o.used;
  const shown = Math.min(cap, 24);
  const pts = seatPoints(shown, 42);
  const filled = Math.round((Math.min(used, cap) / Math.max(1, cap)) * shown);
  const fresh = preview != null ? Math.round((Math.min(preview, cap) / Math.max(1, cap)) * shown) - Math.round((Math.min(o.used, cap) / Math.max(1, cap)) * shown) : 0;
  const ring = 2 * Math.PI * 30;
  return (
    <svg className="hall-disc" viewBox="0 0 100 100" aria-hidden="true">
      <circle className="hall-disc-top" cx="50" cy="50" r="30" />
      <circle className="hall-disc-ring" cx="50" cy="50" r="30" strokeDasharray={`${(Math.min(1, used / Math.max(1, cap)) * ring).toFixed(1)} ${ring.toFixed(1)}`} transform="rotate(-90 50 50)" />
      {pts.map((p, i) => <circle key={i} className={`hall-seat${i < filled - Math.max(0, fresh) ? ' is-taken' : i < filled ? ' is-new' : ''}`} cx={p.x.toFixed(2)} cy={p.y.toFixed(2)} r={shown > 16 ? 3.4 : 4.4} />)}
    </svg>
  );
}

export function HallMap({ tables, focus, onFocus, onDropParty, dragOver, onDragOverTable }: {
  tables: TableOccupancy[]; focus: string; onFocus: (id: string) => void;
  onDropParty?: (t: TableOccupancy) => (e: React.DragEvent) => void; dragOver?: string | null; onDragOverTable?: (id: string | null) => void;
}) {
  const total = tables.reduce((n, o) => n + o.table.capacity, 0), used = tables.reduce((n, o) => n + o.used, 0);
  return (
    <section className="hall seat-overview" aria-label="خريطة الطاولات وتصفية القائمة">
      <header className="hall-head">
        <div>
          <p className="hall-kicker"><Icon name="table" size="sm" />خريطة القاعة</p>
          <h2><span className="num">{used}</span> من <span className="num">{total}</span> مقعدًا مشغولة</h2>
        </div>
        <button type="button" className={`hall-all${focus === 'all' ? ' is-on' : ''}`} aria-pressed={focus === 'all'} onClick={() => onFocus('all')}>كل الطاولات</button>
      </header>
      <div className="hall-stage" aria-hidden="true"><span>المنصّة</span></div>
      <div className="hall-floor" style={{ '--hall-n': tables.length } as CSSProperties}>
        {tables.map((o, i) => (
          <button key={o.table.id} type="button" style={{ '--hall-i': i } as CSSProperties}
            className={`hall-table seat-overview-table${focus === o.table.id ? ' is-active' : ''}${o.over ? ' is-over' : o.remaining === 0 ? ' is-full' : ''}${dragOver === o.table.id ? ' is-drop-target' : ''}`}
            aria-pressed={focus === o.table.id}
            aria-label={`${o.table.name}: ${o.used} من ${o.table.capacity}${o.over ? `، زيادة ${-o.remaining}` : ''}`}
            onClick={() => { haptic('tick'); onFocus(o.table.id); }}
            onDragOver={onDropParty ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; onDragOverTable?.(o.table.id); } : undefined}
            onDragLeave={onDropParty ? () => onDragOverTable?.(null) : undefined}
            onDrop={onDropParty?.(o)}>
            <span className="hall-table-art"><TableDisc o={o} /><strong className="hall-count num">{o.used}<small>/{o.table.capacity}</small></strong></span>
            <span className="hall-name">{o.table.name}</span>
            <span className="hall-status">{o.over ? `زيادة ${-o.remaining}` : o.remaining === 0 ? 'ممتلئة' : `${o.remaining} متاح`}</span>
          </button>
        ))}
      </div>
      <p className="hall-note">ترتيب للعرض فقط — ليس مخطط القاعة الفعلي.</p>
    </section>
  );
}

/** destinations while a family is being moved; each shows the result before you commit */
export function SeatDock({ party, tables, hover, onPick, onCancel, onList }: {
  party: InvitationParty; tables: TableOccupancy[]; hover: string | null; onPick: (t: TableOccupancy) => void; onCancel: () => void; onList: () => void;
}) {
  const need = seatsFor(party);
  const strip = useRef<HTMLDivElement>(null);
  // keep the hovered destination in view while dragging along the strip
  useEffect(() => { if (hover) strip.current?.querySelector(`[data-table="${CSS.escape(hover)}"]`)?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' }); }, [hover]);
  return (
    <div className="seat-dock" role="dialog" aria-label={`اختر طاولة لـ${party.primaryGuestName}`}>
      <div className="seat-dock-head">
        <span className="seat-dock-chip"><b>{party.primaryGuestName}</b> · {people(need)}</span>
        <span className="seat-dock-hint">{hover ? 'أفلِت لتأكيد النقل' : 'اضغط طاولة أو اسحب إليها'}</span>
        <button type="button" className="seat-dock-list" onClick={onList}>قائمة</button>
        <button type="button" className="seat-dock-cancel" onClick={onCancel} aria-label="إلغاء النقل"><Icon name="close" size="sm" /></button>
      </div>
      <div className="seat-dock-strip" ref={strip}>
        {tables.map((o) => {
          const current = party.tableId === o.table.id;
          const check = checkAssign(party, o);
          const after = current ? o.used : o.used + need;
          return (
            <button key={o.table.id} type="button" data-table={o.table.id} disabled={current}
              className={`seat-dock-table${hover === o.table.id ? ' is-hover' : ''}${!current && !check.ok ? ' is-tight' : ''}${current ? ' is-current' : ''}`}
              aria-label={`${o.table.name}: ${current ? 'الطاولة الحالية' : `تصبح ${after} من ${o.table.capacity}${check.ok ? '' : '، فوق السعة'}`}`}
              onClick={() => onPick(o)}>
              <span className="hall-table-art"><TableDisc o={o} preview={hover === o.table.id && !current ? after : undefined} /><strong className="hall-count num">{hover === o.table.id && !current ? after : o.used}<small>/{o.table.capacity}</small></strong></span>
              <span className="hall-name">{o.table.name}</span>
              <span className="hall-status">{current ? 'الحالية' : check.ok ? `→ ${after}/${o.table.capacity}` : 'لا تتسع'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Press-and-hold to lift a family on touch screens, then drag. The hovered destination is found under
 * the finger (elements carrying data-table). Scrolling stays native until the lift happens.
 */
export function useLiftDrag({ onLift, onHover, onDrop, onCancel }: {
  onLift: (party: InvitationParty) => void; onHover: (tableId: string | null) => void; onDrop: (tableId: string | null) => void; onCancel: () => void;
}) {
  const [ghost, setGhost] = useState<{ party: InvitationParty; x: number; y: number } | null>(null);
  const live = useRef<{ id: number; party: InvitationParty } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const hovered = useRef<string | null>(null);

  useEffect(() => {
    if (!ghost) return;
    const target = (x: number, y: number) => (document.elementFromPoint(x, y) as HTMLElement | null)?.closest<HTMLElement>('[data-table]:not(:disabled)')?.dataset.table ?? null;
    const move = (e: PointerEvent) => {
      if (live.current?.id !== e.pointerId) return;
      setGhost((g) => g && { ...g, x: e.clientX, y: e.clientY });
      const t = target(e.clientX, e.clientY);
      if (t !== hovered.current) { hovered.current = t; if (t) haptic('tick'); onHover(t); }
    };
    const up = (e: PointerEvent) => { if (live.current?.id !== e.pointerId) return; const t = hovered.current; end(); onDrop(t); };
    const cancel = (e: PointerEvent) => { if (live.current?.id !== e.pointerId) return; end(); onCancel(); };
    // once lifted, the finger drags the family — the page must not scroll underneath it
    const block = (e: TouchEvent) => { if (live.current) e.preventDefault(); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('touchmove', block, { passive: false });
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cancel); window.removeEventListener('touchmove', block); };
  }, [ghost != null]); // eslint-disable-line react-hooks/exhaustive-deps

  const end = () => { live.current = null; hovered.current = null; setGhost(null); onHover(null); };
  const clear = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  useEffect(() => clear, []);

  const bind = (party: InvitationParty) => ({
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      if (e.pointerType === 'mouse' || e.isPrimary === false || party.rsvpStatus !== 'confirmed') return;
      if ((e.target as HTMLElement).closest('button,a,input')) return;
      origin.current = { x: e.clientX, y: e.clientY };
      const id = e.pointerId, el = e.currentTarget;
      el.setAttribute('data-pressing', 'true');
      clear();
      timer.current = setTimeout(() => { el.removeAttribute('data-pressing'); live.current = { id, party }; haptic('select'); onLift(party); setGhost({ party, x: origin.current.x, y: origin.current.y }); }, 380);
    },
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => { if (timer.current && Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) > 8) { e.currentTarget.removeAttribute('data-pressing'); clear(); } },
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => { e.currentTarget.removeAttribute('data-pressing'); clear(); },
    onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => { e.currentTarget.removeAttribute('data-pressing'); clear(); },
    onContextMenu: (e: React.MouseEvent) => { if (timer.current || live.current) e.preventDefault(); },
  });

  const ghostEl = ghost ? <div className="lift-ghost" style={{ transform: `translate3d(${ghost.x}px, ${ghost.y}px, 0)` }} aria-hidden="true"><b>{ghost.party.primaryGuestName}</b><span>{people(seatsFor(ghost.party))}</span></div> : null;
  return { bind, ghost: ghostEl, lifting: !!ghost };
}
