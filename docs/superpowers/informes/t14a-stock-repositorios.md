# T14a · Repositorios Supabase de stock y cableado

Archivos (`infrastructure/supabase/`): `stock-repository.ts` (puerto completo), `stock-operations.ts` (RPC con argumentos `p_x`), `write-off-reason-repository.ts`, `stock-errors.ts` (`stockError`: `translateStockError` sobre `error.message`, luego 23505→NAME_TAKEN, 23503→NotFound, 42501→Forbidden), `stock-factory.ts` (`makeStock(supabase)`, todos los casos de uso), registrado como `stock` en `api-services.ts` (el contenedor ya expone `api(token)`).

Decisiones:
- `clearMinimum`: `stock_minimums` no tiene delete para authenticated; se hace `update minimum = 0` (con 0 el estado es el mismo: qty <= 0 ya es `out`). Efecto: `StockLine.minimum` queda 0 y no `null` tras "quitar".
- Costos: segunda consulta a `lot_costs`/`movement_costs`; sin fila (RLS) → `unitCost` ausente (undefined), fila con costo nulo → `null`.
- `saveProductConfig`/`setMinimum`: select + update/insert (no upsert: los grants por columna no permiten reescribir `product_id`/`company_id`).
- `listStatus`: orden por `product_id` (no por nombre; las vistas no se embeben y paginar por nombre exigiría traer todos los ids). Búsqueda/categoría resuelven ids en `products` primero. Si interesa orden alfabético, cambiarlo en T14b/UI.
- Un operador con `stock` ver puede leer lotes/movimientos del almacén general por RLS (diseño de T09); los casos de uso lo restringen, y los costos siguen ocultos.
- Los avisos de umbral no llegan al propio actor (`app.notify` excluye al actor): la prueba verifica el aviso del operador de la tienda.

Pruebas: `tests/integration/stock.int.test.ts` (6 casos: configuración, entrada con costo, traslado, bajas con REASON_TEXT_REQUIRED, ajuste, sobrante, estados y aviso, motivos, operador sin `see_costs` con sesión real, otra compañía). `pnpm verify:fast` OK (82 archivos, 656 casos); `pnpm test:int stock` 6/6 (~2 min; timeout de 120 s por caso).
