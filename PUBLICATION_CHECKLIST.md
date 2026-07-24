# Publication Checklist

This sibling repository was synced from the non-public maintainer release source for
Filterest public-beta review. `filterest-beta` is the owner-approved repository
target, but it is still not a production-ready release until
the remaining gates below are resolved with evidence or an explicitly approved
deferral.

## Current Verdict

`filterest-beta` is approved as the active generation and repository target.
Remote publication still requires the separate manual-final approval below.

The production-ready release gate remains blocked until all P0 and P1 rows
below are either `done` with evidence or `deferred-approved` with the approving
owner named.
Candidate generation, public-slice audit success, or the awaiting-decision
Computer Use policy alone does not make this repository production-ready.
Generated deterministic evidence is summarized in
[`PUBLICATION_EVIDENCE.md`](PUBLICATION_EVIDENCE.md), but human-owned gates
below still require their named owner decisions.

The previous #834 Computer Use release-readiness failure remains controlling
until the checklist evidence materially changes and a fresh Computer Use
release-readiness run passes against this generated repository.

This checklist governs the active `filterest-beta` channel only. The alpha
channel is retired from the active workflow, and its history is not copied into
beta. A future stable `filterest` successor must be generated from a clean
non-public maintainer release-source commit into its own GitHub repository with
a fresh initial artifact commit. Beta history is not copied to stable, and beta
becomes read-only when stable is activated. `../filterest` is not an approved
target before the stable channel is explicitly activated.

Each candidate must preserve the artifact traceability contract in
`PUBLICATION_EVIDENCE.md` and compatibility metadata: accepted maintainer
release-source commit, application version, database version, generation time,
and generated artifact commit.

## Status Legend

- `done`: completed, with evidence linked in this file or in the release ticket.
- `blocked-human`: waiting for a named human/project owner decision.
- `blocked-evidence`: waiting for a repeatable scan, build, review, or artifact.
- `deferred-approved`: intentionally deferred with the approving owner named.
- `manual-final`: final human-only publication step after local evidence review.

## Required Before Production-Ready Public Release

