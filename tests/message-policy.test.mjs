import test from 'node:test';
import assert from 'node:assert/strict';
import { routeAdministrativeMessage } from '../src/message-policy.mjs';

test('clinical item requires review with zero sends', () => {
  assert.deepEqual(routeAdministrativeMessage({ clinicalContent: true, intent: 'booking_information' }), { route: 'HUMAN_REVIEW', autoSend: false, approvedText: null });
});

test('high risk requires review with zero sends', () => {
  assert.equal(routeAdministrativeMessage({ highRisk: true, intent: 'appointment_information' }).autoSend, false);
  assert.equal(routeAdministrativeMessage({ highRisk: true, intent: 'appointment_information' }).route, 'HUMAN_REVIEW');
});

test('unknown intent requires review', () => {
  assert.equal(routeAdministrativeMessage({ intent: 'unknown_request' }).route, 'HUMAN_REVIEW');
});

test('administrative intent may produce a draft but never auto-send', () => {
  const result = routeAdministrativeMessage({ intent: 'booking_information' });
  assert.equal(result.route, 'ADMIN_DRAFT_ONLY');
  assert.equal(result.autoSend, false);
});
