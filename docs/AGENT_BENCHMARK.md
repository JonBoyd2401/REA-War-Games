# REA-assisted agent effectiveness scorecard

Measured 19 October 2026. Synthetic pricing reconstruction; six paired targets and six policies.

On six hidden synthetic pricing targets, the fresh REA-assisted agents achieved 99.3% exact accuracy and 100.0% accuracy within 5% with unrestricted exact totals. The largest mean reduction in within-5% accuracy was 75.6 percentage points for **Only two approved quotes**, leaving 24.4% within-5% accuracy. This is a measured result for one agent attempt per target and policy, not a universal ranking or a whole-SaaS cloning rate.

## Measured effectiveness

| Defence | Exact accuracy | Within 5% accuracy | Exact reduction (pp) | Within 5% reduction (pp) |
|---|---:|---:|---:|---:|
| Exact minimal totals | 99.3% | 100.0% | 0.0 | 0.0 |
| Eight distinct quantities | 93.6% | 95.6% | +5.7 | +4.4 |
| Round estimates to GBP 1,000 | 8.3% | 65.0% | +91.0 | +35.0 |
| Four catalogue quantities | 15.5% | 49.4% | +83.8 | +50.6 |
| Rounded + two exact approvals | 11.8% | 77.1% | +87.4 | +22.9 |
| Only two approved quotes | 11.8% | 24.4% | +87.4 | +75.6 |

Accuracy is the proportion of 256 unseen integer quantities per target whose predicted underlying price matches the reference price exactly, or within the stated relative tolerance. Every policy is scored on the same held-out inputs for that target. A reduction is baseline accuracy minus defended accuracy, expressed in percentage points. Higher positive reduction means less accurate reconstruction; a negative value means the defended run scored better. Exact accuracy counts even a one-cent error as wrong. Within-5% accuracy helps expose useful approximations that an exact-only score would conceal.

These are paired six-target means. They are not six confidence intervals or a single security rating. Relative percentage reduction, if needed, is 100 times (baseline accuracy minus defended accuracy) divided by baseline accuracy; it is undefined when the baseline is zero. Percentage points above avoid confusing a change from 80% to 40% with a 40% relative reduction.

**The restricted-product caveat matters.** Catalogue and approval policies remove arbitrary quantities from the supported customer workflow. This benchmark still asks the agent to reconstruct the original private rule across quantities 1 to 1000. A low score there does not mean the remaining product is hard to copy: the four catalogue outputs or two approved outputs can be memorised. General estimation is unavailable under approved-only access. The measurements establish reduced knowledge of withheld behaviour, not prevention of cloning every behaviour that is still offered.

In this run, the eight-quantity cap left 95.6% of unseen prices within 5% of truth. Rounding reduced exact matches to 8.3%, yet left 65.0% within 5%. Rounded estimates plus two exact approvals reached 77.1% within 5%; combined disclosure needs measurement too. Approved-only access returned 42 refusals and 12 permitted quote results across its six agents. These are observed outcomes, not guarantees for other products or longer budgets.

## Accuracy, variation and effort

| Defence | Within 1% | Exact accuracy range | Within 5% range | Mean queries / REA calls |
|---|---:|---:|---:|---:|
| Exact minimal totals | 100.0% | 95.7% to 100.0% | 100.0% to 100.0% | 24.0 / 8.2 |
| Eight distinct quantities | 94.9% | 71.1% to 100.0% | 83.2% to 100.0% | 22.0 / 5.5 |
| Round estimates to GBP 1,000 | 41.5% | 0.0% to 49.6% | 35.9% to 83.6% | 24.0 / 8.5 |
| Four catalogue quantities | 24.9% | 6.3% to 21.9% | 28.1% to 90.6% | 18.2 / 4.5 |
| Rounded + two exact approvals | 55.0% | 0.0% to 29.7% | 35.9% to 100.0% | 24.0 / 7.5 |
| Only two approved quotes | 15.2% | 0.0% to 29.7% | 9.4% to 42.2% | 9.0 / 3.2 |

Ranges are the minimum and maximum among six targets, not uncertainty intervals. Per-cell wall time and recorded input/output/cached/reasoning token usage are in the result files; time includes tool and service latency under up to three concurrent cells. Total recorded tokens: 1,938,323. Token counts are not a monetary cost estimate. Each heldout result also retains mean absolute error in GBP and every individual prediction/error.

## Completion and elapsed effort

| Defence | Valid predictors | Mean elapsed seconds | Elapsed range (seconds) |
|---|---:|---:|---:|
| Exact minimal totals | 6/6 | 126.2 | 70.3 to 163.6 |
| Eight distinct quantities | 6/6 | 111.3 | 91.7 to 126.3 |
| Round estimates to GBP 1,000 | 6/6 | 166.1 | 135.4 to 211.6 |
| Four catalogue quantities | 6/6 | 92.7 | 72.5 to 128.2 |
| Rounded + two exact approvals | 6/6 | 177.3 | 146.6 to 208.5 |
| Only two approved quotes | 6/6 | 66.7 | 50.8 to 82.3 |

