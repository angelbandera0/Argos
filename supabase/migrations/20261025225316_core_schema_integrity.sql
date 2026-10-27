create function app.guard_profile_identity()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  company_code text;
begin
  if tg_op = 'UPDATE' and (
    new.kind is distinct from old.kind
    or (old.username is not null and new.username is distinct from old.username)
    or (old.company_id is not null and new.company_id is distinct from old.company_id)
  ) then
    raise exception 'profiles.kind, username and company_id are immutable once set';
  end if;

  if new.kind = 'operator' and new.username is not null and new.company_id is not null then
    select code into company_code from public.companies where id = new.company_id;
    if new.username !~ '^[a-z0-9]{4}\.[a-z0-9_-]{2,24}$'
       or split_part(new.username, '.', 1) is distinct from company_code then
      raise exception 'Operator username must be <company code>.<name> with the code of its company';
    end if;
  end if;

  return new;
end;
$$;

create trigger profiles_guard_identity before insert or update on public.profiles
  for each row execute function app.guard_profile_identity();

create function app.guard_company_founder()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if not exists (select 1 from public.profiles where id = new.founder_id and kind = 'admin') then
    raise exception 'companies.founder_id must reference an admin profile';
  end if;
  return new;
end;
$$;

create trigger companies_guard_founder before insert or update of founder_id on public.companies
  for each row execute function app.guard_company_founder();

create function app.guard_company_admin()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if not exists (select 1 from public.profiles where id = new.admin_id and kind = 'admin') then
    raise exception 'company_admins.admin_id must reference an admin profile';
  end if;
  if not exists (select 1 from public.profiles where id = new.granted_by and kind in ('admin', 'superadmin')) then
    raise exception 'company_admins.granted_by must reference an admin or superadmin profile';
  end if;
  return new;
end;
$$;

create trigger company_admins_guard before insert or update on public.company_admins
  for each row execute function app.guard_company_admin();

alter table public.companies add check (char_length(trim(name)) between 1 and 80);
alter table public.sites add check (char_length(trim(name)) between 1 and 80);
alter table public.stores add check (char_length(trim(name)) between 1 and 80);

revoke truncate, references, trigger
  on public.profiles, public.companies, public.company_admins, public.sites, public.stores
  from anon, authenticated;
