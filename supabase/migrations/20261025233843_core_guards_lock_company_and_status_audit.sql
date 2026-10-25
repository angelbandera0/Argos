create or replace function app.guard_org_actor()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  cid uuid := (to_jsonb(old) ->> case tg_table_name when 'companies' then 'id' else 'company_id' end)::uuid;
begin
  if (new.status is distinct from old.status or new.deleted_at is distinct from old.deleted_at)
     and auth.uid() is not null
     and not (
       app.is_superadmin()
       or (app.is_aal2() and exists (
         select 1 from public.companies where id = cid and founder_id = auth.uid()
       ))
     ) then
    raise exception 'Only the company founder or the superadmin can change status or delete'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create function app.guard_site_company_immutable()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception 'sites.company_id is immutable';
end;
$$;

create trigger sites_company_immutable before update of company_id on public.sites
  for each row when (new.company_id is distinct from old.company_id)
  execute function app.guard_site_company_immutable();

create or replace function app.guard_org_status_reason()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    new.status_reason_code := old.status_reason_code;
    new.status_reason_text := old.status_reason_text;
    new.status_changed_by := old.status_changed_by;
    new.status_changed_at := old.status_changed_at;
    return new;
  end if;

  if new.status = 'inactive' then
    if coalesce(trim(new.status_reason_code), '') = '' then
      raise exception 'A reason code is required to deactivate';
    end if;
    if new.status_reason_code = 'otro' and coalesce(trim(new.status_reason_text), '') = '' then
      raise exception 'A reason text is required when the reason is otro';
    end if;
    new.status_changed_by := auth.uid();
    new.status_changed_at := now();
  else
    new.status_reason_code := null;
    new.status_reason_text := null;
    if tg_op = 'INSERT' then
      new.status_changed_by := null;
      new.status_changed_at := null;
    else
      new.status_changed_by := auth.uid();
      new.status_changed_at := now();
    end if;
  end if;
  return new;
end;
$$;

drop trigger companies_guard_reason on public.companies;
drop trigger sites_guard_reason on public.sites;
drop trigger stores_guard_reason on public.stores;

create trigger companies_guard_reason before insert or update on public.companies
  for each row execute function app.guard_org_status_reason();
create trigger sites_guard_reason before insert or update on public.sites
  for each row execute function app.guard_org_status_reason();
create trigger stores_guard_reason before insert or update on public.stores
  for each row execute function app.guard_org_status_reason();
