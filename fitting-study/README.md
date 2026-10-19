# Repeat the cap-aware fitting study

Read the [prospective plan](PLAN.md) and [agent prompt](PROMPT.md). This study tests
five disclosure policies on six synthetic targets with fresh REA-assisted agents
that know their cap and have a bounded numerical fitting tool. It uses only owned
loopback fixtures. Never substitute real customer data, credentials or external
applications.

The [scorecard](../docs/FITTING_BENCHMARK.md) and
[white paper](../docs/REA_SaaS_Protection_White_Paper_Fitting.pdf) explain the results.
Historical studies remain intact in their own directories.

## Verify without agents or browsers

From the repository root, run `node fitting-study/verify.mjs`. It checks frozen
source and targets, agent settings and final outputs, observation provenance,
every captured body digest, matching DOM/network transactions, policy decisions,
every numerical fit using only prior observations, scores and utility journeys.
Verification needs Node, not an account or paid inference.

## Run a fresh replication

Install pinned REA 6.7.0 with package lifecycle scripts disabled. Use a supported
Node release and Chrome. A compatible, authenticated native Codex app-server with
access to gpt-6-astra/max is required. The original used the version recorded in
the pre-run freeze; future CLI changes may require an explicitly versioned runner.
The model catalog is not an entitlement check: a completed inference turn is the
access check. See the [official app-server documentation](https://developers.openai.com/siwc/token-sharing-open-source/codex-app-server).

Set REA_CODEX_EXECUTABLE to your native executable and REA_BROWSER_EXECUTABLE to
Chrome. Do not publish those local settings. From the repository root run
`node fitting-study/run.mjs replications/my-new-fitting-run`, then
`node fitting-study/verify.mjs replications/my-new-fitting-run`.

The runner starts up to three agents concurrently, with 30-minute ceilings per
cell, 192 attempted requests, 64 REA captures and 40 fitting calls. Thirty fresh
agents can consume substantial model usage. No arbitrary agent code executes.
Synthetic observations go to the configured Codex service. Raw engine/account
events and target commitments before reveal live under ignored output/; only
sanitised public evidence belongs in a shareable pack. Agents have no shell,
external network, environment, other contexts, plugins or inherited Node MCP.
This is bounded tooling, not a VM security certification.

Fresh runs must use a new directory. Completed runs are immutable. The current
interruption path preserves incomplete attempts without rerunning them; if a
process is interrupted before measurement logs are written, verifier failure must
remain visible and be repaired with retained evidence, never invented records.

## Understand the numerical tool

fit.mjs has no file/network/target imports. It deduplicates genuine successful
observations, intersects bounds from repeat outputs, and fits generic affine
pieces. Dynamic programming selects least-squares partitions. Interval refinement
clips a bounded coefficient polygon using rounding inequalities; it is not a
global optimiser over all interval-consistent partitions. Optional explicit
segment starts permit agent-directed refinement. Returned transition gaps are
uncertainty, not discovered true thresholds. Training loss is not a test score.

## Rebuild the reports

Run `node fitting-study/write-reports.mjs` and
`python fitting-study/build-reports.py` after offline verification. Python needs
ReportLab. Render and inspect every PDF page before sharing. The research pack
includes raw runs; the smaller developer pack includes code and guides only.
