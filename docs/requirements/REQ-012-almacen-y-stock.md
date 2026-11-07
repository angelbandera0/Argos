# REQ-012 — Almacén y stock

- **Módulo:** Almacén (Módulo 2)
- **Estado:** Borrador
- **Prioridad:** Imprescindible
- **Actor(es):** Administrador; almacenero; administrador de tienda (solo ver su tienda, sin costos)

## Resultado esperado
Cada compañía sabe cuánto hay de cada producto básico en el almacén general y en cada tienda, cuánto costó cada entrada, y puede mover, dar de baja y corregir existencias con trazabilidad total. Las tiendas ven cantidades; los costos solo los ven quienes tienen permiso.

Detalle: `docs/superpowers/specs/2026-11-06-modulo-2-almacen-pedidos/03-almacen-stock.md`.

## Criterios de aceptación
Verificables, en formato DADO … CUANDO … ENTONCES.

- CA-01: DADO una entrada de 5 sacos de 25 lb a 300 el saco, ENTONCES hay un lote de 125,000 lb a 12,000 por lb, con la captura original guardada.
- CA-02: DADO un traslado de 10 porciones (1 porción = 0,200 lb), ENTONCES se descuentan 2,000 lb del lote elegido y la tienda ve 10 porciones.
- CA-03: DADO una salida sin elegir lote, ENTONCES se usa el lote más antiguo; si se elige otro, se registra como desvío.
- CA-04: DADO un lote con menos de lo pedido, ENTONCES no se permite sacar más de lo que queda en él.
- CA-05: DADO un usuario sin «ver costos», ENTONCES no aparece ningún costo en pantallas, API ni MCP.
- CA-06: DADO una baja, ENTONCES exige motivo del catálogo o «otro» con texto, y baja el stock del lote elegido.
- CA-07: DADO un producto que llega a su mínimo o a cero, ENTONCES cambia a bajo o agotado y se notifica.
- CA-08: DADO una entrada inicial hecha por un almacenero, ENTONCES se notifica a los administradores.
- CA-09: DADO un movimiento registrado, ENTONCES no puede editarse ni borrarse; solo corregirse con un ajuste.

## Restricciones
DR-014, DR-016, DR-017, DR-019 a DR-022 y DR-026. Decisiones M2-D02, M2-D03, M2-D04, M2-D07, M2-D08, M2-D10, M2-D11, M2-D13, M2-D15, M2-D16.

## Fuera de alcance
- Recetas, producción y consumo (el tipo de movimiento queda reservado).
- Cobertura de existencias según consumo.
- Ventas, caja y turnos.
- Proveedores como entidad.

## Exposición
- **API REST:** `/api/v1/existencias`, `/traslados`, `/bajas`, `/ajustes`, `/ubicaciones` (por detallar en el plan del módulo).
- **MCP:** por definir; los costos se exponen solo con «ver costos» (M2-D04).

## Dependencias y preguntas abiertas
REQ-005 (tiendas), REQ-007 (permisos), REQ-008 (catálogo), REQ-011 (notificaciones), REQ-013 (entradas por pedido). M2-Q01, M2-Q02, M2-Q05, M2-Q06.

## Notas para el manual
Se completa al implementar (D-04).
