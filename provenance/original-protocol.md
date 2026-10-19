# REA vs SaaS: Codex Red/Blue War-Game Protocol

**Status:** Reproducible research protocol; REA execution **pending laptop run**  
**Version:** 1.1, 18 October 2026  
**Intended operator:** An engineer using Codex on a local laptop  
**Test target:** The included **owned synthetic SaaS lab**, never a third-party service  
**Working hypothesis:** Sound architecture and minimal disclosures **reduce attack surface and risk**. They do not make an observable SaaS product un-reverse-engineerable.

> **Read this first:** This is hypothesis-driven engineering research, not a claim that we have “blocked REA”. REA has been source-reviewed; application-level regression tests and a constrained Chrome DevTools (CDP) baseline have been run. **An actual REA run remains to be performed.** Record both successful extraction and failed hypotheses. Preserve legitimate product functionality and authorised customer access. Invite independent replication and improvement.

## 1. Objective and research questions

Treat REA as an adversarial **observation and analysis toolkit** operated by an authorised tenant user. Measure, rather than assume, the difference between:

1. **Disclosure:** What source, rules, fields, traces, event payloads, and relationships were directly obtainable?
2. **Inference:** Which business rules were inferred from observed code and input/output examples, and how accurate were those hypotheses?
3. **Replication:** Can an independent agent reconstruct the pricing outcome for **unseen test quantities**, without reading the backend source?
4. **Abuse resistance:** Are other tenants' data and server-authoritative state inaccessible to a tenant-A user? What activity would generate monitoring signals?
5. **Usefulness:** Can legitimate users still obtain quotes and status updates? What friction and false positives would a control introduce?
6. **Deception (optional exploratory study):** Do isolated decoys or canaries change the agent's conclusions or identify suspicious exploration, without modifying production behaviour?

A *negative* REA output is **not** proof that information is inaccessible: a tool may have been misconfigured, may not have captured the relevant interval, or may report unknown/incomplete coverage.

### What is in scope

- The deliberately insecure app on `http://127.0.0.1:3000` (unsafe).
- The contrasting server-authoritative app on `http://127.0.0.1:3001` (hardened **for the particular synthetic controls only**).
- REA's real CLI and optionally its Codex MCP tools, with tool version recorded.
- The lab's own API, JavaScript, source map, DOM, V8 paths and finite SSE response.
- Ordinary reads and bounded, non-destructive mutations in **these synthetic tenants**.

### What is out of scope

Third-party apps, external tenant data, bypassing production access controls, real payment/billing systems, credentials other than synthetic `demo-A` and `demo-B`, and unauthorised traffic. The lab's static demo bearer string is intentionally unrealistic; **even the hardened fixture embeds `demo-A` in JavaScript**. It is not an example of production authentication. Do not call the hardened lab “secure SaaS” or “REA-proof”.

## 2. Confirmed baseline and epistemic status

**Already executed locally:**

- `npm test`: **9/9** controlled Node.js checks passed.
- `npm run scan`: hardened frontend artefact scan passed.
- `python tools/cdp_adversary_benchmark.py`: Chrome's V8/Debugger source and execution observations plus **real localhost API calls through a Python `fetch` bridge**, but **NOT REA** and **NOT normal browser-network request capture**.
- Unsafe client shipped the pricing rules and source-map `sourcesContent`; hardened client did not.
- Unsafe API/stream disclosed internal `ruleId` or threshold information; hardened response/stream did not.
- Both modes still returned ordinary price totals (an input/output oracle), and the hardened lab rejected the fifth consecutive sample with `429` after four successes.
- Existing samples were limited and not a measured independent clone or accurate boundary-inference result.

**Not yet established:**

- That REA runs correctly on the target laptop/browser.
- That REA reconstructs any feature correctly on this lab.
- That a decoy substantially impairs REA or a downstream agent.
- That the hardened model is impossible to infer from carefully selected authorised queries.
- Real SaaS-scale performance, usability, user-impact or attack economics.

**Local-runtime blocker:** The earlier working environment used Node.js **22.16.0**, below REA's documented supported Node 22 minimum **22.19**, and could not resolve the npm registry. This is why the actual REA stage is delegated to the laptop. This is not a finding about REA itself.

