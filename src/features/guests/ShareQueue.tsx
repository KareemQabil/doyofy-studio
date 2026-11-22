/**
 * One selected audience, every channel in one sheet (WhatsApp, SMS, copy links, device share), honest delivery.
 *   · WhatsApp/SMS open one composer at a time; the organizer confirms «أرسلت» — opening a composer never counts as sent.
 *   · confirming can open the next guest's message in the same tap («أرسلتها، افتح التالي»), so 10 guests ≈ 11 taps
 *   · progress n/N is visible and resumable (sessionStorage) — «أوقف مؤقتًا وأكمل لاحقًا»
 *   · guests without a valid number get a way out at the end: copy their links together, or add a number
 */
import { useEffect, useMemo, useRef, useState } from 'react';
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

export function ShareQueue({ event, parties, urlFor, linkFor, onClose, onAddPhone }: {
  event: Event; parties: InvitationParty[]; urlFor: (p: InvitationParty) => string | undefined; linkFor?: (p: InvitationParty) => string;
  onClose: (finished: boolean) => void; onAddPhone?: (id: string) => void;
}) {
  const { t, dialect } = useCopy();
  const ready = useMemo(() => parties.filter(p => normalisePhone(p.phone).ok && (linkFor || urlFor(p))), [parties, linkFor, urlFor]);
  const noPhone = useMemo(() => parties.filter(p => !ready.includes(p)), [parties, ready]);
  const ids = ready.map(p => p.id);
  const resumed = useMemo(() => load(event.id, ids), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [channel, setChannel] = useState<Channel | null>(null);
  const [index, setIndex] = useState(resumed?.index ?? 0);
  const [sent, setSent] = useState<string[]>(resumed?.sent ?? []);
  const [skipped, setSkipped] = useState<string[]>(resumed?.skipped ?? []);
  const [opened, setOpened] = useState(false);
  const [message, setMessage] = useState('');
  const [manualCopy, setManualCopy] = useState<string | null>(null);
  const [noPhoneCopied, setNoPhoneCopied] = useState(false);
  const done = index >= ready.length;
  const current = ready[index];
  const following = ready[index + 1];
  const focusRef = useRef<HTMLElement | null>(null);
  useEffect(() => { if (channel) save(event.id, done ? null : { ids, index, sent, skipped, channel }); }, [index, sent, skipped, channel]); // eslint-disable-line react-hooks/exhaustive-deps
  // the next guest arrives ready: its one action (open, or «did you send?» when it was opened in the same tap) takes focus
  useEffect(() => { if (channel) focusRef.current?.focus({ preventScroll: true }); }, [channel, index, opened]);

  const mark = useMutation(async (s, id: string, chained: boolean) => { await s.parties.markShared([id], 'manual'); return { id, chained }; }, {
    onSuccess: ({ id, chained }) => { haptic('success'); setSent(v => [...v, id]); setOpened(chained); setIndex(i => i + 1); },
  });
  const markNoPhone = useMutation((s, list: string[]) => s.parties.markShared(list, 'manual'), {
    onSuccess: () => { haptic('success'); setNoPhoneCopied(false); setMessage(`سجّلنا ${plural(noPhone.length, P.invitation)} مُرسلة يدويًا.`); },
  });
  const skip = () => { if (!current) return; setSkipped(v => [...v, current.id]); setOpened(false); setIndex(i => i + 1); };
  const textFor = (p: InvitationParty) => {
    if (!linkFor) { try { return new URL(urlFor(p) ?? '').searchParams.get('text') ?? ''; } catch { return ''; } }
    return p.rsvpStatus === 'pending' && ['shared', 'opened'].includes(p.delivery.status) ? reminderMessage(event, p, linkFor(p), dialect) : inviteMessage(event, p, linkFor(p), dialect);
  };
  const composer = (p?: InvitationParty) => !p ? undefined : channel === 'sms' ? smsUrl(p.phone, textFor(p)) : whatsappUrl(p.phone, textFor(p));
  const linksOf = (list: InvitationParty[]) => linkFor ? list.map(p => `${p.primaryGuestName}\n${linkFor(p)}`).join('\n\n') : list.map(textFor).join('\n\n');
  const copyLinks = async (list: InvitationParty[], done: string) => {
    if (await copyText(linksOf(list))) { setManualCopy(null); setMessage(done); return true; }
    setManualCopy(linksOf(list)); setMessage('حدّد النص وانسخه يدويًا.'); return false;
  };
  const nativeShare = async () => {
    try { await navigator.share({ title: event.title, text: linksOf(parties) }); setMessage('انتهت المشاركة من جهازك. لم نغيّر حالة الإرسال تلقائيًا.'); }
    catch (e) { if (!(e instanceof DOMException && e.name === 'AbortError')) setMessage('تعذّرت المشاركة. يمكنك نسخ الروابط.'); }
  };
  const target = channel === 'whatsapp' ? '_blank' : undefined;
  const status = <>
    {message && <p role="status" className="field-hint">{message}</p>}
    {manualCopy && <textarea className="input" rows={6} readOnly value={manualCopy} aria-label="روابط الدعوات" onFocus={e => e.currentTarget.select()} />}
  </>;
  // guests whose invitation cannot go by WhatsApp/SMS: copy their links together, or add a number — never a dead end
  const withoutPhone = noPhone.length > 0 && <section className="sq-missing" aria-labelledby="sq-missing-h">
    <h3 id="sq-missing-h"><Icon name="info" size="sm" />{plural(noPhone.length, P.invitation)} بلا رقم جوال صحيح</h3>
    <p className="faint t-sm">انسخ روابطها معًا وأرسلها بطريقتك، أو أضف رقمًا ثم شاركها من القائمة.</p>
    <div className="row gap-2 wrap">
      <Button icon="copy" onClick={async () => setNoPhoneCopied(await copyLinks(noPhone, `نسخنا روابط ${plural(noPhone.length, P.invitation)}. أرسلها بطريقتك؛ لم تتغير حالة الإرسال.`))}>{t('copyTheirLinks')}</Button>
      {noPhoneCopied && <Button variant="ghost" icon="check" loading={markNoPhone.pending} onClick={() => void markNoPhone.run(noPhone.map(p => p.id))}>أرسلتها، سجّلها مُرسلة</Button>}
    </div>
    {markNoPhone.error ? <p className="text-danger t-sm" role="alert">{errorMessage(markNoPhone.error)}</p> : null}
    {onAddPhone && <ul className="sq-missing-list">{noPhone.map(p => <li key={p.id}><span>{p.primaryGuestName}</span><Button size="sm" variant="ghost" icon="plus" onClick={() => onAddPhone(p.id)} aria-label={`${t('addPhone')} — ${p.primaryGuestName}`}>{t('addPhone')}</Button></li>)}</ul>}
  </section>;

  return <Dialog open variant="drawer" onClose={() => onClose(channel ? done : false)} className="share-queue"
    title={channel ? done ? 'انتهت قائمة المشاركة' : channel === 'sms' ? 'مشاركة برسالة نصية' : 'مشاركة عبر واتساب' : t('shareOptions')}
    description={channel ? undefined : `${plural(parties.length, P.invitation)} محددة`}>
    {!channel ? <div className="stack gap-4">
      <p className="muted">اختر طريقة واحدة للمحددين. لكل ضيف رابطه الشخصي.</p>
      <div className="action-grid">
        <Button variant="primary" icon="chat" disabled={!ready.length} onClick={() => setChannel('whatsapp')}>{t('sendWhatsapp')} · {ready.length}</Button>
        <Button icon="phone" disabled={!ready.length} onClick={() => setChannel('sms')}>{t('sendSms')} · {ready.length}</Button>
        <Button icon="copy" onClick={() => void copyLinks(parties, 'تم نسخ روابط المحددين. لم تتغير حالة الإرسال.')}>نسخ روابط المحددين</Button>
        {typeof navigator.share === 'function' && <Button icon="share" onClick={() => void nativeShare()}>مشاركة من الجهاز</Button>}
      </div>
      {noPhone.length > 0 && (ready.length ? <p className="sq-note"><Icon name="info" size="sm" />{plural(noPhone.length, P.invitation)} بلا رقم صحيح. نعرض لها حلًا في آخر القائمة.</p> : withoutPhone)}
      {resumed && index > 0 && index < ready.length && <p className="faint t-sm">تقدّم محفوظ: {index} من {ready.length}. اختر قناة لتكمل من حيث توقفت.</p>}
      <p className="faint t-sm">يفتح واتساب أو SMS رسالة واحدة في كل مرة. أنت ترسلها وتؤكد الإرسال. قد تطول الرسالة بسبب رابط التجربة، وتُطبّق تكلفة شركة الاتصالات على SMS.</p>
      {status}
    </div> : <>
      <ProgressBar value={Math.min(index, ready.length)} max={Math.max(1, ready.length)} tone="success" label="تقدم المشاركة" />
      {done || !current ? <div className="sq-done">
        <span className="sq-done-seal" aria-hidden="true"><Icon name="check" /></span>
        <p><b>{plural(sent.length, P.invitation)}</b> سجّلتها مُرسلة يدويًا{skipped.length ? ` · تخطيت ${skipped.length}` : ''}.</p>
        <p className="faint t-sm">هذه حالة أكّدتها أنت؛ فتح تطبيق الرسائل وحده لا يثبت الإرسال أو التسليم.</p>
        {withoutPhone}
        {status}
        <Button variant="primary" block onClick={() => { save(event.id, null); onClose(true); }}>{t('done')}</Button>
      </div> : <div className="sq-card" key={current.id}>
        <p className="sq-count num" aria-live="polite">{index + 1} / {ready.length}</p>
        <p className="sq-name">{current.primaryGuestName}</p><bdi className="sq-phone num" dir="ltr">{formatPhone(current.phone!)}</bdi>
        {!opened ? <div className="sq-actions">
          <a ref={el => { focusRef.current = el; }} className="btn btn-primary btn-lg btn-block sq-open" href={composer(current)} target={target} rel="noopener noreferrer" onClick={() => { haptic('snap'); setOpened(true); }}>
            <Icon name={channel === 'sms' ? 'phone' : 'chat'} />{t('openMessage')}</a>
          <Button variant="ghost" onClick={skip}>تخطَّ هذه الدعوة</Button>
        </div> : <div className="sq-actions" role="group" aria-label="هل أرسلت الرسالة؟">
          <p className="sq-ask">هل أرسلت الرسالة إلى {current.primaryGuestName}؟</p>
          {/* one tap: record this one as sent (explicit) and open the next guest's composer */}
          {following ? <a ref={el => { focusRef.current = el; }} className={`btn btn-primary btn-lg btn-block sq-confirm${mark.pending ? ' is-loading' : ''}`} href={composer(following)} target={target} rel="noopener noreferrer" aria-disabled={mark.pending || undefined}
            onClick={(e) => { if (mark.pending) { e.preventDefault(); return; } haptic('snap'); void mark.run(current.id, true); }}>
            <Icon name="check" />{t('sentOpenNext')}<span className="sq-next-name">{following.primaryGuestName}</span></a>
            : <Button ref={el => { focusRef.current = el; }} variant="primary" size="lg" block icon="check" loading={mark.pending} onClick={() => void mark.run(current.id, false)}>{t('manualSent')}</Button>}
          <div className="row gap-2 wrap">
            {following && <Button loading={mark.pending} onClick={() => void mark.run(current.id, false)}>أرسلتها فقط</Button>}
            <Button onClick={() => setOpened(false)}>افتحها مرة أخرى</Button>
            <Button variant="ghost" onClick={skip}>لم أرسلها، تخطَّ</Button>
          </div>
        </div>}
        {mark.error ? <p className="text-danger t-sm" role="alert">{errorMessage(mark.error)} — لم نسجّل شيئًا، حاول مجددًا.</p> : null}
        <div className="sq-foot">
          <Button variant="ghost" size="sm" onClick={() => { setChannel(null); setOpened(false); }}>تغيير طريقة المشاركة</Button>
          <button type="button" className="sq-pause" onClick={() => onClose(false)}><Icon name="clock" size="sm" />أوقف مؤقتًا وأكمل لاحقًا</button>
        </div>
      </div>}
    </>}
  </Dialog>;
}
