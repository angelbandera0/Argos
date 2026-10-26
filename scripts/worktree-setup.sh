#!/usr/bin/env bash
set -euo pipefail
main="$(git worktree list --porcelain | awk '/^worktree /{print substr($0,10); exit}')"
pnpm install --frozen-lockfile
pnpm exec next typegen
if [ "${1:-}" = "--env" ]; then cp "$main/.env.local" .env.local; fi
