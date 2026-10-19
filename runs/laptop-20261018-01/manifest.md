# Laptop REA measurement manifest

Run: `laptop-20261018-01`, 18 October 2026, Europe/London. Machine timestamps in evidence are UTC. Research objective: compare direct disclosure and server authority on two owned synthetic SaaS fixtures. No third-party target was tested.

## Environment and identity

- Windows x64, kernel 10.0.26300; Intel Core i7-8750H at 2.20 GHz; 12 logical processors; 32 GiB RAM. See `environment.json`.
- Node 24.19.0; pnpm 11.25.0. npm was not on PATH. REA installed locally with `pnpm --dir tooling add --save-exact rea-agents@6.7.0 --ignore-scripts --store-dir .pnpm-store` instead of a global npm installation. Package scripts were disabled. The exercised web and static-analysis commands ran successfully.
- REA 6.7.0; registry engine range `^22.19.0 || ^24.11.0 || >=26.0.0`. Package metadata and lockfile retained. Registry metadata did not provide gitHead; no npm-to-Git SHA equivalence is claimed.
- Google Chrome 155.0.8059.82 at `C:/Program Files/Google/Chrome/Application/chrome.exe`; headless disposable profiles. CDP at loopback 9222 and 9223. Browser revision is in each target-list result.
- Lab is extracted from `REA_Codex_Wargame_Reproducibility_Kit.zip`. No Git repository was supplied. `baseline-sha256.json` identifies all core fixture files. Baseline source was not edited.
- Operator: Codex. Session instructions identify the GPT-6 family; exact model selector and effort are unavailable. No separate red agent or enforced clean room was used.
- Interfaces: shell, REA CLI, Playwright for action coordination, direct HTTP for explicitly separate supplemental white-team checks. No REA MCP registration was applied. Setup was dry-run only. Native decompilers were not needed.

## Execution record

`commands.jsonl` records all 18 measured REA commands, absolute arguments, start/end times, exit codes and output files. Each exited zero and emitted parseable Evidence JSON. This is command execution success, not complete capture coverage.

Preparation commands: `node --version`; `pnpm --version`; official registry metadata fetch; pinned install above; `node tooling/node_modules/rea-agents/scripts/rea.mjs --help`; `doctor --json`; `setup --client codex --dry-run`; command-specific help. `doctor` reported missing native engines and unregistered MCP/skill, while confirming the supported Node runtime. CLI web measurements succeeded independently of those optional integrations.

Lab checks from the lab directory: `node --test`; `node tools/scan-build.mjs public/hardened.js`; `node tools/scan-build.mjs public/unsafe.js`; `node tools/generate-rea-scenarios.mjs "C:/Program Files/Google/Chrome/Application/chrome.exe" laptop-20261018-01`. The unsafe scan intentionally exits 1; hardened scan exits 0. Nine tests pass.

PowerShell launched `node server.mjs` in two hidden child processes with MODE/PORT pairs unsafe/3000 and hardened/3001. Separate hidden Chrome processes used `--headless=new --no-first-run --no-default-browser-check --remote-debugging-address=127.0.0.1`, ports 9222/9223, disposable profile directories, and the corresponding localhost page. Ordinary authenticated browser profiles were not used.

Root orchestration scripts: `run-rea.mjs`, `capture-passive.mjs`, `capture-v8.mjs`, `measure-controls.mjs`, `compile-results.mjs`. Scenarios requested request/response bodies, DOM and accessibility text, with header values disabled. V8 windows were 10 seconds; the coordinator waited for the actual armed stderr notification before clicking. Action timestamps and rendered results are in `logs/*-v8-action.json`.

`node measure-controls.mjs` ran additional direct HTTP checks on fresh, ephemeral loopback fixtures. Each mode received the fixed four-quantity sample policy [1,25,75,150]. Only hardened received the fifth duplicate quantity 150 to verify quota rejection. A separate fixture per mode ran authority, stream and route checks. Resets separated white-team experimental conditions; they were not presented as red-team quota bypass or one continuous inference budget.

## Deviations and limitations

The restricted shell could not resolve npm and denied localhost connections with EACCES. The same authorised commands succeeded with approved network access. Initial failures are retained in `logs/node-test-sandbox-denied.txt`; these are environmental failures, not application defences. CIM inventory was denied; inventory uses Node's OS API.

Both scenarios report `normalized_result.completeness.status = incomplete`, missing `events`, with zero dropped events. Captured bodies needed for the claims are individually marked captured; GET request bodies are not_exposed. Keep REA's original limitations. Body bytes are Playwright API results, not verified original wire bytes.

V8 captures also contain action-tool instrumentation. Summaries select the exact application asset URL; unrelated anonymous scripts are not counted as SaaS logic. Request causal_attribution remains unknown. Runtime instrumentation changes JIT/timing.

SSE and server-authority measurements are supplemental HTTP and regression evidence, not REA network captures. Optional Wakaru recovery and decoy experiments were not run. No original TypeScript application recovery is claimed.

Phases E/F are not completed as a publication-grade blind reconstruction experiment. The same session observed both variants and later inspected white-team source. No valid independent prediction accuracy or holdout score exists. `red-only` contains a permitted-material handoff and explicit isolation requirements, not proof that isolation occurred.

Sharing bundle copies are explicitly derived: local account/workspace paths are replaced. Raw original evidence stays in this local run directory. SHA-256 manifests distinguish raw and shared bytes. No external publication or messages were sent.
