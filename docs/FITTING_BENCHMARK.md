# Cap-aware fitting: effectiveness and usefulness

19 October 2026. Measured evidence, with historical editions preserved.

No tested combination met the predeclared useful-protection screen on all six targets. The experiment does not establish a reliable way to stop accurate reconstruction while preserving these estimation workflows.

The precision fallback's mean hidden-price reconstruction was 57.9% exact, 99.9% within 1%, and 100.0% within 5%. It passed every synthetic usefulness workload on every target. Read approximate accuracy alongside exact equality.

Both always-available rounded policies reproduced 100% of the tested public numeric estimate outputs on the common heldouts after the disclosed rounding transform was applied to the frozen predictors. This includes the precision fallback at its post-budget precision. Hidden-price penny errors therefore did not prevent copying this visible numeric behaviour. This secondary result does not assess a complete UI, permissions, cached precision choices or a whole SaaS product.

## Effectiveness scorecard

Higher reconstruction accuracy means less protection. At tolerance T, accuracy is the number of predictions with absolute error / true price no greater than T, divided by all tested inputs. Exact match requires zero penny error. Effectiveness is paired baseline accuracy minus defended accuracy, in percentage points. Scores are target means on common unseen quantities, rounded to one decimal place; the raw scores retain full precision.

| Policy | Exact match | Within 1% | Within 5% | All utility workloads |
|---|---|---|---|---|
| Exact estimates | 100.0% | 100.0% | 100.0% | Pass on 6/6 targets |
| Eight exact estimates | 98.8% | 98.8% | 98.8% | Fails at least one workload |
| About 4% rounding | 68.3% | 97.0% | 100.0% | Pass on 6/6 targets |
| About 4% rounding + cap | 26.2% | 74.6% | 99.0% | Fails at least one workload |
| 1% to 4% precision fallback | 57.9% | 99.9% | 100.0% | Pass on 6/6 targets |

| Policy | Exact reduction | Within-1% reduction | Within-5% reduction |
|---|---|---|---|
| Eight exact estimates | 1.2 pp | 1.2 pp | 1.2 pp |
| About 4% rounding | 31.7 pp | 3.0 pp | 0.0 pp |
| About 4% rounding + cap | 73.8 pp | 25.4 pp | 1.0 pp |
| 1% to 4% precision fallback | 42.1 pp | 0.1 pp | 0.0 pp |

Positive reductions mean lower reconstruction accuracy than the paired exact baseline. Negative values mean the defended arm did better. Percentage points are not relative percentages.

## Where a combination helped, and where it did not

For a genuinely short six-estimate comparison task, about 4% rounding plus the eight-input cap passed on all six targets and reduced within-1% reconstruction to 74.6%. The mean additional reduction was 22.4 pp versus rounding alone and 24.2 pp versus the cap alone. It was strictly better than both components on five targets and tied the cap on one. This is a measured narrow trade-off, not a general recommendation: within-5% reconstruction remained 99.0%, the within-1% reduction versus exact ranged from 2.7 pp to 49.2 pp, and every target failed the longer and post-exhaustion utility workloads. Its within-5% accuracy was slightly higher than the cap alone, so combining controls did not improve every metric.

## Full-domain diagnostic

| Policy | Exact | Within 1% | Within 5% |
|---|---|---|---|
| Exact estimates | 100.00% | 100.00% | 100.00% |
| Eight exact estimates | 98.38% | 98.38% | 98.38% |
| About 4% rounding | 68.20% | 97.43% | 100.00% |
| About 4% rounding + cap | 25.92% | 73.80% | 98.68% |
| 1% to 4% precision fallback | 57.70% | 99.90% | 100.00% |

This scores all 1,000 quantities per target, including previously observed inputs. The primary common-unseen sample above excludes all observed quantities across arms, so adaptive probing changes which quantities can enter it. The full-domain diagnostic makes that selection effect visible; neither distribution is a measured production customer mix.

## What changed in this experiment

Six fresh targets from three simple pricing families, one fresh Astra/max agent per target/policy, 30 attempts. Every agent knows the cap and rounding rule before probing, receives 192 attempted business requests from the start, up to 64 REA operations, 40 fitting calls and 30 minutes. One REA operation can batch up to 16 business requests; a fitting call performs computation without making a new application request. The 192-request ceiling equals the previous study's maximum; the operation ceiling increased from 48 to 64. All predictors are frozen before 256 common unseen quantities per target are selected. The holdouts exclude every successful observation across all five policies. Failures are retained and score zero; they must not be credited as protection. No score-selected reruns or best-of-model selection.

