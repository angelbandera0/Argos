# /usuarios rediseñado (§6.39)

- Cabecera con subtítulo (compañía activa), «Nuevo usuario», 4 `StatTile` con punto (Usuarios · Activos · Aún no han entrado · Inactivos), barra en una fila (buscador, Rol, Tienda, chips Todos/Activos/[Bloqueados si hay]/Inactivos con contador; todo en la URL: q, rol, tienda, estado, pagina), `DataTable` con las columnas de la spec, menú «⋯» y `Pager` (10 por página, «Mostrando a–b de n usuarios»). Vacío con `EmptyState`; `loading.tsx` con la misma forma.
- Datos reales, sin migraciones: `UserRepository.listAssignmentsFor` y `lastLogins` (último `login_ok` de `auth_events`, RLS de administrador); «Aún no ha entrado» = activo sin `login_ok`. Rol = primero de sus asignaciones; «Todas las tiendas» si cubre todas las tiendas activas (>1).
- «Generar nuevo PIN» y «Desactivar usuario» reutilizan confirmación + `PinRevealDialog` (extraído `UserActionDialogs` en `user-actions.tsx`).
- Nuevo/ampliado: `StatTile dot`, `Avatar toneKey`, `Pager unit`; `user-table.tsx` ya no se usa (borrado).
- Omitido: «Activar usuario» (no existe caso de uso de reactivación). Chip «Administrador» amarillo solo si el rol se llama así.
- Pendiente: comprobar en navegador (`/verificar-ui`); `.ui-user-stats` no está en la galería (solo `StatTile dot`); `lastLogins` trae todos los login_ok de la compañía (sin límite).
