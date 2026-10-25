/** Appearance is organizer UI preference; it never modifies the invitation design. */
export const THEMES = [
  { id: 'warm', artwork: 'assets/directions/warm-world.webp', label: 'ورق وعاج', line: 'دفء هادئ، عناوين تحريرية، وتفاصيل ذهبية.', mood: 'تحريري', colors: ['#F8F4EB','#ECE0CA','#493D30'], radius: '8px' },
  { id: 'sage', artwork: 'assets/directions/sage-world.webp', label: 'حديقة هادئة', line: 'مساحات مريحة، أقواس طبيعية، ومريمية ناعمة.', mood: 'عضوي', colors: ['#F2F5EF','#DCE5D4','#3E5848'], radius: '24px' },
  { id: 'rose', artwork: 'assets/directions/rose-world.webp', label: 'فرحة وردية', line: 'ورد وليلك، تكوين مرح، ولمسات معاصرة.', mood: 'عصري', colors: ['#FFF7F9','#EFDFEE','#7B365A'], radius: '18px 5px 18px 5px' },
  { id: 'ink', artwork: 'assets/directions/ink-world.webp', label: 'حبر ومساحة', line: 'أبيض وأسود، خطوط واضحة، وتباين حاسم.', mood: 'بسيط', colors: ['#FAFAF8','#EAEAE6','#222522'], radius: '3px' },
  { id: 'night', artwork: 'assets/directions/night-world.webp', label: 'بعد الغروب', line: 'ليلي عميق، ضوء دافئ، وهدوء التفاصيل.', mood: 'ليلي', colors: ['#141A24','#283344','#E7CC93'], radius: '12px' },
  { id: 'orbit', artwork: 'assets/directions/orbit-world.svg', label: 'مدار الفرحة', line: 'رحلة مكانية، عناصر معلّقة، ومساحة تتحرّك معك.', mood: 'تجربة مكانية', colors: ['#F4F7FB','#DFE5FA','#514291'], radius: '32px' },
  { id: 'bahja', artwork: 'assets/directions/bahja-world.webp', label: 'بهجة', line: 'دعوات لها حضور، ألوان حيوية، ورحلة تبدأ بخطوة واحدة.', mood: 'احتفال حيّ', colors: ['#FFF8EF','#E1EA73','#39266F'], radius: '32px' },
  { id: 'horizon', artwork: 'assets/directions/horizon-world.svg', label: 'أفق', line: 'كحلي وأزرق، ورق فاتح، واستوديو يبدأ من لحظتك.', mood: 'استوديو تحريري', colors: ['#F5F6EF','#D8E7EF','#244FB8'], radius: '8px' },
  { id: 'signature', artwork: 'assets/directions/signature-world.svg', label: 'توقيع', line: 'أحمر الاحتفال للبداية، أبيض التحرير للعمل، ومساء ذهبي للاستقبال — بألوان ضيوفي وخطها.', mood: 'توقيع ضيوفي', colors: ['#FFFFFF','#BC4749','#262626'], radius: '10px' },
] as const;
export type ThemeId = (typeof THEMES)[number]['id'];
export const isTheme = (value: unknown): value is ThemeId => THEMES.some(t => t.id === value);
export const themeById = (id: ThemeId) => THEMES.find(t => t.id === id)!;
