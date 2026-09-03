# Changesets

Every change to `@rjvr/buzzsaw` or `@rjvr/buzzsaw-wav` that affects consumers
needs a changeset. Run `just changeset` to write one. It adds a markdown file to
this folder describing the change and the semver bump it deserves.

`just version` consumes every pending changeset, bumps both package manifests,
and updates the `CHANGELOG.md` files. The two libraries are a `fixed` pair, so
they always land on the same version even when only one changed.
