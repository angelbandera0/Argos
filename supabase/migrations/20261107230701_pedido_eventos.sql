-- L5: real order timeline (pedido_eventos), append-only
create table public.pedido_eventos (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  order_id uuid not null,
  kind text not null check (kind in ('created', 'assigned', 'purchased', 'submitted', 'reviewed', 'returned', 'confirmed', 'adjusted')),
  actor uuid references public.profiles (id),
  at timestamptz not null default now(),
  nota text,
  foreign key (order_id, company_id) references public.pedidos (id, company_id)
);

create index pedido_eventos_order_idx on public.pedido_eventos (order_id, at);

alter table public.pedido_eventos enable row level security;
create policy pedido_eventos_select on public.pedido_eventos for select to authenticated using (app.can_see_order(order_id));
revoke all on public.pedido_eventos from anon, authenticated;
grant select on public.pedido_eventos to authenticated;

insert into public.pedido_eventos (company_id, order_id, kind, actor, at)
select company_id, id, 'created', created_by, created_at from public.pedidos;
insert into public.pedido_eventos (company_id, order_id, kind, actor, at)
select company_id, id, 'submitted', buyer_id, submitted_at from public.pedidos where submitted_at is not null;
insert into public.pedido_eventos (company_id, order_id, kind, actor, at)
select company_id, id, 'confirmed', confirmed_by, confirmed_at from public.pedidos where confirmed_at is not null;
insert into public.pedido_eventos (company_id, order_id, kind, actor, at, nota)
select company_id, order_id, 'adjusted', created_by, created_at, reason from public.pedido_ajustes;

