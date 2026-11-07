# T22 · Adaptadores y API de reposición

Migración `*_is_eligible_buyer_rpc.sql`: `public.is_eligible_buyer(company, user)` (admin o `build_orders`), aplicada con db:apply; sin pgTAP propio (cubierta por la prueba de integración).
Adaptadores: `request-repository.ts`, `order-repository.ts`, `replenishment-errors.ts` (usa translateRequestError/translateOrderError), fábricas `makeRequests`/`makeOrders` en `api-services` (`svc(req).requests` / `.orders`). Lecturas por RLS; costos del pedido se devuelven como null si RLS los oculta y el caso de uso los omite sin permiso.
Errores: 409 para ASSIGNMENT_ALREADY_ORDERED e INVALID_STATUS; nuevos códigos INVALID_ASSIGNMENT, INVALID_PLAN, INVALID_CURRENCY (422).
Endpoints (OpenAPI incluido): GET/POST `/solicitudes`, GET `/solicitudes/bag`, GET `/solicitudes/{id}`, POST `/solicitudes/{id}/lines/{lineId}` (atender); GET/POST `/pedidos`, GET `/pedidos/{id}`, PUT `/buyer`, POST `/purchase`, POST `/submit`, PUT `/review`, POST `/confirm`, POST `/return`, POST `/adjustments`.
Pruebas: unit API (una fila por endpoint) y `tests/integration/replenishment.int.test.ts` (flujo completo con lote creado, costo oculto al comprador, comprador no revisa, bolsa excluye pedidos). Pendiente: REST con token de operador devuelve 403 en `/pedidos/{id}` (no investigado; el caso de uso directo funciona).
