import test from 'node:test';
import assert from 'node:assert/strict';
import { decideBooking } from '../src/booking-policy.mjs';

test('claim and picture are not proof of payment', () => {
  const decision = decideBooking({ claimedPayment: true, receiptImageProvided: true, consentGiven: true, slotAvailable: true, authorizedReviewer: true });
  assert.equal(decision.mayIssueBooking, false);
  assert.equal(decision.booked, false);
});

test('unapproved actor cannot authorize', () => {
  assert.equal(decideBooking({ paymentVerified: true, consentGiven: true, slotAvailable: true, authorizedReviewer: false }).mayIssueBooking, false);
});

test('consent is mandatory', () => {
  assert.equal(decideBooking({ paymentVerified: true, consentGiven: false, slotAvailable: true, authorizedReviewer: true }).mayIssueBooking, false);
});

test('a slot must be available', () => {
  assert.equal(decideBooking({ paymentVerified: true, consentGiven: true, slotAvailable: false, authorizedReviewer: true }).mayIssueBooking, false);
});

test('even eligible cases are NOT booked by this module', () => {
  const result = decideBooking({ paymentVerified: true, consentGiven: true, slotAvailable: true, authorizedReviewer: true });
  assert.equal(result.mayIssueBooking, true);
  assert.equal(result.booked, false);
});