| Priority | Gate | Status | Owner | Evidence or decision required |
| --- | --- | --- | --- | --- |
| P0 | Final source license chosen | blocked-human | Human release owner or counsel | The 2026-07-05 GPLv2 / `GPL-2.0-only` decision was explicitly scoped to `filterest-alpha`. Confirm or replace the license scope for the fresh `filterest-beta` repository before publication. |
| P0 | Final `LICENSE` file present | done | Human release owner + release agent | `LICENSE` contains the GNU General Public License version 2 text previously selected for alpha, and package metadata declares `GPL-2.0-only`; file presence is not confirmation that the prior legal scope automatically applies to beta. |
| P0 | Security disclosure path | blocked-human | Human release owner | Regenerate/review `SECURITY.md` with the owner-provided private disclosure contact. |
| P0 | Contribution terms | blocked-human | Human/project owner | Confirm the approved owner-led/no-routine-public-PRs `CONTRIBUTING.md` posture, including public-issue scope, private vulnerability reporting, and the rule that unsolicited public pull requests are not the routine operating model. |
| P0 | Notice and trademark wording | blocked-human | Human/project owner or counsel | Approve `NOTICE` and `TRADEMARKS.md`, including Filterest ownership and allowed use wording. |
| P0 | Third-party notices | blocked-human | Release agent + human/project owner | `THIRD_PARTY_NOTICES.md` is generated from the exported Go modules, npm packages, and bundled asset tree for each candidate; review and approve every `review-required` row before publication. |
| P0 | First-ever admin credential path | blocked-evidence | Release agent + Human/project owner | Prove setup creates `admin_<site_slug>` / default `admin_filterest`, writes the one-time password only to setup stdout plus `data/bootstrap/initial_admin_credentials.txt` with `0600` permissions, requires `FILTEREST_INITIAL_ADMIN_EMAIL` unless an explicit local dev `LOGIN_OTP_CODE` is configured, and keeps generated-public docs honest that the full starter panel is follow-up onboarding scope. |
| P0 | Public bootstrap content review | blocked-evidence | Release agent | Candidate evidence: [`server_tools/public_bootstrap/REVIEW.md`](server_tools/public_bootstrap/REVIEW.md). Final publication still needs owner review that the bootstrap docs honestly describe the current package and that the full starter panel is follow-up onboarding scope. |
| P0 | Private source boundary | blocked-evidence | Release agent | Candidate evidence is summarized in [`PUBLICATION_EVIDENCE.md`](PUBLICATION_EVIDENCE.md). Final publication still needs a clean `--require-clean` candidate run recorded in the release ticket. |
| P0 | Secret/private-material scan | blocked-evidence | Release agent | Candidate tracked-file scan is summarized in [`PUBLICATION_EVIDENCE.md`](PUBLICATION_EVIDENCE.md). Final publication still needs a clean `--require-clean` run with private and generated commit SHAs recorded. |
| P0 | Fresh-clone public build/test | blocked-evidence | Release agent | Test a clone or copy of this generated repository outside the non-public maintainer tree and record exact build/test commands and results. |
| P0 | Browser review uses Filterest runtime | blocked-evidence | Release agent + Computer Use | Confirm preview/browser review uses Filterest's own backend/database and does not proxy to a running non-public maintainer process. |
| P0 | Fresh Computer Use release-readiness pass | blocked-evidence | Release agent | Rerun `./human_qa awaiting-test 834 --mode computer-use --run --prompt-profile release-readiness` from the maintainer release source after material remediation; attach the PASS/FAIL artifact. |
| P1 | Draft/private-maintainer wording cleanup | blocked-evidence | Release agent | Replace every draft-status or private-maintainer statement that should not appear in a launch repository; attach grep/review evidence. |
| P1 | Recovery and rollback wording | blocked-evidence | Release agent | Confirm public docs do not claim supported row, table, or full-database rollback. Whole-table or whole-database recovery is manual from backups, and single-row rollback is unsupported until row history exists. |
| P1 | Public screenshots/demo data | blocked-evidence | Release agent | Candidate evidence: [`server_tools/public_bootstrap/DEMO_ASSET_REVIEW.md`](server_tools/public_bootstrap/DEMO_ASSET_REVIEW.md). Semantic screenshot/docs wording review remains part of final release review. |
| P1 | Public CI and local-preview posture | blocked-evidence | Release agent | Candidate build/audit evidence is summarized in [`PUBLICATION_EVIDENCE.md`](PUBLICATION_EVIDENCE.md). Final publication still needs clean-run evidence and owner review. |
| P2 | Local release evidence review | manual-final | Human release owner | Review this checklist, ticket evidence, generated commit, and approved remote state before authorizing a push. |
| P2 | GitHub repository target | done | Human release owner | Owner selected the fresh `kanilmari/filterest-beta` repository and retired alpha from the active model on 2026-07-24. Only the approved `origin` and `main` upstream are allowed. |
| P2 | Remote push | manual-final | Human release owner | Push a reviewed clean commit only to `filterest-beta` after a separate explicit publication decision. A future stable channel requires its own new repository and approval. |

## Evidence Log

Add one dated line per publication-candidate attempt:

| Date | Release source commit | Generated Filterest commit | Evidence summary |
| --- | --- | --- | --- |
| generated | See `PUBLICATION_EVIDENCE.md` | This repository commit | Automated candidate evidence is included for review; it is not publication approval and does not replace human-owned gates. |

## Local Generation Command

```bash
./filterest_release status
./filterest_release generate
./filterest_release verify
```

Run the command from the non-public maintainer release source. During iterative local
testing, use repo-local ignored staging targets rather than overwriting the
active publication checkout from dirty source state. The only active sibling
sync target is `../filterest-beta`. Publication candidates must be generated
from a clean release-source checkout without `--allow-dirty`.

The wrapper fixes the target to the active `filterest-beta` channel. Publishing
remains a separate human-approved `./filterest_release publish --yes` action.
