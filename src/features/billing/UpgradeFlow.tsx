import { useEffect, useState } from 'react';
import { GuestLimitError, GUEST_PLANS, guestLimit, recommendedPlan, simulateCapacityPayment } from '../../domain/billing';
import { Banner, Button, Dialog } from '../../ui';
type Request = { error: GuestLimitError; resolve: (paid: boolean) => void };
let active: Request | null = null;
const listeners = new Set<() => void>();
/** Retains the pending mutation and its inputs while the upgrade is open. */
export function requestGuestUpgrade(error: GuestLimitError): Promise<boolean> {
  if (active || listeners.size === 0) return Promise.resolve(false);
  return new Promise(resolve => { active = { error, resolve }; listeners.forEach(fn => fn()); });
}
function finish(paid: boolean) { const previous = active; active = null; listeners.forEach(fn => fn()); previous?.resolve(paid); }
export function UpgradeFlow() {
  const [request, setRequest] = useState(active);
  const [step, setStep] = useState<'plan' | 'checkout'>('plan');
  const [selected, setSelected] = useState(250), [failed, setFailed] = useState(false);
  useEffect(() => {
    const update = () => { setRequest(active); setStep('plan'); setFailed(false); if (active) setSelected(recommendedPlan(active.error.required).limit); };
    listeners.add(update); update();
    return () => { listeners.delete(update); if (active) finish(false); };
  }, []);
  if (!request) return null;
  const { error } = request, suggested = recommendedPlan(error.required);
  const options = GUEST_PLANS.filter(p => p.limit > guestLimit(error.eventId) && p.limit >= error.required);
  const plans: Array<{ limit: number; price: number }> = options.length ? options : [suggested];
  const plan = plans.find(p => p.limit === selected) ?? suggested;
  const pay = () => {
    try {
      // Another tab may have already supplied sufficient capacity while checkout was open.
      if (guestLimit(error.eventId) < error.required) simulateCapacityPayment(error.eventId, plan.limit);
      finish(true);
    } catch { setFailed(true); }
  };
  return <Dialog open onClose={() => finish(false)} title={step === 'plan' ? 'زِد حد الضيوف وأكمل الإضافة' : 'تأكيد الدفع التجريبي'} size="sm" description="محاكاة فقط — لن يُخصم أي مبلغ."
    footer={step === 'plan' ? <><Button variant="primary" onClick={() => setStep('checkout')}>متابعة بالدفع التجريبي</Button><Button variant="ghost" onClick={() => finish(false)}>العودة للضيوف</Button></>
      : <><Button variant="primary" onClick={pay}>تأكيد الدفع التجريبي</Button><Button variant="ghost" onClick={() => setStep('plan')}>رجوع</Button></>}>
    <div className="stack gap-4" data-capacity-flow>
      <p>الإضافة الحالية تحتاج <strong className="num">{error.required}</strong> ضيفًا. حد مناسبتك <strong className="num">{error.limit}</strong>.</p>
      {step === 'plan' ? <fieldset className="stack gap-3" style={{ minWidth: 0, border: 0, padding: 0 }}><legend>اختر السعة المناسبة</legend>{plans.map(p => <label key={p.limit} className="row wrap gap-3" style={{ padding: 12, border: '1px solid var(--c-field-border)', borderRadius: 'var(--r-md)' }}>
        <input type="radio" name="capacity-plan" checked={plan.limit === p.limit} onChange={() => setSelected(p.limit)} /><span className="grow"><strong>{p.limit} ضيف</strong>{p.limit === suggested.limit && <span className="faint t-sm"> · تناسب الإضافة الحالية</span>}</span><span>{p.price} ر.س</span>
      </label>)}</fieldset> : <><div className="stack gap-2"><strong>سعة المناسبة: {plan.limit} ضيف</strong><p>قيمة تجريبية: {plan.price} ر.س · دفعة واحدة للمناسبة.</p><p className="muted t-sm">بعد التأكيد سنكمل الإضافة المحفوظة تلقائيًا، مرة واحدة.</p></div>
        {failed && <Banner tone="danger">لم تنجح محاكاة الدفع. لم تتغير السعة أو قائمة الضيوف؛ يمكنك المحاولة مجددًا أو الرجوع.</Banner>}
        <details><summary className="link-btn">تجربة تعذّر الدفع</summary><Button variant="ghost" onClick={() => setFailed(true)}>محاكاة عملية مرفوضة</Button></details></>}
      <p className="field-hint">السعة تشمل الضيف ومرافقيه. الأسعار والأرصدة هنا للتجربة فقط.</p>
    </div>
  </Dialog>;
}