**Sources inspected:** `morluto/rea` at Git commit `32f0e5120966be59d17a1e092353816c76a9c5e2`. A newer npm release may behave differently. Preserve the exact installed version and distinguish upstream source interpretation from runtime measurement.

## 3. Research claims: hypotheses to test, not pre-accepted conclusions

| ID | Hypothesis | Measurement | What would refute or qualify it |
|---|---|---|---|
| H01 | Shipping business decisions in JavaScript enables direct rule extraction | REA source/script/bundle evidence names relevant bands, calculation or constants | REA cannot extract, or extracted code is incomplete/inaccurate; investigate capture settings before concluding |
| H02 | Source maps make reconstruction cheaper or more precise | Original names / `sourcesContent` / mapped source and analyst accuracy/time | No meaningful lift in accuracy or effort with maps enabled |
| H03 | Moving protected decisions server-side reduces **direct code disclosure** | Hardened frontend has no pricing formula; REA module/recovery evidence | Source unexpectedly remains in bundles, HTML, worker, cache, WASM or maps |
| H04 | Minimal DTOs reduce explanatory information exposed to clients | Count and names of server-private fields in API payloads | Protected rule data still appears in response/metadata |
| H05 | Minimal SSE events reduce intermediate-decision disclosure | Compare event names, fields, tenant scope and replay controls | Rule identifiers, thresholds, sensitive traces or other tenant's event are visible |
| H06 | Server authority blocks state tampering and cross-tenant reads | Client price override rejected; tenant-B cannot read A's quote; rate limits return bounded results | Accepted tampered totals or cross-tenant reads, or quota bypass |
| H07 | Source recovery and V8 execution traces help an analyst navigate client functionality | Evidence of direct DOM handlers, execution ranges, recovered modules and initiators | Missing or partial coverage; no link to the investigated client action |
| H08 | Rate limits increase sampling cost but do not eliminate behavioural inference | Requests before 429; correct inferred thresholds/hidden totals after bounded probes | Same inference accuracy and effort under equivalent budgets; sparse probes still suffice |
| H09 | Inert decoys or canaries influence agent inference/detect exploration | Wrong inferred routes/rules, observed canary requests, false positives, added time | No behavioural difference versus no-decoy control; legitimate user/tool triggers canary |
| H10 | Controls can reduce exposure **without breaking customer outcomes** | Legitimate quote works in both; hardened gives correct totals and entitled events | Failure, latency regression, inaccessible flow or unacceptable false-positive rate |

Keep **inference accuracy** separate from **security authority**. A client can correctly infer some pricing bands without being able to tamper with totals or access another tenant. Both statements can be true.

## 4. Codex operator instructions (copy this entire section to Codex)

> You are performing an **authorised, local-only adversary-emulation experiment** on the provided synthetic REA SaaS lab. Your deliverable is a reproducible evidence record comparing the unsafe and hardened targets and an honest report of what was observed, inferred and reconstructed. Do not claim that REA is blocked. Record unknown/partial outputs. Do not touch other networks or commercial products. Begin with environment checks; install a **pinned** compatible REA version; do not modify the baseline lab before initial measurements. Use a separate red-only workspace containing *only* browser-observable material and authorised capture exports. The red agent MUST NOT read `server.mjs`, `private-pricing.mjs`, `test/`, the scoring scripts or white-team outputs. Use a second white-team session to evaluate blind reconstruction. Do not load a real secret into REA evidence. Run and document the exact REA CLI/MCP calls and artefact hashes. Test application usability as well as extraction. Distinguish tool errors from security controls. Never invent a successful REA result if installation or execution fails.

### Phase A — Inventory, prerequisites and pinned tool identity

From the extracted lab directory:

```bash
node --version
npm --version
npm test
npm run scan
# The unsafe scan should fail, intentionally:
node tools/scan-build.mjs public/unsafe.js
```

For **REA itself**, upstream currently specifies Node **22.19+ within 22.x, 24.11+ within 24.x, or 26+**; Node 23/25 are not supported. Validate against the pinned release's `README` and `engines` field; do not assume the source-review commit matches npm's latest release.

