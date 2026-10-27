/**
 * «بعد التأكيد» — what guests are asked beyond yes/no and what they may open (F050–F052, F056–F057, F061–F070).
 * Small on purpose: a few menu choices, one dietary question, a short wishlist of external links.
 * The phone beside the editor is the real guest component, so what the host sets is what the guest sees.
 * Saved apart from the event details (own revision): a reply answered against an older menu is checked, never silently swapped.
 */
import { useEffect, useMemo, useState } from 'react';
import type { Event, GiftItem, GiftKind, InvitationParty, MealOption } from '../../domain/types';
import { GIFT_KIND, experienceOf, linkHost, safeExternalUrl, validatePolicy, type ExperienceDraft } from '../../domain/guest-experience';
import { makeId } from '../../domain/ids';
import { Banner, Button, Field, Icon, IconButton, Input, Panel, Segmented, Switch, Textarea } from '../../ui';
import { useMutation } from '../../app/data';
import { useBlocker } from '../../app/router';
import { useToast } from '../../ui/primitives/Feedback';
import { errorMessage, isAppError } from '../../services/errors';
import { useParties } from '../shared/queries';
import { GuestExtrasFields, Wishlist, emptyExtras, type ExtrasValue } from '../guest/GuestExtras';

const SUGGESTED = ['لحم', 'دجاج', 'سمك', 'نباتي', 'وجبة أطفال'];
const draftOf = (ev: Event): ExperienceDraft => { const { revision: _r, ...d } = experienceOf(ev); return structuredClone(d); };

