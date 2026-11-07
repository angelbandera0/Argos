create function app.stock_status(p_qty numeric, p_min numeric)
returns text
language sql
immutable
set search_path = pg_catalog
as $$
  select case when p_qty <= 0 then 'out' when p_min is not null and p_qty <= p_min then 'low' else 'normal' end
$$;

create function app.stock_total(p_product uuid, p_location uuid)
returns numeric(14, 3)
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select coalesce(sum(l.remaining), 0)::numeric(14, 3) from public.lots l
  where l.product_id = p_product and l.location_id = p_location
$$;

create view public.stock_status with (security_invoker = true) as
select x.company_id, x.product_id, x.location_id, x.quantity, x.minimum, app.stock_status(x.quantity, x.minimum) as status
from (
  select coalesce(q.company_id, m.company_id) as company_id, coalesce(q.product_id, m.product_id) as product_id,
    coalesce(q.location_id, m.location_id) as location_id, coalesce(q.quantity, 0)::numeric(14, 3) as quantity, m.minimum
  from (
    select l.company_id, l.product_id, l.location_id, sum(l.remaining) as quantity
    from public.lots l group by l.company_id, l.product_id, l.location_id
  ) q
  full join public.stock_minimums m on m.product_id = q.product_id and m.location_id = q.location_id
) x
join public.product_stock_settings s on s.product_id = x.product_id and s.company_id = x.company_id and s.storable;

revoke all on public.stock_status from anon, authenticated;
grant select on public.stock_status to authenticated;

create function app.notify_stock_status(p_company uuid, p_product uuid, p_location uuid, p_before numeric)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_after numeric(14, 3) := app.stock_total(p_product, p_location);
  v_min numeric;
  v_s_before text;
  v_s_after text;
  v_kind text;
  v_store uuid;
  v_loc text;
  v_name text;
  v_unit text;
  v_body text;
begin
  select m.minimum into v_min from public.stock_minimums m where m.product_id = p_product and m.location_id = p_location;
  v_s_before := app.stock_status(p_before, v_min);
  v_s_after := app.stock_status(v_after, v_min);
  if v_s_after = 'normal' or v_s_before = v_s_after or v_s_before = 'out' then
    return;
  end if;
  select l.kind, l.store_id, l.name into v_kind, v_store, v_loc from public.locations l where l.id = p_location;
  select p.name into v_name from public.products p where p.id = p_product;
  select s.base_unit into v_unit from public.product_stock_settings s where s.product_id = p_product;
  v_body := v_name || ' en ' || v_loc || ': ' || trim_scale(v_after)::text || ' ' || v_unit
    || coalesce(' (mínimo ' || trim_scale(v_min)::text || ')', '');
  if v_kind = 'store' then
    perform app.notify(p_company, 'stock', case v_s_after when 'out' then 'out_of_stock' else 'low_stock' end,
      case v_s_after when 'out' then 'urgent' else 'warning' end,
      case v_s_after when 'out' then 'Agotado: ' else 'Existencia baja: ' end || v_name, v_body, '/existencias',
      p_store => v_store, p_module_perm => 'stock.view', p_include_admins => true);
  else
    perform app.notify(p_company, 'stock', case v_s_after when 'out' then 'out_of_stock' else 'low_stock' end,
      case v_s_after when 'out' then 'urgent' else 'warning' end,
      case v_s_after when 'out' then 'Agotado: ' else 'Existencia baja: ' end || v_name, v_body, '/existencias',
      p_store => null, p_special => 'handle_requests', p_warehouse => true, p_include_admins => true);
  end if;
end;
$$;

revoke execute on function app.stock_status(numeric, numeric), app.stock_total(uuid, uuid),
  app.notify_stock_status(uuid, uuid, uuid, numeric) from public, anon, authenticated;

create or replace function app.consume_lots(
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
  v_before numeric(14, 3);
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
  v_before := app.stock_total(p_product, p_location);

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
  perform app.notify_stock_status(p_company, p_product, p_location, v_before);
  return v_out;
end;
$$;

create or replace function public.register_adjustment(
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
  v_before numeric(14, 3);
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

  v_before := app.stock_total(v_lot.product_id, v_lot.location_id);
  update public.lots set remaining = remaining + v_delta where id = p_lot;
  insert into public.stock_movements (company_id, product_id, location_id, lot_id, type, qty_delta,
    captured_qty, captured_unit, reason_code, reason_text, document_type, document_id, reverses_id, actor_id)
  values (v_lot.company_id, v_lot.product_id, v_lot.location_id, p_lot, 'adjustment', v_delta,
    abs(v_delta), v_base, 'adjustment', v_text, p_doc_type, p_doc_id, p_reverses, auth.uid())
  returning id into v_move;
  insert into public.movement_costs (movement_id, company_id, unit_cost, currency_id)
  select v_move, c.company_id, c.unit_cost, c.currency_id from public.lot_costs c where c.lot_id = p_lot;
  if v_delta < 0 then
    perform app.notify_stock_status(v_lot.company_id, v_lot.product_id, v_lot.location_id, v_before);
  end if;
  return v_move;
end;
$$;

revoke execute on function app.consume_lots(uuid, uuid, uuid, numeric, jsonb, text, text, text, text, uuid, boolean, text)
  from public, anon, authenticated;
revoke execute on function public.register_adjustment(uuid, numeric, text, uuid, text, uuid) from public, anon;
grant execute on function public.register_adjustment(uuid, numeric, text, uuid, text, uuid) to authenticated;