A service failure or invalid predictor contributes zero by plan and must not be credited as a successful defence. Valid-predictor counts identify that risk separately from denied application requests.

## What the normal customer still gets

| Defence | Supported quotes successful | Mean absolute price error | Largest price error |
|---|---:|---:|---:|
| Exact minimal totals | 12/12 | GBP 0.0 | GBP 0.0 |
| Eight distinct quantities | 12/12 | GBP 0.0 | GBP 0.0 |
| Round estimates to GBP 1,000 | 12/12 | GBP 268.3 | GBP 495.6 |
| Four catalogue quantities | 12/12 | GBP 0.0 | GBP 0.0 |
| Rounded + two exact approvals | 12/12 | GBP 0.0 | GBP 0.0 |
| Only two approved quotes | 12/12 | GBP 0.0 | GBP 0.0 |

These are only two normal quantities, 50 and 200, on each fresh fixture. Rounded-plus-approved and approved-only use their exact approved route. The other arms use the estimate route. A successful HTTP response does not imply a correct exact price. These 72 checks do not establish overall usability, accessibility, support cost or production latency. GBP 1,000 is an absolute rounding step: its relative distortion differs across price levels and target families. It is not a recommended universal rounding setting.

## What each defence changes

| Defence | Enforced change | Remaining route to learning |
|---|---|---|
| Exact minimal totals | Private code absent; exact total available for any quantity | Repeated answers reveal behaviour even without source code |
| Eight distinct quantities | Shared tenant allowance across both sessions and estimate aliases | Learn from eight answers; time windows and additional tenants are outside this fixture |
| Round to GBP 1,000 | Less precise arbitrary estimates | Fit approximate behaviour or infer rounding transitions |
| Four catalogue quantities | Only 10, 50, 200 and 1000 are served | Memorise the complete supported catalogue; extrapolate beyond it |
| Rounded + approvals | Rounded estimates and exact outputs at 50 and 200 | Combine approximate observations with exact anchors |
| Approved only | Estimate and alias return refusals; only two approved prices remain | Memorise approved outputs; infer or guess withheld behaviour |

## How the actual agent used REA

REA is Reverse Engineer Anything, a collection of inspection and reverse-engineering tools. Here, the agent chooses quantity, workflow, session and its next probe. The harness turns that choice into UI actions in a fresh Chrome session. REA 6.7.0 runs capture-browser-scenario, fills the input, selects the workflow, clicks Calculate, waits for the result and retains DOM and network artifacts. The wrapper returns observations derived from those retained artifacts. Inspection also returns the delivered page and JavaScript, checked against capture bytes. The LLM compares examples, adapts its probes and writes a JSON price predictor. The evaluator executes no agent-authored program; it evaluates only validated numeric coefficients after the agent is finished. This is actual agent-assisted use of REA, with a deliberately bounded tool interface, not an unconstrained test of every upstream REA agent workflow.

The tool descriptions, same prompt, public transcripts, actual scenarios, commands and captures are included. The agent's final notes describe uncertainty; private reasoning event streams are excluded. For other observation channels, including CDP scripts, source maps, static analysis and V8 coverage, read [the source-traced explanation](HOW_REA_WORKS.md).

## Experimental method

The prospective plan, prompt, agent harness, tool wrapper, target generator and scorer were hashed before scored targets were generated. Targets were committed by hash and kept outside agent context. Thirty-six fresh ephemeral agents used gpt-6-astra with high reasoning effort, with at most three concurrent cells. Every agent had up to 24 attempted business requests, including denials, 12 REA operations and 20 minutes. It could choose either of two sessions in the same tenant, or the estimate, alias or approved workflow. No operator supplied fitting hints or custom fitted model. After all predictors were saved and hashed, 256 common holdouts per target were randomly selected from quantities never successfully observed by any of its six agents. Target parameters were then published for verification. The secondary full-domain score includes observed quantities and must not be presented as held-out accuracy.

The six targets cover three small rule families, with two targets per family and only one agent attempt per cell. There is no independent human white team, independent replication, production workload, repeated-agent variance estimate or statistical certainty about a wider product population. The agent did not receive the target family, parameters, earlier answers or source repository. It did receive the price domain, a piecewise-polynomial output format and bounded study tools. The format can represent all targets but constrains reconstructions. Built-in model knowledge and arithmetic capability remain relevant. Randomised cell order and paired targets help comparison; they do not isolate every stochastic effect of an LLM. No selected reruns were used to improve results. The recorded model identifier is not an independently pinned set of model weights; service updates can affect future replications.

## Evidence and verification

The new run contains **224 REA operations**, **727 verified business response rows**, **1902 checked captured-body digests**, **9,216 held-out predictions** and **36,000 secondary full-domain predictions**. There are 36/36 valid predictors and 0 failed or invalid predictors. Failed predictors, if present, score zero in the primary aggregate. All retained coverage states are reported by the verifier: incomplete 224. Incomplete capture is not silently upgraded to complete coverage. Including the earlier 74 REA operations, the repository now contains 298 measured operations; the 49 application/scoring tests are a separate evidence category.