export function GuestExperienceSettings({ event }: { event: Event }) {
  const toast = useToast();
  const parties = useParties(event.id);
  const base = useMemo(() => draftOf(event), [event]);
  const revision = experienceOf(event).revision;
  const [d, setD] = useState<ExperienceDraft>(base);
  const [preview, setPreview] = useState<'attend' | 'decline'>('attend');
  const [sample, setSample] = useState<ExtrasValue>(emptyExtras());
  // a save from another tab (or this one) brings a new revision: start from it unless the host is mid-edit
  const [seen, setSeen] = useState(revision);
  const dirty = JSON.stringify(d) !== JSON.stringify(base);
  useEffect(() => { if (revision !== seen && !dirty) { setD(base); setSeen(revision); } }, [revision]); // eslint-disable-line react-hooks/exhaustive-deps
  useBlocker(dirty, 'لم تحفظ إعدادات الطعام والهدايا. هل تريد المغادرة دون حفظها؟');

  const answered = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of (parties.data ?? []) as InvitationParty[]) if (p.rsvpStatus === 'confirmed') p.meals?.forEach((a) => m.set(a.optionId, (m.get(a.optionId) ?? 0) + a.count));
    return m;
  }, [parties.data]);

  const save = useMutation((s) => s.events.updateExperience(event.id, d, seen), {
    onSuccess: (e) => { const next = draftOf(e); setD(next); setSeen(experienceOf(e).revision); toast({ tone: 'success', text: 'تم الحفظ — يراها الضيوف من الآن' }); },
    onError: (e) => { if (isAppError(e) && e.code === 'conflict') { setD(base); setSeen(revision); } },
  });
  const problem = validatePolicy(d);

  const setMeals = (patch: Partial<ExperienceDraft['meals']>) => setD((x) => ({ ...x, meals: { ...x.meals, ...patch } }));
  const setOption = (id: string, patch: Partial<MealOption>) => setMeals({ options: d.meals.options.map((o) => (o.id === id ? { ...o, ...patch } : o)) });
  const addOption = (label = '') => setMeals({ options: [...d.meals.options, { id: makeId('meal'), label }] });
  const removeOption = (o: MealOption) => setMeals({ options: answered.get(o.id) ? d.meals.options.map((x) => (x.id === o.id ? { ...x, archived: true } : x)) : d.meals.options.filter((x) => x.id !== o.id) });
  const setGifts = (patch: Partial<ExperienceDraft['gifts']>) => setD((x) => ({ ...x, gifts: { ...x.gifts, ...patch } }));
  const setItem = (id: string, patch: Partial<GiftItem>) => setGifts({ items: d.gifts.items.map((g) => (g.id === id ? { ...g, ...patch } : g)) });
  const addItem = () => setGifts({ items: [...d.gifts.items, { id: makeId('gift'), kind: 'gift', title: '' }] });

  const live = d.meals.options.filter((o) => !o.archived);
  const hidden = d.meals.options.filter((o) => o.archived);
  const previewX = { ...d, revision, meals: { ...d.meals, options: live.filter((o) => o.label.trim()) }, gifts: { ...d.gifts, items: d.gifts.items.filter((g) => !g.archived && g.title.trim()) } };
  const asksAnything = (d.meals.enabled && previewX.meals.options.length > 0) || d.dietary.enabled;

  return (
    <Panel title="بعد تأكيد الحضور" subtitle="أسئلة قصيرة وقائمة رغبات — كلها اختيارية، وتظهر للضيف فقط إن فعّلتها." className="gxs" id="guest-experience">
      <div className="gxs-grid">
        <div className="gxs-editor">
          {/* ------------------------------------------------ meals */}
          <section className="gxs-part" aria-labelledby="gxs-meals">
            <h3 id="gxs-meals" className="gxs-h"><span className="gxs-num">١</span>الطعام</h3>
            <Switch label="اسأل عن اختيار الوجبة" hint="يوزّع الضيف الوجبات على عدد الحضور: عائلة من 4 قد تختار 2 لحم و1 سمك و1 نباتي." checked={d.meals.enabled}
              onChange={(v) => setMeals(v && live.length === 0 ? { enabled: true, options: [...d.meals.options, { id: makeId('meal'), label: 'لحم' }, { id: makeId('meal'), label: 'سمك' }] } : { enabled: v })} />
            {d.meals.enabled && (
              <div className="gxs-sub">
                <ol className="gxs-options">
                  {live.map((o, i) => (
                    <li key={o.id} className={`gxs-option tone-${'abcdef'[i % 6]}`}>
                      <span className="gx-swatch" aria-hidden="true" />
                      <Input aria-label={`اسم الخيار ${i + 1}`} value={o.label} maxLength={40} placeholder="مثال: كبسة لحم" onChange={(e) => setOption(o.id, { label: e.target.value })} />
                      {answered.get(o.id) ? <span className="gxs-count num" title="عدد من اختاره">{answered.get(o.id)}</span> : null}
                      <IconButton icon="close" label={answered.get(o.id) ? `إخفاء ${o.label} (اختاره ضيوف)` : `حذف ${o.label || 'الخيار'}`} size="sm" onClick={() => removeOption(o)} />
                    </li>
                  ))}
                </ol>
                {live.length < 6 && (
                  <div className="gxs-suggest">
                    <Button variant="ghost" size="sm" icon="plus" onClick={() => addOption()}>خيار آخر</Button>
                    {SUGGESTED.filter((s) => !live.some((o) => o.label.includes(s))).slice(0, 3).map((s) => <button key={s} type="button" className="gx-chip is-sm" onClick={() => addOption(s)}>+ {s}</button>)}
                  </div>
                )}
                {hidden.length > 0 && (
                  <p className="gxs-hidden">
                    <Icon name="archive" size="sm" />مخفية عن الضيوف وتبقى في التقرير لمن اختارها: {hidden.map((o) => (
                      <button key={o.id} type="button" className="gxs-restore" onClick={() => setOption(o.id, { archived: false })}>{o.label} — إعادة</button>
                    ))}
                  </p>
                )}
                <Switch label="الاختيار مطلوب لكل شخص" hint="إن أوقفته يمكن للضيف ترك البعض بلا اختيار، ويظهر عددهم في التقرير." checked={d.meals.required} onChange={(v) => setMeals({ required: v })} />
              </div>
            )}
          </section>

          {/* ------------------------------------------------ dietary */}
          <section className="gxs-part" aria-labelledby="gxs-diet">
            <h3 id="gxs-diet" className="gxs-h"><span className="gxs-num">٢</span>الحساسية والنظام الغذائي</h3>
            <Switch label="اسأل إن كان لديهم ما نراعيه" hint="اختيارات بسيطة: مكسرات، حليب، جلوتين، بيض، مأكولات بحرية — وحلال، نباتي. تظهر لك في الضيوف والطاولات." checked={d.dietary.enabled} onChange={(v) => setD((x) => ({ ...x, dietary: { enabled: v } }))} />
          </section>

          {/* ------------------------------------------------ wishlist */}
          <section className="gxs-part" aria-labelledby="gxs-gifts">
            <h3 id="gxs-gifts" className="gxs-h"><span className="gxs-num">٣</span>قائمة الرغبات</h3>
            <Switch label="أظهر قائمة الرغبات في صفحة الضيف" hint="هدية بعينها، مساهمة في هدية أكبر أو نقوط، أو باقة ورد — كلها روابط تختارها أنت." checked={d.gifts.enabled}
              onChange={(v) => { setGifts({ enabled: v }); if (v && !d.gifts.items.some((g) => !g.archived)) addItem(); }} />
            {d.gifts.enabled && (
              <div className="gxs-sub">
                <Field label="كلمة قبل القائمة" optional><Textarea rows={2} maxLength={160} value={d.gifts.intro ?? ''} placeholder="حضوركم أجمل هدية. ولمن أحب أن يشاركنا…" onChange={(e) => setGifts({ intro: e.target.value })} /></Field>
                <ul className="gxs-items">
                  {d.gifts.items.filter((g) => !g.archived).map((g, i) => <GiftEditor key={g.id} g={g} n={i + 1} onChange={(p) => setItem(g.id, p)} onRemove={() => setGifts({ items: d.gifts.items.filter((x) => x.id !== g.id) })} />)}
                </ul>
                {d.gifts.items.filter((g) => !g.archived).length < 6 && <Button variant="ghost" size="sm" icon="plus" onClick={addItem}>رغبة أخرى</Button>}
                <Switch label="اعرضها بلطف بعد الاعتذار" hint="يُقبل اعتذار الضيف أولًا، ثم يرى «مشاركتكم من بعيد» مع الورد والمساهمات." checked={d.gifts.afterDecline} onChange={(v) => setGifts({ afterDecline: v })} />
                <p className="gxs-note"><Icon name="info" size="sm" />نحن لا نستلم أموالًا ولا نتابع الدفع. ضع رابط متجر أو صفحة مساهمة أو محفظتك؛ يذهب الضيف إليه مباشرة، ولا يظهر عندنا من دفع أو اشترى.</p>
              </div>
            )}
          </section>

          {save.error ? <Banner tone={isAppError(save.error) && save.error.code === 'conflict' ? 'warning' : 'danger'} title="لم تُحفظ الإعدادات">{errorMessage(save.error)}</Banner> : null}
          {dirty && problem && <p className="field-error" role="alert">{problem.message}</p>}
          <div className={`gxs-actions${dirty ? ' is-dirty' : ''}`}>
            {dirty ? <span className="t-sm">تغييرات لم تُحفظ — لا يراها الضيوف بعد</span> : <span className="t-sm faint">محفوظة{revision ? ` · الإصدار ${revision}` : ''}</span>}
            <div className="row gap-2">
              {dirty && <Button variant="ghost" onClick={() => setD(base)}>تجاهل</Button>}
              <Button variant="primary" disabled={!dirty || !!problem} loading={save.pending} onClick={() => void save.run()}>حفظ ونشر للضيوف</Button>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------ the guest's phone, live */}
        <aside className="gxs-preview" aria-label="معاينة ما يراه الضيف">
          <Segmented label="المعاينة" size="sm" value={preview} onChange={setPreview} options={[{ value: 'attend', label: 'ضيف سيحضر' }, { value: 'decline', label: 'ضيف اعتذر' }]} />
          <div className="gxs-phone theme-guest">
            <div className="gxs-screen">
              {preview === 'attend' ? (
                asksAnything ? <section className="hub-card"><h4 className="hub-h">نعم، سنحضر — ٣ أشخاص</h4><GuestExtrasFields x={previewX} count={3} value={sample} onChange={setSample} /></section>
                  : <p className="gxs-empty">لا أسئلة بعد التأكيد. يرسل الضيف رده مباشرة.</p>
              ) : null}
              {preview === 'decline' && (d.gifts.enabled && d.gifts.afterDecline && previewX.gifts.items.length
                ? <Wishlist x={previewX} mode="decline" />
                : <p className="gxs-empty">«سجّلنا اعتذاركم» — دون خيارات إضافية.</p>)}
              {preview === 'attend' && d.gifts.enabled && previewX.gifts.items.length > 0 && <Wishlist x={previewX} mode="hub" />}
            </div>
          </div>
          <p className="gxs-preview-note">معاينة فقط — لا تُرسل أي إجابة.</p>
        </aside>
      </div>
    </Panel>
  );
}

