import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAccount, safeAccountReturn } from '../../src/domain/account';

test('demo session recovers invalid storage and limits profile fields', () => {
  assert.deepEqual(parseAccount('{invalid'), { status: 'demo' });
  assert.deepEqual(parseAccount('{"status":"signed-out","name":"old"}'), { status: 'signed-out' });
  assert.equal(parseAccount(JSON.stringify({status:'demo',name:'a'.repeat(100),email:'b'.repeat(200)})).name?.length,70);
});
test('account return keeps invitation and reception paths but rejects external or control redirects', () => {
  for (const path of ['/app/events/evt_wedding/invitation/design?theme=signature','/check-in/evt_wedding','/app/account']) assert.equal(safeAccountReturn(path),path);
  for (const path of [null,'https://evil.test','//evil.test','javascript:alert(1)','/app/logout','/app/events\\evil','/app/events\nLocation: evil']) assert.equal(safeAccountReturn(path),'/app/events');
});
