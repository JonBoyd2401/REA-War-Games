# What REA does, and what our experiments actually show

**Scope: the installed `rea-agents` 6.7.0 npm distribution and the retained web experiments. Reviewed 19 October 2026.** REA means **Reverse Engineer Anything**. It supplies reverse-engineering tools to an agent through MCP and to an operator through a command-line interface. An agent can use the resulting evidence to explain a feature and write a replacement. REA's own project describes support for websites, JavaScript, Electron and native applications; our measurements here concern the web paths. [Official project](https://github.com/morluto/rea).

The important sequence is: **observe the product -> collect delivered implementation and outputs -> form a hypothesis -> ask more questions -> implement and test an imitation**. The first two steps are directly visible in our REA captures. The earlier reconstruction experiment supplied its own small pricing learner for the later steps. The [new actual-agent benchmark](AGENT_BENCHMARK.md) instead lets fresh LLM agents choose probes and write predictors from real REA observations. It measures hidden pricing behaviour; it does not measure cloning a whole SaaS product.

## A concrete example

The unsafe lab sends pricing code to the browser. REA retained that script, which contained the calculation and discount bands. It also retained the quote response with nine fields, including unnecessary internal information. A reconstruction agent could read those artifacts directly.

The hardened lab removes the private calculation from the delivered script and reduces the response to three fields. That closes those direct disclosures. However, a caller can still vary quantity and read the total. In the later synthetic three-band benchmark, our adaptive learner used 24 exact responses to match all held-out prices on all 16 targets. A separate exhaustive diagnostic also matched all 1,000 domain inputs. **The server code was not recovered; equivalent behaviour was inferred from outputs.** [Measurements and limitations](RECONSTRUCTION_FINDINGS.md).

## The web operations, precisely

CLI names below use hyphens; corresponding MCP names commonly use underscores. Source locations refer to the installed package's `dist/` files, not a floating upstream branch. The [source trace manifest](../provenance/rea-6.7.0-source-trace.json) gives full relative paths, SHA-256 hashes and line locations. Recreate it with `node boundary-study/source-trace.mjs` after installing the pinned version.

| Operation we ran | What the implementation does | What that evidence does not establish |
|---|---|---|
| `capture-browser-scenario` | Playwright executes a supplied sequence such as click, fill and wait. Selected DOM, accessibility and network artifacts are retained. Our runs launch fresh headless Chrome and preload an ephemeral study session through a secret reference. | The operation is not an autonomous decision-maker. Earlier reconstruction runs use a page learner. In the new agent benchmark, the LLM chooses probes and writes the predictor; the wrapper translates its choices into bounded UI actions. |
| `list-browser-targets` / `inspect-web-page` | Enumerates the browser targets available through the configured debugging connection. CDP inspection captures selected page structure and accessibility information; selected script sources use `Debugger.getScriptSource`. | It does not enumerate arbitrary remote users' browsers or obtain private server source. Possession of a debugging connection is a local inspection capability, not an authentication bypass at the SaaS server. |
| Network-body capture | The scenario implementation calls Playwright's response-body API when requested; the CDP inspection path can use `Network.getResponseBody`. Captures preserve status, request relationships and selected bodies. | These are browser/API representations, not guaranteed raw wire bytes. Unselected or missing bodies are not evidence that the server returned nothing. |
| `analyze-web-bundle` | Parses retained JavaScript, traverses its syntax tree and records findings such as imports and endpoint references. | A string or static reference does not prove that a route is accessible, a branch ran, or an inferred interpretation is correct. |
| Source-map inspection | Follows declared map locations when selected and permitted. In 6.7.0, the fetcher checks approved exact origins, checks redirects and omits browser credentials. Maps may contain original source text in `sourcesContent`. | A map without embedded sources or useful mappings is not full source recovery. This fetch policy is a property of the tested tool, not a confidentiality boundary against other clients. |
| `export-web-scripts` / `analyze-javascript-application` | Writes already retained script bytes to a local artifact tree, then enables local static analysis of those files. | Export does not manufacture absent server code or fetch every missing dependency. Retained source text does not itself prove execution. |
| `inspect-web-event-listeners` | Resolves the first matching native DOM node and asks `DOMDebugger.getEventListeners` for listeners directly registered there, with callback locations. | It does not dispatch a click, enumerate every framework or delegated listener, or prove that a handler executed. The returned execution field is unknown. |
| `observe-web-execution` | Enables V8 precise coverage, records an observation window, takes one resetting sample, then stops coverage. It joins retained source with function/block counts and reported network initiators. | Counts are not a chronological trace or proof of UI causality. Instrumentation changes execution conditions. Workers and other excluded contexts are not silently treated as observed. |

The concrete source anchors include `CdpPageCaptureScripts.js:50`, `CdpPageCapture.js:175` and `:274`, `PlaywrightScenarioNetwork.js:346`, `WebSourceMapFetcher.js:147` and `:235`, `webBundleAnalyzerInspection.js:14`, `CdpEventListeners.js:35`, and `CdpExecutionCapture.js:18`, `:47` and `:50`. The manifest resolves the full package paths and guards against confusing these locations with another release.

## What an observer can learn from these artifacts

