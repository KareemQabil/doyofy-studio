/**
 * Add / edit guest (quick dialog). Only the name is required: the phone is optional (add it later to send on WhatsApp),
 * the allowance starts at the event's default and shows as one chip («الدعوة لشخصين · غيّر»), and the companions,
 * side and note stay folded under «+ …».
 */
import { useMemo, useState, type FormEvent } from 'react';
import type { InvitationParty, PartyInput } from '../../domain/types';
import { normalisePhone } from '../../domain/phone';
import { formatPhone } from '../../domain/format';
import { useCopy } from '../../ui/copy';
import { allocatedGuests, capacityLevel, guestLimit } from '../../domain/billing';
import { useCapacityVersion } from '../billing/CapacityMeter';
import { Banner, Button, Dialog, Field, Icon, Input, Stepper, Textarea } from '../../ui';
import { errorMessage, isAppError } from '../../services/errors';

export function PartyFormDialog({ open, onClose, initial, existing, defaultSize, onSubmit, pending, error, title, eventId }: {
  open: boolean; onClose: () => void; initial?: InvitationParty | null; existing: readonly InvitationParty[]; defaultSize: number;
  onSubmit: (input: PartyInput) => void; pending: boolean; error: unknown; title: string;
  /** shows the event's remaining guest capacity before the limit is reached */
  eventId?: string;
}) {
  useCapacityVersion();
  const { t, n } = useCopy();
  const [name, setName] = useState(initial?.primaryGuestName ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [size, setSize] = useState(initial?.maxPartySize ?? defaultSize);
  const [companions, setCompanions] = useState((initial?.companionNames ?? []).join('\n'));
  const [side, setSide] = useState(initial?.side ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [more, setMore] = useState(!!(initial?.companionNames?.length || initial?.side || initial?.notes));
  // the allowance is already set (the event's default): a chip until the organizer wants another number
  const [sizeOpen, setSizeOpen] = useState(!!initial && initial.maxPartySize !== defaultSize);
  const [tried, setTried] = useState(false);

  const phoneRes = phone.trim() ? normalisePhone(phone) : null;
  const dupe = phoneRes?.ok ? existing.find((p) => p.phone === phoneRes.e164 && p.id !== initial?.id) : undefined;
  const sides = useMemo(() => [...new Set(existing.map((p) => p.side).filter(Boolean))] as string[], [existing]);
  const nameErr = tried && !name.trim() ? t('pfNameRequired') : null;
  const phoneErr = phoneRes && !phoneRes.ok ? t('pfBadPhone') : isAppError(error) && error.field === 'phone' ? errorMessage(error) : null;

  // Capacity counts allowed people (companions included); editing frees this party's current allowance first.
  const limit = eventId ? guestLimit(eventId) : 0;
  const usedElsewhere = allocatedGuests(existing) - (initial?.maxPartySize ?? 0);
  const left = Math.max(0, limit - usedElsewhere), after = limit - usedElsewhere - size;
  const growing = size > (initial?.maxPartySize ?? 0);
  const capacityNote = !eventId || !growing ? null : after < 0
    ? <Banner tone="warning" compact title={t('pfOverTitle')}>{t('pfOverText', { size: n(size, 'person', true), left: n(left, 'person'), when: t(initial ? 'pfWhenSave' : 'pfWhenAdd') })}</Banner>
    : capacityLevel(usedElsewhere + size, limit) !== 'ok' ? <p className="field-hint capacity-form-hint" role="status">{t('pfAfter', { when: t(initial ? 'pfWhenSave' : 'pfWhenAdd'), after: n(after, 'person'), limit: n(limit, 'person') })}</p>
    : null;

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
      footer={<><Button variant="primary" type="submit" form="party-form" loading={pending}>{t(initial ? 'pfSaveEdits' : 'pfAdd')}</Button><Button variant="ghost" onClick={onClose}>{t('cancel')}</Button></>}>
      <form id="party-form" className="stack gap-4" onSubmit={submit} noValidate>
        {error && !(isAppError(error) && error.field) ? <Banner tone="danger" reveal={error}>{errorMessage(error)}</Banner> : null}
        <Field label={t('pfName')} required error={nameErr} hint={t('pfNameHint')}>
          <Input value={name} onChange={(e) => setName(e.target.value)} data-autofocus autoComplete="off" />
        </Field>
        <Field label={t('pfPhone')} optional error={phoneErr} hint={phoneRes?.ok ? <>{t('pfWillSave')} <bdi dir="ltr" className="num">{formatPhone(phoneRes.e164)}</bdi></> :t('pfPhoneHint')}>
          <Input ltr type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xxxxxxxx" autoComplete="off" />
        </Field>
        {dupe && <Banner tone="warning" compact title={t('pfDupeTitle')}>{t('pfDupeText', { name: dupe.primaryGuestName })}</Banner>}
        {!sizeOpen ? (
          <button type="button" className="pf-chip"
            onClick={() => { setSizeOpen(true); requestAnimationFrame(() => document.querySelector<HTMLElement>('#party-form .stepper-row button:not(:disabled)')?.focus()); }}>
            <Icon name="users" size="sm" /><span className="sr-only">{t('pfAllowed')}: </span><span>{t('pfAllowedChip', { size: n(size, 'person', true) })}</span>
          </button>
        ) : (
          <>
            <Stepper label={t('pfAllowed')} value={size} min={1} max={20} onChange={setSize} suffix={(k) => t(k === 1 ? 'pfOne' : k === 2 ? 'pfTwo' : 'pfMany')} />
            <p className="field-hint">{t('pfAllowedHint')}</p>
          </>
        )}
        {capacityNote}
        {!more ? (
          <button type="button" className="link-btn" onClick={() => setMore(true)}>{t('pfMore')}</button>
        ) : (
          <>
            <Field label={t('pfCompanions')} optional hint={t('pfCompanionsHint')}><Textarea rows={2} value={companions} onChange={(e) => setCompanions(e.target.value)} /></Field>
            <Field label={t('pfSide')} optional hint={t('pfSideHint')}>
              <Input value={side} onChange={(e) => setSide(e.target.value)} list="sides-list" />
            </Field>
            <datalist id="sides-list">{sides.map((s) => <option key={s} value={s} />)}</datalist>
            <Field label={t('pfNote')} optional><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
          </>
        )}
      </form>
    </Dialog>
  );
}
