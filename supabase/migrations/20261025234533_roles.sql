create table public.roles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id),
  name text not null,
  session_seconds int check (session_seconds > 0),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (btrim(name) <> '')
);

create unique index roles_name_key on public.roles (owner_id, lower(trim(name))) where deleted_at is null;

create table public.role_company_exclusions (
  role_id uuid not null references public.roles (id),
  company_id uuid not null references public.companies (id),
  primary key (role_id, company_id)
);

create table public.role_permissions (
  role_id uuid not null references public.roles (id),
  module text not null check (module in ('products')),
  can_view boolean not null default false,
  can_create boolean not null default false,
  can_edit boolean not null default false,
  can_delete boolean not null default false,
  primary key (role_id, module),
  check (can_view or not (can_create or can_edit or can_delete))
);

create trigger roles_touch before update on public.roles for each row execute function app.touch_updated_at();

alter table public.roles enable row level security;
alter table public.role_company_exclusions enable row level security;
alter table public.role_permissions enable row level security;

create function app.owns_role(p_role uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select app.is_aal2()
    and app.kind() is not distinct from 'admin'
    and exists (select 1 from public.roles where id = p_role and owner_id = auth.uid())
$$;

revoke execute on function app.owns_role(uuid) from public, anon;
grant execute on function app.owns_role(uuid) to authenticated;

create policy roles_select on public.roles for select to authenticated using (
  owner_id = (select auth.uid()) and (select app.is_aal2()) and (select app.kind()) = 'admin'
);

create policy roles_insert on public.roles for insert to authenticated with check (
  owner_id = (select auth.uid()) and (select app.is_aal2()) and (select app.kind()) = 'admin'
);

create policy roles_update on public.roles for update to authenticated
using (owner_id = (select auth.uid()) and (select app.is_aal2()) and (select app.kind()) = 'admin')
with check (owner_id = (select auth.uid()) and (select app.is_aal2()) and (select app.kind()) = 'admin');

create policy role_company_exclusions_select on public.role_company_exclusions for select to authenticated
using (app.owns_role(role_id));

create policy role_company_exclusions_insert on public.role_company_exclusions for insert to authenticated
with check (app.owns_role(role_id) and app.is_company_admin(company_id));

create policy role_company_exclusions_delete on public.role_company_exclusions for delete to authenticated
using (app.owns_role(role_id));

create policy role_permissions_select on public.role_permissions for select to authenticated
using (app.owns_role(role_id));

create policy role_permissions_insert on public.role_permissions for insert to authenticated
with check (app.owns_role(role_id));

create policy role_permissions_update on public.role_permissions for update to authenticated
using (app.owns_role(role_id))
with check (app.owns_role(role_id));

create policy role_permissions_delete on public.role_permissions for delete to authenticated
using (app.owns_role(role_id));
