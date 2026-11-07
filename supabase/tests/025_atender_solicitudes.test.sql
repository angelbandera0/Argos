select plan(12);

create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;

insert into ctx values
  ('ana', tests.create_user('admin', 'at-ana@test.dev')),
  ('dan', tests.create_user('admin', 'at-dan@test.dev'));
insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'Alfa', 'k7m3', (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000b2', 'Beta', 'b2b3', (select v from ctx where k = 'dan'));
insert into company_admins (company_id, admin_id, granted_by) values
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000b2', (select v from ctx where k = 'dan'), (select v from ctx where k = 'dan'));
insert into ctx values
  ('s1', tests.create_user('operator', 'at-s1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('s2', tests.create_user('operator', 'at-s2@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('w1', tests.create_user('operator', 'at-w1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('n1', tests.create_user('operator', 'at-n1@test.dev', '00000000-0000-0000-0000-0000000000a1'));

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
  ('00000000-0000-0000-0000-0000000000d2', 'handle_requests', true),
  ('00000000-0000-0000-0000-0000000000d2', 'transfer', true);
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

insert into ctx values ('r1', '00000000-0000-0000-0000-0000000000b1');
insert into solicitudes (id, company_id, store_id) values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f1');
insert into solicitud_lineas (id, company_id, request_id, product_id, qty, unit, qty_base) values
  ('00000000-0000-0000-0000-0000000000a9', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000e1', 10, 'base', 10),
  ('00000000-0000-0000-0000-0000000000a8', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000e2', 5, 'base', 5);
select app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1',
  (select id from locations where kind = 'warehouse' and company_id = '00000000-0000-0000-0000-0000000000a1'), 'initial_entry', null, 6, 'lb', 1, null, null, current_date);

select tests.authenticate_as((select v from ctx where k = 's1'), 'aal2', '00000000-0000-0000-0000-0000000005e1');
select throws_ok($$select public.attend_request_line('00000000-0000-0000-0000-0000000000a9', 'to_buy', 1)$$, '42501', 'FORBIDDEN', 'a store user cannot attend');
select tests.authenticate_as((select v from ctx where k = 'w1'), 'aal2', '00000000-0000-0000-0000-0000000005e3');
select ok(public.attend_request_line('00000000-0000-0000-0000-0000000000a9', 'fulfilled', 6) is not null, 'partial transfer of what is available');
select tests.clear_auth();
select is((select sum(remaining) from lots l join locations lc on lc.id = l.location_id where lc.store_id = '00000000-0000-0000-0000-0000000000f1'), 6.000, 'the store receives the stock');
select is((select count(*)::int from stock_movements where document_type = 'solicitud_asignacion' and document_id in (select id from solicitud_asignaciones)), 2, 'movements reference the assignment');
select tests.authenticate_as((select v from ctx where k = 'w1'), 'aal2', '00000000-0000-0000-0000-0000000005e3');
select is((select status from solicitud_linea_estado where line_id = '00000000-0000-0000-0000-0000000000a9'), 'in_progress', 'line in progress');
select ok(public.attend_request_line('00000000-0000-0000-0000-0000000000a9', 'to_buy', 4) is not null, 'the rest goes to buy');
select is((select qty_base from bolsa_por_comprar), 4.000, 'bag shows pending purchase');
select throws_ok($$select public.attend_request_line('00000000-0000-0000-0000-0000000000a9', 'pending', 1)$$, 'P0001', 'ASSIGNMENT_EXCEEDS_LINE', 'cannot exceed the line');
select throws_ok($$select public.attend_request_line('00000000-0000-0000-0000-0000000000a8', 'rejected', 5)$$, 'P0001', 'REASON_REQUIRED', 'reject needs a reason');
select ok(public.attend_request_line('00000000-0000-0000-0000-0000000000a8', 'rejected', 5, 'sin presupuesto') is not null, 'reject with reason');
select tests.clear_auth();
select is((select count(*)::int from notifications where module = 'requests' and operation in ('handled', 'rejected') and recipient_id = (select v from ctx where k = 's1')), 3, 'the store is notified');
select is((select status from solicitud_estado), 'to_buy', 'derived request status');

select finish();
