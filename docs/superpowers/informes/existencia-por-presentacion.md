# Existencia por presentación

## Paso 1 (hecho)
- Spec: S-04b, S-04c, CA-12..15 en 03-almacen-stock.md; ADR-019.
- Migración `20261108055349_lot_presentation.sql`: `lots.presentation_name/presentation_content` (relleno desde `captured_unit` no-unidad y herencia en traslados; `create_lot` los fija/hereda), `stock_movements.asked_qty/asked_unit` (nullable, sin cablear aún: paso 3 los escribe desde `consume_lots`/`create_lot`). Ya existían captured_qty/unit y content por lote.
- Dominio: `stockByPresentation` (core/domain/stock/presentation-stock.ts), completas por lote + sueltas; pruebas unitarias; pgTAP 036 (5).
- Nota: `024_pedidos` falla en test:db por 1 lote preexistente en la base cloud compartida (cuenta todos los lotes), ajeno a este cambio.
- verify:fast OK (817 casos).

## Paso 2 (hecho)
- `components/stock/presentation-logic.ts` (`presentationStock`, `lotPresentation`); `LotView.presentation`. Lista (columna Existencia: presentación + base), tile Existencia del detalle, pestaña Lotes (columna Presentación + restante desglosado) y tarjetas de tienda. Bandeja/tarjetas de pedidos no muestran existencia: sin cambio. verify:fast OK (823).

## Paso 3 (hecho)
- Migración `move_units`: `app.resolve_unit` (base, unidad de movimiento, presentación con su contenido configurado, unidad de la familia) usada por `register_transfer` y `register_write_off`; trigger `fill_asked` rellena `asked_qty/asked_unit` (traslado y baja) vía ajuste de transacción. pgTAP 037 (8).
- App: `resolveConsumption` acepta los tres modos; selector de unidad con «Saco (40 lb)», «Ración (1 lb)», kg… y «= 200 lb» en traslado y baja; Movimientos muestra «5 sacos (200,000 lb)».
- Pendiente/limitaciones: la presentación convierte con su contenido configurado (no el del lote); sobrante (usa solo base) y entrada directa (ya soporta presentación y unidades de la familia, sin unidades de movimiento) no cambian; sin prueba unitaria de `resolveConsumption`.
