/**
 * Event settings (spec §19) — limited on purpose: basics, date/time, venue & map, reply rules,
 * table visibility, invitation state, archive. One save bar; leaving with unsaved edits asks first.
 */
import { useEffect, useRef, useState } from 'react';
import type { Event, EventType, UpdateEventInput } from '../../domain/types';
import { EVENT_TYPES, isCoupleEvent, suggestTitle } from '../../domain/event';
import { PUBLISH_LABEL, publishState } from '../../domain/invitation';
import { PUBLISH_KEY } from '../../domain/copy/activity';
import { Badge, Banner, Button, ConfirmDialog, Field, Input, LinkButton, PageHeader, Panel, Select, Stepper, Switch } from '../../ui';
import { useMutation, useServices } from '../../app/data';
import { useBlocker, useLocation, useNavigate } from '../../app/router';
import { paths } from '../../app/paths';
import { useToast } from '../../ui/primitives/Feedback';
import { errorMessage, isAppError } from '../../services/errors';
import { useDesign, useParties } from '../shared/queries';
import { CapacityMeter, useCapacityVersion } from '../billing/CapacityMeter';
import { ReceiptList } from '../billing/Receipt';
import { receiptsFor } from '../../domain/billing';
import { localDateOf } from '../../domain/format';
import { TIME_ZONES } from '../events/CreateEvent';
import { GuestExperienceSettings } from './GuestExperienceSettings';
import { useCopy } from '../../ui/copy';

type Form = {
  type: EventType; title: string; a: string; b: string; aEn: string; bEn: string; date: string; time: string; timeZone: string; durationHours: number;
  venue: string; city: string; venueEn: string; cityEn: string; mapUrl: string; defaultPartySize: number; revealTableToGuests: boolean; allowGeneralLink: boolean;
};
const fromEvent = (e: Event): Form => ({
  type: e.type, title: e.title, a: e.names.a, b: e.names.b ?? '', aEn: e.names.aEn ?? '', bEn: e.names.bEn ?? '', date: e.date, time: e.time, timeZone: e.timeZone, durationHours: e.durationHours,
  venue: e.venue.name, city: e.venue.city, venueEn: e.venue.nameEn ?? '', cityEn: e.venue.cityEn ?? '', mapUrl: e.venue.mapUrl ?? '',
  defaultPartySize: e.settings.defaultPartySize, revealTableToGuests: e.settings.revealTableToGuests, allowGeneralLink: e.settings.allowGeneralLink,
});

