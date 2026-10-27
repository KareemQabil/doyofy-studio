/**
 * Sequential manual sharing (feedback F044/F045, decision D12/D13).
 * One invitation at a time: open WhatsApp with the prepared message, then the organizer says whether they
 * sent it. Opening WhatsApp is never recorded as delivered; «أرسلتها» records a MANUAL share.
 * The queue can be paused and resumed (position kept for this browser tab only), and invitations without
 * a phone number are skipped visibly, not silently.
 */
import { useEffect, useMemo, useState } from 'react';
import type { Event, InvitationParty } from '../../domain/types';
import { formatPhone, plural, P } from '../../domain/format';
import { Button, Dialog, Icon, ProgressBar } from '../../ui';
import { useMutation } from '../../app/data';
import { errorMessage } from '../../services/errors';
import { haptic } from '../../ui/motion/motion';

type Step = 'ready' | 'opened';
interface Saved { ids: string[]; index: number; sent: string[]; skipped: string[] }
const key = (eventId: string) => `doyofy:share-queue:${eventId}`;
const load = (eventId: string, ids: string[]): Saved | null => {
  try { const s = JSON.parse(sessionStorage.getItem(key(eventId)) ?? 'null') as Saved | null; return s && s.ids.join() === ids.join() ? s : null; } catch { return null; }
};
const save = (eventId: string, s: Saved | null) => { try { if (s) sessionStorage.setItem(key(eventId), JSON.stringify(s)); else sessionStorage.removeItem(key(eventId)); } catch { /* storage unavailable: the queue simply restarts */ } };

export function ShareQueue({ event, parties, urlFor, onClose }: { event: Event; parties: InvitationParty[]; urlFor: (p: InvitationParty) => string | undefined; onClose: (finished: boolean) => void }) {
  const ready = useMemo(() => parties.filter((p) => urlFor(p)), [parties, urlFor]);
  const missing = parties.length - ready.length;
  const ids = ready.map((p) => p.id);
  const resumed = useMemo(() => load(event.id, ids), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [index, setIndex] = useState(resumed?.index ?? 0);
  const [sent, setSent] = useState<string[]>(resumed?.sent ?? []);
  const [skipped, setSkipped] = useState<string[]>(resumed?.skipped ?? []);
  const [step, setStep] = useState<Step>('ready');
  const done = index >= ready.length;
  const current = ready[index];
  useEffect(() => { save(event.id, done ? null : { ids, index, sent, skipped }); }, [index, sent, skipped]); // eslint-disable-line react-hooks/exhaustive-deps

  const mark = useMutation(async (s, id: string) => { await s.parties.markShared([id], 'manual'); return id; }, {
    onSuccess: (id) => { haptic('success'); setSent((v) => [...v, id]); setStep('ready'); setIndex((i) => i + 1); },
  });
  const skip = () => { if (!current) return; haptic('tick'); setSkipped((v) => [...v, current.id]); setStep('ready'); setIndex((i) => i + 1); };
  const url = current ? urlFor(current) : undefined;

  return (
    <Dialog open variant="drawer" onClose={() => onClose(done)} className="share-queue"
      title={done ? 'انتهت قائمة المشاركة' : 'مشاركة بالتتابع'}
      description={done ? undefined : `${index + 1} من ${ready.length}${resumed && index > 0 ? ' · أكملنا من حيث توقفت' : ''}`}>
      <ProgressBar value={Math.min(index, ready.length)} max={Math.max(1, ready.length)} tone="success" label="تقدم المشاركة" />
      {missing > 0 && <p className="sq-note"><Icon name="info" size="sm" />{plural(missing, P.invitation)} بلا رقم جوال أو قبل النشر — لن تظهر هنا.</p>}
      {done || !current ? (
        <div className="sq-done">
          <span className="sq-done-seal" aria-hidden="true"><Icon name="check" /></span>
          <p><b>{plural(sent.length, P.invitation)}</b> سجّلتها مُرسلة يدويًا{skipped.length ? ` · تخطيت ${skipped.length}` : ''}.</p>
          <p className="faint t-sm">هذه حالة سجّلتها أنت؛ لا نعرف ما حدث داخل واتساب. حالة «فتح الدعوة» تظهر عندما يفتح الضيف رابطه.</p>
          <Button variant="primary" block onClick={() => { save(event.id, null); onClose(true); }}>تم</Button>
        </div>
      ) : (
        <div className="sq-card" key={current.id}>
          <p className="sq-name">{current.primaryGuestName}</p>
          {current.phone && <bdi className="sq-phone num" dir="ltr">{formatPhone(current.phone)}</bdi>}
          {step === 'ready' ? (
            <div className="sq-actions">
              <a className="btn btn-primary btn-lg btn-block sq-open" href={url} target="_blank" rel="noopener noreferrer" onClick={() => { haptic('snap'); setStep('opened'); }}><Icon name="chat" />افتح واتساب برسالة جاهزة</a>
              <Button variant="ghost" onClick={skip}>تخطَّ هذه الدعوة</Button>
            </div>
          ) : (
            <div className="sq-actions" role="group" aria-label="هل أرسلت الرسالة؟">
              <p className="sq-ask">هل أرسلت الرسالة من واتساب؟</p>
              <Button variant="primary" size="lg" block icon="check" loading={mark.pending} onClick={() => void mark.run(current.id)}>نعم، أرسلتها — التالي</Button>
              <div className="row gap-2"><Button variant="secondary" onClick={() => setStep('ready')}>افتحها مرة أخرى</Button><Button variant="ghost" onClick={skip}>لم أرسلها، تخطَّ</Button></div>
            </div>
          )}
          {mark.error ? <p className="text-danger t-sm" role="alert">{errorMessage(mark.error)} — لم نسجّل شيئًا، حاول مجددًا.</p> : null}
          <button type="button" className="sq-pause" onClick={() => onClose(false)}><Icon name="clock" size="sm" />أوقف مؤقتًا وأكمل لاحقًا</button>
        </div>
      )}
    </Dialog>
  );
}
