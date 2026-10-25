/** Personal home: one upcoming occasion, its next step, then the rest of your occasions. */
import { useReviewSettings } from '../../app/review';
import { HorizonHome } from '../horizon/HorizonHome';
import { BahjaHome } from '../bahja/BahjaHome';
import { OrbitHome } from '../orbit/OrbitHome';
import { SignatureHome } from '../signature/SignatureHome';
import { useState } from 'react';
import type { Event } from '../../domain/types';
import { eventPhase, eventTypeInfo, PHASE_LABEL, todayFor } from '../../domain/event';
import { countdownLabel, formatEventDate, formatTime, P, plural } from '../../domain/format';
import { defaultDesign, publishState, toInvitationData } from '../../domain/invitation';
import { AppShell, EmptyState, ErrorState, Icon, LinkButton, Skeleton, Status } from '../../ui';
import { Link } from '../../app/router';
import { useNow } from '../../app/data';
import { paths } from '../../app/paths';
import { useDesign, useEvents } from '../shared/queries';
import { UserChip } from '../workspace/EventWorkspace';
import { TemplateThumb } from '../templates/TemplateThumb';
import { ThemeArtwork } from '../../ui/primitives/ThemeArtwork';
import { OccasionArtwork as OccasionArt } from '../occasions/OccasionArtwork';

function EventCard({ event: e, featured = false }: { event: Event; featured?: boolean }) {
  const now = useNow();
  const design = useDesign(e.id);
  const phase = eventPhase(e, now);
  const content = design.data?.draft ?? defaultDesign(e);
  const ps = publishState(design.data);
  const past = phase === 'completed' || phase === 'archived';
  const action = past ? 'استعد لحظات المناسبة' : phase === 'event_day' ? 'افتح الاستقبال' : ps === 'none' || ps === 'draft' ? 'أكمل تجهيز الدعوة' : 'تابع تجهيز المناسبة';
  const to = past ? paths.summary(e.id) : phase === 'event_day' ? paths.gate(e.id) : ps === 'none' || ps === 'draft' ? paths.design(e.id) : paths.overview(e.id);
  return <article className={`occasion-event${featured ? ' is-featured' : ''}${past ? ' is-past' : ''}`}>
    <div className="occasion-event-art" aria-hidden="true">
      {featured && <><ThemeArtwork eager className="hero-world"/><span className="hero-halo"/><span className="hero-halo halo-two"/><span className="hero-art-label">{eventTypeInfo(e.type).label} · {e.date.slice(0,4)}</span></>}
      {featured ? <div className="event-poster"><TemplateThumb preset={{ id: e.id, name: '', line: '', styles: [], occasionTags: [], cardId: content.cardId, sceneId: content.sceneId, experience: content.experience }} invitation={toInvitationData(e, content, 2)} /></div> : <OccasionArt type={e.type} />}
      {featured && <span className="poster-caption">دعوة تليق بحكايتكم</span>}
    </div>
    <div className="occasion-event-content">
      <div className="event-eyebrow"><span>{featured ? 'مناسبتك القادمة' : eventTypeInfo(e.type).label}</span><Status tone={PHASE_LABEL[phase].tone}>{past ? PHASE_LABEL[phase].label : countdownLabel(e.date, todayFor(e, now))}</Status></div>
      <h2><Link to={paths.overview(e.id)}>{e.title}</Link></h2>
      <p className="event-date-line"><Icon name="calendar" size="sm" />{formatEventDate(e.date)}<span className="num">· {formatTime(e.time)}</span></p>
      <p className="event-place-line"><Icon name="pin" size="sm" />{e.venue.name}، {e.venue.city}</p>
      {featured && <p className="event-card-note">{phase === 'event_day' ? 'اليوم تكتمل الحكاية. كل ما يحتاجه فريق الاستقبال في مكان واحد.' : ps === 'published' || ps === 'changed' ? 'دعوتك جاهزة. تابع الردود ورتّب التفاصيل الصغيرة، لتستمتع باللحظة الكبيرة.' : 'البداية صارت جاهزة. أضف لمستك للدعوة، وبعدها نجمع أحبابك.'}</p>}
      <div className="event-card-bottom">
        <LinkButton to={to} variant={featured ? 'primary' : 'ghost'} iconEnd="forward">{action}</LinkButton>
        {featured && <Link to={paths.overview(e.id)} className="link-btn">تفاصيل المناسبة</Link>}
      </div>
    </div>
  </article>;
}

