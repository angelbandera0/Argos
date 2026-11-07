alter table public.lots drop constraint lots_origin_check;
alter table public.lots add constraint lots_origin_check
  check (origin in ('initial_entry', 'purchase', 'direct_entry', 'transfer', 'adjustment'));

drop function app.create_lot(uuid, uuid, uuid, text, uuid, numeric, text, numeric, numeric, uuid, date, text, uuid, text);

create function app.create_lot(
  p_company uuid, p_product uuid, p_location uuid, p_origin text, p_source_lot uuid,
  p_captured_qty numeric, p_captured_unit text, p_content numeric, p_unit_cost numeric,
  p_currency uuid, p_received date, p_doc_type text default null, p_doc_id uuid default null,
  p_type text default null, p_reason_code text default null, p_reason_text text default null
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
    when 'adjustment' then 'adjustment'
  end);

  insert into public.lots (company_id, product_id, location_id, origin, source_lot_id, initial_qty, remaining,
    captured_qty, captured_unit, content, received_at, created_by)
  values (p_company, p_product, p_location, p_origin, p_source_lot, v_base, v_base,
    p_captured_qty, p_captured_unit, p_content, p_received, auth.uid())
  returning id into v_lot;

  insert into public.lot_costs (lot_id, company_id, unit_cost, currency_id) values (v_lot, p_company, v_cost, v_currency);

  insert into public.stock_movements (company_id, product_id, location_id, lot_id, type, qty_delta,
    captured_qty, captured_unit, reason_code, reason_text, document_type, document_id, actor_id)
  values (p_company, p_product, p_location, v_lot, v_type, v_base,
    p_captured_qty, p_captured_unit, p_reason_code, p_reason_text, p_doc_type, p_doc_id, auth.uid())
  returning id into v_move;

  insert into public.movement_costs (movement_id, company_id, unit_cost, currency_id) values (v_move, p_company, v_cost, v_currency);

  return v_lot;
end;
$$;

revoke execute on function
  app.create_lot(uuid, uuid, uuid, text, uuid, numeric, text, numeric, numeric, uuid, date, text, uuid, text, text, text)
  from public, anon, authenticated;

create function public.register_surplus(
  p_product uuid, p_location uuid, p_qty numeric, p_reason_text text,
  p_unit_cost numeric default null, p_currency uuid default null
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
  v_lot := app.create_lot(v_company, p_product, p_location, 'adjustment', null, p_qty, v_base, 1,
    p_unit_cost, p_currency, current_date, null, null, 'adjustment', 'surplus', v_text);

  if not v_admin then
    select pr.name into v_name from public.products pr where pr.id = p_product;
    perform app.notify(v_company, 'stock', 'surplus', 'info', 'Sobrante de conteo registrado',
      v_name || ': ' || round(p_qty, 3) || ' (unidad base) en '
        || (select l.name from public.locations l where l.id = p_location) || ', registrado por '
        || (select p.display_name from public.profiles p where p.id = auth.uid()),
      '/existencias', p_include_admins => true);
  end if;
  return v_lot;
end;
$$;

revoke execute on function public.register_surplus(uuid, uuid, numeric, text, numeric, uuid) from public, anon;
grant execute on function public.register_surplus(uuid, uuid, numeric, text, numeric, uuid) to authenticated;
