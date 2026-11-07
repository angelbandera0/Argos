create function app.product_label(p_product uuid)
returns text
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select p.name from public.products p
  where p.id = p_product and (app.is_company_admin(p.company_id) or app.can(p.company_id, 'stock', 'view'))
$$;

create function app.product_category_id(p_product uuid)
returns uuid
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select p.category_id from public.products p
  where p.id = p_product and (app.is_company_admin(p.company_id) or app.can(p.company_id, 'stock', 'view'))
$$;

create function app.product_category_label(p_product uuid)
returns text
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select c.name from public.products p
  join public.categories c on c.id = p.category_id and c.company_id = p.company_id
  where p.id = p_product and (app.is_company_admin(p.company_id) or app.can(p.company_id, 'stock', 'view'))
$$;

revoke execute on function app.product_label(uuid), app.product_category_id(uuid), app.product_category_label(uuid) from public, anon;
grant execute on function app.product_label(uuid), app.product_category_id(uuid), app.product_category_label(uuid) to authenticated;

create or replace view public.stock_status with (security_invoker = true) as
select x.company_id, x.product_id, x.location_id, x.quantity, x.minimum, app.stock_status(x.quantity, x.minimum) as status,
  app.product_label(x.product_id) as product_name, app.product_category_id(x.product_id) as category_id,
  app.product_category_label(x.product_id) as category_name
from (
  select coalesce(q.company_id, m.company_id) as company_id, coalesce(q.product_id, m.product_id) as product_id,
    coalesce(q.location_id, m.location_id) as location_id, coalesce(q.quantity, 0)::numeric(14, 3) as quantity, m.minimum
  from (
    select l.company_id, l.product_id, l.location_id, sum(l.remaining) as quantity
    from public.lots l group by l.company_id, l.product_id, l.location_id
  ) q
  full join public.stock_minimums m on m.product_id = q.product_id and m.location_id = q.location_id
) x
join public.product_stock_settings s on s.product_id = x.product_id and s.company_id = x.company_id and s.storable;
