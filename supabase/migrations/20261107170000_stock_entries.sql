create function public.register_initial_entry(
  p_product uuid, p_location uuid, p_qty numeric, p_unit text, p_content numeric,
  p_unit_cost numeric default null, p_currency uuid default null, p_received date default current_date
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_company uuid;
  v_kind text;
  v_admin boolean;
  v_lot uuid;
  v_name text;
  v_base numeric(14, 3);
begin
  select l.company_id, l.kind into v_company, v_kind from public.locations l where l.id = p_location;
  if v_company is null then
    raise exception 'LOCATION_NOT_FOUND';
  end if;
  if v_kind <> 'warehouse' then
    raise exception 'NOT_WAREHOUSE';
  end if;
  v_admin := app.is_company_admin(v_company);
  if not (v_admin or app.has_special_warehouse('initial_entry', v_company)) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_unit_cost is not null and not (v_admin
    or (app.kind() = 'operator' and app.operator_company() = v_company and app.has_special('see_costs'))) then
    raise exception 'COST_NOT_ALLOWED' using errcode = '42501';
  end if;

  perform 1 from public.product_stock_settings s where s.product_id = p_product and s.company_id = v_company for update;
  v_lot := app.create_lot(v_company, p_product, p_location, 'initial_entry', null, p_qty, p_unit, p_content,
    p_unit_cost, p_currency, p_received);

  if not v_admin then
    select pr.name into v_name from public.products pr where pr.id = p_product;
    v_base := round(p_qty * p_content, 3);
    perform app.notify(v_company, 'stock', 'initial_entry', 'info', 'Entrada inicial registrada',
      v_name || ': ' || v_base || ' (unidad base) registrada por '
        || (select p.display_name from public.profiles p where p.id = auth.uid()),
      '/existencias', p_include_admins => true);
  end if;
  return v_lot;
end;
$$;

create function public.register_direct_entry(
  p_product uuid, p_location uuid, p_qty numeric, p_unit text, p_content numeric,
  p_unit_cost numeric default null, p_currency uuid default null, p_received date default current_date
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
begin
  select l.company_id, l.kind, l.store_id into v_company, v_kind, v_store from public.locations l where l.id = p_location;
  if v_company is null then
    raise exception 'LOCATION_NOT_FOUND';
  end if;
  if v_kind <> 'store' then
    raise exception 'NOT_STORE';
  end if;
  v_admin := app.is_company_admin(v_company);
  if not (v_admin or app.has_special_in_store('direct_store_entry', v_store)) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_unit_cost is not null and not (v_admin
    or (app.kind() = 'operator' and app.operator_company() = v_company and app.has_special('see_costs'))) then
    raise exception 'COST_NOT_ALLOWED' using errcode = '42501';
  end if;

  perform 1 from public.product_stock_settings s where s.product_id = p_product and s.company_id = v_company for update;
  return app.create_lot(v_company, p_product, p_location, 'direct_entry', null, p_qty, p_unit, p_content,
    p_unit_cost, p_currency, p_received);
end;
$$;

revoke execute on function public.register_initial_entry(uuid, uuid, numeric, text, numeric, numeric, uuid, date),
  public.register_direct_entry(uuid, uuid, numeric, text, numeric, numeric, uuid, date) from public, anon;
grant execute on function public.register_initial_entry(uuid, uuid, numeric, text, numeric, numeric, uuid, date),
  public.register_direct_entry(uuid, uuid, numeric, text, numeric, numeric, uuid, date) to authenticated;
