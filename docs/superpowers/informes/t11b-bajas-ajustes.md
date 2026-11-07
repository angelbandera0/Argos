# T11b: motivos de baja, bajas y ajustes

Migración: `supabase/migrations/20261107160000_write_offs_adjustments.sql` (pendiente de `pnpm db:apply`). Prueba: `supabase/tests/019_stock_writeoff_adjust.test.sql` (65 aserciones, sin ejecutar).

- `public.write_off_reasons`: sembrada por trigger en `companies` (7 estándar; `other` con `requires_text`) y backfill. Triggers: estándar no se renombra ni se elimina, `other` no se desactiva. Admin inserta (company_id, code, name, active) y actualiza (name, active, deleted_at); lectura: admin, `write_off` o `stock` ver. Auditada (módulo stock).
- `public.register_write_off(p_product uuid, p_location uuid, p_qty numeric, p_unit text, p_reason uuid, p_reason_text text default null, p_picks jsonb default null, p_deviation_reason text default null) returns jsonb` -> `{removed_base, lots:[{lot_id, qty, movement_id}]}`. Errores: FORBIDDEN, LOCATION_NOT_FOUND, PRODUCT_NOT_STORABLE, INVALID_QUANTITY, INVALID_UNIT, INVALID_REASON, REASON_TEXT_REQUIRED, más los de `app.consume_lots`. Con desvío PEPS y motivo, el reason_code queda como el del motivo y el texto añade `fifo_deviation: ...`.
- `public.register_adjustment(p_lot uuid, p_delta numeric, p_reason_text text, p_reverses uuid default null, p_doc_type text default null, p_doc_id uuid default null) returns uuid` (id del movimiento). Errores: LOT_NOT_FOUND, FORBIDDEN, INVALID_QUANTITY, REASON_TEXT_REQUIRED, INSUFFICIENT_STOCK, ADJUST_EXCEEDS_LOT, INVALID_REVERSES.
- `app.audit_row` redefinida (+ `write_off_reasons`), `delete_test_company` borra los motivos.
