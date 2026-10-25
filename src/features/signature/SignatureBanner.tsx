import { useMemo } from 'react';
import { paths } from '../../app/paths';
import { defaultDesign } from '../../domain/invitation';
import { LinkButton } from '../../ui/primitives/Button';
import { CardThumb } from '../invitation/CardThumb';
import { Motif, Seal } from './SignatureArt';
import { sampleEvent } from './sample-event';
import { useTilt } from './useTilt';

/** Real stationery, live text, official pattern. This is a sample, never an organizer's event. */
export function SignatureBanner() {
  const event = useMemo(() => sampleEvent('graduation'), []);
  const content = useMemo(() => defaultDesign(event), [event]);
  const paper = useTilt<HTMLDivElement>(5);
  return (
    <section className="sig-celebration-banner" aria-labelledby="sig-graduation-title">
      <div className="sig-banner-copy">
        <p className="sig-index"><span className="num">تخرّج</span>لبداية تستاهل الاحتفال</p>
        <h2 id="sig-graduation-title">تعب سنين،<br />وفرحة لها دعوة.</h2>
        <p>دعوة تخرّج جاهزة باسمك. أضف الموعد والمكان، وخلي الباقي علينا.</p>
        <LinkButton to={`${paths.newEvent}?type=graduation`} variant="primary" size="lg" iconEnd="forward">جهّز دعوة تخرّج</LinkButton>
      </div>
      <div className="sig-banner-stationery" data-tilt-zone="">
        <picture className="sig-banner-photo" aria-hidden="true">
          <source srcSet="assets/editorial/graduation-still-life.avif" type="image/avif" />
          <img src="assets/editorial/graduation-still-life.webp" alt="" width="1536" height="1024" loading="lazy" decoding="async" />
        </picture>
        <span className="sig-banner-motif" aria-hidden="true"><Motif name="column" /></span>
        <div ref={paper} className="sig-banner-paper" aria-hidden="true">
          <span className="sig-banner-envelope" />
          <CardThumb event={event} content={content} width={170} />
          <Seal size={70} className="sig-banner-seal" />
        </div>
        <p className="sig-banner-caption">نموذج دعوة · اسمك وتفاصيلك تظهر هنا</p>
      </div>
    </section>
  );
}
