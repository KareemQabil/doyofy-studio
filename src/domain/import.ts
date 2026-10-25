/**
 * Guest import: CSV/TSV parsing, column mapping (Arabic + English headers), row validation,
 * duplicate detection (inside the file and against the current list) and resolution decisions.
 * Pure functions — the UI re-runs `reviewImport` after every edit/decision.
 */
import type { InvitationParty, PartyInput } from './types';
import { normalisePhone } from './phone';
import { toArabicDigitsSafe } from './format';
import { normaliseForSearch } from './parties';

export interface RawTable { headers: string[]; rows: string[][]; hadHeader: boolean }

// ------------------------------------------------------------------ parsing
export function parseDelimited(text: string): string[][] {
  const src = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const firstLine = src.split('\n').find((l) => l.trim()) ?? '';
  const delim = ['\t', ';', ',', '،'].map((d) => [d, firstLine.split(d).length] as const).sort((a, b) => b[1] - a[1])[0]![0];
  const out: string[][] = [];
  let row: string[] = [], cell = '', quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === '') quoted = true;
    else if (ch === delim) { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell); out.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); out.push(row); }
  return out.map((r) => r.map((c) => c.trim())).filter((r) => r.some((c) => c !== ''));
}

const looksLikeData = (c: string) => /\d{5,}/.test(toArabicDigitsSafe(c)) || /^\d+$/.test(toArabicDigitsSafe(c).trim());

export function toRawTable(cells: string[][]): RawTable {
  const width = Math.max(0, ...cells.map((r) => r.length));
  const pad = (r: string[]) => [...r, ...Array(Math.max(0, width - r.length)).fill('')];
  const first = cells[0] ?? [];
  const hadHeader = first.some((h) => guessField(h) !== null) && !first.some(looksLikeData);
  const headers = hadHeader ? pad(first).map((h, i) => h || `عمود ${i + 1}`) : Array.from({ length: width }, (_, i) => `عمود ${i + 1}`);
  return { headers, rows: (hadHeader ? cells.slice(1) : cells).map(pad), hadHeader };
}

// ------------------------------------------------------------------ mapping
export type ImportField = 'name' | 'phone' | 'size' | 'companions' | 'notes' | 'side' | 'ignore';
export const FIELD_LABEL: Record<ImportField, string> = {
  name: 'اسم الضيف أو العائلة', phone: 'رقم الجوال', size: 'العدد المسموح', companions: 'أسماء المرافقين', notes: 'ملاحظات', side: 'الجهة', ignore: 'تجاهل هذا العمود',
};
export const REQUIRED_FIELDS: ImportField[] = ['name'];

const SYNONYMS: Array<[ImportField, RegExp]> = [
  ['phone', /(جوال|هاتف|موبايل|تلفون|رقم|واتس|phone|mobile|tel|whats|number)/i],
  ['size', /(عدد|العدد|أشخاص|اشخاص|المسموح|size|count|guests|pax|seats|party)/i],
  ['companions', /(مرافق|المرافقين|companion|plus|with)/i],
  ['notes', /(ملاحظ|note|comment)/i],
  ['side', /(جهة|الجهة|طرف|مجموعة|side|group|family of)/i],
  ['name', /(اسم|الاسم|ضيف|الضيف|عائلة|name|guest|full)/i],
];

export function guessField(header: string): ImportField | null {
  for (const [field, re] of SYNONYMS) if (re.test(header)) return field;
  return null;
}

export type Mapping = ImportField[]; // one per column

export function guessMapping(t: RawTable): Mapping {
  const used = new Set<ImportField>();
  const m: Mapping = t.headers.map((h, i) => {
    let f = t.hadHeader ? guessField(h) : null;
    if (!f) {
      // no header: look at the data
      const col = t.rows.slice(0, 20).map((r) => r[i] ?? '').filter(Boolean);
      if (col.length && col.filter((c) => normalisePhone(c).ok).length >= col.length * 0.6) f = 'phone';
      else if (col.length && col.every((c) => /^\d{1,2}$/.test(toArabicDigitsSafe(c)))) f = 'size';
      else if (col.length && !used.has('name')) f = 'name';
    }
    if (!f || (f !== 'ignore' && used.has(f))) return 'ignore';
    used.add(f);
    return f;
  });
  return m;
}

