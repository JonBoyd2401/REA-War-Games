---
name: Independent replication or challenge
about: Reproduce a result, report a counterexample, or propose a measured improvement to REA War Games
title: "[Replication] "
---

## Type of finding

- [ ] I reproduced a published result
- [ ] I could not reproduce a published result
- [ ] I found a counterexample or failed mitigation
- [ ] I measured an improvement, including its trade-offs
- [ ] I found an issue with the protocol, data, or interpretation

## Study, claim and revision

- Study / documentation link:
- Claim or acceptance criterion tested:
- Repository commit SHA:
- Independent run or offline verification? (Specify which; passing the verifier alone is **not** independent replication.)

## Environment and methods

- OS, Node.js, browser, pinned REA and agent/runtime versions:
- Commands executed and any deviations from the published guide:
- Target: owned synthetic localhost fixture (or another explicitly authorised target):
- Baseline, defended and any deliberately weakened control:
- Fresh target generation / held-out separation / predictor freeze, if applicable:
- Request, time, model, tool and token budgets; number of attempts:

## Results

Report **numerators and denominators** and, where relevant, compare like-for-like baseline and defended conditions.

| Measure | Baseline | Defended | Notes / denominator |
|---|---|---|---|
| Unauthorized requests denied / allowed | | | |
| Hidden-rule exact match on withheld inputs | | | |
| Hidden-rule within-1% / within-5% accuracy | | | |
| Supported-output imitation accuracy | | | |
| Legitimate customer workflow success | | | |
| Requests, cost, latency or other utility impact | | | |

Mark non-applicable measures N/A. Distinguish REA browser captures, scripted HTTP tests, offline verifications and independent agents. Describe unsuccessful attempts and any incomplete capture coverage; do not treat command success as a security result.

## Reproduction evidence

- Sanitised logs, REA captures or evidence paths:
- Frozen code/configuration hashes and predictor artefacts, if applicable:
- Commands needed for another person to validate your conclusion:
- Unexpected outcomes, uncertainty, possible confounders and known limitations:

## Safe publication checklist

- [ ] Tests were performed only on owned localhost fixtures or explicitly authorised targets.
- [ ] No real credentials, customer data, personal paths, account events, private reasoning or sensitive logs are included.
- [ ] Normal authorised workflows were checked alongside attack outcomes.
- [ ] Failures, negative controls, incomplete captures and adverse usability effects are disclosed.

**We welcome failed reproductions and evidence against our hypotheses.** Please be precise about what your result does—and does not—establish.
