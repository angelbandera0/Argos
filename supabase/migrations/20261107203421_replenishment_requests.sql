create table public.solicitudes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  store_id uuid not null,
  note text check (char_length(note) <= 500),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (id, company_id),
  foreign key (store_id, company_id) references public.stores (id, company_id)
);

create table public.solicitud_lineas (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  request_id uuid not null,
  product_id uuid not null,
  qty numeric(14, 3) not null check (qty > 0),
  unit text not null,
  qty_base numeric(14, 3) not null check (qty_base > 0),
  unique (id, company_id),
  unique (request_id, product_id),
  foreign key (request_id, company_id) references public.solicitudes (id, company_id) on delete cascade,
  foreign key (product_id, company_id) references public.products (id, company_id)
);

create table public.solicitud_asignaciones (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  line_id uuid not null,
  kind text not null check (kind in ('fulfilled', 'to_buy', 'pending', 'rejected')),
  qty_base numeric(14, 3) not null check (qty_base > 0),
  reason text check (char_length(reason) <= 500),
  decided_by uuid references public.profiles (id),
  decided_at timestamptz not null default now(),
  check (kind <> 'rejected' or char_length(trim(reason)) > 0),
  foreign key (line_id, company_id) references public.solicitud_lineas (id, company_id) on delete cascade
);

create index solicitudes_store_idx on public.solicitudes (store_id, created_at desc);
create index solicitud_lineas_request_idx on public.solicitud_lineas (request_id);
create index solicitud_asignaciones_line_idx on public.solicitud_asignaciones (line_id);
create index solicitud_asignaciones_to_buy_idx on public.solicitud_asignaciones (company_id) where kind = 'to_buy';

create function app.guard_assignment_total()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  perform 1 from public.solicitud_lineas l where l.id = new.line_id for update;
  if (select coalesce(sum(a.qty_base), 0) from public.solicitud_asignaciones a where a.line_id = new.line_id and a.id <> new.id)
    + new.qty_base > (select l.qty_base from public.solicitud_lineas l where l.id = new.line_id) then
    raise exception 'ASSIGNMENT_EXCEEDS_LINE';
  end if;
  return new;
end;
$$;

create trigger solicitud_asignaciones_total before insert or update on public.solicitud_asignaciones
  for each row execute function app.guard_assignment_total();

create function app.can_see_request(p_request uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1 from public.solicitudes s
    where s.id = p_request
      and (
        app.is_company_admin(s.company_id)
        or app.has_special_warehouse('handle_requests', s.company_id)
        or (app.can(s.company_id, 'requests', 'view') and s.store_id = app.active_store())
      )
  )
$$;

create view public.solicitud_linea_estado with (security_invoker = true) as
select l.id as line_id, l.request_id, l.company_id, l.qty_base,
  coalesce(a.assigned, 0)::numeric(14, 3) as assigned,
  case
    when coalesce(a.assigned, 0) = 0 then 'new'
    when a.assigned < l.qty_base then 'in_progress'
    when a.to_buy then 'to_buy'
    when a.pending then 'pending'
    when a.fulfilled then 'fulfilled'
    else 'rejected'
  end as status
from public.solicitud_lineas l
left join (
  select x.line_id, sum(x.qty_base) as assigned, bool_or(x.kind = 'to_buy') as to_buy,
    bool_or(x.kind = 'pending') as pending, bool_or(x.kind = 'fulfilled') as fulfilled
  from public.solicitud_asignaciones x group by x.line_id
) a on a.line_id = l.id;

create view public.solicitud_estado with (security_invoker = true) as
select s.id as request_id, s.company_id, s.store_id,
  case
    when bool_and(e.status = 'new') then 'new'
    when bool_or(e.status in ('new', 'in_progress')) then 'in_progress'
    when bool_or(e.status = 'to_buy') then 'to_buy'
    when bool_or(e.status = 'pending') then 'pending'
    when bool_and(e.status = 'rejected') then 'rejected'
    else 'fulfilled'
  end as status
from public.solicitudes s
join public.solicitud_linea_estado e on e.request_id = s.id
group by s.id, s.company_id, s.store_id;

