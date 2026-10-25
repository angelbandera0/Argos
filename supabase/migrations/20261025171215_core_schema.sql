create schema if not exists app;

create type public.profile_kind as enum ('superadmin', 'admin', 'operator');
create type public.org_status as enum ('active', 'inactive');
create type public.profile_status as enum ('active', 'locked', 'deactivated');

create function app.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  kind public.profile_kind not null,
  username text,
  display_name text not null,
  company_id uuid,
  status public.profile_status not null default 'active',
  must_change_password boolean not null default false,
  failed_pin_attempts int not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, company_id),
  check (username = lower(username)),
  check (
    case when kind = 'operator'
      then company_id is not null and username is not null
      else company_id is null and username is null
    end
  )
);

create unique index profiles_username_key on public.profiles (lower(username)) where username is not null;
create unique index profiles_single_superadmin on public.profiles (kind) where kind = 'superadmin';

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique check (code ~ '^[a-z0-9]{4}$'),
  founder_id uuid not null references public.profiles (id),
  status public.org_status not null default 'active',
  status_reason_code text,
  status_reason_text text,
  status_changed_by uuid,
  status_changed_at timestamptz,
  session_cap_seconds int not null default 86400 check (session_cap_seconds between 1 and 86400),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add foreign key (company_id) references public.companies (id) on delete restrict;

create table public.company_admins (
  company_id uuid not null references public.companies (id),
  admin_id uuid not null references public.profiles (id),
  granted_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  primary key (company_id, admin_id)
);

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  name text not null,
  status public.org_status not null default 'active',
  status_reason_code text,
  status_reason_text text,
  status_changed_by uuid,
  status_changed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, company_id)
);

create unique index sites_name_key on public.sites (company_id, lower(trim(name))) where deleted_at is null;

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  site_id uuid not null,
  name text not null,
  status public.org_status not null default 'active',
  status_reason_code text,
  status_reason_text text,
  status_changed_by uuid,
  status_changed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, company_id),
  foreign key (site_id, company_id) references public.sites (id, company_id)
);

create unique index stores_name_key on public.stores (site_id, lower(trim(name))) where deleted_at is null;

create trigger profiles_touch before update on public.profiles for each row execute function app.touch_updated_at();
create trigger companies_touch before update on public.companies for each row execute function app.touch_updated_at();
create trigger sites_touch before update on public.sites for each row execute function app.touch_updated_at();
create trigger stores_touch before update on public.stores for each row execute function app.touch_updated_at();

create function app.forbid_code_change()
returns trigger
language plpgsql
as $$
begin
  if new.code is distinct from old.code then
    raise exception 'companies.code is immutable';
  end if;
  return new;
end;
$$;

create trigger companies_code_immutable before update on public.companies
  for each row execute function app.forbid_code_change();

create function app.generate_company_code()
returns text
language plpgsql
set search_path = pg_catalog
as $$
declare
  alphabet constant text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  candidate text;
begin
  loop
    candidate := '';
    for i in 1..4 loop
      candidate := candidate || substr(alphabet, 1 + get_byte(uuid_send(gen_random_uuid()), 0) % 36, 1);
    end loop;
    exit when not exists (select 1 from public.companies where code = candidate);
  end loop;
  return candidate;
end;
$$;

create function public.create_company(p_name text)
returns public.companies
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  actor uuid := auth.uid();
  clean_name text := trim(p_name);
  created public.companies;
begin
  if not exists (
    select 1 from public.profiles
    where id = actor and kind = 'admin' and status = 'active' and deleted_at is null
  ) then
    raise exception 'Only an active administrator can create companies';
  end if;

  if clean_name is null or char_length(clean_name) not between 1 and 80 then
    raise exception 'Company name must be between 1 and 80 characters';
  end if;

  insert into public.companies (name, code, founder_id)
  values (clean_name, app.generate_company_code(), actor)
  returning * into created;

  insert into public.company_admins (company_id, admin_id, granted_by)
  values (created.id, actor, actor);

  return created;
end;
$$;

revoke all on function public.create_company(text) from public, anon;
grant execute on function public.create_company(text) to authenticated;

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_admins enable row level security;
alter table public.sites enable row level security;
alter table public.stores enable row level security;
