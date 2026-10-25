/**
 * Read a guest spreadsheet into rows of strings. Supports .csv/.tsv/.txt and Excel .xlsx (first
 * sheet) without libraries: .xlsx is a zip; entries are inflated with the browser's
 * DecompressionStream('deflate-raw') and parsed with DOMParser. Old binary .xls is not supported.
 */
import { parseDelimited } from '../../domain/import';
import { AppError } from '../errors';

export async function readSpreadsheet(file: File): Promise<string[][]> {
  const name = file.name.toLowerCase();
  if (file.size === 0) throw new AppError('validation', 'الملف فارغ. تأكد من حفظ القائمة ثم ارفعها مرة أخرى.');
  if (file.size > 5 * 1024 * 1024) throw new AppError('validation', 'الملف كبير جدًا (أكثر من 5 ميجابايت). قسّم القائمة إلى ملفات أصغر.');
  if (name.endsWith('.xls')) throw new AppError('validation', 'صيغة Excel القديمة (.xls) غير مدعومة. احفظ الملف بصيغة .xlsx أو CSV ثم ارفعه.');
  if (name.endsWith('.xlsx')) return readXlsx(await file.arrayBuffer());
  if (name.endsWith('.csv') || name.endsWith('.tsv') || name.endsWith('.txt') || file.type.startsWith('text/')) {
    const buf = await file.arrayBuffer();
    let text = new TextDecoder('utf-8', { fatal: false }).decode(buf);
    // Excel "CSV" from Arabic Windows is often windows-1256
    let bad = 0;
    for (let i = 0; i < text.length && bad <= 3; i++) if (text.charCodeAt(i) === 0xfffd) bad++; // U+FFFD = undecodable byte
    if (bad > 3) text = new TextDecoder('windows-1256').decode(buf);
    return parseDelimited(text);
  }
  throw new AppError('validation', 'نوع الملف غير مدعوم. ارفع ملف Excel ‏(.xlsx) أو CSV.');
}

// ------------------------------------------------------------------ minimal zip + xlsx
interface ZipEntry { name: string; method: number; offset: number; compSize: number }

function zipEntries(buf: ArrayBuffer): ZipEntry[] {
  const v = new DataView(buf);
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) if (v.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new AppError('validation', 'تعذر قراءة ملف Excel. افتحه واحفظه من جديد، أو صدّره بصيغة CSV.');
  const count = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const out: ZipEntry[] = [];
  const dec = new TextDecoder();
  for (let i = 0; i < count; i++) {
    if (v.getUint32(p, true) !== 0x02014b50) break;
    const method = v.getUint16(p + 10, true), compSize = v.getUint32(p + 20, true);
    const nameLen = v.getUint16(p + 28, true), extraLen = v.getUint16(p + 30, true), commentLen = v.getUint16(p + 32, true);
    const offset = v.getUint32(p + 42, true);
    out.push({ name: dec.decode(new Uint8Array(buf, p + 46, nameLen)), method, offset, compSize });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

async function entryText(buf: ArrayBuffer, e: ZipEntry): Promise<string> {
  const v = new DataView(buf);
  const start = e.offset + 30 + v.getUint16(e.offset + 26, true) + v.getUint16(e.offset + 28, true);
  const data = new Uint8Array(buf, start, e.compSize);
  if (e.method === 0) return new TextDecoder().decode(data);
  if (e.method !== 8 || typeof DecompressionStream === 'undefined') throw new AppError('validation', 'متصفحك لا يستطيع فتح ملفات Excel. صدّر القائمة بصيغة CSV ثم ارفعها.');
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Response(stream).text();
}

const colIndex = (ref: string) => { let n = 0; for (const ch of ref.replace(/\d+/g, '')) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; };

async function readXlsx(buf: ArrayBuffer): Promise<string[][]> {
  const entries = zipEntries(buf);
  const find = (n: string) => entries.find((e) => e.name === n);
  const sheetEntry = find('xl/worksheets/sheet1.xml') ?? entries.filter((e) => /^xl\/worksheets\/sheet\d+\.xml$/.test(e.name)).sort((a, b) => a.name.localeCompare(b.name))[0];
  if (!sheetEntry) throw new AppError('validation', 'لم نجد ورقة بيانات في الملف.');
  const parser = new DOMParser();
  const shared: string[] = [];
  const ss = find('xl/sharedStrings.xml');
  if (ss) {
    const doc = parser.parseFromString(await entryText(buf, ss), 'application/xml');
    for (const si of Array.from(doc.getElementsByTagName('si'))) shared.push(Array.from(si.getElementsByTagName('t')).map((t) => t.textContent ?? '').join(''));
  }
  const doc = parser.parseFromString(await entryText(buf, sheetEntry), 'application/xml');
  const rows: string[][] = [];
  for (const row of Array.from(doc.getElementsByTagName('row'))) {
    const cells: string[] = [];
    for (const c of Array.from(row.getElementsByTagName('c'))) {
      const idx = colIndex(c.getAttribute('r') ?? 'A');
      const t = c.getAttribute('t');
      const vEl = c.getElementsByTagName('v')[0];
      let val = '';
      if (t === 's') val = shared[Number(vEl?.textContent ?? -1)] ?? '';
      else if (t === 'inlineStr') val = Array.from(c.getElementsByTagName('t')).map((x) => x.textContent ?? '').join('');
      else val = vEl?.textContent ?? '';
      // phone numbers stored as numbers come back like 966551234567 — keep digits only, no exponent
      if (!t && /^\d+(\.0+)?$/.test(val)) val = val.replace(/\.0+$/, '');
      cells[idx] = val.trim();
    }
    rows.push(Array.from(cells, (x) => x ?? ''));
  }
  return rows.filter((r) => r.some((x) => x));
}