CREATE OR REPLACE FUNCTION public.create_pedido(p_lines jsonb, p_currency uuid DEFAULT NULL::uuid, p_note text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
declare
  v_company uuid := (select app.operator_company());
  v_id uuid;
  v_line uuid;
  v_dest text;
  v_store uuid;
  v_asg uuid;
  v_sum numeric;
  v_qty numeric;
  e jsonb;
  t jsonb;
begin
  if v_company is null then
    select p.company_id into v_company from public.profiles p where p.id = auth.uid();
  end if;
  if v_company is null then
    select ca.company_id into v_company from public.company_admins ca where ca.admin_id = auth.uid() limit 1;
  end if;
  if not (app.is_company_admin(v_company) or app.has_special_warehouse('build_orders', v_company)) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'INVALID_LINES';
  end if;

  insert into public.pedidos (company_id, status, currency_id, note, created_by)
  values (v_company, 'open', p_currency, nullif(trim(p_note), ''), auth.uid()) returning id into v_id;
  insert into public.pedido_eventos (company_id, order_id, kind, actor) values (v_company, v_id, 'created', auth.uid());

  for e in select * from jsonb_array_elements(p_lines) loop
    v_dest := e ->> 'dest';
    v_store := nullif(e ->> 'store_id', '')::uuid;
    v_asg := nullif(e ->> 'assignment_id', '')::uuid;
    v_qty := (e ->> 'qty')::numeric;
    if v_dest not in ('warehouse', 'store', 'direct') or v_qty is null or v_qty <= 0 then
      raise exception 'INVALID_LINES';
    end if;
    if v_asg is not null and not exists (
      select 1 from public.solicitud_asignaciones a join public.solicitud_lineas l on l.id = a.line_id
      where a.id = v_asg and a.kind = 'to_buy' and a.company_id = v_company and l.product_id = (e ->> 'product_id')::uuid
    ) then
      raise exception 'INVALID_ASSIGNMENT';
    end if;
    if v_asg is not null and exists (select 1 from public.pedido_lineas pl where pl.assignment_id = v_asg) then
      raise exception 'ASSIGNMENT_ALREADY_ORDERED';
    end if;
    insert into public.pedido_lineas (company_id, order_id, product_id, dest, dest_store_id, qty, unit, content, assignment_id)
    values (v_company, v_id, (e ->> 'product_id')::uuid, v_dest, case when v_dest = 'store' then v_store end,
      v_qty, e ->> 'unit', (e ->> 'content')::numeric, v_asg)
    returning id into v_line;
    if e ? 'plan' and jsonb_array_length(e -> 'plan') > 0 then
      if v_dest = 'store' then
        raise exception 'INVALID_PLAN';
      end if;
      select coalesce(sum((t2 ->> 'qty')::numeric), 0) into v_sum from jsonb_array_elements(e -> 'plan') t2;
      if v_sum <> v_qty then
        raise exception 'PLAN_MISMATCH';
      end if;
      for t in select * from jsonb_array_elements(e -> 'plan') loop
        insert into public.pedido_linea_tiendas (company_id, line_id, store_id, kind, qty)
        values (v_company, v_line, (t ->> 'store_id')::uuid, 'plan', (t ->> 'qty')::numeric);
      end loop;
    end if;
  end loop;
  return v_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.assign_pedido_buyer(p_order uuid, p_buyer uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
declare
  o public.pedidos;
begin
  select * into o from public.pedidos where id = p_order for update;
  if o.id is null then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if not (app.is_company_admin(o.company_id) or app.has_special_warehouse('build_orders', o.company_id)) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if o.status not in ('open', 'returned') then
    raise exception 'INVALID_STATUS';
  end if;
  if not app.is_eligible_buyer(o.company_id, p_buyer) then
    raise exception 'BUYER_NOT_ELIGIBLE';
  end if;
  update public.pedidos set buyer_id = p_buyer where id = o.id;
  insert into public.pedido_eventos (company_id, order_id, kind, actor, nota) values (o.company_id, o.id, 'assigned', auth.uid(), null);
  insert into public.notifications (company_id, recipient_id, module, operation, priority, title, body, link, actor_id)
  values (o.company_id, p_buyer, 'orders', 'assigned', 'info', 'Pedido asignado', 'Se te asignó un pedido de compra', '/pedidos/' || o.id, auth.uid());
end;
$function$;

CREATE OR REPLACE FUNCTION public.register_pedido_purchase(p_order uuid, p_lines jsonb, p_amount_given numeric DEFAULT NULL::numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
declare
  o public.pedidos;
  e jsonb;
  v_qty numeric;
  v_cost numeric;
begin
  select * into o from public.pedidos where id = p_order for update;
  if o.id is null then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if not (o.buyer_id = auth.uid() or app.is_company_admin(o.company_id)) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if o.status not in ('open', 'returned') then
    raise exception 'INVALID_STATUS';
  end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' then
    raise exception 'INVALID_LINES';
  end if;
  if p_amount_given is not null and p_amount_given < 0 then
    raise exception 'INVALID_QUANTITY';
  end if;
  for e in select * from jsonb_array_elements(p_lines) loop
    v_qty := (e ->> 'qty_bought')::numeric;
    v_cost := (e ->> 'unit_cost')::numeric;
    if v_qty is null or v_qty < 0 or v_cost is null or v_cost < 0 then
      raise exception 'INVALID_QUANTITY';
    end if;
    update public.pedido_lineas set qty_bought = v_qty
      where id = (e ->> 'line_id')::uuid and order_id = o.id;
    if not found then
      raise exception 'LINE_NOT_IN_ORDER';
    end if;
    insert into public.pedido_linea_costos (line_id, company_id, unit_cost)
    values ((e ->> 'line_id')::uuid, o.company_id, v_cost)
    on conflict (line_id) do update set unit_cost = excluded.unit_cost;
  end loop;
  insert into public.pedido_costos (order_id, company_id, amount_given)
  values (o.id, o.company_id, p_amount_given)
  on conflict (order_id) do update set amount_given = coalesce(excluded.amount_given, public.pedido_costos.amount_given);
  insert into public.pedido_eventos (company_id, order_id, kind, actor, nota) values (o.company_id, o.id, 'purchased', auth.uid(), null);
end;
$function$;

CREATE OR REPLACE FUNCTION public.submit_pedido_review(p_order uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
declare
  o public.pedidos;
  v_spent numeric;
  v_given numeric;
  v_left numeric;
begin
  select * into o from public.pedidos where id = p_order for update;
  if o.id is null then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if not (o.buyer_id = auth.uid() or app.is_company_admin(o.company_id)) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if o.status not in ('open', 'returned') then
    raise exception 'INVALID_STATUS';
  end if;
  if exists (
    select 1 from public.pedido_lineas l
    left join public.pedido_linea_costos c on c.line_id = l.id
    where l.order_id = o.id and (l.qty_bought is null or c.line_id is null)
  ) then
    raise exception 'PURCHASE_INCOMPLETE';
  end if;
  select coalesce(sum(l.qty_bought * c.unit_cost), 0) into v_spent
    from public.pedido_lineas l join public.pedido_linea_costos c on c.line_id = l.id where l.order_id = o.id;
  v_spent := round(v_spent, 2);
  insert into public.pedido_costos (order_id, company_id, spent)
  values (o.id, o.company_id, v_spent)
  on conflict (order_id) do update set spent = excluded.spent;
  select amount_given into v_given from public.pedido_costos where order_id = o.id;
  v_left := case when v_given is null then null else v_given - v_spent end;
  update public.pedido_costos set leftover = v_left where order_id = o.id;
  update public.pedidos set status = 'in_review', submitted_at = now(), return_note = null where id = o.id;
  insert into public.pedido_eventos (company_id, order_id, kind, actor, nota) values (o.company_id, o.id, 'submitted', auth.uid(), null);
  perform app.notify(o.company_id, 'orders', 'submitted_for_review', 'info', 'Pedido en revisión',
    'Un pedido de compra espera revisión', '/pedidos/' || o.id,
    p_store => null, p_special => 'review_orders', p_warehouse => true, p_include_admins => true);
  return jsonb_build_object('given', v_given, 'spent', v_spent, 'leftover', v_left);
end;
$function$;

CREATE OR REPLACE FUNCTION public.save_pedido_review(p_order uuid, p_lines jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
declare
  o public.pedidos;
  e jsonb;
  v_qty numeric;
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
  for e in select * from jsonb_array_elements(p_lines) loop
    v_qty := (e ->> 'qty_received')::numeric;
    if v_qty is null or v_qty < 0 then
      raise exception 'INVALID_QUANTITY';
    end if;
    update public.pedido_lineas set qty_received = v_qty where id = (e ->> 'line_id')::uuid and order_id = o.id;
    if not found then
      raise exception 'LINE_NOT_IN_ORDER';
    end if;
  end loop;
  insert into public.pedido_eventos (company_id, order_id, kind, actor, nota) values (o.company_id, o.id, 'reviewed', auth.uid(), null);
end;
$function$;

CREATE OR REPLACE FUNCTION public.confirmar_pedido(p_order uuid, p_lines jsonb DEFAULT '[]'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
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
  insert into public.pedido_eventos (company_id, order_id, kind, actor, nota) values (o.company_id, o.id, 'confirmed', auth.uid(), null);

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
$function$;

CREATE OR REPLACE FUNCTION public.devolver_pedido(p_order uuid, p_note text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
declare
  o public.pedidos;
  v_note text := trim(p_note);
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
  if v_note is null or char_length(v_note) not between 3 and 500 then
    raise exception 'NOTE_REQUIRED';
  end if;
  update public.pedidos set status = 'returned', return_note = v_note where id = o.id;
  insert into public.pedido_eventos (company_id, order_id, kind, actor, nota) values (o.company_id, o.id, 'returned', auth.uid(), v_note);
  if o.buyer_id is not null then
    insert into public.notifications (company_id, recipient_id, module, operation, priority, title, body, link, actor_id)
    values (o.company_id, o.buyer_id, 'orders', 'returned', 'warning', 'Pedido devuelto', v_note, '/pedidos', auth.uid());
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.adjust_pedido(p_order uuid, p_reason text, p_lines jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
declare
  o public.pedidos;
  v_id uuid;
  v_reason text := trim(p_reason);
  e jsonb;
begin
  select * into o from public.pedidos where id = p_order for update;
  if o.id is null then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if not (app.is_company_admin(o.company_id) or app.has_special('correct_orders')) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if o.status <> 'fulfilled' then
    raise exception 'INVALID_STATUS';
  end if;
  if v_reason is null or char_length(v_reason) not between 3 and 300 then
    raise exception 'REASON_TEXT_REQUIRED';
  end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'INVALID_LINES';
  end if;
  insert into public.pedido_ajustes (company_id, order_id, reason, created_by)
  values (o.company_id, o.id, v_reason, auth.uid()) returning id into v_id;
  insert into public.pedido_eventos (company_id, order_id, kind, actor, nota) values (o.company_id, o.id, 'adjusted', auth.uid(), v_reason);
  for e in select * from jsonb_array_elements(p_lines) loop
    if not exists (select 1 from public.pedido_lotes pl where pl.order_id = o.id and pl.lot_id = (e ->> 'lot_id')::uuid) then
      raise exception 'LOT_NOT_IN_ORDER';
    end if;
    perform public.register_adjustment((e ->> 'lot_id')::uuid, (e ->> 'delta')::numeric, v_reason, null, 'pedido_ajuste', v_id);
  end loop;
  return v_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.delete_test_company(p_company uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
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
  delete from public.pedido_lotes where company_id = p_company;
  delete from public.pedido_linea_tiendas where company_id = p_company;
  delete from public.pedido_linea_costos where company_id = p_company;
  delete from public.pedido_costos where company_id = p_company;
  delete from public.pedido_eventos where company_id = p_company;
  delete from public.pedido_ajustes where company_id = p_company;
  delete from public.pedido_lineas where company_id = p_company;
  delete from public.pedidos where company_id = p_company;
  delete from public.solicitud_asignaciones where company_id = p_company;
  delete from public.solicitud_lineas where company_id = p_company;
  delete from public.solicitudes where company_id = p_company;
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
$function$;
