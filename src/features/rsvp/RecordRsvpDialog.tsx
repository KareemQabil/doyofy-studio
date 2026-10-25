/** Organizer records a reply received outside the link (phone call, in person). Bounded by the party's allowance. */
import { useState } from 'react';
import type { InvitationParty } from '../../domain/types';
import { validateRsvp, RSVP_ERROR_TEXT } from '../../domain/parties';
import { Banner, Button, ChoiceGroup, Dialog, Field, Stepper, Textarea } from '../../ui';
import { useMutation } from '../../app/data';
import { useToast } from '../../ui/primitives/Feedback';
import { errorMessage } from '../../services/errors';
import { people, peopleOf } from '../../domain/format';

export function RecordRsvpDialog({ party, onClose }: { party: InvitationParty; onClose: () => void }) {
  const toast = useToast();
  const [attending, setAttending] = useState<'yes' | 'no' | null>(party.rsvpStatus === 'confirmed' ? 'yes' : party.rsvpStatus === 'declined' ? 'no' : null);
  const [count, setCount] = useState(Math.min(party.maxPartySize, party.confirmedPartySize || party.maxPartySize));
  const [note, setNote] = useState('');
  const [tried, setTried] = useState(false);
  const save = useMutation((s, a: boolean, n: number, nt: string) => s.rsvp.setByOrganizer(party.id, { attending: a, count: n, note: nt || undefined }), {
    onSuccess: (p) => { toast({ tone: 'success', text: p.rsvpStatus === 'confirmed' ? `تم تسجيل حضور ${p.primaryGuestName} — ${people(p.confirmedPartySize ?? 0)}` : `تم تسجيل اعتذار ${p.primaryGuestName}` }); onClose(); },
  });
  const err = attending === 'yes' ? validateRsvp({ attending: true, count }, party.maxPartySize) : null;
  return (
    <Dialog open onClose={onClose} title="تسجيل الرد يدويًا" description={`${party.primaryGuestName} · الدعوة تسمح بـ${peopleOf(party.maxPartySize)}`} size="sm"
      footer={<><Button variant="primary" loading={save.pending} onClick={() => { setTried(true); if (attending && !err) void save.run(attending === 'yes', count, note); }}>حفظ الرد</Button><Button variant="ghost" onClick={onClose}>إلغاء</Button></>}>
      {save.error ? <Banner tone="danger">{errorMessage(save.error)}</Banner> : null}
      <ChoiceGroup label="هل سيحضرون؟" value={attending} onChange={setAttending} error={tried && !attending ? 'اختر الحضور أو الاعتذار' : null}
        options={[{ value: 'yes', label: 'سيحضرون' }, { value: 'no', label: 'معتذرون' }]} />
      {attending === 'yes' && <Stepper label="عدد الحضور" value={count} min={1} max={party.maxPartySize} onChange={setCount} />}
      {err && <p className="field-error">{RSVP_ERROR_TEXT[err]}</p>}
      <Field label="ملاحظة" optional hint="مثل: أكدت بالهاتف"><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
    </Dialog>
  );
}
