set shell := ["bash", "-euo", "pipefail", "-c"]

root := justfile_directory()
app := "@rjvr/buzzsaw-app"
libs := "./packages/*"

# Show available commands
[default]
help:
    @just --list --unsorted

# --- Development ---

# Install dependencies across the monorepo
[group('dev')]
install:
    pnpm install

# Start the app dev server
[group('dev')]
dev:
    pnpm dev

# Build every workspace package and the app
[group('dev')]
build:
    pnpm build

# Build, then serve it with the real security headers
[group('dev')]
preview: build
    pnpm --filter {{ app }} preview

# --- Quality ---

# Run lint, typecheck, test and build the way CI does
[group('qa')]
ci: lint typecheck test build

alias check := ci

# Run tests, optionally filtered
[group('qa')]
test *args:
    pnpm exec vitest run {{ args }}

# Run tests in watch mode
[group('qa')]
test-watch *args:
    pnpm exec vitest watch {{ args }}

# Lint and check formatting
[group('qa')]
lint:
    pnpm lint

# Auto-fix lint and formatting issues
[group('qa')]
fix:
    pnpm lint:fix

# Typecheck every workspace package
[group('qa')]
typecheck:
    pnpm typecheck

# Install the lefthook pre-commit and pre-push hooks
[group('qa')]
hooks:
    pnpm exec lefthook install

# --- Release ---

# Describe a library change and the version bump it deserves
[group('release')]
changeset:
    pnpm exec changeset

# Show which libraries have pending changesets on this branch
[group('release')]
changeset-status:
    pnpm exec changeset status --since=origin/main

# Apply every pending changeset: bump manifests, rewrite CHANGELOGs
[group('release')]
version:
    pnpm exec changeset version
    pnpm install --lockfile-only

# Pack both libraries into ./tarballs and print what they contain
[group('release')]
pack:
    pnpm --filter '{{ libs }}' run build
    mkdir -p {{ root }}/tarballs
    pnpm --filter @rjvr/buzzsaw pack --out {{ root }}/tarballs/core.tgz
    pnpm --filter @rjvr/buzzsaw-wav pack --out {{ root }}/tarballs/wav.tgz
    tar -tzf {{ root }}/tarballs/core.tgz
    tar -tzf {{ root }}/tarballs/wav.tgz

# --- Maintenance ---

# Remove build artifacts, caches and packed tarballs
[group('maintenance')]
clean:
    rm -rf {{ root }}/app/dist {{ root }}/packages/*/dist {{ root }}/tarballs {{ root }}/node_modules/.vite
