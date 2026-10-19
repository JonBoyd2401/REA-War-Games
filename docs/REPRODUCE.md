# Reproduce the local experiments

## Requirements

Use Node supported by pinned REA 6.7.0: `^22.19.0 || ^24.11.0 || >=26.0.0`. The measured run used Node 24.19.0 and Chrome 155.0.8059.82 on Windows. Install a Chrome-family browser and identify its absolute executable path. Use only the owned fixtures.

```sh
npm install --ignore-scripts --save-exact rea-agents@6.7.0
node --test lab/test/wargame.test.mjs lab-v2/test/session-boundaries.test.mjs reconstruction/test.mjs reconstruction/gated-test.mjs boundary-study/test.mjs agent-benchmark/test.mjs combination-study/test.mjs
node verify-evidence.mjs
node reconstruction/verify.mjs
node reconstruction/verify-gated.mjs
node boundary-study/verify.mjs
node agent-benchmark/verify.mjs
node combination-study/verify.mjs
```

The original laptop did not have npm on PATH, so pnpm 11.25.0 installed the exact package locally with lifecycle scripts disabled. The pinned package metadata and that lockfile are in `provenance`. REA's web/static commands ran successfully; native decompilers and MCP registration were unnecessary. A broad `rea doctor` report may still list missing optional native providers.

## Repeat all 18 baseline capture operations

For the latest actual-agent reconstruction benchmark, use [its dedicated guide](../agent-benchmark/README.md). For the earlier custom pricing learner, use [the reconstruction guide](../reconstruction/README.md). For export/job/approval boundaries, use [the boundary study guide](../boundary-study/README.md). The original capture workflow below remains available.

```powershell
node reproduce.mjs 'C:/Program Files/Google/Chrome/Application/chrome.exe' my-fresh-run
```

The runner starts unchanged lab instances on fresh loopback ports, uses disposable headless Chrome profiles, captures scenarios/source/maps/listeners, exports and statically analyses scripts, then records V8 execution after REA is armed. It closes its owned services and browser processes. Output is under `replications/my-fresh-run`. A new run ID is required; it will not overwrite existing command records.

This runner was validated in the recorded `validation-20261018` run. Its native CDP mouse input differs from the original baseline's Playwright input helper; the difference avoids counting helper scripts as application execution. The claims always identify the exact application script.

## Repeat the isolated changes and browser control probes

Use a clean working copy for generated outputs. Historical evidence is under root `runs/`; fresh supplemental output is under `lab/runs/`.

```powershell
$env:REA_BROWSER_EXECUTABLE='C:/Program Files/Google/Chrome/Application/chrome.exe'
node strengthen-evidence.mjs
```

This records eleven scenarios: two original-mode control probes, three isolated-change variants, two quota scenarios, and four repeat control probes. A loopback proxy serves explicit test-only probe UI or changes only the named asset/response property. Backend fixture files remain unchanged. The probe script is test instrumentation, not normal customer UI or an autonomous adversary. Raw responses and DOM results are retained by real REA.

## Repeat session boundaries

```powershell
$env:REA_BROWSER_EXECUTABLE='C:/Program Files/Google/Chrome/Application/chrome.exe'
node run-session-boundaries.mjs
```

The runner generates fresh synthetic account secrets in memory, passes passwords/cookies through REA secret references and checks that those values were not retained verbatim. It records nine scenarios under `lab-v2/runs/session-boundaries-20261018`. Existing output filenames are exclusive; use a clean copy to repeat. Never substitute real credentials or customer data.

## Produce the white paper again

```sh
python -m pip install reportlab
python build-white-paper.py
```

The builder writes the PDF and editable structured source under `output/`. For publication, render every page and check for clipping, text wrapping and unsupported claims. A text-only integrity check is not a visual layout review.

## Interpreting a result

Inspect the per-request status and retained response; do not judge security from a successful CLI exit or an empty capture. Preserve `limitations`, `completeness` and source/body provenance. Separate application tests from REA captures and scripted probes from independent adversarial reasoning.

For blind reconstruction, follow the separate isolation procedure in `CONTINUATION.md`. Do not hand this whole public repository or paper to a red agent and then call its score blind.

## Rebuild the current reports

After offline verification, regenerate the current scorecard and two PDFs from the retained results:

```sh
node agent-benchmark/write-reports.mjs
python agent-benchmark/build-reports.py
```

The builder uses ReportLab. Render and inspect every resulting PDF page before publishing. The original baseline builder above remains historical.

## Repeat the combined-defence study

Use [the combination guide](../combination-study/README.md) for fresh max-effort agents and 96/192 checkpoints. Offline verification needs no model access. To rebuild the latest two reports after verification, run `node combination-study/write-reports.mjs` then `python combination-study/build-reports.py`. The earlier builders reproduce their historical editions.