function GiftEditor({ g, n, onChange, onRemove }: { g: GiftItem; n: number; onChange: (p: Partial<GiftItem>) => void; onRemove: () => void }) {
  const bad = !!g.url?.trim() && !safeExternalUrl(g.url);
  const host = !bad && g.url ? linkHost(g.url) : '';
  return (
    <li className="gxs-item">
      <div className="row between gap-2">
        <Segmented label={`نوع الرغبة ${n}`} size="sm" value={g.kind} onChange={(k: GiftKind) => onChange({ kind: k })} options={(Object.keys(GIFT_KIND) as GiftKind[]).map((k) => ({ value: k, label: GIFT_KIND[k].label }))} />
        <IconButton icon="trash" label={`حذف الرغبة ${n}`} size="sm" onClick={onRemove} />
      </div>
      <div className="grid-2">
        <Field label="العنوان" required><Input value={g.title} maxLength={60} placeholder={g.kind === 'flowers' ? 'باقة ورد للعروس' : g.kind === 'contribution' ? 'المساهمة في ساعة' : 'آلة قهوة'} onChange={(e) => onChange({ title: e.target.value })} /></Field>
        <Field label="سطر قصير" optional><Input value={g.note ?? ''} maxLength={90} placeholder={GIFT_KIND[g.kind].hint} onChange={(e) => onChange({ note: e.target.value })} /></Field>
      </div>
      <Field label="الرابط" optional hint={host ? `يفتح ${host} في نافذة جديدة` : 'رابط متجر أو صفحة مساهمة أو محفظة — يبدأ بـ https://'} error={bad ? 'رابط غير مقبول. انسخ الرابط الكامل الذي يبدأ بـ https://' : null}>
        <Input ltr type="url" inputMode="url" value={g.url ?? ''} placeholder="https://" onChange={(e) => onChange({ url: e.target.value })} />
      </Field>
    </li>
  );
}
