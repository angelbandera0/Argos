select plan(21);

create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;

insert into ctx values
  ('ana', tests.create_user('admin', 'po-ana@test.dev')),
  ('dan', tests.create_user('admin', 'po-dan@test.dev'));
insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'Alfa', 'k7m2', (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000b2', 'Beta', 'b2b2', (select v from ctx where k = 'dan'));
insert into company_admins (company_id, admin_id, granted_by) values
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000b2', (select v from ctx where k = 'dan'), (select v from ctx where k = 'dan'));
insert into ctx values
  ('s1', tests.create_user('operator', 'po-s1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('s2', tests.create_user('operator', 'po-s2@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('w1', tests.create_user('operator', 'po-w1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('n1', tests.create_user('operator', 'po-n1@test.dev', '00000000-0000-0000-0000-0000000000a1'));

insert into sites (id, company_id, name) values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Norte');
insert into stores (id, company_id, site_id, name) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 1'),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 2');
insert into roles (id, owner_id, name) values
  ('00000000-0000-0000-0000-0000000000d1', (select v from ctx where k = 'ana'), 'Tienda'),
  ('00000000-0000-0000-0000-0000000000d2', (select v from ctx where k = 'ana'), 'Almacen'),
  ('00000000-0000-0000-0000-0000000000d3', (select v from ctx where k = 'ana'), 'Nada');
insert into role_permissions (role_id, module, can_view) values
  ('00000000-0000-0000-0000-0000000000d1', 'requests', true),
  ('00000000-0000-0000-0000-0000000000d2', 'requests', true);
insert into role_special_permissions (role_id, permission, warehouse) values
  ('00000000-0000-0000-0000-0000000000d1', 'make_purchases', false),
  ('00000000-0000-0000-0000-0000000000d1', 'review_orders', true),
  ('00000000-0000-0000-0000-0000000000d2', 'review_orders', true),
  ('00000000-0000-0000-0000-0000000000d2', 'correct_orders', true);
insert into user_stores (user_id, store_id, company_id, role_id) values
  ((select v from ctx where k = 's1'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1'),
  ((select v from ctx where k = 's2'), '00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1'),
  ((select v from ctx where k = 'w1'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d2'),
  ((select v from ctx where k = 'n1'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d3');
insert into app_sessions (session_id, user_id, active_store_id) values
  ('00000000-0000-0000-0000-0000000005e1', (select v from ctx where k = 's1'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005e2', (select v from ctx where k = 's2'), '00000000-0000-0000-0000-0000000000f2'),
  ('00000000-0000-0000-0000-0000000005e3', (select v from ctx where k = 'w1'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005e4', (select v from ctx where k = 'n1'), '00000000-0000-0000-0000-0000000000f1');

insert into categories (id, company_id, name) values ('00000000-0000-0000-0000-0000000000ca', '00000000-0000-0000-0000-0000000000a1', 'Granos');
insert into products (id, company_id, category_id, name) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Arroz'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Frijol'),
  ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Sal');
insert into product_stock_settings (product_id, company_id, storable) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', true),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000a1', true);
insert into product_movement_units (company_id, product_id, name, equivalence) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', 'Saco', 100);


insert into currencies (id, company_id, code, name, symbol) values
  ('00000000-0000-0000-0000-000000000c01', '00000000-0000-0000-0000-0000000000a1', 'MXN', 'Peso', '$');
insert into pedidos (id, company_id, status, currency_id, buyer_id) values
  ('00000000-0000-0000-0000-0000000a0001', '00000000-0000-0000-0000-0000000000a1', 'in_review', '00000000-0000-0000-0000-000000000c01', (select v from ctx where k = 's1')),
  ('00000000-0000-0000-0000-0000000a0002', '00000000-0000-0000-0000-0000000000a1', 'in_review', '00000000-0000-0000-0000-000000000c01', (select v from ctx where k = 's1'));
insert into pedido_lineas (id, company_id, order_id, product_id, dest, qty, unit, content, qty_bought) values
  ('00000000-0000-0000-0000-0000000b0001', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000a0001', '00000000-0000-0000-0000-0000000000e1', 'warehouse', 10, 'Saco', 100, 10),
  ('00000000-0000-0000-0000-0000000b0002', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000a0001', '00000000-0000-0000-0000-0000000000e2', 'direct', 20, 'Caja', 1, 20);
insert into pedido_linea_costos (line_id, company_id, unit_cost) values
  ('00000000-0000-0000-0000-0000000b0001', '00000000-0000-0000-0000-0000000000a1', 50),
  ('00000000-0000-0000-0000-0000000b0002', '00000000-0000-0000-0000-0000000000a1', 3);
insert into pedido_costos (order_id, company_id, amount_given) values
  ('00000000-0000-0000-0000-0000000a0001', '00000000-0000-0000-0000-0000000000a1', 500);

select tests.authenticate_as((select v from ctx where k = 's1'), 'aal2', '00000000-0000-0000-0000-0000000005e1');
select throws_ok($$select public.confirmar_pedido('00000000-0000-0000-0000-0000000a0001')$$, '42501', 'BUYER_CANNOT_REVIEW', 'CA-05: the buyer cannot review');
select tests.authenticate_as((select v from ctx where k = 'n1'), 'aal2', '00000000-0000-0000-0000-0000000005e4');
select throws_ok($$select public.confirmar_pedido('00000000-0000-0000-0000-0000000a0001')$$, '42501', 'FORBIDDEN', 'a user without review_orders is rejected');
select tests.clear_auth();
select is((select count(*)::int from lots where company_id = '00000000-0000-0000-0000-0000000000a1'), 0, 'CA-04: stock does not change before confirming');

select tests.authenticate_as((select v from ctx where k = 'w1'), 'aal2', '00000000-0000-0000-0000-0000000005e3');
select throws_ok($$select public.confirmar_pedido('00000000-0000-0000-0000-0000000a0001')$$, 'P0001', 'REPARTO_REQUIRED', 'M2-D10: direct delivery requires a store split');
select throws_ok($$select public.confirmar_pedido('00000000-0000-0000-0000-0000000a0001', '[{"line_id":"00000000-0000-0000-0000-0000000b0002","qty_received":18,"reparto":[{"store_id":"00000000-0000-0000-0000-0000000000f1","qty":5}]}]')$$, 'P0001', 'REPARTO_MISMATCH', 'the split must add up to the received quantity');
select lives_ok($$select public.confirmar_pedido('00000000-0000-0000-0000-0000000a0001',
  '[{"line_id":"00000000-0000-0000-0000-0000000b0001","qty_received":9},{"line_id":"00000000-0000-0000-0000-0000000b0002","qty_received":18,"reparto":[{"store_id":"00000000-0000-0000-0000-0000000000f1","qty":10},{"store_id":"00000000-0000-0000-0000-0000000000f2","qty":8}]}]')$$, 'the reviewer confirms with a shortage');
select is((select count(*)::int from pedido_costos), 0, 'a role without see_costs sees no order costs');
select throws_ok($$select public.confirmar_pedido('00000000-0000-0000-0000-0000000a0001')$$, 'P0001', 'INVALID_STATUS', 'cannot confirm twice');
select throws_ok($$select public.devolver_pedido('00000000-0000-0000-0000-0000000a0002', ' ')$$, 'P0001', 'NOTE_REQUIRED', 'returning requires a note');
select lives_ok($$select public.devolver_pedido('00000000-0000-0000-0000-0000000a0002', 'faltan cuentas')$$, 'the reviewer returns the order');
select throws_ok($$select public.adjust_pedido('00000000-0000-0000-0000-0000000a0002', 'conteo', '[{"lot_id":"00000000-0000-0000-0000-000000000001","delta":-1}]')$$, 'P0001', 'INVALID_STATUS', 'only fulfilled orders take linked adjustments');
select tests.clear_auth();

select is((select status from pedidos where id = '00000000-0000-0000-0000-0000000a0001'), 'fulfilled', 'the order is fulfilled');
select is((select count(*)::int from pedido_lotes), 3, 'one lot per warehouse line and per store of the split');
select is((select sum(remaining) from lots where product_id = '00000000-0000-0000-0000-0000000000e1'), 900.000, 'only the received quantity enters the stock');
select is((select unit_cost from lot_costs c join pedido_lotes pl on pl.lot_id = c.lot_id where pl.line_id = '00000000-0000-0000-0000-0000000b0001'), 50.000000, 'R-16b: the lot carries the reported unit cost');
select is((select remaining from lots l join locations lc on lc.id = l.location_id where lc.store_id = '00000000-0000-0000-0000-0000000000f2'), 8.000, 'CA-07: each store receives its share');
select is((select spent::text || '/' || shortage_value::text || '/' || status from pedido_costos pc join pedidos p on p.id = pc.order_id), '560.00/56.00/fulfilled', 'R-17: spent and valued shortage are stored');
select is((select count(*)::int from notifications where module = 'orders' and operation = 'fulfilled' and recipient_id = (select v from ctx where k = 's1')) + (select count(*)::int from notifications where operation = 'shortage_detected' and recipient_id = (select v from ctx where k = 'ana')), 2, 'buyer notified of fulfillment and admin of the shortage');

select tests.authenticate_as((select v from ctx where k = 'ana'));
select is((select leftover from pedido_costos), -60.00, 'R-11b: the leftover is stored (negative = exceeded)');
select lives_ok($$select public.adjust_pedido('00000000-0000-0000-0000-0000000a0001', 'conteo erroneo', jsonb_build_array(jsonb_build_object('lot_id', (select lot_id from pedido_lotes where line_id = '00000000-0000-0000-0000-0000000b0001'), 'delta', -1)))$$, 'CA-08: a linked adjustment corrects a fulfilled order');
select is((select count(*)::int from stock_movements m join pedido_ajustes a on a.id = m.document_id where m.document_type = 'pedido_ajuste'), 1, 'the adjustment generates a linked movement');
select tests.clear_auth();

select * from finish();