export function mappingProblems(m: Mapping): string[] {
  const p: string[] = [];
  if (!m.includes('name')) p.push('حدد العمود الذي فيه أسماء الضيوف.');
  const dup = m.filter((f) => f !== 'ignore' && m.indexOf(f) !== m.lastIndexOf(f));
  if (dup.length) p.push(`عمود «${FIELD_LABEL[dup[0]!]}» محدد أكثر من مرة.`);
  return p;
}

// ------------------------------------------------------------------ review
export type IssueCode = 'missing_name' | 'malformed_phone' | 'duplicate_in_file' | 'duplicate_existing' | 'missing_phone' | 'invalid_size';
export interface Issue { code: IssueCode; blocking: boolean; text: string; withRow?: number; withParty?: string }

export interface RowEdit { name?: string; phone?: string; size?: string }
export type RowDecision = 'import' | 'skip' | 'import_without_phone';

export interface ImportRow {
  index: number;               // 1-based row number in the file (after header)
  name: string;
  phoneRaw: string;
  phone?: string;              // normalised
  size: number;
  companions: string[];
  notes?: string;
  side?: string;
  issues: Issue[];
  decision: RowDecision;
  /** 'ok' = will import as is · 'warning' = will import, with a note · 'blocked' = needs a fix or skip · 'skipped' */
  state: 'ok' | 'warning' | 'blocked' | 'skipped';
}

export interface ReviewInput {
  table: RawTable;
  mapping: Mapping;
  edits: Record<number, RowEdit>;
  decisions: Record<number, RowDecision>;
  existing: readonly InvitationParty[];
  defaultSize: number;
}

export function reviewImport(inp: ReviewInput): ImportRow[] {
  const col = (f: ImportField) => inp.mapping.indexOf(f);
  const get = (r: string[], f: ImportField) => (col(f) >= 0 ? (r[col(f)] ?? '').trim() : '');
  const existingByPhone = new Map(inp.existing.filter((p) => p.phone).map((p) => [p.phone!, p]));
  const existingByName = new Map(inp.existing.map((p) => [normaliseForSearch(p.primaryGuestName), p]));
  const firstRowForPhone = new Map<string, number>();

  return inp.table.rows.map((r, i) => {
    const index = i + 1;
    const edit = inp.edits[index] ?? {};
    const name = (edit.name ?? get(r, 'name')).replace(/\s+/g, ' ').trim();
    const phoneRaw = edit.phone ?? get(r, 'phone');
    const sizeRaw = toArabicDigitsSafe(edit.size ?? get(r, 'size'));
    const phoneRes = normalisePhone(phoneRaw);
    const issues: Issue[] = [];
    const decision: RowDecision = inp.decisions[index] ?? 'import';
    const dropPhone = decision === 'import_without_phone';

    if (!name) issues.push({ code: 'missing_name', blocking: true, text: 'الاسم فارغ' });
    let phone: string | undefined;
    if (!phoneRes.ok && phoneRes.reason === 'malformed' && !dropPhone) issues.push({ code: 'malformed_phone', blocking: true, text: `رقم غير صحيح: ${phoneRaw}` });
    else if (phoneRes.ok && !dropPhone) phone = phoneRes.e164;
    else if (!phoneRes.ok && phoneRes.reason === 'empty') issues.push({ code: 'missing_phone', blocking: false, text: 'بلا رقم جوال — لن تصله الدعوة عبر واتساب' });

    if (phone) {
      const ex = existingByPhone.get(phone);
      if (ex) issues.push({ code: 'duplicate_existing', blocking: true, text: `الرقم موجود في القائمة باسم «${ex.primaryGuestName}»`, withParty: ex.id });
      else if (firstRowForPhone.has(phone) && decision !== 'skip') issues.push({ code: 'duplicate_in_file', blocking: true, text: `الرقم مكرر في الملف (صف ${firstRowForPhone.get(phone)})`, withRow: firstRowForPhone.get(phone) });
      else if (decision !== 'skip') firstRowForPhone.set(phone, index);
    } else if (name && existingByName.has(normaliseForSearch(name))) {
      // same name, no phone to compare: a warning only (two people can share a name)
      issues.push({ code: 'duplicate_existing', blocking: false, text: `يوجد في القائمة ضيف بنفس الاسم`, withParty: existingByName.get(normaliseForSearch(name))!.id });
    }

    let size = Number.parseInt(sizeRaw, 10);
    if (sizeRaw && (!Number.isFinite(size) || size < 1 || size > 20)) {
      issues.push({ code: 'invalid_size', blocking: false, text: `عدد غير مفهوم «${sizeRaw}» — سيُستخدم ${inp.defaultSize}` });
      size = inp.defaultSize;
    } else if (!sizeRaw) size = inp.defaultSize;

    // duplicates need an explicit decision (skip, or import anyway) — never silently added or dropped
    const explicitImport = inp.decisions[index] === 'import';
    const blocking = issues.some((x) => x.blocking && decision !== 'skip' && !(x.code.startsWith('duplicate') && explicitImport));
    const state: ImportRow['state'] = decision === 'skip' ? 'skipped' : blocking ? 'blocked' : issues.length ? 'warning' : 'ok';
    const companions = get(r, 'companions').split(/[،,;|\n]/).map((s) => s.trim()).filter(Boolean);
    return {
      index, name, phoneRaw, phone: dropPhone ? undefined : phone, size, companions,
      notes: get(r, 'notes') || undefined, side: get(r, 'side') || undefined, issues, decision, state,
    };
  });
}

