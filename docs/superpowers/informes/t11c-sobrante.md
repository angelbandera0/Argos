# T11c: sobrante de conteo como lote de origen adjustment

Migración `supabase/migrations/20261107154000_stock_surplus.sql` (sin aplicar; pgTAP `supabase/tests/020_stock_surplus.test.sql`, plan 29, sin ejecutar).

- `lots_origin_check` admite también `'adjustment'`.
- `app.create_lot(uuid, uuid, uuid, text, uuid, numeric, text, numeric, numeric, uuid, date, text, uuid, text, text, text)`: parámetros nuevos `p_reason_code`, `p_reason_text` (default null) escritos en el movimiento; origen `'adjustment'` mapea al tipo `adjustment`. Firma de 14 parámetros eliminada (sin sobrecargas); las llamadas existentes no se rompen. Revoke de execute repetido.
- `public.register_surplus(p_product uuid, p_location uuid, p_qty numeric, p_reason_text text, p_unit_cost numeric default null, p_currency uuid default null) returns uuid`: cantidad en unidad base, lote nuevo de origen adjustment con fecha de hoy y movimiento reason_code `surplus`; permisos adjust_stock/administrador, COST_NOT_ALLOWED sin see_costs; notifica a administradores (stock/surplus) si quien registra no es administrador.
- `register_adjustment` sin cambios.
