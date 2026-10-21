/*
 * Standalone demonstrator using fictional claim/account identifiers.
 * No database, payment provider, money movement or booking side effects.
 */
export function newClaim({ claimId, accountId, evidenceKind = 'none' } = {}) {
  if (typeof claimId !== 'string' || !claimId || typeof accountId !== 'string' || !accountId) {
    throw new TypeError('Synthetic claim and account IDs are required');
  }
  return Object.freeze({
    claimId, accountId, evidenceKind, phase: 'PENDING',
    providerVerified: false, reviewedBy: null, parentClaimId: null,
  });
}

export function reviewClaim(claim, { actor, decision, independentVerification } = {}) {
  if (!claim || actor !== 'owner') throw new Error('Owner review required');
  if (claim.phase !== 'PENDING') throw new Error('Claim already resolved; use a new claim for corrections');
  if (decision === 'reject') {
    return Object.freeze({ ...claim, phase: 'REJECTED', reviewedBy: actor });
  }
  if (decision === 'approve' && independentVerification === true) {
    return Object.freeze({
      ...claim, phase: 'VERIFIED', providerVerified: true, reviewedBy: actor,
    });
  }
  throw new Error('Independent payment verification required for approval');
}

export function correctRejectedClaim(claim, { newClaimId, accountId, evidenceKind = 'none' } = {}) {
  if (!claim || claim.phase !== 'REJECTED') throw new Error('Only a rejected claim may be corrected');
  if (claim.accountId !== accountId || claim.claimId === newClaimId) {
    throw new Error('Correction must belong to the same account with a fresh claim ID');
  }
  return Object.freeze({
    ...newClaim({ claimId: newClaimId, accountId, evidenceKind }),
    parentClaimId: claim.claimId,
  });
}

export function bookingEligibility({ claim, accountId, consentGiven, slotAvailable, ownerAuthorized } = {}) {
  const permitted = Boolean(
    claim && claim.accountId === accountId && claim.phase === 'VERIFIED' &&
    claim.providerVerified === true && claim.reviewedBy === 'owner' &&
    consentGiven === true && slotAvailable === true && ownerAuthorized === true
  );
  return Object.freeze({ permitted, booked: false });
}
