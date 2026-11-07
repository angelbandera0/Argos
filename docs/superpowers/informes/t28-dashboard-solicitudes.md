# T28 · Dashboard: Solicitudes del día

- Bloque `TodayRequests` (`components/dashboard/today-requests.tsx`) en `app/(app)/page.tsx`, bajo Suspense antes de las notificaciones: conteo por estado derivado (StatTile) y hasta 5 solicitudes con enlace a `/solicitudes/[id]`; sin costos. Admin y `handle_requests` ven todas las tiendas, usuarios de tienda solo las suyas (lo resuelve `listRequests`); sin permiso o sin compañía activa no se muestra.
- Filtro nuevo `createdFrom`/`createdTo` ([from, to)) en `RequestFilters`, caso de uso, repo Supabase y fake. «Hoy» = día natural en la zona horaria del servidor (`dayRange`; no hay zona por compañía aún).
- Conteos sobre las primeras 100 solicitudes del día. Lógica en `today-requests-logic.ts` + tests. `verify:fast` OK (783 casos). Sin verificación visual.
