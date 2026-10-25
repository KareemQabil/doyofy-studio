/**
 * Reviewer page — /prototype/signature-directions
 * How «توقيع» was built: the three explored directions (A احتفال · B مساء · C تحرير, captured from the
 * exploration board), the owner's choice (a mix), where each direction lives in the product, the identity rules
 * (palette + passing contrast pairs, type, mesh, shape vocabulary), the gesture set and the three card faces.
 * Everything below the direction captures is rendered live from the shipped CSS/components — no mock images.
 */
import { useMemo } from 'react';
import type { EventType } from '../../domain/types';
import { applyPreset, presetById } from '../../domain/templates';
import { defaultDesign } from '../../domain/invitation';
import { Link } from '../../app/router';
import { paths } from '../../app/paths';
import { Icon, LinkButton } from '../../ui';
import { OccasionGlyph } from '../../ui/icons';
import { CardThumb } from '../invitation/CardThumb';
import { SignatureShell } from './SignatureShell';
import { DateSeal, Seal, Stage, TicketEdge } from './SignatureArt';
import { Motif } from './BrandPattern';
import { sampleEvent } from './SignatureHome';

const W = '/app/events/evt_wedding';
const DIRECTIONS = [
  { id: 'A', name: 'احتفال', img: 'assets/directions/signature-d1.webp', tone: 'red',
    idea: 'لون الهوية الأحمر بكامل ثقته، وبطاقات حقيقية مفرودة كأنها على طاولة. صوت عالٍ ومبهج للحظة الأولى.',
    where: 'الدخول: الصفحة الرئيسية، ونهاية الملخص.', try: { to: `${paths.events}`, label: 'شاهد الرئيسية' } },
  { id: 'B', name: 'مساء', img: 'assets/directions/signature-d2.webp', tone: 'night',
    idea: 'فحمي وذهبي بنقش الهوية الخافت. هدوء قاعة قبل دخول الضيوف — يركّز العين على الدعوة نفسها.',
    where: 'لحظات الضيف والاستقبال: ظرف الدعوة، شاشة الاستقبال، مسرح المحرر، لحظة المناسبة.', try: { to: '/i/noura-faisal', label: 'افتح ظرف الضيف' } },
  { id: 'C', name: 'تحرير', img: 'assets/directions/signature-d3.webp', tone: 'ivory',
    idea: 'صفحة بيضاء بتسلسل عناوين واضح، وبلاطات ألوان تحمل البطاقات. مقروء ومرتّب للعمل اليومي.',
    where: 'شاشات البيانات: المناسبات، الضيوف، الردود، الطاولات، الإعدادات.', try: { to: `${W}/guests`, label: 'شاهد قائمة الضيوف' } },
] as const;

const PALETTE = [
  { name: 'ذهبي', hex: '#C7A661', ink: '#262626' }, { name: 'عاجي', hex: '#F2EAD9', ink: '#262626' }, { name: 'بيج', hex: '#E4D5B4', ink: '#262626' },
  { name: 'أحمر', hex: '#BC4749', ink: '#FFFFFF' }, { name: 'فيروزي', hex: '#2EB7B7', ink: '#262626' }, { name: 'فحمي', hex: '#262626', ink: '#C7A661' },
];
const PAIRS = [
  { fg: '#FFFFFF', bg: '#BC4749', ratio: '5.1', ok: true, label: 'أبيض على أحمر' }, { fg: '#262626', bg: '#C7A661', ratio: '6.5', ok: true, label: 'فحمي على ذهبي' },
  { fg: '#262626', bg: '#2EB7B7', ratio: '6.2', ok: true, label: 'فحمي على فيروزي' }, { fg: '#C7A661', bg: '#262626', ratio: '6.5', ok: true, label: 'ذهبي على فحمي' },
  { fg: '#C7A661', bg: '#FFFFFF', ratio: '2.3', ok: false, label: 'ذهبي على أبيض — ممنوع للنص' }, { fg: '#FFFFFF', bg: '#2EB7B7', ratio: '2.5', ok: false, label: 'أبيض على فيروزي — ممنوع للنص' },
];
const GESTURES = [
  { where: 'بطاقات المناسبات والقوالب', act: 'اسحب يمينًا ويسارًا · مرّر بلوحة اللمس', keys: '← → Home End', button: 'السابقة / التالية + عدّاد', reduced: 'تنتقل البطاقة دون حركة' },
  { where: 'مروحة الدعوات في الرئيسية', act: 'اسحب أو اضغط البطاقة', keys: '← →', button: 'سهمان تحت المروحة', reduced: 'تبديل فوري' },
  { where: 'ظرف الضيف', act: 'اسحب الختم للأعلى', keys: 'Enter / Space على الختم', button: '«افتح الدعوة» + «الموعد وتأكيد الحضور مباشرة»', reduced: 'يُفتح الظرف دون حركة' },
  { where: 'لوحة المحرر على الجوال', act: 'اسحب المقبض: مصغّرة / منتصف / مكبّرة', keys: '↑ ↓ على المقبض', button: 'الضغط على المقبض يبدّل', reduced: 'تثبيت فوري دون انزلاق' },
  { where: 'النشر والرد', act: '—', keys: '—', button: 'ختم «نُشرت دعوتك» لثانية ونصف، لا يحجب شيئًا', reduced: 'يظهر الختم دون دوران' },
];
const FACES: Array<{ preset: string; type: EventType }> = [
  { preset: 'sig-diploma-marble', type: 'graduation' }, { preset: 'sig-ribbon-candlelit', type: 'wedding' }, { preset: 'sig-ticket-clay', type: 'birthday' },
];

