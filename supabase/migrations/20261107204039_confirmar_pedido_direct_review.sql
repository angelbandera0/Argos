create or replace function public.confirmar_pedido(p_order uuid, p_lines jsonb default '[]')
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  o public.pedidos;
  l public.pedido_lineas;
  v_ov jsonb;
  v_recv numeric;
  v_cost numeric;
  v_loc uuid;
  v_sum numeric;
  v_spent numeric := 0;
  v_short numeric := 0;
  v_line_short numeric;
  v_has_short boolean := false;
  r jsonb;
begin
  select * into o from public.pedidos where id = p_order for update;
  if o.id is null then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if not (app.is_company_admin(o.company_id) or app.has_special('review_orders')) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if o.buyer_id is not distinct from auth.uid() then
    raise exception 'BUYER_CANNOT_REVIEW' using errcode = '42501';
  end if;
  if o.status <> 'in_review' then
    raise exception 'INVALID_STATUS';
  end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' then
    raise exception 'INVALID_LINES';
  end if;

  for l in select * from public.pedido_lineas x where x.order_id = o.id order by x.id loop
    select e into v_ov from jsonb_array_elements(p_lines) e where (e ->> 'line_id')::uuid = l.id limit 1;
    v_recv := coalesce((v_ov ->> 'qty_received')::numeric, l.qty_received, l.qty_bought, 0);
    if v_recv < 0 then
      raise exception 'INVALID_QUANTITY';
    end if;
    select c.unit_cost into v_cost from public.pedido_linea_costos c where c.line_id = l.id;
    if (v_recv > 0 or coalesce(l.qty_bought, 0) > 0) and v_cost is null then
      raise exception 'MISSING_COST';
    end if;
    v_cost := coalesce(v_cost, 0);
    v_spent := v_spent + coalesce(l.qty_bought, 0) * v_cost;
    v_line_short := round((coalesce(l.qty_bought, 0) - v_recv) * v_cost, 2);
    v_short := v_short + v_line_short;
    v_has_short := v_has_short or v_recv < coalesce(l.qty_bought, 0);

    update public.pedido_lineas set qty_received = v_recv where id = l.id;
    update public.pedido_linea_costos set shortage_value = v_line_short where line_id = l.id;
    delete from public.pedido_linea_tiendas where line_id = l.id and kind = 'received';

    if v_recv > 0 then
      if l.dest = 'direct' then
        select coalesce(sum((x ->> 'qty')::numeric), 0) into v_sum
          from jsonb_array_elements(coalesce(v_ov -> 'reparto', '[]')) x;
        if v_sum = 0 then
          raise exception 'REPARTO_REQUIRED';
        end if;
        if v_sum <> v_recv then
          raise exception 'REPARTO_MISMATCH';
        end if;
        for r in select * from jsonb_array_elements(v_ov -> 'reparto') loop
          select lc.id into v_loc from public.locations lc
            where lc.company_id = o.company_id and lc.kind = 'store' and lc.store_id = (r ->> 'store_id')::uuid;
          if v_loc is null then
            raise exception 'INVALID_LOCATION';
          end if;
          if not (app.can_review_location(o.company_id, v_loc) or app.has_special_warehouse('review_orders', o.company_id)) then
            raise exception 'FORBIDDEN' using errcode = '42501';
          end if;
          insert into public.pedido_linea_tiendas (company_id, line_id, store_id, kind, qty)
          values (o.company_id, l.id, (r ->> 'store_id')::uuid, 'received', (r ->> 'qty')::numeric)
          on conflict (line_id, store_id, kind) do update set qty = public.pedido_linea_tiendas.qty + excluded.qty;
          insert into public.pedido_lotes (lot_id, company_id, order_id, line_id)
          values (app.create_lot(o.company_id, l.product_id, v_loc, 'purchase', null, (r ->> 'qty')::numeric,
            l.unit, l.content, v_cost, o.currency_id, current_date, 'pedido', o.id), o.company_id, o.id, l.id);
        end loop;
      else
        select lc.id into v_loc from public.locations lc
          where lc.company_id = o.company_id
            and case l.dest when 'warehouse' then lc.kind = 'warehouse' else lc.kind = 'store' and lc.store_id = l.dest_store_id end;
        if v_loc is null then
          raise exception 'INVALID_LOCATION';
        end if;
        if not app.can_review_location(o.company_id, v_loc) then
          raise exception 'FORBIDDEN' using errcode = '42501';
        end if;
        insert into public.pedido_lotes (lot_id, company_id, order_id, line_id)
        values (app.create_lot(o.company_id, l.product_id, v_loc, 'purchase', null, v_recv,
          l.unit, l.content, v_cost, o.currency_id, current_date, 'pedido', o.id), o.company_id, o.id, l.id);
      end if;
    end if;
  end loop;

  insert into public.pedido_costos (order_id, company_id, amount_given, spent, leftover, shortage_value)
  values (o.id, o.company_id, null, round(v_spent, 2), null, round(v_short, 2))
  on conflict (order_id) do update set spent = excluded.spent, shortage_value = excluded.shortage_value,
    leftover = public.pedido_costos.amount_given - excluded.spent;

  update public.pedidos set status = 'fulfilled', confirmed_at = now(), confirmed_by = auth.uid() where id = o.id;

  if o.buyer_id is not null then
    insert into public.notifications (company_id, recipient_id, module, operation, priority, title, body, link, actor_id)
    values (o.company_id, o.buyer_id, 'orders', 'fulfilled', 'info', 'Pedido cumplido', 'Tu pedido fue confirmado', '/pedidos', auth.uid());
  end if;
  if v_has_short then
    perform app.notify(o.company_id, 'orders', 'shortage_detected', 'warning', 'Faltante detectado en pedido',
      'Un pedido se confirmó con cantidades menores a las compradas', '/pedidos',
      p_store => null, p_special => 'build_orders', p_warehouse => true, p_include_admins => true);
  end if;
end;
$$;

