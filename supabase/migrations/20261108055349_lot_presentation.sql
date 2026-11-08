alter table public.lots
  add column presentation_name text,
  add column presentation_content numeric(14, 3) check (presentation_content > 0),
  add check ((presentation_name is null) = (presentation_content is null));

alter table public.stock_movements
  add column asked_qty numeric(14, 3) check (asked_qty > 0),
  add column asked_unit text,
  add check ((asked_qty is null) = (asked_unit is null));

update public.lots l set presentation_name = l.captured_unit, presentation_content = l.content
where l.origin <> 'transfer' and l.captured_unit not in ('lb', 'kg', 'g', 'oz', 'l', 'ml', 'u');

update public.lots l set presentation_name = s.presentation_name, presentation_content = s.presentation_content
from public.lots s
where l.origin = 'transfer' and s.id = l.source_lot_id and s.presentation_name is not null;

create or replace function app.create_lot(
  p_company uuid, p_product uuid, p_location uuid, p_origin text, p_source_lot uuid,
  p_captured_qty numeric, p_captured_unit text, p_content numeric, p_unit_cost numeric,
  p_currency uuid, p_received date, p_doc_type text default null, p_doc_id uuid default null,
  p_type text default null, p_reason_code text default null, p_reason_text text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_base numeric(14, 3);
  v_lot uuid;
  v_move uuid;
  v_type text;
  v_cost numeric(18, 6);
  v_currency uuid;
  v_pname text;
  v_pcontent numeric(14, 3);
begin
  if not exists (select 1 from public.product_stock_settings s
    where s.product_id = p_product and s.company_id = p_company and s.storable) then
    raise exception 'PRODUCT_NOT_STORABLE';
  end if;
  if not exists (select 1 from public.locations l where l.id = p_location and l.company_id = p_company and l.active) then
    raise exception 'INVALID_LOCATION';
  end if;
  if p_captured_qty is null or p_captured_qty <= 0 then
    raise exception 'INVALID_QUANTITY';
  end if;
  if p_content is null or p_content <= 0 then
    raise exception 'INVALID_CONTENT';
  end if;
  if p_unit_cost is not null then
    if p_unit_cost < 0 then
      raise exception 'INVALID_COST';
    end if;
    if not exists (select 1 from public.currencies c
      where c.id = p_currency and c.company_id = p_company and c.active and c.deleted_at is null) then
      raise exception 'INVALID_CURRENCY';
    end if;
    v_cost := p_unit_cost;
    v_currency := p_currency;
  end if;
  if p_source_lot is not null and not exists (select 1 from public.lots l
    where l.id = p_source_lot and l.company_id = p_company and l.product_id = p_product) then
    raise exception 'INVALID_SOURCE_LOT';
  end if;

  v_base := round(p_captured_qty * p_content, 3);
  if v_base <= 0 then
    raise exception 'INVALID_QUANTITY';
  end if;
  v_type := coalesce(p_type, case p_origin
    when 'initial_entry' then 'initial_entry'
    when 'purchase' then 'purchase_entry'
    when 'direct_entry' then 'direct_entry'
    when 'transfer' then 'transfer_in'
    when 'adjustment' then 'adjustment'
  end);

  if p_origin = 'transfer' and p_source_lot is not null then
    select l.presentation_name, l.presentation_content into v_pname, v_pcontent from public.lots l where l.id = p_source_lot;
  elsif p_captured_unit not in ('lb', 'kg', 'g', 'oz', 'l', 'ml', 'u') then
    v_pname := p_captured_unit;
    v_pcontent := p_content;
  end if;

  insert into public.lots (company_id, product_id, location_id, origin, source_lot_id, initial_qty, remaining,
    captured_qty, captured_unit, content, received_at, created_by, presentation_name, presentation_content)
  values (p_company, p_product, p_location, p_origin, p_source_lot, v_base, v_base,
    p_captured_qty, p_captured_unit, p_content, p_received, auth.uid(), v_pname, v_pcontent)
  returning id into v_lot;

  insert into public.lot_costs (lot_id, company_id, unit_cost, currency_id) values (v_lot, p_company, v_cost, v_currency);

  insert into public.stock_movements (company_id, product_id, location_id, lot_id, type, qty_delta,
    captured_qty, captured_unit, reason_code, reason_text, document_type, document_id, actor_id)
  values (p_company, p_product, p_location, v_lot, v_type, v_base,
    p_captured_qty, p_captured_unit, p_reason_code, p_reason_text, p_doc_type, p_doc_id, auth.uid())
  returning id into v_move;

  insert into public.movement_costs (movement_id, company_id, unit_cost, currency_id) values (v_move, p_company, v_cost, v_currency);

  return v_lot;
end;
$$;
