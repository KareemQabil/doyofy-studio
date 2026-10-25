# Replacement guide — open «توقيع» assets

One row per open record in `asset-briefs.json` (5 open of 37). Everything else is already approved in runtime.

| ID | Visible where | Currently used | Required export | Replace at | Constraints | Verify | Rebuild? |
|---|---|---|---|---|---|---|---|
| `signature.identity.fonts.v1` | all organizer headings | Readex Pro (OFL, already shipped) via the --font-display stack | woff  | `public/assets/fonts/brand/ping-ar-lt-{400,500,700}.woff, shinko-sans-400.woff` (src/ui/styles/fonts.css) | n/a; n/a | fallback stack renders when files are removed | yes — `node tools/build.mjs` copies public/ |
| `signature.card.sig-crescent.face.v1` | studio.card, templates.deck | newborn-moon (occasion-cards.js) remains the starter until built. | inline SVG + DOM text 300×420 | `src/cards/signature-cards.js#sig-crescent` (src/cards/signature-cards.js (new entry) + src/domain/templates.ts (presets) + src/domain/invitation.ts CARD_NAMES) | Band 0–132 px; names 170–300 px; meta 300–392 px.; Live data only. No prayer or sunset time ever printed as art. | newborn single name; iftar host family name «عائلة …» | yes — `node tools/build.mjs` |
| `signature.card.sig-agenda.face.v1` | studio.card, templates.deck | forum-grid stays the starter. | inline SVG + DOM text 300×420 | `src/cards/signature-cards.js#sig-agenda` (src/cards/signature-cards.js (new entry)) | Column 0–78 px; text 96–276 px.; Prints the event title (c.arA for organisation events) and real date/venue. No sponsor marks, no fake agenda items. | 60-character conference title wraps to 3 lines | yes — `node tools/build.mjs` |
| `signature.envelope.lining.v1` | guest.cover | Plain ivory lining (current). | svg 400×150 | `public/assets/brand/envelope-lining.svg` (src/features/signature/SignatureArt.tsx EnvelopeBack (new <pattern> fill)) | n/a; No text. | seam-free at flap edge | yes — `node tools/build.mjs` copies public/ |
| `legacy.wizard.3d-candlelit-thumb.v1` | templates.deck, editor | Live 2D scene thumbnail (TemplateThumb non-3D branch). | webp 300×420 | `public/assets/wizard/3d-candlelit.webp` (src/features/templates/TemplateThumb.tsx:58, src/wizard/Wizard.js:262) | n/a; No text. | confirm origin | yes — `node tools/build.mjs` copies public/ |

## After any replacement

```bash
npx tsc -p . && node tests/unit.mjs && node tools/build.mjs
node tools/check-shipped-assets.mjs
node tests/dev/faces.mjs /tmp/faces.png sig-diploma,sig-ribbon,sig-ticket   # card faces
node tests/signature-journey.mjs all                                          # 390 / 768 / 1440
node tests/dev/signature-no-generated.mjs                                     # no generated imagery on signature routes
node tools/asset-briefs.mjs                                                    # then update the record's status here
```

## Send these records back to ChatGPT

Paste the message below with the JSON file(s) from `assets/request-batches/` attached (each request is self-contained):

> نحتاج تجهيز الأصول التالية لاستايل «توقيع». كل أصل له ID ومكان جاهز في الكود، ومقاسات ومساحة آمنة وتعليمات بناء مستقلة. المطلوب: تصميم Canva قابل للتعديل بأشكال Canva الأصلية فقط وملفات الهوية الرسمية وأيقونات Phosphor — بدون أي توليد صور بالذكاء الاصطناعي (لا Magic Media ولا Dream Lab ولا Magic Design) وبدون أيقونات مرسومة يدويًا. لا تُضمّن نصوص الأسماء أو التواريخ أو QR داخل الصور؛ هذه بيانات حية في الموقع، والنصوص في التصميم عيّنة للتخطيط فقط. قائمة الأصول وملفاتها المرجعية: signature.identity.fonts.v1، signature.card.sig-crescent.face.v1، signature.card.sig-agenda.face.v1، signature.envelope.lining.v1، legacy.wizard.3d-candlelit-thumb.v1 (السجلات الكاملة في الملفات المرفقة). بعد اعتمادها نستبدل الملفات في المسارات المذكورة في كل سجل ونشغّل الفحوص أعلاه دون تغيير التخطيط.
