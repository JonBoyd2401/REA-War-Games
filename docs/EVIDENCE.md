# Evidence handling and verification

`runs/` contains path-redacted sharing copies of the recorded evidence. Local account and workspace paths are replaced; synthetic tenant names, fixture identifiers and localhost addresses are retained because they explain the experiments. Passwords in the session experiment use REA secret references. Header values were not requested. Browser profiles, session stores, package caches and unrelated laptop data are excluded.

`provenance/redaction-map.json` lists the source relative path, original SHA-256 and distributed SHA-256 for each transformed file. `SHA256SUMS.json` records distributed files. A transformed copy is not the original raw artifact. Internal REA capture/graph digests are preserved as provenance and can refer to pre-redaction bytes; do not represent path-redacted envelopes as untouched authenticated imports. Generate a new run for strict end-to-end REA import/export provenance verification.

The verifier checks the distributed file hashes and retained body bytes where REA supplies a content digest. It also reads the actual scenario DOM and network records to check the claimed outcomes; convenience summaries alone are not accepted as proof.

Original baseline assertions: `runs/laptop-20261018-01/observations.csv`. Complete measured CLI calls: each run's `commands.jsonl`. Main browser evidence: `rea-evidence/*.json`. Supplemental direct HTTP records and regression outputs are labelled separately.

The study preserves failures and limits: sandbox-denied initial tests, REA overall incomplete scenario coverage, unknown UI causality, the v1 public-token weakness, no blind reconstruction, and deployment limitations of the v2 local fixture.

For the 19 October reconstruction extension, `provenance/reconstruction-redactions.json` records the two command-log path redactions. The new verifiers check frozen models, original source hashes, every scored prediction and matching browser network responses. The initial plan was frozen before execution; the approved-quote-only follow-up was chosen after seeing the initial results and reuses the original holdouts. Neither is claimed to be an independent blind AI red team. See `docs/RECONSTRUCTION_FINDINGS.md` for the measured scope and product trade-offs.
