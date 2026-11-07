# L5 · Galería y línea de tiempo real

- Galería: sección `UrlPager` (`app/ui/sections/url-pager.tsx`, registrada en `app/ui/page.tsx`), fila en PATRONES-UI.md, mención en DESIGN-resumen.md; descripción de `QuantityPicker` (era TODO). `lot-picker` ya estaba; `store-stock-list` y `nav-slots` son componentes de app, no de la librería.
- Migración `20261107230701_pedido_eventos.sql`: tabla append-only `pedido_eventos` (kind, actor, at, nota), RLS `can_see_order`, solo select para authenticated, backfill (created/submitted/confirmed/adjusted), las 8 RPC reescritas desde `pg_get_functiondef` vigente insertando el evento, `delete_test_company` actualizado. Sin trigger de auditoría (el log ya es el registro; `audit_row` exigiría otro cambio).
- App: puerto `listEvents`, caso de uso `listOrderEvents`, repo, fake; `timelineSteps(events, status)`; `StateTimeline` usa índice en la key (títulos repetidos).
- Pruebas: pgTAP 031 (7) y `test:db` completo OK; `verify:fast` OK (792 casos). Sin verificación visual.
