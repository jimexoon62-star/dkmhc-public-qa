/** Synthetic sample administrative router; no messaging/AI/service connections. */
const ALLOWED = new Set(['booking_information', 'appointment_information', 'payment_information']);

export function routeAdministrativeMessage(input = {}) {
  if (input.highRisk === true || input.clinicalContent === true) {
    return { route: 'HUMAN_REVIEW', autoSend: false, approvedText: null };
  }
  if (!ALLOWED.has(input.intent)) {
    return { route: 'HUMAN_REVIEW', autoSend: false, approvedText: null };
  }
  // Routing an administrative intent is not permission to send text.
  return { route: 'ADMIN_DRAFT_ONLY', autoSend: false, approvedText: null };
}
