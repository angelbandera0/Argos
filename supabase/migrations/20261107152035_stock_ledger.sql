create table public.lots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  product_id uuid not null,
  location_id uuid not null,
  origin text not null check (origin in ('initial_entry', 'purchase', 'direct_entry', 'transfer')),
  source_lot_id uuid references public.lots (id),
  initial_qty numeric(14, 3) not null check (initial_qty > 0),
  remaining numeric(14, 3) not null check (remaining >= 0),
  captured_qty numeric(14, 3) not null check (captured_qty > 0),
  captured_unit text not null,
  content numeric(14, 3) not null check (content > 0),
  received_at date not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  check (remaining <= initial_qty),
  unique (id, company_id),
  foreign key (product_id, company_id) references public.products (id, company_id),
  foreign key (location_id, company_id) references public.locations (id, company_id)
);

create index lots_available_idx on public.lots (product_id, location_id, received_at) where remaining > 0;
create index lots_location_idx on public.lots (location_id);

create table public.lot_costs (
  lot_id uuid primary key,
  company_id uuid not null references public.companies (id),
  unit_cost numeric(18, 6) check (unit_cost >= 0),
  currency_id uuid,
  created_at timestamptz not null default now(),
  check (unit_cost is null or currency_id is not null),
  foreign key (lot_id, company_id) references public.lots (id, company_id),
  foreign key (currency_id, company_id) references public.currencies (id, company_id)
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  product_id uuid not null,
  location_id uuid not null,
  lot_id uuid not null,
  type text not null check (type in ('initial_entry', 'purchase_entry', 'direct_entry', 'transfer_out', 'transfer_in', 'write_off', 'adjustment', 'consumption')),
  qty_delta numeric(14, 3) not null check (qty_delta <> 0),
  captured_qty numeric(14, 3) not null,
  captured_unit text not null,
  reason_code text,
  reason_text text,
  document_type text,
  document_id uuid,
  reverses_id uuid references public.stock_movements (id),
  actor_id uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (id, company_id),
  foreign key (product_id, company_id) references public.products (id, company_id),
  foreign key (location_id, company_id) references public.locations (id, company_id),
  foreign key (lot_id, company_id) references public.lots (id, company_id)
);

create index stock_movements_product_idx on public.stock_movements (product_id, location_id, created_at);
create index stock_movements_lot_idx on public.stock_movements (lot_id);

create table public.movement_costs (
  movement_id uuid primary key,
  company_id uuid not null references public.companies (id),
  unit_cost numeric(18, 6) check (unit_cost >= 0),
  currency_id uuid,
  created_at timestamptz not null default now(),
  check (unit_cost is null or currency_id is not null),
  foreign key (movement_id, company_id) references public.stock_movements (id, company_id),
  foreign key (currency_id, company_id) references public.currencies (id, company_id)
);

create function app.guard_ledger_immutable()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception 'MOVEMENT_IMMUTABLE' using errcode = '42501';
end;
$$;

create trigger stock_movements_immutable before update or delete on public.stock_movements
  for each row execute function app.guard_ledger_immutable();
create trigger movement_costs_immutable before update or delete on public.movement_costs
  for each row execute function app.guard_ledger_immutable();

create function app.guard_lot_immutable()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if (new.id, new.company_id, new.product_id, new.location_id, new.origin, new.source_lot_id, new.initial_qty,
      new.captured_qty, new.captured_unit, new.content, new.received_at, new.created_at, new.created_by)
     is distinct from
     (old.id, old.company_id, old.product_id, old.location_id, old.origin, old.source_lot_id, old.initial_qty,
      old.captured_qty, old.captured_unit, old.content, old.received_at, old.created_at, old.created_by) then
    raise exception 'LOT_IMMUTABLE' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger lots_immutable_guard before update on public.lots
  for each row execute function app.guard_lot_immutable();

