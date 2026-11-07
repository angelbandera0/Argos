select plan(9);

create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;

insert into ctx values ('ana', tests.create_user('admin', 'rv-ana@test.dev'));
insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'Alfa', 'k7m3', (select v from ctx where k = 'ana'));
insert into company_admins (company_id, admin_id, granted_by) values
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana'));
insert into ctx values
  ('b1', tests.create_user('operator', 'rv-b1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('y1', tests.create_user('operator', 'rv-y1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('n1', tests.create_user('operator', 'rv-n1@test.dev', '00000000-0000-0000-0000-0000000000a1'));

insert into sites (id, company_id, name) values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Norte');
insert into stores (id, company_id, site_id, name) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 1');
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
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Arroz');
insert into solicitudes (id, company_id, store_id) values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f1');
insert into solicitud_lineas (id, company_id, request_id, product_id, qty, unit, qty_base) values
  ('00000000-0000-0000-0000-0000000000a9', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000e1', 10, 'base', 10);
insert into solicitud_asignaciones (id, company_id, line_id, kind, qty_base) values
  ('00000000-0000-0000-0000-0000000000aa', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a9', 'to_buy', 10);

select tests.authenticate_as((select v from ctx where k = 'ana'), 'aal2');
select is((select count(*)::int from bolsa_por_comprar), 1, 'bag shows the unordered assignment');

select tests.authenticate_as((select v from ctx where k = 'b1'), 'aal2', '00000000-0000-0000-0000-0000000005e1');
insert into ctx values ('o1', public.create_pedido('[
  {"product_id":"00000000-0000-0000-0000-0000000000e1","dest":"store","store_id":"00000000-0000-0000-0000-0000000000f1","qty":10,"unit":"saco","content":1,"assignment_id":"00000000-0000-0000-0000-0000000000aa"}]'));
select public.assign_pedido_buyer((select v from ctx where k = 'o1'), (select v from ctx where k = 'y1'));

select tests.authenticate_as((select v from ctx where k = 'y1'), 'aal2', '00000000-0000-0000-0000-0000000005e2');
select public.register_pedido_purchase((select v from ctx where k = 'o1'),
  jsonb_build_array(jsonb_build_object('line_id', (select id from pedido_lineas where order_id = (select v from ctx where k = 'o1')), 'qty_bought', 10, 'unit_cost', 2)), 50);
select public.submit_pedido_review((select v from ctx where k = 'o1'));
select throws_ok(format($$select public.save_pedido_review('%s', '[]')$$, (select v from ctx where k = 'o1')), '42501', 'FORBIDDEN', 'buyer without review permission');

select tests.authenticate_as((select v from ctx where k = 'ana'), 'aal2');
select is((select count(*)::int from bolsa_por_comprar), 0, 'bag hides assignments already ordered');

select tests.authenticate_as((select v from ctx where k = 'n1'), 'aal2', '00000000-0000-0000-0000-0000000005e3');
select throws_ok(format($$select public.save_pedido_review('%s', '[]')$$, (select v from ctx where k = 'o1')), '42501', 'FORBIDDEN', 'needs review_orders');

select tests.authenticate_as((select v from ctx where k = 'b1'), 'aal2', '00000000-0000-0000-0000-0000000005e1');
select throws_ok(format($$select public.save_pedido_review('%s', '[{"line_id":"%s","qty_received":-1}]')$$, (select v from ctx where k = 'o1'), (select id from pedido_lineas where order_id = (select v from ctx where k = 'o1'))), 'P0001', 'INVALID_QUANTITY', 'negative quantity');
select throws_ok(format($$select public.save_pedido_review('%s', '[{"line_id":"00000000-0000-0000-0000-000000000999","qty_received":1}]')$$, (select v from ctx where k = 'o1')), 'P0001', 'LINE_NOT_IN_ORDER', 'foreign line');
select lives_ok(format($$select public.save_pedido_review('%s', '[{"line_id":"%s","qty_received":8}]')$$, (select v from ctx where k = 'o1'), (select id from pedido_lineas where order_id = (select v from ctx where k = 'o1'))), 'partial review saved');
select is((select qty_received from pedido_lineas where order_id = (select v from ctx where k = 'o1')), 8.000, 'received quantity stored');
select is((select status from pedidos where id = (select v from ctx where k = 'o1')), 'in_review', 'order still in review');

select tests.clear_auth();
select finish();
