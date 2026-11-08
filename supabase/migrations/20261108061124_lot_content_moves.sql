create or replace function app.resolve_unit(p_company uuid, p_product uuid, p_unit text)
returns numeric
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_base text;
  v_eq numeric;
  v_name text;
  v_kind text := 'other';
  v_key text := lower(trim(p_unit));
begin
  perform set_config('app.asked_unit', '', true);
  perform set_config('app.asked_kind', '', true);
  select s.base_unit into v_base from public.product_stock_settings s where s.product_id = p_product and s.company_id = p_company;
  if v_key = 'base' then
    return 1;
  end if;
  select u.equivalence, u.name into v_eq, v_name from public.product_movement_units u
    where u.product_id = p_product and u.company_id = p_company and u.active and u.deleted_at is null and lower(trim(u.name)) = v_key;
  if v_eq is null then
    select p.content, p.name into v_eq, v_name from public.product_presentations p
      where p.product_id = p_product and p.company_id = p_company and p.active and p.deleted_at is null and lower(trim(p.name)) = v_key;
    if v_eq is not null then
      v_kind := 'presentation';
    end if;
  end if;
  if v_eq is null and v_base is not null and app.unit_magnitude(v_key) = app.unit_magnitude(v_base) then
    v_eq := app.unit_factor(v_key) / app.unit_factor(v_base);
    v_name := v_key;
  end if;
  if v_eq is null then
    return null;
  end if;
  perform set_config('app.asked_unit', v_name, true);
  perform set_config('app.asked_eq', v_eq::text, true);
  perform set_config('app.asked_kind', v_kind, true);
  return v_eq;
end;
$$;

create or replace function app.fill_asked()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
declare
  v_unit text := coalesce(current_setting('app.asked_unit', true), '');
  v_eq numeric;
begin
  if v_unit <> '' and new.asked_qty is null and new.type in ('transfer_out', 'transfer_in', 'write_off') then
    if current_setting('app.asked_kind', true) = 'presentation' then
      select l.presentation_content into v_eq from public.lots l where l.id = new.lot_id;
    end if;
    v_eq := coalesce(v_eq, current_setting('app.asked_eq', true)::numeric);
    if round(abs(new.qty_delta) / v_eq, 3) > 0 then
      new.asked_qty := round(abs(new.qty_delta) / v_eq, 3);
      new.asked_unit := v_unit;
    end if;
  end if;
  return new;
end;
$$;

create function app.presentation_picks(p_company uuid, p_product uuid, p_location uuid, p_name text, p_n numeric, p_picks jsonb, p_choose boolean)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_key text := lower(trim(p_name));
  v_fifo jsonb;
  v_avail numeric;
begin
  if p_n <> trunc(p_n) then
    raise exception 'INVALID_QUANTITY';
  end if;
  perform 1 from public.lots l
    where l.product_id = p_product and l.location_id = p_location and l.company_id = p_company and l.remaining > 0
    order by l.received_at, l.created_at, l.id for update;

  select coalesce(sum(floor(l.remaining / l.presentation_content)), 0) into v_avail from public.lots l
    where l.product_id = p_product and l.location_id = p_location and l.company_id = p_company
      and l.remaining > 0 and lower(trim(l.presentation_name)) = v_key;

  select coalesce(jsonb_agg(jsonb_build_object('lot_id', t.id, 'qty', t.take * t.content) order by t.received_at, t.created_at, t.id), '[]')
  into v_fifo
  from (
    select x.id, x.received_at, x.created_at, x.content,
      greatest(least(x.avail, p_n - coalesce(sum(x.avail) over (
        order by x.received_at, x.created_at, x.id rows between unbounded preceding and 1 preceding), 0)), 0) as take
    from (
      select l.id, l.received_at, l.created_at, l.presentation_content as content, floor(l.remaining / l.presentation_content) as avail
      from public.lots l
      where l.product_id = p_product and l.location_id = p_location and l.company_id = p_company
        and l.remaining > 0 and lower(trim(l.presentation_name)) = v_key
    ) x
    where x.avail > 0
  ) t
  where t.take > 0;

  if p_picks is null then
    if v_avail < p_n then
      raise exception 'INSUFFICIENT_PACKS';
    end if;
    return v_fifo;
  end if;
  if jsonb_typeof(p_picks) <> 'array' then
    raise exception 'QUANTITY_MISMATCH';
  end if;
  if exists (select 1 from jsonb_to_recordset(p_picks) k(lot_id uuid, qty numeric) where k.lot_id is null or k.qty is null or k.qty <= 0) then
    raise exception 'INVALID_QUANTITY';
  end if;
  if exists (select 1 from jsonb_to_recordset(p_picks) k(lot_id uuid, qty numeric)
    where not exists (select 1 from public.lots l
      where l.id = k.lot_id and l.product_id = p_product and l.location_id = p_location and l.company_id = p_company
        and lower(trim(l.presentation_name)) = v_key)) then
    raise exception 'LOT_NOT_FOUND';
  end if;
  if exists (select 1 from jsonb_to_recordset(p_picks) k(lot_id uuid, qty numeric)
    join public.lots l on l.id = k.lot_id where mod(k.qty, l.presentation_content) <> 0) then
    raise exception 'INVALID_QUANTITY';
  end if;
  if (select sum(k.qty / l.presentation_content) from jsonb_to_recordset(p_picks) k(lot_id uuid, qty numeric)
    join public.lots l on l.id = k.lot_id) <> p_n then
    raise exception 'QUANTITY_MISMATCH';
  end if;
  if not p_choose and exists (
    select 1 from jsonb_to_recordset(v_fifo) f(lot_id uuid, qty numeric)
    full join jsonb_to_recordset(p_picks) a(lot_id uuid, qty numeric) using (lot_id)
    where coalesce(f.qty, 0) <> coalesce(a.qty, 0)
  ) then
    raise exception 'CHOOSE_LOT_FORBIDDEN' using errcode = '42501';
  end if;
  return p_picks;
