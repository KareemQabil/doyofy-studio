/**
 * «الطعام» — a lens on the guest list, not another list to keep (F053, F054).
 * Meal totals per person, who has not chosen, dietary needs with their table, and food per table —
 * all derived from the same parties the list shows (D20: no phones here, nothing exported by default).
 */
import { useMemo } from 'react';
import type { Event, InvitationParty, RSVPResponse, Table } from '../../domain/types';
import {
  DIETARY, asksMeals, dietaryLabel, dietaryReport, experienceOf, foodCsv, hasAllergy, mealReport, mealSummary, type DietaryEntry,
} from '../../domain/guest-experience';
import { plural, P, people } from '../../domain/format';
import { Button, EmptyState, Icon, LinkButton } from '../../ui';
import { paths } from '../../app/paths';
import { haptic } from '../../ui/motion/motion';

const TONES = 'abcdef';

export function FoodReport({ event, parties, responses, tables, onOpen, now }: {
  event: Event; parties: InvitationParty[]; responses: RSVPResponse[]; tables: Table[]; onOpen: (partyId: string) => void; now: Date;
}) {
  const x = experienceOf(event);
  const meals = useMemo(() => mealReport(x, parties, responses), [x, parties, responses]);
  const diet = useMemo(() => dietaryReport(parties), [parties]);
  const tableName = (id?: string) => tables.find((t) => t.id === id)?.name ?? '';
  const asks = asksMeals(x);
  if (!asks && !x.dietary.enabled && !meals.rows.some((r) => r.people)) {
    return (
      <EmptyState compact icon="sparkle" title="لا أسئلة طعام بعد" action={<LinkButton to={paths.settings(event.id, 'guest-experience')} icon="settings">إعداد الطعام</LinkButton>}>
        فعّل اختيار الوجبة أو سؤال الحساسية، وسيظهر هنا عدد كل وجبة ومن لديه ما نراعيه.
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
            <h3 id="food-meals">الوجبات</h3>
            <span className="food-total"><strong className="num">{meals.specified}</strong> من {people(meals.confirmedPeople)} اختاروا</span>
          </header>
          <ul className="food-bars">
            {meals.rows.map((r, i) => (
              <li key={r.id} className={`food-bar tone-${TONES[x.meals.options.findIndex((o) => o.id === r.id) % 6] ?? TONES[i % 6]}${r.archived ? ' is-archived' : ''}`} style={{ ['--w' as string]: `${(r.people / max) * 100}%` }}>
                <span className="food-bar-label"><span className="gx-swatch" aria-hidden="true" />{r.label}{r.archived && <small> · مخفي عن الضيوف</small>}</span>
                <span className="food-bar-track" aria-hidden="true"><span /></span>
                <strong className="food-bar-n num">{r.people}</strong>
              </li>
            ))}
            <li className="food-bar is-none" style={{ ['--w' as string]: `${(meals.unspecified / max) * 100}%` }}>
              <span className="food-bar-label">بلا اختيار{x.meals.required ? '' : ' (مسموح)'}</span>
              <span className="food-bar-track" aria-hidden="true"><span /></span>
              <strong className="food-bar-n num">{meals.unspecified}</strong>
            </li>
          </ul>
          {meals.review.length > 0 && (
            <div className="food-review" role="note">
              <Icon name="alert" size="sm" />
              <span>تغيّر عدد الحضور بعد اختيار الوجبات — راجع: {meals.review.map((r, i) => <span key={r.partyId}>{i ? '، ' : ''}<button type="button" className="food-link" onClick={() => onOpen(r.partyId)}>{r.name}</button></span>)}. لا نحسبها حتى تُراجع.</span>
            </div>
          )}
          {meals.provisional.people > 0 && (
            <p className="food-provisional">
              <Icon name="clock" size="sm" />
              من الرابط العام بانتظار المطابقة: {people(meals.provisional.people)}
              {Object.keys(meals.provisional.byOption).length ? ` — ${x.meals.options.filter((o) => meals.provisional.byOption[o.id]).map((o) => `${meals.provisional.byOption[o.id]} ${o.label}`).join('، ')}` : ''}. غير محسوبة أعلاه.
            </p>
          )}
        </section>
      )}

      {x.dietary.enabled || diet.entries.length ? (
        <section className="food-card food-diet" aria-labelledby="food-diet">
          <header className="food-head">
            <h3 id="food-diet">ما نراعيه</h3>
            <span className="food-total">{plural(diet.entries.length, P.invitation)} لديها احتياج · {diet.answeredNone} «لا شيء» · {diet.notAnswered} لم تُجب</span>
          </header>
          {diet.byNeed.length > 0 && (
            <ul className="food-needs" aria-label="ملخص الاحتياجات">
              {diet.byNeed.map((b) => (
                <li key={b.need} className={`food-need${DIETARY[b.need].group === 'allergy' ? ' is-allergy' : ''}`}>
                  {DIETARY[b.need].group === 'allergy' && <Icon name="alert" size="sm" />}
                  <span>{DIETARY[b.need].label}</span>
                  <b className="num">{b.people || ''}{b.unknownPeople ? `${b.people ? '+' : ''}؟` : ''}</b>
                </li>
              ))}
            </ul>
          )}
          {diet.entries.length ? (
            <ul className="food-entries">{diet.entries.map((e) => <DietRow key={e.partyId} e={e} table={tableName(e.tableId)} onOpen={() => onOpen(e.partyId)} />)}</ul>
          ) : <p className="faint t-sm">لا احتياجات مسجلة بعد.</p>}
          <p className="food-fine"><Icon name="info" size="sm" />ما كتبه الضيف كما هو، لتوصله لمن يحضّر الطعام. «نباتي» لا يعني خلوًا من الحساسية.</p>
        </section>
      ) : null}

      {byTable.length > 0 && (
        <section className="food-card food-tables" aria-labelledby="food-tables">
          <header className="food-head"><h3 id="food-tables">لكل طاولة</h3><span className="food-total">لمن يقدّم الطعام</span></header>
          <ul className="food-table-grid">
            {byTable.map(({ t, per, people: n, needs }) => (
              <li key={t.id} className={`food-table${needs.some((p) => hasAllergy(p.dietary)) ? ' has-allergy' : ''}`}>
                <div className="food-table-head"><strong>{t.name}</strong><span className="num">{n}</span></div>
                <div className="food-table-meals">
                  {x.meals.options.filter((o) => per.get(o.id)).map((o) => (
                    <span key={o.id} className={`food-pip tone-${TONES[x.meals.options.indexOf(o) % 6]}`}><span className="gx-swatch" aria-hidden="true" />{per.get(o.id)} {o.label}</span>
                  ))}
                  {!per.size && <span className="faint t-sm">لا اختيارات</span>}
                </div>
                {needs.length > 0 && <p className="food-table-needs"><Icon name="alert" size="sm" />{needs.map((p) => `${p.primaryGuestName}: ${p.dietary!.needs.map((k) => DIETARY[k].label).join('، ')}`).join(' · ')}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="food-actions">
        <Button variant="secondary" icon="download" onClick={exportCsv}>تصدير للمطبخ (CSV)</Button>
        <LinkButton to={paths.settings(event.id, 'guest-experience')} variant="ghost" icon="settings">تعديل الأسئلة</LinkButton>
        <span className="faint t-sm">بدون أرقام هواتف · الإصدار {x.revision}</span>
      </div>
    </div>
  );
}

function DietRow({ e, table, onOpen }: { e: DietaryEntry; table: string; onOpen: () => void }) {
  return (
    <li className={`food-entry${e.allergy ? ' is-allergy' : ''}`}>
      <button type="button" className="food-entry-name" onClick={onOpen}>{e.name}</button>
      <span className="food-entry-needs">{e.needs.map((n) => DIETARY[n].label).join('، ')}{e.affectedCount ? ` · تخص ${people(e.affectedCount)}` : ''}</span>
      {e.note && <span className="food-entry-note">«{e.note}»</span>}
      <span className={`food-entry-table${table ? '' : ' is-missing'}`}><Icon name="table" size="sm" />{table || 'بلا طاولة'}</span>
    </li>
  );
}

/** a dietary need where tables are arranged (F054, T35): it travels with the party, nothing is copied */
export function DietBadge({ p }: { p: InvitationParty }) {
  if (p.rsvpStatus !== 'confirmed' || !p.dietary?.needs.length) return null;
  const allergy = hasAllergy(p.dietary);
  return (
    <span className={`seat-diet${allergy ? ' is-allergy' : ''}`} title={dietaryLabel(p.dietary)}>
      {allergy && <Icon name="alert" size="sm" />}<span className="seat-diet-text">{dietaryLabel(p.dietary)}</span>
    </span>
  );
}

/** the one-line food summary on a guest card */
export function FoodLine({ event, p }: { event: Event; p: InvitationParty }) {
  if (p.rsvpStatus !== 'confirmed') return null;
  const x = experienceOf(event);
  const m = mealSummary(x, p.meals);
  const allergy = hasAllergy(p.dietary);
  const other = p.dietary?.needs.filter((n) => DIETARY[n].group !== 'allergy').map((n) => DIETARY[n].label) ?? [];
  if (!m && !p.dietary?.needs.length) return null;
  return (
    <span className="g2-food">
      {m && <span className="g2-food-meals">{m}</span>}
      {allergy && <span className="g2-food-flag is-allergy"><Icon name="alert" size="sm" />حساسية {p.dietary!.needs.filter((n) => DIETARY[n].group === 'allergy').map((n) => DIETARY[n].label).join('، ')}</span>}
      {other.length > 0 && <span className="g2-food-flag">{other.join('، ')}</span>}
    </span>
  );
}
