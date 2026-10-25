create function app.kind()
returns text
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select kind::text from public.profiles
  where id = auth.uid() and status = 'active' and deleted_at is null
$$;

create function app.is_aal2()
returns boolean
language sql
stable
set search_path = pg_catalog
as $$
  select coalesce(auth.jwt() ->> 'aal' = 'aal2', false)
$$;

create function app.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select app.is_aal2() and app.kind() is not distinct from 'superadmin'
$$;

create function app.is_company_admin(p_company uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select app.is_superadmin() or (
    app.is_aal2()
    and app.kind() is not distinct from 'admin'
    and exists (
      select 1 from public.company_admins
      where company_id = p_company and admin_id = auth.uid()
    )
  )
$$;

create function app.operator_company()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select company_id from public.profiles
  where id = auth.uid() and kind = 'operator' and status = 'active' and deleted_at is null
$$;

revoke execute on all functions in schema app from public, anon;
grant usage on schema app to authenticated;
grant execute on function app.kind(), app.is_aal2(), app.is_superadmin(), app.is_company_admin(uuid), app.operator_company() to authenticated;

create policy profiles_select on public.profiles for select to authenticated using (
  id = (select auth.uid())
  or (select app.is_superadmin())
  or (kind = 'operator' and app.is_company_admin(company_id))
  or (kind = 'admin' and exists (
    select 1 from public.company_admins ca
    where ca.admin_id = profiles.id and app.is_company_admin(ca.company_id)
  ))
);

create policy profiles_insert on public.profiles for insert to authenticated with check (
  (kind = 'admin' and (select app.is_superadmin()))
  or (kind = 'operator' and (select app.kind()) = 'admin' and app.is_company_admin(company_id))
);

create policy profiles_update on public.profiles for update to authenticated
using (
  (kind = 'admin' and (select app.is_superadmin()))
  or (kind = 'operator' and app.is_company_admin(company_id))
)
with check (
  (kind = 'admin' and (select app.is_superadmin()))
  or (kind = 'operator' and app.is_company_admin(company_id))
);

create policy companies_select on public.companies for select to authenticated using (
  app.is_company_admin(id) or id = (select app.operator_company())
);

create policy companies_update on public.companies for update to authenticated
using (app.is_company_admin(id))
with check (app.is_company_admin(id));

create policy company_admins_select on public.company_admins for select to authenticated using (
  app.is_company_admin(company_id)
);

create policy company_admins_insert on public.company_admins for insert to authenticated with check (
  app.is_company_admin(company_id) and granted_by = (select auth.uid())
);

create policy company_admins_delete on public.company_admins for delete to authenticated using (
  exists (
    select 1 from public.companies c
    where c.id = company_admins.company_id
      and c.founder_id <> company_admins.admin_id
      and ((select app.is_superadmin()) or (c.founder_id = (select auth.uid()) and app.is_company_admin(c.id)))
  )
);

create policy sites_select on public.sites for select to authenticated using (app.is_company_admin(company_id));

create policy sites_insert on public.sites for insert to authenticated with check (
  (select app.kind()) = 'admin' and app.is_company_admin(company_id)
);

create policy sites_update on public.sites for update to authenticated
using (app.is_company_admin(company_id))
with check (app.is_company_admin(company_id));

create policy stores_select on public.stores for select to authenticated using (app.is_company_admin(company_id));

create policy stores_insert on public.stores for insert to authenticated with check (
  (select app.kind()) = 'admin' and app.is_company_admin(company_id)
);

create policy stores_update on public.stores for update to authenticated
using (app.is_company_admin(company_id))
with check (app.is_company_admin(company_id));
