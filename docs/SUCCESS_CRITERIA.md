# Measurable success criteria

## Definition

The latest [boundary study](BOUNDARY_FINDINGS.md) adds 12,000 enumerated refusals, 60 exact supported workflow checks, six REA captures and a conditional identifiability argument. These are distinct evidence types; its mathematical 50% bound is not a measured REA reconstruction score. [Verify that stage](../boundary-study/README.md).

A control succeeds in this study when a specified disallowed request is rejected without the protected result, or a specified disclosure channel no longer contains the protected material, **and the corresponding authorised feature still works**.

The test target is an owned synthetic lab. The adversary controls browser requests and knows the route and synthetic target identifier, but does not control the server process or OS. A valid entitled account is allowed to use its own feature. There is no claim of preventing all behavioural inference.

## Hard blocks with real REA evidence

The following files live in `runs/session-boundaries-20261018/rea-evidence`. Read `normalized_result.steps[-1].artifacts.dom.value.text` for the readable UI result, and `normalized_result.events.items` for linked requests, response statuses and base64 response bodies. `summary.json` is a convenience view; the retained REA files are the primary evidence.

| ID | Acceptance criterion | Observed result | REA evidence |
|---|---|---|---|
| HB01 | Protected API requires a session | 401 | `anonymous.json` |
| HB02 | Forged session cannot authenticate | 401 | `forged-cookie.json` |
| HB03 | Revoked session replay cannot authenticate | 401 | `revoked-cookie.json` |
| HB04 | Wrong password grants no access | Login 401; protected probes 401 | `wrong-password.json` |
| HB05 | B cannot read A quote or event | Both 404 | `tenant-B.json` |
| HB06 | Read-only account cannot create quote | 403 | `viewer.json` |
| HB07 | Client cannot choose final price or tenant | Both 422 | `tenant-B.json` |
| HB08 | State change requires CSRF token | 403 | `tenant-B.json` |
| HB09 | Fifth quote exceeds the four-action window | 429, Retry-After 60 | `quota.json` |
| HB10 | Logout removes access | Protected probes 401 | `logged-out.json` |
| UF01 | Entitled quote remains functional | 201, GBP 1104 | `owner.json`; also B's own quote in `tenant-B.json` |

Fourteen regression tests additionally cover expiry, session rotation, foreign Origin, per-user quota persistence across a new login, retry recovery and entitled finite event status. Their log is `runs/session-boundaries-20261018/node-test.txt`. Those additional cases are application tests, not extra REA captures.

## Measured disclosure reduction

Baseline run `laptop-20261018-01`:

- Captured unsafe script: 1147 bytes including full formula, base price and three bands. Captured hardened script: 537 bytes, UI-only; pricing formula not observed in that artifact.
- At quantity 50, quote response fields: **9 to 3**. Captured bytes: **370 to 80**. Total: **GBP 1104 in both**.
- Map fetching exposed embedded original source in unsafe mode. No map was declared in the hardened capture; a direct request returned 404.
- REA still found and inspected the hardened UI callback and API call. Thus the result is reduced disclosure, not prevention of all inspection.

## Repetition and controls

`runs/laptop-20261018-supplemental` contains three browser-probe repetitions for each original mode. Hardened denied six cross-tenant reads and six price/tenant mutations across those repetitions; unsafe accepted the corresponding six reads and six mutations. Each run also preserved a normal quote and status response. Three repetitions on a deterministic fixture are not a statistical estimate of attack success in a population.

Three isolated changes show the limits of partial fixes: map removal left pricing code; server-only frontend left rule-rich API responses; response minimisation left pricing code. Two separate quota scenarios recorded 201,201,201,201,201 in unsafe and 201,201,201,201,429 in hardened for four distinct quantities plus one repeated quantity. These are quota-control tests, not blind inference trials.

The portable runner was actually executed end to end: `runs/validation-20261018` contains its 18 completed REA operations. It uses native CDP input for the V8 action, unlike the original Playwright action helper. Both wait for REA's armed notification.

## Known failed protection and remaining gaps

