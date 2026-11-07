# L4 · Paginación y menú

- Los casos de uso y repos de solicitudes/pedidos ya aceptaban `page/pageSize` y devolvían `total`; faltaba la UI. Nuevo `UrlPager` (`components/ui/url-pager.tsx`, param `pagina`) + `parsePage`; usado en `/solicitudes` (20), bandeja (20) y `/pedidos` (20).
- Pedidos: `OrderFilters.createdFrom/createdTo` aplicado en el repo (y fake); la página convierte desde/hasta a instantes con `dayBoundsInTimeZone` (zona del usuario). Se quitó el filtro en cliente.
- Dashboard: conteo por estado con `total` de una consulta por estado (pageSize 1), lista de 5; enlace «Bandeja →» con `handle_requests`/admin.
- Menú: `AppShell` acepta `indicators` por id de ítem (`SidebarItem.indicator`); `nav-slots.tsx` aporta contador de no leídas (Notificaciones) y punto rojo en Existencias (conteo por estado de las ubicaciones visibles), cada uno bajo su Suspense. Lógica pura en `nav-indicators.ts` con pruebas.
- verify:fast OK (792 casos). Pendiente: `UrlPager` no está en la galería `/ui` ni en DESIGN-resumen; sin verificación visual.
