# T04a - módulos nuevos y permisos especiales de roles

- Migración `supabase/migrations/20261107020000_special_permissions.sql` (NO aplicada): CHECK de módulos ampliado (+ `role_permissions_notifications_view_only`), tabla `role_special_permissions` (RLS por `app.owns_role`, auditoría bajo 'roles'), funciones `app.has_special`, `app.has_special_in_store`, `app.has_special_warehouse`, `audit_row` redefinida conservando ramas, políticas de divisas pasan a `app.can(..., 'currencies', op)` o administrador.
- pgTAP: `supabase/tests/012_special_permissions.test.sql` (20 casos); `011` ajustado (el operador necesita rol con `currencies.view` y sesión). Pendiente de ejecutar `test:db`.
- Dominio: `MODULES`, `SPECIAL_PERMISSIONS`, `PermissionMap`, `SpecialGrant`; errores NOTIFICATIONS_VIEW_ONLY, UNKNOWN_/DUPLICATE_SPECIAL_PERMISSION. `Role.permissions` siempre trae los 6 módulos; la entrada (`RoleInput`) acepta módulos parciales y `specialPermissions` opcional (omitido = sin cambios en update).
- API/OpenAPI: createRole/updateRole aceptan `permissions` parcial y `specialPermissions`.
- No se tocó claims/`my_store_access` (sigue exponiendo solo products): paso 2 o tarea posterior debe exponer permisos de otros módulos y especiales a la sesión del operador.
- UI: solo ajustes de tipos (role-form, permission-matrix, actions); sin cambios funcionales.
- Pruebas: `pnpm verify:fast` OK (72 archivos, 578 casos).
