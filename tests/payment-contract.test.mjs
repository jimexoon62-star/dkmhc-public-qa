import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newClaim, reviewClaim, correctRejectedClaim, bookingEligibility,
} from '../src/payment-contract.mjs';

const pending = () => newClaim({ claimId: 'fake-claim-A', accountId: 'fictional-account-A', evidenceKind: 'picture' });

test('picture or self-report starts PENDING, never verified', () => {
  const claim = pending();
  assert.equal(claim.phase, 'PENDING');
  assert.equal(claim.providerVerified, false);
});
test('a user cannot approve their own claim', () => {
  assert.throws(() => reviewClaim(pending(), { actor: 'claimant', decision: 'approve', independentVerification: true }));
});
test('owner cannot approve without independent verification', () => {
  assert.throws(() => reviewClaim(pending(), { actor: 'owner', decision: 'approve', independentVerification: false }));
});
test('owner may reject an unverified claim without booking it', () => {
  assert.equal(reviewClaim(pending(), { actor: 'owner', decision: 'reject' }).phase, 'REJECTED');
});
test('correction stays pending and never inherits previous approval', () => {
  const rejected = reviewClaim(pending(), { actor: 'owner', decision: 'reject' });
  const corrected = correctRejectedClaim(rejected, {
    newClaimId: 'fake-claim-B', accountId: 'fictional-account-A', evidenceKind: 'picture',
  });
  assert.equal(corrected.phase, 'PENDING');
  assert.equal(corrected.providerVerified, false);
  assert.equal(corrected.parentClaimId, 'fake-claim-A');
});
test('correction cannot switch account or reuse claim identity', () => {
  const rejected = reviewClaim(pending(), { actor: 'owner', decision: 'reject' });
  assert.throws(() => correctRejectedClaim(rejected, { newClaimId: 'fake-claim-B', accountId: 'fictional-account-B' }));
  assert.throws(() => correctRejectedClaim(rejected, { newClaimId: 'fake-claim-A', accountId: 'fictional-account-A' }));
});
test('rejected claim cannot later be approved silently', () => {
  const rejected = reviewClaim(pending(), { actor: 'owner', decision: 'reject' });
  assert.throws(() => reviewClaim(rejected, { actor: 'owner', decision: 'approve', independentVerification: true }));
});
test('verified claim alone cannot book without consent and slot', () => {
  const verified = reviewClaim(pending(), { actor: 'owner', decision: 'approve', independentVerification: true });
  assert.equal(bookingEligibility({
    claim: verified, accountId: verified.accountId, consentGiven: false,
    slotAvailable: true, ownerAuthorized: true,
  }).permitted, false);
  assert.equal(bookingEligibility({
    claim: verified, accountId: verified.accountId, consentGiven: true,
    slotAvailable: false, ownerAuthorized: true,
  }).permitted, false);
});
test('verified claim cannot be spent by another account', () => {
  const verified = reviewClaim(pending(), { actor: 'owner', decision: 'approve', independentVerification: true });
  assert.equal(bookingEligibility({
    claim: verified, accountId: 'fictional-account-B',
    consentGiven: true, slotAvailable: true, ownerAuthorized: true,
  }).permitted, false);
});
test('owner authorization is required at booking eligibility', () => {
  const verified = reviewClaim(pending(), { actor: 'owner', decision: 'approve', independentVerification: true });
  assert.equal(bookingEligibility({
    claim: verified, accountId: verified.accountId, consentGiven: true,
    slotAvailable: true, ownerAuthorized: false,
  }).permitted, false);
});
test('eligible never means calendar event created', () => {
  const verified = reviewClaim(pending(), { actor: 'owner', decision: 'approve', independentVerification: true });
  const result = bookingEligibility({
    claim: verified, accountId: verified.accountId, consentGiven: true,
    slotAvailable: true, ownerAuthorized: true,
  });
  assert.equal(result.permitted, true);
  assert.equal(result.booked, false);
});
