# T10a: lotes, libro de movimientos y costos protegidos

Migración `supabase/migrations/20261107160000_stock_ledger.sql`; pgTAP `supabase/tests/016_stock_ledger.test.sql` (43 aserciones). Sin aplicar (el controlador ejecuta `pnpm db:apply`).

- Tablas: `lots`, `lot_costs`, `stock_movements`, `movement_costs` (RLS, solo select para authenticated). Vista `public.stock_levels(company_id, product_id, location_id, quantity)` con `security_invoker`.
- Lectura: lots y stock_movements con `app.can_see_location(location_id)`; costos con `app.is_company_admin(company_id)` o (`app.has_special('see_costs')` y `company_id = app.operator_company()`).
- Triggers: `app.guard_ledger_immutable()` (MOVEMENT_IMMUTABLE, 42501, update/delete en movimientos y costos), `app.guard_lot_immutable()` (LOT_IMMUTABLE; solo `remaining` cambia).
- `app.create_lot(p_company uuid, p_product uuid, p_location uuid, p_origin text, p_source_lot uuid, p_captured_qty numeric, p_captured_unit text, p_content numeric, p_unit_cost numeric, p_currency uuid, p_received date, p_doc_type text default null, p_doc_id uuid default null, p_type text default null) returns uuid`. Errores (P0001): PRODUCT_NOT_STORABLE, INVALID_LOCATION, INVALID_QUANTITY, INVALID_CONTENT, INVALID_COST, INVALID_CURRENCY, INVALID_SOURCE_LOT. `p_unit_cost` es por unidad base; null = sin costo conocido. `created_by`/`actor_id` son nulos si no hay `auth.uid()`.
- Redefinidas: `app.product_has_stock`, `app.currency_in_use`, `app.audit_row` (+ `stock_movements` -> módulo stock, trigger `audit_stock_movements` AFTER INSERT), `public.delete_test_company` (desactiva los triggers de inmutabilidad mientras borra).
- Nota: T11 que descuente `remaining` y deba corregir lo hará con security definer (no hay update directo para authenticated).
