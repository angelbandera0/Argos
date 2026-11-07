# T04c: permisos especiales en la sesión

- Migración `20261107030000_my_store_access_special.sql`: `my_store_access` (drop + create, mismos grants) añade `special jsonb` (`[{permission, warehouse}]`, `[]` si rol borrado o compañía excluida). No aplicada.
- pgTAP `013_my_store_access_special.test.sql` (5 casos). No ejecutado.
- TS: `StoreAccess.specialPermissions`, lector, fakes, `hasSpecial` (core/domain/permissions.ts) con prueba.
- UI: «Almacén general» también en `transfer` y `handle_requests` (`scoped: true`).
- `pnpm verify:fast` OK (72 archivos, 581 casos).
