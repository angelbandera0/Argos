# T16b · Traslado almacén→tienda

- `TransferDialog`/`TransferButton` (components/stock), lógica en `transfer-logic.ts` (zod, picks, pendiente en milésimas, errores), acciones en `app/(app)/existencias/transfer-actions.ts` (config, previewConsumption, transferStock).
- Un producto por traslado; vista previa FIFO con fecha, disponible y costo solo con `costs` (null = «Sin costo conocido»). «Elegir lotes» solo con `choose_lot`; aviso y motivo opcional al desviarse; el caso de uso decide (CHOOSE_LOT_FORBIDDEN).
- Habilitado en /existencias y detalle; «Dar de baja» sigue «Próximamente».
- Sin hacer: varios productos por traslado, valor trasladado, lote desde solicitud, verificación visual; `canChooseLot` del operador usa el permiso de tienda (la acción valida con alcance de almacén).
- `pnpm verify:fast` OK (87 archivos, 711 casos).
