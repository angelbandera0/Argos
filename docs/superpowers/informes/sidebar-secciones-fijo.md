# Sidebar con secciones y barras fijas

- Menú en `components/shell/nav-config.ts` (`buildNav`): General, Almacén, Catálogo, Administración; visibilidad por rol/permiso; secciones vacías se omiten. Sustituye `catalog-nav.ts` y `NavLink`.
- Existencias/Solicitudes/Pedidos con `available: false`: se renderizan deshabilitados (`aria-disabled`, «Próximamente»); ocultos en la barra inferior móvil. Poner `available` en true al crear cada página (T15, T23, T25).
- `SidebarItem` admite `badge`, `dot`, `disabled`; insignia count blanca/ink, roja en activo (M4). Sin datos reales aún; sin contador de Notificaciones (la campana lo calcula en otro componente cliente; se evita duplicar consulta).
- Fijas: `.side` con scroll interno; `.appbar` sticky (fondo `--color-background`); barra inferior móvil con scroll horizontal.
- Divisas solo para administradores (la ruta devuelve 404 a otros). La barra inferior móvil por rol de M4 no se ha rehecho.
- Pruebas: `tests/unit/shell/nav-config.test.ts`; `pnpm verify` OK (605 casos). Verificación visual pendiente.
