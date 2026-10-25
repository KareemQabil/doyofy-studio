/**
 * Occasion art — one illustration language for every occasion: the brand's double-line stroke
 * (as in the logomark and brand pattern), drawn as one path stroked twice — a thick ink line and a
 * thin ground-coloured line inside it. Muted tinted grounds come from theme tokens (--art-N, --art-ink),
 * so the art re-themes with Warm/Sage. Original prototype art; no stock imagery.
 */
import type { EventType } from '../../domain/types';

interface ArtDef { d: string[]; thin?: string[]; dots?: Array<[number, number, number]>; ground: 1 | 2 | 3 | 4 | 5 | 6 }

const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

const ART: Record<EventType, ArtDef> = {
  wedding: { ground: 1, d: [circle(64, 92, 26), circle(96, 92, 26), 'M88 54 L96 44 L104 54 L96 64 Z'] },
  engagement: { ground: 2, d: [circle(80, 100, 27), 'M68 70 L74 58 L86 58 L92 70 L80 80 Z'], thin: ['M118 46v18M109 55h18', 'M44 66v12M38 72h12'] },
  katb_kitab: { ground: 3, d: ['M50 38 H98 L112 52 V122 H50 Z', 'M98 38 V52 H112', 'M98 124 L128 94 L136 102 L106 132 L96 134 Z'], thin: ['M62 70 H98', 'M62 84 H98', 'M62 98 H84'] },
  henna: { ground: 5, d: ['M78 128 C46 126 40 92 58 72 C72 56 96 60 102 38 C116 60 122 84 112 104 C106 118 94 128 78 128 Z', 'M76 110 C62 108 60 92 70 84 C80 78 92 86 87 97'], dots: [[122, 120, 2.6], [130, 108, 2.2], [40, 52, 2.4], [32, 64, 2]] },
  birthday: { ground: 2, d: ['M44 96 H116 V124 H44 Z', 'M56 72 H104 V96 H56 Z', 'M80 72 V52', 'M80 34 C87 41 87 48 80 48 C73 48 73 41 80 34 Z'], thin: ['M36 124 H124', 'M44 108 C52 114 60 102 68 108 C76 114 84 102 92 108 C100 114 108 102 116 108'] },
  graduation: { ground: 4, d: ['M80 42 L130 62 L80 82 L30 62 Z', 'M52 72 V94 C52 106 108 106 108 94 V72', 'M120 66 V98'], thin: ['M114 98 H126 L123 110 H117 Z'] },
  newborn: { ground: 3, d: ['M62 40 C68 50 92 50 98 40 L120 54 L110 74 L102 70 V112 C102 118 97 124 90 124 H70 C63 124 58 118 58 112 V70 L50 74 L40 54 Z'], thin: ['M80 92 C75 85 66 89 70 96 L80 105 L90 96 C94 89 85 85 80 92 Z'] },
  family: { ground: 5, d: ['M66 122 H104 C110 122 111 114 107 108 C99 96 99 86 103 78 C106 71 101 64 95 64 H77 C71 64 66 71 69 78 C73 86 73 96 65 108 C61 114 61 122 66 122 Z', 'M68 80 C56 76 46 66 36 52', 'M78 64 C78 54 94 54 94 64', 'M103 78 C122 82 122 106 106 110'], dots: [[86, 48, 3.2]], thin: ['M118 116 H134 L130 126 H122 Z'] },
  iftar: { ground: 4, d: ['M70 40 H90 L94 50 H66 Z', 'M66 50 H94 L102 66 V100 L92 114 H68 L58 100 V66 Z', 'M128 34 A18 18 0 1 0 130 68 A13 13 0 1 1 128 34 Z'], thin: ['M80 56 V108', 'M58 82 H102', 'M80 40 V30'] },
  conference: { ground: 6, d: ['M50 64 H110 L104 74 H56 Z', 'M58 74 H102 L96 126 H64 Z', 'M80 64 V46'], dots: [[80, 40, 5]], thin: ['M62 34 C70 26 90 26 98 34', 'M54 28 C66 16 94 16 106 28', 'M70 100 H90'] },
  opening: { ground: 1, d: ['M80 90 C64 66 42 72 48 90 C42 108 64 114 80 90 Z', 'M80 90 C96 66 118 72 112 90 C118 108 96 114 80 90 Z', 'M77 94 L66 126', 'M83 94 L94 126'], thin: ['M20 90 H44', 'M116 90 H140'] },
  corporate: { ground: 6, d: ['M38 64 L80 40 L122 64 Z', 'M42 124 H118', 'M54 70 V118', 'M71 70 V118', 'M89 70 V118', 'M106 70 V118'] },
  other: { ground: 2, d: ['M80 36 C84 64 96 76 124 80 C96 84 84 96 80 124 C76 96 64 84 36 80 C64 76 76 64 80 36 Z'], thin: ['M122 40 V56M114 48 H130', 'M40 112 V124M34 118 H46'] },
};

/** concentric double-line arc in a corner — the logomark's bowl, used as quiet texture */
const TEXTURE = 'M-20 170 A120 120 0 0 1 100 50';
const TEXTURE2 = 'M-20 190 A140 140 0 0 1 120 50';

export function OccasionArt({ type, className = '', framed = true }: { type: EventType; className?: string; framed?: boolean }) {
  const a = ART[type] ?? ART.other;
  return (
    <svg viewBox="0 0 160 160" preserveAspectRatio="xMidYMid slice" className={`occ-art ${className}`} aria-hidden="true" focusable="false" style={{ ['--art-ground' as string]: `var(--art-${a.ground})` }}>
      {framed && <rect width="160" height="160" fill="var(--art-ground)" />}
      {framed && <g fill="none" stroke="var(--art-ink)" strokeOpacity=".13" strokeWidth="1.2"><path d={TEXTURE} /><path d={TEXTURE2} /></g>}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round" transform="translate(80 82) scale(1.1) translate(-80 -80)">
        <g stroke="var(--art-ink)" strokeWidth="6.4">{a.d.map((d, i) => <path key={i} d={d} />)}</g>
        <g stroke="var(--art-ground)" strokeWidth="2.2">{a.d.map((d, i) => <path key={i} d={d} />)}</g>
        {a.thin && <g stroke="var(--art-ink)" strokeWidth="2.2">{a.thin.map((d, i) => <path key={i} d={d} />)}</g>}
      </g>
      <g transform="translate(80 82) scale(1.1) translate(-80 -80)">{a.dots?.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="var(--art-ink)" />)}</g>
    </svg>
  );
}
