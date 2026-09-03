set shell := ["bash", "-euo", "pipefail", "-c"]

root := justfile_directory()
app := "@rjvr/buzzsaw-app"

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
ci: lint typecheck test build verify-consumer

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

# Build and pack both libraries in a throwaway container, printing what the tarballs contain
[group('release')]
pack:
    docker compose -f {{ root }}/test/consumer/compose.yaml run --rm verify sh -c \
        'sh /repo/scripts/container/pack-libs.sh && tar -tzf /work/tarballs/core.tgz && tar -tzf /work/tarballs/wav.tgz'

# Install the packed tarballs into a scratch project and typecheck + run them as a Node ESM consumer
[group('release')]
verify-consumer:
    pnpm verify:consumer

# --- Maintenance ---

# Remove build artifacts and caches
[group('maintenance')]
clean:
    rm -rf {{ root }}/app/dist {{ root }}/packages/*/dist {{ root }}/node_modules/.vite
