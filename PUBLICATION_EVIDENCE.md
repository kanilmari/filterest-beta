# Filterest Publication Evidence

This file is generated from the Filterest public-slice candidate flow.
It is evidence for review, not approval to publish.

- Generated at: `2026-07-24T20:15:19Z`
- Release source commit used by the generator: `c688a07b6f8ba10b487066f5d5526986f4fad25a`
- Generated Filterest commit: this repository commit; run `git log -1 --oneline`
- Filterest app version: `8.27.92`
- Database version: `8.0.55`

## Automated Evidence Included In This Commit

| Gate | Evidence |
| --- | --- |
| Public bootstrap content review | `server_tools/public_bootstrap/REVIEW.md` |
| Public demo/media asset review | `server_tools/public_bootstrap/DEMO_ASSET_REVIEW.md` |
| Launch-facing public docs wording review | `PUBLICATION_DOCS_REVIEW.md` |
| Publication governance docs review | `PUBLICATION_GOVERNANCE_REVIEW.md` |
| Public source license | `LICENSE` and package metadata declare GPLv2 / `GPL-2.0-only`. |
| Third-party notice inventory | `THIRD_PARTY_NOTICES.md` |
| Third-party notice inventory review | `THIRD_PARTY_NOTICE_REVIEW.md` |
| Public app/DB compatibility | `server_tools/versioning/app_db_compatibility.jsonl` and `server_tools/versioning/schema_snapshots/db-8.0.55.sql` |
| Private source boundary | Candidate contract requires private app/tool paths to be absent before this commit is created. |
| Secret/private-material scan | Candidate contract runs the tracked-file public-slice audit before this commit is accepted. |
| Public build posture | Candidate generation runs Go builds, route-manifest check, npm install, and npm build before this commit is accepted. |

## Still Not Publication Approval

The following gates are intentionally not resolved by this generated evidence:

- production-readiness approval beyond this public beta release;
- final owner/security review of generated `SECURITY.md` wording;
- approved `CONTRIBUTING.md`, `NOTICE`, and `TRADEMARKS.md`;
- human/project approval of third-party notices and public bootstrap strategy;
- semantic public docs/screenshot wording review beyond the deterministic media audit;
- fresh Computer Use release-readiness pass after material blockers are remediated;
- final manual GitHub repository creation and remote push.
