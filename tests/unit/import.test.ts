import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guessMapping, parseDelimited, toRawTable } from '../../src/domain/import';
import { fieldLabel } from '../../src/domain/import';

test('import: the app\'s own «القسم» column maps to the section field, so an export round-trip keeps sections', () => {
  const t = toRawTable(parseDelimited('الاسم,رقم الجوال,القسم,الطاولة\nنورة,+966 50 123 4567,أهل العروس,طاولة 1\n'));
  assert.deepEqual(guessMapping(t), ['name', 'phone', 'side', 'table']);
  for (const h of ['قسم', 'الأقسام', 'Section']) assert.equal(guessMapping(toRawTable(parseDelimited(`الاسم,${h}\nنورة,الأصدقاء\n`)))[1], 'side', h);
  assert.equal(fieldLabel('side'), 'القسم');
});
