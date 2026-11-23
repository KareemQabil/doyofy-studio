/**
 * Event settings (spec §19) — limited on purpose, and nothing asked twice. The event's details (names, date, time,
 * place, map) live in ONE place, the editor's «النص»: here they are a short summary row that opens it. What remains
 * are the options only — occasion type and title, time zone and duration, reply rules (people per invitation, the
 * table, the general link). One save bar; leaving with unsaved edits asks first. Guest experience, capacity and
 * archiving follow, each saved on its own.
 */
import { useEffect, useState } from 'react';
import type { Event, EventType, UpdateEventInput } from '../../domain/types';
import { EVENT_TYPES, hasVenue, namesLine, placeLine, suggestTitle } from '../../domain/event';
import { formatEventDate, formatTime } from '../../domain/format';
import { Banner, Button, ConfirmDialog, Field, Icon, Input, PageHeader, Panel, Select, Stepper, Switch } from '../../ui';
import { Link } from '../../app/router';
import { useMutation, useServices } from '../../app/data';
import { useBlocker, useLocation, useNavigate } from '../../app/router';
import { paths } from '../../app/paths';
import { useToast } from '../../ui/primitives/Feedback';
import { errorMessage, isAppError } from '../../services/errors';
import { useParties } from '../shared/queries';
import { CapacityMeter, useCapacityVersion } from '../billing/CapacityMeter';
import { ReceiptList } from '../billing/Receipt';
import { receiptsFor } from '../../domain/billing';
import { TIME_ZONES } from '../events/CreateEvent';
import { GuestExperienceSettings } from './GuestExperienceSettings';
import { useCopy } from '../../ui/copy';

type Form = {
  type: EventType; title: string; timeZone: string; durationHours: number; defaultPartySize: number; revealTableToGuests: boolean; allowGeneralLink: boolean;
};
const fromEvent = (e: Event): Form => ({
  type: e.type, title: e.title, timeZone: e.timeZone, durationHours: e.durationHours,
  defaultPartySize: e.settings.defaultPartySize, revealTableToGuests: e.settings.revealTableToGuests, allowGeneralLink: e.settings.allowGeneralLink,
});

export function SettingsPage({ event }: { event: Event }) {
  const services = useServices();
  const toast = useToast();
  const { t } = useCopy();
  const navigate = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState<Form>(() => fromEvent(event));
  const [archiveOpen, setArchiveOpen] = useState(false);
  const base = fromEvent(event);
  const dirty = JSON.stringify(f) !== JSON.stringify(base);
  useBlocker(dirty, t('setLeave'));
  useEffect(() => {
    // the place (and its map link) is edited with the other details, in the editor's «النص»
    if (loc.search.get('focus') === 'map') navigate(paths.design(event.id, 'content'), { replace: true });
    if (loc.search.get('focus') === 'guest-experience') setTimeout(() => document.getElementById('guest-experience')?.scrollIntoView({ block: 'start' }), 150);
    if (loc.search.get('focus') === 'capacity') setTimeout(() => document.getElementById('capacity')?.scrollIntoView({ block: 'start' }), 150);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation((s, input: UpdateEventInput) => s.events.update(event.id, input), { onSuccess: (e) => { setF(fromEvent(e)); toast({ tone: 'success', text: t('setSaved') }); } });
  const archive = useMutation((s) => (event.archivedAt ? s.events.restore(event.id) : s.events.archive(event.id)), {
    onSuccess: (e) => { setArchiveOpen(false); toast({ tone: 'neutral', text: t(e.archivedAt ? 'setArchived' : 'setRestored') }); if (e.archivedAt) navigate(paths.events, { force: true }); },
  });
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const err = (field: string) => (isAppError(save.error) && save.error.field === field ? errorMessage(save.error) : null);
  const names = { a: event.names.a, b: event.names.b };

  const submit = () => void save.run({
    type: f.type, title: f.title.trim() || suggestTitle(f.type, names), timeZone: f.timeZone, durationHours: f.durationHours,
    settings: { defaultPartySize: f.defaultPartySize, revealTableToGuests: f.revealTableToGuests, allowGeneralLink: f.allowGeneralLink },
  });
  // the details as guests read them, in one line: «سارة وأحمد · 16 أبريل · 8:00 مساءً · قاعة الريم»
  const summary = [namesLine({ ...event, type: f.type }), formatEventDate(event.date, { weekday: false }), formatTime(event.time), hasVenue(event.venue) ? placeLine(event.venue) : null].filter(Boolean).join(' · ');

  return (
    <>
      <PageHeader title={t('setTitle')} subtitle={t('setSub')} />
      <form className="stack gap-6 settings" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
        {save.error && !(isAppError(save.error) && save.error.field) ? <Banner tone="danger" title={t('setNotSaved')}>{errorMessage(save.error)}</Banner> : null}
        {/* the details live in the invitation's «النص» (one source of truth): a summary that opens it, never a second form */}
        <Link to={paths.design(event.id, 'content')} className="settings-details" aria-label={`${t('setDetailsRow')} · ${t('setDetailsWhere')} — ${summary}`}>
          <span className="settings-details-icon" aria-hidden="true"><Icon name="edit" size="sm" /></span>
          <span className="grow"><span className="settings-details-title">{t('setDetailsRow')} <span className="settings-details-where">· {t('setDetailsWhere')}</span></span><span className="settings-details-line">{summary}</span></span>
          <Icon name="forward" size="sm" />
        </Link>

        <Panel title={t('setOccasion')}>
          <div className="stack gap-4">
            <div className="grid-2">
              <Field label={t('setType')}><Select value={f.type} onChange={(e) => set('type', e.target.value as EventType)}>{EVENT_TYPES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</Select></Field>
              <Field label={t('setEventTitle')} hint={t('setEventTitleHint')} error={err('title')}><Input value={f.title} onChange={(e) => set('title', e.target.value)} placeholder={suggestTitle(f.type, names)} /></Field>
            </div>
            <div className="grid-2">
              <Field label={t('setZone')}><Select value={f.timeZone} onChange={(e) => set('timeZone', e.target.value)}>{TIME_ZONES.map(([z, l]) => <option key={z} value={z}>{l}</option>)}</Select></Field>
            </div>
            <Stepper label={t('setDuration')} value={f.durationHours} min={1} max={12} onChange={(n) => set('durationHours', n)} />
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
              <Button variant="primary" type="submit" loading={save.pending}>{t('setSaveChanges')}</Button>
            </div>
          </div>
        )}
      </form>

      {/* saved on its own: the guest-facing questions have their own revision (D11) */}
      <div className="stack gap-6 settings">
        <GuestExperienceSettings event={event} />

        <CapacitySettings event={event} />

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
