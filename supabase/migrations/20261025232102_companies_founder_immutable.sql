create function app.forbid_founder_change()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.founder_id is distinct from old.founder_id then
    raise exception 'companies.founder_id is immutable';
  end if;
  return new;
end;
$$;

create trigger companies_founder_immutable before update of founder_id on public.companies
  for each row execute function app.forbid_founder_change();
