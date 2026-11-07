# T21a · RPC del flujo de pedidos

Migración `*_order_flow.sql`: columna `pedido_lineas.assignment_id` (único; enlaza línea de la bolsa `to_buy`), `app.is_eligible_buyer` (admin u operador con `make_purchases`).
RPC: `create_pedido(lines jsonb [{product_id, dest, store_id?, qty, unit, content, assignment_id?, plan[{store_id, qty}]}], currency, note)` (admin/`build_orders` almacén; estado open; plan debe sumar qty); `assign_pedido_buyer(order, buyer)` (notifica `assigned`); `register_pedido_purchase(order, lines [{line_id, qty_bought, unit_cost}], amount_given)` (comprador o admin; costos en tablas protegidas); `submit_pedido_review(order)` -> jsonb {given, spent, leftover}, estado in_review, notifica `submitted_for_review`, limpia return_note.
Pendiente: la vista `bolsa_por_comprar` aún no excluye asignaciones ya en un pedido (RLS invoker impediría verlo a quien no ve el pedido); guardar revisión parcial sigue para T22.
pgTAP 026 (15/15); `pnpm test:db` completo en verde.
