# T14b - API REST de stock

Repositorio: `listStatus`/`getStockLine` usan `product_name`, `category_id`, `category_name` de la vista `stock_status` (orden por nombre y luego product_id; `q` con ilike sobre `product_name`; categoría por `category_id`). Ya no se consulta `products`/`categories`.

Errores (`_lib/problem.ts`): 403 con código para COST_NOT_ALLOWED, CHOOSE_LOT_FORBIDDEN, STANDARD_REASON_LOCKED; 409 para NAME_TAKEN, CODE_TAKEN, BASE_UNIT_IN_USE, DUPLICATE_LOT (NAME_TAKEN/CODE_TAKEN antes devolvían 422 también en categorías/divisas); resto de RuleViolation 422; entrada inválida 422.

Endpoints (`/api/v1/stock`, todos `withActor`, en OpenAPI):
- GET `/locations`, GET `/` (locationId, status, q, categoryId, page, pageSize), GET `/movements`, GET `/products/{id}` (locationId)
- GET/PUT `/products/{id}/config`
- POST `/products/{id}/presentations`; PATCH/DELETE `/products/{id}/presentations/{presentationId}` (name, content, active)
- POST `/products/{id}/movement-units`; PATCH/DELETE `/products/{id}/movement-units/{unitId}` (name, equivalence, active)
- PUT `/minimums` (minimum null/0 = quitar)
- POST `/entries/initial`, `/entries/direct`, `/preview`, `/transfers`, `/write-offs`, `/adjustments`, `/surplus`
- GET/POST `/write-off-reasons`; PATCH/DELETE `/write-off-reasons/{id}`

Admin debe pasar `companyId` en las listas (query) y en POST write-off-reasons (cuerpo).

Pruebas: unit API (fila por endpoint: 401/403/2xx, mapeo de errores, OpenAPI); integración `stock.int.test.ts`: operador solo con `stock` ver lista con nombres; handlers REST reales (entrada inicial, traslado, listado, detalle, movimientos) y sin `unitCost` para el operador sin ver costos.
