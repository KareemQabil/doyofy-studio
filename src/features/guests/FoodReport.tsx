/**
 * «الطعام» — a lens on the guest list, not another list to keep (F053, F054).
 * Meal totals per person, who has not chosen, dietary needs with their table, and food per table —
 * all derived from the same parties the list shows (D20: no phones here, nothing exported by default).
 */
import { useMemo } from 'react';
import type { Event, InvitationParty, RSVPResponse, Table } from '../../domain/types';
import {
  DIETARY, asksMeals, dietName, dietaryLabel, dietaryReport, experienceOf, foodCsv, hasAllergy, mealReport, mealSummary, type DietaryEntry,
} from '../../domain/guest-experience';
import { useCopy } from '../../ui/copy';
import { Button, EmptyState, Icon, LinkButton } from '../../ui';
import { paths } from '../../app/paths';
import { haptic } from '../../ui/motion/motion';

const TONES = 'abcdef';

export function FoodReport({ event, parties, responses, tables, onOpen, now }: {
  event: Event; parties: InvitationParty[]; responses: RSVPResponse[]; tables: Table[]; onOpen?: (partyId: string) => void; now: Date;
}) {
  const x = experienceOf(event);
  const { t, n: count, dialect } = useCopy();
  const meals = useMemo(() => mealReport(x, parties, responses), [x, parties, responses]);
  const diet = useMemo(() => dietaryReport(parties), [parties]);
  const tableName = (id?: string) => tables.find((t) => t.id === id)?.name ?? '';
  const asks = asksMeals(x);
  if (!asks && !x.dietary.enabled && !meals.rows.some((r) => r.people)) {
    return (
      <EmptyState compact icon="sparkle" title={t('fdEmptyTitle')} action={<LinkButton to={paths.settings(event.id, 'guest-experience')} icon="settings">{t('fdSetup')}</LinkButton>}>
        {t('fdEmptyText')}
      </EmptyState>
    );
  }
  const max = Math.max(1, ...meals.rows.map((r) => r.people), meals.unspecified);
  const exportCsv = () => {
    const csv = foodCsv(x, parties, tableName, now.toLocaleString('ar-SA'));
    const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `food-${event.slug}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    haptic('success');
  };
  const byTable = tables.map((t) => {
    const here = parties.filter((p) => p.tableId === t.id && p.rsvpStatus === 'confirmed');
    const per = new Map<string, number>();
    for (const p of here) for (const a of p.meals ?? []) per.set(a.optionId, (per.get(a.optionId) ?? 0) + a.count);
    return { t, here, per, people: here.reduce((n, p) => n + (p.confirmedPartySize ?? 0), 0), needs: here.filter((p) => p.dietary?.needs.length) };
  }).filter((r) => r.here.length);

  return (
    <div className="food">
      {asks && (
        <section className="food-card food-meals" aria-labelledby="food-meals">
          <header className="food-head">
            <h3 id="food-meals">{t('fdMeals')}</h3>
            <span className="food-total"><strong className="num">{meals.specified}</strong> {t('fdChoseOf', { people: count(meals.confirmedPeople, 'person', true) })}</span>
          </header>
          <ul className="food-bars">
            {meals.rows.map((r, i) => (
              <li key={r.id} className={`food-bar tone-${TONES[x.meals.options.findIndex((o) => o.id === r.id) % 6] ?? TONES[i % 6]}${r.archived ? ' is-archived' : ''}`} style={{ ['--w' as string]: `${(r.people / max) * 100}%` }}>
                <span className="food-bar-label"><span className="gx-swatch" aria-hidden="true" />{r.label}{r.archived && <small>{t('fdHidden')}</small>}</span>
                <span className="food-bar-track" aria-hidden="true"><span /></span>
                <strong className="food-bar-n num">{r.people}</strong>
              </li>
            ))}
            <li className="food-bar is-none" style={{ ['--w' as string]: `${(meals.unspecified / max) * 100}%` }}>
              <span className="food-bar-label">{t('fdNone')}{x.meals.required ? '' : t('fdAllowed')}</span>
              <span className="food-bar-track" aria-hidden="true"><span /></span>
              <strong className="food-bar-n num">{meals.unspecified}</strong>
            </li>
          </ul>
          {meals.review.length > 0 && (
            <div className="food-review" role="note">
              <Icon name="alert" size="sm" />
              <span>{t('fdReviewPre')} {meals.review.map((r, i) => <span key={r.partyId}>{i ? '، ' : ''}{onOpen ? <button type="button" className="food-link" onClick={() => onOpen(r.partyId)}>{r.name}</button> : r.name}</span>)}{t('fdReviewPost')}</span>
            </div>
          )}
          {meals.provisional.people > 0 && (
            <p className="food-provisional">
              <Icon name="clock" size="sm" />
              {t('fdProvisional', { people: count(meals.provisional.people, 'person') })}
              {Object.keys(meals.provisional.byOption).length ? ` — ${x.meals.options.filter((o) => meals.provisional.byOption[o.id]).map((o) => `${meals.provisional.byOption[o.id]} ${o.label}`).join('، ')}` : ''}{t('fdNotCounted')}
            </p>
          )}
        </section>
      )}

      {x.dietary.enabled || diet.entries.length ? (
        <section className="food-card food-diet" aria-labelledby="food-diet">
          <header className="food-head">
            <h3 id="food-diet">{t('fdDiet')}</h3>
            <span className="food-total">{t('fdDietTotals', { invitations: count(diet.entries.length, 'invitation'), none: diet.answeredNone, unanswered: diet.notAnswered })}</span>
          </header>
          {diet.byNeed.length > 0 && (
            <ul className="food-needs" aria-label={t('fdNeedsSummary')}>
              {diet.byNeed.map((b) => (
                <li key={b.need} className={`food-need${DIETARY[b.need].group === 'allergy' ? ' is-allergy' : ''}`}>
                  {DIETARY[b.need].group === 'allergy' && <Icon name="alert" size="sm" />}
                  <span>{dietName(b.need, dialect)}</span>
                  <b className="num">{b.people || ''}{b.unknownPeople ? `${b.people ? '+' : ''}؟` : ''}</b>
                </li>
              ))}
            </ul>
          )}
          {diet.entries.length ? (
            <ul className="food-entries">{diet.entries.map((e) => <DietRow key={e.partyId} e={e} table={tableName(e.tableId)} onOpen={onOpen ? () => onOpen(e.partyId) : undefined} />)}</ul>
          ) : <p className="faint t-sm">{t('fdNoNeeds')}</p>}
          <p className="food-fine"><Icon name="info" size="sm" />{t('fdFine')}</p>
        </section>
      ) : null}

      {byTable.length > 0 && (
        <section className="food-card food-tables" aria-labelledby="food-tables">
          <header className="food-head"><h3 id="food-tables">{t('fdPerTable')}</h3><span className="food-total">{t('fdForServers')}</span></header>
          <ul className="food-table-grid">
            {byTable.map(({ t: table, per, people: n, needs }) => (
              <li key={table.id} className={`food-table${needs.some((p) => hasAllergy(p.dietary)) ? ' has-allergy' : ''}`}>
                <div className="food-table-head"><strong>{table.name}</strong><span className="num">{n}</span></div>
                <div className="food-table-meals">
                  {x.meals.options.filter((o) => per.get(o.id)).map((o) => (
                    <span key={o.id} className={`food-pip tone-${TONES[x.meals.options.indexOf(o) % 6]}`}><span className="gx-swatch" aria-hidden="true" />{per.get(o.id)} {o.label}</span>
                  ))}
                  {!per.size && <span className="faint t-sm">{t('fdNoChoices')}</span>}
                </div>
                {needs.length > 0 && <p className="food-table-needs"><Icon name="alert" size="sm" />{needs.map((p) => `${p.primaryGuestName}: ${p.dietary!.needs.map((k) => dietName(k, dialect)).join('، ')}`).join(' · ')}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="food-actions">
        <Button variant="secondary" icon="download" onClick={exportCsv}>{t('fdExport')}</Button>
        {onOpen && <LinkButton to={paths.settings(event.id, 'guest-experience')} variant="ghost" icon="settings">{t('fdEditQuestions')}</LinkButton>}
        <span className="faint t-sm">{t('fdFooter', { n: x.revision })}</span>
      </div>
    </div>
  );
}

function DietRow({ e, table, onOpen }: { e: DietaryEntry; table: string; onOpen?: () => void }) {
  const { t, n: count, dialect } = useCopy();
  return (
    <li className={`food-entry${e.allergy ? ' is-allergy' : ''}`}>
      {onOpen ? <button type="button" className="food-entry-name" onClick={onOpen}>{e.name}</button> : <strong className="food-entry-name">{e.name}</strong>}
      <span className="food-entry-needs">{e.needs.map((n) => dietName(n, dialect)).join('، ')}{e.affectedCount ? t('fdAffects', { people: count(e.affectedCount, 'person') }) : ''}</span>
      {e.note && <span className="food-entry-note">«{e.note}»</span>}
      <span className={`food-entry-table${table ? '' : ' is-missing'}`}><Icon name="table" size="sm" />{table || t('fdNoTable')}</span>
    </li>
  );
}

/** a dietary need where tables are arranged (F054, T35): it travels with the party, nothing is copied */
export function DietBadge({ p }: { p: InvitationParty }) {
  const { dialect } = useCopy();
  if (p.rsvpStatus !== 'confirmed' || !p.dietary?.needs.length) return null;
  const allergy = hasAllergy(p.dietary);
  return (
    <span className={`seat-diet${allergy ? ' is-allergy' : ''}`} title={dietaryLabel(p.dietary, dialect)}>
      {allergy && <Icon name="alert" size="sm" />}<span className="seat-diet-text">{dietaryLabel(p.dietary, dialect)}</span>
    </span>
  );
}

/** the one-line food summary on a guest card */
export function FoodLine({ event, p }: { event: Event; p: InvitationParty }) {
  const { t, dialect } = useCopy();
  if (p.rsvpStatus !== 'confirmed') return null;
  const x = experienceOf(event);
  const m = mealSummary(x, p.meals, ' · ', dialect);
  const allergy = hasAllergy(p.dietary);
  const other = p.dietary?.needs.filter((n) => DIETARY[n].group !== 'allergy').map((n) => dietName(n, dialect)) ?? [];
  if (!m && !p.dietary?.needs.length) return null;
  return (
    <span className="g2-food">
      {m && <span className="g2-food-meals">{m}</span>}
      {allergy && <span className="g2-food-flag is-allergy"><Icon name="alert" size="sm" />{t('dtAllergy', { list: p.dietary!.needs.filter((n) => DIETARY[n].group === 'allergy').map((n) => dietName(n, dialect)).join('، ') })}</span>}
      {other.length > 0 && <span className="g2-food-flag">{other.join('، ')}</span>}
    </span>
  );
}
