create function app.ordered_assignment_ids()
returns setof uuid
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select l.assignment_id from public.pedido_lineas l where l.assignment_id is not null
$$;

revoke execute on function app.ordered_assignment_ids() from public, anon;
grant execute on function app.ordered_assignment_ids() to authenticated;

create or replace view public.bolsa_por_comprar with (security_invoker = true) as
select l.company_id, l.product_id, s.store_id, sum(a.qty_base)::numeric(14, 3) as qty_base, count(*)::int as decisions
from public.solicitud_asignaciones a
join public.solicitud_lineas l on l.id = a.line_id
join public.solicitudes s on s.id = l.request_id
where a.kind = 'to_buy' and a.id not in (select app.ordered_assignment_ids())
group by l.company_id, l.product_id, s.store_id;

create function public.save_pedido_review(p_order uuid, p_lines jsonb)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
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
end;
$$;

revoke execute on function public.save_pedido_review(uuid, jsonb) from public, anon;
grant execute on function public.save_pedido_review(uuid, jsonb) to authenticated;
