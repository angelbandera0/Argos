create or replace function app.guard_storable_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if old.storable and not new.storable and app.product_has_history(old.product_id) then
    raise exception 'STORABLE_LOCKED';
  end if;
  return new;
end;
$$;

revoke execute on function app.guard_storable_change() from public, anon;

create trigger product_stock_settings_storable_guard before update of storable on public.product_stock_settings
  for each row execute function app.guard_storable_change();
