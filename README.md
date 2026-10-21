# DKMHC Public QA (synthetic policies and public-page smoke)

[العربية](docs/README_AR.md)

A completely separate, standalone verification example for generic appointment/payment gating and administrative message routing. It has **no access to or code copied from any private clinical repository**.

## Scope
- Demonstrate pure local logic using fabricated cases only.
- Check that unverified payment claims or pictures cannot create bookings.
- Require explicit human authorization before a booking is eligible.
- Route clinical or high-risk communications to a human without automated replies.
- Run a public-content guard that rejects likely secrets, patient details, and infrastructure artifacts.

## Read-only public-site smoke
- Only anonymous GET requests to the **public homepage** and two public booking-information pages.
- Does not submit booking forms, download or process patient data, follow outbound redirects, or call an API.
- Logs only route names and HTTP status codes. The monitor is not payment or calendar acceptance testing.
- Runs once per day and on workflow pushes.

## Never included
- No clinical data, patient records, message archives, real identifiers, payment receipts, private production API endpoints, private git history, credentials, environment files, Google/Meta/Cloudflare connectivity, or deployments.
- No claim that this small demonstration validates the actual clinic systems.

## Run
Requires Node.js 20+; no dependencies or account access.

```bash
npm test
npm run audit:public
```

The GitHub Actions workflow runs local tests, the public-content audit, and a strictly anonymous read-only HTTP check of three public pages. No deployment or secrets.

## Public-repository rule
Before adding any future file, it must be independently reviewed for sensitive content and must not be copied from the private repository without an explicit per-file audit and approval. Never connect GitHub Actions in this repository to clinic services.
