/**
 * TemplatePreset — curated starting points: one card face of «الطقم» in one of the three settings it is
 * designed for. The gallery shows presets; the editor still lets the organizer change every option.
 * CARD_CATALOGUE is the single list of faces: presets, card names and the occasion fallback all come from it.
 */
import type { EventType, InvitationDesignContent } from './types';

export type TemplateStyle = 'classic' | 'modern' | 'minimal' | 'bold';

export interface TemplatePreset {
  id: string;
  name: string;
  /** one short line for the preview */
  line: string;
  cardId: string;
  sceneId: string;
  experience: InvitationDesignContent['experience'];
  styles: TemplateStyle[];
  /** occasions it suits best (shown first for those) */
  occasionTags: EventType[];
  featured?: boolean;
  /** Dedicated starting point for an occasion; prioritised ahead of general recommendations. */
  primaryOccasion?: EventType;
}

export const TEMPLATE_STYLES: Array<{ id: TemplateStyle; label: string }> = [
  { id: 'classic', label: 'كلاسيكي' },
  { id: 'modern', label: 'عصري' },
  { id: 'minimal', label: 'بسيط' },
  { id: 'bold', label: 'جريء' },
];

const A = { dimension: '2d', motion: 'animated' } as const;

/** short setting names used in preset titles («حديقة الورد · حرير») */
export const SCENE_SHORT: Record<string, string> = {
  silk: 'حرير', palace: 'الأقواس', marble: 'ورق مضيء', petals: 'البتلات', candlelit: 'ضوء الشموع',
  desert: 'الصحراء', clay: 'مرح', starry: 'النجوم', garden: 'الحديقة', sea: 'البحر',
};

export interface CardEntry {
  card: string; slug: string; name: string; line: string;
  /** the occasion this face was designed for; `for` lists every occasion it suits, best first */
  primary: EventType; for: EventType[]; styles: TemplateStyle[];
  /** its three settings, the first is the default */
  scenes: [string, string, string];
}

