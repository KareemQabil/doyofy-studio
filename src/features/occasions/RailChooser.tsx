/**
 * Variant B · Editorial Rail + All Occasions. A horizontal rail of the most chosen occasions, and
 * "عرض كل المناسبات" opening a grouped gallery (sheet on phones). Picking from the gallery closes it
 * and keeps the choice visible: an occasion that isn't on the rail is placed at its start.
 * Same catalogue, copy and card as the Coverflow so the A/B isolates the interaction.
 */
import { useRef, useState } from 'react';
import type { EventType } from '../../domain/types';
import { EVENT_TYPES, OCCASION_GROUPS, eventTypeInfo } from '../../domain/event';
import { Button, Dialog } from '../../ui';
import { OccasionCard } from './OccasionCard';

export function RailChooser({ value, onChange, onConfirm }: { value: EventType | null; onChange: (t: EventType) => void; onConfirm: (t: EventType) => void }) {
  const [open, setOpen] = useState(false);
  const rail = useRef<HTMLDivElement>(null);
  const popular = EVENT_TYPES.filter((t) => t.popular);
  const items = value && !popular.some((p) => p.id === value) ? [eventTypeInfo(value), ...popular] : popular;

  const pick = (t: EventType, fromSheet = false) => {
    onChange(t);
    if (fromSheet) {
      setOpen(false);
      // back in context: bring the chosen card into view and give it focus
      requestAnimationFrame(() => {
        const el = rail.current?.querySelector<HTMLElement>(`[data-occ="${t}"]`);
        rail.current?.scrollTo({ left: 0 });
        el?.focus({ preventScroll: true });
      });
    }
  };

  return (
    <div className="rl">
      <div className="rl-head">
        <h2 className="rl-title">الأكثر اختيارًا</h2>
        <Button variant="ghost" icon="grid" onClick={() => setOpen(true)}>عرض كل المناسبات <span className="faint num">({EVENT_TYPES.length})</span></Button>
      </div>
      <div ref={rail} className="rl-track" role="radiogroup" aria-label="أنواع المناسبات">
        {items.map((it) => (
          <button key={it.id} type="button" role="radio" aria-checked={value === it.id} data-occ={it.id} className="rl-item"
            onClick={() => pick(it.id)} onDoubleClick={() => onConfirm(it.id)}>
            <OccasionCard info={it} selected={value === it.id} size="md" />
          </button>
        ))}
        <button type="button" className="rl-more" onClick={() => setOpen(true)}>
          <span className="rl-more-n num">+{EVENT_TYPES.length - popular.length}</span>
          <span>كل المناسبات</span>
        </button>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} size="lg" title="كل المناسبات" description="اختر الأقرب لمناسبتك — يمكنك تغييره لاحقًا.">
        <div className="rl-groups">
          {OCCASION_GROUPS.map((g) => {
            const list = EVENT_TYPES.filter((t) => t.group === g.id);
            if (!list.length) return null;
            return (
              <section key={g.id} className="rl-group" aria-labelledby={`grp-${g.id}`}>
                <h3 id={`grp-${g.id}`} className="rl-group-h">{g.label}</h3>
                <div className="rl-grid" role="radiogroup" aria-labelledby={`grp-${g.id}`}>
                  {list.map((it) => (
                    <button key={it.id} type="button" role="radio" aria-checked={value === it.id} className="rl-cell" onClick={() => pick(it.id, true)}>
                      <OccasionCard info={it} selected={value === it.id} size="sm" showLine={false} />
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </Dialog>
    </div>
  );
}
