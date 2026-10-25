/**
 * Guest link /i/<slug>[/<code>] — no account, ever (spec §14, §18).
 *  - not replied yet → the cinematic invitation; its RSVP goes to the organizer's data (GuestApi)
 *  - replied → the event hub (status, QR, edit reply, date, directions, program, table)
 *  - general link (no code) → invitation with a name field; replies wait for the organizer to match them
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { toInvitationData } from '../../domain/invitation';
import type { GuestView } from '../../services/contracts';
import { errorMessage, isAppError } from '../../services/errors';
import { Button, EmptyState, Spinner } from '../../ui';
import { useServices } from '../../app/data';
import { useLocation } from '../../app/router';
import { loadEngine } from '../invitation/engine';
import { GuestHub } from './GuestHub';
import { SealCover } from '../signature/SealCover';
import { useReviewSettings } from '../../app/review';

type Submission = { ok: true; name?: string } | { ok: false; error: string } | null;

export function GuestInvite({ slug, code }: { slug: string; code?: string }) {
  const services = useServices();
  const loc = useLocation();
  const [view, setView] = useState<GuestView | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [mode, setMode] = useState<'loading' | 'cover' | 'invitation' | 'hub'>('loading');
  const { theme } = useReviewSettings();
  const [submission, setSubmission] = useState<Submission>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const v = await services.guest.open(slug, code);
      setView(v);
      const play = loc.search.get('play') != null;
      if (v.phase === 'after') setMode('hub');
      else if (play) setMode('invitation');
      else setMode(v.party && v.party.rsvpStatus !== 'pending' ? 'hub' : theme === 'signature' ? 'cover' : 'invitation');
    } catch (e) { setError(e); }
  }, [services, slug, code]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { document.body.classList.add('dy-guest'); void load(); return () => document.body.classList.remove('dy-guest'); }, [load]);

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
  if (!view || mode === 'loading') return <main className="guest-page theme-guest guest-center"><Spinner label="جارٍ فتح الدعوة" /></main>;
  if (mode === 'cover') return <SealCover view={view} onOpen={() => setMode('invitation')} onDetails={() => setMode('hub')} />;
  if (mode === 'hub') return <GuestHub view={view} code={code ?? null} submission={submission} onView={setView} onReplay={() => setMode('invitation')} />;
  return (
    <InvitationPlayer view={view} code={code ?? null}
      onSubmitted={(v, s) => { if (v) setView(v); setSubmission(s); }}
      onDone={() => setMode('hub')} />
  );
}

function InvitationPlayer({ view, code, onSubmitted, onDone }: { view: GuestView; code: string | null; onSubmitted: (v: GuestView | null, s: Submission) => void; onDone: () => void }) {
  const services = useServices();
  const host = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<unknown>(null);
  const cb = useRef({ onSubmitted, onDone });
  cb.current = { onSubmitted, onDone };

  useEffect(() => {
    let studio: { destroy(): void } | null = null;
    let alive = true;
    const p = view.party;
    loadEngine().then((eng) => {
      if (!alive || !host.current) return;
      studio = new eng.Studio(host.current, {
        invitation: toInvitationData(view.event, view.design, view.maxGuests),
        card: view.design.cardId, scene: view.design.sceneId, experience: view.design.experience,
        showSwitcher: false, params: new URLSearchParams(),
        guest: p ? { name: p.name, nameLocked: true, maxGuests: p.maxPartySize, attending: p.rsvpStatus === 'confirmed' ? 'yes' : p.rsvpStatus === 'declined' ? 'no' : null, guests: p.confirmedPartySize || undefined } : { maxGuests: view.maxGuests },
        doneAction: { ar: p ? 'تفاصيل حضوركم' : 'متابعة', en: p ? 'Your details' : 'Continue', onClick: () => cb.current.onDone() },
        rsvp: {
          submit: async (r) => {
            try {
              const v = await services.guest.submitRsvp(view.event.slug, code, { name: r.name, attending: r.attending, count: r.attending ? r.guests : 0 });
              cb.current.onSubmitted(v, { ok: true, name: r.name });
              return { ok: true, id: v.responseId };
            } catch (e) {
              cb.current.onSubmitted(null, { ok: false, error: errorMessage(e) });
              return { ok: false, error: errorMessage(e) };
            }
          },
        },
      });
      (window as unknown as { __studio?: unknown }).__studio = studio;
    }).catch(setErr);
    return () => { alive = false; studio?.destroy(); };
  }, [view.event.slug, code]); // eslint-disable-line react-hooks/exhaustive-deps

  if (err) return <main className="guest-page theme-guest guest-center"><EmptyState icon="alert" title="تعذر تشغيل الدعوة" action={<Button onClick={onDone}>الموعد وتأكيد الحضور</Button>}>{errorMessage(err)}</EmptyState></main>;
  return <><div ref={host} className="guest-studio" /><button type="button" className="guest-fast-track" onClick={onDone}>الموعد وتأكيد الحضور</button></>;
}
