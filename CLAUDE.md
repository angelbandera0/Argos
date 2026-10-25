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

- Before creating or modifying UI, read and follow `docs/design/DESIGN.md` (not auto-loaded, to save context; subagents on UI tasks must be told to read it) and use only the tokens in `docs/design/tokens.css` (imported by `app/globals.css`). No dark backgrounds, so there is no dark-mode block.
- Product specs live in `docs/` (spec-anchored, see `docs/README.md`): the spec wins over code, and functional changes go through the docs first.

## Reglas de comportamiento obligatorias (Modo Ponytail)

- **Minimalismo estricto**: Escribe solo el código estrictamente necesario para cumplir la tarea.
- **Cero sobre-ingeniería**: No añadas abstracciones, interfaces o patrones de diseño complejos a menos que se soliciten explícitamente.
- **Sin comentarios obvios**: No comentes lo que el código ya dice por sí mismo.
- **Sin explicaciones verbosas**: Ve directo al grano. Entrega el código y, si es necesario, una lista breve de cambios. Omite saludos, resúmenes finales o justificaciones.

## Ejecución con subagentes (reglas del usuario)

- **Informes cortos.** El detalle va en el archivo de informe de la tarea; la respuesta al controlador tiene como máximo 5 líneas: estado, commit, resumen de pruebas en una línea, hasta 2 inquietudes y la ruta del informe. Los revisores escriben la revisión completa en un archivo y responden con el veredicto y solo los hallazgos Críticos e Importantes (máximo 10 líneas).
- **Modelos.** Escribir código (incluido SQL y RLS): siempre Sonnet, sin preguntar. Opus solo para planificación, diseño y decisiones de arquitectura. Tareas de muy baja complejidad (solo documentación, configuración o cambios mecánicos): Haiku, sin preguntar.
- **Revisión.** Se omite la revisión por tarea para avanzar; las revisiones de seguridad están diferidas en `docs/superpowers/revisiones-pendientes.md`. Cada tarea termina con sus pruebas en verde y el informe corto. Lo que se detecte se anota ahí.
- **Pruebas.** Se escriben junto con la implementación, pero se ejecutan una sola vez al final de la tarea (sin ciclo RED/GREEN intermedio); el informe da el resultado de esa ejecución.
- **Una tarea cada vez.** Tras cada tarea el controlador para y espera el "sigue" del usuario.

## Architecture notes

- App Router only (`app/`). Path alias `@/*` maps to the repo root (not `src/`).
- `next.config.ts` enables `cacheComponents` and `partialPrefetching`, so Cache Components / PPR semantics apply (dynamic data access must be handled per the Cache Components docs, e.g. `use cache` / Suspense boundaries).
- Tailwind v4 is wired through Turbopack: `next.config.ts` adds a `turbopack.rules` entry running `@tailwindcss/turbopack` on `*.css`. Theme tokens live in `app/globals.css` (`@import "tailwindcss"`, `@theme inline`, light/dark CSS variables via `prefers-color-scheme`).