```bash
npm view rea-agents version
# Choose and record one exact published version, then replace VERSION below.
npm install --global rea-agents@VERSION
rea --help
rea doctor --json
rea setup --client codex --dry-run
# If the proposed changes are appropriate, run interactively:
rea setup --client codex
```

**Do not paste the string `VERSION` literally.** Installation and setup may mutate the local Codex MCP registration; inspect the plan and consent to changes first. Start a new Codex session after registration where directed. CLI use is sufficient if Codex MCP integration is unavailable. `rea setup` does not install a browser for you. Full native decompilers (Ghidra/IDA/Hopper) are unnecessary for this web-only lab.

Find the laptop's absolute Chrome/Chromium/Edge executable path; examples (verify the actual file exists):

```text
Linux:   /usr/bin/chromium
macOS:   /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
Windows: C:\Program Files\Google\Chrome\Application\chrome.exe
```

For reproducibility, record in `runs/<RUN_ID>/manifest.md`: OS, CPU, Node, npm, REA version, browser name/version/path, repo SHA, Codex model/effort setting, tools enabled, capture options, date/time, run ID, test mode, any network restrictions, and exact terminal command lines. Do not include real credentials or unredacted personal data.

### Phase B — Start the two local targets

Use **two separate terminals** in the lab directory:

```bash
npm run unsafe     # localhost:3000
```

```bash
npm run hardened   # localhost:3001
```

Confirm both with a browser or `curl`:

```bash
curl -i http://127.0.0.1:3000/
curl -i http://127.0.0.1:3001/
```

**Windows:** If POSIX `MODE=...` scripts do not work in the default Windows terminal, launch these via Git Bash/WSL or set the environment with PowerShell explicitly:

```powershell
$env:MODE='unsafe'; $env:PORT='3000'; node server.mjs
# In another PowerShell session:
$env:MODE='hardened'; $env:PORT='3001'; node server.mjs
```

Both services bind to `127.0.0.1` only. No external deployment is necessary or authorised by this protocol.

### Phase C — Generate **genuine REA browser scenarios**

The project includes a scenario generator so paths and ports are not hand-edited. In a new terminal (use your **actual absolute browser path**):

```bash
node tools/generate-rea-scenarios.mjs "/absolute/path/to/your/chrome" RUN_ID
```

On Windows the quoted path may be `"C:\Program Files\Google\Chrome\Application\chrome.exe"`. The command prints the paths for:

- `runs/RUN_ID/scenarios/unsafe-network.json`
- `runs/RUN_ID/scenarios/hardened-network.json`

Each generated scenario visits its **localhost** target, clicks the Quote button, waits for an updated DOM, and requests network bodies and DOM/accessibility evidence. It deliberately does **not** collect header values. **Never enable full-body capture for an external system without explicit authorisation and sensitive-data safeguards.**

Now run REA for each:

```bash
mkdir -p runs/RUN_ID/rea-evidence
rea capture-browser-scenario runs/RUN_ID/scenarios/unsafe-network.json --json > runs/RUN_ID/rea-evidence/unsafe-scenario.json
rea capture-browser-scenario runs/RUN_ID/scenarios/hardened-network.json --json > runs/RUN_ID/rea-evidence/hardened-scenario.json
```

**Windows:** Create the output directory with `New-Item -ItemType Directory -Force ...` rather than `mkdir -p`. Verify exit code, JSON parseability and REA Evidence `status`/limitations for both runs. A CLI invocation exiting zero does **not** automatically establish that every requested artefact was captured. If the installed version changes a flag or JSON schema, read `rea capture-browser-scenario --help`, adapt, and record the difference.

### Phase D — REA CDP passive inspection, bundle analysis and V8 attribution

Use a **separate disposable browser profile** with the Chrome DevTools Protocol bound on localhost. Launch from a user terminal with an appropriately quoted browser executable and arguments:

```bash
"/absolute/path/to/your/chrome" --remote-debugging-port=9222 \
  --remote-debugging-address=127.0.0.1 \
  --user-data-dir="/absolute/disposable/rea-red-profile" \
  http://127.0.0.1:3000
```

**Windows:** Run the equivalent as one PowerShell command, with `& "C:\...\chrome.exe"` followed by the flags. Do not reuse your everyday authenticated browser profile or expose port 9222 beyond loopback.

