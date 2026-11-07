# REQ-010 — Divisas y denominaciones

- **Módulo:** Divisas (Módulo 2)
- **Estado:** Borrador
- **Prioridad:** Imprescindible
- **Actor(es):** Administrador; usuario con permiso de ver divisas (al elegirlas en un pedido)

## Resultado esperado
El administrador registra las monedas que usa la compañía y, para el efectivo, las denominaciones de sus billetes y monedas. Los montos de los pedidos y los costos de los lotes usan estas divisas, sin conversión entre ellas.

Detalle: `docs/superpowers/specs/2026-11-06-modulo-2-almacen-pedidos/01-divisas.md`.

## Criterios de aceptación
Verificables, en formato DADO … CUANDO … ENTONCES.

- CA-01: DADO un administrador, CUANDO crea una divisa con código repetido en su compañía, ENTONCES se rechaza.
- CA-02: DADO una divisa, CUANDO se agregan denominaciones, ENTONCES se listan ordenadas por valor y no se repite el valor.
- CA-03: DADO una divisa usada en un pedido o lote, CUANDO se intenta eliminar, ENTONCES no es posible; se puede desactivar y deja de ofrecerse en pedidos nuevos.
- CA-04: DADO un pedido, CUANDO se define el monto, ENTONCES solo se ofrecen las divisas activas de su compañía.

## Restricciones
DR-014 (eliminar es borrado lógico), DR-016 (catálogo por compañía), DR-017 (historial). Decisiones M2-D01 (una moneda, sin tasas), M2-D06 (trazabilidad).

## Fuera de alcance
- Tasas de cambio y conversión entre divisas.
- Desglose de billetes en el pedido (las denominaciones solo se registran).

## Exposición
- **API REST:** `/api/v1/divisas` (por detallar en el plan del módulo).
- **MCP:** por definir. Si se expone, la divisa no es sensible; los montos de pedidos siguen el permiso de costos (M2-D04).

## Dependencias y preguntas abiertas
REQ-007 (permisos del módulo Divisas), REQ-009 (historial), DR-025.

## Notas para el manual
Se completa al implementar (D-04).