export function SettingsPage({ event }: { event: Event }) {
  const services = useServices();
  const design = useDesign(event.id);
  const toast = useToast();
  const { t } = useCopy();
  const navigate = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState<Form>(() => fromEvent(event));
  const [archiveOpen, setArchiveOpen] = useState(false);
  const mapRef = useRef<HTMLInputElement>(null);
  const base = fromEvent(event);
  const dirty = JSON.stringify(f) !== JSON.stringify(base);
  useBlocker(dirty, t('setLeave'));
  useEffect(() => {
    if (loc.search.get('focus') === 'map') setTimeout(() => { mapRef.current?.focus(); mapRef.current?.scrollIntoView({ block: 'center' }); }, 150);
    if (loc.search.get('focus') === 'guest-experience') setTimeout(() => document.getElementById('guest-experience')?.scrollIntoView({ block: 'start' }), 150);
    if (loc.search.get('focus') === 'capacity') setTimeout(() => document.getElementById('capacity')?.scrollIntoView({ block: 'start' }), 150);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation((s, input: UpdateEventInput) => s.events.update(event.id, input), { onSuccess: (e) => { setF(fromEvent(e)); toast({ tone: 'success', text: t('setSaved') }); } });
  const archive = useMutation((s) => (event.archivedAt ? s.events.restore(event.id) : s.events.archive(event.id)), {
    onSuccess: (e) => { setArchiveOpen(false); toast({ tone: 'neutral', text: t(e.archivedAt ? 'setArchived' : 'setRestored') }); if (e.archivedAt) navigate(paths.events, { force: true }); },
  });
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const couple = isCoupleEvent(f.type);
  const err = (field: string) => (isAppError(save.error) && save.error.field === field ? save.error.message : null);
  const ps = publishState(design.data);
  const today = localDateOf(services.clock.now(), f.timeZone);

  const submit = () => void save.run({
    type: f.type, title: f.title.trim() || suggestTitle(f.type, { a: f.a, b: f.b }),
    names: { a: f.a.trim(), b: couple ? f.b.trim() || undefined : undefined, aEn: f.aEn.trim() || undefined, bEn: couple ? f.bEn.trim() || undefined : undefined },
    date: f.date, time: f.time, timeZone: f.timeZone, durationHours: f.durationHours,
    venue: { name: f.venue.trim(), city: f.city.trim(), nameEn: f.venueEn.trim() || undefined, cityEn: f.cityEn.trim() || undefined, mapUrl: f.mapUrl.trim() || undefined },
    settings: { defaultPartySize: f.defaultPartySize, revealTableToGuests: f.revealTableToGuests, allowGeneralLink: f.allowGeneralLink },
  });
  const missing = !f.a.trim() || (couple && !f.b.trim()) || !f.venue.trim() || !f.city.trim() || !f.date || !f.time;
  const badMap = !!f.mapUrl.trim() && !/^https?:\/\//.test(f.mapUrl.trim());

  return (
    <>
      <PageHeader title={t('setTitle')} subtitle={t('setSub')} />
      <form className="stack gap-6 settings" onSubmit={(e) => { e.preventDefault(); if (!missing && !badMap) submit(); }} noValidate>
        {save.error && !(isAppError(save.error) && save.error.field) ? <Banner tone="danger" title={t('setNotSaved')}>{errorMessage(save.error)}</Banner> : null}
        <Panel title={t('setBasics')}>
          <div className="stack gap-4">
            <div className="grid-2">
              <Field label={t('setType')}><Select value={f.type} onChange={(e) => set('type', e.target.value as EventType)}>{EVENT_TYPES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</Select></Field>
              <Field label={t('setEventTitle')} hint={t('setEventTitleHint')}><Input value={f.title} onChange={(e) => set('title', e.target.value)} placeholder={suggestTitle(f.type, { a: f.a, b: f.b })} /></Field>
            </div>
            <div className="grid-2">
              <Field label={t(couple ? 'setFirstName' : 'setHost')} required error={!f.a.trim() ? t('setRequired') : null}><Input value={f.a} onChange={(e) => set('a', e.target.value)} /></Field>
              {couple && <Field label={t('setSecondName')} required error={!f.b.trim() ? t('setRequired') : null}><Input value={f.b} onChange={(e) => set('b', e.target.value)} /></Field>}
              <Field label={t('setEnglish')} optional><Input ltr value={f.aEn} onChange={(e) => set('aEn', e.target.value)} /></Field>
              {couple && <Field label={t('setEnglish')} optional><Input ltr value={f.bEn} onChange={(e) => set('bEn', e.target.value)} /></Field>}
            </div>
          </div>
        </Panel>

        <Panel title={t('setWhen')}>
          <div className="grid-3">
            <Field label={t('setDate')} required error={err('date')}><Input type="date" value={f.date} min={today} onChange={(e) => set('date', e.target.value)} /></Field>
            <Field label={t('setTime')} required><Input type="time" value={f.time} onChange={(e) => set('time', e.target.value)} /></Field>
            <Field label={t('setZone')}><Select value={f.timeZone} onChange={(e) => set('timeZone', e.target.value)}>{TIME_ZONES.map(([z, l]) => <option key={z} value={z}>{l}</option>)}</Select></Field>
          </div>
          <Stepper label={t('setDuration')} value={f.durationHours} min={1} max={12} onChange={(n) => set('durationHours', n)} />
        </Panel>

        <Panel title={t('setWhere')}>
          <div className="stack gap-4">
            <div className="grid-2">
              <Field label={t('setVenue')} required error={!f.venue.trim() ? t('setRequired') : null}><Input value={f.venue} onChange={(e) => set('venue', e.target.value)} /></Field>
              <Field label={t('setCity')} required error={!f.city.trim() ? t('setRequired') : null}><Input value={f.city} onChange={(e) => set('city', e.target.value)} /></Field>
              <Field label={t('setVenueEn')} optional><Input ltr value={f.venueEn} onChange={(e) => set('venueEn', e.target.value)} /></Field>
              <Field label={t('setCityEn')} optional><Input ltr value={f.cityEn} onChange={(e) => set('cityEn', e.target.value)} /></Field>
            </div>
            <Field label={t('setMap')} optional error={badMap ? t('setMapHttps') : null} hint={t('setMapHint')}>
              <Input ref={mapRef} ltr type="url" value={f.mapUrl} onChange={(e) => set('mapUrl', e.target.value)} placeholder="https://maps.app.goo.gl/…" />
            </Field>
          </div>
        </Panel>

        <Panel title={t('setReplies')}>
          <div className="stack gap-3">
            <Stepper label={t('setDefaultSize')} value={f.defaultPartySize} min={1} max={20} onChange={(n) => set('defaultPartySize', n)} />
            <p className="field-hint">{t('setDefaultSizeHint')}</p>
            <Switch label={t('setShowTable')} hint={t('setShowTableHint')} checked={f.revealTableToGuests} onChange={(v) => set('revealTableToGuests', v)} />
            <Switch label={t('setGeneral')} hint={t('setGeneralHint')} checked={f.allowGeneralLink} onChange={(v) => set('allowGeneralLink', v)} />
          </div>
        </Panel>

        {dirty && (
          <div className="save-bar" role="region" aria-label={t('setSaveRegion')}>
            <span className="t-sm">{t('setUnsaved')}</span>
            <div className="row gap-2">
              <Button variant="ghost" onClick={() => setF(base)}>{t('setDiscard')}</Button>
              <Button variant="primary" type="submit" loading={save.pending} disabled={missing || badMap}>{t('setSaveChanges')}</Button>
            </div>
          </div>
        )}
      </form>

      {/* saved on its own: the guest-facing questions have their own revision (D11) */}
      <div className="stack gap-6 settings">
        <GuestExperienceSettings event={event} />

        <CapacitySettings event={event} />

        <Panel title={t('setInvitation')}>
          <div className="row wrap between gap-3">
            <Badge tone={PUBLISH_LABEL[ps].tone} dot>{t(PUBLISH_KEY[ps])}</Badge>
            <LinkButton to={paths.invitation(event.id)} size="sm">{t('setManageInvitation')}</LinkButton>
          </div>
        </Panel>

        <Panel className="settings-archive" title={t(event.archivedAt ? 'setArchivedTitle' : 'setArchive')}>
          <div className="row wrap between gap-3">
            <p className="muted t-sm grow">{t(event.archivedAt ? 'setArchivedText' : 'setArchiveText')}</p>
            {services.session.currentUser().role === 'organizer'
              ? <Button variant={event.archivedAt ? 'secondary' : 'ghost'} icon="archive" onClick={() => setArchiveOpen(true)}>{t(event.archivedAt ? 'setRestore' : 'setArchiveShort')}</Button>
              : <p className="faint t-sm">{t('setOwnerOnly')}</p>}
          </div>
        </Panel>
      </div>
      {archive.error ? <Banner tone="danger" title={t('setStateFailed')}>{errorMessage(archive.error)}</Banner> : null}
      <ConfirmDialog open={archiveOpen} title={t(event.archivedAt ? 'setRestoreQ' : 'setArchiveQ')} tone={event.archivedAt ? 'primary' : 'danger'}
        body={t(event.archivedAt ? 'setRestoreBody' : 'setArchiveBody')}
        confirmLabel={t(event.archivedAt ? 'setRestoreShort' : 'setArchiveShort')} loading={archive.pending} onCancel={() => setArchiveOpen(false)} onConfirm={() => void archive.run()} />
    </>
  );
}

/** Plan and demo receipts for this event (the 100 free people include companions). */
function CapacitySettings({ event }: { event: Event }) {
  const parties = useParties(event.id);
  useCapacityVersion();
  const { t } = useCopy();
  return <Panel id="capacity" title={t('setCapacity')}>
    <div className="stack gap-4">
      {parties.data ? <CapacityMeter eventId={event.id} parties={parties.data} alwaysOfferUpgrade receiptLink={false} /> : null}
      <ReceiptList receipts={receiptsFor(event.id)} />
    </div>
  </Panel>;
}
