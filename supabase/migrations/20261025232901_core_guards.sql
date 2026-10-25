create function app.has_data(p_level text, p_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog
as $$
begin
  case p_level
    when 'company' then
      return exists (select 1 from public.sites where company_id = p_id and deleted_at is null)
        or exists (select 1 from public.profiles where company_id = p_id and deleted_at is null);
    when 'site' then
      return exists (select 1 from public.stores where site_id = p_id and deleted_at is null);
    when 'store' then
      return false;
    else
      raise exception 'Unknown level %', p_level;
  end case;
end;
$$;

create function app.is_operational(p_store uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from public.stores st
    join public.sites si on si.id = st.site_id
    join public.companies c on c.id = st.company_id
    where st.id = p_store
      and st.status = 'active' and st.deleted_at is null
      and si.status = 'active' and si.deleted_at is null
      and c.status = 'active' and c.deleted_at is null
  )
$$;

create function app.guard_org_actor()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  cid uuid := case tg_table_name when 'companies' then new.id else new.company_id end;
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

create function app.guard_org_delete()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if old.deleted_at is null and new.deleted_at is not null
     and app.has_data(case tg_table_name when 'companies' then 'company' when 'sites' then 'site' else 'store' end, new.id) then
    raise exception 'HAS_DATA';
  end if;
  return new;
end;
$$;

create function app.guard_org_status_reason()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'inactive' then
      if coalesce(trim(new.status_reason_code), '') = '' then
        raise exception 'A reason code is required to deactivate';
      end if;
      if new.status_reason_code = 'otro' and coalesce(trim(new.status_reason_text), '') = '' then
        raise exception 'A reason text is required when the reason is otro';
      end if;
    else
      new.status_reason_code := null;
      new.status_reason_text := null;
    end if;
    new.status_changed_by := auth.uid();
    new.status_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger companies_guard_actor before update on public.companies
  for each row execute function app.guard_org_actor();
create trigger companies_guard_delete before update of deleted_at on public.companies
  for each row execute function app.guard_org_delete();
create trigger companies_guard_reason before update of status on public.companies
  for each row execute function app.guard_org_status_reason();

create trigger sites_guard_actor before update on public.sites
  for each row execute function app.guard_org_actor();
create trigger sites_guard_delete before update of deleted_at on public.sites
  for each row execute function app.guard_org_delete();
create trigger sites_guard_reason before update of status on public.sites
  for each row execute function app.guard_org_status_reason();

create trigger stores_guard_actor before update on public.stores
  for each row execute function app.guard_org_actor();
create trigger stores_guard_delete before update of deleted_at on public.stores
  for each row execute function app.guard_org_delete();
create trigger stores_guard_reason before update of status on public.stores
  for each row execute function app.guard_org_status_reason();

create function app.guard_founder_admin_row()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if exists (select 1 from public.companies where id = old.company_id and founder_id = old.admin_id) then
    raise exception 'The founder cannot be removed from company_admins';
  end if;
  return old;
end;
$$;

create trigger company_admins_guard_founder before delete on public.company_admins
  for each row execute function app.guard_founder_admin_row();

create function app.guard_founder_profile()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if ((new.deleted_at is not null and old.deleted_at is null)
      or (new.status = 'deactivated' and old.status <> 'deactivated'))
     and exists (select 1 from public.companies where founder_id = new.id) then
    raise exception 'A company founder cannot be deleted or deactivated';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_founder before update of status, deleted_at on public.profiles
  for each row execute function app.guard_founder_profile();

revoke execute on function app.has_data(text, uuid), app.is_operational(uuid) from public, anon;
grant execute on function app.is_operational(uuid) to authenticated;
