/**
 * In-context capacity upgrade (demo payment). Opened by `useMutation` when a write hits the event's
 * guest limit — the pending operation and its inputs wait here and resume once after payment — or
 * from the capacity meter, with nothing pending. Steps: plan → checkout → confirmation (+ receipt).
 * Cancelling or a declined payment changes neither the guest list nor the capacity.
 */
import { useEffect, useRef, useState } from 'react';
import { GuestLimitError, GUEST_PLANS, PaymentDeclinedError, guestLimit, recommendedPlan, simulateCapacityPayment, upgradeQuote, type Receipt } from '../../domain/billing';
import { plural, pluralOf, P } from '../../domain/format';
import { Banner, Button, ChoiceGroup, Dialog, Icon } from '../../ui';
import { useServices } from '../../app/data';
import { useCopy } from '../../ui/copy';
import { ReceiptDetails, sar } from './Receipt';

type Resume = 'pending' | 'done' | { failed: string };
interface Request {
  kind: 'resume' | 'manual'; eventId: string; used: number; required: number; limit: number; additional: number;
  resolve: (paid: boolean) => void; error?: GuestLimitError; resume?: Resume;
}
let active: Request | null = null;
let lastPaid: Request | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(fn => fn());
function open(request: Omit<Request, 'resolve'>): Promise<boolean> {
  if (active || listeners.size === 0) return Promise.resolve(false);
  return new Promise(resolve => { active = { ...request, resolve }; notify(); });
}
/** Retains the pending mutation and its inputs while the upgrade is open. */
export function requestGuestUpgrade(error: GuestLimitError): Promise<boolean> {
  return open({ kind: 'resume', error, eventId: error.eventId, required: error.required, limit: error.limit, additional: error.additional, used: error.required - error.additional });
}
/** Proactive upgrade from a meter or settings: nothing waits to resume. */
export function openCapacityUpgrade(eventId: string, used: number): void {
  const limit = guestLimit(eventId);
  void open({ kind: 'manual', eventId, used, limit, required: limit + 1, additional: 0 });
}
/** `useMutation` reports how the resumed operation went, so the confirmation can show it. */
export function settleGuestUpgrade(error: GuestLimitError, outcome: Resume): void {
  if (lastPaid?.error !== error) return;
  lastPaid.resume = outcome; notify();
}
function finish(paid: boolean) {
  const previous = active; active = null;
  if (paid && previous) { lastPaid = previous; if (previous.kind === 'resume') previous.resume = 'pending'; }
  notify(); previous?.resolve(paid);
}

