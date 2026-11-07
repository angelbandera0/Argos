# REQ-013 — Reposición y pedidos de compra

- **Módulo:** Reposición y pedidos (Módulo 2)
- **Estado:** Borrador
- **Prioridad:** Imprescindible
- **Actor(es):** Administrador de tienda (solicita y revisa su tienda); almacenero (atiende, arma pedidos, revisa el almacén); comprador (compra); administrador (todo lo anterior y corrige pedidos)

## Resultado esperado
Una tienda pide productos; el almacén surte lo que tiene; lo que falta se compra con un monto y un comprador; lo comprado se verifica antes de sumarse al stock; las diferencias quedan registradas y se corrigen con trazabilidad.

Detalle: `docs/superpowers/specs/2026-11-06-modulo-2-almacen-pedidos/04-reposicion-pedidos.md`.

## Criterios de aceptación
Verificables, en formato DADO … CUANDO … ENTONCES.

- CA-01: DADO una solicitud con stock suficiente, CUANDO el almacenero la atiende, ENTONCES se genera el traslado y la tienda ve la cantidad en su existencia.
- CA-02: DADO stock parcial, ENTONCES se traslada lo disponible y el resto queda por comprar, pendiente o rechazado, con quién y por qué.
- CA-03: DADO un pedido con monto y divisa, CUANDO el comprador marca costos y cantidades, ENTONCES ve gasto por producto, total y diferencia con el monto.
- CA-03b: DADO un pedido con monto 500 y gasto 470, ENTONCES se ven en compra, revisión y detalle: entregado 500, gastado 470, sobrante 30.
- CA-04: DADO un pedido en revisión, ENTONCES el stock no cambia hasta confirmar.
- CA-05: DADO un pedido, CUANDO lo revisa quien lo compró, ENTONCES se rechaza.
- CA-06: DADO una confirmación con faltante, ENTONCES entra solo lo recibido y el faltante queda valorado.
- CA-07: DADO una línea de entrega directa desglosada por tienda, ENTONCES cada tienda recibe su cantidad y la confirma su encargado.
- CA-08: DADO un pedido cumplido, CUANDO se detecta un error, ENTONCES solo puede corregirse con un ajuste enlazado y con permiso.
- CA-09: DADO un pedido, ENTONCES todos los estados y decisiones constan en el historial.

## Restricciones
DR-014, DR-017, DR-019, DR-022 a DR-026. Decisiones M2-D02, M2-D04, M2-D07, M2-D09, M2-D10, M2-D12, M2-D16 y ADR-016 y ADR-017.

## Fuera de alcance
- Proveedores como entidad.
- Ventas, caja y turnos.
- Desglose de billetes en el pedido.
- Tasas de cambio (una sola moneda, M2-D01).

## Exposición
- **API REST:** `/api/v1/solicitudes`, `/pedidos` (por detallar en el plan del módulo).
- **MCP:** por definir; montos y costos solo con «ver costos» (M2-D04).

## Dependencias y preguntas abiertas
REQ-007 (permisos), REQ-010 (divisas), REQ-011 (notificaciones), REQ-012 (existencias y traslados). M2-Q04, M2-Q08.

## Notas para el manual
Se completa al implementar (D-04).
