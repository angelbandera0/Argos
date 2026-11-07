# T02 · Divisas: casos de uso, repositorio y API

- Dominio: `core/domain/currency.ts`; errores nuevos CURRENCY_IN_USE, CODE_TAKEN, VALUE_TAKEN.
- Puerto `currency-repository.ts`; 11 casos en `core/application/use-cases/currencies/` (incluye `listDenominations` para el endpoint de listado). Escritura solo admins de la compañía; lectura admins y operadores de la compañía (`// T04: permiso del módulo divisas` en `shared.ts`).
- Adaptador `infrastructure/supabase/currency-repository.ts` + `currencies-factory.ts`, registrado en `api-services.ts` como `currencies`.
- API v1: `/currencies`, `/currencies/[id]`, `/currencies/[id]/denominations`, `.../[denominationId]`; PATCH acepta `active` (llama setCurrencyActive/setDenominationActive). Registrado en OpenAPI y schemas.
- Pruebas: dominio, casos (fake `in-memory-currencies.ts`), endpoints, integración `currencies.int.test.ts` (2 pruebas, verdes).
- `pnpm test`: 522 OK, 9 fallos preexistentes en `endpoints.test.ts` (rutas `companies/[ref]`, `users/[ref]`, `sites`/`stores` esperadas por la prueba; el repo tiene `[id]`), ajenos a esta tarea.
- `delete_test_company` no borra divisas: la prueba de integración las limpia con el cliente de servicio antes (T04 o una migración futura podría ampliarlo).