All policies calculate prices server-side and deliver minimal responses. The two exact approved quantities (50 and 200) are outside the estimate cap and remain available through quotes and exports; arbitrary exact approvals are refused. The eight-input cap is shared by both sessions and both estimate routes. The graceful variant gives its first eight distinct inputs about 1% precision, preserves that precision on repeats, and keeps serving all other estimates at about 4% precision. There is no random noise and no repeated-query averaging benefit. Estimates are explicitly non-binding; invoices and approved commitments must remain exact.

The geometric grid uses ratio r: output = round(r ^ round(log(exact price)/log(r))), in pence. Ignoring the final half-penny rounding, relative error is at most sqrt(r)-1. With r=1.08 this is about 3.923%; with r=1.02 about 0.995%. Add half a penny divided by the true price. All tested prices exceed the range where that term would break the 5% utility threshold. The bound is on a single returned estimate, not on what an agent can infer from many estimates. Known rounding boundaries themselves provide information.

## What REA and the agents actually did

REA (Reverse Engineer Anything) supplies the browser evidence: it launches disposable headless Chrome on the owned fixture, loads the delivered page and script, fills the quantity field, selects a workflow, clicks Calculate, and retains DOM results and API request/response bodies. The agent chooses quantities and interprets these observations. The new fitting tool performs local numerical computation over that agent's successful captured outputs only. It uses weighted least squares to select piecewise affine partitions and can refine each part using the intervals implied by rounding. It returns coefficient ranges and gaps between observed transition points; the agent can query those gaps and submit its own final predictor. REA does not need backend source to collect an input/output oracle. The fitting tool is an experimental addition, not a claim that upstream REA contains this optimiser.

30/30 agents used the fitting tool, for 250 calls. Of 12 capped agents, 0 used all eight distinct estimate inputs in their first estimate batch. Full per-agent query ranges, fitting counts, denials and uncertainty notes are in the [strategy diagnostics](../runs/fitting-20261019/diagnostics.json). Availability of a stronger tool does not prove an optimal attack.

## Follow an actual observation trace

These are the first 14 business responses from cell-001 (target-03), selected by schedule order rather than its score. The policy is the precision fallback. A ratio of 1 means an exact approved price, 1.02 is the finer estimate grid, and 1.08 is the coarser grid. Returned amounts are observations, not necessarily hidden true prices.

| Quantity / workflow | Returned GBP | Precision ratio | REA capture |
|---|---|---|---|
| 50 / approved | 763.21 | 1 | 02 |
| 200 / approved | 1310.71 | 1 | 02 |
| 1 / estimate | 581.43 | 1.02 | 03 |
| 350 / estimate | 1727.84 | 1.02 | 03 |
| 650 / estimate | 2064.93 | 1.02 | 03 |
| 1000 / estimate | 2279.85 | 1.02 | 03 |
| 250 / estimate | 1504.19 | 1.02 | 04 |
| 500 / estimate | 1945.83 | 1.02 | 04 |
| 300 / estimate | 1660.75 | 1.02 | 05 |
| 575 / estimate | 2024.44 | 1.02 | 05 |
| 20 / estimate | 650.16 | 1.08 | 06 |
| 100 / estimate | 955.30 | 1.08 | 06 |
| 150 / estimate | 1114.26 | 1.08 | 06 |
| 225 / estimate | 1403.65 | 1.08 | 06 |

Follow the capture numbers in [this cell](../runs/fitting-20261019/cells/cell-001/commands.jsonl), then inspect its [fitting calls](../runs/fitting-20261019/cells/cell-001/fits.jsonl) and [frozen predictor](../runs/fitting-20261019/cells/cell-001/checkpoint-192.json). Each fit records exactly how many prior REA operations it could use. This is an illustration, not an additional experiment or a score-selected success story.

## Measured agent effort

| Policy | Mean requests | Mean fitting calls | Mean minutes |
|---|---|---|---|
| Exact estimates | 167.8 | 5.3 | 5.5 |
| Eight exact estimates | 10.0 | 5.0 | 3.5 |
| About 4% rounding | 144.5 | 10.5 | 9.3 |
| About 4% rounding + cap | 10.0 | 9.8 | 7.1 |
| 1% to 4% precision fallback | 144.5 | 11.0 | 11.5 |

Wall-clock time includes model computation and local browser operations under three-way concurrency. It is descriptive, not a controlled latency benchmark or monetary cost. The configured ceilings were 192 requests, 40 fits and 30 minutes per agent; unused allowance remains visible.

## Did the SaaS remain useful?

