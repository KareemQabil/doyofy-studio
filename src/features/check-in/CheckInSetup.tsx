import { JourneyBanner } from '../shared/JourneyBanner';
import { JourneyArtwork } from '../../ui/primitives/JourneyArtwork';
/**
 * Organizer's check-in page: before the day — prepare the gate (link for staff, try it);
 * on the day — live arrivals, partial parties still expected, and exceptions to review.
 */
import type { Event } from '../../domain/types';
import { countParties } from '../../domain/parties';
import { eventPhase, todayFor } from '../../domain/event';
import { EXCEPTION_TEXT } from '../../domain/checkin';
import { clockTime, countdownLabel, people, peopleOf, plural, P, relativeTime } from '../../domain/format';
import { Badge, Banner, EmptyState, ErrorState, LinkButton, PageHeader, Panel, ProgressBar, Skeleton, Stat } from '../../ui';
import { useMutation, useNow } from '../../app/data';
import { Link, useRouter } from '../../app/router';
import { paths } from '../../app/paths';
import { useCheckIns, useParties } from '../shared/queries';
import { CopyField } from '../shared/CopyField';

export function CheckInSetup({ event }: { event: Event }) {
  const now = useNow();
  const parties = useParties(event.id);
  const records = useCheckIns(event.id);
  const { absolute } = useRouter();
  const prepare = useMutation((s) => s.events.markCheckInPrepared(event.id));
  const phase = eventPhase(event, now);
  if (parties.error || records.error) return <ErrorState error={parties.error || records.error} onRetry={() => { parties.refetch(); records.refetch(); }} />;
  if (parties.loading || records.loading) return <Skeleton lines={6} />;
  const all = parties.data!;
  const c = countParties(all);
  const live = records.data!.filter((r) => !r.undone);
  const exceptions = live.filter((r) => r.exceptions.some((e) => e !== 'no_table'));
  const partial = all.filter((p) => p.checkInStatus === 'partial');
  const notArrived = all.filter((p) => p.rsvpStatus === 'confirmed' && p.checkedInCount === 0);
  const name = (id: string) => all.find((p) => p.id === id)?.primaryGuestName ?? '—';

  return (
    <>
      <PageHeader title="الاستقبال" status={phase === 'event_day' ? <Badge tone="accent" dot>اليوم</Badge> : undefined}
        subtitle={phase === 'event_day' ? 'تابع الوصول لحظة بلحظة' : phase === 'completed' ? 'انتهت المناسبة' : `المناسبة ${countdownLabel(event.date, todayFor(event, now))} — جهّز فريق الاستقبال`}
        actions={<LinkButton to={paths.gate(event.id)} variant="primary" icon="scan" onClick={() => void prepare.run()}>افتح الاستقبال</LinkButton>} />
      <JourneyBanner title="استقبال يليق بضيوفك." line="جهّز فريقك وجرّب شاشة البوابة. لكل ضيف دعوته، ولكل وصول ترحيبه." />

      <div className="stack gap-6">
        {(phase === 'event_day' || phase === 'completed' || c.checkedInPeople > 0) && <div className="counts">
          <div className="counts-checkin">
            <Stat label="وصلوا" value={c.checkedInPeople} sub={`من ${peopleOf(c.confirmedPeople)} مؤكدين`} tone="accent" emphasis />
            <ProgressBar value={c.checkedInPeople} max={Math.max(1, c.confirmedPeople)} tone="success" label="نسبة الوصول" />
          </div>
          <Stat label="دعوات وصلت" value={c.arrivedParties} sub={`من ${c.confirmedParties} مؤكدة`} />
          <Stat label="وصل جزء منها" value={c.partialParties} sub="ينتظر الباقون" tone={c.partialParties ? 'warning' : undefined} />
          <Stat label="لم تصل بعد" value={notArrived.length} sub="دعوات مؤكدة" />
        </div>}

        {phase !== 'event_day' && phase !== 'completed' && (
          <Panel title="استقبال يليق بضيوفك" className="reception-prep">
            <JourneyArtwork kind="reception" className="reception-art"/><div className="stack gap-4"><ol className="reception-steps"><li><strong>١</strong><span>ابحث عن الضيف أو أدخل رمز دعوته</span></li><li><strong>٢</strong><span>تأكد من العدد، والطاولة إن أضفتها</span></li><li><strong>٣</strong><span>سجّل الوصول، ويمكنك التراجع</span></li></ol>
              <p className="muted">شاشة الاستقبال شاشة بسيطة لفريق الاستقبال: مسح رمز QR من دعوة الضيف، أو البحث بالاسم، ثم تسجيل الوصول كاملًا أو جزئيًا. لا يحتاج الفريق إلى صفحة المنظم.</p>
              <CopyField label="رابط شاشة الاستقبال لفريق الاستقبال" value={absolute(paths.gate(event.id))} hint="في النسخة الحقيقية يحتاج الرابط رمز دخول للفريق." onCopied={() => void prepare.run()} />
              {event.checkInPreparedAt ? <Banner tone="success" compact>تم تجهيز شاشة الاستقبال.</Banner> : <p className="faint t-sm">جرّبه الآن مرة واحدة لتطمئن — يمكنك التراجع عن أي تسجيل تجريبي.</p>}
            </div>
          </Panel>
        )}

        {(phase === 'event_day' || phase === 'completed' || live.length > 0) && <><div className="overview-grid">
          <Panel title={`دخول باستثناء (${exceptions.length})`} subtitle="سمح بها فريق الاستقبال بعد التأكد — راجعها">
            {exceptions.length === 0 ? <p className="faint t-sm">لا استثناءات.</p> : (
              <ul className="plain-list">
                {exceptions.map((r) => (
                  <li key={r.id} className="plain-row">
                    <span className="grow">
                      <Link to={paths.guests(event.id, { party: r.partyId })} className="row-title">{name(r.partyId)}</Link>
                      <span className="row-sub">{r.exceptions.filter((e) => e !== 'no_table').map((e) => <Badge key={e} tone="warning">{EXCEPTION_TEXT[e].title}</Badge>)}<span>{people(r.count)} · {r.by}</span></span>
                      {r.staffNote && <span className="row-note t-sm">«{r.staffNote}»</span>}
                    </span>
                    <time className="faint t-xs">{relativeTime(r.at, now)}</time>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title={`ينتظر وصول الباقين (${partial.length})`}>
            {partial.length === 0 ? <p className="faint t-sm">لا توجد دعوات وصل جزء منها.</p> : (
              <ul className="plain-list">
                {partial.map((p) => <li key={p.id} className="plain-row"><span className="grow t-bold">{p.primaryGuestName}</span><span className="num t-sm">{p.checkedInCount} / {p.confirmedPartySize ?? p.maxPartySize}</span></li>)}
              </ul>
            )}
          </Panel>
        </div>

        <Panel title="آخر عمليات الدخول">
          {live.length === 0 ? <EmptyState compact icon="door" title="لم يصل أحد بعد">تظهر هنا كل عملية دخول مع وقتها.</EmptyState> : (
            <ul className="plain-list">
              {live.slice(0, 20).map((r) => (
                <li key={r.id} className="plain-row">
                  <span className="grow"><span className="row-title">{name(r.partyId)}</span><span className="row-sub">{people(r.count)} · {r.method === 'qr' ? 'بالرمز' : 'بالبحث'}</span></span>
                  <time className="faint t-xs num">{clockTime(r.at, event.timeZone)}</time>
                </li>
              ))}
            </ul>
          )}
          {live.length > 20 && <p className="faint t-sm">و{plural(live.length - 20, P.invitation)} أخرى</p>}
        </Panel></>}
      </div>
    </>
  );
}
