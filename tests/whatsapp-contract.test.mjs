import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceConversation, clearHold, outboundDecision, deliveryEvidence,
} from '../src/whatsapp-contract.mjs';

const now = 10 * 24 * 60 * 60 * 1000;
const hour = 60 * 60 * 1000;
const baseline = { state: {}, intent: 'booking', actor: 'owner', nowMs: now };

test('clinical hold persists after later payment metadata', () => {
  const held = advanceConversation({}, { clinical: true, intent: 'clinical' });
  const later = advanceConversation(held, { intent: 'payment_status' });
  assert.equal(later.clinicalHold, true);
});
test('high risk hold persists after harmless appointment update', () => {
  const held = advanceConversation({}, { highRisk: true });
  assert.equal(advanceConversation(held, { intent: 'appointment' }).clinicalHold, true);
});
test('a clinical hold refuses approved administrative templates', () => {
  const result = outboundDecision({
    ...baseline, state: { clinicalHold: true }, mode: 'template', approvedTemplate: true,
  });
  assert.equal(result.allowHumanSend, false);
  assert.equal(result.autoSend, false);
});
test('hold cannot be cleared by unreviewed AI or unauthorized user', () => {
  assert.throws(() => clearHold({ clinicalHold: true }, { actor: 'model', reviewed: true }));
  assert.throws(() => clearHold({ clinicalHold: true }, { actor: 'owner', reviewed: false }));
});
test('owner review can explicitly clear hold in this toy state model', () => {
  assert.equal(clearHold({ clinicalHold: true }, { actor: 'owner', reviewed: true }).clinicalHold, false);
});
test('inside 24 hours a manual administrative free-text send may be eligible', () => {
  const result = outboundDecision({ ...baseline, lastInboundMs: now - hour, mode: 'free_text' });
  assert.equal(result.allowHumanSend, true);
  assert.equal(result.autoSend, false);
});
test('at exact 24-hour boundary free-text is not eligible', () => {
  assert.equal(outboundDecision({
    ...baseline, lastInboundMs: now - 24 * hour, mode: 'free_text',
  }).allowHumanSend, false);
});
test('outside 24 hours free text is refused', () => {
  assert.equal(outboundDecision({
    ...baseline, lastInboundMs: now - 25 * hour, mode: 'free_text',
  }).allowHumanSend, false);
});
test('outside 24 hours human-approved official template is eligible', () => {
  const x = outboundDecision({
    ...baseline, lastInboundMs: now - 25 * hour,
    mode: 'template', approvedTemplate: true,
  });
  assert.equal(x.allowHumanSend, true);
  assert.equal(x.autoSend, false);
});
test('an unapproved template is not eligible', () => {
  assert.equal(outboundDecision({
    ...baseline, mode: 'template', approvedTemplate: false,
  }).allowHumanSend, false);
});
test('human authorization cannot be replaced by intent matching', () => {
  assert.equal(outboundDecision({
    ...baseline, actor: 'ai', lastInboundMs: now - hour, mode: 'free_text',
  }).allowHumanSend, false);
});
test('unrecognized clinical or other intent never becomes administrative', () => {
  assert.equal(outboundDecision({
    ...baseline, intent: 'medication', lastInboundMs: now - hour, mode: 'free_text',
  }).allowHumanSend, false);
});
test('a future inbound timestamp must not open a service window', () => {
  assert.equal(outboundDecision({
    ...baseline, lastInboundMs: now + hour, mode: 'free_text',
  }).allowHumanSend, false);
});
test('provider accepted is not delivered', () => {
  assert.equal(deliveryEvidence(['accepted']), 'ACCEPTED_NOT_DELIVERED');
  assert.equal(deliveryEvidence(['sent']), 'SENT_UNCONFIRMED_DELIVERY');
});
test('provider delivered/read evidence is distinct from accepted', () => {
  assert.equal(deliveryEvidence(['accepted', 'delivered']), 'DELIVERED');
  assert.equal(deliveryEvidence(['read']), 'READ');
});
test('failure demands review rather than success claim', () => {
  assert.equal(deliveryEvidence(['accepted', 'failed']), 'FAILED_NEEDS_REVIEW');
});
