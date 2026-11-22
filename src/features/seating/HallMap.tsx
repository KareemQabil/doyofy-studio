/**
 * Hall map (feedback F020, F023, F028, F029, F036, F042).
 *   HallMap   overview above the detailed list: round tables with their real seats filled, tap one to
 *             show its people below. The arrangement is an overview, not a measured floor plan.
 *   SeatDock  while moving a family: every table as a destination with the capacity it WOULD have
 *             (7/10 + 2 → 9/10), on a strip at the bottom of the screen where the thumb is.
 *   useLiftDrag  phones: press and hold a family to lift it, then drag it onto a table in the dock.
 *             Desktop keeps native drag-and-drop; the «نقل» button does the same by tapping.
 */
import { claimPointer } from '../../ui/hooks/usePointerGesture';
import { hasAllergy } from '../../domain/guest-experience';
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import type { InvitationParty } from '../../domain/types';
import { checkAssign, type TableOccupancy } from '../../domain/seating';
import { seatsFor } from '../../domain/parties';
import { useCopy } from '../../ui/copy';
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

export function HallMap({ tables, focus, onFocus, onDropParty, dragOver, onDragOverTable, showFood = false, orderMode = false, onReorder, onOrderDone }: {
  tables: TableOccupancy[]; focus: string; onFocus: (id: string) => void;
  onDropParty?: (t: TableOccupancy) => (e: React.DragEvent) => void; dragOver?: string | null; onDragOverTable?: (id: string | null) => void;
  showFood?: boolean; orderMode?: boolean; onReorder?: (source: string, target: string) => void; onOrderDone?: () => void;
}) {
  const { t } = useCopy();
  const [orderSource, setOrderSource] = useState<string | null>(null);
  const [orderTarget, setOrderTarget] = useState<string | null>(null);
  const touchOrder = useRef<{ pointerId: number; source: string; target: string } | null>(null);
  const clearOrder = () => { touchOrder.current = null; setOrderSource(null); setOrderTarget(null); };
  const total = tables.reduce((n, o) => n + o.table.capacity, 0), used = tables.reduce((n, o) => n + o.used, 0);
  return (
    <section className="hall seat-overview" aria-label="خريطة الطاولات وتصفية القائمة">
      <header className="hall-head">
        <div>
          <p className="hall-kicker"><Icon name="table" size="sm" />{t('hallKicker')}</p>
          <h2>{t('hallUsed', { used, total })}</h2>
        </div>
        <button type="button" className={`hall-all${focus === 'all' ? ' is-on' : ''}`} aria-pressed={focus === 'all'} onClick={() => onFocus('all')}>{t('hallAll')}</button>
      </header>
      <div className="hall-stage" aria-hidden="true"><span>{t('hallStage')}</span></div>
      {/* the keyboard sentence only where a keyboard is likely (seating-v2.css hides it on touch screens) */}
      {orderMode && <div className="hall-order-bar"><p className="hall-order-hint" id="hall-order-help">{t('hallOrderHint')}<span className="hall-order-keys">{t('hallOrderKeys')}</span></p>
        {onOrderDone && <button type="button" className="hall-all is-on" onClick={onOrderDone}>{t('seatOrderDone')}</button>}</div>}
      <div className={`hall-floor${orderMode ? ' is-ordering' : ''}`} style={{ '--hall-n': tables.length } as CSSProperties}>
        {tables.map((o, i) => (
          <button key={o.table.id} type="button" style={{ '--hall-i': i } as CSSProperties}
            data-order-table={o.table.id} data-table={orderMode ? undefined : o.table.id} draggable={orderMode} aria-describedby={orderMode ? 'hall-order-help' : undefined}
            className={`hall-table seat-overview-table${focus === o.table.id ? ' is-active' : ''}${o.over ? ' is-over' : o.remaining === 0 ? ' is-full' : ''}${dragOver === o.table.id || orderTarget === o.table.id ? ' is-drop-target' : ''}${orderSource === o.table.id ? ' is-order-source' : ''}`}
            aria-pressed={focus === o.table.id}
            aria-label={`${o.table.name}: ${o.used} من ${o.table.capacity}${o.over ? `، زيادة ${-o.remaining}` : ''}${showFood && o.parties.some((p) => p.rsvpStatus === 'confirmed' && hasAllergy(p.dietary)) ? '، عليها حساسية طعام' : ''}${orderMode ? `، الترتيب ${i + 1}` : ''}`}
            onClick={() => { if (!orderMode) { haptic('tick'); onFocus(o.table.id); } }}
            onDragStart={orderMode ? (e) => { e.dataTransfer.setData('application/x-doyofy-table', o.table.id); setOrderSource(o.table.id); } : undefined}
            onDragEnd={orderMode ? clearOrder : undefined}
            onPointerDown={orderMode ? (e) => { if (e.pointerType === 'mouse' || !e.isPrimary) return; claimPointer(e); e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); touchOrder.current = { pointerId: e.pointerId, source: o.table.id, target: o.table.id }; setOrderSource(o.table.id); } : undefined}
            onPointerMove={orderMode ? (e) => { if (touchOrder.current?.pointerId !== e.pointerId) return; const id = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-order-table]')?.dataset.orderTable; if (id) { touchOrder.current.target = id; setOrderTarget(id); } } : undefined}
            onPointerUp={orderMode ? (e) => { const drag = touchOrder.current; if (drag?.pointerId !== e.pointerId) return; if (drag.source !== drag.target) onReorder?.(drag.source, drag.target); clearOrder(); } : undefined}
            onPointerCancel={orderMode ? clearOrder : undefined}
            onKeyDown={orderMode ? (e) => { const delta = ['ArrowLeft', 'ArrowDown'].includes(e.key) ? 1 : ['ArrowRight', 'ArrowUp'].includes(e.key) ? -1 : 0; if (!delta) return; e.preventDefault(); const destination = tables[i + delta]; if (destination) onReorder?.(o.table.id, destination.table.id); } : undefined}
            onDragOver={orderMode || onDropParty ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (orderMode) setOrderTarget(o.table.id); else onDragOverTable?.(o.table.id); } : undefined}
            onDragLeave={onDropParty ? () => onDragOverTable?.(null) : undefined}
            onDrop={(e) => { const source = e.dataTransfer.getData('application/x-doyofy-table'); if (source) { e.preventDefault(); onReorder?.(source, o.table.id); clearOrder(); } else onDropParty?.(o)(e); }}>
            <span className="hall-table-art"><TableDisc o={o} /><strong className="hall-count num">{o.used}<small>/{o.table.capacity}</small></strong>
              {showFood && o.parties.some((p) => p.rsvpStatus === 'confirmed' && hasAllergy(p.dietary)) && <span className="hall-allergy" aria-hidden="true"><Icon name="alert" size="sm" /></span>}</span>
            <span className="hall-name">{o.table.name}</span>
            <span className="hall-status">{o.over ? t('hallExtra', { n: -o.remaining }) : o.remaining === 0 ? t('hallFull') : t('hallFree', { n: o.remaining })}</span>
          </button>
        ))}
      </div>
      <p className="hall-note">{t('hallNote')}</p>
    </section>
  );
}

