/**
 * What a guest answers after «سنحضر» (F047–F057) and the wishlist they may open whatever they reply
 * (F058–F070). The host switches each part on; nothing here is shown when it is off (T27).
 * Food is split per person inside the family (D08) and needs are kept apart from meal choices (D09).
 * Wishes are external links: opening one never marks anything as paid or bought (D14, D16).
 */
import { useId, useState, type ReactNode } from 'react';
import type { DietaryAnswer, DietaryNeed, GiftItem, GiftKind, GuestExperience, MealAllocation, RsvpInput } from '../../domain/types';
import {
  DIETARY, DIETARY_ERROR_TEXT, DIETARY_ORDER, GIFT_KIND, MEAL_ERROR_TEXT, activeGifts, activeMeals, asksMeals, linkHost, mealSum, safeExternalUrl,
  validateDietary, validateMeals,
} from '../../domain/guest-experience';
import { people } from '../../domain/format';
import { Banner, Button, Dialog, Field, Icon, Input } from '../../ui';
import { haptic } from '../../ui/motion/motion';

export type ExtrasValue = { meals: MealAllocation[]; dietary?: DietaryAnswer };
export const emptyExtras = (prev?: { meals?: MealAllocation[]; dietary?: DietaryAnswer }): ExtrasValue => ({ meals: prev?.meals ?? [], dietary: prev?.dietary });

/** the extras part of an RSVP payload, with the revision the guest answered against */
export function extrasPayload(x: GuestExperience | undefined, v: ExtrasValue): Pick<RsvpInput, 'meals' | 'dietary' | 'expectedExperienceRevision'> {
  if (!x) return {};
  const open = new Set(activeMeals(x).map((o) => o.id));
  return {
    meals: asksMeals(x) ? v.meals.filter((a) => a.count > 0 && open.has(a.optionId)) : undefined,
    dietary: x.dietary.enabled ? v.dietary ?? { answered: false, needs: [] } : undefined,
    expectedExperienceRevision: x.revision,
  };
}

/** first problem to show next to the field, or null when the answer can be sent */
export function extrasError(x: GuestExperience | undefined, v: ExtrasValue, count: number): { field: 'meals' | 'dietary'; text: string } | null {
  if (!x) return null;
  const open = new Set(activeMeals(x).map((o) => o.id));
  const me = validateMeals(x, count, v.meals.filter((a) => open.has(a.optionId)));
  if (me) return { field: 'meals', text: me === 'sum_mismatch' ? `اختاروا وجبة لكل ${people(count)}.` : MEAL_ERROR_TEXT[me] };
  const de = x.dietary.enabled ? validateDietary(count, v.dietary) : null;
  if (de) return { field: 'dietary', text: DIETARY_ERROR_TEXT[de] };
  return null;
}

/** fit an answer to a new headcount: never more meals than people, never more affected than present */
export function fitExtras(v: ExtrasValue, count: number): ExtrasValue {
  let room = count;
  const meals = v.meals.map((a) => { const c = Math.min(a.count, room); room -= c; return { ...a, count: c }; });
  const d = v.dietary && v.dietary.affectedCount != null && v.dietary.affectedCount > count ? { ...v.dietary, affectedCount: count } : v.dietary;
  return { meals, dietary: d };
}

export function GuestExtrasFields({ x, count, value, onChange, error }: { x: GuestExperience; count: number; value: ExtrasValue; onChange: (v: ExtrasValue) => void; error?: { field: 'meals' | 'dietary'; text: string } | null }) {
  return (
    <div className="gx">
      {asksMeals(x) && <MealsField x={x} count={count} value={value.meals} onChange={(meals) => onChange({ ...value, meals })} error={error?.field === 'meals' ? error.text : null} />}
      {x.dietary.enabled && <DietaryField count={count} value={value.dietary} onChange={(dietary) => onChange({ ...value, dietary })} error={error?.field === 'dietary' ? error.text : null} />}
      <p className="gx-privacy"><Icon name="eye" size="sm" />يرى إجاباتكم أصحاب المناسبة ومن يرتّب الطعام فقط.</p>
    </div>
  );
}

// ------------------------------------------------------------------ meals: a plate per person
const TONES = ['a', 'b', 'c', 'd', 'e', 'f'] as const;

