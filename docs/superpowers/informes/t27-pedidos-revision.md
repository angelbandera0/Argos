# T27 · Revisión, detalle y corrección de pedidos (UI)

- `/pedidos/[id]` suma pestañas a `sections`: «Revisión» (`review_orders`/admin, distinto del comprador, estado in_review), «Detalle» (siempre) y «Corrección» (cumplido + `correct_orders`/admin).
- Revisión (`review-panel.tsx`): recibido por línea, `StoreSplit` obligatorio en líneas directas sin plan (M2-D10), faltante/sobrante y faltante valorado (solo con costos), Guardar (`saveReview`), Confirmar y Devolver con nota (AlertDialog). Lógica pura `review-logic.ts` + `tests/unit/review-logic.test.ts`.
- Detalle (`detail-panel.tsx`): línea de tiempo derivada del estado y ajustes (no hay tabla de eventos), comparativa y tabla; costos solo si `getOrder` los devuelve. Corrección (`adjust-panel.tsx`): un lote del pedido + delta + motivo (`adjustOrder`); el RPC valida `adjust_stock`/admin. Acciones `reviewAction`/`adjustAction` con zod.
- Pendiente: corrección de costo (el RPC solo ajusta cantidad), comprador ve su pedido devuelto solo en «Compra», verificación visual. `verify:fast` OK (781 casos).
