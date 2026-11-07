create function public.attend_request_line(
  p_line uuid, p_kind text, p_qty_base numeric, p_reason text default null,
  p_picks jsonb default null, p_deviation_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_company uuid;
  v_store uuid;
  v_request uuid;
  v_product uuid;
  v_id uuid;
  v_name text;
  v_pname text;
  v_from uuid;
  v_to uuid;
begin
  select l.company_id, s.store_id, l.request_id, l.product_id, st.name, p.name
    into v_company, v_store, v_request, v_product, v_name, v_pname
  from public.solicitud_lineas l
  join public.solicitudes s on s.id = l.request_id
  join public.stores st on st.id = s.store_id
  join public.products p on p.id = l.product_id
  where l.id = p_line;
  if v_company is null then
    raise exception 'LINE_NOT_FOUND';
  end if;
  if not (app.is_company_admin(v_company) or app.has_special_warehouse('handle_requests', v_company)) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_kind not in ('fulfilled', 'to_buy', 'pending', 'rejected') then
    raise exception 'INVALID_KIND';
  end if;
  if p_qty_base is null or p_qty_base <= 0 then
    raise exception 'INVALID_QUANTITY';
  end if;
  if p_kind = 'rejected' and char_length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'REASON_REQUIRED';
  end if;

  insert into public.solicitud_asignaciones (company_id, line_id, kind, qty_base, reason, decided_by)
  values (v_company, p_line, p_kind, p_qty_base, nullif(trim(p_reason), ''), auth.uid())
  returning id into v_id;

  if p_kind = 'fulfilled' then
    select l.id into v_from from public.locations l where l.company_id = v_company and l.kind = 'warehouse';
    select l.id into v_to from public.locations l where l.store_id = v_store and l.kind = 'store';
    perform public.register_transfer(v_product, v_from, v_to, p_qty_base, 'base', p_picks, p_deviation_reason,
      'solicitud_asignacion', v_id);
  end if;

  perform app.notify(v_company, 'requests', case when p_kind = 'rejected' then 'rejected' else 'handled' end,
    case when p_kind = 'rejected' then 'warning' else 'info' end,
    case when p_kind = 'rejected' then 'Solicitud rechazada' else 'Solicitud atendida' end,
    v_pname || ' (' || v_name || '): ' || p_kind, '/solicitudes/' || v_request,
    p_store => v_store, p_module_perm => 'requests.view', p_include_admins => false);
  return v_id;
end;
$$;

revoke execute on function public.attend_request_line(uuid, text, numeric, text, jsonb, text) from public, anon;
grant execute on function public.attend_request_line(uuid, text, numeric, text, jsonb, text) to authenticated;
