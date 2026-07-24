# Filterest Public Bootstrap Seed

This directory is generated for the Filterest public repository candidate.

It contains a curated schema skeleton plus small synthetic seed rows so a
local Filterest checkout can bootstrap its own database instead of borrowing a
running non-public release-source backend or non-public bootstrap archive. The
seed rows are placeholders for setup and smoke testing, not production data. The
generated seed is derived from testing fixtures and normalized for public
Filterest branding and runtime boundaries.

The three reviewed walkthrough images are generated into the same row-scoped
storage shape as ordinary uploaded images, for example
`storage/9/1/{300,1000,original}/9_1_1.png`. Other mock rows intentionally stay
image-free. The generator and asset audit reject the former repeated theme SVG
placeholders so missing row-specific media remains visible during review.

The sibling checkout and its local database are review candidates. If
you need to change the public bootstrap schema, seed rows, local env defaults,
or preview behavior, make that change in the maintainer release-source generator and
regenerate this checkout. Do not treat ad-hoc edits inside `filterest/` or its
local database as durable source changes.

## Credential Boundary

The public bootstrap seed creates fixture user rows for smoke testing and UI
metadata, but it does not ship a reusable admin password. During
`./server_tools/setup_local_dev_environment.sh`, the generated Filterest setup
flow creates a one-time initial admin when no login-ready admin already exists.
The username format is `admin_<site_slug>`; the default slug is `filterest`, so
the default username is `admin_filterest`.

The generated password is revealed once through setup stdout and the local
gitignored handoff file configured by `FILTEREST_INITIAL_ADMIN_HANDOFF_FILE`,
defaulting to `data/bootstrap/initial_admin_credentials.txt`. The file is
written with `0600` permissions. Delete it after the first login and password
rotation.

For a login-ready production-like setup, set `FILTEREST_INITIAL_ADMIN_EMAIL`
before running setup so login OTP delivery can target the real admin mailbox.
The setup helper requires that email unless this is an explicit local dev
preview with `LOGIN_OTP_CODE` configured. Local dev OTP previews are not a
production authentication model.

Before a public GitHub release, review the schema boundary and seed contents
against the publication checklist.
