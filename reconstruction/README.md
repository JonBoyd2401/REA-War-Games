# Reconstructing a pricing feature from permitted observations

Start with [the findings](../docs/RECONSTRUCTION_FINDINGS.md). The target is a synthetic pricing feature, not a full SaaS product. The learner knows that prices use three non-increasing integer unit-price bands. It does not receive target thresholds or rates.

## What ran

- Initial design: 16 randomly generated targets × five policies × two methods × three request budgets = **480 localhost HTTP model runs**.
- Real REA subset: two targets × five policies = **10 browser captures**, with the same adaptive learner and budget 24.
- Exploratory follow-up: **16 HTTP models and two REA browser captures** for an approved-quote-only workflow, using the same targets and holdouts. It was designed after the initial results and is labelled accordingly.
- In total, **508 frozen models were scored**, including the 12 REA-derived models. The 496 HTTP runs are not relabelled as REA executions.

The original 128 holdouts per target were selected after all 490 initial models were frozen, excluding every quantity successfully queried by any initial learner for that target. They are shared across conditions. This avoids train/test overlap, but the exclusion changes the sampled input distribution, especially near boundaries targeted by the learner. The additional full-domain diagnostic scores all 1,000 inputs, including queried inputs, and is labelled post hoc.

The follow-up reuses those holdouts; they were no longer newly hidden when the follow-up was designed. Code-level data separation is not OS isolation. No claim of independent blind agent validation is made.

## Reproduce and verify

Install pinned REA from the root instructions. Use Node supported by REA 6.7.0 and a Chrome-family executable.

```powershell
node --test reconstruction/test.mjs reconstruction/gated-test.mjs
node reconstruction/verify.mjs
node reconstruction/verify-gated.mjs
$env:REA_BROWSER_EXECUTABLE='C:/Program Files/Google/Chrome/Application/chrome.exe'
node reconstruction/run-study.mjs my-new-reconstruction-run
node reconstruction/verify.mjs my-new-reconstruction-run
node reconstruction/summarize.mjs my-new-reconstruction-run
```

The main runner generates a new random target population and new holdouts. Repeat aggregate numbers will vary; exact reproduction of the published scores uses the retained frozen models, targets and holdouts with the verifier. The runner creates a new output directory exclusively and does not overwrite evidence. It closes each owned server, and REA closes its launched browser. Study sessions are generated in memory and passed to REA through secret references.

`run-gated-followup.mjs` deliberately reads the published initial run and writes a fresh `runs/reconstruction-gated-20261019` directory. To repeat that follow-up, use a separate working copy without the existing follow-up output. The source documents that this is a paired exploratory comparison. `domain-diagnostic.mjs` recomputes the post-hoc all-input diagnostic.

## Evidence

- `runs/reconstruction-20261019/pre-run-freeze.json`: plan and implementation hashes recorded before target generation and training.
- `models/` and `model-freezes.json`: observations, frozen predictors, timestamps and hashes.
- `white-only/`: target parameters and held-out quantities, published after scoring for review. These are synthetic research data, never customer data.
- `scores.json`: every prediction and error; `aggregate.json`: per-target distributions and summary statistics.
- `rea-evidence/`: actual REA captures; `commands.jsonl`: execution records; `rea-coverage.json`: retained incomplete-coverage flags.
- `utility.json`: 160 direct checks of the two normal quote quantities across the initial policies.
- `full-domain-diagnostic.json`: additional exhaustive fidelity check, clearly including seen inputs.
- `runs/reconstruction-gated-20261019/`: follow-up freeze, models, scores, two captures and commands.

The verifier checks model/source hashes, re-scores predictions, checks held-out separation, and links each REA result to a distinct retained network response. It confirms that corresponding browser and direct HTTP runs produce the same observations and predictor.

## Limits of the controls

The tenant budget is a single-process, fixed-day budget of distinct quantities. Two principals and route aliases share it; repeats do not grant new information. Time-window renewal grants more queries. Distributed races, multiple tenant accounts, collusion, account provisioning and sustained extraction are not tested.

The approved quote IDs are synthetic server-approved requests. Production approval, commerce, entitlement and anti-abuse processes are absent. If a client can create unlimited approved requests, that process can restore the pricing oracle. This restriction also removes broad self-service estimation. The two supported quote results themselves remain observable and can be memorised exactly.
