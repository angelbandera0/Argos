# L3 · Selector de lotes en bajas/bandeja, traslado multi-producto, permiso de almacén

- `components/stock/lot-picker.tsx` (nuevo, extraído del traslado): vista previa FIFO, «Elegir lotes» solo con `choose_lot`, aviso+motivo al desviarse, costo por lote solo si llega `unitCost` (canSeeCosts). Lo usan traslado, baja y bandeja.
- Baja (`ops-dialogs`/`ops-actions`): picks + motivo de desviación hacia `writeOffStock` (ya los admitía).
- Bandeja (`attend-dialog`, `solicitudes/actions`): picks + motivo hacia `attendRequestLine`; el RPC `attend_request_line` ya aceptaba picks, sin migración (no se tocó SQL, no se ejecutó test:db).
- Traslado multi-producto: varias líneas (producto+cantidad+lotes) en un diálogo con «Añadir/Quitar producto»; valor trasladado por divisa solo si hay costos (`allocationValue`, nota si hay lotes sin costo). Con detalle de producto sigue una sola línea fija.
- Atomicidad: con >1 línea se valida todo antes (previewConsumption por línea; si alguna falla no se mueve nada). Luego se traslada línea a línea (un RPC por línea); si falla una a mitad (carrera), las anteriores quedan hechas y el error lo dice («Ya se trasladaron N de M»). No es transaccional.
- Permiso: nuevo `canWh` en `requireStockUser` (hasSpecial con `warehouse: true`); `canChooseLot`, `transfer` y `write_off` en existencias y bandeja usan el alcance de almacén, como los casos de uso.
- Pruebas: transfer-logic (allocationValue, transferLinesSchema). `verify:fast` OK (97 archivos, 788 casos). Sin verificación visual.