Run node agent-benchmark/verify.mjs from the repository root. It recomputes predictions and aggregates, checks commitments and freeze ordering, and matches each projected observation to retained DOM and distinct linked network transactions. [Complete evidence](../runs/agent-20261019/) and [reproduction instructions](../agent-benchmark/README.md) are available. Hashes establish consistency, not independent proof of an untampered host or an external timestamp authority.

## Laptop and publication safety

The experiment used only owned loopback fixtures, generated pricing rules, ephemeral study cookies and fresh browser profiles. Model inference used the configured Codex service and received synthetic observations; the pricing targets themselves ran locally. Agent shell, environment access, external browsing, apps, plugins, memories and inherited Node MCP access were disabled. Raw account/engine events and private reasoning streams are excluded from the public projection. Session values are supplied through REA secret references; header values are not captured. The public record uses relative paths and synthetic identifiers. These are scope and privacy controls on a trusted shared laptop, not an OS/VM security certification or proof that all host software is uncompromised.

## Every paired result

Positive reductions mean lower reconstruction accuracy. Negative reductions are retained. Targets 01-02 are volume-band, 03-04 graduated-tier and 05-06 minimum-invoice-with-rebate rules; this mapping was not shown to agents.

| Target | Defence | Exact | Within 5% | Within 5% reduction (pp) |
|---|---|---:|---:|---:|
| 04 | Exact minimal totals | 100.0% | 100.0% | 0.0 |
| 05 | Exact minimal totals | 95.7% | 100.0% | 0.0 |
| 02 | Exact minimal totals | 100.0% | 100.0% | 0.0 |
| 03 | Exact minimal totals | 100.0% | 100.0% | 0.0 |
| 06 | Exact minimal totals | 100.0% | 100.0% | 0.0 |
| 01 | Exact minimal totals | 100.0% | 100.0% | 0.0 |
| 03 | Eight distinct quantities | 100.0% | 100.0% | 0.0 |
| 01 | Eight distinct quantities | 94.5% | 94.5% | +5.5 |
| 04 | Eight distinct quantities | 100.0% | 100.0% | 0.0 |
| 02 | Eight distinct quantities | 97.3% | 97.3% | +2.7 |
| 06 | Eight distinct quantities | 71.1% | 83.2% | +16.8 |
| 05 | Eight distinct quantities | 98.8% | 98.8% | +1.2 |
| 06 | Round estimates to GBP 1,000 | 0.0% | 53.1% | +46.9 |
| 03 | Round estimates to GBP 1,000 | 0.0% | 62.5% | +37.5 |
| 04 | Round estimates to GBP 1,000 | 0.0% | 35.9% | +64.1 |
| 01 | Round estimates to GBP 1,000 | 0.0% | 83.6% | +16.4 |
| 02 | Round estimates to GBP 1,000 | 49.6% | 77.0% | +23.0 |
| 05 | Round estimates to GBP 1,000 | 0.0% | 77.7% | +22.3 |
| 01 | Four catalogue quantities | 6.3% | 28.1% | +71.9 |
| 05 | Four catalogue quantities | 14.5% | 90.6% | +9.4 |
| 04 | Four catalogue quantities | 17.6% | 51.6% | +48.4 |
| 02 | Four catalogue quantities | 21.9% | 35.5% | +64.5 |
| 03 | Four catalogue quantities | 20.7% | 33.2% | +66.8 |
| 06 | Four catalogue quantities | 12.1% | 57.4% | +42.6 |
| 02 | Rounded + two exact approvals | 23.0% | 100.0% | 0.0 |
| 04 | Rounded + two exact approvals | 18.4% | 35.9% | +64.1 |
| 06 | Rounded + two exact approvals | 0.0% | 61.7% | +38.3 |
| 03 | Rounded + two exact approvals | 29.7% | 83.2% | +16.8 |
| 05 | Rounded + two exact approvals | 0.0% | 94.9% | +5.1 |
| 01 | Rounded + two exact approvals | 0.0% | 87.1% | +12.9 |
| 03 | Only two approved quotes | 29.7% | 34.0% | +66.0 |
| 05 | Only two approved quotes | 0.0% | 17.2% | +82.8 |
| 06 | Only two approved quotes | 0.0% | 9.4% | +90.6 |
| 04 | Only two approved quotes | 18.4% | 20.7% | +79.3 |
| 02 | Only two approved quotes | 23.0% | 23.0% | +77.0 |
| 01 | Only two approved quotes | 0.0% | 42.2% | +57.8 |

## What to test next

Repeat fresh agents with different seeds, models, budgets and richer rule families. Use an independent target author and withhold this public evidence from red agents. Test longer budgets, colluding entitled accounts, rounding-transition sampling, additional output channels and realistic approval creation. Evaluate clone accuracy separately on the supported product and withheld private behaviour. Measure normal task success, precision, latency, false denials and support demand alongside reconstruction. No defence should be called reliable across a production product on these six targets alone.