**Delivered implementation.** HTML, CSS, JavaScript, public assets and maps can expose layouts, calculations, validation rules, feature names and client-side state transitions. Minification does not make delivered code private. In our ablation, removing maps alone left the pricing formula in JavaScript.

**Service contracts.** Repeated legitimate actions show endpoint paths, request fields, response shapes, validation outcomes and ordinary state transitions. Debug details and unnecessary explanation fields may reveal more than the product needs. Server-side calculation alone did not help our ablation while the API still returned the bands.

**Behaviour from examples.** Vary an input, record the output, compare candidate rules, then test another input where those rules disagree. Our learner knew in advance that pricing used three monotone bands; that strong prior substantially simplified its task. The 24-query result cannot be presented as a general whole-product REA cloning rate.

**Composition across features.** An export, preview, support view or background job may answer a question refused by the main UI. Our new negative controls demonstrate this directly: one convenience export, or letting the caller approve its own request, restored a protected price. [Boundary evidence](BOUNDARY_FINDINGS.md).

An agent may combine all of these channels. The new benchmark measures adaptive LLM probing through two bounded REA study tools, including delivered page/script inspection and price workflows. It does not expose every upstream REA tool or test unconstrained whole-product reconstruction. Native decompilation, mobile instrumentation, browser exploits, stolen accounts and server compromise were not exercised.

## How to inspect our records without mistaking an empty capture for protection

1. Start with the scenario JSON and command record. Identify the fixture, session permissions, capture selection and exact operation.
2. Read `normalized_result.steps`: a completed action is different from a complete observation.
3. Read `normalized_result.events.items`. Link request, response and network-content entries by `transaction_id`. Response bodies are base64 encoded; verify their byte length and SHA-256 before interpreting them.
4. Compare the retained DOM result with distinct network responses. The new boundary verifier checks method, route, request body, status and response body, not just a success-looking page.
5. Read `completeness`, `limitations` and each body's state. All six new scenario captures retain overall `incomplete` status, with events listed as missing and `equality_eligible` false. We establish equality only for the explicitly checked application payloads; we do not label whole REA captures equal or complete.
6. Treat frontend source absence, denied access and low reconstruction accuracy as three different claims. Require normal successful controls for every denial experiment.

The baseline records are in [the original run](../runs/laptop-20261018-01/). The new records are in [the boundary run](../runs/boundary-20261019/). The verifier and [reproduction guide](../boundary-study/README.md) let another researcher check the claims.

## Consequences for defence

REA uses observation channels that other browser and HTTP tools can also use. Our evidence supports changing what the server authorises and discloses. It does not establish a reliable REA-specific fingerprint, header, robots rule, obfuscation method or browser-side anti-debugging switch that prevents an entitled observer from learning permitted behaviour.

Treat secret client code as a design contradiction: once the product delivers it, an entitled client can inspect the delivered representation. Keep private implementation and data server-side, then separately assess how much the allowed outputs reveal. Decide which behaviours must remain private and which must be exposed for the product to work. The [protection findings](BOUNDARY_FINDINGS.md) explain the strongest tested restriction and its cost.

Use synthetic accounts and disposable browser sessions to reproduce this work. This publication contains no real customer data or study session values. Loopback addresses in scenarios identify the local fixtures; they are not the operator's LAN or public network address. This is a lab-scope statement, not a general audit of the operator's laptop.

## Combined-defence agent workflow

The [new combination benchmark](COMBINATION_BENCHMARK.md) exposes the same captured-browser observation mechanism to 42 fresh max-effort agents. Each chooses batches of up to 16 quantities, one of two same-tenant sessions, and estimate, alias, approved quote or approved export. REA captures actual UI submissions and linked network bodies; the agent receives their projection. A predictor is hashed at the 96-request allowance before the same thread continues to 192, with no score feedback. Hidden parameters are published only after every predictor is frozen. This lets others inspect exactly which evidence each agent obtained and which numeric rule it submitted. It does not test every tool in upstream REA.

## Cap-aware numerical fitting extension

The [new study](FITTING_BENCHMARK.md) adds a bounded experimental fitting tool to the REA-assisted agent. REA still collects the browser/DOM/network evidence. The agent chooses probes, learns its quota before spending it, fits possible rules to observed numeric intervals and writes a frozen predictor. The optimiser is supplied by this benchmark; it is not an upstream REA capability claim. Source, calls, observation cutoffs, returned candidates and final predictions are public for investigation.

## Exact quotes and private contexts

In [the latest experiment](CONTEXT_BENCHMARK.md), the LLM sends chosen workflow JSON through a real browser textarea and button. REA captures DOM rows and HTTP POST request/response bodies for exact quote creation and related routes. Each captured result is matched to its transaction and checked by digest. A separate bounded numerical helper fits only previously observed prices for the selected customer context. It cannot query the target, read hidden parameters or inspect laptop files. Agents output two numerical predictors, one for the permitted context and one for the withheld context. The latter can be a guess, and its notes preserve that uncertainty.

This exposes a practical failure mode: the main quote route can refuse another context while an export still returns its exact prices. It also tests inference without bypass: when both contexts share the same function, a correct own-context model transfers. REA itself does not need to defeat authentication for either form of reconstruction. The study does not exercise every REA capability or evaluate a complete visual/functional SaaS clone.
