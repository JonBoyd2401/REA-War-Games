# Session protected research fixture

This version adds measurable server-side access boundaries to the original demonstration. It is a local research implementation, **not a production-ready identity or billing service**.

It uses random server-issued opaque sessions, server-side password verification, HttpOnly/SameSite cookies, session rotation, logout revocation and expiry, CSRF/origin checks, read/write permissions, tenant-scoped objects and events, strict quote inputs, private pricing, minimal responses, and a per-user budget with Retry-After. The publicly embedded `demo-A` bearer credential from v1 is not accepted.

Run the tests:

```powershell
node --test lab-v2/test/session-boundaries.test.mjs
```

Run a local interactive demo using passwords created only for this fixture:

```powershell
$env:LAB_USER_A_PASSWORD='replace-with-a-new-synthetic-A-password'
$env:LAB_USER_B_PASSWORD='replace-with-a-new-synthetic-B-password'
node lab-v2/start.mjs
```

Open `http://127.0.0.1:3002/`. User names are A and B. Credentials are never included in the served JavaScript. Normal startup disables the explicit research-probe UI. The REA runner enables that UI only to make authorised, reproducible probe requests visible to the capture tool.

Measured scenario output is in `runs/session-boundaries-20261018` in the published repository. The publication root's `run-session-boundaries.mjs` reruns nine REA browser scenarios, creates fresh synthetic secrets in memory, passes them through REA secret references, checks capture redaction and shuts each fixture down. Set `REA_BROWSER_EXECUTABLE` to an absolute local Chrome-family executable path. A new execution should use a clean checkout/output directory; evidence files are opened exclusively to prevent silent overwrite.

## What the boundaries mean

A missing, forged, expired or revoked session cannot access protected quote data in the tested paths. A valid B session cannot access A's quote or event. A read-only session cannot create quotes. The server rejects client price/tenant fields and missing CSRF tokens. The fifth valid quote request in a one-minute per-user window is denied; creating another login session does not reset that budget.

An authorised customer can still inspect public UI code, see its own totals, and use the feature through REA. A tool-name detector is not part of these controls. A customer who steals a live authorised session or compromises the server is outside the demonstrated protection.

## Production work still required

Use a maintained identity provider, TLS and Secure cookies for a deployed product. This loopback HTTP fixture deliberately cannot demonstrate transport protection. Add distributed session storage and atomic quota enforcement, reliable logout/revocation propagation, key and secret management, account lifecycle controls, MFA/SSO where appropriate, security monitoring, patch management, abuse response, dependency review and independent testing. Password verification here is synchronous and the data/session stores are in-memory; these are lab choices, not scaling recommendations.

The event response is finite; long-lived streams, revocation during streaming, cross-service authorisation and replay retention are untested. This code illustrates boundaries and their acceptance checks; it does not certify a real application's security.
