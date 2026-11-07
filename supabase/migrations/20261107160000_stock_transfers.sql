create function app.consume_lots(
  p_company uuid, p_product uuid, p_location uuid, p_qty numeric, p_picks jsonb, p_type text,
  p_reason_code text, p_reason_text text, p_doc_type text, p_doc_id uuid, p_choose_allowed boolean,
  p_deviation_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_base text;
  v_fifo jsonb;
  v_alloc jsonb;
  v_dev boolean := false;
  v_code text := p_reason_code;
  v_text text := p_reason_text;
  v_out jsonb := '[]';
  v_move uuid;
  r record;
begin
  if p_qty is null or p_qty <= 0 then
    raise exception 'INVALID_QUANTITY';
  end if;
  select s.base_unit into v_base from public.product_stock_settings s
    where s.product_id = p_product and s.company_id = p_company and s.storable;
  if v_base is null then
    raise exception 'PRODUCT_NOT_STORABLE';
  end if;

  perform 1 from public.lots l
    where l.product_id = p_product and l.location_id = p_location and l.company_id = p_company and l.remaining > 0
    order by l.received_at, l.created_at, l.id for update;

  select coalesce(jsonb_agg(jsonb_build_object('lot_id', t.id, 'qty', t.take) order by t.received_at, t.created_at, t.id), '[]')
  into v_fifo
  from (
    select x.id, x.received_at, x.created_at,
      greatest(least(x.remaining, p_qty - coalesce(sum(x.remaining) over (
        order by x.received_at, x.created_at, x.id rows between unbounded preceding and 1 preceding), 0)), 0) as take
    from public.lots x
    where x.product_id = p_product and x.location_id = p_location and x.company_id = p_company and x.remaining > 0
  ) t
  where t.take > 0;

  if p_picks is null then
    if coalesce((select sum((e ->> 'qty')::numeric) from jsonb_array_elements(v_fifo) e), 0) < p_qty then
      raise exception 'INSUFFICIENT_STOCK';
    end if;
    v_alloc := v_fifo;
  else
    if jsonb_typeof(p_picks) <> 'array' then
      raise exception 'QUANTITY_MISMATCH';
    end if;
    select coalesce(jsonb_agg(jsonb_build_object('lot_id', k.lot_id, 'qty', k.qty)), '[]') into v_alloc
      from jsonb_to_recordset(p_picks) as k(lot_id uuid, qty numeric(14, 3));
    if exists (select 1 from jsonb_to_recordset(v_alloc) k(lot_id uuid, qty numeric)
      where k.lot_id is null or not exists (select 1 from public.lots l
        where l.id = k.lot_id and l.product_id = p_product and l.location_id = p_location and l.company_id = p_company)) then
      raise exception 'LOT_NOT_FOUND';
    end if;
    if exists (select 1 from jsonb_to_recordset(v_alloc) k(lot_id uuid, qty numeric) where k.qty is null or k.qty <= 0) then
      raise exception 'INVALID_QUANTITY';
    end if;
    if exists (select 1 from jsonb_to_recordset(v_alloc) k(lot_id uuid, qty numeric) group by k.lot_id having count(*) > 1) then
      raise exception 'DUPLICATE_LOT';
    end if;
    if exists (select 1 from jsonb_to_recordset(v_alloc) k(lot_id uuid, qty numeric)
      join public.lots l on l.id = k.lot_id where k.qty > l.remaining) then
      raise exception 'LOT_EXCEEDED';
    end if;
    if (select sum(k.qty) from jsonb_to_recordset(v_alloc) k(lot_id uuid, qty numeric)) <> p_qty then
      raise exception 'QUANTITY_MISMATCH';
    end if;
    select exists (
      select 1 from jsonb_to_recordset(v_fifo) f(lot_id uuid, qty numeric)
      full join jsonb_to_recordset(v_alloc) a(lot_id uuid, qty numeric) using (lot_id)
      where coalesce(f.qty, 0) <> coalesce(a.qty, 0)
    ) into v_dev;
    if v_dev then
      if not p_choose_allowed then
        raise exception 'CHOOSE_LOT_FORBIDDEN' using errcode = '42501';
      end if;
      if p_reason_code is null then
        v_code := 'fifo_deviation';
        v_text := p_deviation_reason;
      else
        v_text := concat_ws(' | ', p_reason_text, 'fifo_deviation' || coalesce(': ' || p_deviation_reason, ''));
      end if;
    end if;
  end if;

  for r in
    select k.lot_id, k.qty, l.received_at, c.unit_cost, c.currency_id
    from jsonb_to_recordset(v_alloc) k(lot_id uuid, qty numeric)
    join public.lots l on l.id = k.lot_id
    left join public.lot_costs c on c.lot_id = l.id
    order by l.received_at, l.created_at, l.id
  loop
    update public.lots set remaining = remaining - r.qty where id = r.lot_id and remaining >= r.qty;
    if not found then
      raise exception 'LOT_EXCEEDED';
    end if;
    insert into public.stock_movements (company_id, product_id, location_id, lot_id, type, qty_delta,
      captured_qty, captured_unit, reason_code, reason_text, document_type, document_id, actor_id)
    values (p_company, p_product, p_location, r.lot_id, p_type, -r.qty, r.qty, v_base, v_code, v_text,
      p_doc_type, p_doc_id, auth.uid())
    returning id into v_move;
    insert into public.movement_costs (movement_id, company_id, unit_cost, currency_id)
    values (v_move, p_company, r.unit_cost, r.currency_id);
    v_out := v_out || jsonb_build_object('lot_id', r.lot_id, 'qty', r.qty, 'movement_id', v_move,
      'received_at', r.received_at, 'unit_cost', r.unit_cost, 'currency_id', r.currency_id);
  end loop;
  return v_out;
end;
$$;

create function public.register_transfer(
  p_product uuid, p_from uuid, p_to uuid, p_qty numeric, p_unit text, p_picks jsonb default null,
  p_deviation_reason text default null, p_doc_type text default null, p_doc_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
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
$$;

revoke execute on function app.consume_lots(uuid, uuid, uuid, numeric, jsonb, text, text, text, text, uuid, boolean, text)
  from public, anon, authenticated;
revoke execute on function public.register_transfer(uuid, uuid, uuid, numeric, text, jsonb, text, text, uuid) from public, anon;
grant execute on function public.register_transfer(uuid, uuid, uuid, numeric, text, jsonb, text, text, uuid) to authenticated;
