# Cap-aware numerical fitting and useful estimates

Prospective protocol, 19 October 2026. Freeze this file, prompts, runner and
measurement sources before generating six new synthetic targets. Two targets each
use the historical volume, graduated and minimum/rebate generators. Agents do not
receive target families, parameters, ranges, earlier evidence or scores.

Five paired policies: exact estimates; eight distinct exact estimates (limit8);
relative rounding with geometric ratio 1.08 (band4); that rounding plus the
eight-input cap (band4-limit8); and a graceful precision budget
(band1to4-budget8). The latter returns ratio-1.02 estimates on its first eight
distinct inputs, then ratio-1.08 estimates on all other inputs. The first eight
keep their precision when repeated. Aliases and two sessions share one tenant.
All arms retain exact, pre-existing approved quotes and exports at 50 and 200;
creating arbitrary exact approvals is unavailable. This is a non-binding estimate
product, not altered invoicing. The rounding algorithm and caps are public.

Rounding is round(r ** round(log(price)/log(r))) in pence. Its relative error is
bounded by sqrt(r)-1 plus half a penny divided by price (at r=1.08, about 3.923%).
These positive-price fixtures stay well above the penny-scale exception. It is
deterministic, monotone as a function of price and repeatable. Do not call it
differential privacy, cryptographic secrecy, or protection against colluding tenants.

Run 30 fresh gpt-6-astra/max agents in random order, maximum three concurrent.
Each receives the exact policy description before probing, 192 attempted business
requests including denials, 64 real REA operations, 40 bounded fitting calls and
30 minutes. There is one fresh attempt per cell, no continuation anchoring and no
score-selected reruns. Early stopping and failures remain visible. This uses the
previous maximum request allowance from the outset and increases the operation
ceiling from 48 to 64; it does not increase the 192-request ceiling.

Agents must inspect first, are advised to use the two free exact approvals before
spending scarce distinct estimate inputs, cover the full domain, keep adaptive
probes in reserve and avoid exhausting the cap in their first batch. The tool
still permits batches of 16: strategy belongs to the agent. A generic numerical
fitter uses only successful REA observations already obtained by that agent. It
offers dynamic-programming piecewise affine weighted least squares and interval
coefficient fitting from disclosed rounding bounds; agents may specify segment
starts and through-origin models. Partition selection uses least-squares cost,
then interval refinement, not globally optimal interval segmentation. Maximum
eight fitted segments; agents may return up to 32 quadratic JSON segments. No
arbitrary code, filesystem or network is exposed through fitting. Record every
call, input options, observation cutoff and returned candidates. The tool neither
reads target files nor receives held-out labels. This is stronger assistance,
not a claim of the strongest possible optimiser or agent.

All observations use pinned real REA 6.7.0 against owned loopback fixtures with
fresh headless Chrome sessions and synthetic credentials. The app-server has no
environment access, inherited instructions, shell, browser, apps, plugins,
delegation, memories or inherited Node MCP. Synthetic observations use the
configured Codex service. Raw engine/account events remain private and excluded.
No VM isolation or comprehensive laptop audit is claimed. Verify capture-body
hashes, named response matches, privacy, no-reply Git identity and port shutdown.

Hash-commit targets before agents. Freeze all 30 predictors before disclosing
targets and selecting 256 common random heldouts per target, excluding all
successful observed quantities across arms. Three unrestricted arms can observe
at most 576 quantities, two capped arms at most 16, plus the two approval inputs,
leaving at least 406 unseen. Score exact, within 1%, within 5%, MAE and paired
percentage-point reductions versus exact. Keep per-target results and full-domain
diagnostics. Failures score zero in intention-to-run summaries but never count as
defence success. Secondary numeric public-output scoring applies the disclosed
rounding to predictions; fallback uses its post-budget precision. This is not a
complete UI, permission, quota-state or whole-product clone assessment.

Use the historical four utility workloads unchanged: six-input short comparison,
twelve-input planning, twelve off-catalogue free-form inputs, and a second-user
short comparison after eight first-user estimates. Each ends with four exact
approval/export actions. Run 120 fresh HTTP journeys (not REA agent requests).
Every target must pass every workload: all exact actions correct, at least 95%
estimates served and at least 95% of all estimate attempts within 5% of truth.
Denials count as utility failures. No privileged good-user bypass. Synthetic
usefulness is not human usability, legal quote compliance or production utility.

Predeclared useful protection candidate: pass all utility workloads for all six
targets AND reduce within-1% held-out reconstruction by at least 20 percentage
points versus exact on EVERY target, with valid predictors in both cells. This
threshold is a research screen, not a universal business definition. Separately
report reductions in exact and within-5% accuracy. A penny-only exact-match drop
does not establish that the SaaS is commercially hard to imitate. If no policy
qualifies, publish that result. A useful 5%-accurate estimate surface necessarily
discloses useful approximate answers; do not promise to stop all recreation.

Six targets, one stochastic agent per cell, three simple function families. No
independent human team, production deployment, arbitrary exact purchase oracle,
cross-tenant pooling, attacker memorisation of the full domain, or universal
statistical guarantee. Comparisons with earlier studies are descriptive because
targets, prompts, tools and budgets changed together. Publish reproducible source,
raw captures, all fits/predictors, scores, usefulness logs and limitations.
