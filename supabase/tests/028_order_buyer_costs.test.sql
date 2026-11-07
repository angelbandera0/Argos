select plan(5);

create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;

insert into ctx values ('ana', tests.create_user('admin', 'bc-ana@test.dev'));
insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'Alfa', 'k7m3', (select v from ctx where k = 'ana'));
insert into company_admins (company_id, admin_id, granted_by) values
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana'));
insert into ctx values
  ('b1', tests.create_user('operator', 'bc-b1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('y1', tests.create_user('operator', 'bc-y1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('n1', tests.create_user('operator', 'bc-n1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('y2', tests.create_user('operator', 'bc-y2@test.dev', '00000000-0000-0000-0000-0000000000a1'));

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
  ((select v from ctx where k = 'n1'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d3'),
  ((select v from ctx where k = 'y2'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d2');
insert into app_sessions (session_id, user_id, active_store_id) values
  ('00000000-0000-0000-0000-0000000005e1', (select v from ctx where k = 'b1'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005e2', (select v from ctx where k = 'y1'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005e3', (select v from ctx where k = 'n1'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005e4', (select v from ctx where k = 'y2'), '00000000-0000-0000-0000-0000000000f1');

insert into categories (id, company_id, name) values ('00000000-0000-0000-0000-0000000000ca', '00000000-0000-0000-0000-0000000000a1', 'Granos');
insert into products (id, company_id, category_id, name) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Arroz'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Frijol');
insert into solicitudes (id, company_id, store_id) values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f1');
insert into solicitud_lineas (id, company_id, request_id, product_id, qty, unit, qty_base) values
  ('00000000-0000-0000-0000-0000000000a9', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000e1', 10, 'base', 10);
insert into solicitud_lineas (id, company_id, request_id, product_id, qty, unit, qty_base) values
  ('00000000-0000-0000-0000-0000000000a8', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000e2', 5, 'base', 5);
insert into solicitud_asignaciones (id, company_id, line_id, kind, qty_base) values
  ('00000000-0000-0000-0000-0000000000ab', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a8', 'to_buy', 5),
  ('00000000-0000-0000-0000-0000000000aa', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a9', 'to_buy', 10);


select tests.authenticate_as((select v from ctx where k = 'b1'), 'aal2', '00000000-0000-0000-0000-0000000005e1');
insert into ctx values ('o1', public.create_pedido('[
  {"product_id":"00000000-0000-0000-0000-0000000000e1","dest":"store","store_id":"00000000-0000-0000-0000-0000000000f1","qty":10,"unit":"saco","content":1,"assignment_id":"00000000-0000-0000-0000-0000000000aa"}]'));
insert into ctx values ('o2', public.create_pedido('[
  {"product_id":"00000000-0000-0000-0000-0000000000e2","dest":"store","store_id":"00000000-0000-0000-0000-0000000000f1","qty":5,"unit":"saco","content":1,"assignment_id":"00000000-0000-0000-0000-0000000000ab"}]'));
select public.assign_pedido_buyer((select v from ctx where k = 'o1'), (select v from ctx where k = 'y1'));
select public.assign_pedido_buyer((select v from ctx where k = 'o2'), (select v from ctx where k = 'y2'));

select tests.authenticate_as((select v from ctx where k = 'y1'), 'aal2', '00000000-0000-0000-0000-0000000005e2');
select public.register_pedido_purchase((select v from ctx where k = 'o1'),
  jsonb_build_array(jsonb_build_object('line_id', (select id from pedido_lineas where order_id = (select v from ctx where k = 'o1')), 'qty_bought', 10, 'unit_cost', 2)), 50);
select tests.authenticate_as((select v from ctx where k = 'y2'), 'aal2', '00000000-0000-0000-0000-0000000005e4');
select public.register_pedido_purchase((select v from ctx where k = 'o2'),
  jsonb_build_array(jsonb_build_object('line_id', (select id from pedido_lineas where order_id = (select v from ctx where k = 'o2')), 'qty_bought', 5, 'unit_cost', 3)), 20);

select tests.authenticate_as((select v from ctx where k = 'y1'), 'aal2', '00000000-0000-0000-0000-0000000005e2');
select is((select array_agg(order_id) from pedido_costos), array[(select v from ctx where k = 'o1')], 'buyer reads only the costs of their own order');
select is((select count(*)::int from pedido_linea_costos), 1, 'buyer reads only the line costs of their own order');
select is((select count(*)::int from pedido_costos where order_id = (select v from ctx where k = 'o2')), 0, 'no costs of another buyer order');
select is((select count(*)::int from lot_costs), 0, 'buyer without see_costs reads no lot costs');

select tests.authenticate_as((select v from ctx where k = 'n1'), 'aal2', '00000000-0000-0000-0000-0000000005e3');
select is((select count(*)::int from pedido_costos), 0, 'non-buyer without see_costs reads no order costs');

select tests.clear_auth();
select * from finish();
