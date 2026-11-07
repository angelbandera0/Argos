create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  status text not null default 'draft' check (status in ('draft', 'open', 'in_review', 'fulfilled', 'returned', 'cancelled')),
  currency_id uuid,
  buyer_id uuid references public.profiles (id),
  note text check (char_length(note) <= 500),
  return_note text check (char_length(return_note) <= 500),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  confirmed_at timestamptz,
  confirmed_by uuid references public.profiles (id),
  unique (id, company_id),
  foreign key (currency_id, company_id) references public.currencies (id, company_id)
);

create table public.pedido_lineas (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  order_id uuid not null,
  product_id uuid not null,
  dest text not null check (dest in ('warehouse', 'store', 'direct')),
  dest_store_id uuid,
  qty numeric(14, 3) not null check (qty > 0),
  unit text not null,
  content numeric(14, 3) not null check (content > 0),
  qty_bought numeric(14, 3) check (qty_bought >= 0),
  qty_received numeric(14, 3) check (qty_received >= 0),
  check ((dest = 'store') = (dest_store_id is not null)),
  unique (id, company_id),
  foreign key (order_id, company_id) references public.pedidos (id, company_id) on delete cascade,
  foreign key (product_id, company_id) references public.products (id, company_id),
  foreign key (dest_store_id, company_id) references public.stores (id, company_id)
);

create table public.pedido_linea_tiendas (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  line_id uuid not null,
  store_id uuid not null,
  kind text not null check (kind in ('plan', 'received')),
  qty numeric(14, 3) not null check (qty > 0),
  unique (line_id, store_id, kind),
  foreign key (line_id, company_id) references public.pedido_lineas (id, company_id) on delete cascade,
  foreign key (store_id, company_id) references public.stores (id, company_id)
);

create table public.pedido_costos (
  order_id uuid primary key,
  company_id uuid not null references public.companies (id),
  amount_given numeric(18, 2) check (amount_given >= 0),
  spent numeric(18, 2),
  leftover numeric(18, 2),
  shortage_value numeric(18, 2),
  foreign key (order_id, company_id) references public.pedidos (id, company_id) on delete cascade
);

create table public.pedido_linea_costos (
  line_id uuid primary key,
  company_id uuid not null references public.companies (id),
  unit_cost numeric(18, 6) not null check (unit_cost >= 0),
  shortage_value numeric(18, 2),
  foreign key (line_id, company_id) references public.pedido_lineas (id, company_id) on delete cascade
);

create table public.pedido_lotes (
  lot_id uuid primary key,
  company_id uuid not null references public.companies (id),
  order_id uuid not null,
  line_id uuid not null,
  foreign key (lot_id, company_id) references public.lots (id, company_id),
  foreign key (line_id, company_id) references public.pedido_lineas (id, company_id)
);

create table public.pedido_ajustes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  order_id uuid not null,
  reason text not null check (char_length(trim(reason)) between 3 and 300),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (id, company_id),
  foreign key (order_id, company_id) references public.pedidos (id, company_id)
);

create index pedidos_company_status_idx on public.pedidos (company_id, status);
create index pedido_lineas_order_idx on public.pedido_lineas (order_id);
create index pedido_lotes_order_idx on public.pedido_lotes (order_id);

create function app.can_see_order(p_order uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1 from public.pedidos o
    where o.id = p_order
      and (
        app.is_company_admin(o.company_id)
        or o.buyer_id = auth.uid()
        or app.has_special_warehouse('build_orders', o.company_id)
        or app.has_special_warehouse('review_orders', o.company_id)
        or exists (
          select 1 from public.pedido_lineas l
          left join public.pedido_linea_tiendas t on t.line_id = l.id
          where l.order_id = o.id
            and app.has_special_in_store('review_orders', coalesce(l.dest_store_id, t.store_id))
        )
      )
  )
$$;