create or replace function app.product_has_stock(p_product uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (select 1 from public.lots l where l.product_id = p_product and l.remaining > 0)
$$;

create or replace function app.currency_in_use(p_currency uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (select 1 from public.lot_costs where currency_id = p_currency)
    or exists (select 1 from public.movement_costs where currency_id = p_currency)
$$;

create function app.create_lot(
  p_company uuid, p_product uuid, p_location uuid, p_origin text, p_source_lot uuid,
  p_captured_qty numeric, p_captured_unit text, p_content numeric, p_unit_cost numeric,
  p_currency uuid, p_received date, p_doc_type text default null, p_doc_id uuid default null,
  p_type text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_base numeric(14, 3);
  v_lot uuid;
  v_move uuid;
  v_type text;
  v_cost numeric(18, 6);
  v_currency uuid;
begin
  if not exists (select 1 from public.product_stock_settings s
    where s.product_id = p_product and s.company_id = p_company and s.storable) then
    raise exception 'PRODUCT_NOT_STORABLE';
  end if;
  if not exists (select 1 from public.locations l where l.id = p_location and l.company_id = p_company and l.active) then
    raise exception 'INVALID_LOCATION';
  end if;
  if p_captured_qty is null or p_captured_qty <= 0 then
    raise exception 'INVALID_QUANTITY';
  end if;
  if p_content is null or p_content <= 0 then
    raise exception 'INVALID_CONTENT';
  end if;
  if p_unit_cost is not null then
    if p_unit_cost < 0 then
      raise exception 'INVALID_COST';
    end if;
    if not exists (select 1 from public.currencies c
      where c.id = p_currency and c.company_id = p_company and c.active and c.deleted_at is null) then
      raise exception 'INVALID_CURRENCY';
    end if;
    v_cost := p_unit_cost;
    v_currency := p_currency;
  end if;
  if p_source_lot is not null and not exists (select 1 from public.lots l
    where l.id = p_source_lot and l.company_id = p_company and l.product_id = p_product) then
    raise exception 'INVALID_SOURCE_LOT';
  end if;

  v_base := round(p_captured_qty * p_content, 3);
  if v_base <= 0 then
    raise exception 'INVALID_QUANTITY';
  end if;
  v_type := coalesce(p_type, case p_origin
    when 'initial_entry' then 'initial_entry'
    when 'purchase' then 'purchase_entry'
    when 'direct_entry' then 'direct_entry'
    when 'transfer' then 'transfer_in'
  end);

  insert into public.lots (company_id, product_id, location_id, origin, source_lot_id, initial_qty, remaining,
    captured_qty, captured_unit, content, received_at, created_by)
  values (p_company, p_product, p_location, p_origin, p_source_lot, v_base, v_base,
    p_captured_qty, p_captured_unit, p_content, p_received, auth.uid())
  returning id into v_lot;

  insert into public.lot_costs (lot_id, company_id, unit_cost, currency_id) values (v_lot, p_company, v_cost, v_currency);

  insert into public.stock_movements (company_id, product_id, location_id, lot_id, type, qty_delta,
    captured_qty, captured_unit, document_type, document_id, actor_id)
  values (p_company, p_product, p_location, v_lot, v_type, v_base,
    p_captured_qty, p_captured_unit, p_doc_type, p_doc_id, auth.uid())
  returning id into v_move;

  insert into public.movement_costs (movement_id, company_id, unit_cost, currency_id) values (v_move, p_company, v_cost, v_currency);

  return v_lot;
end;
$$;

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
      when 'stock_movements' then 'stock'
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

create trigger audit_stock_movements after insert on public.stock_movements for each row execute function app.audit_row();

create view public.stock_levels with (security_invoker = true) as
select l.company_id, l.product_id, l.location_id, sum(l.remaining) as quantity
from public.lots l
group by l.company_id, l.product_id, l.location_id;

alter table public.lots enable row level security;
alter table public.lot_costs enable row level security;
alter table public.stock_movements enable row level security;
alter table public.movement_costs enable row level security;

create policy lots_select on public.lots for select to authenticated
using (app.can_see_location(location_id));
create policy stock_movements_select on public.stock_movements for select to authenticated
using (app.can_see_location(location_id));
create policy lot_costs_select on public.lot_costs for select to authenticated using (
  app.is_company_admin(company_id)
  or (app.has_special('see_costs') and company_id = (select app.operator_company()))
);
create policy movement_costs_select on public.movement_costs for select to authenticated using (
  app.is_company_admin(company_id)
  or (app.has_special('see_costs') and company_id = (select app.operator_company()))
);

revoke all on public.lots, public.lot_costs, public.stock_movements, public.movement_costs, public.stock_levels from anon, authenticated;
grant select on public.lots, public.lot_costs, public.stock_movements, public.movement_costs, public.stock_levels to authenticated;

revoke execute on function app.guard_ledger_immutable(), app.guard_lot_immutable(),
  app.create_lot(uuid, uuid, uuid, text, uuid, numeric, text, numeric, numeric, uuid, date, text, uuid, text)
  from public, anon, authenticated;

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

  alter table public.company_admins disable trigger company_admins_guard_founder;
  alter table public.stock_movements disable trigger stock_movements_immutable;
  alter table public.movement_costs disable trigger movement_costs_immutable;

  delete from public.app_sessions where user_id in (select id from public.profiles where company_id = p_company);
  delete from public.user_stores where company_id = p_company;
  delete from public.notifications where company_id = p_company;
  delete from public.movement_costs where company_id = p_company;
  delete from public.stock_movements where company_id = p_company;
  delete from public.lot_costs where company_id = p_company;
  delete from public.lots where company_id = p_company;
  delete from public.stock_minimums where company_id = p_company;
  delete from public.product_movement_units where company_id = p_company;
  delete from public.product_presentations where company_id = p_company;
  delete from public.product_stock_settings where company_id = p_company;
  delete from public.locations where company_id = p_company;
  delete from public.currency_denominations where company_id = p_company;
  delete from public.currencies where company_id = p_company;
  delete from public.products where company_id = p_company;
  delete from public.categories where company_id = p_company;
  delete from public.stores where company_id = p_company;
  delete from public.sites where company_id = p_company;
  delete from public.role_company_exclusions where company_id = p_company;
  delete from public.company_admins where company_id = p_company;
  delete from public.companies where id = p_company;

  alter table public.movement_costs enable trigger movement_costs_immutable;
  alter table public.stock_movements enable trigger stock_movements_immutable;
  alter table public.company_admins enable trigger company_admins_guard_founder;
end;
$$;
