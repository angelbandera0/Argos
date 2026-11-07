# T14 prep: stock_status con nombres

- Migración `20261107200100_stock_status_names.sql`: `app.product_label`, `app.product_category_id`, `app.product_category_label` (security definer; solo admin de la compañía o `stock` ver) y vista recreada con `product_name`, `category_id`, `category_name` al final.
- Prueba `022_stock_status_names.test.sql` (20 aserciones). En `021` el conteo de columnas pasa de 6 a 9.
- No aplicado ni ejecutado (sin acceso a Supabase): el controlador debe correr `pnpm db:apply` y `pnpm test:db`.
