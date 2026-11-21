/** One selected audience, explicit channels, and honest manual delivery confirmation. */
import { useEffect, useMemo, useState } from 'react';
import type { Event, InvitationParty } from '../../domain/types';
import { formatPhone, plural, P } from '../../domain/format';
import { normalisePhone } from '../../domain/phone';
import { Button, Dialog, Icon, ProgressBar } from '../../ui';
import { useMutation } from '../../app/data';
import { errorMessage } from '../../services/errors';
import { haptic } from '../../ui/motion/motion';
import { useCopy } from '../../ui/copy';
import { copyText } from '../shared/CopyField';
import { inviteMessage, reminderMessage, smsUrl, whatsappUrl } from './share';

type Channel = 'whatsapp' | 'sms';
interface Saved { ids: string[]; index: number; sent: string[]; skipped: string[]; channel?: Channel }
const key = (eventId: string) => `doyofy:share-queue:${eventId}`;
const load = (eventId: string, ids: string[]): Saved | null => {
  try { const s = JSON.parse(sessionStorage.getItem(key(eventId)) ?? 'null') as Saved | null; return s && s.ids.join() === ids.join() && Number.isInteger(s.index) && s.index >= 0 && s.index <= ids.length && Array.isArray(s.sent) && Array.isArray(s.skipped) ? s : null; } catch { return null; }
};
const save = (eventId: string, s: Saved | null) => { try { if (s) sessionStorage.setItem(key(eventId), JSON.stringify(s)); else sessionStorage.removeItem(key(eventId)); } catch { /* current queue remains usable */ } };

