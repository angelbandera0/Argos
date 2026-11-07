# Módulo 2 · Almacén y pedidos de compra — Índice

Estado: **Borrador de diseño** (2026-11-06). Lee solo el archivo que necesites; este índice basta para orientarte.

| Archivo | Qué contiene | Léelo cuando |
|---|---|---|
| `00-vision.md` | Intención, objetivos, no-objetivos, flujo de punta a punta, decisiones transversales (M2-Dxx), preguntas abiertas | Siempre primero, o para dudas de alcance |
| `01-divisas.md` | Divisas y denominaciones de billetes | Tocas montos, costos o divisas |
| `02-notificaciones.md` | Notificaciones transversales, campana, sección, dashboard | Un módulo debe avisar algo |
| `03-almacen-stock.md` | Unidades, lotes, movimientos, traslados, bajas, entradas, mínimos | Tocas stock, costos o unidades |
| `04-reposicion-pedidos.md` | Solicitudes, bolsa por comprar, pedido, compra, revisión, correcciones | Tocas el flujo de reposición |
| `05-roles-historial.md` | Permisos nuevos, cambios en REQ-007 y REQ-009 | Tocas roles, permisos o historial |
| `../../../design/screens/MODULO-2-BRIEF-DISENO.md` | Brief de pantallas para Claude Design, por módulo | Diseñas o maquetas la UI |
| `../../../design/modulo2/README.md` | Diseño resultante del Módulo 2 (guía, tokens y maquetas) | Implementas la UI; las maquetas mandan sobre el brief |

## Orden de construcción
1. Divisas → 2. Notificaciones → 3. Almacén y stock → 4. Reposición y pedidos (+ roles e historial se actualizan en cada paso).
Cada parte tendrá su spec detallada, plan y tareas; se para entre partes.

## Convenciones de estos documentos
- `M2-Dxx`: decisión. `[U]` decidido por el usuario; `[P]` propuesta del asistente pendiente de confirmar.
- `M2-Qxx`: pregunta abierta (resumen en `00-vision.md`).
- Cada decisión vive en un solo archivo; los demás la citan por su ID en vez de repetirla.

## Glosario mínimo
- **Unidad base:** unidad en que se guarda todo el stock y costo de un producto (libra con 3 decimales por defecto en peso).
- **Presentación:** unidad de compra con contenido fijo en base (saco, paca, caja).
- **Unidad de movimiento:** unidad en que se traslada a tienda (porción, libra); equivale a una cantidad en base.
- **Lote:** una entrada de un producto con su cantidad restante y su costo unitario.
- **Movimiento:** renglón inmutable del libro de stock.
- **Almacén general:** ubicación central de la compañía; las tiendas son las otras ubicaciones.
- **Bolsa por comprar:** líneas de solicitud aprobadas que aún no están en ningún pedido.
- **Pedido (de compra):** encargo a un comprador con monto y líneas.
