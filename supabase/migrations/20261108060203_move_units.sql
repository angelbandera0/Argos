create function app.unit_factor(p_unit text)
returns numeric
language sql
immutable
set search_path = pg_catalog
as $$
  select case p_unit
    when 'lb' then 1::numeric when 'kg' then 1 / 0.45359237 when 'g' then 0.001 / 0.45359237 when 'oz' then 1::numeric / 16
    when 'l' then 1::numeric when 'ml' then 0.001 when 'u' then 1::numeric end
$$;

create function app.unit_magnitude(p_unit text)
returns text
language sql
immutable
set search_path = pg_catalog
as $$
  select case when p_unit in ('lb', 'kg', 'g', 'oz') then 'weight' when p_unit in ('l', 'ml') then 'volume' when p_unit = 'u' then 'count' end
$$;

create function app.resolve_unit(p_company uuid, p_product uuid, p_unit text)
returns numeric
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_base text;
  v_eq numeric;
  v_name text;
  v_key text := lower(trim(p_unit));
begin
  perform set_config('app.asked_unit', '', true);
  select s.base_unit into v_base from public.product_stock_settings s where s.product_id = p_product and s.company_id = p_company;
  if v_key = 'base' then
    return 1;
  end if;
  select u.equivalence, u.name into v_eq, v_name from public.product_movement_units u
    where u.product_id = p_product and u.company_id = p_company and u.active and u.deleted_at is null and lower(trim(u.name)) = v_key;
  if v_eq is null then
    select p.content, p.name into v_eq, v_name from public.product_presentations p
      where p.product_id = p_product and p.company_id = p_company and p.active and p.deleted_at is null and lower(trim(p.name)) = v_key;
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
  return v_eq;
end;
$$;

revoke execute on function app.unit_factor(text), app.unit_magnitude(text), app.resolve_unit(uuid, uuid, text) from public, anon, authenticated;

create function app.fill_asked()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
declare
  v_unit text := coalesce(current_setting('app.asked_unit', true), '');
  v_eq numeric;
begin
  if v_unit <> '' and new.asked_qty is null and new.type in ('transfer_out', 'transfer_in', 'write_off') then
    v_eq := current_setting('app.asked_eq', true)::numeric;
    if round(abs(new.qty_delta) / v_eq, 3) > 0 then
      new.asked_qty := round(abs(new.qty_delta) / v_eq, 3);
      new.asked_unit := v_unit;
    end if;
  end if;
  return new;
end;
$$;

create trigger stock_movements_fill_asked before insert on public.stock_movements
  for each row execute function app.fill_asked();

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
  v_base_unit text;
  v_eq numeric;
  v_base numeric(14, 3);
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
  v_base := round(p_qty * v_eq, 3);
  if v_base <= 0 then
    raise exception 'INVALID_QUANTITY';
  end if;

  v_used := app.consume_lots(v_company, p_product, p_from, v_base, p_picks, 'transfer_out', null, null,
    p_doc_type, p_doc_id, v_admin or app.has_special_warehouse('choose_lot', v_company), p_deviation_reason);

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
$function$;

