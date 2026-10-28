/**
 * Template gallery — curated starting points, consumer-facing and image-first.
 * - one grid, ordered for the occasion (suited first), filtered by a single row of style chips
 * - every poster is rendered live with the event's names and date
 * - a tile opens a preview (the real invitation playing) — nothing is applied until
 *   «استخدم هذا القالب»; the gallery keeps its scroll position underneath
 * - a template changes only the look; names, texts and program stay (domain/templates.applyPreset)
 * Reached right after creating an event (?first=1, with "decide later") or from the editor.
 */
import { SignatureTemplateLibrary } from '../signature/SignatureTemplateLibrary';
import { useState } from 'react';
import type { Event, InvitationDesign } from '../../domain/types';
import { eventTypeInfo, namesLine } from '../../domain/event';
import { defaultDesign, toInvitationData } from '../../domain/invitation';
import { TEMPLATE_STYLES, applyPreset, presetOf, presetsFor, type TemplatePreset, type TemplateStyle } from '../../domain/templates';
import { Banner, Button, ErrorState, FocusLayout, Icon, LinkButton, PageLoader } from '../../ui';
import { useMutation } from '../../app/data';
import { useLocation, useNavigate } from '../../app/router';
import { paths } from '../../app/paths';
import { errorMessage } from '../../services/errors';
import { useDesign, useEvent } from '../shared/queries';
import { TemplateThumb } from './TemplateThumb';
import { TemplatePreview } from './TemplatePreview';


export function TemplateGallery({ eventId }: { eventId: string }) {
  const ev = useEvent(eventId);
  const design = useDesign(eventId);
  const loc = useLocation();
  const first = loc.search.get('first') === '1';
  const back = first ? { to: paths.overview(eventId), label: 'لاحقًا' } : { to: paths.design(eventId), label: 'رجوع للتصميم' };
  if (ev.error || design.error) return <FocusLayout title="قوالب الدعوة" back={back}><ErrorState error={ev.error || design.error} onRetry={() => { ev.refetch(); design.refetch(); }} /></FocusLayout>;
  if (ev.loading || design.loading || !ev.data) return <FocusLayout title="قوالب الدعوة" back={back} width="wide"><PageLoader /></FocusLayout>;
  return <Gallery event={ev.data} design={design.data ?? null} first={first} back={back} />;
}

type Filter = 'for-you' | 'all' | TemplateStyle;

function Gallery({ event, design, first, back }: { event: Event; design: InvitationDesign | null; first: boolean; back: { to: string; label: string } }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('for-you');
  const [preview, setPreview] = useState<TemplatePreset | null>(null);
  const base = design?.draft ?? defaultDesign(event);
  const current = design ? presetOf(design.draft) : undefined;
  const occasion = eventTypeInfo(event.type);
  const { suited, rest } = presetsFor(event.type);

  const list: Array<TemplatePreset | 'divider'> = filter === 'for-you'
    ? [...suited, ...(rest.length ? ['divider' as const] : []), ...rest]
    : [...suited, ...rest].filter((p) => filter === 'all' || p.styles.includes(filter));

  const use = useMutation((s, p: TemplatePreset) => s.invitations.saveDraft(event.id, applyPreset(base, p)), {
    onSuccess: () => navigate(paths.design(event.id), { force: true }),
  });

  const chips: Array<{ id: Filter; label: string }> = [
    { id: 'for-you', label: `مختارة لـ${occasion.label}` },
    { id: 'all', label: 'كل القوالب' },
    ...TEMPLATE_STYLES.map((s) => ({ id: s.id as Filter, label: s.label })),
  ];

  return (
    <FocusLayout width="full" title="قوالب الدعوة" back={back}
      right={first ? <LinkButton to={paths.overview(event.id)} variant="ghost" size="sm">سأختار لاحقًا</LinkButton> : undefined}>
      <div className="tg">
        <header className="tg-head"><div className="tg-heading-copy">
          {first && <p className="tg-done"><Icon name="check-circle" size="sm" />أُنشئت «{event.title}»</p>}
          <h2 className="t-display">{first ? 'دعوة تشبه حكايتك.' : 'لمسة جديدة لدعوتك.'}</h2>
          <p className="tg-sub">
            {first
              ? <>كل قالب معروض باسم {namesLine(event)} وتاريخ مناسبتك. تعدّل التفاصيل بعد الاختيار.</>
              : <>يتغيّر الشكل فقط. نصوصك وبيانات مناسبتك تبقى كما هي.</>}
          </p>
        </div><img className="tg-studio-prop" src="assets/editorial/ribbon-seal.webp" alt="" width="1536" height="1024" decoding="async" aria-hidden="true" /></header>

        <div className="chips tg-chips" role="toolbar" aria-label="تصفية القوالب">
          {chips.map((c) => (
            <button key={c.id} type="button" className={`chip${filter === c.id ? ' is-on' : ''}`} aria-pressed={filter === c.id} onClick={() => setFilter(c.id)}>{c.label}</button>
          ))}
        </div>

        {use.error ? <Banner tone="danger" title="لم يُطبَّق القالب">{errorMessage(use.error)}</Banner> : null}

        <SignatureTemplateLibrary key={filter} presets={list.filter((p):p is TemplatePreset=>p!=='divider')} event={event} base={base} current={current?.id} pending={use.pending} onPreview={setPreview} onUse={p=>void use.run(p)}/>
        {!list.some(p=>p!=='divider') && <p className="tg-empty">لا قوالب بهذا الأسلوب بعد.</p>}
      </div>

      {preview && (
        <TemplatePreview
          presets={list.filter((x): x is TemplatePreset => x !== 'divider')}
          preset={preview}
          event={event}
          base={base}
          isCurrent={current?.id === preview.id}
          pending={use.pending}
          onNavigate={setPreview}
          onClose={() => setPreview(null)}
          onUse={(p) => void use.run(p)}
        />
      )}
    </FocusLayout>
  );
}
