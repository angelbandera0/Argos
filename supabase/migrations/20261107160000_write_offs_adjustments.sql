create table public.write_off_reasons (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  code text not null check (code ~ '^[a-z][a-z_]*$'),
  name text not null check (length(trim(name)) between 1 and 60),
  standard boolean not null default false,
  requires_text boolean not null default false,
  active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, code),
  unique (id, company_id)
);

create trigger write_off_reasons_touch before update on public.write_off_reasons
  for each row execute function app.touch_updated_at();

create function app.guard_write_off_reason()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if (new.id, new.company_id, new.code, new.standard, new.requires_text)
     is distinct from (old.id, old.company_id, old.code, old.standard, old.requires_text) then
    raise exception 'STANDARD_REASON_LOCKED' using errcode = '42501';
  end if;
  if old.standard and (new.name is distinct from old.name or new.deleted_at is distinct from old.deleted_at) then
    raise exception 'STANDARD_REASON_LOCKED' using errcode = '42501';
  end if;
  if old.code = 'other' and old.standard and not new.active then
    raise exception 'STANDARD_REASON_LOCKED' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger write_off_reasons_guard before update on public.write_off_reasons
  for each row execute function app.guard_write_off_reason();

create function app.seed_write_off_reasons()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  insert into public.write_off_reasons (company_id, code, name, standard, requires_text)
  select new.id, v.code, v.name, true, v.code = 'other'
  from (values ('waste', 'Merma'), ('expired', 'Caducado'), ('damaged', 'Dañado'), ('spill', 'Derrame'),
    ('internal_use', 'Consumo interno'), ('loss', 'Pérdida'), ('other', 'Otro')) as v (code, name)
  on conflict (company_id, code) do nothing;
  return null;
end;
$$;

create trigger companies_write_off_reasons after insert on public.companies
  for each row execute function app.seed_write_off_reasons();

insert into public.write_off_reasons (company_id, code, name, standard, requires_text)
select c.id, v.code, v.name, true, v.code = 'other'
from public.companies c
cross join (values ('waste', 'Merma'), ('expired', 'Caducado'), ('damaged', 'Dañado'), ('spill', 'Derrame'),
  ('internal_use', 'Consumo interno'), ('loss', 'Pérdida'), ('other', 'Otro')) as v (code, name)
on conflict (company_id, code) do nothing;

alter table public.write_off_reasons enable row level security;

create policy write_off_reasons_select on public.write_off_reasons for select to authenticated using (
  app.is_company_admin(company_id)
  or (deleted_at is null and company_id = (select app.operator_company())
    and (app.has_special('write_off') or app.can(company_id, 'stock', 'view')))
);
create policy write_off_reasons_insert on public.write_off_reasons for insert to authenticated
with check (app.is_company_admin(company_id));
create policy write_off_reasons_update on public.write_off_reasons for update to authenticated
using (app.is_company_admin(company_id))
with check (app.is_company_admin(company_id));

revoke all on public.write_off_reasons from anon, authenticated;
grant select on public.write_off_reasons to authenticated;
grant insert (company_id, code, name, active) on public.write_off_reasons to authenticated;
grant update (name, active, deleted_at) on public.write_off_reasons to authenticated;

revoke execute on function app.guard_write_off_reason(), app.seed_write_off_reasons() from public, anon, authenticated;

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
      when 'write_off_reasons' then 'stock'
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

create trigger audit_write_off_reasons after insert or update on public.write_off_reasons
  for each row execute function app.audit_row();

