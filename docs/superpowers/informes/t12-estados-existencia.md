# T12 · Estados de existencia y avisos

Migración `supabase/migrations/20261107190000_stock_status.sql` (renombrar con `pnpm db:apply`); prueba `supabase/tests/021_stock_status.test.sql` (53). Sin aplicar ni ejecutar (sin acceso a Supabase).

- `app.stock_status(p_qty numeric, p_min numeric) returns text` (immutable; 'out' si <= 0, 'low' si min no nulo y qty <= min, si no 'normal'). Sin execute para public/anon/authenticated.
- `app.stock_total(p_product uuid, p_location uuid) returns numeric(14,3)` (definer; suma de `remaining`, 0 si no hay). Sin execute.
- `public.stock_status` (vista `security_invoker`): company_id, product_id, location_id, quantity, minimum, status; productos `storable` con lotes o mínimo en la ubicación; select a authenticated; sin costos.
- `app.notify_stock_status(p_company, p_product, p_location, p_before numeric) returns void` (definer, sin execute): avisa solo al empeorar. Tienda: `p_store`=tienda, `p_module_perm 'stock.view'`, admins. Almacén: `p_store null`, `p_special 'handle_requests'`, `p_warehouse true`, admins. Operaciones `low_stock` (warning) / `out_of_stock` (urgent), enlace `/existencias`, cuerpo sin costos.
- Redefinidas (create or replace, firmas/permisos iguales): `app.consume_lots` (before tras el bloqueo; aviso antes del return, cubre register_transfer y register_write_off sin cambios) y `public.register_adjustment` (aviso solo si p_delta < 0).
