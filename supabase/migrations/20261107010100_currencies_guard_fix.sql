create or replace function app.guard_currency_delete()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if old.deleted_at is null and new.deleted_at is not null
     and app.currency_in_use(case when tg_table_name = 'currencies' then old.id else (to_jsonb(old) ->> 'currency_id')::uuid end) then
    raise exception 'CURRENCY_IN_USE';
  end if;
  return new;
end;
$$;
