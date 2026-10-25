# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

Fresh `create-next-app` scaffold (single "Initial commit"); `app/` only contains `layout.tsx`, `page.tsx`, `globals.css`. No tests, no test runner configured.

## Commands

Package manager is pnpm (`pnpm@11.1.3`).

- `pnpm dev` — dev server at http://localhost:3000
- `pnpm build` / `pnpm start` — production build / serve
- `pnpm lint` — ESLint (flat config in `eslint.config.mjs`, uses `eslint-config-next`)

## Next.js version caveat

This is Next.js 16.4.3 with React 19.3 — newer than typical training data, with breaking changes. `AGENTS.md` requires reading the relevant guide in `node_modules/next/dist/docs/` (`01-app`, `02-pages`, `03-architecture`, …) before writing Next.js code, and heeding deprecation notices.

## Design and specs

- Before creating or modifying UI, follow @docs/design/DESIGN.md and use only the tokens in `docs/design/tokens.css` (imported by `app/globals.css`). No dark backgrounds, so there is no dark-mode block.
- Product specs live in `docs/` (spec-anchored, see `docs/README.md`): the spec wins over code, and functional changes go through the docs first.

## Architecture notes

- App Router only (`app/`). Path alias `@/*` maps to the repo root (not `src/`).
- `next.config.ts` enables `cacheComponents` and `partialPrefetching`, so Cache Components / PPR semantics apply (dynamic data access must be handled per the Cache Components docs, e.g. `use cache` / Suspense boundaries).
- Tailwind v4 is wired through Turbopack: `next.config.ts` adds a `turbopack.rules` entry running `@tailwindcss/turbopack` on `*.css`. Theme tokens live in `app/globals.css` (`@import "tailwindcss"`, `@theme inline`, light/dark CSS variables via `prefers-color-scheme`).
