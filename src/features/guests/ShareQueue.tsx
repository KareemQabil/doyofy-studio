/**
 * One selected audience, every channel in one sheet (WhatsApp, SMS, copy links, device share), honest delivery.
 *   · WhatsApp/SMS open one composer at a time; the organizer confirms «أرسلت» — opening a composer never counts as sent.
 *   · confirming can open the next guest's message in the same tap («أرسلتها، افتح التالي»), so 10 guests ≈ 11 taps
 *   · progress n/N is visible and resumable (sessionStorage) — «أوقف مؤقتًا وأكمل لاحقًا»
 *   · guests without a valid number get a way out at the end: one tap copies their links AND records them as sent
 *     (the button says so; if the clipboard fails, the links show to copy by hand and nothing is recorded until
 *     «أرسلتها»), or add a number
 *   · one short line explains the queue — no stack of disclaimers
 *   · the general link (one link without a name, for groups) can be switched on and copied here, under the channels
 *   · mode «remind»: the same queue with the reply-reminder text; a guest counts as reminded only after «أرسلتها»
 *     (there is no simulated reminder anywhere — opening WhatsApp proves nothing)
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Event, InvitationParty } from '../../domain/types';
import type { Services } from '../../services/contracts';
import { formatPhone } from '../../domain/format';
import { normalisePhone } from '../../domain/phone';
import { Button, Dialog, Icon, ProgressBar } from '../../ui';
import { useMutation } from '../../app/data';
import { errorMessage } from '../../services/errors';
import { haptic } from '../../ui/motion/motion';
import { useCopy } from '../../ui/copy';
import { copyText } from '../shared/CopyField';
import { GeneralLinkCard } from '../shared/GeneralLinkCard';
import { inviteMessage, reminderMessage, smsUrl, whatsappUrl } from './share';

type Channel = 'whatsapp' | 'sms';
interface Saved { ids: string[]; index: number; sent: string[]; skipped: string[]; channel?: Channel }
type Mode = 'invite' | 'remind';
const key = (eventId: string, mode: Mode = 'invite') => mode === 'remind' ? `doyofy:remind-queue:${eventId}` : `doyofy:share-queue:${eventId}`;
const load = (eventId: string, ids: string[], mode: Mode): Saved | null => {
  try { const s = JSON.parse(sessionStorage.getItem(key(eventId, mode)) ?? 'null') as Saved | null; return s && s.ids.join() === ids.join() && Number.isInteger(s.index) && s.index >= 0 && s.index <= ids.length && Array.isArray(s.sent) && Array.isArray(s.skipped) ? s : null; } catch { return null; }
};
const save = (eventId: string, mode: Mode, s: Saved | null) => { try { if (s) sessionStorage.setItem(key(eventId, mode), JSON.stringify(s)); else sessionStorage.removeItem(key(eventId, mode)); } catch { /* current queue remains usable */ } };