```bash
rea list-browser-targets http://127.0.0.1:9222 --json
```

Read the JSON to obtain the exact page `target_id` for port 3000. Target IDs are dynamic; **do not reuse** them after restarting Chrome or changing to port 3001. Keep this run separate from any other browser target.

Run the following, replacing the literal `TARGET_ID` with the value returned by REA:

```bash
rea inspect-web-page http://127.0.0.1:9222 TARGET_ID \
  --include-script-sources --include-json-body-shapes \
  --include-accessibility-text --json \
  > runs/RUN_ID/rea-evidence/unsafe-inspect.json

rea analyze-web-bundle http://127.0.0.1:9222 TARGET_ID --json \
  > runs/RUN_ID/rea-evidence/unsafe-bundle.json

rea inspect-web-event-listeners http://127.0.0.1:9222 TARGET_ID '#quote' --json \
  > runs/RUN_ID/rea-evidence/unsafe-listeners.json
```

**Source maps:** Read `rea analyze-web-bundle --help` and enable its **optional source-map fetch** setting in a *separately named* run; the source API calls this `fetch_source_maps`. Compare map disabled/enabled, capturing the flags and evidence coverage. Source maps are not automatically fetched by passive page inspection.

**Script export and recovery:** The two-stage REA workflow requires an absent destination path. Run from the lab root:

```bash
rea export-web-scripts "$PWD/runs/RUN_ID/rea-evidence/unsafe-inspect.json" \
  "$PWD/runs/RUN_ID/rea-evidence/unsafe-export" --json \
  > runs/RUN_ID/rea-evidence/unsafe-export-manifest.json
rea analyze-javascript-application \
  "$PWD/runs/RUN_ID/rea-evidence/unsafe-export/files" --json \
  > runs/RUN_ID/rea-evidence/unsafe-js-analysis.json
```

On Windows, use absolute paths generated by Codex (for example from `Resolve-Path`) in place of `$PWD/...`. The optional **Wakaru** recovery stage is separate and needs its supported executable; follow `docs/javascript-recovery.md` for the pinned REA release. Do not label a plain static JS analysis as recovered original TypeScript. Inspect each tool's `coverage`, `limitations` and output provenance.

**Runtime observation:** REA's `observe-web-execution` runs for a finite window; start it, wait for its actual *armed* progress notification, then click Quote **while that window is open**. If the CLI terminal is blocking, use a second terminal or let Codex coordinate a bounded child process with correct cleanup.

```bash
rea observe-web-execution http://127.0.0.1:9222 TARGET_ID \
  --observation-ms 10000 --json \
  > runs/RUN_ID/rea-evidence/unsafe-v8.json
```

A coverage count or script attribution is **not** proof of full UI causality. REA explicitly documents partial coverage, JIT/timing effects and limits for workers, other frames and WebAssembly.

Repeat Phase D for port 3001 with **a new target ID and dedicated browser profile**. Use filename prefixes `hardened-...`. If REA or Chrome refuses an observation, log the tool error as `UNKNOWN`, not `BLOCKED`.

### Phase E — Controlled behavioural inference / observable oracle

Give the red agent up to **four successful ordinary quote evaluations per target within a fixed experimental window**, using the synthetic account. Apply the same response budget and identical input-selection policy to both modes. Record every attempted quantity, timestamp, response code and total; no stealth, brute force or attempts to bypass quotas. You may run later *separate* windows for studies of sparse versus extended queries, but do not mix budgets when claiming a difference.

- **Unsafe target:** agent may use only browser-visible artefacts and allowed responses, not private repository code.
- **Hardened target:** same authorisation and observation policy; it has limited direct implementation disclosure, but still outputs totals.
- The red agent writes a frozen, self-contained hypothesis explaining the pricing rule, confidence, which evidence supports it and which observations remain ambiguous.
- Commit the hypothesis/agent transcript/checksums **before** revealing any holdout inputs or running the scorer.

**Do not compare only how many strings REA found.** The critical quantity is how accurately the independently built model predicts unseen outputs and which protections affect that accuracy.

### Phase F — Independent blind reconstruction scoring

