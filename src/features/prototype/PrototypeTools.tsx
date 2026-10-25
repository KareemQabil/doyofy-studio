/**
 * Prototype tools — for whoever runs usability tests, not for testers. A small corner button opens
 * a drawer: scenario (before the event / event day), reset data, role, simulated latency and
 * offline mode (to see error states), and quick links to guest-side views.
 * Hidden on guest pages and when the URL has ?tools=off.
 */
import { useState } from 'react';
import { Badge, Banner, Button, ChoiceGroup, ConfirmDialog, Dialog, Icon, Switch } from '../../ui';
import { usePrototype, useServices } from '../../app/data';
import { Link, useLocation, useRouter } from '../../app/router';
import { paths } from '../../app/paths';
import { useToast } from '../../ui/primitives/Feedback';
import { useParties } from '../shared/queries';
import { CHOOSER_LABEL, THEME_LABEL, useReviewSettings, type ChooserVariant, type ThemeId } from '../../app/review';

let toolsOff = (() => { try { return sessionStorage.getItem('doyofy:tools') !== 'on'; } catch { return true; } })();

export function PrototypeTools() {
  const loc = useLocation();
  const proto = usePrototype();
  const [open, setOpen] = useState(false);
  const flag = loc.search.get('tools');
  if (flag === 'off' || flag === 'on') {
    toolsOff = flag === 'off'; // usability sessions: hide the tools for the whole session, not just one page
    try { sessionStorage.setItem('doyofy:tools', flag); } catch { /* private mode */ }
  }
  const s = proto.settings();
  if ((toolsOff && !s.offline) || loc.pathname.startsWith('/i/') || loc.pathname.endsWith('/preview')) return null;
  return (
    <>
      <button type="button" className={`proto-fab${s.offline ? ' is-offline' : ''}`} onClick={() => setOpen(true)} aria-label="أدوات النموذج">
        <Icon name="sliders" size="sm" /><span>أدوات التجربة</span>{s.offline && <span className="proto-dot" aria-hidden="true" />}
      </button>
      {open && <ToolsDrawer onClose={() => setOpen(false)} />}
    </>
  );
}

