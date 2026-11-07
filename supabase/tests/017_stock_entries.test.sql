select plan(29);

create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;

insert into ctx values
  ('ana', tests.create_user('admin', 'ana@test.dev')),
  ('dan', tests.create_user('admin', 'dan@test.dev'));

insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'Alfa', 'k7m2', (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000b2', 'Beta', 'b2b2', (select v from ctx where k = 'dan'));
insert into company_admins (company_id, admin_id, granted_by) values
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000b2', (select v from ctx where k = 'dan'), (select v from ctx where k = 'dan'));

insert into ctx values
  ('w1', tests.create_user('operator', 'alm1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('w2', tests.create_user('operator', 'alm2@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('w3', tests.create_user('operator', 'alm3@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('w4', tests.create_user('operator', 'tnd4@test.dev', '00000000-0000-0000-0000-0000000000a1'));

insert into sites (id, company_id, name) values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Norte');
insert into stores (id, company_id, site_id, name) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 1'),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 2');

insert into roles (id, owner_id, name) values
  ('00000000-0000-0000-0000-0000000000d1', (select v from ctx where k = 'ana'), 'Almacen'),
  ('00000000-0000-0000-0000-0000000000d2', (select v from ctx where k = 'ana'), 'SinFlag'),
  ('00000000-0000-0000-0000-0000000000d3', (select v from ctx where k = 'ana'), 'AlmacenCostos'),
  ('00000000-0000-0000-0000-0000000000d4', (select v from ctx where k = 'ana'), 'Tienda');
insert into role_permissions (role_id, module, can_view) values
  ('00000000-0000-0000-0000-0000000000d1', 'stock', true),
  ('00000000-0000-0000-0000-0000000000d2', 'stock', true),
  ('00000000-0000-0000-0000-0000000000d3', 'stock', true),
  ('00000000-0000-0000-0000-0000000000d4', 'stock', true);
insert into role_special_permissions (role_id, permission, warehouse) values
  ('00000000-0000-0000-0000-0000000000d1', 'initial_entry', true),
  ('00000000-0000-0000-0000-0000000000d2', 'initial_entry', false),
  ('00000000-0000-0000-0000-0000000000d3', 'initial_entry', true),
  ('00000000-0000-0000-0000-0000000000d3', 'see_costs', false),
  ('00000000-0000-0000-0000-0000000000d4', 'direct_store_entry', false);

insert into user_stores (user_id, store_id, company_id, role_id) values
  ((select v from ctx where k = 'w1'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1'),
  ((select v from ctx where k = 'w2'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d2'),
  ((select v from ctx where k = 'w3'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d3'),
  ((select v from ctx where k = 'w4'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d4');
insert into app_sessions (session_id, user_id, active_store_id) values
  ('00000000-0000-0000-0000-0000000005a1', (select v from ctx where k = 'w1'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005a2', (select v from ctx where k = 'w2'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005a3', (select v from ctx where k = 'w3'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005a4', (select v from ctx where k = 'w4'), '00000000-0000-0000-0000-0000000000f1');

insert into categories (id, company_id, name) values ('00000000-0000-0000-0000-0000000000ca', '00000000-0000-0000-0000-0000000000a1', 'Granos');
insert into products (id, company_id, category_id, name) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Arroz'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Frijol');
insert into product_stock_settings (product_id, company_id, storable) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', true),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000a1', false);
insert into currencies (id, company_id, code, name, symbol, active) values
  ('00000000-0000-0000-0000-0000000000a7', '00000000-0000-0000-0000-0000000000a1', 'DOP', 'Peso', 'RD$', true);

insert into ctx select 'lw', id from locations where company_id = '00000000-0000-0000-0000-0000000000a1' and kind = 'warehouse';
insert into ctx select 'l1', id from locations where store_id = '00000000-0000-0000-0000-0000000000f1';
insert into ctx select 'l2', id from locations where store_id = '00000000-0000-0000-0000-0000000000f2';
insert into ctx select 'lb', id from locations where company_id = '00000000-0000-0000-0000-0000000000b2' and kind = 'warehouse';

select tests.authenticate_as((select v from ctx where k = 'ana'));
insert into ctx values ('i1', public.register_initial_entry('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 5, 'Saco 25 lb', 25, 12, '00000000-0000-0000-0000-0000000000a7'));
insert into ctx values ('i2', public.register_initial_entry('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 3, 'lb', 1));
insert into ctx values ('i3', public.register_direct_entry('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'l1'), 4, 'lb', 1, 2, '00000000-0000-0000-0000-0000000000a7'));
select is((select remaining from lots where id = (select v from ctx where k = 'i1')), 125.000, 'CA-01: 5 sacks of 25 lb give 125 lb remaining');
select is((select unit_cost from lot_costs where lot_id = (select v from ctx where k = 'i1')), 12.000000, 'the cost is stored per base unit');
select is((select count(*)::int from stock_movements where lot_id = (select v from ctx where k = 'i1') and type = 'initial_entry'), 1, 'one initial_entry movement');
select is((select count(*)::int from movement_costs c join stock_movements m on m.id = c.movement_id where m.lot_id = (select v from ctx where k = 'i1')), 1, 'one movement cost');
select is((select unit_cost from lot_costs where lot_id = (select v from ctx where k = 'i2')), null, 'no cost means unknown cost');
select is((select count(*)::int from notifications where actor_id = (select v from ctx where k = 'ana')), 0, 'an admin entry notifies nobody');
select throws_ok($$select public.register_initial_entry('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'l1'), 1, 'lb', 1)$$, 'P0001', 'NOT_WAREHOUSE', 'initial entry only on the warehouse');
select throws_ok($$select public.register_direct_entry('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 1, 'lb', 1)$$, 'P0001', 'NOT_STORE', 'direct entry only on a store');
select throws_ok($$select public.register_initial_entry('00000000-0000-0000-0000-0000000000e2', (select v from ctx where k = 'lw'), 1, 'lb', 1)$$, 'P0001', 'PRODUCT_NOT_STORABLE', 'a non-storable product is rejected');
select throws_ok($$select public.register_initial_entry('00000000-0000-0000-0000-0000000000e1', gen_random_uuid(), 1, 'lb', 1)$$, 'P0001', 'LOCATION_NOT_FOUND', 'unknown location');
select throws_ok($$select public.register_initial_entry('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lb'), 1, 'lb', 1)$$, '42501', 'FORBIDDEN', 'an admin cannot enter into another company');

select tests.authenticate_as((select v from ctx where k = 'w1'), 'aal1', '00000000-0000-0000-0000-0000000005a1');
select throws_ok($$select public.register_initial_entry('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 1, 'lb', 1, 5, '00000000-0000-0000-0000-0000000000a7')$$, '42501', 'COST_NOT_ALLOWED', 'a warehouse keeper cannot send a cost');
select lives_ok($$select public.register_initial_entry('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 2, 'lb', 1)$$, 'a warehouse keeper can enter without cost');
select throws_ok($$select public.register_direct_entry('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'l1'), 1, 'lb', 1)$$, '42501', 'FORBIDDEN', 'initial_entry does not allow direct store entry');
select tests.authenticate_as((select v from ctx where k = 'w2'), 'aal1', '00000000-0000-0000-0000-0000000005a2');
select throws_ok($$select public.register_initial_entry('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 1, 'lb', 1)$$, '42501', 'FORBIDDEN', 'without the warehouse flag it is forbidden');
select throws_ok($$select app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 'initial_entry', null, 1, 'lb', 1, null, null, current_date)$$, '42501', null, 'the internal function is not callable');
select tests.authenticate_as((select v from ctx where k = 'w3'), 'aal1', '00000000-0000-0000-0000-0000000005a3');
select lives_ok($$select public.register_initial_entry('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 1, 'lb', 1, 7.5, '00000000-0000-0000-0000-0000000000a7')$$, 'with see_costs a cost can be sent');
select tests.authenticate_as((select v from ctx where k = 'w4'), 'aal1', '00000000-0000-0000-0000-0000000005a4');
select lives_ok($$select public.register_direct_entry('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'l1'), 6, 'lb', 1)$$, 'direct entry in own store');
select throws_ok($$select public.register_direct_entry('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'l2'), 1, 'lb', 1)$$, '42501', 'FORBIDDEN', 'direct entry in another store is forbidden');
select throws_ok($$select public.register_initial_entry('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 1, 'lb', 1)$$, '42501', 'FORBIDDEN', 'a store role cannot enter initial stock');
select throws_ok($$select public.register_direct_entry('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'l1'), 1, 'lb', 1, 3, '00000000-0000-0000-0000-0000000000a7')$$, '42501', 'COST_NOT_ALLOWED', 'direct entry cost needs see_costs');
select tests.clear_auth();

select is((select count(*)::int from notifications where recipient_id = (select v from ctx where k = 'ana') and module = 'stock' and operation = 'initial_entry'), 2, 'the admin gets one notification per keeper entry');
select is((select count(*)::int from notifications where actor_id in (select v from ctx where k in ('w1', 'w3')) and recipient_id in (select v from ctx where k in ('w1', 'w3'))), 0, 'the actor is not notified');
select is((select count(*)::int from notifications where company_id = '00000000-0000-0000-0000-0000000000a1' and (title || body) ~ '(7[.,]5|12)'), 0, 'notifications carry no costs');
select is((select lc.unit_cost from lots l join lot_costs lc on lc.lot_id = l.id where l.created_by = (select v from ctx where k = 'w3')), 7.500000, 'the see_costs cost is stored');
select is((select count(*)::int from lots where company_id = '00000000-0000-0000-0000-0000000000a1' and (created_by is null)) + (select count(*)::int from stock_movements where company_id = '00000000-0000-0000-0000-0000000000a1' and actor_id is null), 0, 'the ledger records the actor');
select is((select quantity from stock_levels where product_id = '00000000-0000-0000-0000-0000000000e1' and location_id = (select v from ctx where k = 'lw')), 131.000, 'stock_levels sums the warehouse');
select is((select quantity from stock_levels where product_id = '00000000-0000-0000-0000-0000000000e1' and location_id = (select v from ctx where k = 'l1')), 10.000, 'stock_levels sums the store');
select throws_ok($$update stock_movements set qty_delta = 1 where lot_id = (select v from ctx where k = 'i1')$$, '42501', 'MOVEMENT_IMMUTABLE', 'movements stay immutable');

select * from finish();
