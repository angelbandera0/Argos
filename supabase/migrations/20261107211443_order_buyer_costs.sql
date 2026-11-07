-- The assigned buyer reads the purchase costs of their own order (never lot costs or other orders').
drop policy pedido_costos_select on public.pedido_costos;
create policy pedido_costos_select on public.pedido_costos for select to authenticated using (
  app.is_company_admin(company_id)
  or (app.has_special('see_costs') and company_id = (select app.operator_company()))
  or exists (select 1 from public.pedidos o where o.id = order_id and o.buyer_id = (select auth.uid()))
);
drop policy pedido_linea_costos_select on public.pedido_linea_costos;
create policy pedido_linea_costos_select on public.pedido_linea_costos for select to authenticated using (
  app.is_company_admin(company_id)
  or (app.has_special('see_costs') and company_id = (select app.operator_company()))
  or exists (select 1 from public.pedido_lineas l join public.pedidos o on o.id = l.order_id where l.id = line_id and o.buyer_id = (select auth.uid()))
);
