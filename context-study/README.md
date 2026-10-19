# Exact quotes and private business contexts

Read [the effectiveness scorecard](../docs/CONTEXT_BENCHMARK.md) and [current white paper](../docs/REA_SaaS_Protection_White_Paper_Contexts.pdf). This study tests exact workflows without product rounding or query caps. It measures own-context copying and other-context recovery separately. A successful permission boundary is not a universal anti-cloning mechanism.

## Verify existing evidence

From the repository root, use a supported Node.js release:

    node context-study/verify.mjs
    node --test context-study/test.mjs

The verifier is offline: it replays frozen sources, every captured HTTP response, fitting calls, predictor hashes, scores, utility and two-world boundary traces. Tests create temporary loopback servers. The full repository/research pack contains raw evidence; the developer pack contains source and reports only.

## Repeat with new hidden targets

Install the pinned dependencies using the repository reproduction guide. Supply REA_CODEX_EXECUTABLE as the native Codex executable and optionally REA_BROWSER_EXECUTABLE for Chrome. Authenticate Codex separately using your own account; never place credentials in this repository. The harness requires access to gpt-6-astra with max reasoning; model catalog entries alone do not establish access.

    node context-study/run.mjs replications/context-new
    node context-study/boundary.mjs replications/context-new
    node context-study/prior.mjs replications/context-new
    node context-study/verify.mjs replications/context-new --save

A full run starts 24 fresh ephemeral agents, at most three concurrently, with 30 minutes per agent. Requests to the model service consume account usage. No automatic repeat of failed or interrupted attempts is permitted. Use a new directory and retain the interrupted attempt for audit; do not overwrite published runs. The main run rejects an existing run directory. Keep all raw app-server events and operator target files in ignored output, never in a distribution archive.

The prior script is explicitly post-hoc supplementary numerical analysis, not another agent. The published run additionally retained a supplementary code hash during agent execution, before scoring. The repeat commands above do not create that optional commitment; the verifier reports supplementaryFreezeVerified as false when it is absent and makes no prospective supplementary claim. Its informed lookup predictor is not subject to the agents' 32-segment limit. It receives the correct pricing family and prior ranges but no target coefficients. The report generator is for the published study only; inspect its prose before using it for new results.

## Files and evidence

- PLAN.md and PROMPT.md: prospective design and participant instructions.
- server.mjs: teaching fixture, permissions, exact quote state and deliberate negative controls.
- rea-tools.mjs, fit.mjs, agent.mjs: actual REA observations, bounded numerical fitting and restricted app-server harness.
- run.mjs, assessment.mjs, utility.mjs: commitments, heldouts, accuracy and exact customer workflows.
- boundary.mjs: deterministic two-world response comparison, separate from browser agent measurements.
- prior.mjs: stronger informed-prior sensitivity analysis after the main run.
- verify.mjs: independent evidence checks and arithmetic replay.
- ../runs/context-20261019/: public captures, transcripts, frozen predictors, commitments, scores and exact workflow records.

This is an in-memory localhost fixture with synthetic sessions, guessable IDs and HTTP. It is not a deployable billing or authentication system. Production needs durable transactions, real identity provisioning, TLS, CSRF protection where applicable, rate-abuse controls, tested revocation propagation and independent security review. The context defence assumes the observer cannot simply join another customer's entitlement. Collusion and identity compromise are not solved here.
