select plan(18);

create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;

insert into ctx values
  ('ana', tests.create_user('admin', 'sq-ana@test.dev')),
  ('dan', tests.create_user('admin', 'sq-dan@test.dev'));
insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'Alfa', 'k7m2', (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000b2', 'Beta', 'b2b2', (select v from ctx where k = 'dan'));
insert into company_admins (company_id, admin_id, granted_by) values
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000b2', (select v from ctx where k = 'dan'), (select v from ctx where k = 'dan'));
insert into ctx values
  ('s1', tests.create_user('operator', 'sq-s1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('s2', tests.create_user('operator', 'sq-s2@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('w1', tests.create_user('operator', 'sq-w1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('n1', tests.create_user('operator', 'sq-n1@test.dev', '00000000-0000-0000-0000-0000000000a1'));

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
  ('00000000-0000-0000-0000-0000000000d1', 'request_replenishment', false),
  ('00000000-0000-0000-0000-0000000000d2', 'handle_requests', true);
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

select tests.authenticate_as((select v from ctx where k = 's1'), 'aal2', '00000000-0000-0000-0000-0000000005e1');
insert into ctx values ('r1', public.create_request('00000000-0000-0000-0000-0000000000f1',
  '[{"product_id":"00000000-0000-0000-0000-0000000000e1","qty":2,"unit":"Saco"},{"product_id":"00000000-0000-0000-0000-0000000000e2","qty":5,"unit":"base"}]', 'urge'));
select is((select count(*)::int from solicitud_lineas where request_id = (select v from ctx where k = 'r1')), 2, 'the store creates its request with lines');
select is((select qty_base from solicitud_lineas where product_id = '00000000-0000-0000-0000-0000000000e1'), 200.000, 'quantity converted to base');
select is((select status from solicitud_estado), 'new', 'a request without decisions is new');
select throws_ok($$select public.create_request('00000000-0000-0000-0000-0000000000f2', '[{"product_id":"00000000-0000-0000-0000-0000000000e1","qty":1,"unit":"base"}]')$$, '42501', 'FORBIDDEN', 'cannot create for another store');
select throws_ok($$select public.create_request('00000000-0000-0000-0000-0000000000f1', '[]')$$, 'P0001', 'EMPTY_REQUEST', 'empty request');
select throws_ok($$select public.create_request('00000000-0000-0000-0000-0000000000f1', '[{"product_id":"00000000-0000-0000-0000-0000000000e3","qty":1,"unit":"base"}]')$$, 'P0001', 'PRODUCT_NOT_STORABLE', 'non storable product');
select throws_ok($$select public.create_request('00000000-0000-0000-0000-0000000000f1', '[{"product_id":"00000000-0000-0000-0000-0000000000e1","qty":1,"unit":"Caja"}]')$$, 'P0001', 'INVALID_UNIT', 'unknown unit');
select throws_ok($$insert into solicitudes (company_id, store_id) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f1')$$, '42501', null, 'no direct insert');
select tests.clear_auth();

select is((select count(*)::int from notifications where module = 'requests' and operation = 'created' and recipient_id = (select v from ctx where k = 'w1')), 1, 'warehouse handler is notified');

select tests.authenticate_as((select v from ctx where k = 's2'), 'aal2', '00000000-0000-0000-0000-0000000005e2');
select is((select count(*)::int from solicitudes), 0, 'another store sees nothing');
select tests.authenticate_as((select v from ctx where k = 'n1'), 'aal2', '00000000-0000-0000-0000-0000000005e4');
select is((select count(*)::int from solicitudes), 0, 'a role without requests view sees nothing');
select tests.authenticate_as((select v from ctx where k = 'dan'));
select is((select count(*)::int from solicitudes), 0, 'another company admin sees nothing');
select tests.authenticate_as((select v from ctx where k = 'w1'), 'aal2', '00000000-0000-0000-0000-0000000005e3');
select is((select count(*)::int from solicitud_lineas), 2, 'warehouse handler sees all lines');
select tests.authenticate_as((select v from ctx where k = 'ana'));
select is((select count(*)::int from solicitudes), 1, 'company admin sees the request');
select tests.clear_auth();

insert into solicitud_asignaciones (company_id, line_id, kind, qty_base, reason) 
select company_id, id, 'fulfilled', 120, null from solicitud_lineas where product_id = '00000000-0000-0000-0000-0000000000e1';
select is((select status from solicitud_estado), 'in_progress', 'partial assignment keeps it in progress');
insert into solicitud_asignaciones (company_id, line_id, kind, qty_base)
select company_id, id, 'to_buy', 80 from solicitud_lineas where product_id = '00000000-0000-0000-0000-0000000000e1';
select throws_ok($$insert into solicitud_asignaciones (company_id, line_id, kind, qty_base) select company_id, id, 'pending', 1 from solicitud_lineas where product_id = '00000000-0000-0000-0000-0000000000e1'$$, 'P0001', 'ASSIGNMENT_EXCEEDS_LINE', 'assignments cannot exceed the line');
insert into solicitud_asignaciones (company_id, line_id, kind, qty_base, reason)
select company_id, id, 'rejected', 5, 'sin presupuesto' from solicitud_lineas where product_id = '00000000-0000-0000-0000-0000000000e2';
select is((select status from solicitud_estado), 'to_buy', 'to_buy outranks the rest once all lines are decided');
select is((select qty_base from bolsa_por_comprar), 80.000, 'the buy bag sums to_buy assignments');

select * from finish();
