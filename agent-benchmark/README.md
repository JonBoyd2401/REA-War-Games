# Measure a real REA-assisted reconstruction agent

Read [the effectiveness scorecard](../docs/AGENT_BENCHMARK.md) and the [current white paper](../docs/REA_SaaS_Protection_White_Paper_20261019.pdf). The original paper remains a historical baseline.

This experiment uses fresh ephemeral Codex app-server agents, not the earlier hand-written pricing learner. The LLM chooses its own probes and writes its own non-executable JSON predictor. Each accepted study tool call invokes the pinned REA 6.7.0 CLI and a fresh headless Chrome browser. The tool wrapper limits the agent to the owned synthetic application; it does not expose every REA capability.

## Verify the published evidence without an agent account

From the repository root, with a supported Node version:

```sh
node agent-benchmark/verify.mjs
node --test agent-benchmark/test.mjs
```

The verifier needs no browser, account, network or model inference. It checks source hashes, target commitments, predictor freezes, every scored price, holdout separation, actual REA network-body digests, DOM projections, linked requests and responses, aggregate arithmetic and normal workflow checks. Application tests use loopback HTTP. A verifier pass establishes internal consistency of the retained artifacts, not independent attestation of the researcher or host.

## Repeat with fresh targets

Use an isolated working copy and a Codex CLI installation with app-server dynamic-tool support, the configured `gpt-6-astra` model and high effort, Node, REA 6.7.0 and Chrome. Model access consumes the operator's account allowance. Do not substitute another model while describing it as the same experiment. A fresh run records the actual Codex version and asserts the resolved model and effort.

```powershell
npm install --ignore-scripts
$env:REA_BROWSER_EXECUTABLE='C:/Program Files/Google/Chrome/Application/chrome.exe'
node agent-benchmark/run.mjs replications/my-agent-study
node agent-benchmark/verify.mjs replications/my-agent-study
```

The measured host used Codex CLI 0.163.0-alpha.10.2 on Windows. The default executable is `codex.exe`; set `REA_CODEX_EXECUTABLE` to the installed CLI path on another setup. This is an experimental app-server interface, so check the installed protocol before attempting a different CLI version. The runner creates six new targets, commits their hash and freezes its source before starting 36 fresh agents. It uses at most three concurrent agents. Each has 24 attempted business queries, 12 REA operations and a 20-minute ceiling. The six policies share each target. Holdouts are selected only after every predictor is frozen, excluding successful observations from all six paired cells. Never overwrite a completed run or select reruns after seeing scores.

All fixture servers bind to loopback. Cookies are random, synthetic and passed by secret reference; no ordinary browser profile is used. Agent environment access is disabled. Shell, apps, plugins, web search, memories and the inherited Node MCP server are disabled in the harness. **This is a tool capability restriction on a trusted shared host, not an OS sandbox against compromised runtimes.** Before using a different installation, inspect its enabled MCP servers and inherited configuration; the published settings name the one inherited server present on the measured host. Do not put private files or personal credentials in the agent workspace. The account's normal CLI authentication is used without publishing its contents.

Model inference uses the configured Codex service, so the synthetic observations are sent to that service; the pricing target itself is local. Private engine event streams, account notifications, paths and reasoning events go under ignored `output/agent-private/`. Only projected tool requests, observations, agent commentary/final predictions and safe measurement metadata go into the evidence tree. Do not publish the raw private directory. Review output, decoded bodies, PDF metadata and Git author/committer identity before sharing a new run.

## Evidence map

| File | Purpose |
|---|---|
| `PLAN.md`, `PROMPT.md` | Prospective method and the identical agent prompt |
| `runs/agent-20261019/pre-run-freeze.json` | Hashes of source, settings and recorded runtime versions |
| `target-commitment.json`, `targets.json` | Pre-run commitment and later disclosed synthetic targets |
| `schedule.json` | Randomised order of all 36 paired cells |
| `cells/*/agent-transcript.jsonl` | Projected agent/tool interaction; excludes private reasoning and account events |
| `cells/*/agent-result.json` | Frozen agent-authored predictor, status and token usage |
| `cells/*/rea-evidence/` | Actual retained REA captures, including incomplete coverage flags |
| `cells/*/commands.jsonl`, `scenarios/`, `observations/` | Reproduction details and projections checked against captures |
| `model-freezes.json`, `holdouts.json` | Freeze-before-scoring sequence and common unseen cases |
| `scores.json`, `aggregate.json` | All per-input predictions and paired aggregate results |
| `utility.json` | Two supported normal quotes on each fresh target/policy fixture |
| `verification.json` | Offline verifier output |

Paths after the first run entry are relative to `runs/agent-20261019/`. Read `docs/AGENT_BENCHMARK.md` before interpreting a low score as protection: accuracy concerns the original hidden pricing domain, while catalogue and approval restrictions deliberately remove some of that domain from the customer product.
