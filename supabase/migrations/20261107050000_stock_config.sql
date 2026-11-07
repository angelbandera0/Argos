alter table public.products add constraint products_id_company_key unique (id, company_id);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  kind text not null check (kind in ('warehouse', 'store')),
  store_id uuid,
  name text not null check (char_length(trim(name)) between 1 and 80),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (id, company_id),
  check ((kind = 'warehouse' and store_id is null) or (kind = 'store' and store_id is not null)),
  foreign key (store_id, company_id) references public.stores (id, company_id)
);

create unique index locations_warehouse_key on public.locations (company_id) where kind = 'warehouse';
create unique index locations_store_key on public.locations (store_id) where kind = 'store';

create table public.product_stock_settings (
  product_id uuid primary key,
  company_id uuid not null references public.companies (id),
  storable boolean not null default false,
  base_unit text not null default 'lb' check (base_unit in ('lb', 'kg', 'g', 'oz', 'l', 'ml', 'u')),
  magnitude text generated always as (
    case when base_unit in ('lb', 'kg', 'g', 'oz') then 'weight' when base_unit in ('l', 'ml') then 'volume' else 'count' end
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (product_id, company_id) references public.products (id, company_id)
);

create table public.product_presentations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  product_id uuid not null,
  name text not null check (char_length(trim(name)) between 1 and 60),
  content numeric(14, 3) not null check (content > 0),
  active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (product_id, company_id) references public.products (id, company_id)
);

create table public.product_movement_units (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  product_id uuid not null,
  name text not null check (char_length(trim(name)) between 1 and 60),
  equivalence numeric(14, 3) not null check (equivalence > 0),
  active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (product_id, company_id) references public.products (id, company_id)
);

create unique index product_presentations_name_key on public.product_presentations (product_id, lower(trim(name))) where deleted_at is null;
create unique index product_movement_units_name_key on public.product_movement_units (product_id, lower(trim(name))) where deleted_at is null;

