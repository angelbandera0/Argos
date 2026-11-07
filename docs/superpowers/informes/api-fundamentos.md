# Tarea 34: Fundamentos de la API

- `app/api/v1/_lib/problem.ts`: `toProblem` (403/404/422+code/401/500 genérico, `application/problem+json`, sin traza ni entrada).
- `app/api/v1/_lib/with-actor.ts`: `withActor(handler, resolve?)`; valida `Authorization: Bearer`, verifica el JWT con `auth.getClaims(token)` y construye el `Actor` con `channel: "api"`. El resolvedor es inyectable para pruebas.
- `app/api/v1/_lib/openapi.ts` + `openapi.json/route.ts`: documento 3.1.0 con `/api/v1/companies`; esquemas con `z.toJSONSchema` (zod 4.6.7; verificado en los tipos instalados, Context7 no estaba disponible como herramienta).
- `infrastructure/supabase/claims.ts`: extraído `parseClaims` (sin cambio de comportamiento).
- Pruebas: `tests/unit/api/{problem,with-actor}.test.ts`. `pnpm verify:fast`: OK, 60 archivos, 462 casos.

Notas: `withActor` no exige aal2 ni rechaza operadores ni `mustChangePassword`; cada endpoint (Tarea 35) decide. Los esquemas de OpenAPI son un esbozo de `Company`; se ampliarán por endpoint. El shell por defecto usa Node 18; `pnpm` funciona con Node 22.
