# REA War Games

**Measured ways to block unauthorised requests and reduce information exposure to REA and similar tools.**

This repository contains real localhost experiments with **REA 6.7.0**, a deliberately unsafe SaaS pricing lab, a separate session-protected lab, a readable white paper, and the evidence needed to check the conclusions.

## Latest: exact quotes and private customer rules

The [new scorecard](docs/CONTEXT_BENCHMARK.md) tests **24 fresh Astra/max agents**, six paired targets and four policies, with numerical fitting and 192 attempted requests each. There is **no application rounding or query cap**. Customers can create, revise, accept and export arbitrary exact quotes.

Binding every operation to the authenticated context, while keeping genuinely different customer parameters private, reduced other-context within-1% reconstruction from **100.0% to 0.0%**: **100.0 percentage points**. Bound-context exact workflows passed **1008/1008 actions**. The same agents still reconstructed their own permitted pricing within 1% on **100.0%** of heldouts. **This protects private context, not all observable SaaS behaviour.** All six protected agents copied their own model as an explicitly uncertain guess for the other context. A separate numerical baseline given the correct family and parameter ranges achieved 1.7% within 1%; these scores are not universal secrecy bounds.

A leaky convenience export and a shared-rule control show when protection fails. The evidence includes **24/24 valid predictors**, **338 new REA operations**, **4608 matched responses**, **6144 unseen predictions**, **48 HTTP customer journeys** and **24108 paired deterministic boundary comparisons**. The latter are engine tests, not extra REA captures. The repository now contains **1303 measured REA operations and 75 application/scoring tests**.

Read the **[current white paper](docs/REA_SaaS_Protection_White_Paper_Contexts.pdf)**, **[effectiveness report](docs/REA_Context_Effectiveness_Report.pdf)**, [reproduction guide](context-study/README.md) and [publication privacy checks](docs/CONTEXT_RELEASE_CHECKS.md). Earlier reports remain historical evidence.

## Earlier: cap-aware agents, numerical fitting and useful estimates

The [new effectiveness scorecard](docs/FITTING_BENCHMARK.md) tests **30 fresh Astra/max agents** on **six new targets and five policies**. Agents know the cap before probing and can perform bounded numerical fitting on real REA observations. Each has 192 attempted requests from the start, up to 64 REA operations and 40 fitting calls. There are **30/30 valid predictors**, **0 failures**, **327 new REA operations**, **2861 matched responses**, **250 numerical fits**, **7,680 held-out predictions** and **120 customer journeys**.

The new precision fallback serves its first eight distinct estimates at about 1% precision and keeps serving further estimates at about 4%, while preserving exact approved quotes. Its reconstruction scores were **57.9% exact**, **99.9% within 1%** and **100.0% within 5%**. See the scorecard for the predeclared protection screen, all policy comparisons and per-target utility outcomes; usefulness and secrecy are separate requirements.

**No tested policy met the predeclared useful-protection screen on all six targets.** Preserving useful estimates did not establish reliable reconstruction prevention.

Read the **[fitting-study white paper](docs/REA_SaaS_Protection_White_Paper_Fitting.pdf)** and **[fitting effectiveness report](docs/REA_Fitting_Effectiveness_Report.pdf)**. [Verify or repeat this study](fitting-study/README.md). At that stage the repository contained **965 measured REA operations and 67 application/scoring tests**. Historical findings remain visible. These are synthetic, bounded experiments, not a universal REA blocker or a whole-SaaS cloning certificate.

## Earlier: combined defences, larger budgets and customer utility

The [combined-defence scorecard](docs/COMBINATION_BENCHMARK.md) adds **42 fresh REA-assisted agents**, **seven policies**, **six new targets**, and **84 frozen checkpoints** at 96 and 192 attempted-request allowances. Astra uses verified **max** single-agent reasoning effort. The evidence includes **340 new REA operations**, **3200 matched response rows**, **21,504 held-out predictions**, and **168 scripted customer journeys**. Results distinguish hidden-rule reconstruction from imitation of supported outputs, and report customer costs after quota exhaustion.

Coarse rounding plus the cap left **39.6% within-5% reconstruction accuracy**, compared with **88.2%** for rounding alone and **60.0%** for the cap alone. However, **none of the combined configurations passed the short-workflow usefulness threshold on all six targets**. Five of six quota-only agents spent their entire eight-input cap in the first batch; the earlier 95.6% recovery result still matters. All 42 agents retained their numeric predictors after continuation. The reports explain these strategy limits and the supplementary exact lookup replay of supported catalogue/approval outputs.

Read the **[combination-study white paper](docs/REA_SaaS_Protection_White_Paper_Combinations.pdf)** and **[combined-defence report](docs/REA_Combination_Effectiveness_Report.pdf)**. [Verify or repeat this study](combination-study/README.md). There are **84/84 valid checkpoint predictors** and **0 failures or invalid predictors**. At that stage the repository contained **638 measured REA operations and 58 application/scoring tests**. The study does not establish a universal way to stop useful SaaS behaviour being recreated; the scorecard reports which combinations helped and which utility criteria they met.

## Earlier: actual REA-assisted agents and measured accuracy

The [effectiveness scorecard](docs/AGENT_BENCHMARK.md) compares six defences using **36 fresh LLM agents**, **six withheld synthetic targets** from three pricing families, and **224 new real REA operations**. Each agent chooses its own probes and writes its own predictor. Common unseen test inputs are selected only after all predictors are frozen. The report shows exact and approximate accuracy, paired reductions, all target results, effort and customer trade-offs.

Read or share the **[earlier agent-study white paper](docs/REA_SaaS_Protection_White_Paper_20261019.pdf)** and **[agent effectiveness report](docs/REA_Agent_Effectiveness_Report.pdf)**. [Verify or repeat the agent experiment](agent-benchmark/README.md). There are **36/36 valid predictors**, **727 verified business response rows**, and **9,216 held-out predictions**. At that stage, repository evidence was **298 measured REA operations and 49 application/scoring tests**.

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
- **Read or share the research:** [Current white paper PDF](docs/REA_SaaS_Protection_White_Paper_Contexts.pdf); [original baseline paper](docs/REA_SaaS_Protection_White_Paper.pdf).
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
node --test lab/test/wargame.test.mjs lab-v2/test/session-boundaries.test.mjs reconstruction/test.mjs reconstruction/gated-test.mjs boundary-study/test.mjs agent-benchmark/test.mjs combination-study/test.mjs fitting-study/test.mjs
node verify-evidence.mjs
node reconstruction/verify.mjs
node reconstruction/verify-gated.mjs
node boundary-study/verify.mjs
node agent-benchmark/verify.mjs
node combination-study/verify.mjs
node fitting-study/verify.mjs
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
| `combination-study/` | Frozen combined-defence protocol, stronger effort, two query checkpoints and customer utility tests |
| `fitting-study/` | Cap-aware agents, bounded numerical fitting, relative precision policies and usefulness checks |
| `runs/` | Path-redacted evidence and measured outcomes |
| `docs/` | Human-readable guides, white paper and continuation notes |
| `provenance/` | Package pinning, hashes, original-run scripts and redaction record |
| `dist/` | Distribution packs |

Local account/workspace paths have been replaced in sharing copies. Original internal hashes are retained as provenance; a redacted evidence envelope is not byte-identical to the private raw file. The public SHA-256 manifest verifies the distributed files, and capture-body hashes can be checked independently. See [evidence handling](docs/EVIDENCE.md).
