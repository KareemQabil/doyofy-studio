/** InvitationDesignContent ↔ the wizard's platform state. Names equal to the event's are not stored as overrides. */
import type { Event, InvitationDesignContent } from '../../domain/types';
import type { WizardPlatformState } from '../../wizard/Wizard.js';
import { namesLine } from '../../domain/event';
import { formatEventDate, formatTime } from '../../domain/format';

export function stateFromContent(ev: Event, c: InvitationDesignContent): WizardPlatformState {
  return {
    experience: { ...c.experience },
    card: c.cardId,
    scene: c.sceneId,
    form: {
      aAr: c.displayNames.a ?? '', aEn: c.displayNames.aEn ?? '', bAr: c.displayNames.b ?? '', bEn: c.displayNames.bEn ?? '',
      msgAr: c.message.ar, msgEn: c.message.en,
      program: c.program.map((p) => ({ ...p })),
    },
  };
}

const override = (value: string, eventValue: string | undefined) => {
  const v = value.trim();
  return v && v !== (eventValue ?? '').trim() ? v : undefined;
};

export function contentFromState(ev: Event, s: WizardPlatformState): InvitationDesignContent {
  const f = s.form;
  return {
    experience: { ...s.experience },
    cardId: s.card,
    sceneId: s.scene,
    displayNames: {
      a: override(f.aAr, ev.names.a), b: override(f.bAr, ev.names.b),
      aEn: override(f.aEn, ev.names.aEn), bEn: override(f.bEn, ev.names.bEn),
    },
    message: { ar: f.msgAr, en: f.msgEn },
    program: f.program.map((p) => ({ time: p.time, ar: p.ar, en: p.en })),
  };
}

export function eventSummaryForWizard(ev: Event) {
  return {
    names: namesLine(ev),
    namesEn: [ev.names.aEn, ev.names.bEn].filter(Boolean).join(' & ') || namesLine(ev),
    when: `${formatEventDate(ev.date)} · ${formatTime(ev.time)}`,
    where: `${ev.venue.name}، ${ev.venue.city}`,
    editLabel: 'تعديل الموعد أو المكان من بيانات المناسبة',
  };
}