export function EventsHome(){const {theme}=useReviewSettings();return theme==='signature'?<SignatureHome/>:theme==='horizon'?<HorizonHome/>:theme==='orbit'?<OrbitHome/>:theme==='bahja'?<BahjaHome/>:<EditorialHome/>;}

function EditorialHome() {
  const events = useEvents();
  const now = useNow();
  const [showPast, setShowPast] = useState(false);
  const list = events.data ?? [];
  const active = list.filter(e => !['completed', 'archived'].includes(eventPhase(e, now))).sort((a,b) => a.date.localeCompare(b.date));
  const past = list.filter(e => ['completed', 'archived'].includes(eventPhase(e, now))).sort((a,b) => b.date.localeCompare(a.date));
  return <AppShell right={<UserChip />}>
    <main id="main" className="page events-home" tabIndex={-1}>
      <header className="events-intro">
        <div><p className="eyebrow">ضيوفي · مساحة لفرحتك</p><h1>مناسباتك،<br/>على ذوقك.</h1><p>من أول دعوة، لآخر ضيف. كل شيء في مكانه.</p></div>
        <LinkButton to={paths.newEvent} variant="primary" icon="plus" size="lg">مناسبة جديدة</LinkButton>
      </header>
      {events.loading ? <Skeleton lines={6} block /> : events.error ? <ErrorState error={events.error} onRetry={events.refetch} /> : list.length === 0 ? <div className="home-empty"><EmptyState icon="sparkle" title="لأول مناسبة… وأجمل بداية" action={<LinkButton to={paths.newEvent} variant="primary" icon="plus">ابدأ مناسبتك الأولى</LinkButton>}>اختر المناسبة، وجهّز دعوتك. ثم نرتّب رحلة ضيوفك خطوة بخطوة.</EmptyState></div> : <>
        {active[0] && <EventCard event={active[0]} featured />}
        <section className="home-collection" aria-labelledby="home-occasions">
          <div className="collection-heading"><h2 id="home-occasions">{active.length > 1 ? 'حكايات أخرى قادمة' : 'مساحة لفرحة جديدة'}</h2><span>{plural(active.length, {zero:'لا مناسبات قادمة',one:'مناسبة واحدة قادمة',two:'مناسبتان قادمتان',few:'# مناسبات قادمة',many:'# مناسبة قادمة',other:'# مناسبة قادمة'})}</span></div>
          <div className="event-collection-grid">
            {active.slice(1).map(e => <EventCard key={e.id} event={e} />)}
            <Link to={paths.newEvent} className="new-occasion-tile"><span className="new-occasion-plus"><Icon name="plus" /></span><span><strong>ما مناسبتك القادمة؟</strong><small>زفاف، تخرج، أو لمّة أحباب</small></span><Icon name="forward" size="sm" /></Link>
          </div>
        </section>
        {past.length > 0 && <section className="home-archive"><button type="button" onClick={() => setShowPast(v=>!v)} aria-expanded={showPast} className="archive-toggle"><Icon name="archive" size="sm" /><span>مناسبات تبقى في الذاكرة</span><span className="num">{past.length}</span><Icon name={showPast ? 'chevron-up' : 'chevron-down'} size="sm" /></button>{showPast && <div className="event-collection-grid">{past.map(e=><EventCard key={e.id} event={e} />)}</div>}</section>}
      </>}
      <footer className="home-note"><Icon name="sparkle" size="sm" /><p>أنت تعيش اللحظة. وضيوفي يرتّب التفاصيل.</p><Link to="/prototype/design-review">جولة في التجربة</Link></footer>
    </main>
  </AppShell>;
}
