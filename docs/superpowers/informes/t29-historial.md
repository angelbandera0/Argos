# T29 Historial
- Costos ocultos en el caso de uso (`list-history`, `sanitize.ts`): claves unit_cost, cost(s), amount(_given), total, price, shortage_value se eliminan del antes/después salvo admin/superadmin u operador con `see_costs`. Los costos viven en tablas no auditadas (movement_costs, pedido_costos), así que es defensa en profundidad.
- Etiquetas: módulos (Divisas, Existencias, Solicitudes, Pedidos), entidades y operaciones (tipo de movimiento, revisión/confirmación/devolución, corrección) en `history-utils.ts`; `audit-rows.ts` usa `operationInfo`.
- SQL: todas las tablas nuevas relevantes ya tenían `audit_row`; sin migración. Notificaciones no se auditan (solo propias).
- Pruebas: tests/unit/history/cost-hiding.test.ts; verify:fast OK (786 casos).
