/** Add / edit guest (quick dialog): name, phone, allowed size; companions, side and note are optional. */
import { useMemo, useState, type FormEvent } from 'react';
import type { InvitationParty, PartyInput } from '../../domain/types';
import { normalisePhone } from '../../domain/phone';
import { formatPhone } from '../../domain/format';
import { Banner, Button, Dialog, Field, Input, Stepper, Textarea } from '../../ui';
import { errorMessage, isAppError } from '../../services/errors';

export function PartyFormDialog({ open, onClose, initial, existing, defaultSize, onSubmit, pending, error, title }: {
  open: boolean; onClose: () => void; initial?: InvitationParty | null; existing: readonly InvitationParty[]; defaultSize: number;
  onSubmit: (input: PartyInput) => void; pending: boolean; error: unknown; title: string;
}) {
  const [name, setName] = useState(initial?.primaryGuestName ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [size, setSize] = useState(initial?.maxPartySize ?? defaultSize);
  const [companions, setCompanions] = useState((initial?.companionNames ?? []).join('\n'));
  const [side, setSide] = useState(initial?.side ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [more, setMore] = useState(!!(initial?.companionNames?.length || initial?.side || initial?.notes));
  const [tried, setTried] = useState(false);

  const phoneRes = phone.trim() ? normalisePhone(phone) : null;
  const dupe = phoneRes?.ok ? existing.find((p) => p.phone === phoneRes.e164 && p.id !== initial?.id) : undefined;
  const sides = useMemo(() => [...new Set(existing.map((p) => p.side).filter(Boolean))] as string[], [existing]);
  const nameErr = tried && !name.trim() ? 'اكتب اسم الضيف أو العائلة' : null;
  const phoneErr = phoneRes && !phoneRes.ok ? 'الرقم غير صحيح. مثال: 0551234567 أو ‎+966551234567' : isAppError(error) && error.field === 'phone' ? error.message : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!name.trim() || (phoneRes && !phoneRes.ok)) return;
    onSubmit({
      primaryGuestName: name, phone: phone.trim() || undefined, maxPartySize: size,
      companionNames: companions.split(/\n|،|,/).map((s) => s.trim()).filter(Boolean), side: side.trim() || undefined, notes: notes.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} title={title} size="md"
      footer={<><Button variant="primary" type="submit" form="party-form" loading={pending}>{initial ? 'حفظ التعديلات' : 'إضافة'}</Button><Button variant="ghost" onClick={onClose}>إلغاء</Button></>}>
      <form id="party-form" className="stack gap-4" onSubmit={submit} noValidate>
        {error && !(isAppError(error) && error.field) ? <Banner tone="danger">{errorMessage(error)}</Banner> : null}
        <Field label="اسم الضيف أو العائلة" required error={nameErr} hint="كما تريد أن يظهر في الدعوة، مثل: عائلة الحربي">
          <Input value={name} onChange={(e) => setName(e.target.value)} data-autofocus autoComplete="off" />
        </Field>
        <Field label="رقم الجوال" optional error={phoneErr} hint={phoneRes?.ok ? `سيُحفظ: ${formatPhone(phoneRes.e164)}` : 'لإرسال الدعوة عبر واتساب. يمكنك إضافته لاحقًا.'}>
          <Input ltr type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xxxxxxxx" autoComplete="off" />
        </Field>
        {dupe && <Banner tone="warning" compact title="هذا الرقم مسجل مسبقًا">باسم «{dupe.primaryGuestName}». تأكد أنها ليست نفس الدعوة قبل الإضافة.</Banner>}
        <Stepper label="العدد المسموح" value={size} min={1} max={20} onChange={setSize} suffix={(n) => (n === 1 ? 'شخص' : n === 2 ? 'شخصان' : 'أشخاص')} />
        <p className="field-hint">كم شخصًا تشمل هذه الدعوة، بما فيهم صاحبها. يحدد الضيف العدد الفعلي عند الرد.</p>
        {!more ? (
          <button type="button" className="link-btn" onClick={() => setMore(true)}>+ أسماء المرافقين، الجهة، ملاحظة (اختياري)</button>
        ) : (
          <>
            <Field label="أسماء المرافقين" optional hint="اسم في كل سطر"><Textarea rows={2} value={companions} onChange={(e) => setCompanions(e.target.value)} /></Field>
            <Field label="الجهة" optional hint="مثل: الأهل، الأصدقاء، زملاء العمل">
              <Input value={side} onChange={(e) => setSide(e.target.value)} list="sides-list" />
            </Field>
            <datalist id="sides-list">{sides.map((s) => <option key={s} value={s} />)}</datalist>
            <Field label="ملاحظة لك" optional><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
          </>
        )}
      </form>
    </Dialog>
  );
}
