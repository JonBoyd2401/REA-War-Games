# REA War Games

**Measured ways to block unauthorised requests and reduce information exposure to REA and similar tools.**

This repository contains real localhost experiments with **REA 6.7.0**, a deliberately unsafe SaaS pricing lab, a separate session-protected lab, a readable white paper, and the evidence needed to check the conclusions.

## Start here

- **Understand the result:** [Plain-English protection guide](docs/PROTECTION_GUIDE.md).
- **Read or share the research:** [White paper PDF](docs/REA_SaaS_Protection_White_Paper.pdf).
- **Check what passed:** [Measurable success criteria](docs/SUCCESS_CRITERIA.md).
- **Run the code:** [Reproduction instructions](docs/REPRODUCE.md).
- **Continue the work:** [Research gaps and contributions](docs/CONTINUATION.md).
- **Download a pack:** [Full research pack](dist/REA_War_Games_Research_Pack.zip) or [developer lab pack](dist/REA_War_Games_Developer_Pack.zip).

## What actually stopped the tested requests

| Attempt through REA | Session lab result | Protection |
|---|---|---|
| Access without a session | 401 | Server requires authentication |
| Invent a session cookie | 401 | Random server-held session state |
| Replay a revoked session | 401 | Revocation checked on the server |
| Read another tenant's quote or event | 404 | Object and tenant authorisation |
| Create a quote as a read-only user | 403 | Action permission check |
| Supply a forged price or tenant | 422 | Strict inputs and server authority |
| Send a state change without the required CSRF token | 403 | Request-integrity check |
| Make a fifth quote request within the tested budget | 429 | Server-enforced quota |
| Make a permitted quote request | 201, GBP 1104 | Legitimate feature still works |

These are **hard request denials in the tested scope**, not a claim that REA itself stops running. An authorised customer can still inspect delivered UI code and permitted outputs. The controls also apply to equivalent HTTP clients.

## What reduced disclosure

The original unsafe frontend delivered the full pricing formula and three bands. In the hardened baseline, the formula was absent from the captured UI script. The quote response changed from **9 fields / 370 bytes** to **3 fields / 80 bytes**, while returning the same legitimate price. Source-map and debug routes were unavailable in the hardened condition.

We also tested incomplete fixes:

- Removing source maps alone **did not hide the formula** in JavaScript.
- Moving calculation out of the frontend **still leaked the bands** when the API returned them.
- Minimising the API response **still leaked the formula** when the frontend contained it.

The original v1 fixture's published demo token is a real weakness: replaying the token retrieved A's quote. **Do not use v1 authentication in a real product.** The separate [session lab](lab-v2/README.md) removes that credential exposure and demonstrates the session boundaries above.

## How much evidence exists

- **56 measured REA commands completed:** 18 baseline, 11 controlled/repeated supplemental captures, 18 portable-runner validation operations, and 9 session-boundary captures.
- **23 application tests passed:** 9 original regression tests and 14 session-boundary tests.
- The original browser-driven tenant and mutation probes were repeated **three times per condition** on fresh fixtures, with the same outcomes.
- Original commands, captures, coverage flags, evidence paths, source hashes and a [verification script](verify-evidence.mjs) are included.

This is a synthetic engineering study, not a production security certification. REA scenarios report incomplete overall capture coverage; the specific retained responses support the stated claims. There was no independent blind reconstruction or adaptive autonomous red-team study. [Full scope and limitations](docs/SUCCESS_CRITERIA.md).

## Quick checks

Use a supported Node version. The original run used Node 24.19.0 and Chrome 155.0.8059.82.

```sh
node --test lab/test/wargame.test.mjs lab-v2/test/session-boundaries.test.mjs
node verify-evidence.mjs
```

Run only the owned localhost fixtures. The code binds to loopback. For a real SaaS deployment, use maintained identity infrastructure, TLS, distributed enforcement and a security review; the session lab remains an educational implementation.

## Repository layout

| Path | Contents |
|---|---|
| `lab/` | Original unchanged unsafe/hardened fixture and tests |
| `lab-v2/` | Opaque sessions, revocation, permissions, CSRF and tenant checks |
| `runs/` | Path-redacted evidence and measured outcomes |
| `docs/` | Human-readable guides, white paper and continuation notes |
| `provenance/` | Package pinning, hashes, original-run scripts and redaction record |
| `dist/` | Distribution packs |

Local account/workspace paths have been replaced in sharing copies. Original internal hashes are retained as provenance; a redacted evidence envelope is not byte-identical to the private raw file. The public SHA-256 manifest verifies the distributed files, and capture-body hashes can be checked independently. See [evidence handling](docs/EVIDENCE.md).