**Essential clean-room requirement:** Run the red agent in a separate folder, OS account or container with read access only to the **REA evidence and permitted public frontend assets**. It must not be able to see `server.mjs`, `private-pricing.mjs`, source maps other than those captured from the browser, `test/`, white-team reports or this lab's hidden scorer. Merely telling one Codex process not to read files is a procedural safeguard, not an enforced clean room. For publication-grade inference scores, use actual filesystem/network restrictions and separate agent sessions.

1. White team finishes the REA evidence stage and freezes the permitted capture set (compute SHA-256 hashes).
2. Red agent produces a reconstructed algorithm and a committed Markdown account of its reasoning, **without** seeing backend source or white-team outputs.
3. White team then generates unseen input quantities:

```bash
node tools/generate-holdouts.mjs RUN_ID
```

4. White team gives the red agent *only* the generated `quantity,predictedTotal` CSV (quantity cells populated, prediction cells blank), then closes oracle access. The red agent must fill predicted amounts from its **frozen model**, without consulting the SaaS API again.
5. White team scores that returned CSV:

```bash
node tools/grade-predictions.mjs path/to/red-team-predictions.csv \
  > runs/RUN_ID/white_only/score.json
```

6. Report **coverage, exact-match fraction, mean absolute error, max error and accuracy in each pricing band**. If the red agent cannot produce some predictions, leave them blank; they count as non-matches, not as zero error.

The quantities are visible *only after* inference is frozen; the values are never visible. Real pricing rules are intentionally accessible to white-team scoring, so scores are trusted only if the agent was genuinely isolated from private source and from prior turns containing the correct rules. **A same-session Codex demonstration is not valid blind replication.**

### Phase G — Optional decoy / deception experiment

Run only *after* the baseline. Treat decoy code as a risky, optional research hypothesis, not recommended production engineering.

- Make a third **decoy-lab variant** with an **inert** synthetic module containing non-production candidate rules and a canary route that returns no useful data. Do not import it into the quote, auth, entitlement or checkout code paths.
- Keep the actual API results, actual decision logic and authorised UX **identical** to the non-decoy comparison.
- Alternate independent agent sessions across decoy/control variants, with equivalent model, prompts, observation time and request budget. Randomise testing order when possible.
- Score false inferences, abandoned investigations, canary visits, analysis time, tool-call count, and legitimate user false positives.
- **Do not** plant prompt-injection instructions intended to hijack unrelated agents or alter customer-visible outcomes. Do not silently return false production prices based on bot signals.
- Record whether the decoy worked, didn't work or had an adverse effect. A decoy might even make an app *easier* to analyse by providing a convenient route hint.

### Phase H — Evidentiary integrity, limitations and reporting

Create these outputs for each run:

```text
runs/RUN_ID/
  manifest.md                 # exact environment, scope, pinned versions, operator, flags
  scenarios/                  # generated REA scenario inputs
  rea-evidence/               # original complete REA JSON and export manifests
  red-only/                   # read-only permitted captures and frozen red hypotheses
  white_only/                 # private source, holdout inputs, score.json; never hand red model
  observations.csv            # one row per assertion, grounded file and status
  findings.md                 # methods, result tables, failures, limits, controls
  contributions.md            # candidate issue/PR and replicability notes
```

**Every conclusion must cite a concrete evidence file**, command, run ID and relevant JSON path, preserving original `limitations` or coverage flags. Keep raw REA evidence private if it contains user data, browser URLs, tokens, or personal information. Publish a carefully reviewed, redacted evidence subset, not an indiscriminate HAR or authentication capture.

Accepted status values: `OBSERVED`, `NOT_OBSERVED_IN_CAPTURE`, `UNKNOWN_INCOMPLETE`, `ERROR`, `CONTROL_PREVENTED`, `HYPOTHESIS_ONLY`. A tool error is not a successful mitigation. A rule unknown after four queries is not proven impossible to infer with ten, twenty, or a different selection.

## 5. Experimental scorecard (copy for findings)

