alter table public.pedido_lineas add column assignment_id uuid unique references public.solicitud_asignaciones (id);

create function app.is_eligible_buyer(p_company uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1 from public.company_admins ca
    join public.profiles p on p.id = ca.admin_id and p.status = 'active' and p.deleted_at is null
    where ca.company_id = p_company and ca.admin_id = p_user
  ) or exists (
    select 1 from public.user_stores us
    join public.profiles p on p.id = us.user_id and p.kind = 'operator' and p.status = 'active' and p.deleted_at is null
    join public.roles ro on ro.id = us.role_id and ro.deleted_at is null
    join public.role_special_permissions sp on sp.role_id = ro.id and sp.permission = 'make_purchases'
    where us.company_id = p_company and us.user_id = p_user and app.is_operational(us.store_id)
      and not exists (select 1 from public.role_company_exclusions e where e.role_id = us.role_id and e.company_id = us.company_id)
  )
$$;

create function public.create_pedido(p_lines jsonb, p_currency uuid default null, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog
as $$
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
$$;

create function public.assign_pedido_buyer(p_order uuid, p_buyer uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
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
  insert into public.notifications (company_id, recipient_id, module, operation, priority, title, body, link, actor_id)
  values (o.company_id, p_buyer, 'orders', 'assigned', 'info', 'Pedido asignado', 'Se te asignó un pedido de compra', '/pedidos/' || o.id, auth.uid());
end;
$$;

create function public.register_pedido_purchase(p_order uuid, p_lines jsonb, p_amount_given numeric default null)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
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
end;
$$;

create function public.submit_pedido_review(p_order uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
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
  perform app.notify(o.company_id, 'orders', 'submitted_for_review', 'info', 'Pedido en revisión',
    'Un pedido de compra espera revisión', '/pedidos/' || o.id,
    p_store => null, p_special => 'review_orders', p_warehouse => true, p_include_admins => true);
  return jsonb_build_object('given', v_given, 'spent', v_spent, 'leftover', v_left);
end;
$$;

revoke execute on function app.is_eligible_buyer(uuid, uuid), public.create_pedido(jsonb, uuid, text),
  public.assign_pedido_buyer(uuid, uuid), public.register_pedido_purchase(uuid, jsonb, numeric),
  public.submit_pedido_review(uuid) from public, anon;
grant execute on function public.create_pedido(jsonb, uuid, text), public.assign_pedido_buyer(uuid, uuid),
  public.register_pedido_purchase(uuid, jsonb, numeric), public.submit_pedido_review(uuid) to authenticated;