export function SignatureDirections() {
  const faces = useMemo(() => FACES.map(({ preset, type }) => { const e = sampleEvent(type); const p = presetById(preset)!; return { e, p, content: applyPreset(defaultDesign(e), p) }; }), []);
  return (
    <SignatureShell>
      <main id="main" className="sig-dir" tabIndex={-1}>
        <header className="sig-dir-intro">
          <p className="sig-kicker">مراجعة التصميم · توقيع</p>
          <h1>ثلاثة اتجاهات.<br />أسلوب واحد.</h1>
          <p>جرّبنا ثلاثة عوالم بنفس الهوية ونفس البطاقات الحقيقية. الاختيار كان مزيجًا: كل اتجاه يخدم لحظة مختلفة من رحلة المناسبة، بنفس الألوان والخط والأشكال.</p>
        </header>

        <ol className="sig-dir-list">
          {DIRECTIONS.map((d) => (
            <li key={d.id} className={`sig-dir-item tone-${d.tone}`}>
              <figure><img src={d.img} alt={`لقطة من استكشاف الاتجاه ${d.id} «${d.name}»`} loading="lazy" decoding="async" width={1200} height={750} /></figure>
              <div className="sig-dir-copy">
                <span className="sig-dir-letter" aria-hidden="true">{d.id}</span>
                <h2>«{d.name}»</h2>
                <p>{d.idea}</p>
                <p className="sig-dir-where"><Icon name="pin" size="sm" />{d.where}</p>
                <Link to={d.try.to} className="sig-text-link">{d.try.label}</Link>
              </div>
            </li>
          ))}
        </ol>

        <section className="sig-dir-section" aria-labelledby="dir-rules">
          <header><span className="sig-section-num num">01</span><h2 id="dir-rules">ألوان الهوية، ومتى تُقرأ</h2><p>ستة ألوان فقط. النص يُكتب على اللون إذا نجح التباين — وإلا يبقى اللون مساحة أو شكلًا.</p></header>
          <div className="sig-dir-palette">{PALETTE.map((c) => <div key={c.hex} style={{ background: c.hex, color: c.ink }}><b>{c.name}</b><span lang="en" dir="ltr">{c.hex}</span></div>)}</div>
          <ul className="sig-dir-pairs">{PAIRS.map((p) => <li key={p.label} className={p.ok ? 'is-ok' : 'is-no'}><span className="sig-dir-chip" style={{ background: p.bg, color: p.fg }}>نص</span><span>{p.label}</span><b className="num">{p.ratio}:1</b><Icon name={p.ok ? 'check' : 'close'} size="sm" /></li>)}</ul>
        </section>

        <section className="sig-dir-section" aria-labelledby="dir-type">
          <header><span className="sig-section-num num">02</span><h2 id="dir-type">الخط والتسلسل</h2><p>Readex Pro للعناوين، وIBM Plex Sans Arabic للنصوص والحقول، بخطوط محلية مرخّصة للويب. يظل Ping AR + LT مرجع الهوية الأصلي حتى توفير ترخيص ويب له.</p></header>
          <div className="sig-dir-type">
            <p className="t-display">كل فرحة تستاهل دعوة.</p>
            <p className="t-head">ثلاث عشرة مناسبة، ولكل واحدة دعوتها.</p>
            <p className="t-body">اكتب الأسماء والموعد، ونجهّز الدعوة بالكلمة والبرنامج المناسبين. وكل شيء قابل للتعديل لاحقًا.</p>
            <dl><div><dt>عنوان رئيسي</dt><dd>Ping 700 · 64–112</dd></div><div><dt>عنوان قسم</dt><dd>Ping 600 · 32–44</dd></div><div><dt>نص</dt><dd>Plex 400 · 15–17 · سطر 1.85</dd></div></dl>
          </div>
        </section>

        <section className="sig-dir-section" aria-labelledby="dir-mesh">
          <header><span className="sig-section-num num">03</span><h2 id="dir-mesh">التدرّج الشبكي</h2><p>ثلاثة إلى خمسة ألوان متجاورة من الهوية، بؤرة ضوء واحدة، ومنطقة هادئة خلف النص. لا بنفسجي، ولا فقاعات.</p></header>
          <div className="sig-dir-meshes">
            <div style={{ background: 'var(--mesh-red, #BC4749)' }}><b>احتفال</b><span>الرئيسية · نهاية الملخص</span></div>
            <div style={{ background: 'var(--mesh-night, #1E1E1E)' }}><b>مساء</b><span>الظرف · الاستقبال · المحرر</span></div>
            <div style={{ background: 'var(--mesh-ivory, #F6F1E7)' }} className="is-light"><b>عاج</b><span>معاينة الإنشاء</span></div>
          </div>
        </section>

        <section className="sig-dir-section" aria-labelledby="dir-shapes">
          <header><span className="sig-section-num num">04</span><h2 id="dir-shapes">مفردات الأشكال</h2><p>دائرة بحلقة مزدوجة، بلاطة لون، حافة تذكرة، وخط ذهبي مزدوج — مأخوذة من الشعار والنقش الرسمي. الأيقونات من Phosphor (رخصة MIT) ولا شيء مرسوم يدويًا أو مولّد.</p></header>
          <div className="sig-dir-shapes">
            <figure><Seal size={84} /><figcaption>الختم</figcaption></figure>
            <figure><DateSeal day="20" month="يونيو" time="8:00 م" /><figcaption>بلاطة الموعد</figcaption></figure>
            <figure><span className="sig-dir-ticket"><TicketEdge /></span><figcaption>حافة التذكرة</figcaption></figure>
            <figure><span className="sig-dir-motif"><Motif name="bloom" /></span><figcaption>زهرة النقش</figcaption></figure>
            <figure><span className="sig-dir-glyphs">{(['graduation', 'wedding', 'birthday', 'newborn', 'iftar', 'opening'] as EventType[]).map((t) => <OccasionGlyph key={t} type={t} size={30} />)}</span><figcaption>رموز المناسبات</figcaption></figure>
          </div>
        </section>

        <section className="sig-dir-section" aria-labelledby="dir-faces">
          <header><span className="sig-section-num num">05</span><h2 id="dir-faces">بطاقات توقيع</h2><p>ثلاث واجهات بنفس اللغة: شريط لون، دائرة، وإطار ذهبي مزدوج. تقرأ الاسم المفرد والاسمين دون أي «و» زائدة.</p></header>
          <div className="sig-dir-faces">{faces.map(({ e, p, content }) => <figure key={p.id}><CardThumb event={e} content={content} width={220} /><figcaption><b>{p.name.split(' · ')[0]}</b><span>{p.line}</span></figcaption></figure>)}</div>
        </section>

        <section className="sig-dir-section" aria-labelledby="dir-gestures">
          <header><span className="sig-section-num num">06</span><h2 id="dir-gestures">الإيماءات وبدائلها</h2><p>كل إيماءة لها زر ظاهر، ومفتاح لوحة، وسلوك مع تقليل الحركة.</p></header>
          <div className="sig-dir-table" role="region" aria-label="جدول الإيماءات" tabIndex={0}>
            <table><thead><tr><th>أين</th><th>الإيماءة</th><th>لوحة المفاتيح</th><th>الزر</th><th>تقليل الحركة</th></tr></thead>
              <tbody>{GESTURES.map((g) => <tr key={g.where}><th scope="row">{g.where}</th><td>{g.act}</td><td dir="ltr" lang="en">{g.keys}</td><td>{g.button}</td><td>{g.reduced}</td></tr>)}</tbody></table>
          </div>
        </section>

        <section className="sig-dir-section sig-dir-rejected" aria-labelledby="dir-rejected">
          <header><span className="sig-section-num num">07</span><h2 id="dir-rejected">ما رفضناه</h2></header>
          <ul>
            <li><b>اتجاه البيج الهادئ:</b> رفضه المالك — تباين ضعيف وبلا روح. استبدلناه بمساحات لون واثقة وبطاقات حقيقية.</li>
            <li><b>الأيقونات والزخارف:</b> من Phosphor وأشكال الهوية الأصلية. الصور التحريرية مخصصة للتخرّج وتجهيز الدعوة وملخص المناسبة؛ نص الدعوة والشعار يظلان عناصر أصلية قابلة للتعديل.</li>
            <li><b>الكوبالت والبرقوقي في البطاقات:</b> أُعيد رسم البطاقات الثلاث بألوان الهوية فقط.</li>
          </ul>
        </section>

        <Stage size="md" tone="charcoal" pattern="knot" className="sig-dir-end">
          <h2>جرّب الرحلة كاملة.</h2>
          <p>من اختيار المناسبة حتى ملخص الاستقبال، بهذا الأسلوب.</p>
          <div><LinkButton to={paths.newEvent} variant="primary" size="lg" icon="plus">مناسبة جديدة</LinkButton><Link to={`${W}/overview`} className="sig-text-link">افتح زفاف نورة وفيصل</Link></div>
        </Stage>
      </main>
    </SignatureShell>
  );
}