| Evidence ID | Condition | Unsafe result | Hardened result | Evidence ref | Confidence / limitations |
|---|---|---|---|---|---|
| R01 | Client pricing constants and algorithm directly readable | Pending REA | Pending REA | `unsafe-inspect.json` etc | — |
| R02 | Source map reveals original source names or embedded source | Pending REA | Pending REA | bundle/map results | — |
| R03 | DOM event handler associated with source/script | Pending REA | Pending REA | listener results | — |
| R04 | V8 coverage/initiator reveals executed pricing path | Pending REA | Pending REA | V8 result | — |
| R05 | Raw API body directly exposes rules/thresholds | Pending REA | Pending REA | scenario network content | — |
| R06 | SSE event reveals internal rule/tenant/threshold | Pending REA | Pending REA | scenario or captured SSE | — |
| R07 | Client price tampering accepted by server | Regression unsafe yes | Regression hardened no | separate app regression tests | Not a REA result |
| R08 | Cross-tenant quote access accepted | Regression unsafe yes | Regression hardened no | separate app regression tests | Not a REA result |
| R09 | Backend inference model from allowed input/output samples | Pending | Pending | agent frozen hypotheses | Strict budget, no hidden source |
| R10 | Blind holdout reconstruction exact-match fraction | Pending | Pending | white-team score JSON | Must enforce red/white isolation |
| R11 | Legitimate quote / status still functional | Regression yes | Regression yes | app tests, browser scenario | Only synthetic flow tested |
| R12 | Optional canary hit / decoy-induced false inference | Not tested | Not tested | optional future experiment | Experimental, not a defence claim |

**Report both the absolute outcome and the difference**, never only relative performance. If both models reproduce all totals despite hardening, the research result remains useful: IP disclosure was reduced, but the exposed pricing oracle still permitted reconstruction.

## 6. Threats to validity and peer-review issues to disclose

1. **Toy system:** A three-band pricing algorithm is much easier to infer than a real SaaS pricing, tax, eligibility, fraud or analytics service. Findings don't quantify commercial replication cost.
2. **Shared synthetic credential:** Both frontend bundles contain a hard-coded `Bearer demo-A` string, so neither is a production authentication reference design. Production identity, CSRF, refresh, session management, SSO and threat detection are excluded.
3. **Partial SSE:** The lab sends a finite SSE-formatted response and closes; it does not simulate long-lived subscription lifecycles, high-volume WebSockets, GraphQL subscriptions, permission changes mid-stream, or replay storage.
4. **Single-node quota:** Hardened rate limiting is in-memory, keyed per demo user and not distributed. It does not demonstrate race-safe quota enforcement across replicas.
5. **Capture coverage:** REA passive CDP tools may omit bodies or miss pre-attach requests. Use scenario `capture.network` options, verify output completeness and avoid mistaken equivalence claims.
6. **CDP baseline is not REA:** The local baseline used Chrome V8 inspection and a Python request bridge. Its synthetic request-body metadata must not be described as a real Chrome network capture.
7. **Insufficient inference samples:** Four successful calls do not show that more queries cannot infer proprietary rules. Distinguish direct disclosure from oracle-derived functional imitation.
8. **Cross-test contamination:** A Codex agent with access to backend files or previously observed correct rules invalidates the blind reconstruction claim. Isolate workspaces and sessions.
9. **Deception reproducibility:** Decoys might affect different models/agents differently; randomise conditions, count negative results, separate actual tool behaviour from LLM response, and publish uncertainty.
10. **No full IP-law determination:** The experiment is technical. Access rights and licence restrictions vary, and approved internal testing does not establish a general right to reverse-engineer third-party software.
11. **No accessibility/performance evidence:** A successful security test doesn't prove acceptable user friction or scale. Future studies need realistic latency, load, throughput, false positives and user-task success.
12. **Defence-in-depth is not secrecy by obscurity:** Obfuscation, fingerprint blocks and hidden code cannot make client-delivered bytes confidential. Canary instrumentation may support detection but cannot undo disclosure.

## 7. Interpretation framework and research conclusion template

Use this wording in the paper **until real REA results are available**:

> **Preliminary engineering hypotheses, supported by a synthetic lab.** We inspected REA's public implementation and identified the browser-side evidence it is designed to collect. We then built two local versions of the same SaaS feature and verified nine intended contrasts in direct application regression tests. A constrained Chrome DevTools baseline confirmed selected client-code and response disclosures, but did not execute REA. The proposed controls are therefore **risk-reduction hypotheses and established architecture practices**, not demonstrated REA-specific blocking techniques. The next step is an actual pinned-version REA run with blind reconstruction scoring and reproducible evidence.

