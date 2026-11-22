/**
 * Guest link /i/<slug>[/<code>] — no account, ever (spec §14, §18).
 *  - not replied yet → the cinematic invitation; its RSVP goes to the organizer's data (GuestApi)
 *  - replied → the event hub (status, QR, edit reply, date, directions, program, table)
 *  - general link (no code) → invitation with a name field; replies wait for the organizer to match them
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toInvitationData } from '../../domain/invitation';
import type { GuestApi, GuestView } from '../../services/contracts';
import { createPortableGuestApi, decodePortableView } from '../../domain/portable-invite';
import { decodeConfig } from '../../data/invite-link.js';
import { errorMessage, isAppError } from '../../services/errors';
import { Button, EmptyState, PageLoader } from '../../ui';
import { useServices } from '../../app/data';
import { useLocation } from '../../app/router';
import { loadEngine } from '../invitation/engine';
import { GuestHub } from './GuestHub';
import { SealCover } from '../signature/SealCover';
import { FollowUpSheet, asksFollowUp, followUpPayload, type FollowUp } from './GuestExtras';
import { DemoNote } from './DemoNote';
import { GuestVoice, useCopy } from '../../ui/copy';

type EngineReply = { name: string; attending: boolean; guests: number };
type EngineResult = { ok: true; id: string; demo?: boolean } | { ok: false; error: string; notice?: boolean };

type Submission = { ok: true; name?: string } | { ok: false; error: string } | null;

export function GuestInvite({ slug, code }: { slug: string; code?: string }) {
  const services = useServices();
  const loc = useLocation();
  const carried = loc.search.get('d');
  const portable = useMemo(() => {
    return carried ? decodePortableView(carried, slug, code) : null;
  }, [carried, slug, code]);
  const legacyCarried = useMemo(() => carried ? decodeConfig(carried) : null, [carried]);
  const guestApi = useMemo(() => {
    if (!portable) return services.guest;
    let storage: Storage | undefined;
    try { storage = localStorage; } catch { /* local-only reply remains usable */ }
    return createPortableGuestApi(portable, storage);
  }, [portable, services]);
  const [view, setView] = useState<GuestView | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [mode, setMode] = useState<'loading' | 'cover' | 'invitation' | 'hub'>('loading');
  const [submission, setSubmission] = useState<Submission>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const v = await guestApi.open(slug, code);
      setView(v);
      const play = loc.search.get('play') != null;
      if (v.phase === 'after') setMode('hub');
      else if (play) setMode('invitation');
      else setMode(v.party && v.party.rsvpStatus !== 'pending' ? 'hub' : 'cover');
    } catch (e) { setError(e); }
  }, [guestApi, slug, code]); // eslint-disable-line react-hooks/exhaustive-deps

  // a shared link carries the invitation itself (?d=). There is no server behind this prototype, so a reply made from it
  // can never reach the organizer: open the carried copy, whose reply screen says plainly that it is a demo (Q1).
  useEffect(() => { if (carried && !portable && legacyCarried) location.replace(`${new URL('./', document.baseURI).href}?i=${encodeURIComponent(carried)}`); }, [carried, portable, legacyCarried]);
  useEffect(() => { if (carried && !portable) return; document.body.classList.add('dy-guest'); void load(); return () => document.body.classList.remove('dy-guest'); }, [load, carried, portable]);

  if (carried && !portable) return <main className="guest-page theme-guest guest-center">{legacyCarried ? <PageLoader name="envelope" label="جارٍ فتح الدعوة" size={96} /> : <EmptyState icon="alert" title="الرابط غير مكتمل">اطلبوا رابط الدعوة مرة أخرى من صاحب المناسبة.</EmptyState>}</main>;
  if (error) {
    const notPublished = isAppError(error) && error.code === 'not_published';
    return (
      <main className="guest-page theme-guest guest-center">
        <EmptyState icon={notPublished ? 'clock' : 'envelope'} title={notPublished ? 'الدعوة غير متاحة بعد' : 'لم نجد هذه الدعوة'}
          action={isAppError(error) && error.code === 'network' ? <Button onClick={() => void load()}>أعد المحاولة</Button> : undefined}>
          {errorMessage(error)}
        </EmptyState>
      </main>
    );
  }
  if (!view || mode === 'loading') return <main className="guest-page theme-guest guest-center"><PageLoader name="envelope" label="جارٍ فتح الدعوة" size={96} /></main>;
  // every guest page speaks the organizer's voice, carried with the invitation (GuestView.dialect), on any device
  return (
    <GuestVoice dialect={view.dialect}>
      {mode === 'cover' ? <SealCover view={view} onOpen={() => setMode('invitation')} onDetails={() => setMode('hub')} />
        : mode === 'hub' ? <GuestHub view={view} code={code ?? null} submission={submission} onView={setView} onReplay={() => { setSubmission(null); setMode('invitation'); }} guestApi={guestApi} demo={!!portable} />
        : <InvitationPlayer view={view} code={code ?? null} guestApi={guestApi} demo={!!portable}
          onSubmitted={(v, s) => { if (v) setView(v); setSubmission(s); }}
          onDone={() => setMode('hub')} />}
    </GuestVoice>
  );
}


