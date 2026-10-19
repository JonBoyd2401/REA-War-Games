# A practical guide to protection

## The short answer

**Latest evidence:** the [actual-agent scorecard](AGENT_BENCHMARK.md) measures exact and approximate reconstruction by fresh REA-assisted LLM agents across six policies. Read it alongside the [workflow boundary study](BOUNDARY_FINDINGS.md), which tests consistent approvals across quotes, exports and jobs, including two controls that deliberately fail. [What REA actually does](HOW_REA_WORKS.md) separates observation tools, earlier custom learners and the new adaptive agents.

**New measured evidence:** the [19 October reconstruction supplement](RECONSTRUCTION_FINDINGS.md) shows why rate limits and rounding can still permit useful imitations. An approved-quote-only workflow reduced measured reconstruction more strongly, with a substantial product restriction. Use those results alongside the access-boundary guidance below.

**You can stop an unauthorised action by refusing it on the server. You cannot promise to hide information that your product deliberately gives an authorised customer.**

REA is a capable inspection and analysis tool. Detecting its name is not a dependable trust boundary. The strongest demonstrated controls in this project act on identity, permission, tenant ownership, accepted input and request budgets. They still work when the caller uses REA.

## Use hard blocks where a denial is the right outcome

| Control | What it stops in this lab | What it does not stop |
|---|---|---|
| Server-issued opaque sessions | Missing, forged and revoked session access | Use by a genuinely authorised customer; stolen live credentials are a separate risk |
| Least privilege | A read-only account creating quotes | Reading information that the account is allowed to read |
| Object/tenant checks | B reading A's quote and event | A viewing A's own information |
| Server-calculated totals and strict input | Client choosing a price or tenant | Inferring a rule from legitimate totals |
| CSRF/origin controls | Tested state-changing requests without the required integrity token | An authorised same-origin client obtaining its own token |
| Action quotas | The fifth request in the tested budget | Learning from the first four answers or from later windows |
| Private logic and unavailable private routes | The demonstrated direct code, map and debug disclosures | Learning product behaviour from visible outputs |

Use the [success criteria](SUCCESS_CRITERIA.md) for exact evidence and results. “Blocked” refers to a named request, not to every possible use of REA.

## Apply the controls together

1. **Protect authority.** The server decides the user, tenant, permissions, price and final state. A browser supplies only permitted inputs.
2. **Minimise what is delivered.** Keep private implementation out of client assets. Send only fields needed for the customer outcome, including in errors and event streams.
3. **Enforce the same rules everywhere.** Cover exports, jobs, caches, alternate endpoints, events and reconnects. One overlooked path can undermine an otherwise correct boundary.
4. **Control volume and observe misuse.** Use quotas with useful retry behaviour. Monitor denials and unusual business-action patterns, and measure false positives.
5. **Test both denial and usability.** A defence that breaks all access is not a successful product control. Keep an authorised success case beside every negative test.

The controlled variants show why one partial fix is insufficient. No maps still left the formula in JavaScript. No formula in the UI still left the bands in the API. A smaller API body still left the formula in JavaScript.

## What developers should implement

- Strict request schemas that reject unexpected price, tenant and role fields.
- Server-side pricing, entitlement and state-transition checks.
- Explicit response schemas and minimal event payloads.
- Maintained identity/session code; HttpOnly/SameSite/Secure cookies as appropriate to the deployed architecture; CSRF controls where required.
- Object-level checks for each requested operation, not merely authentication at the route.
- Tests for missing, forged, expired and revoked identity, cross-tenant reads/writes, permission changes and duplicate/replayed actions.
- Build and delivery checks for private code, source maps, credentials, diagnostic routes and stale artifacts.

**Measure:** attempted unauthorised operations and their outcomes; private fields returned; legitimate task success; regression failures. Do not equate “no string found” with proof that the whole application is safe.

## What architects should design

- A documented trust boundary and ownership model for each sensitive capability.
- Central or consistently applied policy, with tenant context carried through jobs, caches and streams.
- TLS and appropriate credential protection; durable session revocation and account lifecycle controls.
- Atomic budgets across replicas and equivalent routes, rather than per-process counters.
- Least-privilege service identities and carefully scoped diagnostic access.
- Independent review of failure states, replay, stale policy, race conditions and data exports.

**Measure:** coverage of the access matrix, consistency across replicas, revocation delay, quota races, availability under dependency failure and customer-visible latency. These production characteristics were not demonstrated by the local fixture.

## What product managers should decide

- Which exact outputs are genuinely needed for customer value.
- Which roles may use sensitive features and at what volume.
- Whether bulk exports, detailed traces, internal identifiers or very precise outputs are necessary.
- How legitimate customers recover from limits and receive support.
- Which remaining inference risks are acceptable for the business model.

**Measure:** task completion, retry delays, support demand, false positives and accessibility. Reducing precision or withholding a feature may reduce an inference opportunity, but it changes the product and must be evaluated explicitly.

## Highest protection requires an operational system

For a deployed product, combine the controls with maintained authentication, secure configuration, patching, secret management, monitoring, incident response, backups and independent testing. The research fixture does not certify those capabilities. It uses localhost HTTP and in-memory stores; it is intentionally much smaller than a real SaaS system.

Obfuscation, anti-debugging, WAF fingerprints, remote rendering and canaries were not evaluated. They must not be advertised as successful REA blockers on the basis of this project. Even if a measure increases effort, an authorised user can still learn from allowed outputs.

## Combine controls only with measured customer costs

Use the [new effectiveness and usefulness scorecard](COMBINATION_BENCHMARK.md) to compare rounding, shared quotas, catalogues and exact approval channels under stronger agent effort and larger allowances. Check both approximate reconstruction and normal customer success. A shared cap can also deny a second legitimate user; a catalogue can prevent free-form planning; coarse rounding can make estimates unsuitable. Low exact-match accuracy alone is not evidence that a competitor cannot produce a useful approximation. The [combination-study white paper](REA_SaaS_Protection_White_Paper_Combinations.pdf) explains the measured trade-offs.

## Preserve useful estimates, then test what they disclose

The [cap-aware fitting scorecard](FITTING_BENCHMARK.md) tests a new design: about 1% precision for eight distinct estimates, followed by about 4% precision without denying further planning. Exact approved commitments remain exact. Its measured hidden-price accuracy was 57.9% exact, 99.9% within 1% and 100.0% within 5%. This is evidence about a specific candidate and its residual risk, not a promise of reconstruction prevention.

For developers, enforce private calculation and authorisation on every output path. For architects, separate narrow exact commitments from non-binding estimates and test cross-route/account leakage. For product managers, predefine tolerable error and require longer, free-form and post-exhaustion tasks to pass. Use [the current white paper](REA_SaaS_Protection_White_Paper_Fitting.pdf) for the measured trade-offs and practical role-specific guidance.