Once a real REA run is complete, replace only the evidence-qualified portions, for example:

> **Observed in run `RUN_ID` (REA version X, browser Y).** Under the stated customer permissions, capture settings, sampling budget and synthetic feature, REA recovered [specific observable facts] from the exposed variant and [specific observable facts] from the hardened variant. [Number] predictions passed the blinded holdout scoring in each case. These results support [narrow claim], but do not imply that REA is blocked or that a real production application cannot be imitated.

Never claim a universal “REA blocking percentage”, “IP theft prevention rate” or “secure architecture score” from this single laboratory.

## 8. Community research: preserve useful access, reduce attack surface

Our research question is not **“How can developers prevent anyone from using reverse engineering?”** Legitimate inspection has important roles in interoperability, security audits, accessibility, incident response, customer testing and maintainability. The question is **“How do we reduce unnecessary exposure of protected implementation and unauthorised data without impeding legitimate uses?”**

Invite engineers and security researchers to submit:

- A **new test fixture** or allowed failure mode: source map, in-browser WASM, shared worker, service worker, cached bundle, streamed event, GraphQL subscription, WebMCP declaration, internal error, feature flag, stale CDN object or inference oracle.
- A documented **attack pathway**: exact permitted access level, the REA interface/version, chosen actions, relevant evidence fields, capture coverage and unknowns.
- A **bad versus better** implementation, with a regression test proving the functional requirement still works and the specific exposure is reduced.
- **Negative results**, including cases where hardening has no effect, canary detection fails, decoys help the analyst, or legitimate users are adversely affected.
- **Independent replication** on another OS/browser/model/version, using equivalent budgets and frozen prompts.
- A concrete **mitigation trade-off**: adoption cost, latency, maintenance, availability, user friction, operational false positives and any accessibility consequence.

Suggested pull-request issue template:

```markdown
### Threat and permitted access
- Attacker role/tenant and authorisation:
- Reproducible local fixture:
- REA version / browser / operating system:

### Hypothesis and control
- Expected observable evidence:
- Control and intended risk reduction:
- Expected legitimate function preserved:

### Test and evidence
- Steps and exact commands:
- Evidence file SHA-256, relevant JSON path and coverage:
- Direct disclosure / inferred rule / independent replication (distinct):
- Number and distribution of allowed queries:
- Holdout scoring, if relevant:

### Result and limits
- Observed / not observed / unknown / error:
- False positives and user impact:
- Confounders and conditions where the defence fails:
- What another contributor should attempt next:
```

**Publication position:** This is **research-in-progress and an open engineering assurance exercise**. We welcome falsification and contributions. More examples, implementations, supported REA versions and real-world deployment patterns are necessary to build useful, practical guidance. Defending proprietary engineering and customer data should coexist with legitimate inspection and authorised interoperability.

## 9. Sources and tool contracts

Verified against the inspected REA repository source, commit `32f0e5120966be59d17a1e092353816c76a9c5e2`. Record the runtime npm version separately.

- REA repository: https://github.com/morluto/rea
- Install and Codex setup: https://github.com/morluto/rea/blob/main/docs/installation.md
- Browser CDP: https://github.com/morluto/rea/blob/main/docs/browser-observation.md
- V8 instrumentation and listeners: https://github.com/morluto/rea/blob/main/docs/web-runtime.md
- Browser scenario schema and content capture: https://github.com/morluto/rea/blob/main/docs/browser-scenario-contract.md
- Script export: https://github.com/morluto/rea/blob/main/docs/website-script-export.md
- JavaScript recovery: https://github.com/morluto/rea/blob/main/docs/javascript-recovery.md
- OWASP API risks: https://api-security.owasp.org/editions/2023/en/0x11-t10/

> **Important:** Some links point at the moving `main` branch for ease of navigation. For publishable results, archive the actual inspected code/tag plus package hashes and pin links to commit IDs. Verify all CLI flags against `rea --help` and the installed version; examples above are grounded in the inspected source but were not themselves executed using REA in this environment.
