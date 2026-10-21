# DKMHC Public QA (isolated / synthetic)

[العربية](docs/README_AR.md)

A completely separate, standalone verification example for generic appointment/payment gating and administrative message routing. It has **no access to or code copied from any private clinical repository**.

## Scope
- Demonstrate pure local logic using fabricated cases only.
- Check that unverified payment claims or pictures cannot create bookings.
- Require explicit human authorization before a booking is eligible.
- Route clinical or high-risk communications to a human without automated replies.
- Run a public-content guard that rejects likely secrets, patient details, and infrastructure artifacts.

## Never included
- No clinical data, patient records, message archives, real identifiers, payment receipts, production hostnames or endpoints, private git history, credentials, environment files, Google/Meta/Cloudflare connectivity, or deployments.
- No claim that this small demonstration validates the actual clinic systems.

## Run
Requires Node.js 20+; no dependencies or account access.

```bash
npm test
npm run audit:public
```

The GitHub Actions workflow runs only these two local commands. No deploy, no external API calls, no secrets.

## Public-repository rule
Before adding any future file, it must be independently reviewed for sensitive content and must not be copied from the private repository without an explicit per-file audit and approval. Never connect GitHub Actions in this repository to clinic services.
