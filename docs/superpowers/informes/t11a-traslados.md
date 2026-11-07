# T11a: consumo atómico de lotes y traslados

Migración `supabase/migrations/20261107160000_stock_transfers.sql`; prueba `supabase/tests/018_stock_transfer.test.sql` (37 aserciones). No aplicadas ni ejecutadas (sin acceso a Supabase).

## Firmas
- `app.consume_lots(p_company uuid, p_product uuid, p_location uuid, p_qty numeric, p_picks jsonb, p_type text, p_reason_code text, p_reason_text text, p_doc_type text, p_doc_id uuid, p_choose_allowed boolean, p_deviation_reason text) returns jsonb` (sin execute para public/anon/authenticated). Devuelve `[{lot_id, qty, movement_id, received_at, unit_cost, currency_id}]`.
- `public.register_transfer(p_product uuid, p_from uuid, p_to uuid, p_qty numeric, p_unit text, p_picks jsonb default null, p_deviation_reason text default null, p_doc_type text default null, p_doc_id uuid default null) returns jsonb` -> `{moved_base, moved_unit_qty, lots:[{source_lot, dest_lot, qty}]}`.

## Decisiones
- Desvío = la asignación difiere del PEPS sugerido en cualquier lote (comparación completa); un pick igual al PEPS no cuenta.
- Con desvío y `p_reason_code` informado: se conserva el código del llamador y `reason_text` = `concat_ws(' | ', p_reason_text, 'fifo_deviation: <motivo>')`. Sin código: `reason_code='fifo_deviation'`, `reason_text=p_deviation_reason`.
- Errores añadidos: `DUPLICATE_LOT`, `INVALID_QUANTITY`, `PRODUCT_NOT_STORABLE`. Destino de otra compañía -> `LOCATION_NOT_FOUND`. Orden de validación de picks: LOT_NOT_FOUND, INVALID_QUANTITY, DUPLICATE_LOT, LOT_EXCEEDED, QUANTITY_MISMATCH, CHOOSE_LOT_FORBIDDEN.
- Un lote en la ubicación pero con remaining 0 en picks da LOT_EXCEEDED.
- Permiso se valida antes que destino/unidad; `delete_test_company` y `audit_row` sin cambios.
