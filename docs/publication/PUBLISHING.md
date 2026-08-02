# Publishing Filterest

This `filterest-beta` sibling repository is intentionally local-first. The
generator syncs it from the maintainer release source, preserves this channel's
own `.git` history, and does not create a GitHub remote or push.

This repository is a generated artifact. Prefer changing the maintainer release
source or the export generator, then regenerating this checkout. Direct edits in
the generated repository should be treated as temporary unless they are ported
back before the next export.

## Local Review

```bash
git status --short
git log --oneline --max-count=3
cat VERSION_APP
cat VERSION_DB
```

Review `docs/publication/PUBLICATION_CHECKLIST.md` before publishing. Every public-beta update
must come from a clean maintainer release-source commit and a reviewed
sibling-repo commit.

From the maintainer release source, use the release wrapper:

```bash
./filterest_release status
./filterest_release generate
./filterest_release verify
```

`generate` regenerates the sibling repository and runs the candidate checks.
`verify` repeats the checks against the current artifact without regenerating
it. Ordinary source commits only mark the release pending.

Treat this local sibling checkout and its preview database as review candidates.
Make durable code, schema, seed, env, language-key, and setup fixes
in the maintainer release-source generator or source files, then regenerate this
repository. Direct edits inside the generated Filterest checkout are disposable
unless they are intentionally converted back into release-source changes.

## GitHub Publication

The approved beta repository is `kanilmari/filterest-beta`. Publication is a
separate human-approved source-repository action:

```bash
./filterest_release publish --yes
```

The command re-verifies both clean repositories, source evidence, and the
approved `origin/main` contract before pushing beta. No generation command
adds, replaces, or pushes a remote.

## Updating Later Releases

Regenerate with `./filterest_release generate`, inspect the resulting commit,
and run `verify`. Use `publish --yes` only after the separate human publication
decision. Keep private apps, config, runtime data, and unclear media outside the
public history.

## Channel Promotion

The non-public maintainer release source is the only durable development
upstream. Its Git history and DB-native development records do not transfer
into the generated publication repository.

The alpha channel is retired from the active local workflow. Filterest-beta was
generated into a separate repository with a fresh initial artifact commit; the
alpha history was not copied. A future stable `filterest` channel must likewise
start in its own repository with fresh artifact history. Once stable becomes
active, routine generation and publication to beta stop and beta becomes
read-only unless explicitly reopened. The `../filterest` target is reserved
until the stable channel is explicitly activated.