export function ShareQueue({ event, parties, urlFor, linkFor, onClose }: { event: Event; parties: InvitationParty[]; urlFor: (p: InvitationParty) => string | undefined; linkFor?: (p: InvitationParty) => string; onClose: (finished: boolean) => void }) {
  const { t, dialect } = useCopy();
  const ready = useMemo(() => parties.filter(p => normalisePhone(p.phone).ok && (linkFor || urlFor(p))), [parties, linkFor, urlFor]);
  const missing = parties.length - ready.length;
  const ids = ready.map(p => p.id);
  const resumed = useMemo(() => load(event.id, ids), []);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [index, setIndex] = useState(resumed?.index ?? 0);
  const [sent, setSent] = useState<string[]>(resumed?.sent ?? []);
  const [skipped, setSkipped] = useState<string[]>(resumed?.skipped ?? []);
  const [opened, setOpened] = useState(false);
  const [message, setMessage] = useState('');
  const [manualCopy, setManualCopy] = useState(false);
  const done = index >= ready.length;
  const current = ready[index];
  useEffect(() => { if (channel) save(event.id, done ? null : { ids, index, sent, skipped, channel }); }, [index, sent, skipped, channel]);
  const mark = useMutation(async (s, id: string) => { await s.parties.markShared([id], 'manual'); return id; }, {
    onSuccess: id => { haptic('success'); setSent(v => [...v, id]); setOpened(false); setIndex(i => i + 1); },
  });
  const skip = () => { if (!current) return; setSkipped(v => [...v, current.id]); setOpened(false); setIndex(i => i + 1); };
  const textFor = (p: InvitationParty) => {
    if (!linkFor) { try { return new URL(urlFor(p) ?? '').searchParams.get('text') ?? ''; } catch { return ''; } }
    return p.rsvpStatus === 'pending' && ['shared', 'opened'].includes(p.delivery.status) ? reminderMessage(event, p, linkFor(p), dialect) : inviteMessage(event, p, linkFor(p), dialect);
  };
  const url = current ? channel === 'sms' ? smsUrl(current.phone, textFor(current)) : whatsappUrl(current.phone, textFor(current)) : undefined;
  const links = linkFor ? parties.map(p => `${p.primaryGuestName}\n${linkFor(p)}`).join('\n\n') : parties.map(textFor).join('\n\n');
  const nativeShare = async () => {
    try { await navigator.share({ title: event.title, text: links }); setMessage('انتهت المشاركة من جهازك. لم نغيّر حالة الإرسال تلقائيًا.'); }
    catch (e) { if (!(e instanceof DOMException && e.name === 'AbortError')) setMessage('تعذّرت المشاركة. يمكنك نسخ الروابط.'); }
  };
  return <Dialog open variant="drawer" onClose={() => onClose(channel ? done : false)} className="share-queue" title={channel ? done ? 'انتهت قائمة المشاركة' : channel === 'sms' ? 'مشاركة برسالة نصية' : 'مشاركة عبر واتساب' : t('shareOptions')} description={channel && !done ? `${index + 1} من ${ready.length}` : `${plural(parties.length, P.invitation)} محددة`}>
    {!channel ? <div className="stack gap-4">
      <p className="muted">اختر طريقة واحدة للمحددين. لكل ضيف رابطه الشخصي.</p>
      {missing > 0 && <p className="sq-note"><Icon name="info" size="sm" />{plural(missing, P.invitation)} بلا رقم صحيح. يمكنك نسخ روابطها أو مشاركتها من الجهاز.</p>}
      <div className="action-grid">
        <Button variant="primary" icon="chat" disabled={!ready.length} onClick={() => setChannel('whatsapp')}>{t('sendWhatsapp')} · {ready.length}</Button>
        <Button icon="phone" disabled={!ready.length} onClick={() => setChannel('sms')}>{t('sendSms')} · {ready.length}</Button>
        <Button icon="copy" onClick={async () => { if (await copyText(links)) { setMessage('تم نسخ روابط المحددين. لم تتغير حالة الإرسال.'); setManualCopy(false); } else { setManualCopy(true); setMessage('حدّد النص وانسخه يدويًا.'); } }}>نسخ روابط المحددين</Button>
        {typeof navigator.share === 'function' && <Button icon="share" onClick={() => void nativeShare()}>مشاركة من الجهاز</Button>}
      </div>
      {resumed && index > 0 && <p className="faint t-sm">تقدّم محفوظ: {index} من {ready.length}. اختر قناة لتكمل من حيث توقفت.</p>}
      <p className="faint t-sm">يفتح واتساب أو SMS رسالة واحدة في كل مرة. أنت ترسلها وتؤكد الإرسال. قد تطول الرسالة بسبب رابط التجربة، وتُطبّق تكلفة شركة الاتصالات على SMS.</p>
      {message && <p role="status" className="field-hint">{message}</p>}
      {manualCopy && <textarea className="input" rows={6} readOnly value={links} aria-label="روابط الدعوات المحددة" onFocus={e => e.currentTarget.select()} />}
    </div> : <>
      <ProgressBar value={Math.min(index, ready.length)} max={Math.max(1, ready.length)} tone="success" label="تقدم المشاركة" />
      {missing > 0 && <p className="sq-note">{plural(missing, P.invitation)} بلا رقم صحيح — لم تدخل هذه القائمة.</p>}
      {done || !current ? <div className="sq-done"><span className="sq-done-seal" aria-hidden="true"><Icon name="check" /></span><p><b>{plural(sent.length, P.invitation)}</b> سجّلتها مُرسلة يدويًا{skipped.length ? ` · تخطيت ${skipped.length}` : ''}.</p><p className="faint t-sm">هذه حالة أكّدتها أنت؛ فتح تطبيق الرسائل وحده لا يثبت الإرسال أو التسليم.</p><Button variant="primary" block onClick={() => { save(event.id, null); onClose(true); }}>{t('done')}</Button></div> : <div className="sq-card" key={current.id}>
        <p className="sq-name">{current.primaryGuestName}</p><bdi className="sq-phone num" dir="ltr">{formatPhone(current.phone!)}</bdi>
        {!opened ? <div className="sq-actions"><a className="btn btn-primary btn-lg btn-block sq-open" href={url} target={channel === 'whatsapp' ? '_blank' : undefined} rel="noopener noreferrer" onClick={() => { haptic('snap'); setOpened(true); }}><Icon name={channel === 'sms' ? 'phone' : 'chat'} />{t('openMessage')}</a><Button variant="ghost" onClick={skip}>تخطَّ هذه الدعوة</Button></div> : <div className="sq-actions" role="group" aria-label="هل أرسلت الرسالة؟"><p className="sq-ask">هل أرسلت الرسالة؟</p><Button variant="primary" size="lg" block icon="check" loading={mark.pending} onClick={() => void mark.run(current.id)}>{t('manualSent')} — {t('next')}</Button><div className="row gap-2"><Button onClick={() => setOpened(false)}>افتحها مرة أخرى</Button><Button variant="ghost" onClick={skip}>لم أرسلها، تخطَّ</Button></div></div>}
        {mark.error ? <p className="text-danger t-sm" role="alert">{errorMessage(mark.error)} — لم نسجّل شيئًا، حاول مجددًا.</p> : null}
        <Button variant="ghost" size="sm" onClick={() => { setChannel(null); setOpened(false); }}>تغيير طريقة المشاركة</Button><button type="button" className="sq-pause" onClick={() => onClose(false)}><Icon name="clock" size="sm" />أوقف مؤقتًا وأكمل لاحقًا</button>
      </div>}
    </>}
  </Dialog>;
}