type Step = 'plan' | 'checkout' | 'done' | 'not-allowed';
export function UpgradeFlow() {
  const services = useServices();
  const { t } = useCopy();
  const [request, setRequest] = useState<Request | null>(active);
  const [step, setStep] = useState<Step>('plan');
  const [selected, setSelected] = useState(250);
  const [failed, setFailed] = useState<{ message: string; at: number } | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [, rerender] = useState(0);
  const shown = useRef<Request | null>(null), done = useRef(false), body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () => {
      if (active && active !== shown.current) {
        shown.current = active; done.current = false;
        setRequest(active); setFailed(null); setReceipt(null); setSelected(recommendedPlan(active.required).limit);
        setStep(services.session.currentUser().role === 'organizer' ? 'plan' : 'not-allowed');
      } else if (!active && !done.current) { shown.current = null; setRequest(null); }
      rerender(n => n + 1); // resume outcome changed
    };
    listeners.add(update); update();
    return () => { listeners.delete(update); if (active) finish(false); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Each step starts reading from its heading; the dialog itself focuses the first step.
  const firstStep = useRef(true);
  useEffect(() => {
    if (firstStep.current) { firstStep.current = false; return; }
    body.current?.querySelector<HTMLElement>('[data-step-focus]')?.focus({ preventScroll: false });
  }, [step]);
  if (!request) return null;

  const current = guestLimit(request.eventId);
  const suggested = recommendedPlan(request.required);
  const listed = GUEST_PLANS.filter(p => p.limit > current && p.limit >= request.required);
  const plans: Array<{ limit: number; price: number }> = listed.length ? [...listed] : [suggested];
  const plan = plans.find(p => p.limit === selected) ?? plans.find(p => p.limit === suggested.limit) ?? plans[0]!;
  const quote = upgradeQuote(request.eventId, plan.limit);
  const close = () => { if (step === 'done') { done.current = false; shown.current = null; setRequest(null); } else finish(false); };
  const pay = () => {
    try {
      // Another tab may already have supplied enough capacity while checkout was open: no second charge.
      const enough = request.kind === 'resume' ? guestLimit(request.eventId) >= request.required : guestLimit(request.eventId) >= plan.limit;
      setReceipt(enough ? null : simulateCapacityPayment(request.eventId, plan.limit, services.clock.now()));
      setFailed(null); done.current = true; setStep('done'); finish(true);
    } catch (e) {
      setFailed({ message: e instanceof PaymentDeclinedError ? e.message : 'تعذّرت محاكاة الدفع. لم تتغير السعة أو قائمة الضيوف.', at: Date.now() });
    }
  };
  const need = request.kind === 'resume'
    ? <p data-step-focus tabIndex={-1}>هذه الإضافة تحتاج <strong>{plural(request.required, P.person)}</strong>، وحد مناسبتك الحالي <strong>{plural(request.limit, P.person)}</strong>. السعة تشمل الضيوف ومرافقيهم.</p>
    : <p data-step-focus tabIndex={-1}>المستخدم الآن <strong className="num">{request.used}</strong> من <strong>{plural(current, P.person)}</strong>. السعة تشمل الضيوف ومرافقيهم.</p>;
  const demoNote = <p className="capacity-demo-note"><Icon name="info" size="sm" />{t('demoNoCharge')}</p>;

  const title = step === 'plan' ? (request.kind === 'resume' ? 'زِد السعة لإكمال الإضافة' : t('upgradeCapacity'))
    : step === 'checkout' ? 'مراجعة الدفع' : step === 'done' ? 'تمت زيادة السعة' : 'السعة ممتلئة';
  const footer = step === 'plan' ? <><Button variant="primary" onClick={() => setStep('checkout')}>{t('continueToPayment')}</Button><Button variant="ghost" onClick={close}>{t('cancelUpgrade')}</Button></>
    : step === 'checkout' ? <><Button variant="primary" onClick={pay}>{t('confirmDemoPayment')}</Button><Button variant="ghost" onClick={() => { setFailed(null); setStep('plan'); }}>{t('changePlan')}</Button></>
    : <Button variant="primary" onClick={close} data-autofocus>{step === 'done' ? t('done') : t('close')}</Button>;

  return <Dialog open onClose={close} title={title} size="sm" className="capacity-dialog" footer={footer}>
    <div ref={body} className="stack gap-4" data-capacity-flow data-step={step}>
      {step === 'not-allowed' && <p data-step-focus tabIndex={-1}>
        هذه الإضافة تحتاج {plural(request.required, P.person)} وحد المناسبة {plural(request.limit, P.person)}. زيادة السعة والدفع متاحان لصاحب المناسبة فقط؛ اطلب منه زيادتها ثم أعد المحاولة.
      </p>}

      {step === 'plan' && <>
        {need}
        <ChoiceGroup label="اختر السعة" columns={1} value={String(plan.limit)} onChange={v => setSelected(Number(v))}
          options={plans.map(p => {
            const q = upgradeQuote(request.eventId, p.limit);
            return { value: String(p.limit), label: <span className="capacity-plan">
              <span className="capacity-plan-name"><strong>{plural(p.limit, P.person)}</strong>{p.limit === suggested.limit && <span className="capacity-plan-tag">الأنسب لك</span>}</span>
              <span className="capacity-plan-price"><strong className="num">{sar(q.charge)}</strong>{q.credit > 0 && <span className="faint t-xs">الفرق · سعر الباقة {sar(q.price)}</span>}</span>
            </span> };
          })} />
        <p className="field-hint">{request.kind === 'resume' ? 'إلغاء الترقية يعيدك دون أي إضافة، وما كتبته يبقى كما هو.' : 'السعر دفعة واحدة لهذه المناسبة فقط.'} الأسعار للتجربة.</p>
        {demoNote}
      </>}

      {step === 'checkout' && <>
        <h3 className="capacity-step-title" data-step-focus tabIndex={-1}>سعة مناسبتك ستصبح {plural(plan.limit, P.person)}</h3>
        <dl className="capacity-summary">
          <div><dt>الحد الحالي</dt><dd>{plural(current, P.person)}</dd></div>
          <div><dt>سعر الباقة</dt><dd className="num">{sar(quote.price)}</dd></div>
          {quote.credit > 0 && <div><dt>مدفوع سابقًا لهذه المناسبة</dt><dd className="num">− {sar(quote.credit)}</dd></div>}
          <div className="is-total"><dt>{quote.credit > 0 ? 'الفرق المستحق الآن' : 'المبلغ المستحق'}</dt><dd className="num">{sar(quote.charge)}</dd></div>
        </dl>
        {request.kind === 'resume' && <p className="muted t-sm">بعد التأكيد نكمل الإضافة المحفوظة تلقائيًا، مرة واحدة.</p>}
        {failed && <Banner tone="danger" title="لم ينجح الدفع" reveal={failed.at}>{failed.message} يمكنك المحاولة مرة أخرى أو تغيير الباقة.</Banner>}
        {demoNote}
      </>}

      {step === 'done' && <>
        <div className="capacity-success" data-step-focus tabIndex={-1}>
          <Icon name="check-circle" size="lg" />
          <p className="capacity-success-line">أصبح حدّ مناسبتك {plural(guestLimit(request.eventId), P.person)}</p>
        </div>
        {request.kind === 'resume' && <ResumeStatus request={request} limit={guestLimit(request.eventId)} />}
        {receipt ? <ReceiptDetails receipt={receipt} compact />
          : <p className="muted t-sm">زادت السعة من جلسة أخرى قبل التأكيد، فلم نسجّل دفعًا جديدًا.</p>}
      </>}
    </div>
  </Dialog>;
}

function ResumeStatus({ request, limit }: { request: Request; limit: number }) {
  const r = request.resume ?? 'pending';
  if (r === 'pending') return <p className="muted" role="status">نكمل الإضافة المحفوظة…</p>;
  if (r === 'done') return <p className="capacity-resumed" role="status"><Icon name="check" size="sm" /><span>تمت إضافة {pluralOf(request.additional, P.person)}. المستخدم الآن <span className="num">{request.required}</span> من {plural(limit, P.person)}.</span></p>;
  return <Banner tone="warning" title="السعة زادت، لكن الإضافة لم تكتمل">{r.failed}</Banner>;
}
