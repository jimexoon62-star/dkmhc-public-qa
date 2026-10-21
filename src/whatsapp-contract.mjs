/*
 * Offline demonstration of WhatsApp administrative rules, not a WhatsApp sender.
 * No credentials, endpoint, phone number or network access.
 */
const ADMIN_INTENTS = new Set(['booking', 'appointment', 'payment_status']);
const DAY_MS = 24 * 60 * 60 * 1000;

export function advanceConversation(previous = {}, inbound = {}) {
  const clinicalHold = previous.clinicalHold === true ||
    inbound.clinical === true || inbound.highRisk === true;
  return Object.freeze({ clinicalHold, lastIntent: inbound.intent ?? previous.lastIntent ?? null });
}

export function clearHold(state, { actor, reviewed } = {}) {
  if (actor !== 'owner' || reviewed !== true) throw new Error('Human review authorization required');
  return Object.freeze({ ...state, clinicalHold: false });
}

export function outboundDecision({
  state = {}, intent, actor, nowMs, lastInboundMs, mode,
  approvedTemplate = false, clinical = false, highRisk = false,
} = {}) {
  if (state.clinicalHold === true || clinical === true || highRisk === true) {
    return Object.freeze({ allowHumanSend: false, autoSend: false, reason: 'CLINICAL_HOLD' });
  }
  if (!ADMIN_INTENTS.has(intent)) {
    return Object.freeze({ allowHumanSend: false, autoSend: false, reason: 'UNRECOGNIZED_INTENT' });
  }
  if (actor !== 'owner') {
    return Object.freeze({ allowHumanSend: false, autoSend: false, reason: 'HUMAN_AUTHORIZATION_REQUIRED' });
  }
  const insideWindow = Number.isFinite(nowMs) && Number.isFinite(lastInboundMs) &&
    nowMs >= lastInboundMs && nowMs - lastInboundMs < DAY_MS;
  if (mode === 'free_text' && insideWindow) {
    return Object.freeze({ allowHumanSend: true, autoSend: false, reason: 'MANUAL_WINDOW_OPEN' });
  }
  if (mode === 'template' && approvedTemplate === true) {
    return Object.freeze({ allowHumanSend: true, autoSend: false, reason: 'MANUAL_TEMPLATE_ONLY' });
  }
  return Object.freeze({ allowHumanSend: false, autoSend: false, reason: 'WINDOW_OR_TEMPLATE_REQUIRED' });
}

export function deliveryEvidence(providerEvents = []) {
  const valid = new Set(providerEvents);
  if (valid.has('failed')) return 'FAILED_NEEDS_REVIEW';
  if (valid.has('read')) return 'READ';
  if (valid.has('delivered')) return 'DELIVERED';
  if (valid.has('sent')) return 'SENT_UNCONFIRMED_DELIVERY';
  if (valid.has('accepted')) return 'ACCEPTED_NOT_DELIVERED';
  return 'UNKNOWN';
}
