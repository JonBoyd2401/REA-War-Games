# Workflow boundary study

Read [the plain-English findings](../docs/BOUNDARY_FINDINGS.md) and [the REA mechanism guide](../docs/HOW_REA_WORKS.md) first. This is an owned synthetic fixture, with both protected and deliberately weakened conditions. Never expose it as a production service.

## Verify the publication

From the repository root with supported Node installed:

```sh
node --test boundary-study/test.mjs
node boundary-study/verify.mjs
```

The offline verifier does not start a server or need Chrome/REA installed. It checks frozen sources, 12,000 refusals, normal outputs, authority changes, the finite-domain calculation, and six retained REA captures. It matches every browser row to a distinct transaction's method, path, request body, status and response body and verifies captured-body hashes. It checks equality only of explicit application rows after canonicalising random job IDs, never whole-capture equality.

## Repeat with real REA

Install pinned `rea-agents@6.7.0` as described in [REPRODUCE](../docs/REPRODUCE.md). Set `REA_BROWSER_EXECUTABLE` to your Chrome executable. Create the parent `replications` directory if needed, then use a fresh output name:

```sh
node boundary-study/run.mjs replications/my-boundary-run
node boundary-study/verify.mjs replications/my-boundary-run
```

Existing output directories are refused. The runner starts ephemeral loopback HTTP servers, provisions random synthetic sessions, passes them through REA secret references, and closes its servers after use. REA launches and closes fresh headless Chrome sessions. The study takes several minutes. It writes portable command paths; session values and response-header values are not retained. Local HTTP uses a non-Secure cookie for this fixture only. Production login, TLS, CSRF, durable approvals and distributed enforcement are outside this experiment; the separate session lab covers several of those application boundaries locally.

## Files

- `PLAN.md`: prospective design and limits; `server.mjs`: the two private worlds and three control modes.
- `probe.mjs`: transparent scripted browser probes. REA clicks its Run button and records the resulting browser activity; this is not an autonomous agent attack.
- `run.mjs`: exhaustive HTTP checks plus six REA scenarios; `test.mjs`: eight control regressions.
- `verify.mjs`: offline checks; `source-trace.mjs`: installed REA source locations and hashes.
- `../runs/boundary-20261019/`: published measurements. `pre-run-freeze.json` records source hashes before measurement; `files.json` hashes the primary generated result files. The root manifest covers all publication files, including scenarios and command records.
- `identifiability.json` in that run: all 1,000 paired outputs and the assumptions for a conditional bound, not an attacker score.

Both worlds, routes, quantities and weaknesses are deliberately constructed. The 12,000 checks are highly related cases from one fixture, not 12,000 independent trials or a statistical estimate of deployment risk. The fixture's two rules were not drawn from the previous 16-target experiment. No independent blind evaluator or operating-system separation was used.