export const CARD_CATALOGUE: CardEntry[] = [
  { card: 'kit-rose-garden', slug: 'rose-garden', name: 'حديقة الورد', line: 'ورود مائية على ورق قطني، وإطار ذهبي رفيع.', primary: 'wedding', for: ['wedding', 'engagement'], styles: ['classic'], scenes: ['silk', 'palace', 'marble'] },
  { card: 'kit-two-rings', slug: 'two-rings', name: 'خاتمان', line: 'خاتمان داخل إطار بيضاوي، ويوم الحفل بخط كبير.', primary: 'engagement', for: ['engagement', 'wedding'], styles: ['minimal', 'classic'], scenes: ['petals', 'silk', 'marble'] },
  { card: 'kit-seal-arch', slug: 'seal-arch', name: 'ميثاق وقوس', line: 'ختم شمعي بأول حرفين من اسميكما، تحت قوس ونقش هندسي.', primary: 'katb_kitab', for: ['katb_kitab', 'wedding'], styles: ['classic'], scenes: ['palace', 'silk', 'candlelit'] },
  { card: 'kit-henna-rosette', slug: 'henna-rosette', name: 'وردة الحنّة', line: 'وردات ذهبية على أخضر الحنّة العميق.', primary: 'henna', for: ['henna'], styles: ['bold', 'classic'], scenes: ['palace', 'desert', 'candlelit'] },
  { card: 'kit-balloons', slug: 'balloons', name: 'بالونات', line: 'بالونات وأعلام ملونة، ويوم الحفل بخط كبير.', primary: 'birthday', for: ['birthday'], styles: ['bold', 'modern'], scenes: ['clay', 'petals', 'silk'] },
  { card: 'kit-cap-diamond', slug: 'cap-diamond', name: 'قبعة في ماسة', line: 'قبعة التخرج في ماسة كحلية، مع سنة الدفعة.', primary: 'graduation', for: ['graduation'], styles: ['modern', 'classic'], scenes: ['marble', 'palace', 'starry'] },
  { card: 'kit-moon-cloud', slug: 'moon-cloud', name: 'قمر وغيمة', line: 'قمر وغيوم ناعمة، وخطوات صغيرة في الأسفل.', primary: 'newborn', for: ['newborn'], styles: ['minimal'], scenes: ['silk', 'petals', 'starry'] },
  { card: 'kit-dallah-olive', slug: 'dallah-olive', name: 'دلّة وزيتون', line: 'دلّة وأغصان زيتون، ونقش دافئ في الأسفل.', primary: 'family', for: ['family', 'iftar'], styles: ['classic'], scenes: ['garden', 'desert', 'marble'] },
  { card: 'kit-lantern-night', slug: 'lantern-night', name: 'فوانيس الليل', line: 'فوانيس معلّقة وهلال ذهبي على ليل كحلي.', primary: 'iftar', for: ['iftar', 'family'], styles: ['classic', 'bold'], scenes: ['palace', 'candlelit', 'starry'] },
  { card: 'kit-forum-stars', slug: 'forum-stars', name: 'منبر النجوم', line: 'شريط نجمي جانبي، وعنوان واضح لمؤتمرك.', primary: 'conference', for: ['conference', 'corporate'], styles: ['modern', 'minimal'], scenes: ['marble', 'sea', 'palace'] },
  { card: 'kit-satin-ribbon', slug: 'satin-ribbon', name: 'شريط الافتتاح', line: 'شريط ساتان وفيونكة تنتظر لحظة القص.', primary: 'opening', for: ['opening', 'corporate'], styles: ['modern', 'classic'], scenes: ['palace', 'marble', 'silk'] },
  { card: 'kit-laurel-gala', slug: 'laurel-gala', name: 'وردة الحفل', line: 'وردة ذهبية تحمل السنة، على كحلي فاخر.', primary: 'corporate', for: ['corporate', 'conference'], styles: ['bold', 'classic'], scenes: ['candlelit', 'palace', 'sea'] },
  { card: 'kit-eucalyptus', slug: 'eucalyptus', name: 'غصن الأوكالبتوس', line: 'غصن أوكالبتوس وإخراج تحريري هادئ.', primary: 'other', for: ['other', 'engagement', 'family'], styles: ['minimal', 'modern'], scenes: ['garden', 'marble', 'silk'] },
  // six motion faces, nine from the owner's PDF layers, two typographic
  { card: 'mo-garden', slug: 'mo-garden', name: 'حديقة الوعد', line: 'قوس يُرسم وزهور تتفتح من الأطراف — بطاقة تتحرك.', primary: 'wedding', for: ['wedding', 'engagement', 'katb_kitab'], styles: ['classic', 'modern'], scenes: ['garden', 'silk', 'palace'] },
  { card: 'mo-orbits', slug: 'mo-orbits', name: 'مداران', line: 'خاتمان يدوران حتى يلتقيا، ويوم الحفل بخط كبير.', primary: 'engagement', for: ['engagement', 'wedding'], styles: ['modern', 'minimal'], scenes: ['petals', 'starry', 'silk'] },
  { card: 'mo-colour', slug: 'mo-colour', name: 'يوم ملوّن', line: 'بالونات تطفو، وأعلام وكعكة بشموعها.', primary: 'birthday', for: ['birthday', 'newborn', 'other'], styles: ['bold', 'modern'], scenes: ['clay', 'petals', 'silk'] },
  { card: 'mo-sky', slug: 'mo-sky', name: 'نحو السماء', line: 'قبعة ترتفع داخل غار يكتمل، على كحلي عميق.', primary: 'graduation', for: ['graduation'], styles: ['bold', 'classic'], scenes: ['starry', 'sea', 'marble'] },
  { card: 'mo-lanterns', slug: 'mo-lanterns', name: 'لمّة على نور', line: 'هلال وفوانيس تتمايل تحت قوس أخضر.', primary: 'iftar', for: ['iftar', 'family'], styles: ['classic'], scenes: ['candlelit', 'starry', 'desert'] },
  { card: 'mo-moon', slug: 'mo-moon', name: 'أصغر فرحة', line: 'قمر يطلّ وغيوم تمرّ فوق تلال ناعمة.', primary: 'newborn', for: ['newborn'], styles: ['minimal'], scenes: ['starry', 'silk', 'petals'] },
  { card: 'pf-gazebo', slug: 'pf-gazebo', name: 'شرفة الحديقة', line: 'ستائر عاجية وشرفة حديقة بألوان مائية.', primary: 'wedding', for: ['wedding', 'katb_kitab'], styles: ['classic'], scenes: ['garden', 'marble', 'silk'] },
  { card: 'pf-rings', slug: 'pf-rings', name: 'وعد الذهب', line: 'ورود وردية وخاتمان من ذهب.', primary: 'engagement', for: ['engagement', 'wedding'], styles: ['classic'], scenes: ['petals', 'silk', 'marble'] },
  { card: 'pf-white-arch', slug: 'pf-white-arch', name: 'قوس الياسمين', line: 'قوس مريمي بحرفيكما الأولين، وورد أبيض.', primary: 'katb_kitab', for: ['katb_kitab', 'engagement', 'wedding'], styles: ['minimal', 'classic'], scenes: ['garden', 'palace', 'marble'] },
  { card: 'pf-henna', slug: 'pf-henna', name: 'نقش الحنّة', line: 'نقش أخضر هادئ على ورق دافئ.', primary: 'henna', for: ['henna', 'katb_kitab'], styles: ['classic'], scenes: ['palace', 'desert', 'garden'] },
  { card: 'pf-gold-balloons', slug: 'pf-gold-balloons', name: 'بالونات الذهب', line: 'أسود وذهبي وبالونات وقصاصات لامعة.', primary: 'graduation', for: ['graduation', 'birthday', 'opening'], styles: ['bold'], scenes: ['marble', 'starry', 'palace'] },
  { card: 'pf-cornflower', slug: 'pf-cornflower', name: 'أزهار الترمس', line: 'أزهار زرقاء مائية تحتفي بالقادم الصغير.', primary: 'newborn', for: ['newborn', 'birthday'], styles: ['minimal'], scenes: ['garden', 'silk', 'marble'] },
  { card: 'pf-parchment', slug: 'pf-parchment', name: 'ورق الأيام', line: 'ورق عتيق ودلّة وأغصان زيتون للمّة العائلة.', primary: 'family', for: ['family', 'iftar'], styles: ['classic'], scenes: ['desert', 'garden', 'candlelit'] },
  { card: 'pf-confetti', slug: 'pf-confetti', name: 'شرائط الذهب', line: 'شرائط ذهبية وقصاصات لافتتاح يليق.', primary: 'opening', for: ['opening', 'corporate', 'graduation'], styles: ['bold', 'modern'], scenes: ['palace', 'marble', 'starry'] },
  { card: 'pf-dahlia', slug: 'pf-dahlia', name: 'أضاليا الفرح', line: 'أضاليا مائية تحت قوس ذهبي رفيع.', primary: 'other', for: ['other', 'wedding', 'engagement', 'birthday'], styles: ['bold', 'classic'], scenes: ['petals', 'silk', 'palace'] },
  { card: 'ty-vertical', slug: 'ty-vertical', name: 'عنوان عمودي', line: 'عنوان لاتيني عمودي وتفاصيل واضحة للمؤتمرات.', primary: 'conference', for: ['conference', 'corporate'], styles: ['modern', 'minimal'], scenes: ['marble', 'sea', 'palace'] },
  { card: 'ty-blue', slug: 'ty-blue', name: 'أزرق الدعوة', line: 'أزرق واثق وخط كوفي ورقم اليوم كبيرًا.', primary: 'corporate', for: ['corporate', 'conference', 'opening'], styles: ['modern'], scenes: ['sea', 'marble', 'starry'] },
];