/** destinations while a family is being moved; each shows the result before you commit */
export function SeatDock({ party, tables, hover, onPick, onCancel, onList }: {
  party: InvitationParty; tables: TableOccupancy[]; hover: string | null; onPick: (t: TableOccupancy) => void; onCancel: () => void; onList: () => void;
}) {
  const need = seatsFor(party);
  const { t, n } = useCopy();
  const strip = useRef<HTMLDivElement>(null);
  // keep the hovered destination in view while dragging along the strip
  useEffect(() => { if (hover) strip.current?.querySelector(`[data-table="${CSS.escape(hover)}"]`)?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' }); }, [hover]);
  return (
    <div className="seat-dock" onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); onCancel(); } }} role="dialog" aria-label={`اختر طاولة لـ${party.primaryGuestName}`}>
      <div className="seat-dock-head">
        <span className="seat-dock-chip"><b>{party.primaryGuestName}</b> · {n(need, 'person')}</span>
        <span className="seat-dock-hint">{t(hover ? 'dockDrop' : 'dockHint')}</span>
        <button type="button" className="seat-dock-list" onClick={onList}>{t('dockList')}</button>
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
              <span className="hall-status">{current ? t('dockCurrent') : check.ok ? `→ ${after}/${o.table.capacity}` : t('dockNoFit')}</span>
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
    const finger = { x: ghost.x, y: ghost.y };
    const hover = () => {
      const t = target(finger.x, finger.y);
      if (t !== hovered.current) { hovered.current = t; if (t) haptic('tick'); onHover(t); }
    };
    const move = (e: PointerEvent) => {
      if (live.current?.id !== e.pointerId) return;
      finger.x = e.clientX; finger.y = e.clientY;
      setGhost((g) => g && { ...g, x: e.clientX, y: e.clientY });
      hover();
    };
    // the dock strip scrolls itself to keep the hovered table in view: when the content slides under a still finger,
    // the table under it changes, so the highlight follows the scroll too…
    const scrolled = () => { if (live.current) hover(); };
    // …and the drop commits to the table that is highlighted, never to one the user did not see light up
    const up = (e: PointerEvent) => { if (live.current?.id !== e.pointerId) return; const t = hovered.current; end(); onDrop(t); };
    const cancel = (e: PointerEvent) => { if (live.current?.id !== e.pointerId) return; end(); onCancel(); };
    // once lifted, the finger drags the family — the page must not scroll underneath it
    const block = (e: TouchEvent) => { if (live.current) e.preventDefault(); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('touchmove', block, { passive: false });
    window.addEventListener('scroll', scrolled, { capture: true, passive: true });
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cancel); window.removeEventListener('touchmove', block); window.removeEventListener('scroll', scrolled, { capture: true }); };
  }, [ghost != null]); // eslint-disable-line react-hooks/exhaustive-deps

  const end = () => { live.current = null; hovered.current = null; setGhost(null); onHover(null); };
  const clear = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  useEffect(() => clear, []);

  const bind = (party: InvitationParty) => ({
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      if (e.pointerType === 'mouse' || e.isPrimary === false || party.rsvpStatus !== 'confirmed') return;
      if ((e.target as HTMLElement).closest('button,a,input')) return;
      claimPointer(e);
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