end;
$$;

revoke execute on function app.presentation_picks(uuid, uuid, uuid, text, numeric, jsonb, boolean) from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.register_transfer(p_product uuid, p_from uuid, p_to uuid, p_qty numeric, p_unit text, p_picks jsonb DEFAULT NULL::jsonb, p_deviation_reason text DEFAULT NULL::text, p_doc_type text DEFAULT NULL::text, p_doc_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
declare
  v_company uuid;
  v_kind text;
  v_to_company uuid;
  v_to_kind text;
  v_to_active boolean;
  v_admin boolean;
  v_choose boolean;
  v_base_unit text;
  v_eq numeric;
  v_base numeric(14, 3);
  v_picks jsonb := p_picks;
  v_used jsonb;
  v_lots jsonb := '[]';
  v_dest uuid;
  e jsonb;
begin
  select l.company_id, l.kind into v_company, v_kind from public.locations l where l.id = p_from;
  if v_company is null then
    raise exception 'LOCATION_NOT_FOUND';
  end if;
  if v_kind <> 'warehouse' then
    raise exception 'NOT_WAREHOUSE';
  end if;
  v_admin := app.is_company_admin(v_company);
  if not (v_admin or app.has_special_warehouse('transfer', v_company)) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  select l.company_id, l.kind, l.active into v_to_company, v_to_kind, v_to_active from public.locations l where l.id = p_to;
  if v_to_company is distinct from v_company then
    raise exception 'LOCATION_NOT_FOUND';
  end if;
  if v_to_kind <> 'store' then
    raise exception 'NOT_STORE';
  end if;
  if not v_to_active then
    raise exception 'INVALID_LOCATION';
  end if;
  select s.base_unit into v_base_unit from public.product_stock_settings s
    where s.product_id = p_product and s.company_id = v_company and s.storable;
  if v_base_unit is null then
    raise exception 'PRODUCT_NOT_STORABLE';
  end if;
  if p_qty is null or p_qty <= 0 then
    raise exception 'INVALID_QUANTITY';
  end if;
  v_eq := app.resolve_unit(v_company, p_product, p_unit);
  if v_eq is null then
    raise exception 'INVALID_UNIT';
  end if;
  v_choose := v_admin or app.has_special_warehouse('choose_lot', v_company);
  if current_setting('app.asked_kind', true) = 'presentation' then
    v_picks := app.presentation_picks(v_company, p_product, p_from, current_setting('app.asked_unit', true), p_qty, p_picks, v_choose);
    select sum((k.qty)) into v_base from jsonb_to_recordset(v_picks) k(lot_id uuid, qty numeric);
    v_choose := true;
  else
    v_base := round(p_qty * v_eq, 3);
  end if;
  if v_base <= 0 then
    raise exception 'INVALID_QUANTITY';
  end if;

  v_used := app.consume_lots(v_company, p_product, p_from, v_base, v_picks, 'transfer_out', null, null,
    p_doc_type, p_doc_id, v_choose, p_deviation_reason);

  for e in select * from jsonb_array_elements(v_used) loop
    v_dest := app.create_lot(v_company, p_product, p_to, 'transfer', (e ->> 'lot_id')::uuid, (e ->> 'qty')::numeric,
      v_base_unit, 1, (e ->> 'unit_cost')::numeric, (e ->> 'currency_id')::uuid, (e ->> 'received_at')::date,
      p_doc_type, p_doc_id);
    v_lots := v_lots || jsonb_build_object('source_lot', e -> 'lot_id', 'dest_lot', v_dest, 'qty', e -> 'qty');
  end loop;

  return jsonb_build_object('moved_base', v_base, 'moved_unit_qty', p_qty, 'lots', v_lots);
end;
$function$;

CREATE OR REPLACE FUNCTION public.register_write_off(p_product uuid, p_location uuid, p_qty numeric, p_unit text, p_reason uuid, p_reason_text text DEFAULT NULL::text, p_picks jsonb DEFAULT NULL::jsonb, p_deviation_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
declare
  v_company uuid;
  v_kind text;
  v_store uuid;
  v_admin boolean;
  v_allowed boolean;
  v_choose boolean;
  v_eq numeric;
  v_base numeric(14, 3);
  v_picks jsonb := p_picks;
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
  v_eq := app.resolve_unit(v_company, p_product, p_unit);
  if v_eq is null then
    raise exception 'INVALID_UNIT';
  end if;
  if current_setting('app.asked_kind', true) = 'presentation' then
    v_picks := app.presentation_picks(v_company, p_product, p_location, current_setting('app.asked_unit', true), p_qty, p_picks, v_choose);
    select sum(k.qty) into v_base from jsonb_to_recordset(v_picks) k(lot_id uuid, qty numeric);
    v_choose := true;
  else
    v_base := round(p_qty * v_eq, 3);
  end if;
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

  v_used := app.consume_lots(v_company, p_product, p_location, v_base, v_picks, 'write_off', v_code,
    coalesce(v_text, v_name), null, null, v_choose, p_deviation_reason);

  return jsonb_build_object('removed_base', v_base, 'lots', (
    select coalesce(jsonb_agg(jsonb_build_object('lot_id', e ->> 'lot_id', 'qty', e -> 'qty', 'movement_id', e ->> 'movement_id')), '[]')
    from jsonb_array_elements(v_used) e
  ));
end;
$function$;

drop function public.register_surplus(uuid, uuid, numeric, text, numeric, uuid);

create function public.register_surplus(
  p_product uuid, p_location uuid, p_qty numeric, p_reason_text text,
  p_unit_cost numeric default null, p_currency uuid default null,
  p_unit text default 'base', p_content numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_company uuid;
  v_kind text;
  v_store uuid;
  v_admin boolean;
  v_text text := trim(p_reason_text);
  v_base text;
  v_name text;
  v_lot uuid;
  v_key text := lower(trim(coalesce(p_unit, 'base')));
  v_eq numeric;
  v_unit text;
  v_content numeric := 1;
  v_n numeric := p_qty;
begin
  select l.company_id, l.kind, l.store_id into v_company, v_kind, v_store from public.locations l where l.id = p_location;
  if v_company is null then
    raise exception 'LOCATION_NOT_FOUND';
  end if;
  v_admin := app.is_company_admin(v_company);
  if not (v_admin or case v_kind
      when 'warehouse' then app.has_special_warehouse('adjust_stock', v_company)
      else app.has_special_in_store('adjust_stock', v_store) end) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_unit_cost is not null and not (v_admin
    or (app.kind() = 'operator' and app.operator_company() = v_company and app.has_special('see_costs'))) then
    raise exception 'COST_NOT_ALLOWED' using errcode = '42501';
  end if;
  if v_text is null or length(v_text) not between 3 and 300 then
    raise exception 'REASON_TEXT_REQUIRED';
  end if;
  if p_qty is null or round(p_qty, 3) <= 0 then
    raise exception 'INVALID_QUANTITY';
  end if;

  perform 1 from public.product_stock_settings s where s.product_id = p_product and s.company_id = v_company for update;
  select s.base_unit into v_base from public.product_stock_settings s where s.product_id = p_product and s.company_id = v_company;
  v_unit := v_base;
  if v_key <> 'base' then
    select u.equivalence into v_eq from public.product_movement_units u
      where u.product_id = p_product and u.company_id = v_company and u.active and u.deleted_at is null and lower(trim(u.name)) = v_key;
    if v_eq is not null then
      v_n := round(p_qty * v_eq, 3);
    else
      select p.name, p.content into v_unit, v_eq from public.product_presentations p
        where p.product_id = p_product and p.company_id = v_company and p.active and p.deleted_at is null and lower(trim(p.name)) = v_key;
      if v_eq is not null then
        v_content := coalesce(p_content, v_eq);
        if v_content <= 0 then
          raise exception 'INVALID_CONTENT';
        end if;
      elsif v_base is not null and app.unit_magnitude(v_key) = app.unit_magnitude(v_base) then
        v_unit := v_key;
        v_content := round(app.unit_factor(v_key) / app.unit_factor(v_base), 3);
      else
        raise exception 'INVALID_UNIT';
      end if;
    end if;
  end if;
  v_lot := app.create_lot(v_company, p_product, p_location, 'adjustment', null, v_n, v_unit, v_content,
    p_unit_cost, p_currency, current_date, null, null, 'adjustment', 'surplus', v_text);

  if not v_admin then
    select pr.name into v_name from public.products pr where pr.id = p_product;
    perform app.notify(v_company, 'stock', 'surplus', 'info', 'Sobrante de conteo registrado',
      v_name || ': ' || (select l.initial_qty from public.lots l where l.id = v_lot) || ' (unidad base) en '
        || (select l.name from public.locations l where l.id = p_location) || ', registrado por '
        || (select p.display_name from public.profiles p where p.id = auth.uid()),
      '/existencias', p_include_admins => true);
  end if;
  return v_lot;
end;
$$;

revoke execute on function public.register_surplus(uuid, uuid, numeric, text, numeric, uuid, text, numeric) from public, anon;
grant execute on function public.register_surplus(uuid, uuid, numeric, text, numeric, uuid, text, numeric) to authenticated;