create function public.register_write_off(
  p_product uuid, p_location uuid, p_qty numeric, p_unit text, p_reason uuid, p_reason_text text default null,
  p_picks jsonb default null, p_deviation_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_company uuid;
  v_kind text;
  v_store uuid;
  v_admin boolean;
  v_allowed boolean;
  v_choose boolean;
  v_eq numeric;
  v_base numeric(14, 3);
  v_code text;
  v_name text;
  v_requires boolean;
  v_text text := nullif(trim(p_reason_text), '');
  v_used jsonb;
begin
  select l.company_id, l.kind, l.store_id into v_company, v_kind, v_store from public.locations l where l.id = p_location;
  if v_company is null then
    raise exception 'LOCATION_NOT_FOUND';
  end if;
  v_admin := app.is_company_admin(v_company);
  if v_kind = 'warehouse' then
    v_allowed := v_admin or app.has_special_warehouse('write_off', v_company);
    v_choose := v_admin or app.has_special_warehouse('choose_lot', v_company);
  else
    v_allowed := v_admin or app.has_special_in_store('write_off', v_store);
    v_choose := v_admin or app.has_special_in_store('choose_lot', v_store);
  end if;
  if not v_allowed then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if not exists (select 1 from public.product_stock_settings s
    where s.product_id = p_product and s.company_id = v_company and s.storable) then
    raise exception 'PRODUCT_NOT_STORABLE';
  end if;
  if p_qty is null or p_qty <= 0 then
    raise exception 'INVALID_QUANTITY';
  end if;
  if lower(trim(p_unit)) = 'base' then
    v_eq := 1;
  else
    select u.equivalence into v_eq from public.product_movement_units u
      where u.product_id = p_product and u.company_id = v_company and u.active and u.deleted_at is null
        and lower(trim(u.name)) = lower(trim(p_unit));
  end if;
  if v_eq is null then
    raise exception 'INVALID_UNIT';
  end if;
  v_base := round(p_qty * v_eq, 3);
  if v_base <= 0 then
    raise exception 'INVALID_QUANTITY';
  end if;
  select r.code, r.name, r.requires_text into v_code, v_name, v_requires from public.write_off_reasons r
    where r.id = p_reason and r.company_id = v_company and r.active and r.deleted_at is null;
  if v_code is null then
    raise exception 'INVALID_REASON';
  end if;
  if (v_requires and v_text is null) or length(v_text) > 300 then
    raise exception 'REASON_TEXT_REQUIRED';
  end if;

  v_used := app.consume_lots(v_company, p_product, p_location, v_base, p_picks, 'write_off', v_code,
    coalesce(v_text, v_name), null, null, v_choose, p_deviation_reason);

  return jsonb_build_object('removed_base', v_base, 'lots', (
    select coalesce(jsonb_agg(jsonb_build_object('lot_id', e ->> 'lot_id', 'qty', e -> 'qty', 'movement_id', e ->> 'movement_id')), '[]')
    from jsonb_array_elements(v_used) e
  ));
end;
$$;

create function public.register_adjustment(
  p_lot uuid, p_delta numeric, p_reason_text text, p_reverses uuid default null,
  p_doc_type text default null, p_doc_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_lot public.lots;
  v_kind text;
  v_store uuid;
  v_delta numeric(14, 3) := round(p_delta, 3);
  v_text text := trim(p_reason_text);
  v_base text;
  v_move uuid;
begin
  select * into v_lot from public.lots where id = p_lot for update;
  if v_lot.id is null then
    raise exception 'LOT_NOT_FOUND';
  end if;
  select l.kind, l.store_id into v_kind, v_store from public.locations l where l.id = v_lot.location_id;
  if not (app.is_company_admin(v_lot.company_id) or case v_kind
      when 'warehouse' then app.has_special_warehouse('adjust_stock', v_lot.company_id)
      else app.has_special_in_store('adjust_stock', v_store) end) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_delta is null or v_delta = 0 then
    raise exception 'INVALID_QUANTITY';
  end if;
  if v_text is null or length(v_text) not between 3 and 300 then
    raise exception 'REASON_TEXT_REQUIRED';
  end if;
  if v_delta < 0 and v_lot.remaining + v_delta < 0 then
    raise exception 'INSUFFICIENT_STOCK';
  end if;
  if v_delta > 0 and v_lot.remaining + v_delta > v_lot.initial_qty then
    raise exception 'ADJUST_EXCEEDS_LOT';
  end if;
  if p_reverses is not null and not exists (select 1 from public.stock_movements m
    where m.id = p_reverses and m.lot_id = p_lot and m.company_id = v_lot.company_id) then
    raise exception 'INVALID_REVERSES';
  end if;
  select s.base_unit into v_base from public.product_stock_settings s
    where s.product_id = v_lot.product_id and s.company_id = v_lot.company_id;

  update public.lots set remaining = remaining + v_delta where id = p_lot;
  insert into public.stock_movements (company_id, product_id, location_id, lot_id, type, qty_delta,
    captured_qty, captured_unit, reason_code, reason_text, document_type, document_id, reverses_id, actor_id)
  values (v_lot.company_id, v_lot.product_id, v_lot.location_id, p_lot, 'adjustment', v_delta,
    abs(v_delta), v_base, 'adjustment', v_text, p_doc_type, p_doc_id, p_reverses, auth.uid())
  returning id into v_move;
  insert into public.movement_costs (movement_id, company_id, unit_cost, currency_id)
  select v_move, c.company_id, c.unit_cost, c.currency_id from public.lot_costs c where c.lot_id = p_lot;
  return v_move;
end;
$$;

revoke execute on function public.register_write_off(uuid, uuid, numeric, text, uuid, text, jsonb, text) from public, anon;
grant execute on function public.register_write_off(uuid, uuid, numeric, text, uuid, text, jsonb, text) to authenticated;
revoke execute on function public.register_adjustment(uuid, numeric, text, uuid, text, uuid) from public, anon;
grant execute on function public.register_adjustment(uuid, numeric, text, uuid, text, uuid) to authenticated;

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
  delete from public.write_off_reasons where company_id = p_company;
  delete from public.company_admins where company_id = p_company;
  delete from public.companies where id = p_company;

  alter table public.movement_costs enable trigger movement_costs_immutable;
  alter table public.stock_movements enable trigger stock_movements_immutable;
  alter table public.company_admins enable trigger company_admins_guard_founder;
end;
$$;