Usefulness requires every exact quote/export action to be correct, at least 95% of estimate attempts served, and at least 95% of all estimate attempts within 5% of truth, separately for every target and every workload. A denied estimate fails. Useful protection additionally requires a reduction of at least 20 percentage points in within-1% reconstruction versus the exact baseline on every target, with valid predictors. This is a predeclared research screen, not a business guarantee. Exact penny equality, 1% approximation and 5% approximation answer different questions. A competitor can be commercially useful despite poor exact-match scores. These workloads do not require a new exact purchase at every free-form quantity: only two pre-approved quantities support exact commitments. A SaaS that needs arbitrary exact quotes must test that additional channel; allowing it can restore the exact-output oracle.

| Policy | Short | Planning | Free-form | After exhaustion |
|---|---|---|---|---|
| Exact estimates | 6/6 pass | 6/6 pass | 6/6 pass | 6/6 pass |
| Eight exact estimates | 6/6 pass | 0/6 pass | 0/6 pass | 0/6 pass |
| About 4% rounding | 6/6 pass | 6/6 pass | 6/6 pass | 6/6 pass |
| About 4% rounding + cap | 6/6 pass | 0/6 pass | 0/6 pass | 0/6 pass |
| 1% to 4% precision fallback | 6/6 pass | 6/6 pass | 6/6 pass | 6/6 pass |

Short uses six estimates; planning and free-form each use twelve. After-exhaustion first spends eight distinct estimates in session one, then tests session two. Every journey finishes with four exact approved quote/export actions. No good-user exemption exists. All request-level results, denials, price errors and local elapsed times are retained. Timing is diagnostic, not a production latency claim.

## Exact estimates: target results

| Target | Exact | Within 1% | Within 5% | 1% reduction |
|---|---|---|---|---|
| target-06 | 100.0% | 100.0% | 100.0% | 0.0 pp |
| target-03 | 100.0% | 100.0% | 100.0% | 0.0 pp |
| target-05 | 100.0% | 100.0% | 100.0% | 0.0 pp |
| target-02 | 100.0% | 100.0% | 100.0% | 0.0 pp |
| target-01 | 100.0% | 100.0% | 100.0% | 0.0 pp |
| target-04 | 100.0% | 100.0% | 100.0% | 0.0 pp |

Valid predictors: 6/6. Mean absolute held-out price error among valid predictors: GBP 0.00. Within-1% reduction range: 0.0 pp to 0.0 pp. Mean requests used: 167.8 of 192; mean REA operations: 12.7 of 64.

## Eight exact estimates: target results

| Target | Exact | Within 1% | Within 5% | 1% reduction |
|---|---|---|---|---|
| target-03 | 100.0% | 100.0% | 100.0% | 0.0 pp |
| target-04 | 100.0% | 100.0% | 100.0% | 0.0 pp |
| target-06 | 99.2% | 99.2% | 99.2% | 0.8 pp |
| target-02 | 97.3% | 97.3% | 97.3% | 2.7 pp |
| target-01 | 97.3% | 97.3% | 97.3% | 2.7 pp |
| target-05 | 98.8% | 98.8% | 98.8% | 1.2 pp |

Valid predictors: 6/6. Mean absolute held-out price error among valid predictors: GBP 53.47. Within-1% reduction range: 0.0 pp to 2.7 pp. Mean requests used: 10.0 of 192; mean REA operations: 7.0 of 64.

## About 4% rounding: target results

| Target | Exact | Within 1% | Within 5% | 1% reduction |
|---|---|---|---|---|
| target-03 | 48.0% | 82.0% | 100.0% | 18.0 pp |
| target-02 | 100.0% | 100.0% | 100.0% | 0.0 pp |
| target-05 | 40.6% | 100.0% | 100.0% | 0.0 pp |
| target-06 | 21.1% | 100.0% | 100.0% | 0.0 pp |
| target-01 | 100.0% | 100.0% | 100.0% | 0.0 pp |
| target-04 | 100.0% | 100.0% | 100.0% | 0.0 pp |

Valid predictors: 6/6. Mean absolute held-out price error among valid predictors: GBP 1.48. Within-1% reduction range: 0.0 pp to 18.0 pp. Mean requests used: 144.5 of 192; mean REA operations: 12.3 of 64.

## About 4% rounding + cap: target results

| Target | Exact | Within 1% | Within 5% | 1% reduction |
|---|---|---|---|---|
| target-04 | 17.2% | 83.6% | 100.0% | 16.4 pp |
| target-06 | 19.9% | 92.2% | 100.0% | 7.8 pp |
| target-05 | 14.5% | 57.4% | 99.6% | 42.6 pp |
| target-03 | 30.9% | 50.8% | 100.0% | 49.2 pp |
| target-02 | 48.4% | 97.3% | 97.3% | 2.7 pp |
| target-01 | 26.2% | 66.4% | 97.3% | 33.6 pp |

