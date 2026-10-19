# Provenance

The original protocol records the pre-run research plan; its pending status describes that historical stage. Current results are in the root README, success criteria and expanded white paper.

`original-operator/` preserves the scripts used for the first laptop run. Local paths are redacted; those archived scripts are not the portable entry points. Use the root reproduction scripts for new runs.

The npm registry metadata records the exact executed REA 6.7.0 distribution and its integrity. The pnpm lockfile records the local installation. No equivalence to the older source commit in the supplied protocol is asserted. REA is installed separately and its code is not redistributed in the packs.

`redaction-map.json` maps private source files to sharing copies and records both SHA-256 values. The source paths are relative to the original workspace. Browser profiles and process IDs are excluded. Root `SHA256SUMS.json` covers distributed files except the manifest itself and distribution archives; `dist/SHA256SUMS.json` covers the archives.

Final publication QA reran all 23 application tests successfully on the assembled files. The evidence verifier independently checks retained DOM results against network responses and their body digests. PDF pages were rendered and visually reviewed. These checks validate this research package, not arbitrary production deployments.
