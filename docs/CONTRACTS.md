# Synthetic contract coverage and actual limitations

All cases use imaginary IDs and numerical timestamps. They are **example policy contracts**, not imports, copies or validations of the private clinic production implementation.

## Booking/payment
- Uploading a receipt or claiming to pay is not verification.
- Independent owner review is required for verification.
- Rejected claims require a new scoped claim rather than flipping a previous decision.
- Consent, identity/account match, active verification, owner authorization, and slot availability gate eligibility.
- The module never creates a calendar appointment.

## WhatsApp
- Clinical and high-risk holds persist across subsequent administrative messages.
- Explicit authorized human review is required before clearing a hold.
- Manual free text is only eligible inside a valid 24-hour service window.
- Outside the window, an approved template is required.
- The module performs no Meta calls and never sends a message.
- Accepted provider status is not proof of delivery.

## Time slots
- Boundaries are half-open and overlaps are rejected.
- No attempt is made to model distributed locks, calendar idempotency, timezone policy, or a real provider.

## Release blockers still outside this repository
- Actual private booking, clinician access control, payment ledger and Google Calendar integrations.
- Production WhatsApp webhook, delivery, template approval and billing.
- Real mobile browser workflows and production deployment verification.

A green public workflow **must not** be treated as a production release gate on its own. To validate real source safely, run private tests in a secure nonpublic execution environment. Never mirror secrets or production logs into this repository.
