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
metadata, but it does not ship a reusable admin password. On first browser
access, Filterest opens a one-time form where the installation owner chooses
the administrator username, email address, and password. The email address is
stored as the account's verification and notification address.

The server-owned `first_run` setting and absence of a login-ready admin must
both be true before the form is available. The account, hashed password,
administrator membership, and transition of `first_run` to false are committed
in one database transaction. Existing installations and completed setups fail
closed and redirect to normal login.

The generated-credential helper remains available only to the isolated,
disposable automated preview when
`FILTEREST_AUTOMATED_PREVIEW_INITIAL_ADMIN=1` is set. It is not the normal
installation flow and does not define production authentication behavior.

Before a public GitHub release, review the schema boundary and seed contents
against the publication checklist.