create function app.can_review_location(p_company uuid, p_location uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select app.is_company_admin(p_company) or coalesce((
    select case l.kind
      when 'warehouse' then app.has_special_warehouse('review_orders', p_company)
      else app.has_special_in_store('review_orders', l.store_id) end
    from public.locations l where l.id = p_location and l.company_id = p_company
  ), false)
$$;

alter table public.pedidos enable row level security;
alter table public.pedido_lineas enable row level security;
alter table public.pedido_linea_tiendas enable row level security;
alter table public.pedido_costos enable row level security;
alter table public.pedido_linea_costos enable row level security;
alter table public.pedido_lotes enable row level security;
alter table public.pedido_ajustes enable row level security;

create policy pedidos_select on public.pedidos for select to authenticated using (app.can_see_order(id));
create policy pedido_lineas_select on public.pedido_lineas for select to authenticated using (app.can_see_order(order_id));
create policy pedido_linea_tiendas_select on public.pedido_linea_tiendas for select to authenticated
using (exists (select 1 from public.pedido_lineas l where l.id = line_id and app.can_see_order(l.order_id)));
create policy pedido_lotes_select on public.pedido_lotes for select to authenticated using (app.can_see_order(order_id));
create policy pedido_ajustes_select on public.pedido_ajustes for select to authenticated using (app.can_see_order(order_id));
create policy pedido_costos_select on public.pedido_costos for select to authenticated using (
  app.is_company_admin(company_id)
  or (app.has_special('see_costs') and company_id = (select app.operator_company()))
);
create policy pedido_linea_costos_select on public.pedido_linea_costos for select to authenticated using (
  app.is_company_admin(company_id)
  or (app.has_special('see_costs') and company_id = (select app.operator_company()))
);

revoke all on public.pedidos, public.pedido_lineas, public.pedido_linea_tiendas, public.pedido_costos,
  public.pedido_linea_costos, public.pedido_lotes, public.pedido_ajustes from anon, authenticated;
grant select on public.pedidos, public.pedido_lineas, public.pedido_linea_tiendas, public.pedido_costos,
  public.pedido_linea_costos, public.pedido_lotes, public.pedido_ajustes to authenticated;

revoke execute on function app.can_see_order(uuid), app.can_review_location(uuid, uuid) from public, anon;
grant execute on function app.can_see_order(uuid) to authenticated;

create function public.confirmar_pedido(p_order uuid, p_lines jsonb default '[]')
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
          if not app.can_review_location(o.company_id, v_loc) then
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

create function public.devolver_pedido(p_order uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
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
  if o.buyer_id is not null then
    insert into public.notifications (company_id, recipient_id, module, operation, priority, title, body, link, actor_id)
    values (o.company_id, o.buyer_id, 'orders', 'returned', 'warning', 'Pedido devuelto', v_note, '/pedidos', auth.uid());
  end if;
end;
$$;

create function public.adjust_pedido(p_order uuid, p_reason text, p_lines jsonb)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog
as $$
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
  for e in select * from jsonb_array_elements(p_lines) loop
    if not exists (select 1 from public.pedido_lotes pl where pl.order_id = o.id and pl.lot_id = (e ->> 'lot_id')::uuid) then
      raise exception 'LOT_NOT_IN_ORDER';
    end if;
    perform public.register_adjustment((e ->> 'lot_id')::uuid, (e ->> 'delta')::numeric, v_reason, null, 'pedido_ajuste', v_id);
  end loop;
  return v_id;
end;
$$;

revoke execute on function public.confirmar_pedido(uuid, jsonb), public.devolver_pedido(uuid, text),
  public.adjust_pedido(uuid, text, jsonb) from public, anon;
grant execute on function public.confirmar_pedido(uuid, jsonb), public.devolver_pedido(uuid, text),
  public.adjust_pedido(uuid, text, jsonb) to authenticated;

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
      when 'solicitudes' then 'requests'
      when 'solicitud_lineas' then 'requests'
      when 'solicitud_asignaciones' then 'requests'
      when 'pedidos' then 'orders'
      when 'pedido_lineas' then 'orders'
      when 'pedido_ajustes' then 'orders'
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

create trigger audit_solicitudes after insert or update on public.solicitudes for each row execute function app.audit_row();
create trigger audit_solicitud_lineas after insert or update on public.solicitud_lineas for each row execute function app.audit_row();
create trigger audit_solicitud_asignaciones after insert or update on public.solicitud_asignaciones for each row execute function app.audit_row();
create trigger audit_pedidos after insert or update on public.pedidos for each row execute function app.audit_row();
create trigger audit_pedido_lineas after insert or update on public.pedido_lineas for each row execute function app.audit_row();
create trigger audit_pedido_ajustes after insert on public.pedido_ajustes for each row execute function app.audit_row();

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
  delete from public.pedido_lotes where company_id = p_company;
  delete from public.pedido_linea_tiendas where company_id = p_company;
  delete from public.pedido_linea_costos where company_id = p_company;
  delete from public.pedido_costos where company_id = p_company;
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
$$;