export function ShareQueue({ event, parties, urlFor, linkFor, onClose, onAddPhone, mode = 'invite' }: {
  event: Event; parties: InvitationParty[]; urlFor: (p: InvitationParty) => string | undefined; linkFor?: (p: InvitationParty) => string;
  onClose: (finished: boolean) => void; onAddPhone?: (id: string) => void; mode?: Mode;
}) {
  const { t, n, dialect } = useCopy();
  const remind = mode === 'remind';
  const ready = useMemo(() => parties.filter(p => normalisePhone(p.phone).ok && (linkFor || urlFor(p))), [parties, linkFor, urlFor]);
  const noPhone = useMemo(() => parties.filter(p => !ready.includes(p)), [parties, ready]);
  const ids = ready.map(p => p.id);
  const resumed = useMemo(() => load(event.id, ids, mode), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [channel, setChannel] = useState<Channel | null>(null);
  const [index, setIndex] = useState(resumed?.index ?? 0);
  const [sent, setSent] = useState<string[]>(resumed?.sent ?? []);
  const [skipped, setSkipped] = useState<string[]>(resumed?.skipped ?? []);
  const [opened, setOpened] = useState(false);
  const [message, setMessage] = useState('');
  const [manualCopy, setManualCopy] = useState<string | null>(null);
  const [noPhoneCopied, setNoPhoneCopied] = useState(false);
  const [noPhoneDone, setNoPhoneDone] = useState(false);
  const done = index >= ready.length;
  const current = ready[index];
  const following = ready[index + 1];
  const focusRef = useRef<HTMLElement | null>(null);
  useEffect(() => { if (channel) save(event.id, mode, done ? null : { ids, index, sent, skipped, channel }); }, [index, sent, skipped, channel]); // eslint-disable-line react-hooks/exhaustive-deps
  // the next guest arrives ready: its one action (open, or «did you send?» when it was opened in the same tap) takes focus
  useEffect(() => { if (channel) focusRef.current?.focus({ preventScroll: true }); }, [channel, index, opened]);

  // the one write per guest, only after the organizer says they sent it
  const record = (s: Services, list: string[]): Promise<void> => remind ? s.parties.markReminded(list).then(() => undefined) : s.parties.markShared(list, 'manual');
  const mark = useMutation(async (s, id: string, chained: boolean) => { await record(s, [id]); return { id, chained }; }, {
    onSuccess: ({ id, chained }) => { haptic('success'); setSent(v => [...v, id]); setOpened(chained); setIndex(i => i + 1); },
  });
  const markNoPhone = useMutation(async (s, list: string[], copied: boolean) => { await record(s, list); return copied; }, {
    onSuccess: (copied) => {
      haptic('success'); setNoPhoneCopied(false); setNoPhoneDone(true); setManualCopy(null);
      const k = n(noPhone.length, 'invitation');
      setMessage(copied ? t(remind ? 'sqCopiedMarkedRemind' : 'sqCopiedMarked', { n: k }) : t(remind ? 'sqRecordedReminders' : 'sqRecordedShared', { n: k }));
    },
  });
  // «انسخ روابطها وسجّلها مُرسلة»: the copy and the record are one action; a failed copy records nothing
  const copyAndMark = async () => {
    if (await copyLinks(noPhone, '')) void markNoPhone.run(noPhone.map(p => p.id), true);
    else setNoPhoneCopied(true);
  };
  const skip = () => { if (!current) return; setSkipped(v => [...v, current.id]); setOpened(false); setIndex(i => i + 1); };
  const textFor = (p: InvitationParty) => {
    if (!linkFor) { try { return new URL(urlFor(p) ?? '').searchParams.get('text') ?? ''; } catch { return ''; } }
    return remind || p.rsvpStatus === 'pending' && ['shared', 'opened'].includes(p.delivery.status) ? reminderMessage(event, p, linkFor(p), dialect) : inviteMessage(event, p, linkFor(p), dialect);
  };
  const composer = (p?: InvitationParty) => !p ? undefined : channel === 'sms' ? smsUrl(p.phone, textFor(p)) : whatsappUrl(p.phone, textFor(p));
  // a reminder copies the whole reminder text (with each guest's link); an invitation copies names + links
  const linksOf = (list: InvitationParty[]) => linkFor && !remind ? list.map(p => `${p.primaryGuestName}\n${linkFor(p)}`).join('\n\n') : list.map(textFor).join('\n\n');
  const copyLinks = async (list: InvitationParty[], done: string) => {
    if (await copyText(linksOf(list))) { setManualCopy(null); setMessage(done); return true; }
    setManualCopy(linksOf(list)); setMessage(t('sqCopyManually')); return false;
  };
  const nativeShare = async () => {
    try { await navigator.share({ title: event.title, text: linksOf(parties) }); setMessage(t('sqDeviceDone')); }
    catch (e) { if (!(e instanceof DOMException && e.name === 'AbortError')) setMessage(t('sqDeviceFailed')); }
  };
  const target = channel === 'whatsapp' ? '_blank' : undefined;
  const status = <>
    {message && <p role="status" className="field-hint">{message}</p>}
    {manualCopy && <textarea className="input" rows={6} readOnly value={manualCopy} aria-label={t('sqLinksLabel')} onFocus={e => e.currentTarget.select()} />}
  </>;
  // guests whose invitation cannot go by WhatsApp/SMS: copy their links together, or add a number — never a dead end
  const withoutPhone = noPhone.length > 0 && <section className="sq-missing" aria-labelledby="sq-missing-h">
    <h3 id="sq-missing-h"><Icon name="info" size="sm" />{t('sqWithoutPhone', { n: n(noPhone.length, 'invitation') })}</h3>
    <p className="faint t-sm">{t('sqWithoutPhoneHint')}</p>
    {!noPhoneDone && <div className="row gap-2 wrap">
      {!noPhoneCopied ? <Button variant={ready.length ? 'secondary' : 'primary'} icon="copy" loading={markNoPhone.pending} onClick={() => void copyAndMark()}>{t(remind ? 'sqCopyAndMarkRemind' : 'sqCopyAndMark')}</Button>
        // the clipboard refused: the links are shown to copy by hand, and they are recorded only on «أرسلتها»
        : <Button variant="primary" icon="check" loading={markNoPhone.pending} onClick={() => void markNoPhone.run(noPhone.map(p => p.id), false)}>{t(remind ? 'sqSentRecordReminder' : 'sqSentRecordShared')}</Button>}
    </div>}
    {markNoPhone.error ? <p className="text-danger t-sm" role="alert">{errorMessage(markNoPhone.error)}</p> : null}
    {onAddPhone && <ul className="sq-missing-list">{noPhone.map(p => <li key={p.id}><span>{p.primaryGuestName}</span><Button size="sm" variant="ghost" icon="plus" onClick={() => onAddPhone(p.id)} aria-label={`${t('addPhone')} — ${p.primaryGuestName}`}>{t('addPhone')}</Button></li>)}</ul>}
  </section>;

  return <Dialog open variant="drawer" onClose={() => onClose(channel ? done : false)} className="share-queue"
    title={remind ? t(channel ? done ? 'sqRemindDone' : channel === 'sms' ? 'sqRemindSms' : 'sqRemindWhatsapp' : 'sqRemindTitle')
      : channel ? t(done ? 'sqShareDone' : channel === 'sms' ? 'sqShareSms' : 'sqShareWhatsapp') : t('shareOptions')}
    description={channel ? undefined : t(remind ? 'sqWaiting' : 'sqSelected', { n: n(parties.length, 'invitation') })}>
    {!channel ? <div className="stack gap-4">
      {ready.length > 0 && <p className="muted t-sm">{t('sqOneLine')}{noPhone.length > 0 ? t('sqNoPhoneLine', { n: n(noPhone.length, 'invitation') }) : ''}</p>}
      <div className="action-grid">
        {/* nobody with a number: no dead «واتساب · 0» buttons — the links below are the way */}
        {ready.length > 0 && <><Button variant="primary" icon="chat" onClick={() => setChannel('whatsapp')}>{t('sendWhatsapp')} · {ready.length}</Button>
        <Button icon="phone" onClick={() => setChannel('sms')}>{t('sendSms')} · {ready.length}</Button></>}
        {/* with nobody reachable by number, the «without a number» box below already offers the copy — no second button */}
        {ready.length > 0 && <Button icon="copy" onClick={() => void copyLinks(parties, t(remind ? 'sqCopiedReminders' : 'sqCopiedLinks'))}>{t(remind ? 'sqCopyReminders' : 'sqCopyLinks')}</Button>}
        {typeof navigator.share === 'function' && <Button icon="share" onClick={() => void nativeShare()}>{t('pdDeviceShare')}</Button>}
      </div>
      {noPhone.length > 0 && !ready.length && withoutPhone}
      {/* one link without a name, for groups: its switch and the link to copy (it used to sit on the invitation page) */}
      {!remind && <GeneralLinkCard event={event} />}
      {resumed && index > 0 && index < ready.length && <p className="faint t-sm">{t('sqResume', { i: index, n: ready.length })}</p>}
      {status}
    </div> : <>
      <ProgressBar value={Math.min(index, ready.length)} max={Math.max(1, ready.length)} tone="success" label={t('sqProgress')} />
      {done || !current ? <div className="sq-done">
        <span className="sq-done-seal" aria-hidden="true"><Icon name="check" /></span>
        <p>{t(remind ? 'sqReminded' : 'sqMarked', { n: n(sent.length, 'invitation') })}{skipped.length ? t('sqSkipped', { n: skipped.length }) : ''}.</p>
        {withoutPhone}
        {status}
        <Button variant="primary" block onClick={() => { save(event.id, mode, null); onClose(true); }}>{t('done')}</Button>
      </div> : <div className="sq-card" key={current.id}>
        <p className="sq-count num" aria-live="polite">{index + 1} / {ready.length}</p>
        <p className="sq-name">{current.primaryGuestName}</p><bdi className="sq-phone num" dir="ltr">{formatPhone(current.phone!)}</bdi>
        {!opened ? <div className="sq-actions">
          <a ref={el => { focusRef.current = el; }} className="btn btn-primary btn-lg btn-block sq-open" href={composer(current)} target={target} rel="noopener noreferrer" onClick={() => { haptic('snap'); setOpened(true); }}>
            <Icon name={channel === 'sms' ? 'phone' : 'chat'} />{t('openMessage')}</a>
          <Button variant="ghost" onClick={skip}>{t('sqSkip')}</Button>
        </div> : <div className="sq-actions" role="group" aria-label={t('glDidSend')}>
          <p className="sq-ask">{t(remind ? 'sqAskRemind' : 'sqAskSend', { name: current.primaryGuestName })}</p>
          {/* one tap: record this one as sent (explicit) and open the next guest's composer */}
          {following ? <a ref={el => { focusRef.current = el; }} className={`btn btn-primary btn-lg btn-block sq-confirm${mark.pending ? ' is-loading' : ''}`} href={composer(following)} target={target} rel="noopener noreferrer" aria-disabled={mark.pending || undefined}
            onClick={(e) => { if (mark.pending) { e.preventDefault(); return; } haptic('snap'); void mark.run(current.id, true); }}>
            <Icon name="check" />{t('sentOpenNext')}<span className="sq-next-name">{following.primaryGuestName}</span></a>
            : <Button ref={el => { focusRef.current = el; }} variant="primary" size="lg" block icon="check" loading={mark.pending} onClick={() => void mark.run(current.id, false)}>{remind ? t('remindSent') : t('manualSent')}</Button>}
          <div className="row gap-2 wrap">
            {following && <Button loading={mark.pending} onClick={() => void mark.run(current.id, false)}>{t('sqSentOnly')}</Button>}
            <Button onClick={() => setOpened(false)}>{t('sqOpenAgain')}</Button>
            <Button variant="ghost" onClick={skip}>{t('sqNotSent')}</Button>
          </div>
        </div>}
        {mark.error ? <p className="text-danger t-sm" role="alert">{errorMessage(mark.error)}{t('sqNothingSaved')}</p> : null}
        <div className="sq-foot">
          <Button variant="ghost" size="sm" onClick={() => { setChannel(null); setOpened(false); }}>{t('sqChangeWay')}</Button>
          <button type="button" className="sq-pause" onClick={() => onClose(false)}><Icon name="clock" size="sm" />{t('sqPause')}</button>
        </div>
      </div>}
    </>}
  </Dialog>;
}
