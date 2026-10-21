import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectPath, inspectText } from '../src/public-safety-policy.mjs';

test('approved synthetic source path passes', () => {
  assert.deepEqual(inspectPath('tests/booking-contract.test.mjs'), []);
});
test('private code tree cannot be slipped into the public repo', () => {
  assert.ok(inspectPath('clinical/supabase/bootstrap.sql').length);
  assert.ok(inspectPath('src/patients/export.json').length);
  assert.ok(inspectPath('workers/main.mjs').length);
});
test('unapproved GitHub automation is rejected', () => {
  assert.ok(inspectPath('.github/workflows/deploy.yml').length);
});
test('env and key files are rejected regardless of text', () => {
  assert.ok(inspectPath('.env.production').length);
  assert.ok(inspectPath('src/admin.key').length);
});
test('unsafe relative paths are rejected', () => {
  assert.ok(inspectPath('../private.txt').length);
  assert.ok(inspectPath('/home/user/data.json').length);
  assert.ok(inspectPath('tests\\sample.mjs').length);
});
test('an invented token-shape is detected', () => {
  const generated = ['gh', 'p_', 'a'.repeat(30)].join('');
  assert.ok(inspectText('tests/fake.mjs', generated).length);
});
test('an invented phone shape is detected', () => {
  const generated = ['249', '91', '1234567'].join('');
  assert.ok(inspectText('docs/fake.md', generated).length);
});
test('a fabricated example mailbox is permitted', () => {
  assert.deepEqual(inspectText('tests/fake.mjs', 'fake@example.test'), []);
});
test('a fabricated personal mailbox is detected', () => {
  const generated = ['fake', '@', 'my-provider', '.com'].join('');
  assert.ok(inspectText('tests/fake.mjs', generated).length);
});
test('non-approved workflow commands are detected', () => {
  const bad = 'permissions:\n  contents: read\n- uses: actions/checkout@v4\n- uses: actions/setup-node@v4\n  run: echo unsafe';
  assert.ok(inspectText('.github/workflows/public-qa.yml', bad).length);
});