export interface ImportSummary { total: number; toImport: number; skipped: number; blocked: number; warnings: number; people: number }

export function summarise(rows: readonly ImportRow[]): ImportSummary {
  const s: ImportSummary = { total: rows.length, toImport: 0, skipped: 0, blocked: 0, warnings: 0, people: 0 };
  for (const r of rows) {
    if (r.state === 'skipped') s.skipped++;
    else if (r.state === 'blocked') s.blocked++;
    else { s.toImport++; s.people += r.size; if (r.state === 'warning') s.warnings++; }
  }
  return s;
}

export function rowsToPartyInputs(rows: readonly ImportRow[]): PartyInput[] {
  return rows
    .filter((r) => r.state === 'ok' || r.state === 'warning')
    .map((r) => ({ primaryGuestName: r.name, phone: r.phone, maxPartySize: r.size, companionNames: r.companions.length ? r.companions : undefined, notes: r.notes, side: r.side }));
}

/** the sample file offered in the import flow (also downloadable) — includes the states testers must handle */
export const SAMPLE_IMPORT_CSV = [
  'الاسم,رقم الجوال,العدد,الجهة,ملاحظات',
  'عائلة الدوسري,0551203344,4,الأهل,',
  'سلطان القحطاني,+966 55 870 1122,2,الأهل,',
  'خالد عبدالله العتيبي,0503377120,3,أصدقاء,',
  'هيا الشمري,0548812290,1,الأصدقاء,',
  'منيرة الزهراني,0569023318,2,الأقارب,',
  'فهد المطيري,0532218876,2,أصدقاء,',
  'خالد العتيبي,050 337 7120,2,أصدقاء,نفس رقم خالد عبدالله؟',
  'ريم الغامدي,0551840092,1,الأصدقاء,',
  'عائلة الحربي,0559912024,5,الأقارب,',
  'بدر السبيعي,0541123905,2,أصدقاء,',
  'نوف الشهري,0567784410,2,الأقارب,',
  ',0581239870,2,,بدون اسم',
  'سعود البقمي,0509981177,2,الأهل,',
  'عبير الجهني,0554410983,1,الأصدقاء,',
  'تركي العنزي,05512,2,أصدقاء,رقم ناقص',
  'لطيفة الرشيد,0533390012,3,الأقارب,',
  'ماجد الشهراني,0548870021,2,أصدقاء,',
  'جواهر السديري,,2,الأقارب,لا يوجد رقم',
  'عبدالرحمن الفيفي,0571129904,2,الأهل,',
  'أم تركي الحربي,0551234567,3,الأهل,',
  'وليد الزهراني,0560023341,2,أصدقاء,',
].join('\n');
