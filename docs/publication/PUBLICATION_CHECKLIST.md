# Publication Checklist

This sibling repository was synced from the non-public maintainer release
source for Filterest public-beta review. `filterest-beta` is the owner-approved
repository target. The local P0/P1 evidence chain is complete; remote
publication still requires the separate manual-final owner action below.

## Current Verdict

`filterest-beta` is approved as the active generation and repository target.
All P0 and P1 rows below are `done` with owner decisions or repeatable evidence.
The local beta release-readiness gate therefore passes for owner review.
Generated deterministic evidence is summarized in
[`PUBLICATION_EVIDENCE.md`](PUBLICATION_EVIDENCE.md), and current runtime and
Computer Use artifacts are attached to non-public maintainer ticket #834.

The earlier #834 Computer Use failure is historical. The human release owner
has separately accepted the current generated Filterest-owned runtime in the
browser. The latest stored automated Computer Use artifact must not be
described as a fresh PASS for a newer commit; create a new artifact only when
the publication policy requires exact-commit automated evidence. This does not
perform or approve the remote push: the local evidence review and remote push
remain `manual-final`.

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
| P0 | Final source license chosen | done | Human release owner | Owner confirmed on 2026-07-24 that `filterest-beta` uses the same GPLv2 / `GPL-2.0-only` license as `filterest-alpha`; the generated-only public license boundary remains unchanged. |
| P0 | Final `LICENSE` file present | done | Human release owner + release agent | `LICENSE` contains the GNU General Public License version 2 text and package metadata declares `GPL-2.0-only`; verify both after every candidate regeneration. |
| P0 | Security disclosure path | done | Human release owner + release agent | Owner approved `support@filterest.fi` as the private vulnerability channel and prohibited public vulnerability reports; verify generated `SECURITY.md` after regeneration. |
| P0 | Contribution terms | done | Human/project owner + release agent | Owner approved the owner-led posture: unsolicited public pull requests are not the routine operating model; normal feedback scope and private vulnerability reporting remain available. Verify generated `CONTRIBUTING.md` and README after regeneration. |
| P0 | Notice and trademark wording | done | Human/project owner | Owner directed on 2026-08-03 that the accepted Filterest Oy ownership, distinct-name, and allowed-use wording be consolidated in `NOTICE`; reopen after material wording changes. |
| P0 | Third-party notices | done | Release agent + human/project owner | Owner accepted the current `THIRD_PARTY_NOTICES.md`; the generated `THIRD_PARTY_NOTICE_REVIEW.md` is authoritative for current Go, npm, and asset totals plus review-required rows and findings. Reopen if the notice bytes or inventory changes. |
| P0 | First-ever admin credential path | done | Release agent + Human/project owner | Fresh installs expose the one-time username, email address, and password form only while the server-owned `first_run` setting is true and no login-ready admin exists. Account data, hashed password, admin membership, and flag closure share one database transaction and fail closed; the full starter panel is follow-up onboarding scope. |
| P0 | Public bootstrap content review | done | Release agent + Human/project owner | [`server_tools/public_bootstrap/REVIEW.md`](../../server_tools/public_bootstrap/REVIEW.md) passes for 37 schema tables, 22 seed tables, and 780 fixture rows; owner accepted the current bootstrap with the full starter panel as follow-up onboarding. |
| P0 | Private source boundary | done | Release agent | The clean candidate and tracked-tree audit pass; [`PUBLICATION_EVIDENCE.md`](PUBLICATION_EVIDENCE.md) records the exact current release-source commit. |
| P0 | Secret/private-material scan | done | Release agent | Current tracked-file and candidate scans pass with no private app/tool rows, secrets, or non-public release-source runtime files in the generated repository. |
| P0 | Fresh-clone public build/test | done | Release agent | Current clean generation and verification pass Go builds, route manifest checks, `npm ci`, frontend build, public audits, and the candidate contract; exact source/generated commits are in `PUBLICATION_EVIDENCE.md` and ticket #834. |
| P0 | Browser review uses Filterest runtime | done | Release agent + Computer Use | The disposable runtime on port 8100 passes 36 structured checks against its own `filterest_local_preview` database, with private/dev table count 0 and no HTTP 5xx, failed requests, page errors, or console errors. |
| P0 | Current browser release-readiness acceptance | done | Human release owner | The human release owner accepted the current generated Filterest-owned runtime in the browser. Any automated Computer Use report remains scoped to its recorded source/generated commits and must not be carried forward as fresh evidence for a newer candidate. |
| P1 | Draft/private-maintainer wording cleanup | done | Release agent | The current 9-file public docs wording audit passes with no draft/private-maintainer launch blockers. |
| P1 | Recovery and rollback wording | done | Release agent | Public docs do not claim supported row, table, or full-database rollback. Whole-table or whole-database recovery is manual from backups, and single-row rollback is unsupported until row history exists. |
| P1 | Public screenshots/demo data | done | Release agent | [`server_tools/public_bootstrap/DEMO_ASSET_REVIEW.md`](../../server_tools/public_bootstrap/DEMO_ASSET_REVIEW.md) passes for 5 auth-tour JPEGs and 9 fixture storage assets; the current runtime also renders reviewed fixture images. |
| P1 | Public CI and local-preview posture | done | Release agent | Clean candidate generation/verification and the Filterest-owned local preview pass; evidence is summarized in `PUBLICATION_EVIDENCE.md` and ticket #834. |
| P2 | Local release evidence review | manual-final | Human release owner | Review this checklist, ticket evidence, generated commit, and approved remote state before authorizing a push. |
| P2 | GitHub repository target | done | Human release owner | Owner selected the fresh `kanilmari/filterest-beta` repository and retired alpha from the active model on 2026-07-24. Only the approved `origin` and `main` upstream are allowed. |
| P2 | Remote push | manual-final | Human release owner | Push a reviewed clean commit only to `filterest-beta` after a separate explicit publication decision. The approved publish command also pushes the matching `v<VERSION_APP>` tag, which builds checksum-verified Linux admin binaries. A future stable channel requires its own new repository and approval. |

## Evidence Log

Add one dated line per publication-candidate attempt:

| Date | Release source commit | Generated Filterest commit | Evidence summary |
| --- | --- | --- | --- |
| 2026-07-25 | See `PUBLICATION_EVIDENCE.md` | This repository commit | Clean generation/verify, owner P0 decisions, and structured runtime proof are recorded in #834. Browser and Computer Use evidence remain scoped to the commits recorded with each observation. No remote push was performed. |

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
