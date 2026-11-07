create function app.product_has_history(p_product uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (select 1 from public.lots l where l.product_id = p_product)
    or exists (select 1 from public.stock_movements m join public.lots l on l.id = m.lot_id where l.product_id = p_product)
$$;

create or replace function app.guard_base_unit_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if new.base_unit is distinct from old.base_unit and app.product_has_history(old.product_id) then
    raise exception 'BASE_UNIT_LOCKED';
  end if;
  return new;
end;
$$;

revoke execute on function app.product_has_history(uuid) from public, anon;