create table public.stock_minimums (
  product_id uuid not null,
  location_id uuid not null,
  company_id uuid not null references public.companies (id),
  minimum numeric(14, 3) not null check (minimum >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (product_id, location_id),
  foreign key (product_id, company_id) references public.products (id, company_id),
  foreign key (location_id, company_id) references public.locations (id, company_id)
);

create index stock_minimums_location_idx on public.stock_minimums (location_id);

create trigger product_stock_settings_touch before update on public.product_stock_settings for each row execute function app.touch_updated_at();
create trigger product_presentations_touch before update on public.product_presentations for each row execute function app.touch_updated_at();
create trigger product_movement_units_touch before update on public.product_movement_units for each row execute function app.touch_updated_at();
create trigger stock_minimums_touch before update on public.stock_minimums for each row execute function app.touch_updated_at();

create function app.product_has_stock(p_product uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select false -- se amplía en T10 con lotes
$$;

create function app.guard_base_unit_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if new.base_unit is distinct from old.base_unit and app.product_has_stock(old.product_id) then
    raise exception 'BASE_UNIT_IN_USE';
  end if;
  return new;
end;
$$;

create function app.guard_location_immutable()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.company_id is distinct from old.company_id or new.kind is distinct from old.kind
     or new.store_id is distinct from old.store_id then
    raise exception 'LOCATION_IMMUTABLE' using errcode = '42501';
  end if;
  return new;
end;
$$;

create function app.guard_stock_company()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.company_id is distinct from old.company_id then
    raise exception 'COMPANY_IMMUTABLE' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger product_stock_settings_base_unit_guard before update of base_unit on public.product_stock_settings
  for each row execute function app.guard_base_unit_change();
create trigger locations_immutable_guard before update on public.locations
  for each row execute function app.guard_location_immutable();
create trigger product_stock_settings_company_guard before update on public.product_stock_settings
  for each row execute function app.guard_stock_company();
create trigger product_presentations_company_guard before update on public.product_presentations
  for each row execute function app.guard_stock_company();
create trigger product_movement_units_company_guard before update on public.product_movement_units
  for each row execute function app.guard_stock_company();
create trigger stock_minimums_company_guard before update on public.stock_minimums
  for each row execute function app.guard_stock_company();

create function app.create_company_location()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  insert into public.locations (company_id, kind, name) values (new.id, 'warehouse', 'Almacén general');
  return null;
end;
$$;

create function app.create_store_location()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  insert into public.locations (company_id, kind, store_id, name, active)
  values (new.company_id, 'store', new.id, new.name, new.status = 'active' and new.deleted_at is null);
  return null;
end;
$$;

create function app.sync_store_location()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  update public.locations
  set name = new.name, active = new.status = 'active' and new.deleted_at is null
  where store_id = new.id and kind = 'store';
  return null;
end;
$$;

create trigger companies_location after insert on public.companies
  for each row execute function app.create_company_location();
create trigger stores_location after insert on public.stores
  for each row execute function app.create_store_location();
create trigger stores_location_sync after update of name, status, deleted_at on public.stores
  for each row execute function app.sync_store_location();

insert into public.locations (company_id, kind, name)
select c.id, 'warehouse', 'Almacén general' from public.companies c
where not exists (select 1 from public.locations l where l.company_id = c.id and l.kind = 'warehouse');
insert into public.locations (company_id, kind, store_id, name, active)
select s.company_id, 'store', s.id, s.name, s.status = 'active' and s.deleted_at is null from public.stores s
where not exists (select 1 from public.locations l where l.store_id = s.id and l.kind = 'store');

create function app.can_see_location(p_location uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1 from public.locations l
    where l.id = p_location
      and (
        app.is_company_admin(l.company_id)
        or (app.can(l.company_id, 'stock', 'view') and (l.kind = 'warehouse' or l.store_id = app.active_store()))
      )
  )
$$;

create function app.can_configure_minimums(p_location uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1 from public.locations l
    where l.id = p_location
      and case l.kind
        when 'store' then app.has_special_in_store('configure_minimums', l.store_id)
        else app.has_special_warehouse('configure_minimums', l.company_id)
      end
  )
$$;

revoke execute on function app.product_has_stock(uuid), app.guard_base_unit_change(), app.guard_location_immutable(),
  app.guard_stock_company(), app.create_company_location(), app.create_store_location(), app.sync_store_location()
  from public, anon, authenticated;
revoke execute on function app.can_see_location(uuid), app.can_configure_minimums(uuid) from public, anon;
grant execute on function app.can_see_location(uuid), app.can_configure_minimums(uuid) to authenticated;

create or replace function app.audit_row()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  o jsonb;
  n jsonb := to_jsonb(new) - 'failed_pin_attempts' - 'must_change_password';
  act text;
  uid uuid := auth.uid();
  client text := auth.jwt() ->> 'client_id';
begin
  if tg_op = 'INSERT' then
    act := 'create';
  else
    o := to_jsonb(old) - 'failed_pin_attempts' - 'must_change_password';
    if (o - 'updated_at') = (n - 'updated_at') then
      return null;
    end if;
    if o ->> 'deleted_at' is null and n ->> 'deleted_at' is not null then
      act := 'delete';
    elsif o ->> 'status' is distinct from n ->> 'status' then
      act := case when n ->> 'status' in ('inactive', 'locked', 'deactivated') then 'deactivate' else 'reactivate' end;
    elsif o ->> 'active' is distinct from n ->> 'active' then
      act := case when n ->> 'active' = 'false' then 'deactivate' else 'reactivate' end;
    else
      act := 'update';
    end if;
  end if;

  insert into public.audit_log (company_id, module, entity_type, entity_id, action, actor_id, store_id, channel, before, after)
  values (
    case tg_table_name when 'companies' then (n ->> 'id')::uuid else (n ->> 'company_id')::uuid end,
    case tg_table_name
      when 'categories' then 'products'
      when 'products' then 'products'
      when 'currencies' then 'currencies'
      when 'currency_denominations' then 'currencies'
      when 'product_stock_settings' then 'stock'
      when 'product_presentations' then 'stock'
      when 'product_movement_units' then 'stock'
      when 'stock_minimums' then 'stock'
      when 'roles' then 'roles'
      when 'role_permissions' then 'roles'
      when 'role_special_permissions' then 'roles'
      when 'role_company_exclusions' then 'roles'
      when 'profiles' then 'users'
      when 'user_stores' then 'users'
      else 'organization'
    end,
    tg_table_name,
    (case tg_table_name
      when 'company_admins' then n ->> 'admin_id'
      when 'role_permissions' then n ->> 'role_id'
      when 'role_special_permissions' then n ->> 'role_id'
      when 'role_company_exclusions' then n ->> 'role_id'
      when 'user_stores' then n ->> 'user_id'
      when 'product_stock_settings' then n ->> 'product_id'
      when 'stock_minimums' then n ->> 'product_id'
      else n ->> 'id'
    end)::uuid,
    act,
    uid,
    (select s.active_store_id from public.app_sessions s
      where s.session_id = (auth.jwt() ->> 'session_id')::uuid and s.user_id = uid),
    case when uid is null then 'system' when client is null then 'ui' else 'api' end,
    o,
    n
  );
  return null;
end;
$$;

create trigger audit_product_stock_settings after insert or update on public.product_stock_settings for each row execute function app.audit_row();
create trigger audit_product_presentations after insert or update on public.product_presentations for each row execute function app.audit_row();
create trigger audit_product_movement_units after insert or update on public.product_movement_units for each row execute function app.audit_row();
create trigger audit_stock_minimums after insert or update on public.stock_minimums for each row execute function app.audit_row();

alter table public.locations enable row level security;
alter table public.product_stock_settings enable row level security;
alter table public.product_presentations enable row level security;
alter table public.product_movement_units enable row level security;
alter table public.stock_minimums enable row level security;

create policy locations_select on public.locations for select to authenticated
using (app.can_see_location(id));

create policy product_stock_settings_select on public.product_stock_settings for select to authenticated using (
  app.is_company_admin(company_id) or app.can(company_id, 'stock', 'view') or app.has_special_warehouse('configure_units', company_id)
);
create policy product_stock_settings_insert on public.product_stock_settings for insert to authenticated
with check (app.has_special_warehouse('configure_units', company_id));
create policy product_stock_settings_update on public.product_stock_settings for update to authenticated
using (app.has_special_warehouse('configure_units', company_id))
with check (app.has_special_warehouse('configure_units', company_id));

create policy product_presentations_select on public.product_presentations for select to authenticated using (
  app.has_special_warehouse('configure_units', company_id)
  or (deleted_at is null and (app.is_company_admin(company_id) or app.can(company_id, 'stock', 'view')))
);
create policy product_presentations_insert on public.product_presentations for insert to authenticated
with check (deleted_at is null and app.has_special_warehouse('configure_units', company_id));
create policy product_presentations_update on public.product_presentations for update to authenticated
using (app.has_special_warehouse('configure_units', company_id))
with check (app.has_special_warehouse('configure_units', company_id));

create policy product_movement_units_select on public.product_movement_units for select to authenticated using (
  app.has_special_warehouse('configure_units', company_id)
  or (deleted_at is null and (app.is_company_admin(company_id) or app.can(company_id, 'stock', 'view')))
);
create policy product_movement_units_insert on public.product_movement_units for insert to authenticated
with check (deleted_at is null and app.has_special_warehouse('configure_units', company_id));
create policy product_movement_units_update on public.product_movement_units for update to authenticated
using (app.has_special_warehouse('configure_units', company_id))
with check (app.has_special_warehouse('configure_units', company_id));

create policy stock_minimums_select on public.stock_minimums for select to authenticated
using (app.can_see_location(location_id) or app.can_configure_minimums(location_id));
create policy stock_minimums_insert on public.stock_minimums for insert to authenticated
with check (app.can_configure_minimums(location_id));
create policy stock_minimums_update on public.stock_minimums for update to authenticated
using (app.can_configure_minimums(location_id))
with check (app.can_configure_minimums(location_id));

revoke all on public.locations, public.product_stock_settings, public.product_presentations,
  public.product_movement_units, public.stock_minimums from anon, authenticated;
grant select on public.locations, public.product_stock_settings, public.product_presentations,
  public.product_movement_units, public.stock_minimums to authenticated;
grant insert (product_id, company_id, storable, base_unit) on public.product_stock_settings to authenticated;
grant update (storable, base_unit) on public.product_stock_settings to authenticated;
grant insert (company_id, product_id, name, content, active) on public.product_presentations to authenticated;
grant update (name, content, active, deleted_at) on public.product_presentations to authenticated;
grant insert (company_id, product_id, name, equivalence, active) on public.product_movement_units to authenticated;
grant update (name, equivalence, active, deleted_at) on public.product_movement_units to authenticated;
grant insert (product_id, location_id, company_id, minimum) on public.stock_minimums to authenticated;
grant update (minimum) on public.stock_minimums to authenticated;

create or replace function public.delete_test_company(p_company uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if not exists (select 1 from public.companies where id = p_company and name like 'itest-%') then
    raise exception 'Only existing itest- companies can be deleted';
  end if;

  perform set_config('session_replication_role', 'replica', true);

  delete from public.app_sessions where user_id in (select id from public.profiles where company_id = p_company);
  delete from public.user_stores where company_id = p_company;
  delete from public.stock_minimums where company_id = p_company;
  delete from public.product_movement_units where company_id = p_company;
  delete from public.product_presentations where company_id = p_company;
  delete from public.product_stock_settings where company_id = p_company;
  delete from public.locations where company_id = p_company;
  delete from public.notifications where company_id = p_company;
  delete from public.currency_denominations where company_id = p_company;
  delete from public.currencies where company_id = p_company;
  delete from public.products where company_id = p_company;
  delete from public.categories where company_id = p_company;
  delete from public.stores where company_id = p_company;
  delete from public.sites where company_id = p_company;
  delete from public.role_company_exclusions where company_id = p_company;
  delete from public.company_admins where company_id = p_company;
  delete from public.companies where id = p_company;

  perform set_config('session_replication_role', 'origin', true);
end;
$$;