The original hardened-v1 public script contains a demo credential. The recorded negative control `baseline-public-token-replay.json` shows that B gets 404 with B's token but 200 when using the copied public A token. **V1 does not satisfy a real authentication safety criterion.** V2 removes that design and rejects the legacy bearer string without a valid session.

All recorded browser scenarios preserve their overall incomplete-coverage flag. Specific captured responses support the named assertions; zero exit status does not prove complete capture. REA body bytes are Playwright API observations, not verified original wire bytes. Captured listeners and request initiators do not prove complete UI causality.

The [new bounded-agent study](AGENT_BENCHMARK.md) adds adaptive agent-authored pricing predictions on withheld inputs. No independent human white-team replication, unconstrained whole-product attacker study, production TLS/authentication audit, distributed race test, long-lived subscription test, load test, user-impact study, WAF/obfuscation comparison or decoy evaluation exists. “Safe against every REA-assisted attack” is not a supported conclusion.

## Original counts — 18 October 2026

56 measured REA commands = 18 baseline + 11 supplemental + 18 reproduction-validation + 9 session-boundary scenarios. 23 passing application tests = 9 original + 14 session tests. These are operation/test counts, not 56 independently proven protections.

## Reconstruction extension — 19 October 2026

The [reconstruction findings](RECONSTRUCTION_FINDINGS.md) add 496 HTTP model runs and 12 real REA captures. Its verifiers independently re-score 508 frozen models, confirm the 490 initial models were frozen before holdout selection, and match 178 browser result rows to retained network responses. The 18 follow-up models reuse prior holdouts and are labelled exploratory. All 402 new captured body digests checked successfully. Ten new control tests bring the application test count to 33; total measured REA operations are 68.

The reconstruction success metric is prediction error on specified inputs, not merely request denial. An eight-query budget denied extra observations but still permitted high reconstruction accuracy. Rounded estimates reduced exact-match scores while preserving useful approximations. Approved-quote-only access produced a larger measured reduction outside its supported input space but removes general estimation and does not hide the approved outputs. These findings do not satisfy a universal anti-reconstruction criterion.

## Actual-agent extension - 19 October 2026

The [effectiveness scorecard](AGENT_BENCHMARK.md) adds 36 fresh agent attempts across six paired targets and six policies. All final predictors are frozen before common unobserved holdouts are selected. 36 valid predictors and 0 failed/invalid predictors are retained. Exact match and relative-error tolerances are separate scores; reductions are paired percentage-point differences from exact-output baselines. No pre-declared universal protection threshold was met or assumed.

The evidence verifier checks 224 REA operations, 727 business response rows, 1902 body digests, 9,216 held-out predictions, 36,000 secondary full-domain predictions and 72 supported normal quote checks. Eight new tests bring the total to 49; the complete test log is in the new run. This establishes measured accuracy changes under a bounded tool interface and fixed budgets, not reliable prevention of whole-product reconstruction.

## Combined controls and usefulness

The [combination scorecard](COMBINATION_BENCHMARK.md) adds paired 96/192-request measurements with max-effort agents. It reports exact and within-5% hidden-price accuracy, paired percentage-point reductions, supported-output imitation and customer utility separately. The prospective short-workflow acceptance threshold requires each of all six targets to preserve every exact approved quote/export, serve at least 95% of estimate attempts and place at least 95% of all estimate attempts within 5% of truth. Denied attempts fail. Longer planning, free-form inputs and a second session after exhaustion are reported separately; passing a short journey is not a broad usability claim. The retained run has 84/84 valid predictors, 0 failed/invalid predictors and 168 utility journeys. There are now 58 passing fixture/scoring tests. No universal anti-reconstruction or whole-product safety criterion is claimed.

## Cap-aware fitting and useful protection

The [new study](FITTING_BENCHMARK.md) requires every target to pass all four utility workloads: all exact actions correct, at least 95% estimates served, and at least 95% of all estimates within 5%. Useful protection additionally requires at least a 20 percentage-point reduction in within-1% reconstruction versus exact on every target, with valid agents. The threshold was frozen before targets were generated. Exact-penny differences do not substitute for approximation resistance. The run retains 30/30 valid predictors, 0 failures and 120 utility journeys; the full suite has 67 passing tests.