/** after the thank-you screen has had its moment, the cinematic path moves on to the same success page as the direct one */
const DONE_HOLD_MS = 2800;

function InvitationPlayer({ view, code, onSubmitted, onDone, guestApi, demo = false }: { view: GuestView; code: string | null; onSubmitted: (v: GuestView | null, s: Submission) => void; onDone: () => void; guestApi?: GuestApi; demo?: boolean }) {
  const services = useServices();
  const { t } = useCopy();
  const host = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<unknown>(null);
  // the reply waits here while the guest answers the follow-up questions; the engine keeps its "sending" state meanwhile
  const [held, setHeld] = useState<{ r: EngineReply; settle: (res: EngineResult) => void } | null>(null);
  const cb = useRef({ onSubmitted, onDone });
  cb.current = { onSubmitted, onDone };
  const send = async (r: EngineReply, more?: FollowUp): Promise<EngineResult> => {
    const count = r.attending ? r.guests : 0;
    try {
      const v = await (guestApi ?? services.guest).submitRsvp(view.event.slug, code, { name: r.name, attending: r.attending, count, ...(more ? followUpPayload(view, r.attending, count, more) : {}) });
      cb.current.onSubmitted(v, { ok: true, name: r.name });
      return { ok: true, id: v.responseId, ...(demo ? { demo: true } : {}) };
    } catch (e) {
      cb.current.onSubmitted(null, { ok: false, error: errorMessage(e) });
      return { ok: false, error: errorMessage(e) };
    }
  };
  const sendRef = useRef(send);
  sendRef.current = send;

  useEffect(() => {
    let studio: { destroy(): void } | null = null;
    let alive = true;
    const p = view.party;
    loadEngine().then((eng) => {
      if (!alive || !host.current) return;
      studio = new eng.Studio(host.current, {
        invitation: toInvitationData(view.event, view.design, view.maxGuests),
        card: view.design.cardId, scene: view.design.sceneId, experience: view.design.experience,
        showSwitcher: false, params: new URLSearchParams(), voice: view.dialect ?? 'ar',
        guest: p ? { name: p.name, nameLocked: true, maxGuests: p.maxPartySize, attending: p.rsvpStatus === 'confirmed' ? 'yes' : p.rsvpStatus === 'declined' ? 'no' : null, guests: p.confirmedPartySize || undefined } : { maxGuests: view.maxGuests },
        doneAction: { ar: p ? t('guestYourDetails') : t('ghContinue'), en: p ? 'Your details' : 'Continue', autoAfter: DONE_HOLD_MS, onClick: () => cb.current.onDone() },
        rsvp: {
          // the same follow-up as the direct form (companions, food, message) before the one and only submit
          submit: (r) => {
            if (asksFollowUp(view, r.attending, r.attending ? r.guests : 0)) return new Promise<EngineResult>((settle) => setHeld({ r, settle }));
            return sendRef.current(r);
          },
        },
      });
      (window as unknown as { __studio?: unknown }).__studio = studio;
      // the cover that opened the invitation is gone: keyboard focus moves onto the card instead of dropping to the page
      const active = document.activeElement;
      if (!active || active === document.body || !active.isConnected) host.current.querySelector<HTMLButtonElement>('.st-cardbtn')?.focus({ preventScroll: true });
    }).catch(setErr);
    return () => { alive = false; studio?.destroy(); };
  }, [view.event.slug, code]); // eslint-disable-line react-hooks/exhaustive-deps

  if (err) return <main className="guest-page theme-guest guest-center"><EmptyState icon="alert" title="تعذر تشغيل الدعوة" action={<Button onClick={onDone}>{t('guestFastTrack')}</Button>}>{errorMessage(err)}</EmptyState></main>;
  return (
    <>
      {/* one bar above the stage: nothing of ours ever sits on the invitation or its own controls */}
      <header className="guest-bar theme-guest">
        {demo && <DemoNote compact />}
        <button type="button" className="guest-fast-track" onClick={onDone}>{t('guestFastTrack')}</button>
      </header>
      <div ref={host} className="guest-studio has-bar" />
      {held && (
        <FollowUpSheet view={view} attending={held.r.attending} count={held.r.attending ? held.r.guests : 0}
          onBack={() => { held.settle({ ok: false, error: t('ghNotSent'), notice: true }); setHeld(null); }}
          onSend={async (more) => {
            const res = await sendRef.current(held.r, more);
            if (!res.ok) return res.error;
            held.settle(res); setHeld(null);
            return null;
          }} />
      )}
    </>
  );
}
