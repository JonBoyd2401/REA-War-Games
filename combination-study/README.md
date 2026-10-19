# Combined defences with larger agent budgets

This study tests seven disclosure policies on six fresh synthetic pricing targets. Forty-two fresh REA-assisted agents use `gpt-6-astra` with `max` reasoning effort. Each writes a predictor at 96 requests and continues the same investigation to a cumulative allowance of 192 requests. The corresponding REA ceilings are 24 and 48 operations. Actual usage can be lower.

Read the [scorecard](../docs/COMBINATION_BENCHMARK.md), [white paper](../docs/REA_SaaS_Protection_White_Paper_Combinations.pdf), and the prospective [plan](PLAN.md). These are numerical pricing tests, not a whole-SaaS cloning benchmark or production security certification.

## Check the retained evidence

Run `node combination-study/verify.mjs` from the repository root. No credentials or model access are required for offline verification. Run `node --test combination-study/test.mjs` for nine fixture and scoring controls. The verifier checks frozen sources, committed targets, checkpoint ordering, REA response bodies and hashes, matching server audit rows, shared unobserved holdouts, all predictions and utility calculations.

The public evidence lives in `runs/combinations-20261019/`. Each cell retains projected agent messages, tool calls, REA scenarios and captures, observations, two JSON predictors and server audit rows. The final token count is cumulative and must not be added to the earlier checkpoint count. Private engine/account events are excluded.

To follow one result by hand:

1. Find its target, policy and cell in `schedule.json`.
2. Open that cell's `agent-transcript.jsonl`. Read `tool_request` and `tool_response` entries to see what the agent asked and received. `stage_end` records the predictor hash before the next allowance begins.
3. Read `checkpoint-96.json` and `checkpoint-192.json` for the actual submitted coefficients, uncertainty notes, status and cumulative usage.
4. Match each operation in `commands.jsonl` to its scenario and REA evidence file. Network events share a `transaction_id`; captured bodies are base64 with byte counts and SHA-256 digests. `observations/` is a readable projection, not the primary capture.
5. Find the cell in `scores.json`: each test quantity retains actual price, prediction and error. Check that it is in `holdouts.json` and absent from that target's successful observation union. Full-domain rows and supported catalogue/approval scores can include observed quantities.
6. Read the same policy in `utility.json` to see every customer request, refusal and price error. These direct HTTP journeys are a separate evidence type from REA agent captures.

## Repeat with fresh targets

Install the pinned `rea-agents@6.7.0` dependency with lifecycle scripts disabled. Install a compatible Codex CLI with app-server dynamic tools, and authenticate it separately. The measured CLI version is in the pre-run freeze. Model availability and reasoning settings vary; a catalog listing alone does not prove access. This run checked actual inference before scoring. Set `REA_CODEX_EXECUTABLE` and `REA_BROWSER_EXECUTABLE` if their executable locations differ from the runner defaults.

From the repository root, run `node combination-study/run.mjs replications/my-new-combination-run`. Use a new directory. Then run `node combination-study/verify.mjs replications/my-new-combination-run`. The runner does not overwrite completed runs. A resumed interrupted attempt is retained as failed rather than selectively rerun; incomplete infrastructure records may require an explicitly documented verifier extension.

Only use generated data and these owned loopback fixtures. Inference uses the configured Codex service. The runner restricts agent tools and context; this is not an operating-system sandbox assessment. Do not supply real customer data or credentials. Raw engine logs stay under ignored `output/combination-private/`. Never publish that directory.

## Read the measurements correctly

The primary score measures hidden exact prices on 256 common, never-successfully-observed inputs per target. Approximate accuracy within 5% is reported alongside exact matches. The secondary delivered-output score measures the supported numeric outputs; restricted catalogue or approval outputs can be memorised. It does not assess UI, stateful quota imitation or the full product.

The same thread continues between checkpoints without score feedback. This measures the combined effect of more permitted requests and continued reasoning, not an isolated causal effect of query count. There is one attempt per cell, no independent human white team and no new-target high-effort control. `max` is a higher configured single-agent reasoning effort than the earlier study's `high`; it is not proof that every attempt reasons better.

No general code-execution or numerical fitting tool is available to these agents. An attacker with regression or constraint-solving software may recover more. A useful next study would expose a separately sandboxed arithmetic/fitting tool that accepts only synthetic numeric inputs, repeat fresh agents per cell, and compare independent budget groups. Gentle rounding-only and catalogue-only arms are also needed to isolate those components. These are proposed extensions, not measured protections in this run.

Utility has four scripted customer journeys. The short-workflow criterion requires all six targets separately to preserve every approved exact action, serve at least 95% of estimate actions and put at least 95% of all estimate attempts within 5% of truth. Denials fail accuracy. Twelve-estimate planning, off-catalogue requests and a second user after quota exhaustion reveal costs that a short happy path could conceal. These are synthetic utility proxies, not user research.

## Build the reports

After the run, `node combination-study/memorisation.mjs` builds a supplementary offline replay of already observed catalogue/approval outputs. This analysis was added after the protocol freeze, uses no new requests and is separately labelled in both reports. Pass a fresh run directory as its argument when repeating. The verifier checks it when present.

`node combination-study/diagnostics.mjs` checks each checkpoint against its stage's final transcript response and reports unchanged coefficients, added requests and first-batch quota consumption. This is a post-run diagnostic, not a further agent attempt. Pass a fresh run directory as its argument when repeating. The retained run's flat budget response and batching strategy are discussed prominently in the reports; they must not be presented as a bound on a better-planned attacker.

After successful offline verification, save its JSON output as the run's `verification.json`, run `node combination-study/write-reports.mjs`, then `python combination-study/build-reports.py` with ReportLab installed. Render and visually review every PDF page before sharing. Retained earlier reports describe earlier stages and should not be overwritten.
