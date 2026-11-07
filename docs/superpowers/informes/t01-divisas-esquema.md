# T01 · Esquema de divisas

Migración `supabase/migrations/20261107010000_currencies.sql`; pruebas `supabase/tests/011_currencies.test.sql` (19). No aplicada ni ejecutada (sin acceso a Supabase).

- Tablas: `currencies` (code único por compañía sin mayúsculas/espacios y sin borrados, decimals 0-4, is_default, active, deleted_at), `currency_denominations` (value > 0, kind bill|coin, único por divisa y valor, FK compuesta que fuerza la misma compañía).
- Funciones: `app.currency_in_use(uuid)` (false por ahora; T10/T19), `app.guard_currency_delete`, `app.guard_currency_company`, `app.single_default_currency`.
- Auditoría: `app.audit_row` redefinida con módulo `currencies` para ambas tablas; triggers `audit_*`.
- RLS: lectura admin de la compañía u operador de la compañía (solo no eliminadas); escritura solo administradores (`-- T04: ajustar a permiso del módulo divisas`, porque `role_permissions.module` solo admite 'products').
- Inquietudes: el check de `role_permissions.module` y la lista de módulos deberán ampliarse en T04; la guarda de denominación usa `currency_in_use` de su divisa. Si `audit_log` se redefine en otra migración, hay que conservar la rama `currencies`.
- 099_rls_coverage no requiere cambios (es genérico).
