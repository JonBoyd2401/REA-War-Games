# REA War Games

**Measured ways to block unauthorised requests and reduce information exposure to REA and similar tools.**

This repository contains real localhost experiments with **REA 6.7.0**, a deliberately unsafe SaaS pricing lab, a separate session-protected lab, a readable white paper, and the evidence needed to check the conclusions.

## Latest: actual REA-assisted agents and measured accuracy

The [effectiveness scorecard](docs/AGENT_BENCHMARK.md) compares six defences using **36 fresh LLM agents**, **six withheld synthetic targets** from three pricing families, and **224 new real REA operations**. Each agent chooses its own probes and writes its own predictor. Common unseen test inputs are selected only after all predictors are frozen. The report shows exact and approximate accuracy, paired reductions, all target results, effort and customer trade-offs.

Read or share the **[current white paper](docs/REA_SaaS_Protection_White_Paper_20261019.pdf)** and **[agent effectiveness report](docs/REA_Agent_Effectiveness_Report.pdf)**. [Verify or repeat the agent experiment](agent-benchmark/README.md). There are **36/36 valid predictors**, **727 verified business response rows**, and **9,216 held-out predictions**. Total repository evidence is **298 measured REA operations and 49 application/scoring tests**.

A low score for reconstructing withheld private behaviour does not mean the supported product cannot be copied. Catalogue and approval restrictions remove general estimation; their remaining permitted outputs can still be memorised. This is a bounded pricing benchmark, not a universal REA blocker or a whole-SaaS cloning rate.

## Earlier: consistent workflow restrictions and what REA actually does

The new [boundary findings](docs/BOUNDARY_FINDINGS.md) add **six real REA captures**, **12,000 enumerated request refusals**, and **60 exact normal workflow checks**. Quotes, exports and jobs share server-owned approvals. Deliberately weakened exports and self-service approval both disclose a protected price. A constructed pair of private rules demonstrates a conditional limit on what equal permitted answers can reveal; it is not a measured whole-product cloning score.

Read [how REA works](docs/HOW_REA_WORKS.md) for the browser observation mechanisms, version-pinned implementation references, and the distinction between REA's evidence collection and our custom pricing learner. The [new shareable report](docs/REA_Workflow_Boundary_Report.pdf) and both downloadable packs include this stage. At that stage: **74 measured REA operations and 41 application tests**. [Repeat or verify it](boundary-study/README.md).

## Earlier: measured reconstruction risk — 19 October 2026

The follow-up asks how accurately a permitted client can reproduce pricing from allowed outputs. It adds **496 HTTP model runs and 12 actual REA browser captures**, across 16 synthetic pricing rules. The learners know the three-band rule family, but receive no target parameters. This is a programmatic black-box experiment, not an independent AI red team or whole-SaaS cloning benchmark.

- **24 exact observations reproduced every held-out price** on all 16 targets. A later exhaustive diagnostic also matched all 1,000 domain quantities for the adaptive 24-query model on each target.
- Eight exact observations still supported **97.3% mean held-out exact match** under the tested best-of-two-method evaluation. A request limit is not evidence that reconstruction is prevented.
- Rounding strongly reduced exact matches, but with 64 queries the tested methods still put **98.4% of held-out predictions within 5%** on average.
- An exploratory approved-quote-only follow-up reduced mean held-out exact match to **37.5%**, while preserving the two approved exact quotes. It removes arbitrary price estimation, so it changes the product's supported input space; it is not a free or universal fix.

Read the **[results and trade-offs](docs/RECONSTRUCTION_FINDINGS.md)**, **[research supplement PDF](docs/REA_Reconstruction_Risk_Supplement.pdf)**, or [run that study](reconstruction/README.md). At that stage the repository contained 68 measured REA operations and 33 tests; the boundary study above adds six operations and eight tests. Earlier results below and the original white paper describe the 18 October baseline.

## Start here

- **Understand the result:** [Plain-English protection guide](docs/PROTECTION_GUIDE.md).
- **Read or share the research:** [Current white paper PDF](docs/REA_SaaS_Protection_White_Paper_20261019.pdf); [original baseline paper](docs/REA_SaaS_Protection_White_Paper.pdf).
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

## Original baseline evidence — 18 October 2026

- **56 measured REA commands completed:** 18 baseline, 11 controlled/repeated supplemental captures, 18 portable-runner validation operations, and 9 session-boundary captures.
- **23 application tests passed:** 9 original regression tests and 14 session-boundary tests.
- The original browser-driven tenant and mutation probes were repeated **three times per condition** on fresh fixtures, with the same outcomes.
- Original commands, captures, coverage flags, evidence paths, source hashes and a [verification script](verify-evidence.mjs) are included.

This is a synthetic engineering study, not a production security certification. REA scenarios report incomplete overall capture coverage; the specific retained responses support the stated claims. The original baseline had no blind reconstruction or adaptive agent study. The later bounded-agent benchmark adds withheld-target prediction scores, but remains short of independent replication or a whole-product assessment. [Full scope and limitations](docs/SUCCESS_CRITERIA.md).

## Quick checks

Use a supported Node version. The original run used Node 24.19.0 and Chrome 155.0.8059.82.

```sh
node --test lab/test/wargame.test.mjs lab-v2/test/session-boundaries.test.mjs reconstruction/test.mjs reconstruction/gated-test.mjs boundary-study/test.mjs agent-benchmark/test.mjs
node verify-evidence.mjs
node reconstruction/verify.mjs
node reconstruction/verify-gated.mjs
node boundary-study/verify.mjs
node agent-benchmark/verify.mjs
```

Run only the owned localhost fixtures. The code binds to loopback. For a real SaaS deployment, use maintained identity infrastructure, TLS, distributed enforcement and a security review; the session lab remains an educational implementation.

## Repository layout

| Path | Contents |
|---|---|
| `lab/` | Original unchanged unsafe/hardened fixture and tests |
| `lab-v2/` | Opaque sessions, revocation, permissions, CSRF and tenant checks |
| `reconstruction/` | Output-learning experiments, frozen learners, policy controls and scoring verifiers |
| `boundary-study/` | Cross-workflow approval checks, negative controls, six REA scenarios and a conditional identifiability calculation |
| `agent-benchmark/` | Frozen actual-agent protocol, bounded REA tools, safe predictor evaluator and offline verification |
| `runs/` | Path-redacted evidence and measured outcomes |
| `docs/` | Human-readable guides, white paper and continuation notes |
| `provenance/` | Package pinning, hashes, original-run scripts and redaction record |
| `dist/` | Distribution packs |

Local account/workspace paths have been replaced in sharing copies. Original internal hashes are retained as provenance; a redacted evidence envelope is not byte-identical to the private raw file. The public SHA-256 manifest verifies the distributed files, and capture-body hashes can be checked independently. See [evidence handling](docs/EVIDENCE.md).
