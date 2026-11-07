# T25 · Lista y armado de pedidos (UI)

- `/pedidos`: lista con filtros por URL (estado, comprador solo para quien arma, rango de fechas filtrado sobre las 50 más recientes), badges `StatusBadge family="order"`; el comprador ve solo los suyos (use case). Sin costos.
- `/pedidos/nuevo`: arma desde la bolsa (precarga una línea por producto, «Por tienda» con `StoreSplit`) o líneas libres; «General» = `direct` sin plan (reparto al confirmar, M2-D10), una sola tienda = `store`, varias = `direct` + plan. Comprador elegible opcional (`isEligibleBuyer`), `createOrderAction` crea y asigna. Cantidades en unidad base.
- Dominio: `validateOrderLine` ya no exige plan en `direct` (el SQL lo permitía vacío). Menú «Pedidos» habilitado.
- Lógica pura `components/orders/order-logic.ts` + tests. `verify:fast` OK (768 casos). Sin hacer: detalle `/pedidos/[id]` (T26/T27; el enlace del Nº lo apunta), selección de unidad de presentación, verificación visual (`/verificar-ui 25`).
