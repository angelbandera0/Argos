---
name: argos-db-task
description: Use when implementing a database task (migration + pgTAP tests) of the Argos Módulo 1 plan, i.e. Tasks 12 and any other task that adds supabase/migrations and supabase/tests files.
---

# Tarea de base de datos de Argos

Aplica esto al escribir una migración con sus pruebas. Todo en Modo Ponytail (CLAUDE.md): mínimo código, sin comentarios obvios.

## Leer (solo esto)

1. La sección de la tarea en `docs/superpowers/plans/2026-10-25-modulo-1-implementacion.md` y la Enmienda del principio (entorno cloud).
2. `docs/technical/MODULO-1-DISENO-TECNICO.md` §3 (tablas) y §6 (RLS).
3. Como estilo: la última migración y su `.test.sql` en `supabase/`.
4. `supabase/tests/000_helpers.sql` (`tests.create_user`, `authenticate_as`, `clear_auth`).

## Convenciones SQL

- `security definer` con `set search_path = pg_catalog`, nombres de objeto calificados (`public.`, `app.`).
- Políticas con `(select auth.uid())` y `(select app.kind())`; `revoke ... from public, anon` y `grant execute ... to authenticated` en cada función.
- Grants por columna cuando una tabla no deba aceptar cualquier `update`/`insert`.
- Una migración ya aplicada no se reescribe: un arreglo es otra migración.
- Pruebas: archivo `NNN_nombre.test.sql`, aserciones al inicio de línea con `plan/is/ok/matches/throws_ok/lives_ok`, ids fijos en uuid, `tests.clear_auth()` y `finish()` al final.

## Pocas llamadas (cada llamada relee todo el contexto)

- Lee todos los archivos necesarios en UNA llamada (`cat a b c`), no uno por uno.
- Escribe migración y pruebas en una sola llamada (varios heredocs seguidos).
- No releas lo que acabas de escribir; confía en el error del comando si falla.
- Cierra con un único comando: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` (o `pnpm test:db`, según la tarea).

## Flujo

1. Escribir migración y pruebas.
2. `pnpm db:apply supabase/migrations/<nombre>.sql` (renombra a la versión). Si falla la conexión, `apply_migration` del MCP y renombrar con `list_migrations`.
3. `pnpm test:db` completo **una vez** al final (cuesta unas pocas líneas de salida; incluye la cobertura de RLS de `099`). Mientras desarrollas, `pnpm test:db <NNN>` solo si algo falla.
4. Commit en inglés: `feat(db): ...` con la línea `Co-Authored-By` del entorno.
5. Ledger: línea `Task N: complete (commit X; NNN a/b)` en `.superpowers/sdd/2026-10-25-modulo-1-implementacion/progress.md`; menores en `docs/superpowers/revisiones-pendientes.md`. No toques `docs/superpowers/consumo.md`: el controlador anota el consumo.
6. Informe completo en `.superpowers/sdd/2026-10-25-modulo-1-implementacion/task-N-report.md`.

## Respuesta final

Máximo 5 líneas: estado, commit, resumen de pruebas en una línea, hasta 2 inquietudes, ruta del informe.
