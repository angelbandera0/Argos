select plan(15);

create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;

insert into ctx values
  ('ana', tests.create_user('admin', 'fp-ana@test.dev'));
insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'Alfa', 'k7m3', (select v from ctx where k = 'ana'));
insert into company_admins (company_id, admin_id, granted_by) values
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana'));
insert into ctx values
  ('b1', tests.create_user('operator', 'fp-b1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('y1', tests.create_user('operator', 'fp-y1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('n1', tests.create_user('operator', 'fp-n1@test.dev', '00000000-0000-0000-0000-0000000000a1'));

insert into sites (id, company_id, name) values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Norte');
insert into stores (id, company_id, site_id, name) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 1'),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 2');
insert into roles (id, owner_id, name) values
  ('00000000-0000-0000-0000-0000000000d1', (select v from ctx where k = 'ana'), 'Armador'),
  ('00000000-0000-0000-0000-0000000000d2', (select v from ctx where k = 'ana'), 'Comprador'),
  ('00000000-0000-0000-0000-0000000000d3', (select v from ctx where k = 'ana'), 'Nada');
insert into role_permissions (role_id, module, can_view) values
  ('00000000-0000-0000-0000-0000000000d1', 'orders', true),
  ('00000000-0000-0000-0000-0000000000d2', 'orders', true);
insert into role_special_permissions (role_id, permission, warehouse) values
  ('00000000-0000-0000-0000-0000000000d1', 'build_orders', true),
  ('00000000-0000-0000-0000-0000000000d1', 'review_orders', true),
  ('00000000-0000-0000-0000-0000000000d2', 'make_purchases', false);
insert into user_stores (user_id, store_id, company_id, role_id) values
  ((select v from ctx where k = 'b1'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1'),
  ((select v from ctx where k = 'y1'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d2'),
  ((select v from ctx where k = 'n1'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d3');
insert into app_sessions (session_id, user_id, active_store_id) values
  ('00000000-0000-0000-0000-0000000005e1', (select v from ctx where k = 'b1'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005e2', (select v from ctx where k = 'y1'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005e3', (select v from ctx where k = 'n1'), '00000000-0000-0000-0000-0000000000f1');

insert into categories (id, company_id, name) values ('00000000-0000-0000-0000-0000000000ca', '00000000-0000-0000-0000-0000000000a1', 'Granos');
insert into products (id, company_id, category_id, name) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Arroz'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Frijol');
insert into solicitudes (id, company_id, store_id) values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f1');
insert into solicitud_lineas (id, company_id, request_id, product_id, qty, unit, qty_base) values
  ('00000000-0000-0000-0000-0000000000a9', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000e1', 10, 'base', 10);
insert into solicitud_asignaciones (id, company_id, line_id, kind, qty_base) values
  ('00000000-0000-0000-0000-0000000000aa', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a9', 'to_buy', 10);

select tests.authenticate_as((select v from ctx where k = 'n1'), 'aal2', '00000000-0000-0000-0000-0000000005e3');
select throws_ok($$select public.create_pedido('[{"product_id":"00000000-0000-0000-0000-0000000000e1","dest":"warehouse","qty":5,"unit":"saco","content":100}]')$$, '42501', 'FORBIDDEN', 'needs build_orders');

select tests.authenticate_as((select v from ctx where k = 'b1'), 'aal2', '00000000-0000-0000-0000-0000000005e1');
insert into ctx values ('o1', public.create_pedido('[
  {"product_id":"00000000-0000-0000-0000-0000000000e1","dest":"direct","qty":10,"unit":"saco","content":100,"assignment_id":"00000000-0000-0000-0000-0000000000aa",
   "plan":[{"store_id":"00000000-0000-0000-0000-0000000000f1","qty":6},{"store_id":"00000000-0000-0000-0000-0000000000f2","qty":4}]},
  {"product_id":"00000000-0000-0000-0000-0000000000e2","dest":"store","store_id":"00000000-0000-0000-0000-0000000000f2","qty":3,"unit":"kg","content":1}]'));
select is((select count(*)::int from pedido_lineas where order_id = (select v from ctx where k = 'o1')), 2, 'order with 2 lines');
select is((select count(*)::int from pedido_linea_tiendas where kind = 'plan'), 2, 'per-store breakdown saved');
select throws_ok($$select public.create_pedido('[{"product_id":"00000000-0000-0000-0000-0000000000e1","dest":"warehouse","qty":5,"unit":"saco","content":100,"assignment_id":"00000000-0000-0000-0000-0000000000aa"}]')$$, 'P0001', 'ASSIGNMENT_ALREADY_ORDERED', 'bag line used once');
select throws_ok($$select public.create_pedido('[{"product_id":"00000000-0000-0000-0000-0000000000e1","dest":"direct","qty":5,"unit":"saco","content":100,"plan":[{"store_id":"00000000-0000-0000-0000-0000000000f1","qty":2}]}]')$$, 'P0001', 'PLAN_MISMATCH', 'plan must add up');
select throws_ok(format($$select public.assign_pedido_buyer('%s', '%s')$$, (select v from ctx where k = 'o1'), (select v from ctx where k = 'n1')), 'P0001', 'BUYER_NOT_ELIGIBLE', 'buyer needs make_purchases');
select lives_ok(format($$select public.assign_pedido_buyer('%s', '%s')$$, (select v from ctx where k = 'o1'), (select v from ctx where k = 'y1')), 'eligible buyer assigned');
select tests.clear_auth();
select is((select count(*)::int from notifications where operation = 'assigned' and recipient_id = (select v from ctx where k = 'y1')), 1, 'buyer notified');

select tests.authenticate_as((select v from ctx where k = 'n1'), 'aal2', '00000000-0000-0000-0000-0000000005e3');
select throws_ok(format($$select public.register_pedido_purchase('%s', '[]')$$, (select v from ctx where k = 'o1')), '42501', 'FORBIDDEN', 'only the buyer registers');
select tests.authenticate_as((select v from ctx where k = 'y1'), 'aal2', '00000000-0000-0000-0000-0000000005e2');
select throws_ok(format($$select public.submit_pedido_review('%s')$$, (select v from ctx where k = 'o1')), 'P0001', 'PURCHASE_INCOMPLETE', 'cannot submit without purchase');
select lives_ok(format($$select public.register_pedido_purchase('%s', jsonb_build_array(
  jsonb_build_object('line_id', (select id from pedido_lineas where order_id = '%s' and dest = 'direct'), 'qty_bought', 9, 'unit_cost', 10),
  jsonb_build_object('line_id', (select id from pedido_lineas where order_id = '%s' and dest = 'store'), 'qty_bought', 3, 'unit_cost', 5)), 200)$$,
  (select v from ctx where k = 'o1'), (select v from ctx where k = 'o1'), (select v from ctx where k = 'o1')), 'purchase registered');
select is((select count(*)::int from pedido_linea_costos), 2, 'buyer reads the costs of own order (order_buyer_costs)');
select is(public.submit_pedido_review((select v from ctx where k = 'o1')), '{"given": 200.00, "spent": 105.00, "leftover": 95.00}'::jsonb, 'comparison given/spent/leftover');
select tests.clear_auth();
select is((select status from pedidos where id = (select v from ctx where k = 'o1')), 'in_review', 'order in review');
select ok((select count(*) from notifications where operation = 'submitted_for_review') >= 2, 'reviewers notified');

select finish();
