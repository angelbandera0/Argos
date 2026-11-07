# T07b · Sección /notificaciones y bloque del dashboard

- `/notificaciones` (page síncrona + Suspense, `loading.tsx`, `notifications-screen.tsx`): pestañas Todas / Sin leer con contador, filtros en URL (módulo, operación, prioridad, estado, tienda, fechas), grupos por día en la zona del usuario, «Abrir →», check por fila, «Marcar todas», `Pager`, `ViewState` (cargando, vacío «Estás al día», sin coincidencias, error con reintento).
- Lógica pura en `components/notifications/notification-filters-logic.ts` (URL <-> filtros, entrada del caso de uso con rango en zona local); `guard.ts` comparte guard y mapeo con `actions.ts`.
- Dashboard: `components/dashboard/latest-notifications.tsx` («Últimas 10 notificaciones», enlace «Ver todas →»). «Solicitudes de hoy» no se toca (T28).
- Pruebas: `tests/unit/notification-filters-logic.test.ts`. `pnpm verify` ejecutado.
- Supuestos: valores de operación `create`, `status_change`, `stock_alert` (filtro) a confirmar con los productores; tiendas para el filtro leídas con el cliente del usuario (RLS).
- Pendiente: verificación visual (sin navegador).