function ToolsDrawer({ onClose }: { onClose: () => void }) {
  const proto = usePrototype();
  const services = useServices();
  const toast = useToast();
  const { navigate, absolute } = useRouter();
  const parties = useParties('evt_wedding');
  const [, force] = useState(0);
  const [confirm, setConfirm] = useState<null | 'before' | 'event_day'>(null);
  const s = proto.settings();
  const review = useReviewSettings();
  const upd = (p: Parameters<typeof proto.update>[0]) => { proto.update(p); force((n) => n + 1); };
  const pick = (f: (p: NonNullable<typeof parties.data>[number]) => boolean) => parties.data?.find(f);
  const links = [
    { label: 'ضيف لم يرد (يفتح الدعوة)', p: pick((p) => p.rsvpStatus === 'pending' && p.delivery.status === 'opened') },
    { label: 'ضيف مؤكد (صفحة الحضور + QR)', p: pick((p) => p.rsvpStatus === 'confirmed' && !!p.tableId) },
    { label: 'ضيف معتذر', p: pick((p) => p.rsvpStatus === 'declined') },
  ];
  return (
    <>
      <Dialog open variant="drawer" onClose={onClose} title="أدوات النموذج" description="لمن يدير جلسات الاختبار — ليست جزءًا من المنتج.">
        {!proto.persistent() && <Banner tone="warning" compact>المتصفح يمنع التخزين: ستضيع التغييرات عند تحديث الصفحة.</Banner>}
        <section className="stack gap-3">
          <h3 className="drawer-h">مراجعة التصميم</h3>
          <ChoiceGroup label="الثيم" columns={2} value={review.theme} onChange={(v: ThemeId) => upd({ theme: v })}
            options={(Object.keys(THEME_LABEL) as ThemeId[]).map((t) => ({ value: t, label: <span>{THEME_LABEL[t]}</span> }))} />
          <ChoiceGroup label="اختيار نوع المناسبة" columns={2} value={review.chooser} onChange={(v: ChooserVariant) => upd({ occasionChooser: v })}
            options={(Object.keys(CHOOSER_LABEL) as ChooserVariant[]).map((t) => ({ value: t, label: <span>{CHOOSER_LABEL[t]}</span> }))} />
          <Link to={paths.designReview} className="t-sm" onClick={onClose}>افتح صفحة مراجعة التصميم</Link>
        </section>
        <section className="stack gap-3">
          <h3 className="drawer-h">السيناريو</h3>
          <p className="faint t-sm">الحالي: <Badge tone="info">{proto.scenario() === 'event_day' ? 'يوم المناسبة' : 'قبل المناسبة بـ9 أيام'}</Badge></p>
          <div className="row wrap gap-2">
            <Button size="sm" onClick={() => setConfirm('before')}>قبل المناسبة (البداية)</Button>
            <Button size="sm" onClick={() => setConfirm('event_day')}>يوم المناسبة (الدخول)</Button>
          </div>
          <p className="faint t-xs">إعادة الضبط تمسح كل ما أضيف أثناء الاختبار وتعيد البيانات التجريبية.</p>
        </section>
        <section className="stack gap-2 drawer-section">
          <h3 className="drawer-h">روابط الضيف (زفاف نورة وفيصل)</h3>
          {links.filter((l) => l.p).map((l) => (
            <div key={l.label} className="row between gap-2">
              <Link to={paths.guestLink('noura-faisal', l.p!.code)} target="_blank" className="t-sm">{l.label}</Link>
              <span className="faint t-xs num" dir="ltr">{l.p!.code}</span>
            </div>
          ))}
          <div className="row between gap-2"><Link to={paths.guestLink('noura-faisal')} target="_blank" className="t-sm">الرابط العام (بدون اسم)</Link></div>
          <div className="row between gap-2"><Link to={paths.gate('evt_wedding')} className="t-sm">وضع الدخول</Link></div>
          <p className="faint t-xs">افتح رابط الضيف في تبويب آخر من نفس المتصفح — يرى المنظم الرد فورًا.</p>
          <Button size="sm" variant="ghost" icon="copy" onClick={() => { void navigator.clipboard?.writeText(absolute(paths.events)); toast({ tone: 'success', text: 'تم نسخ رابط النموذج' }); }}>انسخ رابط النموذج</Button>
        </section>
        <section className="stack gap-2 drawer-section">
          <h3 className="drawer-h">حالات النظام</h3>
          <Switch label="محاكاة انقطاع الاتصال" hint="كل عملية تفشل برسالة واضحة — لاختبار حالات الخطأ" checked={s.offline} onChange={(v) => upd({ offline: v })} />
          <ChoiceGroup label="سرعة الاستجابة" columns={3} value={String(s.latencyMs) as '0' | '180' | '900'} onChange={(v) => upd({ latencyMs: Number(v) })}
            options={[{ value: '0', label: 'فورية' }, { value: '180', label: 'عادية' }, { value: '900', label: 'بطيئة' }]} />
          <ChoiceGroup label="الدور" columns={2} value={s.role} onChange={(v) => upd({ role: v })}
            options={[{ value: 'organizer', label: 'صاحبة المناسبة' }, { value: 'coordinator', label: 'منسقة' }]} />
        </section>
        <p className="faint t-xs">الساعة: {services.clock.now().toLocaleString('ar-u-nu-latn')}</p>
      </Dialog>
      <ConfirmDialog open={!!confirm} title="إعادة ضبط البيانات؟" tone="danger" body="سيُمسح كل ما أضيف أو عُدّل أثناء الاختبار." confirmLabel="إعادة الضبط"
        onCancel={() => setConfirm(null)} onConfirm={() => { proto.reset(confirm!); setConfirm(null); onClose(); navigate(paths.events, { force: true }); toast({ tone: 'success', text: confirm === 'event_day' ? 'سيناريو يوم المناسبة جاهز' : 'تمت إعادة البيانات التجريبية' }); }} />
    </>
  );
}
