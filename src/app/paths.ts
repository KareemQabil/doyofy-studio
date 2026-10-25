/** URL builders. Mirrors the spec IA (§7). Next.js: each maps to app/<same path>/page.tsx. */
import type { Target } from '../domain/overview';

const ev = (id: string) => `/app/events/${encodeURIComponent(id)}`;
const q = (params: Record<string, string | undefined>) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as Array<[string, string]>).toString();
  return s ? `?${s}` : '';
};

export const paths = {
  home: '/app',
  events: '/app/events',
  newEvent: '/app/events/new',
  designReview: '/prototype/design-review',
  event: ev,
  overview: (id: string) => `${ev(id)}/overview`,
  invitation: (id: string) => `${ev(id)}/invitation`,
  design: (id: string, section?: string) => `${ev(id)}/invitation/design${q({ section })}`,
  templates: (id: string, opts: { first?: boolean } = {}) => `${ev(id)}/invitation/templates${q({ first: opts.first ? '1' : undefined })}`,
  preview: (id: string) => `${ev(id)}/invitation/preview`,
  guests: (id: string, opts: { filter?: string; party?: string; q?: string } = {}) => `${ev(id)}/guests${q(opts)}`,
  importGuests: (id: string) => `${ev(id)}/guests/import`,
  rsvp: (id: string, tab?: string) => `${ev(id)}/rsvp${q({ tab })}`,
  seating: (id: string) => `${ev(id)}/seating`,
  checkin: (id: string) => `${ev(id)}/check-in`,
  settings: (id: string, focus?: string) => `${ev(id)}/settings${q({ focus })}`,
  summary: (id: string) => `${ev(id)}/summary`,
  gate: (id: string) => `/check-in/${encodeURIComponent(id)}`,
  guestLink: (slug: string, code?: string) => `/i/${encodeURIComponent(slug)}${code ? `/${code}` : ''}`,
};

export function targetPath(eventId: string, t: Target): string {
  switch (t.to) {
    case 'settings': return paths.settings(eventId, t.focus);
    case 'invitation': return paths.invitation(eventId);
    case 'design': return paths.design(eventId);
    case 'guests': return paths.guests(eventId, { filter: t.filter });
    case 'import': return paths.importGuests(eventId);
    case 'rsvp': return paths.rsvp(eventId, t.tab);
    case 'seating': return paths.seating(eventId);
    case 'checkin': return paths.checkin(eventId);
    case 'gate': return paths.gate(eventId);
    case 'summary': return paths.summary(eventId);
  }
}