function MealsField({ x, count, value, onChange, error }: { x: GuestExperience; count: number; value: MealAllocation[]; onChange: (v: MealAllocation[]) => void; error: string | null }) {
  const id = useId();
  const options = activeMeals(x);
  const get = (oid: string) => value.find((a) => a.optionId === oid)?.count ?? 0;
  const sum = mealSum(value.filter((a) => options.some((o) => o.id === a.optionId)));
  const left = Math.max(0, count - sum);
  const set = (oid: string, n: number) => {
    const next = options.map((o) => ({ optionId: o.id, count: o.id === oid ? n : get(o.id) })).filter((a) => a.count > 0);
    haptic('tick');
    onChange(next);
  };
  // one guest: a single tap chooses (and a second tap clears) — no stepper arithmetic for one plate
  const single = count === 1;
  const plates: Array<number | null> = [];
  options.forEach((o, i) => { for (let k = 0; k < get(o.id); k++) plates.push(i); });
  while (plates.length < count) plates.push(null);
  return (
    <fieldset className={`gx-block gx-meals${error ? ' has-error' : ''}`} aria-describedby={`${id}-state`}>
      <legend className="gx-title">{single ? 'ماذا تفضّلون على العشاء؟' : 'ماذا يفضّل كل واحد منكم؟'}</legend>
      {!single && (
        <div className="gx-plates" aria-hidden="true">
          {plates.map((t, i) => <span key={i} className={`gx-plate${t == null ? ' is-empty' : ` tone-${TONES[t % TONES.length]}`}`} style={{ ['--i' as string]: i }} />)}
        </div>
      )}
      <p id={`${id}-state`} className="gx-state" aria-live="polite">
        {single ? (sum ? 'تم الاختيار' : x.meals.required ? 'اختاروا طبقًا واحدًا' : 'اختياري')
          : left === 0 ? `اكتمل — ${people(count)}` : `${sum} من ${count}${x.meals.required ? '' : ' · يمكن ترك البعض بلا اختيار'}`}
      </p>
      <ul className="gx-options">
        {options.map((o, i) => {
          const n = get(o.id);
          return (
            <li key={o.id} className={`gx-option tone-${TONES[i % TONES.length]}${n ? ' is-on' : ''}`}>
              {single ? (
                <button type="button" className="gx-pick v2-press" aria-pressed={n > 0} onClick={() => set(o.id, n ? 0 : 1)}>
                  <span className="gx-swatch" aria-hidden="true" /><span className="gx-label">{o.label}</span>{n > 0 && <Icon name="check" size="sm" />}
                </button>
              ) : (
                <div className="gx-row">
                  <span className="gx-swatch" aria-hidden="true" /><span className="gx-label">{o.label}</span>
                  <div className="gx-stepper" role="group" aria-label={o.label}>
                    <button type="button" className="gx-step" aria-label={`زيادة ${o.label}`} disabled={left <= 0} onClick={() => set(o.id, n + 1)}><Icon name="plus" size="sm" /></button>
                    <output className="gx-n num" aria-live="polite">{n}</output>
                    <button type="button" className="gx-step" aria-label={`إنقاص ${o.label}`} disabled={n <= 0} onClick={() => set(o.id, n - 1)}><Icon name="minus" size="sm" /></button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {error && <p className="field-error" role="alert">{error}</p>}
    </fieldset>
  );
}

// ------------------------------------------------------------------ dietary needs: not a medical form
function DietaryField({ count, value, onChange, error }: { count: number; value: DietaryAnswer | undefined; onChange: (v: DietaryAnswer) => void; error: string | null }) {
  const has = value?.answered ? (value.needs.length ? 'yes' : 'no') : null;
  const [open, setOpen] = useState(has === 'yes');
  const needs = value?.needs ?? [];
  const toggle = (n: DietaryNeed) => {
    const next = needs.includes(n) ? needs.filter((x) => x !== n) : [...needs, n];
    haptic('tick');
    onChange({ answered: true, needs: next, affectedCount: value?.affectedCount, note: value?.note });
  };
  const group = (g: 'allergy' | 'diet' | 'other') => DIETARY_ORDER.filter((n) => DIETARY[n].group === g);
  const chip = (n: DietaryNeed) => (
    <button key={n} type="button" className={`gx-chip${needs.includes(n) ? ' is-on' : ''}${DIETARY[n].group === 'allergy' ? ' is-allergy' : ''}`} aria-pressed={needs.includes(n)} onClick={() => toggle(n)}>
      {needs.includes(n) && <Icon name="check" size="sm" />}{DIETARY[n].label}
    </button>
  );
  return (
    <fieldset className={`gx-block gx-diet${error ? ' has-error' : ''}`}>
      <legend className="gx-title">هل لدى أحدكم حساسية أو نظام غذائي نراعيه؟</legend>
      <div className="gx-yesno">
        <button type="button" className={`gx-pill${has === 'no' && !open ? ' is-on' : ''}`} aria-pressed={has === 'no' && !open} onClick={() => { setOpen(false); onChange({ answered: true, needs: [] }); }}>لا شيء، شكرًا</button>
        <button type="button" className={`gx-pill${open ? ' is-on' : ''}`} aria-pressed={open} onClick={() => { setOpen(true); if (!value?.answered) onChange({ answered: true, needs: [] }); }}>نعم</button>
      </div>
      {open && (
        <div className="gx-needs">
          <p className="gx-sub">حساسية</p>
          <div className="gx-chips">{group('allergy').map(chip)}</div>
          <p className="gx-sub">نظام غذائي</p>
          <div className="gx-chips">{group('diet').map(chip)}{group('other').map(chip)}</div>
          {(needs.includes('other') || needs.some((n) => DIETARY[n].group === 'allergy')) && (
            <Field label={needs.includes('other') ? 'اكتبوها بكلمات قليلة' : 'تفاصيل تساعدنا'} optional={!needs.includes('other')}>
              <Input value={value?.note ?? ''} maxLength={140} placeholder="مثال: حساسية شديدة من الفول السوداني" onChange={(e) => onChange({ answered: true, needs, affectedCount: value?.affectedCount, note: e.target.value })} />
            </Field>
          )}
          {count > 1 && needs.length > 0 && (
            <div className="gx-affected" role="group" aria-label="تخص كم شخصًا">
              <span className="gx-sub">تخص</span>
              <button type="button" className={`gx-pill is-sm${value?.affectedCount == null ? ' is-on' : ''}`} aria-pressed={value?.affectedCount == null} onClick={() => onChange({ answered: true, needs, note: value?.note })}>لست متأكدًا</button>
              {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" className={`gx-pill is-sm num${value?.affectedCount === n ? ' is-on' : ''}`} aria-pressed={value?.affectedCount === n} aria-label={`تخص ${people(n)}`} onClick={() => onChange({ answered: true, needs, affectedCount: n, note: value?.note })}>{n}</button>
              ))}
            </div>
          )}
        </div>
      )}
      {error && <p className="field-error" role="alert">{error}</p>}
    </fieldset>
  );
}

// ------------------------------------------------------------------ the extras step for the cinematic invitation
/** the invitation engine collects yes/count; this step adds food before the one and only submit */
export function ExtrasSheet({ x, count, onSend, onBack }: { x: GuestExperience; count: number; onSend: (v: ExtrasValue) => Promise<string | null>; onBack: () => void }) {
  const [value, setValue] = useState<ExtrasValue>(emptyExtras());
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const err = extrasError(x, value, count);
  const send = async () => {
    setTried(true);
    if (err) { haptic('warning'); return; }
    setBusy(true); setFailure(null);
    const problem = await onSend(value);
    setBusy(false);
    if (problem) setFailure(problem);
  };
  return (
    <Dialog open onClose={onBack} variant="drawer" size="md" className="gx-sheet theme-guest" title="خطوة أخيرة قبل الإرسال" description={`الحضور: ${people(count)} · لم يُرسل الرد بعد.`}
      footer={<><Button variant="primary" loading={busy} onClick={() => void send()}>إرسال الرد</Button><Button variant="ghost" disabled={busy} onClick={onBack}>رجوع للدعوة</Button></>}>
      {failure && <Banner tone="danger">{failure}</Banner>}
      <GuestExtrasFields x={x} count={count} value={value} onChange={setValue} error={tried ? err : null} />
    </Dialog>
  );
}

// ------------------------------------------------------------------ wishlist (external links only)
function GiftArt({ kind }: { kind: GiftKind }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg className={`gx-art is-${kind}`} viewBox="0 0 48 48" aria-hidden="true">
      {kind === 'gift' && <g {...common}><rect x="9" y="19" width="30" height="21" rx="2" /><path d="M7 14h34v5H7zM24 14v26M24 14c-3-6-11-6-10-1 1 3 6 2 10 1zm0 0c3-6 11-6 10-1-1 3-6 2-10 1z" /></g>}
      {kind === 'contribution' && <g {...common}><ellipse cx="24" cy="31" rx="13" ry="4.5" /><path d="M11 31v4c0 2.5 5.8 4.5 13 4.5s13-2 13-4.5v-4M15 25c0-2.5 4-4.5 9-4.5s9 2 9 4.5-4 4.5-9 4.5-9-2-9-4.5zM24 9v8m-3-3 3 3 3-3" /></g>}
      {kind === 'flowers' && <g {...common}><path d="M24 40V24M24 30c-4-1-7-4-7-8M24 33c4-1 7-4 7-8M17 40h14" /><circle cx="24" cy="16" r="4" /><path d="M24 12c-2-4 2-6 0-6s2 2 0 6zM28 16c4-2 6 2 6 0s-2 2-6 0zM20 16c-4-2-6 2-6 0s2 2 6 0zM24 20c-2 4 2 6 0 6s2-2 0-6z" /></g>}
    </svg>
  );
}

function WishCard({ g }: { g: GiftItem }) {
  const url = safeExternalUrl(g.url);
  return (
    <li className={`gx-wish is-${g.kind}`}>
      <GiftArt kind={g.kind} />
      <div className="gx-wish-copy">
        <span className="gx-wish-kind">{GIFT_KIND[g.kind].label}</span>
        <h3 className="gx-wish-title">{g.title}</h3>
        {g.note && <p className="gx-wish-note">{g.note}</p>}
      </div>
      {url ? (
        <div className="gx-wish-act">
          <a className="btn btn-secondary btn-md gx-wish-link" href={url} target="_blank" rel="noopener noreferrer nofollow" onClick={() => haptic('tick')}>
            {g.linkLabel || GIFT_KIND[g.kind].link}<Icon name="external" size="sm" />
          </a>
          <span className="gx-wish-host" dir="ltr">{linkHost(url)}</span>
        </div>
      ) : <p className="gx-wish-nolink">اسألوا أصحاب المناسبة عن التفاصيل</p>}
    </li>
  );
}

/** «قائمة الرغبات» on the guest page — the reply never depends on it (D15) */
export function Wishlist({ x, mode, children }: { x: GuestExperience; mode: 'hub' | 'decline'; children?: ReactNode }) {
  const items = activeGifts(x);
  if (!items.length) return null;
  // after a decline, sending something from afar comes first (F068): flowers and contributions lead
  const order: GiftKind[] = mode === 'decline' ? ['flowers', 'contribution', 'gift'] : ['gift', 'contribution', 'flowers'];
  const sorted = [...items].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
  return (
    <section className={`hub-card gx-wishlist is-${mode}`} aria-labelledby={`gx-wl-${mode}`}>
      {mode === 'decline' ? (
        <>
          <p className="gx-kicker">اختياري تمامًا</p>
          <h2 id={`gx-wl-${mode}`} className="hub-h">مشاركتكم من بعيد</h2>
          <p className="muted">غيابكم مفهوم، ولطفكم يصل. إن أحببتم أن تشاركوهم الفرحة:</p>
        </>
      ) : (
        <>
          <h2 id={`gx-wl-${mode}`} className="hub-h">قائمة الرغبات</h2>
          <p className="muted">{x.gifts.intro || 'لمن أحب أن يهدي — اختياري تمامًا.'}</p>
        </>
      )}
      <ul className="gx-wishes">{sorted.map((g) => <WishCard key={g.id} g={g} />)}</ul>
      <p className="gx-wish-foot"><Icon name="info" size="sm" />الروابط تفتح مواقع خارجية اختارها أصحاب المناسبة. لا نسجّل دفعًا أو شراء، وردكم لا يتأثر بها.</p>
      {children}
    </section>
  );
}
