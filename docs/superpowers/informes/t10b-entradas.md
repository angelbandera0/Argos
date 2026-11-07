# T10b: entradas inicial y directa

Migración `supabase/migrations/20261107170000_stock_entries.sql`; pgTAP `supabase/tests/017_stock_entries.test.sql` (29 aserciones). Sin aplicar ni ejecutar (el controlador lo hace).

- `public.register_initial_entry(p_product uuid, p_location uuid, p_qty numeric, p_unit text, p_content numeric, p_unit_cost numeric default null, p_currency uuid default null, p_received date default current_date) returns uuid`: solo ubicación warehouse (NOT_WAREHOUSE); permiso admin de la compañía o `has_special_warehouse('initial_entry')`; origin 'initial_entry'; notifica a administradores (stock/initial_entry, sin costos) si quien llama no es administrador.
- `public.register_direct_entry(` mismos parámetros `) returns uuid`: solo store (NOT_STORE); admin o `has_special_in_store('direct_store_entry', store)`; origin 'direct_entry'; sin notificación.
- Errores: LOCATION_NOT_FOUND (P0001), FORBIDDEN y COST_NOT_ALLOWED (42501), más los de `app.create_lot`. Costo solo para admin de la compañía o operador de la compañía con `see_costs`. Compañía siempre de la ubicación; bloqueo `for update` sobre `product_stock_settings` del producto.
- Ejecución: revoke public/anon, grant authenticated.
