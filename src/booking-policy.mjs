/** Synthetic sample policy; not connected to any real payment or booking provider. */
export function decideBooking(input = {}) {
  const paymentVerified = input.paymentVerified === true;
  const consentGiven = input.consentGiven === true;
  const slotAvailable = input.slotAvailable === true;
  const authorizedReviewer = input.authorizedReviewer === true;

  // A claimant saying they paid, or showing a receipt picture, has no authority.
  const mayIssueBooking = paymentVerified && consentGiven && slotAvailable && authorizedReviewer;
  return {
    mayIssueBooking,
    status: mayIssueBooking ? 'ELIGIBLE_FOR_HUMAN_BOOKING' : 'NOT_AUTHORIZED',
    // The caller still needs a completely separate human-controlled booking action.
    booked: false,
  };
}
