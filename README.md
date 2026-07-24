# Filterest

Filterest is a multilingual application platform built around a robust,
unified PostgreSQL data-management core. Define datasets, fields, relations,
permissions, and media once, then use the same data through ready-made browser
applications or purpose-built custom applications.

## From Data To Applications

Every dataset can become a usable application without a separate frontend:

- **Table view** is for scanning, comparing, selecting, and editing records.
- **Card view** presents the same records as visual, media-friendly items.
- **Article view** opens one record as a full page with fields, relations,
  images, and attachments.

These views share the same search, filters, permissions, relations, and
multilingual data. Changing the presentation does not create another copy of
the data or another administration system.

When a workflow needs more than the built-in views, build a custom application
under `apps/`. Custom applications can use Filterest's authentication,
permissions, routing, dataset APIs, translations, and file handling while
providing their own backend logic and frontend experience. They are compiled
modules rather than runtime plug-ins, so each app must register its hooks and
routes through the app registry and be included in the build.

```text
apps/
└── my_app/
    ├── backend/
    └── frontend/
```

The public beta does not bundle customer-specific applications, but the
platform boundary for building them is part of the repository.

## Core Capabilities

- PostgreSQL-backed datasets, fields, foreign-key relations, and metadata.
- Browser-based create, read, update, delete, search, filter, and sort flows.
- Table, card, article, and other data-driven views selected per dataset.
- Related records, image galleries, file attachments, and inline PDF previews.
- Multilingual interface text and multilingual field values.
- Group, capability, and dataset permissions for public and authenticated use.
- Hierarchical projects and folders for organizing datasets.
- Optional semantic search and AI integrations through separately configured
  provider credentials.

## Current Status

This repository contains the `filterest-beta` application-platform beta.
It is suitable for evaluation and development, but its compatibility and
upgrade policy is not yet stable. Review changes carefully before using a
beta version with important data.

`filterest-beta` is the only active publication channel. It starts with a fresh
artifact history rather than copying the retired alpha history. A future stable
`filterest` release will use its own repository and fresh artifact history; this
beta repository will become read-only when stable is explicitly activated.

## Requirements

- Go 1.26.5 or newer.
- Node.js 24 or newer.
- PostgreSQL 16 with pgvector.
- OpenSSL for generating a local development certificate.

The automated local setup script currently targets Ubuntu and Debian systems
and requires access to a PostgreSQL superuser. Other environments can use the
same application and PostgreSQL stack, but may need manual dependency and
database setup.

## Quick Start

```bash
git clone https://github.com/kanilmari/filterest-beta.git
cd filterest-beta

# Create runtime directories and local environment files.
./server_tools/scaffold.sh setup

# Fill in the required database, session, URL, and initial-admin values.
$EDITOR .env dev_env.txt

# Create the local database from the public synthetic seed and install dependencies.
./server_tools/setup_local_dev_environment.sh

# Build and start Filterest.
./ctl
```

Open `https://localhost:8100`. The local certificate is self-signed, so the
browser may ask you to accept it once.

On first setup, Filterest creates a login-ready initial admin and shows the
one-time credentials in the terminal. By default, it also writes them to the
gitignored `data/bootstrap/initial_admin_credentials.txt` file with restricted
permissions. Delete that file after signing in and changing the password.

The bundled public seed contains synthetic multilingual example datasets and
media only. See `server_tools/public_bootstrap/README.md` for the seed and
initial-admin boundaries.

## Development

```bash
./ctl                 # build and run the local application
npm test              # run frontend unit tests
go test ./...         # run Go tests
npm run build         # build frontend assets
npm run qa            # run the broader project QA suite
```

Keep user-facing features multilingual. Use the existing translation and
language-key workflows instead of hardcoding one-language UI text.

The repository-specific setup and governance guides live at the repository
root. A deliberately limited set of technical documents shared byte-for-byte
with the non-public development source lives under `docs/`; see
`docs/README.md` for the naming and support boundary.

## Project And Contribution Model

Filterest is owner-led open source. Public issues can be used for reproducible
bugs, setup problems, documentation corrections, and focused feedback. Public
pull requests are not the routine operating model unless a maintainer requests
one.

This public repository is generated from a maintainer release source. Accepted
durable changes are incorporated there and exported into later public releases.
Private operational details, customer-specific apps, credentials, deployment
history, DB-native development records, and non-public data remain outside this
repository.

See `CONTRIBUTING.md` for the contribution boundary and `SECURITY.md` for the
private vulnerability-reporting channel.

## License

This beta candidate currently carries the GNU General Public License version 2
text (`GPL-2.0-only`) previously selected for the retired alpha repository.
Publication remains blocked until the owner or legal reviewer explicitly
confirms or replaces that license scope for `filterest-beta`. See `LICENSE` and
`PUBLICATION_CHECKLIST.md`. Any source license does not grant trademark rights
in the `FILTEREST` name or logo.