/** every face × its three settings; the first setting of each face is featured */
export const TEMPLATE_PRESETS: TemplatePreset[] = CARD_CATALOGUE.flatMap((c) => c.scenes.map((scene, i): TemplatePreset => ({
  id: `${c.slug}-${scene}`, name: `${c.name} · ${SCENE_SHORT[scene] ?? scene}`, line: c.line, cardId: c.card, sceneId: scene, experience: A,
  styles: c.styles, occasionTags: c.for, primaryOccasion: c.primary, ...(i === 0 ? { featured: true } : {}),
})));

/** display names of the faces (editor, workbench caption) */
export const CARD_NAMES: Record<string, string> = Object.fromEntries(CARD_CATALOGUE.map((c) => [c.card, c.name]));

export const presetById = (id: string) => TEMPLATE_PRESETS.find((p) => p.id === id);

/** gallery order for an occasion: suited ones first (featured first), then the rest in catalogue order */
export function presetsFor(type: EventType | null): { suited: TemplatePreset[]; rest: TemplatePreset[] } {
  if (!type) return { suited: TEMPLATE_PRESETS.filter((p) => p.featured), rest: TEMPLATE_PRESETS.filter((p) => !p.featured) };
  const suited = TEMPLATE_PRESETS.filter((p) => p.occasionTags.includes(type))
    .sort((a, b) => Number(b.primaryOccasion === type) - Number(a.primaryOccasion === type) || Number(!!b.featured) - Number(!!a.featured) || a.occasionTags.indexOf(type) - b.occasionTags.indexOf(type));
  const rest = TEMPLATE_PRESETS.filter((p) => !suited.includes(p));
  return { suited, rest };
}

/** a template changes only the look — never the organizer's text, names or program */
export function applyPreset(c: InvitationDesignContent, p: TemplatePreset): InvitationDesignContent {
  return { ...c, cardId: p.cardId, sceneId: p.sceneId, experience: { ...p.experience } };
}

/** the preset the current design matches, if any */
export function presetOf(c: Pick<InvitationDesignContent, 'cardId' | 'sceneId' | 'experience'>): TemplatePreset | undefined {
  return TEMPLATE_PRESETS.find((p) => p.cardId === c.cardId && p.sceneId === c.sceneId && p.experience.dimension === c.experience.dimension && p.experience.motion === c.experience.motion);
}