Valid predictors: 6/6. Mean absolute held-out price error among valid predictors: GBP 77.64. Within-1% reduction range: 2.7 pp to 49.2 pp. Mean requests used: 10.0 of 192; mean REA operations: 6.7 of 64.

## 1% to 4% precision fallback: target results

| Target | Exact | Within 1% | Within 5% | 1% reduction |
|---|---|---|---|---|
| target-03 | 31.3% | 100.0% | 100.0% | 0.0 pp |
| target-02 | 100.0% | 100.0% | 100.0% | 0.0 pp |
| target-01 | 100.0% | 100.0% | 100.0% | 0.0 pp |
| target-04 | 100.0% | 100.0% | 100.0% | 0.0 pp |
| target-05 | 14.8% | 100.0% | 100.0% | 0.0 pp |
| target-06 | 1.2% | 99.6% | 100.0% | 0.4 pp |

Valid predictors: 6/6. Mean absolute held-out price error among valid predictors: GBP 0.17. Within-1% reduction range: 0.0 pp to 0.4 pp. Mean requests used: 144.5 of 192; mean REA operations: 15.8 of 64.

## Secondary numeric-output diagnostic

| Policy | Exact public output | Public output within 5% |
|---|---|---|
| Exact estimates | 100.0% | 100.0% |
| Eight exact estimates | 98.8% | 98.8% |
| About 4% rounding | 100.0% | 100.0% |
| About 4% rounding + cap | 90.4% | 90.4% |
| 1% to 4% precision fallback | 100.0% | 100.0% |

This secondary score applies the disclosed rounding algorithm to the submitted predictor. For the fallback it uses post-budget precision. For capped arms these are potential numeric values, even where a new query would be refused; this is not imitation of quota state or a claim those heldouts were served. No secondary model is selected after scoring.

## Verification and evidence

30/30 valid predictors; 0 failed/invalid attempts; 327 real REA operations; 2861 matched business responses; 6376 verified captured-body digests; 250 numerical fitting calls; 7,680 common held-out predictions; 30,000 full-domain diagnostic predictions; 120 utility journeys and 1800 HTTP actions including setup.

Recorded cumulative agent usage: 10,319,091 tokens, including repeated/cached context; this is not a monetary cost estimate.

REA's retained overall coverage flags are {"incomplete":327}. The verifier matches each claimed business response to a distinct captured network transaction and its DOM record; it does not turn incomplete overall capture into a completeness certificate. Captured body hashes validate the retained bytes, not original wire-byte identity. Synthetic credentials are passed through secret references; real laptop/network addresses, private paths, personal email and account events are excluded from distributed evidence. Fixtures bind only to loopback. Synthetic model input uses the configured Codex service; this was not wholly offline computation.

The [offline verifier](../fitting-study/verify.mjs) checks source hashes, pre-run target commitment, model freezes before holdouts, resolved model and isolation settings, final transcript/predictor agreement, every numerical fit against observations available at its timestamp, response provenance, quota/precision decisions, all predictions and utility calculations. The [verification report](../runs/fitting-20261019/verification.json), [scores](../runs/fitting-20261019/scores.json), [utility logs](../runs/fitting-20261019/utility.json), [aggregate](../runs/fitting-20261019/aggregate.json), [protocol](../fitting-study/PLAN.md) and [reproduction guide](../fitting-study/README.md) support independent checking. These checks establish internal consistency of retained evidence, not independent attestation of the operator or timestamps.

## Limits and next experiments

This is a pricing-function reconstruction benchmark, not a complete SaaS clone, human usability test or production security certification. There are only six independent target units and no repeated stochastic attempts per cell. Means and target ranges are descriptive; thousands of correlated predictions are not thousands of independent products. The fitter is bounded and not globally optimal: it chooses partitions by least-squares cost before interval refinement, allows at most eight fitted pieces, and has finite coefficient bounds. Agents may stop early. No arbitrary purchase/approval oracle, colluding tenants, long-term quota resets, real pricing workflows, distributed races or external attacker infrastructure were tested. Comparisons to older studies change targets, prompts and tools together, so cannot isolate a causal cap-awareness effect.

Repeat with independently prepared richer targets and multiple fresh agents per cell, then test approved-request creation, cross-account pooling and longer windows. Hold customer-task criteria fixed. Improve the optimiser without exposing target source, and retain its failures and all runs. A stronger approximation result would weaken an anti-reconstruction claim and must be published.
