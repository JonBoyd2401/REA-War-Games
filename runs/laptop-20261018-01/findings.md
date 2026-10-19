# Actual REA results on the synthetic SaaS lab

REA 6.7.0 ran on this Windows laptop against both owned local targets. Eighteen measured REA CLI calls completed. Nine application tests passed. The strongest demonstrated controls were server authority and tenant checks for preventing unauthorised outcomes, together with server-only pricing and minimal response contracts for reducing direct disclosure. None stopped observation of the authorised UI and API.

## Observed results

| Measurement | Unsafe | Hardened | Evidence |
|---|---|---|---|
| Pricing source | Formula, base price and 3 bands captured | No pricing formula in captured 537-byte UI script | `*-inspect.json`, `normalized_result.scripts.items[0].source.artifact.text` |
| Source maps | 368-byte map; 257-byte embedded source | No declared map; direct route 404 | `*-bundle-maps.json`, `normalized_result.observations.source_maps`; `white_only/api-controls.json` |
| Quote response at quantity 50 | 9 fields, 370 bytes, total GBP 1104 | 3 fields, 80 bytes, same total | `*-scenario.json`, `normalized_result.events.items[14].body` (base64) |
| Direct listener | Click callback source associated | Click callback source associated | `*-listeners.json`, `normalized_result.listeners[0]` |
| V8 application execution | calculateInBrowser count 1; fetch initiator | UI callback count 1; fetch initiator | `*-v8.json`, coverage.scripts filtered to app.js; requests[0] |
| Price tampering | HTTP 201; GBP 0.01 accepted | HTTP 422 unexpected field | `white_only/api-controls.json`, modes.*.controls[7] |
| Tenant A quote read by B | HTTP 200 | HTTP 404 | same, controls[1] |
| Tenant A event read by B | HTTP 200 | HTTP 404 | same, controls[3] |
| Status payload | discount.evaluated with tenantId, ruleId, threshold | quote.ready with quoteId, status | same, controls[2] |
| Replay request | HTTP 200; cursor ignored | HTTP 409 unsupported | same, controls[4] |
| Debug rules route | HTTP 200 with rules | HTTP 404 | same, controls[5] |
| Four sample quotes | All 201 | All 201; fifth duplicate attempt 429 | same, samples and hardened.fifth |
| Independent blind reconstruction | Not performed | Not performed | No valid score; session contamination |

All REA files above are under `rea-evidence`. Exact commands are in `commands.jsonl`; per-assertion status and paths are in `observations.csv`. Files in `white_only` are supplemental direct HTTP measurements, not REA outputs.

## Practical ranking

1. **Server-authoritative outcomes and object-level authorisation:** highest priority for data and transaction integrity. Compute totals on the server, reject extra client-controlled price/tenant fields, and authorise every object and stream lookup.
2. **Keep proprietary decisions out of every client-delivered artifact:** strongest tested reduction in direct algorithm disclosure. Browser-visible UI and endpoints remain inspectable.
3. **Minimise API and event responses, and remove public debugging surfaces:** removes explanatory rule metadata that otherwise defeats server-only implementation secrecy.
4. **Keep production source maps private and scan release artifacts:** removes a convenient original-source channel. Here full pricing was readable without fetching the map, so map removal alone would not solve the exposure.
5. **Bound sampling and monitor authority violations:** fifth quote rejected, and denial events recorded. Four successful queries still exposed three effective unit prices. Quotas are an economic control, not an inference impossibility result.

These are engineering priorities from one paired fixture, not a universal empirical ranking. Controls changed together; no factorial ablation or production-scale efficacy study was performed.

## What did not become hidden

REA still read the hardened client source, found its Quote listener and /api/quotes endpoint, observed its callback execution and request initiator, and retained legitimate price outputs. CSP and other browser headers were present on hardened responses, but did not stop these observations. This does not isolate CSP's individual effect.

The four fixed samples returned totals 23.52, 588, 1656 and 3168 for quantities 1,25,75,150 in both modes. Dividing by quantity reveals unit prices 23.52,23.52,22.08,21.12. Exact thresholds remain underdetermined by these four pairs alone. For example, step boundaries 26/76 and 50/100 can fit those samples under a piecewise-constant unit-price assumption. No independent agent accuracy is inferred.

## Material caveats

Both REA browser scenarios marked overall events incomplete even though the specific script and quote response bodies were retained. Preserve the raw completeness and limitations fields. A zero CLI exit is not a security finding. Source map mappings are empty; embedded sourcesContent is available, not a fully recovered original application. V8 captures include action-tool code; summaries count only the application URL and do not prove complete UI causality.

The fixture uses shared synthetic bearer strings, finite SSE, an in-memory quota and a simple three-band function. No distributed quota, production identity, entitlement revocation, long-lived stream, load, accessibility, WAF, anti-debugging, obfuscation, decoy, canary or model-diversity study was performed. No claim of REA-proof SaaS, complete cloning resistance or blind holdout success is justified.