create view public.bolsa_por_comprar with (security_invoker = true) as
select l.company_id, l.product_id, s.store_id, sum(a.qty_base)::numeric(14, 3) as qty_base, count(*)::int as decisions
from public.solicitud_asignaciones a
join public.solicitud_lineas l on l.id = a.line_id
join public.solicitudes s on s.id = l.request_id
where a.kind = 'to_buy'
group by l.company_id, l.product_id, s.store_id;

alter table public.solicitudes enable row level security;
alter table public.solicitud_lineas enable row level security;
alter table public.solicitud_asignaciones enable row level security;

create policy solicitudes_select on public.solicitudes for select to authenticated using (app.can_see_request(id));
create policy solicitud_lineas_select on public.solicitud_lineas for select to authenticated using (app.can_see_request(request_id));
create policy solicitud_asignaciones_select on public.solicitud_asignaciones for select to authenticated
using (exists (select 1 from public.solicitud_lineas l where l.id = line_id and app.can_see_request(l.request_id)));

revoke all on public.solicitudes, public.solicitud_lineas, public.solicitud_asignaciones,
  public.solicitud_linea_estado, public.solicitud_estado, public.bolsa_por_comprar from anon, authenticated;
grant select on public.solicitudes, public.solicitud_lineas, public.solicitud_asignaciones,
  public.solicitud_linea_estado, public.solicitud_estado to authenticated;
grant select on public.bolsa_por_comprar to authenticated;

create function public.create_request(p_store uuid, p_lines jsonb, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_company uuid;
  v_id uuid;
  v_store_name text;
  v_unit text;
  v_eq numeric;
  v_qty numeric;
  v_product uuid;
  v_base text;
  e jsonb;
begin
  select s.company_id, s.name into v_company, v_store_name from public.stores s where s.id = p_store;
  if v_company is null then
    raise exception 'STORE_NOT_FOUND';
  end if;
  if not (
    app.has_special_in_store('request_replenishment', p_store)
    and (app.is_company_admin(v_company) or (app.can(v_company, 'requests', 'view') and p_store = app.active_store()))
  ) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'EMPTY_REQUEST';
  end if;

  insert into public.solicitudes (company_id, store_id, note, created_by)
  values (v_company, p_store, nullif(trim(p_note), ''), auth.uid()) returning id into v_id;

  for e in select * from jsonb_array_elements(p_lines) loop
    v_product := (e ->> 'product_id')::uuid;
    v_qty := (e ->> 'qty')::numeric;
    v_unit := e ->> 'unit';
    if v_qty is null or v_qty <= 0 then
      raise exception 'INVALID_QUANTITY';
    end if;
    select s.base_unit into v_base from public.product_stock_settings s
      where s.product_id = v_product and s.company_id = v_company and s.storable;
    if v_base is null then
      raise exception 'PRODUCT_NOT_STORABLE';
    end if;
    v_eq := null;
    if lower(trim(v_unit)) = 'base' then
      v_eq := 1;
    else
      select u.equivalence into v_eq from public.product_movement_units u
        where u.product_id = v_product and u.company_id = v_company and u.active and u.deleted_at is null
          and lower(trim(u.name)) = lower(trim(v_unit));
    end if;
    if v_eq is null then
      raise exception 'INVALID_UNIT';
    end if;
    insert into public.solicitud_lineas (company_id, request_id, product_id, qty, unit, qty_base)
    values (v_company, v_id, v_product, v_qty, trim(v_unit), round(v_qty * v_eq, 3));
  end loop;

  perform app.notify(v_company, 'requests', 'created', 'info', 'Nueva solicitud de reposición',
    v_store_name || ': ' || jsonb_array_length(p_lines) || ' producto(s)', '/solicitudes',
    p_store => null, p_special => 'handle_requests', p_warehouse => true, p_include_admins => true);
  return v_id;
end;
$$;

revoke execute on function app.guard_assignment_total() from public, anon, authenticated;
revoke execute on function app.can_see_request(uuid) from public, anon;
grant execute on function app.can_see_request(uuid) to authenticated;
revoke execute on function public.create_request(uuid, jsonb, text) from public, anon;
grant execute on function public.create_request(uuid, jsonb, text) to authenticated;

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
