-- L8: lot cost correction = value adjustment (ADR-018)
create table public.lot_cost_adjustments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  lot_id uuid not null,
  order_id uuid,
  old_unit_cost numeric(18, 6),
  new_unit_cost numeric(18, 6) not null check (new_unit_cost >= 0),
  currency_id uuid,
  reason text not null check (char_length(reason) between 3 and 300),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  foreign key (lot_id, company_id) references public.lots (id, company_id),
  foreign key (order_id, company_id) references public.pedidos (id, company_id)
);
create index lot_cost_adjustments_lot_idx on public.lot_cost_adjustments (lot_id, created_at);

create trigger lot_cost_adjustments_immutable before update or delete on public.lot_cost_adjustments
  for each row execute function app.guard_ledger_immutable();

alter table public.lot_cost_adjustments enable row level security;
create policy lot_cost_adjustments_select on public.lot_cost_adjustments for select to authenticated using (
  app.is_company_admin(company_id)
  or (app.has_special('see_costs') and company_id = (select app.operator_company()))
);
revoke all on public.lot_cost_adjustments from anon, authenticated;
grant select on public.lot_cost_adjustments to authenticated;

create trigger audit_lot_cost_adjustments after insert on public.lot_cost_adjustments for each row execute function app.audit_row();

create function public.adjust_lot_cost(p_lot uuid, p_new_unit_cost numeric, p_reason text)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  l public.lots;
  c public.lot_costs;
  v_reason text := trim(p_reason);
  v_order uuid;
  v_id uuid;
begin
  select * into l from public.lots where id = p_lot for update;
  if l.id is null or not (app.is_company_admin(l.company_id) or l.company_id = (select app.operator_company())) then
    raise exception 'LOT_NOT_FOUND';
  end if;
  if not (app.is_company_admin(l.company_id) or (app.has_special('see_costs') and app.has_special('correct_orders'))) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_new_unit_cost is null or p_new_unit_cost < 0 or round(p_new_unit_cost, 6) <> p_new_unit_cost then
    raise exception 'INVALID_COST';
  end if;
  if v_reason is null or char_length(v_reason) not between 3 and 300 then
    raise exception 'REASON_TEXT_REQUIRED';
  end if;
  select * into c from public.lot_costs where lot_id = l.id for update;
  if c.currency_id is null then
    raise exception 'CURRENCY_REQUIRED';
  end if;
  select pl.order_id into v_order from public.pedido_lotes pl where pl.lot_id = l.id limit 1;
  insert into public.lot_cost_adjustments (company_id, lot_id, order_id, old_unit_cost, new_unit_cost, currency_id, reason, created_by)
  values (l.company_id, l.id, v_order, c.unit_cost, p_new_unit_cost, c.currency_id, v_reason, auth.uid()) returning id into v_id;
  update public.lot_costs set unit_cost = p_new_unit_cost where lot_id = l.id;
  if v_order is not null then
    insert into public.pedido_eventos (company_id, order_id, kind, actor, nota)
    values (l.company_id, v_order, 'adjusted', auth.uid(), v_reason);
  end if;
  return v_id;
end;
$$;
revoke execute on function public.adjust_lot_cost(uuid, numeric, text) from public, anon;
grant execute on function public.adjust_lot_cost(uuid, numeric, text) to authenticated;

do $$
declare
  d text;
  d2 text;
begin
  d := pg_get_functiondef('app.audit_row'::regproc);
  d2 := replace(d, $q$when 'stock_movements' then 'stock'$q$, $q$when 'stock_movements' then 'stock' when 'lot_cost_adjustments' then 'stock'$q$);
  if d2 = d then raise exception 'audit_row patch failed'; end if;
  execute d2;

  d := pg_get_functiondef('public.delete_test_company'::regproc);
  d2 := replace(d, 'delete from public.movement_costs where company_id = p_company;',
    'delete from public.lot_cost_adjustments where company_id = p_company;' || chr(10) || '  delete from public.movement_costs where company_id = p_company;');
  d2 := replace(d2, 'alter table public.movement_costs disable trigger movement_costs_immutable;',
    'alter table public.movement_costs disable trigger movement_costs_immutable;' || chr(10) || '  alter table public.lot_cost_adjustments disable trigger lot_cost_adjustments_immutable;');
  d2 := replace(d2, 'alter table public.movement_costs enable trigger movement_costs_immutable;',
    'alter table public.movement_costs enable trigger movement_costs_immutable;' || chr(10) || '  alter table public.lot_cost_adjustments enable trigger lot_cost_adjustments_immutable;');
  if d2 = d then raise exception 'delete_test_company patch failed'; end if;
  execute d2;
end $$;
