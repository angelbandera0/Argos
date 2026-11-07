# T07a · Campana de notificaciones

- `components/notifications/`: `NotificationBell` (Popover Base UI, insignia 9+, panel con filas, marcar todas, ver todas, cargando/error con reintento, «Estás al día»), `BellSlot`/`BellFallback` (async bajo Suspense en `app/(app)/layout.tsx`, prop `bell` de `AppShell`), `use-unread-count.ts` (sondeo 60 s con pestaña visible; aislado para cambiarlo por tiempo real), `notification-logic.ts`.
- `app/(app)/notificaciones/actions.ts`: `listRecentAction`, `countUnreadAction`, `markReadAction` (cualquier usuario autenticado; solo propias vía RLS/actor).
- Estilos `app/ui-notification-panel.css`; docs en PATRONES-UI y DESIGN-resumen. Prueba `tests/unit/notification-logic.test.ts`. `pnpm verify` OK (592 casos).
- Pendiente: verificación visual (sin navegador); «Ver todas» da 404 hasta el paso 2; no hay entrada en la galería /ui (la pieza vive en shell, depende de server actions).
